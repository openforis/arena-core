interface RetryProcessorArgs<ProcessorResult> {
  processor: () => Promise<ProcessorResult>
  onSuccess: (result: ProcessorResult) => void
  onFail: (error: Error) => void
  maxTryings?: number
}

export class RetryProcessor<ProcessorResult> {
  private readonly processor: () => Promise<ProcessorResult>
  private readonly onSuccess: (result: ProcessorResult) => void
  private readonly onFail: (error: Error) => void
  private readonly maxTryings: number

  // State properties
  private currentTrying: number = 0
  private running: boolean = false

  constructor({ processor, onSuccess, onFail, maxTryings = 2 }: RetryProcessorArgs<ProcessorResult>) {
    this.processor = processor
    this.onSuccess = onSuccess
    this.onFail = onFail
    this.maxTryings = maxTryings
  }

  protected reset() {
    this.currentTrying = 0
    this.running = false
  }

  protected processNext(): void {
    this.currentTrying += 1

    this.processor()
      .then((res) => {
        this.onSuccess(res)
      })
      .catch((error) => {
        // On error, check if we should try again
        if (this.running && this.currentTrying < this.maxTryings) {
          this.processNext() // Retry
        } else {
          // If we've stopped or exceeded max attempts, call the fail callback
          this.onFail(error)
        }
      })
  }

  // Public methods
  start(): void {
    this.running = true
    this.processNext()
  }

  stop(): void {
    this.reset()
  }
}
