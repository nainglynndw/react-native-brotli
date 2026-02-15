#include <jni.h>
#include <cstdlib>
#include <cstring>
#include <cstdio>
#include "brotli/encode.h"

extern "C" {

JNIEXPORT jbyteArray JNICALL
Java_com_brotli_BrotliEncoder_compress(
    JNIEnv *env,
    jclass /* clazz */,
    jbyteArray input,
    jint quality) {

    jsize inputLength = env->GetArrayLength(input);
    jbyte *inputBytes = env->GetByteArrayElements(input, nullptr);
    if (!inputBytes) {
        return nullptr;
    }

    // Maximum compressed size
    size_t maxOutputLength = BrotliEncoderMaxCompressedSize(static_cast<size_t>(inputLength));
    if (maxOutputLength == 0) {
        maxOutputLength = inputLength + 1024;
    }

    uint8_t *outputBuffer = static_cast<uint8_t *>(malloc(maxOutputLength));
    if (!outputBuffer) {
        env->ReleaseByteArrayElements(input, inputBytes, JNI_ABORT);
        return nullptr;
    }

    size_t encodedSize = maxOutputLength;
    BROTLI_BOOL result = BrotliEncoderCompress(
        quality,
        BROTLI_DEFAULT_WINDOW,
        BROTLI_DEFAULT_MODE,
        static_cast<size_t>(inputLength),
        reinterpret_cast<const uint8_t *>(inputBytes),
        &encodedSize,
        outputBuffer
    );

    env->ReleaseByteArrayElements(input, inputBytes, JNI_ABORT);

    if (result != BROTLI_TRUE) {
        free(outputBuffer);
        return nullptr;
    }

    jbyteArray output = env->NewByteArray(static_cast<jsize>(encodedSize));
    if (output) {
        env->SetByteArrayRegion(output, 0, static_cast<jsize>(encodedSize),
                                reinterpret_cast<jbyte *>(outputBuffer));
    }

    free(outputBuffer);
    return output;
}

JNIEXPORT jboolean JNICALL
Java_com_brotli_BrotliEncoder_compressFile(
    JNIEnv *env,
    jclass /* clazz */,
    jstring inputPath,
    jstring outputPath,
    jint quality) {

    const char *inputPathStr = env->GetStringUTFChars(inputPath, nullptr);
    const char *outputPathStr = env->GetStringUTFChars(outputPath, nullptr);

    FILE *fin = fopen(inputPathStr, "rb");
    FILE *fout = fopen(outputPathStr, "wb");

    if (!fin || !fout) {
        if (fin) fclose(fin);
        if (fout) fclose(fout);
        env->ReleaseStringUTFChars(inputPath, inputPathStr);
        env->ReleaseStringUTFChars(outputPath, outputPathStr);
        return false;
    }

    BrotliEncoderState *state = BrotliEncoderCreateInstance(nullptr, nullptr, nullptr);
    if (!state) {
        fclose(fin);
        fclose(fout);
        env->ReleaseStringUTFChars(inputPath, inputPathStr);
        env->ReleaseStringUTFChars(outputPath, outputPathStr);
        return false;
    }

    BrotliEncoderSetParameter(state, BROTLI_PARAM_QUALITY, quality);
    BrotliEncoderSetParameter(state, BROTLI_PARAM_LGWIN, BROTLI_DEFAULT_WINDOW);
    BrotliEncoderSetParameter(state, BROTLI_PARAM_MODE, BROTLI_DEFAULT_MODE);

    const size_t kBufferSize = 65536;
    uint8_t *inputBuffer = (uint8_t *)malloc(kBufferSize);
    uint8_t *outputBuffer = (uint8_t *)malloc(kBufferSize);

    if (!inputBuffer || !outputBuffer) {
        if (inputBuffer) free(inputBuffer);
        if (outputBuffer) free(outputBuffer);
        BrotliEncoderDestroyInstance(state);
        fclose(fin);
        fclose(fout);
        env->ReleaseStringUTFChars(inputPath, inputPathStr);
        env->ReleaseStringUTFChars(outputPath, outputPathStr);
        return false;
    }

    size_t available_in = 0;
    const uint8_t *next_in = nullptr;
    size_t available_out = kBufferSize;
    uint8_t *next_out = outputBuffer;
    BROTLI_BOOL result = BROTLI_TRUE;
    bool is_eof = false;

    while (true) {
        if (available_in == 0 && !is_eof) {
            available_in = fread(inputBuffer, 1, kBufferSize, fin);
            next_in = inputBuffer;
            if (available_in < kBufferSize) {
                if (ferror(fin)) {
                    result = BROTLI_FALSE;
                    break;
                }
                is_eof = true;
            }
        }

        if (!BrotliEncoderCompressStream(
                state,
                is_eof ? BROTLI_OPERATION_FINISH : BROTLI_OPERATION_PROCESS,
                &available_in,
                &next_in,
                &available_out,
                &next_out,
                nullptr)) {
            result = BROTLI_FALSE;
            break;
        }

        if (available_out < kBufferSize) {
            size_t out_size = kBufferSize - available_out;
            if (fwrite(outputBuffer, 1, out_size, fout) != out_size) {
                result = BROTLI_FALSE;
                break;
            }
            available_out = kBufferSize;
            next_out = outputBuffer;
        }

        if (BrotliEncoderIsFinished(state)) {
            break;
        }
    }

    free(inputBuffer);
    free(outputBuffer);
    BrotliEncoderDestroyInstance(state);
    fclose(fin);
    fclose(fout);
    env->ReleaseStringUTFChars(inputPath, inputPathStr);
    env->ReleaseStringUTFChars(outputPath, outputPathStr);

    return (jboolean)(result == BROTLI_TRUE);
}

} // extern "C"
