import { RetryProcessor } from './retryProcessor'

type ChunkProcessor = (args: { chunk: number; totalChunks: number; content: Blob | string }) => Promise<void>

interface FileProcessorArgs {
  file?: File
  filePath?: string
  chunkProcessor: ChunkProcessor
  onError?: (error: Error) => void
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

  // State properties
  protected running: boolean = false
  protected totalChunks: number = 0
  protected currentChunkNumber: number = 0

  constructor({
    file,
    filePath,
    chunkProcessor,
    onError,
    chunkSize = FileProcessor.defaultChunkSize,
    maxTryings = FileProcessor.defaultMaxTryings,
  }: FileProcessorArgs) {
    this.file = file
    this.filePath = filePath
    this.chunkProcessor = chunkProcessor
    this.chunkSize = chunkSize
    this.maxTryings = maxTryings
    this.onError = onError

    if (!this.file && !this.filePath) {
      throw new Error('File or filePath not specified')
    }

    this.reset()
  }

  protected reset(): void {
    this.running = false
    this.totalChunks = 0
    this.currentChunkNumber = 0
  }

  protected async calculateFileSize(): Promise<number> {
    return Promise.resolve(this.file?.size ?? 0)
  }

  protected onFail(error: Error): void {
    this.onError?.(error)
  }

  protected async extractCurrentFileChunk(): Promise<Blob | string> {
    const { file, currentChunkNumber, totalChunks, chunkSize } = this
    if (!file) {
      throw new Error('File property not initialized')
    }
    return Promise.resolve(
      file.slice(
        (currentChunkNumber - 1) * chunkSize,
        currentChunkNumber === totalChunks ? undefined : currentChunkNumber * chunkSize
      )
    )
  }

  protected processNextChunk(): void {
    const { chunkProcessor, currentChunkNumber, totalChunks, maxTryings } = this

    this.extractCurrentFileChunk().then((content) => {
      const retryProcessor = new RetryProcessor<void>({
        processor: async () => chunkProcessor({ chunk: currentChunkNumber, totalChunks, content }),
        onSuccess: () => {
          if (this.running && this.currentChunkNumber < totalChunks) {
            this.currentChunkNumber += 1
            this.processNextChunk()
          }
        },
        onFail: (error: Error) => {
          this.onFail(error)
        },
        maxTryings,
      })
      retryProcessor.start()
    })
  }

  start(startFromChunk: number = 1): void {
    this.running = true
    this.calculateFileSize().then((fileSize) => {
      this.totalChunks = Math.ceil(fileSize / this.chunkSize)
      this.currentChunkNumber = startFromChunk
      this.processNextChunk()
    })
  }

  stop(): void {
    this.reset()
  }

  pause(): void {
    this.running = false
  }

  resume(): void {
    this.running = true
    this.processNextChunk()
  }
}
