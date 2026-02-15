import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  // Base64 API (existing)
  compress(data: string, quality: number): Promise<string>;
  decompress(data: string): Promise<string>;
  decompressToBase64(data: string): Promise<string>;

  // File-based API
  compressFile(
    inputPath: string,
    outputPath: string,
    quality: number
  ): Promise<void>;
  decompressFile(inputPath: string, outputPath: string): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Brotli');
