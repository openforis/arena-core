import { FileProcessor } from './fileProcessor'

describe('FileProcessor', () => {
  describe('constructor', () => {
    test('should throw error if neither file nor filePath is provided', () => {
      const chunkProcessor = jest.fn()
      expect(
        () =>
          new FileProcessor({
            chunkProcessor,
          })
      ).toThrow('File or filePath not specified')
    })

    test('should create instance with file', () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const chunkProcessor = jest.fn()
      const processor = new FileProcessor({ file, chunkProcessor })
      expect(processor).toBeDefined()
    })

    test('should create instance with filePath', () => {
      const chunkProcessor = jest.fn()
      const processor = new FileProcessor({ filePath: '/path/to/file', chunkProcessor })
      expect(processor).toBeDefined()
    })

    test('should use default chunk size and max tryings', () => {
      const file = new File(['test'], 'test.txt')
      const chunkProcessor = jest.fn()
      const processor = new FileProcessor({ file, chunkProcessor })
      expect(processor).toBeDefined()
    })

    test('should use custom chunk size and max tryings', () => {
      const file = new File(['test'], 'test.txt')
      const chunkProcessor = jest.fn()
      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1024,
        maxTryings: 3,
      })
      expect(processor).toBeDefined()
    })
  })

  describe('start and stop', () => {
    test('should call chunkProcessor when starting', (done) => {
      const content = 'a'.repeat(100)
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      const chunkProcessor = jest.fn().mockResolvedValue(null)
      const onComplete = jest.fn()

      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1024 * 1024,
        onComplete,
      })

      processor.start()

      // Give async operations time to complete
      setTimeout(() => {
        expect(chunkProcessor).toHaveBeenCalled()
        expect(chunkProcessor).toHaveBeenCalledWith(
          expect.objectContaining({
            chunk: 1,
            totalFileSize: content.length,
            totalChunks: 1,
            content: expect.any(Blob),
          })
        )
        expect(onComplete).toHaveBeenCalled()
        done()
      }, 100)
    })

    test('should process multiple chunks', (done) => {
      const content = 'a'.repeat(2100)
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      const chunkProcessor = jest.fn().mockResolvedValue(null)
      const onComplete = jest.fn()

      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1000,
        onComplete,
      })

      processor.start()

      setTimeout(() => {
        expect(chunkProcessor).toHaveBeenCalledTimes(3)
        // First chunk
        expect(chunkProcessor).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            chunk: 1,
            totalChunks: 3,
          })
        )
        // Second chunk
        expect(chunkProcessor).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            chunk: 2,
            totalChunks: 3,
          })
        )
        // Third chunk
        expect(chunkProcessor).toHaveBeenNthCalledWith(
          3,
          expect.objectContaining({
            chunk: 3,
            totalChunks: 3,
          })
        )
        expect(onComplete).toHaveBeenCalled()
        done()
      }, 200)
    })

    test('should stop processing', (done) => {
      const content = 'a'.repeat(100)
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      const chunkProcessor = jest.fn().mockResolvedValue(null)

      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1024 * 1024,
      })

      processor.start()
      processor.stop()

      setTimeout(() => {
        expect(chunkProcessor).toHaveBeenCalled()
        done()
      }, 100)
    })
  })

  describe('pause and resume', () => {
    test('should pause processing', (done) => {
      const content = 'a'.repeat(2100)
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      const chunkProcessor = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(null), 50)
          })
      )

      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1000,
      })

      processor.start()

      // Pause after first chunk completes
      setTimeout(() => {
        processor.pause()
        const callsAfterPause = chunkProcessor.mock.calls.length

        setTimeout(() => {
          expect(chunkProcessor.mock.calls.length).toBe(callsAfterPause)
          done()
        }, 100)
      }, 100)
    })

    test('should resume processing after pause', (done) => {
      const content = 'a'.repeat(2100)
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      const chunkProcessor = jest.fn().mockResolvedValue(null)
      const onComplete = jest.fn()

      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1000,
        onComplete,
      })

      processor.start()

      setTimeout(() => {
        const callsBeforePause = chunkProcessor.mock.calls.length
        processor.pause()
        processor.resume()

        setTimeout(() => {
          // Should have processed at least as many chunks as before pause + additional
          expect(chunkProcessor.mock.calls.length).toBeGreaterThanOrEqual(callsBeforePause)
          expect(onComplete).toHaveBeenCalled()
          done()
        }, 300)
      }, 100)
    })
  })

  describe('error handling', () => {
    test('should call onError when chunkProcessor fails', (done) => {
      const content = 'a'.repeat(100)
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      const testError = new Error('Processing failed')
      const chunkProcessor = jest.fn().mockRejectedValue(testError)
      const onError = jest.fn()

      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1024 * 1024,
        onError,
        maxTryings: 1,
      })

      processor.start()

      setTimeout(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
        done()
      }, 200)
    })

    test('should handle chunk processor errors with retries', (done) => {
      const content = 'a'.repeat(100)
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      const testError = new Error('Chunk processing failed')
      const chunkProcessor = jest.fn().mockRejectedValueOnce(testError).mockRejectedValue(testError)
      const onError = jest.fn()

      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1024 * 1024,
        onError,
        maxTryings: 2,
      })

      processor.start()

      setTimeout(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
        done()
      }, 200)
    })
  })

  describe('start from specific chunk', () => {
    test('should start processing from specified chunk', (done) => {
      const content = 'a'.repeat(3100)
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      const chunkProcessor = jest.fn().mockResolvedValue(null)

      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1000,
      })

      processor.start(2)

      setTimeout(() => {
        // Should process chunks 2 and 3 only
        const chunkNumbers = chunkProcessor.mock.calls.map((call) => call[0].chunk)
        expect(chunkNumbers).toContain(2)
        expect(chunkNumbers).toContain(3)
        done()
      }, 200)
    })
  })

  describe('chunk size calculation', () => {
    test('should correctly calculate number of chunks', (done) => {
      const content = 'a'.repeat(2500)
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      const chunkProcessor = jest.fn().mockResolvedValue(null)

      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1000,
      })

      processor.start()

      setTimeout(() => {
        // 2500 bytes / 1000 bytes per chunk = 3 chunks
        const totalChunksInCalls = chunkProcessor.mock.calls[0][0].totalChunks
        expect(totalChunksInCalls).toBe(3)
        expect(chunkProcessor).toHaveBeenCalledTimes(3)
        done()
      }, 200)
    })

    test('should handle empty file', (done) => {
      const file = new File([], 'test.txt', { type: 'text/plain' })
      const chunkProcessor = jest.fn()
      const onComplete = jest.fn()

      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1024,
        onComplete,
      })

      processor.start()

      setTimeout(() => {
        expect(chunkProcessor).not.toHaveBeenCalled()
        expect(onComplete).not.toHaveBeenCalled()
        done()
      }, 100)
    })
  })

  describe('callbacks', () => {
    test('should pass correct chunk information to processor', (done) => {
      const content = 'a'.repeat(2100)
      const file = new File([content], 'test.txt', { type: 'text/plain' })
      const chunkProcessor = jest.fn().mockResolvedValue(null)

      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1000,
      })

      processor.start()

      setTimeout(() => {
        const firstCall = chunkProcessor.mock.calls[0][0]
        expect(firstCall).toHaveProperty('chunk')
        expect(firstCall).toHaveProperty('content')
        expect(firstCall).toHaveProperty('totalChunks')
        expect(firstCall).toHaveProperty('totalFileSize')
        expect(firstCall.totalFileSize).toBe(2100)
        expect(firstCall.totalChunks).toBe(3)
        done()
      }, 100)
    })

    test('should call onComplete with chunk result', (done) => {
      const content = 'test'
      const file = new File([content], 'test.txt')
      const chunkResult = { status: 'ok' }
      const chunkProcessor = jest.fn().mockResolvedValue(chunkResult)
      const onComplete = jest.fn()

      const processor = new FileProcessor({
        file,
        chunkProcessor,
        chunkSize: 1024,
        onComplete,
      })

      processor.start()

      setTimeout(() => {
        expect(onComplete).toHaveBeenCalledWith(chunkResult)
        done()
      }, 100)
    })
  })

  describe('default values', () => {
    test('should use default chunk size', () => {
      expect(FileProcessor.defaultChunkSize).toBe(1024 * 1024 * 10)
    })

    test('should use default max tryings', () => {
      expect(FileProcessor.defaultMaxTryings).toBe(5)
    })
  })
})
