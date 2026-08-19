import { expect, test } from '@jest/globals'

import { UserFactory } from '../auth'
import { Logger } from '../logger'

import { JobBase } from './JobBase'
import { JobContext } from './jobContext'
import { JobEvent } from './jobEvent'
import { JobStatus } from './status'

const silentLogger: Logger = {
  isDebugEnabled: () => false,
  isInfoEnabled: () => false,
  isWarnEnabled: () => false,
  isErrorEnabled: () => false,
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
}

const user = UserFactory.createInstance({ email: 'job-test@arena.org', name: 'Job Test User' })

const createContext = (overrides: Partial<JobContext> = {}): JobContext => ({ user, surveyId: 1, ...overrides })

type TestJobOptions = {
  execute?: () => Promise<void>
  shouldExecute?: boolean
  result?: any
}

class TestJob extends JobBase<JobContext, any> {
  private readonly options: TestJobOptions

  constructor(context: JobContext, jobs: JobBase<JobContext, any>[] = [], options: TestJobOptions = {}) {
    super(context, jobs)
    this.options = options
  }

  protected async execute(): Promise<void> {
    await this.options.execute?.()
  }

  protected async shouldExecute(): Promise<boolean> {
    return this.options.shouldExecute ?? true
  }

  protected async prepareResult(): Promise<any> {
    return this.options.result
  }

  protected createLogger(): Logger {
    return silentLogger
  }
}

test('job is pending before start and succeeds after execution completes', async () => {
  const job = new TestJob(createContext())

  expect(job.isPending()).toBe(true)

  await job.start()

  expect(job.isSucceeded()).toBe(true)
  expect(job.startTime).toBeInstanceOf(Date)
  expect(job.endTime).toBeInstanceOf(Date)
})

test('job fails and records an error when execute throws', async () => {
  const job = new TestJob(createContext(), [], {
    execute: async () => {
      throw new Error('boom')
    },
  })

  await job.start()

  expect(job.isFailed()).toBe(true)
  expect(job.hasErrors()).toBe(true)
})

test('result returned by prepareResult is exposed only when succeeded', async () => {
  const job = new TestJob(createContext(), [], { result: { foo: 'bar' } })

  await job.start()

  expect(job.result).toEqual({ foo: 'bar' })
})

test('shouldExecute returning false skips execute but still succeeds', async () => {
  let executed = false
  const job = new TestJob(createContext(), [], {
    shouldExecute: false,
    execute: async () => {
      executed = true
    },
  })

  await job.start()

  expect(executed).toBe(false)
  expect(job.isSucceeded()).toBe(true)
})

test('cancel sets status to canceled when no inner job is running', async () => {
  const job = new TestJob(createContext())

  await job.cancel()

  expect(job.isCanceled()).toBe(true)
})

test('onEvent notifies the listener of status transitions', async () => {
  const events: JobEvent[] = []
  const job = new TestJob(createContext())
  job.onEvent((event) => events.push(event))

  await job.start()

  const statuses = events.map((event) => event.status)
  expect(statuses).toContain(JobStatus.running)
  expect(statuses).toContain(JobStatus.succeeded)
})

test('runs inner jobs in order and aggregates their progress', async () => {
  const calls: string[] = []
  const innerJob1 = new TestJob(createContext(), [], {
    execute: async () => {
      calls.push('job1')
    },
  })
  const innerJob2 = new TestJob(createContext(), [], {
    execute: async () => {
      calls.push('job2')
    },
  })
  const parentJob = new TestJob(createContext(), [innerJob1, innerJob2])

  await parentJob.start()

  expect(calls).toEqual(['job1', 'job2'])
  expect(parentJob.isSucceeded()).toBe(true)
  expect(parentJob.total).toBe(2)
  expect(parentJob.processed).toBe(2)
})

test('total already reflects the inner jobs count in the very first running event', async () => {
  const events: JobEvent[] = []
  const innerJob1 = new TestJob(createContext())
  const innerJob2 = new TestJob(createContext())
  const parentJob = new TestJob(createContext(), [innerJob1, innerJob2])
  parentJob.onEvent((event) => events.push(event))

  await parentJob.start()

  const runningEvent = events.find((event) => event.status === JobStatus.running)
  expect(runningEvent?.total).toBe(2)
})

test('stops running inner jobs after the first failure', async () => {
  const calls: string[] = []
  const innerJob1 = new TestJob(createContext(), [], {
    execute: async () => {
      calls.push('job1')
      throw new Error('inner job failure')
    },
  })
  const innerJob2 = new TestJob(createContext(), [], {
    execute: async () => {
      calls.push('job2')
    },
  })
  const parentJob = new TestJob(createContext(), [innerJob1, innerJob2])

  await parentJob.start()

  expect(calls).toEqual(['job1'])
  expect(parentJob.isFailed()).toBe(true)
  expect(innerJob1.isFailed()).toBe(true)
  expect(innerJob2.isPending()).toBe(true)
})

test('toJSON reflects the final state of a job and its inner jobs', async () => {
  const innerJob = new TestJob(createContext(), [], { result: { count: 1 } })
  const parentJob = new TestJob(createContext(), [innerJob])

  await parentJob.start()

  const json = parentJob.toJSON()

  expect(json.uuid).toBe(parentJob.uuid)
  expect(json.status).toBe(JobStatus.succeeded)
  expect(json.succeeded).toBe(true)
  expect(json.ended).toBe(true)
  expect(json.progressPercent).toBe(100)
  expect(json.errors).toBeUndefined()
  expect(typeof json.elapsedMillis).toBe('number')
  expect(json.innerJobs).toHaveLength(1)
  expect(json.innerJobs[0].succeeded).toBe(true)
  expect(json.innerJobs[0].result).toEqual({ count: 1 })
})

test('toJSON exposes errors only when the job failed', async () => {
  const job = new TestJob(createContext(), [], {
    execute: async () => {
      throw new Error('boom')
    },
  })

  await job.start()

  const json = job.toJSON()

  expect(json.failed).toBe(true)
  expect(json.errors).toBeDefined()
  expect(json.result).toBeUndefined()
})
