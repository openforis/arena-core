import { Logger } from '../logger'
import { UUIDs } from '../utils'

import { Job } from './job'
import { JobContext } from './jobContext'
import { JobEvent, JobEventType } from './jobEvent'
import { JobSerialized } from './jobSerialized'
import { JobStatus } from './status'

export interface JobConstructor {
  new <C extends JobContext, R>(context: C, jobs?: JobBase<any>[]): JobBase<C, R>
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
 * - prepareResult (in tx)
 * - cleanup (in tx)
 * - onEnd (out of tx)
 */
export abstract class JobBase<C extends JobContext, R = undefined> implements Job<R> {
  readonly uuid: string
  readonly type: string
  status: JobStatus = JobStatus.pending
  startTime?: Date
  endTime?: Date
  total: number
  result: R | undefined = undefined
  errors: Record<string, any> = {}

  protected logger: Logger
  protected context: C
  protected jobs: JobBase<C, any>[]
  protected currentInnerJobIndex = -1

  private _processed = 0
  private eventListener: ((event: JobEvent) => void) | undefined = undefined
  private progressThrottleTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined
  private progressThrottleLastRunTime = 0

  public constructor(context: C, jobs: JobBase<C, any>[] = []) {
    this.context = context
    this.jobs = jobs
    this.logger = this.createLogger()

    this.uuid = UUIDs.v4()
    this.type = this.context.type ?? this.constructor.name
    this.total = jobs.length > 0 ? jobs.length : 1
  }

  get processed(): number {
    return this._processed
  }

  set processed(value: number) {
    this._processed = value
    this.notifyProgress()
  }

  protected get surveyId(): number {
    return this.context.surveyId ?? 0
  }

  protected get userUuid(): string {
    return this.context.user.uuid
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
    return this.jobs[this.currentInnerJobIndex]
  }

  async cancel(): Promise<void> {
    const currentInnerJob = this.getCurrentInnerJob()
    if (currentInnerJob) {
      if (currentInnerJob.isRunning()) {
        await currentInnerJob.cancel()
      }
    } else {
      await this.setStatus(JobStatus.canceled)
    }
  }

  async start(client: any = null): Promise<void> {
    this.logDebug('start')

    try {
      if (client) {
        // 1. create db transaction and execute job inside of it
        await client.tx(async (tx: any) => {
          this.context.tx = tx
          await this.executeInternalJobsOrCurrentOne()
        })
      } else {
        await this.executeInternalJobsOrCurrentOne()
      }
      if (this.isRunning()) {
        // 2. if successful, prepare result and set status succeeded
        this.result = await this.prepareResult()
        await this.setStatus(JobStatus.succeeded)
      } else {
        // 3. if errors found or job has been canceled, throw an error to rollback transaction
        this.throwError('jobCanceledOrErrorsFound')
      }
    } catch (error: any) {
      if (this.isRunning()) {
        // Error found, change status only if not changed already
        this.logError(error.stack ?? error)
        this.addError({
          error: {
            valid: false,
            errors: [{ key: 'appErrors.generic', params: { text: error.toString() } }],
          },
        })
        await this.setStatus(JobStatus.failed)
      }
    } finally {
      this.context.tx = undefined
      if (!this.isCanceled()) {
        await this.cleanup()
      }
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
      innerJobs: this.jobs.map((job) => job.toJSON()),
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

  private async executeInternalJobsOrCurrentOne(): Promise<void> {
    // notify start
    await this.onStart()

    const shouldExecute = await this.shouldExecute()
    if (!shouldExecute) return

    // execute internal jobs
    if (this.jobs.length > 0) {
      await this.executeJobs()
    } else {
      // or execute single job
      await this.execute()
    }
  }

  private async executeJobs(): Promise<void> {
    this.logDebug(`- ${this.total} inner jobs found`)

    // Start each inner job and wait for its completion before starting next one
    for (let i = 0; i < this.jobs.length; i++) {
      this.logDebug(`- executing inner job ${i + 1}`)
      this.currentInnerJobIndex = i
      const currentInnerJob = this.jobs[i]
      currentInnerJob.context = this.context
      currentInnerJob.onEvent(this.onInnerJobEvent.bind(this))

      await currentInnerJob.start(this.context.tx)

      if (currentInnerJob.isSucceeded()) {
        this.incrementProcessedItems()
      } else {
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
    if ([JobStatus.canceled, JobStatus.failed].includes(status)) {
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
   * Called before cleanup only if the status will change to 'success'.
   * It runs INSIDE the current db transaction.
   */
  protected prepareResult(): Promise<R | undefined> {
    this.logDebug('Prepare result')
    return Promise.resolve(undefined)
  }

  /**
   * Called before onEnd. Useful for flushing resources used by the job before it terminates completely.
   * It runs INSIDE the current db transaction.
   */
  protected cleanup(): Promise<void> {
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
