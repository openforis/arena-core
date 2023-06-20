import { EventEmitter } from 'events'
import { DebouncedFunc, throttle } from 'lodash'

import { Logger } from '../logger'
import { UUIDs } from '../utils'

import { Job } from './job'
import { JobContext } from './jobContext'
import { JobMessageOutType } from './jobMessage'
import { JobStatus } from './status'
import { JobSummary } from './summary'

export interface JobConstructor {
  new <C extends JobContext, R>(context: C, jobs?: JobBase<any>[]): JobBase<C, R>
  readonly prototype: JobBase<any, any>
}

export abstract class JobBase<C extends JobContext, R = undefined> extends EventEmitter implements Job<R> {
  protected logger: Logger
  summary: JobSummary<R>
  protected context: C
  protected jobs: JobBase<C, any>[]
  private readonly emitSummaryUpdateEvent: DebouncedFunc<() => void>
  private jobCurrent: JobBase<C, any> | undefined = undefined

  public constructor(context: C, jobs: JobBase<C, any>[] = []) {
    super()
    this.jobs = jobs
    this.context = context
    this.logger = this.createLogger()

    this.summary = {
      jobs: this.jobs.map((job) => job.summary),
      processed: 0,
      status: JobStatus.pending,
      surveyId: this.context.surveyId,
      total: 1,
      type: this.context.type,
      userUuid: this.context.user.uuid,
      uuid: UUIDs.v4(),
    }

    this.emitSummaryUpdateEvent = throttle(() => this.emit(JobMessageOutType.summaryUpdate, this.summary), 500)
    this.jobs.forEach((job) => job.on(JobMessageOutType.summaryUpdate, this.onInnerJobSummaryUpdate.bind(this)))
  }

  async cancel(): Promise<void> {
    if (this.jobCurrent) {
      if (this.jobCurrent.summary.status === JobStatus.running) {
        await this.jobCurrent.cancel()
      }
    } else {
      await this.setStatus(JobStatus.canceled)
    }
  }

  async start(client: any = null): Promise<void> {
    this.logger.debug('start')

    try {
      if (client) {
        // 1. create db transaction and execute job inside of it
        await client.tx(async (tx: any) => {
          this.context.tx = tx
          this.executeInternalJobsOrCurrentOne()
        })
      } else {
        await this.executeInternalJobsOrCurrentOne()
      }
      if (this.summary.status === JobStatus.running) {
        // 2. if successful, prepare result and set status succeeded
        this.summary.result = await this.prepareResult()
        await this.setStatus(JobStatus.succeeded)
      } else {
        // 3. if errors found or job has been canceled, throw an error to rollback transaction
        this.throwError('jobCanceledOrErrorsFound')
      }
    } catch (error: any) {
      if (this.summary.status === JobStatus.running) {
        // Error found, change status only if not changed already
        this.logger.error(error.stack || error)
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
      if (this.summary.status !== JobStatus.canceled) {
        await this.cleanup()
      }
    }
  }

  private async executeInternalJobsOrCurrentOne(): Promise<void> {
    // notify start
    await this.onStart()
    // execute internal jobs
    if (this.jobs.length > 0) {
      await this.executeJobs()
    } else {
      // or execute single job
      await this.execute()
    }
  }

  private async executeJobs(): Promise<void> {
    this.summary.total = this.jobs.length
    this.logger.debug(`- ${this.summary.total} inner jobs found`)

    // Start each inner job and wait for it's completion before starting next one
    for (let i = 0; i < this.jobs.length; i++) {
      this.logger.debug(`- executing inner job ${i + 1}`)
      this.jobCurrent = this.jobs[i]
      this.jobCurrent.context = this.context

      await this.jobCurrent.start(this.context.tx)

      if (this.jobCurrent.summary.status === JobStatus.succeeded) {
        this.incrementProcessedItems()
      } else {
        break
      }
    }

    this.logger.debug(`- ${this.summary.processed} inner jobs processed successfully`)
  }

  protected abstract execute(): Promise<void>

  protected incrementProcessedItems(incrementBy = 1): void {
    this.summary.processed += incrementBy
    this.emitSummaryUpdateEvent()
  }

  protected async setStatus(status: JobStatus): Promise<void> {
    this.logger.debug(`set status: ${status}`)
    this.summary.status = status

    if ([JobStatus.succeeded, JobStatus.failed, JobStatus.canceled].includes(status)) {
      this.logger.debug('onEnd...')
      await this.onEnd()
      this.logger.debug('onEnd run')
    }

    this.emitSummaryUpdateEvent()
  }

  /**
   * Inner job summary update handler.
   */
  protected async onInnerJobSummaryUpdate(summary: JobSummary<any>): Promise<void> {
    const { status } = summary
    if ([JobStatus.canceled, JobStatus.failed].includes(status)) {
      return this.setStatus(status)
    }
    if (status === JobStatus.running) {
      return this.emitSummaryUpdateEvent()
    }
    this.logger.debug(`Unknown inner job status: ${status}`)
  }

  /**
   * Called when the job just has been started.
   */
  protected async onStart(): Promise<void> {
    this.summary.startTime = new Date()
    await this.setStatus(JobStatus.running)
  }

  /**
   * Called before cleanup only if the status will change to 'success'.
   * It runs INSIDE the current db transaction.
   */
  protected prepareResult(): Promise<R | undefined> {
    this.logger.debug('Prepare result')
    return Promise.resolve(undefined)
  }

  /**
   * Called before onEnd. Useful for flushing resources used by the job before it terminates completely.
   * It runs INSIDE the current db transaction.
   */
  protected cleanup(): Promise<void> {
    this.logger.debug('Cleanup')
    return Promise.resolve()
  }

  /**
   * Called when the job status changes to success, failed or canceled
   * (it runs OUTSIDE of the current db transaction)
   */
  protected async onEnd(): Promise<void> {
    this.summary.endTime = new Date()
    this.emitSummaryUpdateEvent.flush()
    this.emitSummaryUpdateEvent.cancel()
  }

  protected addError(error: any, errorKey?: string): void {
    if (!this.summary.errors) this.summary.errors = {}
    const key = errorKey ?? String(this.summary.processed + 1)
    this.summary.errors[key] = error
  }

  protected throwError(errorKey: string): void {
    throw new Error(errorKey)
  }

  protected abstract createLogger(): Logger
}
