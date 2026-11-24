import { RetryProcessor } from './retryProcessor'

/**
 * Chunk written to a temporary file, in the form accepted by React Native FormData.
 */
export type ArenaFileProcessorUriChunk = { uri: string; type: string; name: string }

export type ArenaFileProcessorChunk = Blob | string | Uint8Array | ArenaFileProcessorUriChunk

type DefaultChunk = Blob | string | Uint8Array

type ChunkProcessor<C, R> = (args: {
  chunk: number
  content: C
  totalChunks: number
  totalFileSize: number
}) => Promise<R>

/**
 * C: type of the chunks extracted from the file, R: result of the chunk processor.
 */
export type ArenaFileProcessorConstructorArgs<C extends ArenaFileProcessorChunk = DefaultChunk, R = any> = {
  file?: File
  filePath?: string
  chunkProcessor: ChunkProcessor<C, R>
  onError?: (error: Error) => void
  // result of the last chunk (undefined for empty files)
  onComplete?: (result?: R) => void
  chunkSize?: number
  maxTryings?: number
  /**
   * Delay (in milliseconds) before retrying a failed chunk, doubled at every further retry.
   */
  retryDelay?: number
}

export class FileProcessor<C extends ArenaFileProcessorChunk = DefaultChunk, R = any> {
  static readonly defaultChunkSize = 1024 * 1024 * 10 // 10MB
  static readonly defaultMaxTryings = 5
  static readonly defaultRetryDelay = 1000 // 1s, then 2s, 4s...

  private readonly file?: File
  protected readonly filePath?: string
  private readonly chunkProcessor: ChunkProcessor<C, R>
  protected readonly chunkSize: number
  private readonly maxTryings: number
  private readonly retryDelay: number
  private readonly onError?: (error: Error) => void
  private readonly onComplete?: (result?: R) => void

  // State properties
  protected totalFileSize: number = 0
  protected running: boolean = false
  protected totalChunks: number = 0
  protected currentChunkNumber: number = 0
  // true while a chunk is being processed (resume must not start a second processing chain)
  protected processingChunk: boolean = false
  protected completed: boolean = false
  // incremented when a processing run is stopped: callbacks of the chunks of previous runs are ignored
  private runId: number = 0
  private retryProcessor?: RetryProcessor<R>

  constructor({
    file,
    filePath,
    chunkProcessor,
    onError,
    onComplete,
    chunkSize = FileProcessor.defaultChunkSize,
    maxTryings = FileProcessor.defaultMaxTryings,
    retryDelay = FileProcessor.defaultRetryDelay,
  }: ArenaFileProcessorConstructorArgs<C, R>) {
    this.file = file
    this.filePath = filePath
    this.chunkProcessor = chunkProcessor
    this.chunkSize = chunkSize
    this.maxTryings = maxTryings
    this.retryDelay = retryDelay
    this.onError = onError
    this.onComplete = onComplete

    if (!this.file && !this.filePath) {
      throw new Error('File or filePath not specified')
    }

    this.reset()
  }

  private cancelCurrentRun(): void {
    this.runId += 1
    this.retryProcessor?.stop()
    this.retryProcessor = undefined
  }

  protected reset(): void {
    this.cancelCurrentRun()
    this.running = false
    this.totalChunks = 0
    this.currentChunkNumber = 0
    this.totalFileSize = 0
    this.processingChunk = false
    this.completed = false
  }

  protected calculateFileSize(): Promise<number> {
    return Promise.resolve(this.file?.size ?? 0)
  }

  protected onFail(error: Error): void {
    this.onError?.(error)
  }

  // subclasses using another chunk type (e.g. reading from filePath) override it
  protected extractCurrentFileChunk(): Promise<C> {
    const { file, currentChunkNumber, totalChunks, chunkSize } = this
    if (!file) {
      return Promise.reject(new Error('File property not initialized'))
    }
    return Promise.resolve(
      file.slice(
        (currentChunkNumber - 1) * chunkSize,
        currentChunkNumber === totalChunks ? undefined : currentChunkNumber * chunkSize
      ) as C
    )
  }

  protected processNextChunk(): void {
    const { chunkProcessor, currentChunkNumber, totalFileSize, totalChunks, maxTryings, retryDelay, runId } = this
    const isStale = () => runId !== this.runId

    this.processingChunk = true
    this.extractCurrentFileChunk()
      .then((content) => {
        if (isStale()) return
        const retryProcessor = new RetryProcessor<R>({
          processor: () => chunkProcessor({ chunk: currentChunkNumber, totalFileSize, totalChunks, content }),
          onSuccess: (chunkResult) => {
            if (isStale()) return
            this.processingChunk = false
            if (this.currentChunkNumber < totalChunks) {
              // move to the next chunk also when paused: resume will continue from it
              this.currentChunkNumber += 1
              if (this.running) {
                this.processNextChunk()
              }
            } else {
              this.running = false
              this.completed = true
              // called outside the retried processor: if it throws, the last chunk is not processed again
              this.onComplete?.(chunkResult)
            }
          },
          onFail: (error: Error) => {
            if (isStale()) return
            this.processingChunk = false
            this.onFail(error)
            this.running = false
          },
          maxTryings,
          retryDelay,
        })
        this.retryProcessor = retryProcessor
        retryProcessor.start()
      })
      .catch((error) => {
        if (isStale()) return
        this.processingChunk = false
        this.onFail(error)
        this.running = false
      })
  }

  start(startFromChunk: number = 1): void {
    // a previous run still in progress must not continue in parallel
    this.cancelCurrentRun()
    const { runId } = this
    this.processingChunk = false
    this.running = true
    this.completed = false
    this.currentChunkNumber = startFromChunk
    this.calculateFileSize()
      .then((fileSize) => {
        if (runId !== this.runId) return
        this.totalFileSize = fileSize
        this.totalChunks = Math.ceil(fileSize / this.chunkSize)
        if (this.totalChunks > 0) {
          this.processNextChunk()
        } else {
          // empty file: nothing to process, complete immediately (callers wait for onComplete)
          this.running = false
          this.completed = true
          this.onComplete?.()
        }
      })
      .catch((error) => {
        if (runId !== this.runId) return
        this.onFail(error)
        this.running = false
      })
  }

  stop(): void {
    this.reset()
  }

  pause(): void {
    this.running = false
  }

  resume(): void {
    if (this.running || this.completed) return
    this.running = true
    // if a chunk is still being processed, processing continues when it completes
    if (!this.processingChunk && this.totalChunks > 0) {
      this.processNextChunk()
    }
  }
}
