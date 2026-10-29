interface RetryProcessorArgs<ProcessorResult> {
  processor: () => Promise<ProcessorResult>
  onSuccess: (result: ProcessorResult) => void
  onFail: (error: Error) => void
  maxTryings?: number
  /**
   * Delay (in milliseconds) before the first retry, doubled at every further retry (exponential backoff).
   * Defaults to 0 (immediate retry).
   */
  retryDelay?: number
}

const toError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)))

export class RetryProcessor<ProcessorResult> {
  private readonly processor: () => Promise<ProcessorResult>
  private readonly onSuccess: (result: ProcessorResult) => void
  private readonly onFail: (error: Error) => void
  private readonly maxTryings: number
  private readonly retryDelay: number

  // State properties
  private currentTrying: number = 0
  private running: boolean = false

  constructor({ processor, onSuccess, onFail, maxTryings = 2, retryDelay = 0 }: RetryProcessorArgs<ProcessorResult>) {
    this.processor = processor
    this.onSuccess = onSuccess
    this.onFail = onFail
    this.maxTryings = maxTryings
    this.retryDelay = retryDelay
  }

  protected reset() {
    this.currentTrying = 0
    this.running = false
  }

  protected processNext(): void {
    this.currentTrying += 1

    // onSuccess runs outside the retried chain: if it throws, the processor must not run again
    this.processor().then(
      (result) => this.handleSuccess(result),
      (error) => this.handleProcessorError(toError(error))
    )
  }

  private handleSuccess(result: ProcessorResult): void {
    try {
      this.onSuccess(result)
    } catch (error) {
      this.onFail(toError(error))
    }
  }

  private handleProcessorError(error: Error): void {
    if (!this.running || this.currentTrying >= this.maxTryings) {
      // stopped or max attempts reached
      this.onFail(error)
      return
    }
    const delay = this.retryDelay * 2 ** (this.currentTrying - 1)
    if (delay <= 0) {
      this.processNext()
      return
    }
    setTimeout(() => {
      if (this.running) {
        this.processNext()
      } else {
        this.onFail(error)
      }
    }, delay)
  }

  // Public methods
  start(): void {
    this.currentTrying = 0
    this.running = true
    this.processNext()
  }

  stop(): void {
    this.reset()
  }
}
