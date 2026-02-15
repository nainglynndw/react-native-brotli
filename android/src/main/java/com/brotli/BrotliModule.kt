package com.brotli

import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import org.brotli.dec.BrotliInputStream
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException

class BrotliModule(reactContext: ReactApplicationContext) :
  NativeBrotliSpec(reactContext) {

  override fun compress(data: String, quality: Double, promise: Promise) {
    try {
      val inputBytes = Base64.decode(data, Base64.DEFAULT)
      val qualityInt = quality.toInt().coerceIn(0, 11)

      val compressed = BrotliEncoder.compress(inputBytes, qualityInt)
        ?: throw Exception("Native brotli encoder returned null")

      val result = Base64.encodeToString(compressed, Base64.NO_WRAP)
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("BROTLI_COMPRESS_ERROR", "Failed to compress data: ${e.message}", e)
    }
  }

  override fun decompress(data: String, promise: Promise) {
    try {
      val inputBytes = Base64.decode(data, Base64.DEFAULT)
      val inputStream = ByteArrayInputStream(inputBytes)
      val brotliStream = BrotliInputStream(inputStream)
      val decompressed = brotliStream.readBytes()
      val result = String(decompressed, Charsets.UTF_8)
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("BROTLI_DECOMPRESS_ERROR", "Failed to decompress data: ${e.message}", e)
    }
  }

  override fun decompressToBase64(data: String, promise: Promise) {
    try {
      val inputBytes = Base64.decode(data, Base64.DEFAULT)
      val inputStream = ByteArrayInputStream(inputBytes)
      val brotliStream = BrotliInputStream(inputStream)
      val decompressed = brotliStream.readBytes()
      val result = Base64.encodeToString(decompressed, Base64.NO_WRAP)
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("BROTLI_DECOMPRESS_ERROR", "Failed to decompress data: ${e.message}", e)
    }
  }



  override fun compressFile(inputPath: String, outputPath: String, quality: Double, promise: Promise) {
    try {
      val qualityInt = quality.toInt().coerceIn(0, 11)
      val success = BrotliEncoder.compressFile(inputPath, outputPath, qualityInt)
      if (success) {
        promise.resolve(null)
      } else {
        promise.reject("BROTLI_COMPRESS_ERROR", "Failed to compress file")
      }
    } catch (e: Exception) {
      promise.reject("BROTLI_COMPRESS_ERROR", "Failed to compress file: ${e.message}", e)
    }
  }

  override fun decompressFile(inputPath: String, outputPath: String, promise: Promise) {
    var inputStream: FileInputStream? = null
    var brotliStream: BrotliInputStream? = null
    var outputStream: FileOutputStream? = null
    try {
      inputStream = FileInputStream(File(inputPath))
      brotliStream = BrotliInputStream(inputStream)
      outputStream = FileOutputStream(File(outputPath))
      
      val buffer = ByteArray(8192)
      var bytesRead: Int
      while (brotliStream.read(buffer).also { bytesRead = it } != -1) {
        outputStream.write(buffer, 0, bytesRead)
      }
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("BROTLI_DECOMPRESS_ERROR", "Failed to decompress file: ${e.message}", e)
    } finally {
      try {
        brotliStream?.close()
        inputStream?.close()
        outputStream?.close()
      } catch (e: IOException) {
        // Ignore close errors
      }
    }
  }

  companion object {
    const val NAME = NativeBrotliSpec.NAME
  }
}
