package com.brotli

/**
 * JNI bridge to the native Brotli encoder (Google brotli C library via NDK).
 */
object BrotliEncoder {
    init {
        System.loadLibrary("brotli_jni")
    }

    /**
     * Compress input bytes using Brotli.
     * @param input The raw bytes to compress
     * @param quality Compression quality (0-11)
     * @return Compressed bytes, or null on failure
     */
    @JvmStatic
    external fun compress(input: ByteArray, quality: Int): ByteArray?

    /**
     * Compress a file using Brotli.
     * @param inputPath Path to input file
     * @param outputPath Path to output file
     * @param quality Compression quality (0-11)
     * @return true if successful, false otherwise
     */
    @JvmStatic
    external fun compressFile(inputPath: String, outputPath: String, quality: Int): Boolean
}
