cmake_minimum_required(VERSION 3.13)
project(brotli_jni)

# Brotli encoder sources
set(BROTLI_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../cpp/brotli/c)

# Common sources
file(GLOB BROTLI_COMMON_SOURCES "${BROTLI_DIR}/common/*.c")

# Encoder sources
file(GLOB BROTLI_ENC_SOURCES "${BROTLI_DIR}/enc/*.c")

# Build brotli encoder as static lib
add_library(brotli_enc STATIC
    ${BROTLI_COMMON_SOURCES}
    ${BROTLI_ENC_SOURCES}
)

target_include_directories(brotli_enc PUBLIC
    ${BROTLI_DIR}/include
)

# Build JNI shared library
add_library(brotli_jni SHARED
    ${CMAKE_CURRENT_SOURCE_DIR}/../cpp/brotli_jni.cpp
)

target_include_directories(brotli_jni PRIVATE
    ${BROTLI_DIR}/include
)

target_link_libraries(brotli_jni
    brotli_enc
    log
)
