import { RetryProcessor } from './retryProcessor'

type ChunkProcessor = (args: {
  chunk: number
  content: Blob | string | Uint8Array
  totalChunks: number
  totalFileSize: number
}) => Promise<any>

export type FileProcessorConstructorArgs = {
  file?: File
  filePath?: string
  chunkProcessor: ChunkProcessor
  onError?: (error: Error) => void
  onComplete?: (result: any) => void
  chunkSize?: number
  maxTryings?: number
}

export class FileProcessor {
  static readonly defaultChunkSize = 1024 * 1024 * 10 // 10MB
  static readonly defaultMaxTryings = 5

  private readonly file?: File
  private readonly filePath?: string
  private readonly chunkProcessor: ChunkProcessor
  private readonly chunkSize: number
  private readonly maxTryings: number
  private readonly onError?: (error: Error) => void
  private readonly onComplete?: (result?: any) => void

  // State properties
  protected totalFileSize: number = 0
  protected running: boolean = false
  protected totalChunks: number = 0
  protected currentChunkNumber: number = 0
  // true while a chunk is being processed (resume must not start a second processing chain)
  protected processingChunk: boolean = false
  protected completed: boolean = false

  constructor({
    file,
    filePath,
    chunkProcessor,
    onError,
    onComplete,
    chunkSize = FileProcessor.defaultChunkSize,
    maxTryings = FileProcessor.defaultMaxTryings,
  }: FileProcessorConstructorArgs) {
    this.file = file
    this.filePath = filePath
    this.chunkProcessor = chunkProcessor
    this.chunkSize = chunkSize
    this.maxTryings = maxTryings
    this.onError = onError
    this.onComplete = onComplete

    if (!this.file && !this.filePath) {
      throw new Error('File or filePath not specified')
    }

    this.reset()
  }

  protected reset(): void {
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

  protected extractCurrentFileChunk(): Promise<Blob | string | Uint8Array> {
    const { file, currentChunkNumber, totalChunks, chunkSize } = this
    if (!file) {
      return Promise.reject(new Error('File property not initialized'))
    }
    return Promise.resolve(
      file.slice(
        (currentChunkNumber - 1) * chunkSize,
        currentChunkNumber === totalChunks ? undefined : currentChunkNumber * chunkSize
      )
    )
  }

  protected processNextChunk(): void {
    const { chunkProcessor, currentChunkNumber, totalFileSize, totalChunks, maxTryings } = this

    this.processingChunk = true
    this.extractCurrentFileChunk()
      .then((content) => {
        const retryProcessor = new RetryProcessor<void>({
          processor: async () => {
            const chunkResult = await chunkProcessor({ chunk: currentChunkNumber, totalFileSize, totalChunks, content })
            if (this.currentChunkNumber === totalChunks && this.onComplete) {
              this.onComplete(chunkResult)
            }
          },
          onSuccess: () => {
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
            }
          },
          onFail: (error: Error) => {
            this.processingChunk = false
            this.onFail(error)
            this.running = false
          },
          maxTryings,
        })
        retryProcessor.start()
      })
      .catch((error) => {
        this.processingChunk = false
        this.onFail(error)
        this.running = false
      })
  }

  start(startFromChunk: number = 1): void {
    this.running = true
    this.completed = false
    this.currentChunkNumber = startFromChunk
    this.calculateFileSize()
      .then((fileSize) => {
        this.totalFileSize = fileSize
        this.totalChunks = Math.ceil(fileSize / this.chunkSize)
        if (this.totalChunks > 0) {
          this.processNextChunk()
        }
      })
      .catch((error) => {
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
