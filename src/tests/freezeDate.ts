import { afterAll, jest } from '@jest/globals'

/**
 * Freezes the current date (Date.now(), new Date()) in the calling test file, leaving timers real.
 * Expected values computed with the current date would otherwise differ from the evaluated ones
 * when the clock crosses a second (or a day) boundary between the two calls.
 */
export const freezeDate = (date: Date = new Date('2024-06-15T12:34:56.789Z')): void => {
  jest.useFakeTimers({
    doNotFake: [
      'nextTick',
      'setImmediate',
      'setTimeout',
      'setInterval',
      'clearTimeout',
      'clearInterval',
      'clearImmediate',
      'queueMicrotask',
      'hrtime',
      'performance',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
    ],
    now: date,
  })
  afterAll(() => {
    jest.useRealTimers()
  })
}
