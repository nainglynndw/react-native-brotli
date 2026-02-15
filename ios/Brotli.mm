#import "Brotli.h"
#import <compression.h>
#include <cstdio>
#include <cstdlib>
#include <brotli/encode.h>

static int BrotliClampQuality(double quality) {
  if (quality < BROTLI_MIN_QUALITY) {
    return BROTLI_MIN_QUALITY;
  }
  if (quality > BROTLI_MAX_QUALITY) {
    return BROTLI_MAX_QUALITY;
  }
  return (int)quality;
}

@implementation Brotli

- (void)compress:(NSString *)data
         quality:(double)quality
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  @try {
    NSData *inputData = [[NSData alloc] initWithBase64EncodedString:data options:0];
    if (!inputData) {
      reject(@"BROTLI_COMPRESS_ERROR", @"Invalid base64 input", nil);
      return;
    }

    const int qualityInt = BrotliClampQuality(quality);
    size_t destBufferSize = BrotliEncoderMaxCompressedSize(inputData.length);
    if (destBufferSize == 0) {
      reject(@"BROTLI_COMPRESS_ERROR", @"Input is too large to compress safely", nil);
      return;
    }

    uint8_t *destBuffer = (uint8_t *)malloc(destBufferSize);
    if (!destBuffer) {
      reject(@"BROTLI_COMPRESS_ERROR", @"Failed to allocate memory", nil);
      return;
    }

    size_t compressedSize = destBufferSize;
    BROTLI_BOOL compressOk = BrotliEncoderCompress(
      qualityInt,
      BROTLI_DEFAULT_WINDOW,
      BROTLI_MODE_GENERIC,
      inputData.length,
      (const uint8_t *)inputData.bytes,
      &compressedSize,
      destBuffer
    );

    if (compressOk != BROTLI_TRUE) {
      free(destBuffer);
      reject(@"BROTLI_COMPRESS_ERROR", @"Compression failed", nil);
      return;
    }

    NSData *compressedData = [NSData dataWithBytesNoCopy:destBuffer length:compressedSize freeWhenDone:YES];
    NSString *result = [compressedData base64EncodedStringWithOptions:0];
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"BROTLI_COMPRESS_ERROR", exception.reason, nil);
  }
}

- (void)decompress:(NSString *)data
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  @try {
    NSData *inputData = [[NSData alloc] initWithBase64EncodedString:data options:0];
    if (!inputData) {
      reject(@"BROTLI_DECOMPRESS_ERROR", @"Invalid base64 input", nil);
      return;
    }

    // Start with 4x input size, grow if needed
    size_t destBufferSize = inputData.length * 4;
    if (destBufferSize < 1024) destBufferSize = 1024;

    uint8_t *destBuffer = (uint8_t *)malloc(destBufferSize);
    if (!destBuffer) {
      reject(@"BROTLI_DECOMPRESS_ERROR", @"Failed to allocate memory", nil);
      return;
    }

    size_t decompressedSize = compression_decode_buffer(
      destBuffer, destBufferSize,
      (const uint8_t *)inputData.bytes, inputData.length,
      NULL,
      COMPRESSION_BROTLI
    );

    // If the buffer was too small, retry with a larger one
    if (decompressedSize == destBufferSize) {
      size_t retrySize = destBufferSize * 4;
      free(destBuffer);
      destBuffer = (uint8_t *)malloc(retrySize);
      if (!destBuffer) {
        reject(@"BROTLI_DECOMPRESS_ERROR", @"Failed to allocate memory for retry", nil);
        return;
      }
      decompressedSize = compression_decode_buffer(
        destBuffer, retrySize,
        (const uint8_t *)inputData.bytes, inputData.length,
        NULL,
        COMPRESSION_BROTLI
      );
      destBufferSize = retrySize;
    }

    if (decompressedSize == 0) {
      free(destBuffer);
      reject(@"BROTLI_DECOMPRESS_ERROR", @"Decompression failed", nil);
      return;
    }

    NSString *result = [[NSString alloc] initWithBytes:destBuffer length:decompressedSize encoding:NSUTF8StringEncoding];
    free(destBuffer);

    if (!result) {
      reject(@"BROTLI_DECOMPRESS_ERROR", @"Failed to decode decompressed data as UTF-8", nil);
      return;
    }

    resolve(result);
  } @catch (NSException *exception) {
    reject(@"BROTLI_DECOMPRESS_ERROR", exception.reason, nil);
  }
}

- (void)decompressToBase64:(NSString *)data
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
  @try {
    NSData *inputData = [[NSData alloc] initWithBase64EncodedString:data options:0];
    if (!inputData) {
      reject(@"BROTLI_DECOMPRESS_ERROR", @"Invalid base64 input", nil);
      return;
    }

    size_t destBufferSize = inputData.length * 4;
    if (destBufferSize < 1024) destBufferSize = 1024;

    uint8_t *destBuffer = (uint8_t *)malloc(destBufferSize);
    if (!destBuffer) {
      reject(@"BROTLI_DECOMPRESS_ERROR", @"Failed to allocate memory", nil);
      return;
    }

    size_t decompressedSize = compression_decode_buffer(
      destBuffer, destBufferSize,
      (const uint8_t *)inputData.bytes, inputData.length,
      NULL,
      COMPRESSION_BROTLI
    );

    if (decompressedSize == destBufferSize) {
      size_t retrySize = destBufferSize * 4;
      free(destBuffer);
      destBuffer = (uint8_t *)malloc(retrySize);
      if (!destBuffer) {
        reject(@"BROTLI_DECOMPRESS_ERROR", @"Failed to allocate memory for retry", nil);
        return;
      }
      decompressedSize = compression_decode_buffer(
        destBuffer, retrySize,
        (const uint8_t *)inputData.bytes, inputData.length,
        NULL,
        COMPRESSION_BROTLI
      );
      destBufferSize = retrySize;
    }

    if (decompressedSize == 0) {
      free(destBuffer);
      reject(@"BROTLI_DECOMPRESS_ERROR", @"Decompression failed", nil);
      return;
    }

    NSData *decompressedData = [NSData dataWithBytesNoCopy:destBuffer length:decompressedSize freeWhenDone:YES];
    NSString *result = [decompressedData base64EncodedStringWithOptions:0];
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"BROTLI_DECOMPRESS_ERROR", exception.reason, nil);
  }
}

- (void)compressFile:(NSString *)inputPath
          outputPath:(NSString *)outputPath
             quality:(double)quality
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  FILE *fin = NULL;
  FILE *fout = NULL;
  uint8_t *srcBuffer = NULL;
  uint8_t *dstBuffer = NULL;
  BrotliEncoderState *state = NULL;
  NSString *errorMessage = nil;

  @try {
    fin = fopen([inputPath UTF8String], "rb");
    if (!fin) {
      errorMessage = @"Could not open input file";
      goto cleanup;
    }

    fout = fopen([outputPath UTF8String], "wb");
    if (!fout) {
      errorMessage = @"Could not open output file";
      goto cleanup;
    }

    state = BrotliEncoderCreateInstance(NULL, NULL, NULL);
    if (!state) {
      errorMessage = @"Brotli encoder init failed";
      goto cleanup;
    }

    const int qualityInt = BrotliClampQuality(quality);
    if (BrotliEncoderSetParameter(state, BROTLI_PARAM_QUALITY, (uint32_t)qualityInt) != BROTLI_TRUE ||
        BrotliEncoderSetParameter(state, BROTLI_PARAM_LGWIN, BROTLI_DEFAULT_WINDOW) != BROTLI_TRUE ||
        BrotliEncoderSetParameter(state, BROTLI_PARAM_MODE, BROTLI_MODE_GENERIC) != BROTLI_TRUE) {
      errorMessage = @"Failed to configure Brotli encoder";
      goto cleanup;
    }

    const size_t bufferSize = 65536;
    srcBuffer = (uint8_t *)malloc(bufferSize);
    dstBuffer = (uint8_t *)malloc(bufferSize);
    if (!srcBuffer || !dstBuffer) {
      errorMessage = @"Memory allocation failed";
      goto cleanup;
    }

    size_t availableIn = 0;
    const uint8_t *nextIn = NULL;
    size_t availableOut = bufferSize;
    uint8_t *nextOut = dstBuffer;
    bool isEof = false;

    while (true) {
      if (availableIn == 0 && !isEof) {
        availableIn = fread(srcBuffer, 1, bufferSize, fin);
        nextIn = srcBuffer;

        if (availableIn < bufferSize) {
          if (ferror(fin)) {
            errorMessage = @"Failed to read input file";
            goto cleanup;
          }
          isEof = true;
        }
      }

      BrotliEncoderOperation operation = isEof ? BROTLI_OPERATION_FINISH : BROTLI_OPERATION_PROCESS;
      if (BrotliEncoderCompressStream(
            state,
            operation,
            &availableIn,
            &nextIn,
            &availableOut,
            &nextOut,
            NULL
          ) != BROTLI_TRUE) {
        errorMessage = @"Compression stream processing failed";
        goto cleanup;
      }

      size_t bytesToWrite = bufferSize - availableOut;
      if (bytesToWrite > 0) {
        size_t written = fwrite(dstBuffer, 1, bytesToWrite, fout);
        if (written != bytesToWrite) {
          errorMessage = @"Failed to write output file";
          goto cleanup;
        }
        availableOut = bufferSize;
        nextOut = dstBuffer;
      }

      if (BrotliEncoderIsFinished(state) == BROTLI_TRUE) {
        break;
      }
    }

  } @catch (NSException *exception) {
    errorMessage = exception.reason;
  }

cleanup:
  if (state) BrotliEncoderDestroyInstance(state);
  if (srcBuffer) free(srcBuffer);
  if (dstBuffer) free(dstBuffer);
  if (fin) fclose(fin);
  if (fout) fclose(fout);

  if (errorMessage) {
    reject(@"BROTLI_COMPRESS_ERROR", errorMessage, nil);
  } else {
    resolve(nil);
  }
}

- (void)decompressFile:(NSString *)inputPath
            outputPath:(NSString *)outputPath
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  FILE *fin = NULL;
  FILE *fout = NULL;
  uint8_t *src_buffer = NULL;
  uint8_t *dst_buffer = NULL;
  compression_stream stream;
  compression_status status;

  @try {
    fin = fopen([inputPath UTF8String], "rb");
    if (!fin) {
      reject(@"BROTLI_DECOMPRESS_ERROR", @"Could not open input file", nil);
      return;
    }

    fout = fopen([outputPath UTF8String], "wb");
    if (!fout) {
      fclose(fin);
      reject(@"BROTLI_DECOMPRESS_ERROR", @"Could not open output file", nil);
      return;
    }

    status = compression_stream_init(&stream, COMPRESSION_STREAM_DECODE, COMPRESSION_BROTLI);
    if (status == COMPRESSION_STATUS_ERROR) {
      fclose(fin);
      fclose(fout);
      reject(@"BROTLI_DECOMPRESS_ERROR", @"Stream init failed", nil);
      return;
    }

    size_t buffer_size = 65536;
    src_buffer = (uint8_t *)malloc(buffer_size);
    dst_buffer = (uint8_t *)malloc(buffer_size);

    if (!src_buffer || !dst_buffer) {
      if (src_buffer) free(src_buffer);
      if (dst_buffer) free(dst_buffer);
      compression_stream_destroy(&stream);
      fclose(fin);
      fclose(fout);
      reject(@"BROTLI_DECOMPRESS_ERROR", @"Memory allocation failed", nil);
      return;
    }

    stream.src_ptr = src_buffer;
    stream.src_size = 0;
    stream.dst_ptr = dst_buffer;
    stream.dst_size = buffer_size;

    while (true) {
      if (stream.src_size == 0) {
        size_t bytes_read = fread(src_buffer, 1, buffer_size, fin);
        stream.src_ptr = src_buffer;
        stream.src_size = bytes_read;
        if (bytes_read < buffer_size && ferror(fin)) {
             status = COMPRESSION_STATUS_ERROR;
             break;
        }
      }

      int flags = (feof(fin) && stream.src_size == 0) ? COMPRESSION_STREAM_FINALIZE : 0;
      
      status = compression_stream_process(&stream, flags);

      if (status == COMPRESSION_STATUS_ERROR) {
        break;
      }

      size_t bytes_to_write = buffer_size - stream.dst_size;
      if (bytes_to_write > 0) {
        size_t written = fwrite(dst_buffer, 1, bytes_to_write, fout);
        if (written != bytes_to_write) {
            status = COMPRESSION_STATUS_ERROR;
            break;
        }
        stream.dst_ptr = dst_buffer;
        stream.dst_size = buffer_size;
      }

      if (status == COMPRESSION_STATUS_END) {
        break;
      }
    }

    compression_stream_destroy(&stream);
    free(src_buffer);
    free(dst_buffer);
    fclose(fin);
    fclose(fout);

    if (status == COMPRESSION_STATUS_END) {
      resolve(nil);
    } else {
      reject(@"BROTLI_DECOMPRESS_ERROR", @"Decompression stream processing failed", nil);
    }

  } @catch (NSException *exception) {
    if (fin) fclose(fin);
    if (fout) fclose(fout);
    if (src_buffer) free(src_buffer);
    if (dst_buffer) free(dst_buffer);
    reject(@"BROTLI_DECOMPRESS_ERROR", exception.reason, nil);
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeBrotliSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"Brotli";
}

@end
