let modules = new Map<string, Promise<WebAssembly.Module>>();

async function createWasmInstance(moduleURL: string) {
  let instance: WebAssembly.Instance;
  if (!modules.has(moduleURL)) {
    let promiseWithResolvers = Promise.withResolvers<WebAssembly.Module>();
    modules.set(moduleURL, promiseWithResolvers.promise);
    let result = await WebAssembly.instantiateStreaming(fetch(moduleURL));
    instance = result.instance;
    promiseWithResolvers.resolve(result.module);
  } else {
    instance = await WebAssembly.instantiate(await modules.get(moduleURL));
  }
  return {
    instance,
    exports: instance.exports as {
      memory: WebAssembly.Memory;

      allocate: (size: number) => number;

      compress: (
        decompressed_data: number, decompressed_size: number,
        dictionary_data: number, dictionary_size: number,
      ) => number;

      decompress: (
        compressed_data: number, compressed_size: number,
        dictionary_data: number, dictionary_size: number,
      ) => number;

      get_result_error: (result: number) => number;
      get_result_size: (result: number) => number;
      get_result_data: (result: number) => number;
    }
  };
}

export async function compress(data: Uint8Array, dictionaryPromise: Promise<Uint8Array>) {
  let [{ exports }, dictionary] = await Promise.all([
    createWasmInstance(new URL('zstd-wrapper.wasm', import.meta.url).toString()),
    dictionaryPromise,
  ]);

  let {
    memory, allocate, compress,
    get_result_error,
    get_result_size,
    get_result_data,
  } = exports;

  let dictionaryPtr = allocate(dictionary.byteLength);
  new Uint8Array(memory.buffer, dictionaryPtr, dictionary.byteLength).set(dictionary);

  let dataPtr = allocate(data.byteLength);
  new Uint8Array(memory.buffer, dataPtr, data.byteLength).set(data);

  let resultPtr = compress(
    dataPtr, data.byteLength,
    dictionaryPtr, dictionary.byteLength,
  );

  let error = get_result_error(resultPtr);
  let size = get_result_size(resultPtr);
  let compressed_data = get_result_data(resultPtr);

  if (error !== 0) {
    throw new Error(`Zstandard compression error ${error}`);
  }

  return new Uint8Array(memory.buffer, compressed_data, size);
}

export async function decompress(data: Uint8Array, dictionaryPromise: Promise<Uint8Array>) {
  let [{ exports }, dictionary] = await Promise.all([
    createWasmInstance(new URL('zstd-wrapper.wasm', import.meta.url).toString()),
    dictionaryPromise,
  ]);

  let {
    memory, allocate, decompress,
    get_result_error,
    get_result_size,
    get_result_data,
  } = exports;

  let dictionaryPtr = allocate(dictionary.byteLength);
  new Uint8Array(memory.buffer, dictionaryPtr, dictionary.byteLength).set(dictionary);

  let dataPtr = allocate(data.byteLength);
  new Uint8Array(memory.buffer, dataPtr, data.byteLength).set(data);

  let resultPtr = decompress(
    dataPtr, data.byteLength,
    dictionaryPtr, dictionary.byteLength,
  );

  let error = get_result_error(resultPtr);
  let size = get_result_size(resultPtr);
  let compressed_data = get_result_data(resultPtr);

  if (error !== 0) {
    throw new Error(`Zstandard decompression error ${error}`);
  }

  return new Uint8Array(memory.buffer, compressed_data, size);
}
