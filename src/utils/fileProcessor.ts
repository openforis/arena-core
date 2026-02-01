import { RetryProcessor } from './retryProcessor'

type ChunkProcessor = (args: {
  chunk: number
  totalChunks: number
  content: Blob | string | Uint8Array
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
  protected running: boolean = false
  protected totalChunks: number = 0
  protected currentChunkNumber: number = 0

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
  }

  protected async calculateFileSize(): Promise<number> {
    return this.file?.size ?? 0
  }

  protected onFail(error: Error): void {
    this.onError?.(error)
  }

  protected async extractCurrentFileChunk(): Promise<Blob | string | Uint8Array> {
    const { file, currentChunkNumber, totalChunks, chunkSize } = this
    if (!file) {
      throw new Error('File property not initialized')
    }
    return file.slice(
      (currentChunkNumber - 1) * chunkSize,
      currentChunkNumber === totalChunks ? undefined : currentChunkNumber * chunkSize
    )
  }

  protected processNextChunk(): void {
    const { chunkProcessor, currentChunkNumber, totalChunks, maxTryings } = this

    this.extractCurrentFileChunk()
      .then((content) => {
        const retryProcessor = new RetryProcessor<void>({
          processor: async () => {
            const chunkResult = await chunkProcessor({ chunk: currentChunkNumber, totalChunks, content })
            if (this.currentChunkNumber === totalChunks && this.onComplete) {
              this.onComplete(chunkResult)
            }
          },
          onSuccess: () => {
            if (this.running && this.currentChunkNumber < totalChunks) {
              this.currentChunkNumber += 1
              this.processNextChunk()
            }
          },
          onFail: (error: Error) => {
            this.onFail(error)
            this.running = false
          },
          maxTryings,
        })
        retryProcessor.start()
      })
      .catch((error) => {
        this.onFail(error)
        this.running = false
      })
  }

  start(startFromChunk: number = 1): void {
    this.running = true
    this.currentChunkNumber = startFromChunk
    this.calculateFileSize()
      .then((fileSize) => {
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
    this.running = true
    this.processNextChunk()
  }
}
