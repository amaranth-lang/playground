// Mock version of the zstd module for testing purposes
// This version fixes the TypeScript issues that exist in the original file

export async function compress(data: Uint8Array, dictionaryPromise: Promise<Uint8Array>) {
  // Mock implementation
  const dictionary = await dictionaryPromise;
  // Just return the input data as "compressed" for testing
  return data;
}

export async function decompress(data: Uint8Array, dictionaryPromise: Promise<Uint8Array>) {
  // Mock implementation
  const dictionary = await dictionaryPromise;
  // Just return the input data as "decompressed" for testing
  return data;
}