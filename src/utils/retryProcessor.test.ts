import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'

import { RetryProcessor } from './retryProcessor'

type Processor = () => Promise<string>

const createCallbacks = () => ({
  onSuccess: jest.fn<(result: string) => void>(),
  onFail: jest.fn<(error: Error) => void>(),
})

describe('RetryProcessor', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('calls onSuccess with the processor result', async () => {
    const processor = jest.fn<Processor>().mockResolvedValue('ok')
    const { onSuccess, onFail } = createCallbacks()

    new RetryProcessor({ processor, onSuccess, onFail }).start()
    await jest.runAllTimersAsync()

    expect(processor).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('ok')
    expect(onFail).not.toHaveBeenCalled()
  })

  test('retries a failing processor until it succeeds', async () => {
    const processor = jest
      .fn<Processor>()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockResolvedValue('ok')
    const { onSuccess, onFail } = createCallbacks()

    new RetryProcessor({ processor, onSuccess, onFail, maxTryings: 3 }).start()
    await jest.runAllTimersAsync()

    expect(processor).toHaveBeenCalledTimes(3)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('ok')
    expect(onFail).not.toHaveBeenCalled()
  })

  test('calls onFail with the last error when max tryings are reached', async () => {
    const processor = jest
      .fn<Processor>()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
    const { onSuccess, onFail } = createCallbacks()

    new RetryProcessor({ processor, onSuccess, onFail, maxTryings: 2 }).start()
    await jest.runAllTimersAsync()

    expect(processor).toHaveBeenCalledTimes(2)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onFail).toHaveBeenCalledTimes(1)
    expect(onFail).toHaveBeenCalledWith(new Error('second'))
  })

  test('does not run the processor again when onSuccess throws', async () => {
    const processor = jest.fn<Processor>().mockResolvedValue('ok')
    const onSuccessError = new Error('onSuccess failed')
    const onSuccess = jest.fn<(result: string) => void>().mockImplementation(() => {
      throw onSuccessError
    })
    const onFail = jest.fn<(error: Error) => void>()

    new RetryProcessor({ processor, onSuccess, onFail, maxTryings: 3 }).start()
    await jest.runAllTimersAsync()

    expect(processor).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onFail).toHaveBeenCalledTimes(1)
    expect(onFail).toHaveBeenCalledWith(onSuccessError)
  })

  test('waits retryDelay before the first retry, doubling it at every further retry', async () => {
    const processor = jest.fn<Processor>().mockRejectedValue(new Error('failure'))
    const { onSuccess, onFail } = createCallbacks()

    new RetryProcessor({ processor, onSuccess, onFail, maxTryings: 3, retryDelay: 100 }).start()

    await jest.advanceTimersByTimeAsync(0)
    expect(processor).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(99)
    expect(processor).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(processor).toHaveBeenCalledTimes(2)

    await jest.advanceTimersByTimeAsync(199)
    expect(processor).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(processor).toHaveBeenCalledTimes(3)

    expect(onFail).toHaveBeenCalledTimes(1)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  test('does not retry when stopped while waiting for the retry delay', async () => {
    const processor = jest.fn<Processor>().mockRejectedValue(new Error('failure'))
    const { onSuccess, onFail } = createCallbacks()

    const retryProcessor = new RetryProcessor({ processor, onSuccess, onFail, maxTryings: 3, retryDelay: 100 })
    retryProcessor.start()
    await jest.advanceTimersByTimeAsync(50)
    retryProcessor.stop()
    await jest.runAllTimersAsync()

    expect(processor).toHaveBeenCalledTimes(1)
    expect(onFail).toHaveBeenCalledTimes(1)
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
