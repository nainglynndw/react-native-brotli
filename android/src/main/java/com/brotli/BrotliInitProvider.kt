package com.brotli

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.react.modules.network.OkHttpClientFactory
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.brotli.BrotliInterceptor

class BrotliInitProvider : ContentProvider() {

  override fun onCreate(): Boolean {
    // Automatically configure the OkHttp client factory at startup
    try {
      OkHttpClientProvider.setOkHttpClientFactory(object : OkHttpClientFactory {
        override fun createNewNetworkModuleClient(): OkHttpClient {
          return OkHttpClientProvider.createClientBuilder()
            .addInterceptor(BrotliInterceptor)
            .addNetworkInterceptor { chain ->
                val originalResponse = chain.proceed(chain.request())
                if ("br".equals(originalResponse.header("content-encoding"), ignoreCase = true)) {
                    originalResponse.newBuilder()
                        .header("X-Original-Content-Encoding", "br")
                        .build()
                } else {
                    originalResponse
                }
            }
            .build()
        }
      })
    } catch (e: Exception) {
      // In case of any initialization error (e.g. class loading), we fail silently
      // to avoid crashing the app startup. The user can still configure manually if needed.
    }
    return true
  }

  override fun query(uri: Uri, projection: Array<out String>?, selection: String?, selectionArgs: Array<out String>?, sortOrder: String?): Cursor? = null
  override fun getType(uri: Uri): String? = null
  override fun insert(uri: Uri, values: ContentValues?): Uri? = null
  override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0
  override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?): Int = 0
}
