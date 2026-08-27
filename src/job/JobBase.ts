import { SystemError } from '../error'
import { Logger } from '../logger'
import { UUIDs } from '../utils'

import { Job } from './job'
import { JobContext } from './jobContext'
import { JobEvent, JobEventType } from './jobEvent'
import { JobSerialized } from './jobSerialized'
import { JobStatus } from './status'

export interface JobConstructor {
  new <C extends JobContext, R>(context: C, innerJobs?: JobBase<any>[]): JobBase<C, R>
  readonly prototype: JobBase<any, any>
}

const PROGRESS_NOTIFICATION_THROTTLE_MILLIS = 1000

/**
 * Asynchronous task handler.
 *
 * Status workflow:
 * - pending
 * - running
 * - (end)
 * -- succeeded
 * -- failed
 * -- canceled
 *
 * Methods that can be overwritten by subclasses:
 * - shouldExecute (in tx)
 * - onStart (in tx)
 * - execute (in tx)
 * - beforeSuccess (in tx)
 * - generateResult (in tx)
 * - beforeEnd (in tx)
 * - onEnd (out of tx)
 * - getErrorInfo
 */
export abstract class JobBase<C extends JobContext, R = undefined> implements Job<R> {
  static readonly keysContext = {
    surveyId: 'surveyId',
    survey: 'survey',
    user: 'user',
  }

  readonly uuid: string
  readonly type: string
  status: JobStatus = JobStatus.pending
  startTime?: Date
  endTime?: Date
  total: number
  result: R | undefined = undefined
  errors: Record<string, any> = {}
  canceledByAdmin?: boolean

  protected logger: Logger
  protected context: C
  protected innerJobs: JobBase<C, any>[]
  protected currentInnerJobIndex = -1

  private _processed = 0
  private eventListener: ((event: JobEvent) => void) | undefined = undefined
  private progressThrottleTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined
  private progressThrottleLastRunTime = 0
  private _stopOnInnerJobFailure = true

  public constructor(context: C, innerJobs: JobBase<C, any>[] = []) {
    this.context = { ...context }
    this.innerJobs = innerJobs

    this.uuid = UUIDs.v4()
    this.type = this.context.type ?? this.constructor.name
    this.total = innerJobs.length > 0 ? innerJobs.length : 1

    // Created last, so that createLogger() overrides can safely build the logger name out of
    // the job identity (e.g. arena's `Job <ClassName> (<uuid>)` log correlation id).
    this.logger = this.createLogger()
  }

  get processed(): number {
    return this._processed
  }

  set processed(value: number) {
    this._processed = value
    this.notifyProgress()
  }

  get stopOnInnerJobFailure(): boolean {
    return this._stopOnInnerJobFailure
  }

  set stopOnInnerJobFailure(value: boolean) {
    this._stopOnInnerJobFailure = value
  }

  protected get surveyId(): number | null {
    return this.getContextProp(JobBase.keysContext.surveyId)
  }

  protected get user(): any {
    return this.getContextProp(JobBase.keysContext.user)
  }

  protected get userUuid(): string | undefined {
    return this.user?.uuid
  }

  protected get contextSurvey(): any {
    return this.getContextProp(JobBase.keysContext.survey)
  }

  protected getContextProp<T = any>(prop: string, defaultValue: T | null = null): T | null {
    const value = (this.context as any)[prop]
    return value ?? defaultValue
  }

  protected setContext(context: Partial<C>): void {
    Object.assign(this.context, context)
  }

  protected deleteContextProps(...propNames: string[]): void {
    propNames.forEach((propName) => {
      delete (this.context as any)[propName]
    })
  }

  /**
   * Registers the listener notified of job events (status changes and progress).
   * Only one listener can be registered at a time; registering a new one replaces the previous one.
   */
  onEvent(listener: (event: JobEvent) => void): this {
    this.eventListener = listener
    return this
  }

  isPending(): boolean {
    return this.status === JobStatus.pending
  }

  isRunning(): boolean {
    return this.status === JobStatus.running
  }

  isSucceeded(): boolean {
    return this.status === JobStatus.succeeded
  }

  isFailed(): boolean {
    return this.status === JobStatus.failed
  }

  isCanceled(): boolean {
    return this.status === JobStatus.canceled
  }

  isEnded(): boolean {
    return [JobStatus.succeeded, JobStatus.failed, JobStatus.canceled].includes(this.status)
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0
  }

  protected getCurrentInnerJob(): JobBase<C, any> | undefined {
    return this.innerJobs[this.currentInnerJobIndex]
  }

  protected combineInnerJobsResults(): Record<string, any> {
    const results: Record<string, any> = {}
    this.innerJobs.forEach((innerJob) => Object.assign(results, innerJob.result ?? {}))
    return results
  }

  protected combineInnerJobsErrors(): Record<string, any> {
    const errors: Record<string, any> = {}
    this.innerJobs.forEach((innerJob) => Object.assign(errors, innerJob.errors ?? {}))
    return errors
  }

  async cancel(options: { canceledByAdmin?: boolean } = {}): Promise<void> {
    const { canceledByAdmin = false } = options
    const currentInnerJob = this.getCurrentInnerJob()
    if (currentInnerJob) {
      if (currentInnerJob.isRunning()) {
        await currentInnerJob.cancel({ canceledByAdmin })
      }
    } else {
      this.canceledByAdmin = canceledByAdmin
      // Cleanup must happen here: executeInTransaction()'s finally block skips beforeEnd() when
      // the job is canceled, so this is the only chance subclasses get to release the resources
      // (temp files/directories, streams) they allocated before the cancellation.
      await this.beforeEnd()
      await this.setStatus(JobStatus.canceled)
    }
  }

  async start(client: any = null): Promise<void> {
    this.logDebug('start')

    try {
      if (client) {
        await client.tx(async (tx: any) => {
          this.context.tx = tx
          await this.executeInTransaction()
        })
      } else {
        await this.executeInTransaction()
      }
      if (this.isRunning()) {
        await this.setStatus(JobStatus.succeeded)
      }
    } catch (error: any) {
      if (!this.isFailed() && (this.isRunning() || this.isSucceeded())) {
        this.logError(error.stack ?? error)
        const { key, params } = this.getErrorInfo(error)
        this.addError({ error: { valid: false, errors: [{ key, params }] } })
        await this.setStatus(JobStatus.failed)
      }
    } finally {
      this.context.tx = undefined
    }
  }

  private async executeInTransaction(): Promise<void> {
    try {
      await this.onStart()

      const shouldExecute = await this.shouldExecute()
      if (shouldExecute) {
        if (this.innerJobs.length > 0) {
          await this.executeJobs()
        } else {
          await this.execute()
        }
        if (this.isRunning()) {
          await this.beforeSuccess()
        }
      }
    } finally {
      if (!this.isCanceled()) {
        await this.beforeEnd()
      }
      this.context.tx = undefined
    }

    if (!this.isRunning()) {
      this.throwError('jobCanceledOrErrorsFound')
    }
  }

  /**
   * Generates a plain JSON-serializable representation of the job, including its inner jobs.
   */
  toJSON(): JobSerialized<R> {
    const { errors, processed, result, status, total, type, userUuid, uuid } = this

    return {
      uuid,
      type,
      userUuid,
      surveyId: this.surveyId,
      innerJobs: this.innerJobs.map((job) => job.toJSON()),
      currentInnerJobIndex: this.currentInnerJobIndex,

      status,
      pending: this.isPending(),
      running: this.isRunning(),
      succeeded: this.isSucceeded(),
      canceled: this.isCanceled(),
      failed: this.isFailed(),
      ended: this.isEnded(),

      total,
      processed,
      progressPercent: this.calculateProgressPercent(),
      elapsedMillis: this.calculateElapsedMillis(),

      errors: this.isFailed() ? errors : undefined,
      result: this.isSucceeded() ? result : undefined,
    }
  }

  private async executeJobs(): Promise<void> {
    this.logDebug(`- ${this.total} inner jobs found`)

    for (let i = 0; i < this.innerJobs.length; i++) {
      this.logDebug(`- executing inner job ${i + 1}`)
      this.currentInnerJobIndex = i
      const currentInnerJob = this.innerJobs[i]
      if (currentInnerJob.context) {
        Object.assign(this.context, currentInnerJob.context)
      }
      currentInnerJob.context = this.context
      currentInnerJob.onEvent(this.onInnerJobEvent.bind(this))

      // The inner job shares this very context object, and its own start()/executeInTransaction()
      // clear `context.tx` when they terminate: without saving and restoring it here, the first
      // inner job would wipe the parent's transaction handle, leaving every following inner job
      // (and the parent's own beforeSuccess()/beforeEnd()) running outside of the transaction.
      // start() never throws (it swallows/records errors internally), so a plain restore is enough.
      const parentTx = this.context.tx
      await currentInnerJob.start(parentTx)
      this.context.tx = parentTx

      if (currentInnerJob.isSucceeded()) {
        this.incrementProcessedItems()
      } else if (this.stopOnInnerJobFailure) {
        break
      }
    }

    this.logDebug(`- ${this.processed} inner jobs processed successfully`)
  }

  protected abstract execute(): Promise<void>

  /**
   * Determines whether the job should actually run.
   * When it returns false, "execute" (or the inner jobs) will be skipped, but the job will still succeed.
   */
  protected async shouldExecute(): Promise<boolean> {
    return true
  }

  protected incrementProcessedItems(incrementBy = 1): void {
    this.processed += incrementBy
  }

  protected async setStatus(status: JobStatus): Promise<void> {
    this.logDebug(`set status: ${status}`)
    this.status = status

    const event: JobEvent = { type: JobEventType.statusChange, status, total: this.total, processed: this.processed }
    if (status === JobStatus.failed) {
      event.errors = this.errors
    }

    if (this.isEnded()) {
      this.logDebug('onEnd...')
      await this.onEnd()
      this.logDebug(`onEnd run. Job completed in ${this.elapsedTimePrettyFormat}`)
    }

    this.notifyEvent(event)
  }

  /**
   * Inner job event handler.
   */
  protected async onInnerJobEvent(event: JobEvent): Promise<void> {
    const { status } = event
    if (status === JobStatus.canceled) {
      this.canceledByAdmin = this.getCurrentInnerJob()?.canceledByAdmin ?? false
      return this.setStatus(status)
    }
    if (status === JobStatus.failed) {
      return this.setStatus(status)
    }
    if (status === JobStatus.running) {
      this.notifyEvent({
        type: JobEventType.progress,
        status: this.status,
        total: this.total,
        processed: this.processed,
      })
      return
    }
    this.logDebug(`Unknown inner job status: ${status}`)
  }

  /**
   * Called when the job just has been started.
   */
  protected async onStart(): Promise<void> {
    this.startTime = new Date()
    await this.setStatus(JobStatus.running)
  }

  /**
   * Called before beforeEnd only if the status will change to 'success'.
   * Default implementation stores the value returned by generateResult() via setResult().
   * It runs INSIDE the current db transaction.
   */
  protected async beforeSuccess(): Promise<void> {
    this.setResult(await this.generateResult())
  }

  /**
   * Computes the value beforeSuccess() will store as this job's result.
   * Default implementation returns whatever is already in `this.result`
   * (e.g. accumulated via earlier setResult() calls during execute()).
   */
  protected async generateResult(): Promise<R | undefined> {
    return this.result
  }

  /**
   * Updates this job's result. When both the current and incoming values are plain objects,
   * they are merged (Object.assign); otherwise the incoming value replaces the current one.
   * This keeps it safe for subclasses whose result is a primitive (e.g. a plain number) as
   * well as ones that build an object result incrementally across multiple setResult() calls.
   */
  protected setResult(result: R | undefined): void {
    if (result && typeof result === 'object' && this.result && typeof this.result === 'object') {
      Object.assign(this.result, result)
    } else {
      this.result = result
    }
  }

  /**
   * Called before onEnd. Useful for flushing resources used by the job before it terminates completely.
   * It runs INSIDE the current db transaction.
   */
  protected beforeEnd(): Promise<void> {
    this.logDebug('Cleanup')
    return Promise.resolve()
  }

  /**
   * Called when the job status changes to success, failed or canceled
   * (it runs OUTSIDE of the current db transaction)
   */
  protected async onEnd(): Promise<void> {
    this.endTime = new Date()
    this.cancelNotifyProgress()
  }

  protected addError(error: any, errorKey?: string): void {
    const key = errorKey ?? String(this.processed + 1)
    this.errors[key] = error
  }

  protected throwError(errorKey: string): void {
    throw new Error(errorKey)
  }

  protected getErrorInfo(error: any): { key: string; params: Record<string, any> } {
    if (error instanceof SystemError) {
      return { key: `appErrors:${error.key}`, params: error.params }
    }
    return { key: 'appErrors:generic', params: { text: error.toString() } }
  }

  protected abstract createLogger(): Logger

  protected logDebug(...msgs: any[]): void {
    this.logger.debug(...msgs)
  }

  protected logInfo(...msgs: any[]): void {
    this.logger.info(...msgs)
  }

  protected logWarn(...msgs: any[]): void {
    this.logger.warn(...msgs)
  }

  protected logError(...msgs: any[]): void {
    this.logger.error(...msgs)
  }

  private get elapsedTimePrettyFormat(): string {
    const elapsedTime = this.calculateElapsedMillis()
    const elapsedMins = Math.floor(elapsedTime / 1000 / 60)
    const elapsedSeconds = String(Math.floor(elapsedTime / 1000) % 60).padStart(2, '0')
    const elapsedMillis = String(elapsedTime % 1000).padStart(3, '0')
    return `${elapsedMins}:${elapsedSeconds}.${elapsedMillis}`
  }

  private calculatePartialProgress(): number {
    if (this.isSucceeded()) return 100
    if (this.total > 0) return Math.floor((100 * this.processed) / this.total)
    return 0
  }

  private calculateProgressPercent(): number {
    const partialProgress = this.calculatePartialProgress()
    const currentInnerJob = this.getCurrentInnerJob()
    if (
      !currentInnerJob ||
      this.currentInnerJobIndex < 0 ||
      partialProgress === 100 ||
      this.processed > this.currentInnerJobIndex
    ) {
      return partialProgress
    }
    return partialProgress + Math.floor(currentInnerJob.calculateProgressPercent() / this.total)
  }

  private calculateElapsedMillis(): number {
    if (!this.startTime) return 0
    return (this.endTime ?? new Date()).getTime() - this.startTime.getTime()
  }

  /**
   * Notifies a progress event to the registered listener, throttled so that fast-changing
   * progress does not flood consumers (e.g. web socket clients).
   */
  private notifyProgress(): void {
    const run = (): void => {
      this.progressThrottleTimeoutId = undefined
      this.progressThrottleLastRunTime = Date.now()
      this.notifyEvent({
        type: JobEventType.progress,
        status: this.status,
        total: this.total,
        processed: this.processed,
      })
    }

    if (this.progressThrottleTimeoutId) return

    const elapsed = Date.now() - this.progressThrottleLastRunTime
    if (!this.progressThrottleLastRunTime || elapsed >= PROGRESS_NOTIFICATION_THROTTLE_MILLIS) {
      run()
    } else {
      this.progressThrottleTimeoutId = setTimeout(run, PROGRESS_NOTIFICATION_THROTTLE_MILLIS - elapsed)
    }
  }

  /**
   * Cancels any pending throttled progress notification and resets the throttle state.
   */
  private cancelNotifyProgress(): void {
    if (this.progressThrottleTimeoutId) {
      clearTimeout(this.progressThrottleTimeoutId)
      this.progressThrottleTimeoutId = undefined
    }
    this.progressThrottleLastRunTime = 0
  }

  private notifyEvent(event: JobEvent): void {
    this.eventListener?.(event)
  }
}
