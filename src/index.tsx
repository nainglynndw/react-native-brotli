import NativeBrotli from './NativeBrotli';

const DEFAULT_QUALITY = 6;

// ========== Base64 API (String) ==========

/**
 * Compress a base64-encoded string using Brotli.
 * @param data - Base64-encoded input data
 * @param quality - Compression quality (0-11, default: 6)
 * @returns Base64-encoded compressed data
 */
export function compress(
  data: string,
  quality: number = DEFAULT_QUALITY
): Promise<string> {
  return NativeBrotli.compress(data, quality);
}

/**
 * Decompress Brotli-compressed base64 data to a UTF-8 string.
 * @param data - Base64-encoded Brotli-compressed data
 * @returns Decompressed UTF-8 string
 */
export function decompress(data: string): Promise<string> {
  return NativeBrotli.decompress(data);
}

/**
 * Decompress Brotli-compressed base64 data, returning base64.
 * @param data - Base64-encoded Brotli-compressed data
 * @returns Base64-encoded decompressed data
 */
export function decompressToBase64(data: string): Promise<string> {
  return NativeBrotli.decompressToBase64(data);
}

// ========== File API (Path) ==========

/**
 * Compress a file using Brotli.
 *
 * @param inputPath - Absolute path to the input file
 * @param outputPath - Absolute path to the output file
 * @param quality - Compression quality (0-11, default: 6). Higher quality is slower but better compression.
 */
export function compressFile(
  inputPath: string,
  outputPath: string,
  quality: number = DEFAULT_QUALITY
): Promise<void> {
  return NativeBrotli.compressFile(inputPath, outputPath, quality);
}

/**
 * Decompress a Brotli-compressed file.
 *
 * @param inputPath - Absolute path to the compressed input file
 * @param outputPath - Absolute path to the decompressed output file
 */
export function decompressFile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return NativeBrotli.decompressFile(inputPath, outputPath);
}
