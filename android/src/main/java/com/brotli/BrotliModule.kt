package com.brotli

import com.facebook.react.bridge.ReactApplicationContext

class BrotliModule(reactContext: ReactApplicationContext) :
  NativeBrotliSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeBrotliSpec.NAME
  }
}
