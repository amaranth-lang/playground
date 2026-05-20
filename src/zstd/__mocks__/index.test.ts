import { compress, decompress } from './index';

describe('zstd mock functions', () => {
  describe('compress', () => {
    it('should return the same data that was passed in', async () => {
      const inputData = new Uint8Array([1, 2, 3, 4, 5]);
      const dictionaryPromise = Promise.resolve(new Uint8Array([6, 7, 8, 9, 10]));
      
      const result = await compress(inputData, dictionaryPromise);
      
      expect(result).toEqual(inputData);
    });

    it('should handle empty input arrays', async () => {
      const inputData = new Uint8Array([]);
      const dictionaryPromise = Promise.resolve(new Uint8Array([1, 2, 3]));
      
      const result = await compress(inputData, dictionaryPromise);
      
      expect(result).toEqual(inputData);
    });

    it('should handle dictionary correctly', async () => {
      const inputData = new Uint8Array([10, 20, 30]);
      const dictionaryData = new Uint8Array([40, 50, 60]);
      const dictionaryPromise = Promise.resolve(dictionaryData);
      
      const result = await compress(inputData, dictionaryPromise);
      
      // The result should be the input data, not modified by the dictionary
      expect(result).toEqual(inputData);
    });

    it('should work with a complex dictionary promise', async () => {
      const inputData = new Uint8Array([100, 200]);
      const dictionaryPromise = new Promise<Uint8Array>((resolve) => {
        setTimeout(() => resolve(new Uint8Array([1, 1, 1, 1])), 10);
      });
      
      const result = await compress(inputData, dictionaryPromise);
      
      expect(result).toEqual(inputData);
    });
  });

  describe('decompress', () => {
    it('should return the same data that was passed in', async () => {
      const inputData = new Uint8Array([5, 4, 3, 2, 1]);
      const dictionaryPromise = Promise.resolve(new Uint8Array([10, 9, 8, 7, 6]));
      
      const result = await decompress(inputData, dictionaryPromise);
      
      expect(result).toEqual(inputData);
    });

    it('should handle empty input arrays', async () => {
      const inputData = new Uint8Array([]);
      const dictionaryPromise = Promise.resolve(new Uint8Array([3, 2, 1]));
      
      const result = await decompress(inputData, dictionaryPromise);
      
      expect(result).toEqual(inputData);
    });

    it('should handle dictionary correctly', async () => {
      const inputData = new Uint8Array([30, 20, 10]);
      const dictionaryData = new Uint8Array([60, 50, 40]);
      const dictionaryPromise = Promise.resolve(dictionaryData);
      
      const result = await decompress(inputData, dictionaryPromise);
      
      // The result should be the input data, not modified by the dictionary
      expect(result).toEqual(inputData);
    });

    it('should work with a complex dictionary promise', async () => {
      const inputData = new Uint8Array([200, 100]);
      const dictionaryPromise = new Promise<Uint8Array>((resolve) => {
        setTimeout(() => resolve(new Uint8Array([2, 2, 2, 2])), 10);
      });
      
      const result = await decompress(inputData, dictionaryPromise);
      
      expect(result).toEqual(inputData);
    });
  });

  describe('compress and decompress round trip', () => {
    it('should return original data after compress and decompress', async () => {
      const originalData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const dictionary = new Uint8Array([9, 10, 11, 12]);
      const dictionaryPromise = Promise.resolve(dictionary);
      
      // Compress the data
      const compressed = await compress(originalData, dictionaryPromise);
      
      // Since this is a mock, compressed should equal original
      expect(compressed).toEqual(originalData);
      
      // Decompress the data (with the same dictionary)
      const decompressed = await decompress(compressed, Promise.resolve(dictionary));
      
      // Since this is a mock, decompressed should equal original
      expect(decompressed).toEqual(originalData);
    });
  });
});