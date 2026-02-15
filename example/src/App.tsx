import { useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {
  compress,
  decompress,
  decompressToBase64,
  compressFile,
  decompressFile,
} from 'react-native-brotli';
import RNFS from 'react-native-fs';

// Note: Android interceptor is configured automatically by the library.

// Helper to convert string to base64
function stringToBase64(str: string): string {
  // Simple base64 encoding using btoa-compatible approach
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  const binary = String.fromCharCode(...bytes);
  return btoa(binary);
}

export default function App() {
  const [compressResult, setCompressResult] = useState<string>('');
  const [fileResult, setFileResult] = useState<string>('');
  const [decompressResult, setDecompressResult] = useState<string>('');
  const [decompressB64Result, setDecompressB64Result] = useState<string>('');
  const [interceptorStatus, setInterceptorStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testString = `The standard Lorem Ipsum passage, used since the 1500s
"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"

1914 translation by H. Rackham
"But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"

Section 1.10.33 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
"At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."

1914 translation by H. Rackham
"On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains."

`;

  const handleCompress = useCallback(async () => {
    try {
      setError('');
      const base64Input = stringToBase64(testString);
      const compressed = await compress(base64Input, 6);
      setCompressResult(compressed);

      // Add stats to the result
      const ratio = ((1 - compressed.length / base64Input.length) * 100).toFixed(1);
      console.log(`Text:${testString.length}, Input: ${base64Input.length} chars, Output: ${compressed.length} chars, Ratio: ${ratio}%`);

      // Also decompress to verify round-trip
      const decompressed = await decompress(compressed);
      setDecompressResult(decompressed);

      // And decompressToBase64
      const decompressedB64 = await decompressToBase64(compressed);
      setDecompressB64Result(decompressedB64);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    }
  }, [testString]);

  const handleCompressFile = useCallback(async () => {
    try {
      setError('');
      setFileResult('Processing file...');
      
      const inputPath = `${RNFS.CachesDirectoryPath}/test_input.txt`;
      const compressedPath = `${RNFS.CachesDirectoryPath}/test_output.br`;
      const decompressedPath = `${RNFS.CachesDirectoryPath}/test_decompressed.txt`;

      // 1. Write content to file
      await RNFS.writeFile(inputPath, testString, 'utf8');
      const inputStat = await RNFS.stat(inputPath);

      // 2. Compress File
      const startTime = Date.now();
      await compressFile(inputPath, compressedPath);
      const compressTime = Date.now() - startTime;
      
      const compressedStat = await RNFS.stat(compressedPath);

      // 3. Decompress File
      await decompressFile(compressedPath, decompressedPath);
      const decompressedContent = await RNFS.readFile(decompressedPath, 'utf8');

      // 4. Verify
      const match = decompressedContent === testString;
      const ratio = ((1 - compressedStat.size / inputStat.size) * 100).toFixed(1);

      setFileResult(
        `File Compression Success!\n` +
        `Input Size: ${inputStat.size} bytes\n` +
        `Compressed Size: ${compressedStat.size} bytes (${ratio}% reduction)\n` +
        `Time: ${compressTime}ms\n` +
        `Content Match: ${match ? '✅ YES' : '❌ NO'}`
      );

    } catch (e: any) {
      setError(`File Error: ${e.message}`);
      setFileResult('');
    }
  }, [testString]);

  const handleTestNetwork = useCallback(async () => {
    try {
      setError('');
      setInterceptorStatus('Fetching https://httpbin.org/brotli ...');
      
      const response = await fetch('https://httpbin.org/brotli');
      console.log('Response Headers:', JSON.stringify(response.headers, null, 2));

      const contentEncoding = response.headers.get('content-encoding');
      const originalEncoding = response.headers.get('x-original-content-encoding');

      let bodyText;
      let isJson = false;
      try {
        const text = await response.text();
        bodyText = text;
        JSON.parse(text); // Try parsing
        isJson = true;
      } catch (e) {
        // If not JSON, it might be binary garbage
        isJson = false;
      }

      setInterceptorStatus(
        `Status: ${response.status}\n` +
        `Content-Encoding: ${contentEncoding || 'none'}\n` +
        `Original Encoding (Debug): ${originalEncoding || 'none'}\n` +
        `Is JSON: ${isJson ? 'YES' : 'NO'}\n` +
        `Body Preview: ${bodyText ? bodyText.substring(0, 100) : 'empty'}...`
      );

      if (!isJson) {
        console.log('Raw Body:', bodyText);
      }
    } catch (e: any) {
      console.log('Network Error:', e);
      setError(`Network Error: ${e.message}`);
      setInterceptorStatus('');
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>React Native Brotli</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Test String:</Text>
        <Text style={styles.value}>{testString}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCompress}>
        <Text style={styles.buttonText}>Compress & Decompress</Text>
      </TouchableOpacity>

      {compressResult !== '' && (
        <View style={styles.section}>
          <Text style={styles.label}>Compressed (base64):</Text>
          <Text style={styles.value} numberOfLines={3}>
            {compressResult}
          </Text>
           <Text style={styles.stats}>
            Original Text: {testString.length} chars
          </Text>
          <Text style={styles.stats}>
            Size: {compressResult.length} chars (Original: {stringToBase64(testString).length} chars)
          </Text>
          <Text style={styles.stats}>
            Compression: {((1 - compressResult.length / stringToBase64(testString).length) * 100).toFixed(1)}%
          </Text>
        </View>
      )}

      {decompressResult !== '' && (
        <View style={styles.section}>
          <Text style={styles.label}>Decompressed (UTF-8):</Text>
          <Text style={styles.value}>{decompressResult}</Text>
          <Text style={styles.match}>
            {decompressResult === testString ? '✅ Match!' : '❌ Mismatch!'}
          </Text>
        </View>
      )}

      {decompressB64Result !== '' && (
        <View style={styles.section}>
          <Text style={styles.label}>Decompress to Base64:</Text>
          <Text style={styles.value} numberOfLines={3}>
            {decompressB64Result}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleCompressFile}>
        <Text style={styles.buttonText}>Test File Compression</Text>
      </TouchableOpacity>

      {fileResult !== '' && (
        <View style={styles.section}>
          <Text style={styles.label}>File Test Result:</Text>
          <Text style={styles.value}>{fileResult}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleTestNetwork}>
        <Text style={styles.buttonText}>Test Network Request (httpbin.org/brotli)</Text>
      </TouchableOpacity>

      {interceptorStatus !== '' && (
        <View style={styles.section}>
          <Text style={styles.value}>{interceptorStatus}</Text>
        </View>
      )}

      {error !== '' && (
        <View style={[styles.section, styles.errorSection]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  match: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorSection: {
    backgroundColor: '#fee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
  stats: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
