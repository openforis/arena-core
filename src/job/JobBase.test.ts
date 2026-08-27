import { expect, test } from '@jest/globals'

import { UserFactory } from '../auth'
import { SystemError } from '../error'
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

const createTrackedClient = () => {
  let committed = false
  let rolledBack = false
  // Real pg-promise transaction/task objects expose their own `tx()` for nested transactions
  // (savepoints), which is what lets an inner job start its own transaction on top of the
  // parent's. `fakeTx` mirrors that by passing itself through, so inner-job failures propagate
  // instead of throwing "fakeTx.tx is not a function" and being swallowed.
  const fakeTx = { marker: 'fake-tx', tx: async (fn: (tx: any) => Promise<void>) => fn(fakeTx) }
  const client = {
    tx: async (fn: (tx: any) => Promise<void>) => {
      try {
        await fn(fakeTx)
        committed = true
      } catch (error) {
        rolledBack = true
        throw error
      }
    },
  }
  return { client, wasCommitted: () => committed, wasRolledBack: () => rolledBack }
}

type TestJobOptions = {
  execute?: () => Promise<void>
  shouldExecute?: boolean
  result?: any
  // Partial results applied via setResult() (in order) during execute(), to exercise
  // setResult()'s object-merge behavior rather than only its overwrite behavior.
  setResults?: any[]
  // Number of items to increment processed by before execute() runs (for testing error key generation)
  processedBeforeExecute?: number
}

class TestJob extends JobBase<JobContext, any> {
  private readonly options: TestJobOptions

  constructor(context: JobContext, jobs: JobBase<JobContext, any>[] = [], options: TestJobOptions = {}) {
    super(context, jobs)
    this.options = options
  }

  protected async execute(): Promise<void> {
    if (this.options.processedBeforeExecute !== undefined) {
      this.incrementProcessedItems(this.options.processedBeforeExecute)
    }
    await this.options.execute?.()
    for (const partialResult of this.options.setResults ?? []) {
      this.setResult(partialResult)
    }
  }

  protected async shouldExecute(): Promise<boolean> {
    return this.options.shouldExecute ?? true
  }

  protected async generateResult(): Promise<any> {
    // Explicit `result` option wins (used by tests asserting a canned result); otherwise fall
    // back to the base behavior (return whatever was accumulated via setResult() during execute()).
    return this.options.result ?? (await super.generateResult())
  }

  protected createLogger(): Logger {
    return silentLogger
  }

  get contextForTest(): JobContext {
    return this.context
  }

  getContextPropForTest(prop: string, defaultValue: any = null): any {
    return this.getContextProp(prop, defaultValue)
  }

  setContextForTest(context: Partial<JobContext>): void {
    this.setContext(context)
  }

  deleteContextPropsForTest(...propNames: string[]): void {
    this.deleteContextProps(...propNames)
  }

  get surveyIdForTest(): number | null {
    return this.surveyId
  }

  get userUuidForTest(): string | undefined {
    return this.userUuid
  }

  get userForTest(): any {
    return this.user
  }

  get contextSurveyForTest(): any {
    return this.contextSurvey
  }

  combineInnerJobsResultsForTest(): Record<string, any> {
    return this.combineInnerJobsResults()
  }

  combineInnerJobsErrorsForTest(): Record<string, any> {
    return this.combineInnerJobsErrors()
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

test('result returned by generateResult is exposed only when succeeded', async () => {
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

test('cancel propagates canceledByAdmin from the currently running inner job to the parent', async () => {
  let releaseInnerJob: () => void = () => undefined
  const innerJobGate = new Promise<void>((resolve) => {
    releaseInnerJob = resolve
  })
  const innerJob = new TestJob(createContext(), [], {
    execute: async () => {
      await innerJobGate
    },
  })
  const parentJob = new TestJob(createContext(), [innerJob])

  const startPromise = parentJob.start()
  // let the inner job's execute() actually start and reach the gate before canceling
  await new Promise((resolve) => setTimeout(resolve, 0))

  await parentJob.cancel({ canceledByAdmin: true })
  releaseInnerJob()
  await startPromise

  expect(parentJob.canceledByAdmin).toBe(true)
  expect(innerJob.canceledByAdmin).toBe(true)
  expect(parentJob.isCanceled()).toBe(true)
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

test('rolls back the transaction when an inner job fails without throwing', async () => {
  const { client, wasCommitted, wasRolledBack } = createTrackedClient()
  const innerJob = new TestJob(createContext(), [], {
    execute: async () => {
      throw new Error('inner job failure')
    },
  })
  const parentJob = new TestJob(createContext(), [innerJob])

  await parentJob.start(client)

  expect(parentJob.isFailed()).toBe(true)
  expect(wasRolledBack()).toBe(true)
  expect(wasCommitted()).toBe(false)
})

test('commits the transaction when the job succeeds', async () => {
  const { client, wasCommitted, wasRolledBack } = createTrackedClient()
  const job = new TestJob(createContext())

  await job.start(client)

  expect(job.isSucceeded()).toBe(true)
  expect(wasCommitted()).toBe(true)
  expect(wasRolledBack()).toBe(false)
})

test('setResult merges successive object results instead of overwriting', async () => {
  const job = new TestJob(createContext(), [], { setResults: [{ a: 1 }, { b: 2 }] })

  await job.start()

  expect(job.isSucceeded()).toBe(true)
  expect(job.result).toEqual({ a: 1, b: 2 })
})

test('continues running inner jobs after a failure when stopOnInnerJobFailure is false', async () => {
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
  parentJob.stopOnInnerJobFailure = false

  await parentJob.start()

  expect(calls).toEqual(['job1', 'job2'])
  expect(parentJob.isFailed()).toBe(true)
  expect(innerJob2.isSucceeded()).toBe(true)
})

test('constructor copies the context instead of holding the caller-owned reference', () => {
  const callerContext = createContext()
  const job = new TestJob(callerContext)

  expect(job.contextForTest).not.toBe(callerContext)
  expect(job.contextForTest).toEqual(callerContext)
})

test("merges an inner job's own context into the shared context before overwriting it", async () => {
  const innerJob = new TestJob(createContext())
  ;(innerJob.contextForTest as any).customFlag = true
  const parentJob = new TestJob(createContext(), [innerJob])

  await parentJob.start()

  expect((parentJob.contextForTest as any).customFlag).toBe(true)
})

test('getContextProp returns the context value or the default when absent', () => {
  const job = new TestJob(createContext({ surveyId: 42 }))

  expect(job.getContextPropForTest('surveyId')).toBe(42)
  expect(job.getContextPropForTest('missingProp', 'fallback')).toBe('fallback')
  expect(job.getContextPropForTest('missingProp')).toBeNull()
})

test('setContext merges new values into the existing context', () => {
  const job = new TestJob(createContext())

  job.setContextForTest({ survey: { uuid: 'survey-uuid' } as any })

  expect(job.getContextPropForTest('survey')).toEqual({ uuid: 'survey-uuid' })
})

test('deleteContextProps removes the given keys from the context', () => {
  const job = new TestJob(createContext({ survey: { uuid: 'survey-uuid' } as any }))

  job.deleteContextPropsForTest('survey')

  expect(job.getContextPropForTest('survey')).toBeNull()
})

test('surveyId defaults to null when absent from the context', () => {
  const job = new TestJob({ user } as JobContext)

  expect(job.surveyIdForTest).toBeNull()
})

test('userUuid is undefined instead of throwing when the context has no user', () => {
  const job = new TestJob({ surveyId: 1 } as unknown as JobContext)

  expect(job.userUuidForTest).toBeUndefined()
})

test('userUuid returns the actual user uuid when context.user is set', () => {
  const job = new TestJob(createContext())

  expect(job.userUuidForTest).toBe(user.uuid)
})

test('user returns the context user when set', () => {
  const job = new TestJob(createContext())

  expect(job.userForTest).toEqual(user)
})

test('contextSurvey returns the context survey when set', () => {
  const survey = { uuid: 'survey-uuid' } as any
  const job = new TestJob(createContext({ survey }))

  expect(job.contextSurveyForTest).toEqual(survey)
})

test('JobBase.keysContext exposes the well-known context property names', () => {
  expect(JobBase.keysContext).toEqual({ surveyId: 'surveyId', survey: 'survey', user: 'user' })
})

test('combineInnerJobsResults merges the result objects of all inner jobs', async () => {
  const innerJob1 = new TestJob(createContext(), [], { result: { a: 1 } })
  const innerJob2 = new TestJob(createContext(), [], { result: { b: 2 } })
  const parentJob = new TestJob(createContext(), [innerJob1, innerJob2])

  await parentJob.start()

  expect(parentJob.combineInnerJobsResultsForTest()).toEqual({ a: 1, b: 2 })
})

test('combineInnerJobsErrors merges the errors of all inner jobs', async () => {
  const innerJob1 = new TestJob(createContext(), [], {
    execute: async () => {
      throw new Error('e1')
    },
  })
  const innerJob2 = new TestJob(createContext(), [], {
    processedBeforeExecute: 1,
    execute: async () => {
      throw new Error('e2')
    },
  })
  const parentJob = new TestJob(createContext(), [innerJob1, innerJob2])
  parentJob.stopOnInnerJobFailure = false

  await parentJob.start()

  expect(Object.keys(parentJob.combineInnerJobsErrorsForTest())).toHaveLength(2)
})

test('getErrorInfo recognizes arena-core SystemError and extracts its key/params', async () => {
  const job = new TestJob(createContext(), [], {
    execute: async () => {
      throw new SystemError('my.error.key', { foo: 'bar' })
    },
  })

  await job.start()

  expect(job.isFailed()).toBe(true)
  const [errorEntry] = Object.values(job.errors) as any[]
  expect(errorEntry.error.errors[0]).toEqual({ key: 'appErrors:my.error.key', params: { foo: 'bar' } })
})

test('getErrorInfo falls back to a generic appErrors:generic key for unknown errors', async () => {
  const job = new TestJob(createContext(), [], {
    execute: async () => {
      throw new Error('boom')
    },
  })

  await job.start()

  const [errorEntry] = Object.values(job.errors) as any[]
  expect(errorEntry.error.errors[0].key).toBe('appErrors:generic')
})
