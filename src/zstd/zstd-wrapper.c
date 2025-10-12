/*
 * Generate zstd.c:
 *     git clone https://github.com/facebook/zstd.git \
 *         --revision 23dae4bf49a8b36ab88509c85137b49f74bbc76d
 *     git -C zstd apply < zstd.patch
 *     cd zstd/build/single_file_libs
 *     ./combine.py -r ../../lib -x legacy/zstd_legacy.h -o zstd.c zstd-in.c
 *
 * Build:
 *     clang --target=wasm32-wasi --std=c23 -Oz -nostdlib -flto \
 *         -Wl,--no-entry -Wl,--lto-O3 zstd-wrapper.c -o zstd-wrapper.wasm
 *     wasm-opt --enable-bulk-memory-opt -c -Oz zstd-wrapper.wasm -o zstd-wrapper.wasm
 *     wasm-strip zstd-wrapper.wasm
 */

#include <stddef.h>
#include <stdbool.h>

extern void __heap_base;

bool malloc_initialized = false;
char *heap_end = 0;

void *malloc(size_t size)
{
	if (size == 0) {
		return nullptr;
	}
	if (!malloc_initialized) {
		heap_end = &__heap_base;
		malloc_initialized = true;
	}
	size_t avail_pages = __builtin_wasm_memory_size(0);
	size_t used_pages = (((size_t)heap_end + size - 1) / 0x10000) + 1;
	if (used_pages > avail_pages) {
		__builtin_wasm_memory_grow(0, used_pages - avail_pages);
	}
	char *ptr = heap_end;
	heap_end += size;
	return ptr;
}

void *calloc(size_t count, size_t size)
{
	void *ptr = malloc(count * size);
	__builtin_memset(ptr, 0, count * size);
	return ptr;
}

void free(void *ptr)
{
	// do nothing
}

#include "zstd.c"

#define COMPRESSION_LEVEL 19

struct result {
	uint32_t error;
	size_t size;
	uint8_t *data;
};

[[clang::export_name("allocate")]]
void *allocate(size_t size)
{
	return malloc(size);
}

#ifndef DISABLE_COMPRESSION

[[clang::export_name("compress")]]
struct result *compress(char *decompressed_data, size_t decompressed_size,
		char *dictionary_data, size_t dictionary_size)
{
	struct result *result = malloc(sizeof(struct result));
	memset(result, 0, sizeof(struct result));

	ZSTD_CCtx *cctx = ZSTD_createCCtx();
	ZSTD_CCtx_setParameter(cctx, ZSTD_c_compressionLevel, COMPRESSION_LEVEL);
	ZSTD_CCtx_setParameter(cctx, ZSTD_c_checksumFlag, 0);
	ZSTD_CCtx_setParameter(cctx, ZSTD_c_dictIDFlag, 0);

	size_t load_dict_result = ZSTD_CCtx_loadDictionary(cctx,
			dictionary_data, dictionary_size);
	if (ZSTD_isError(load_dict_result)) {
		result->error = ZSTD_getErrorCode(load_dict_result);
		return result;
	}

	size_t compressed_cap = ZSTD_compressBound(decompressed_size);
	char *compressed_data = malloc(compressed_cap);

	size_t compressed_size = ZSTD_compress2(cctx,
			compressed_data, compressed_cap,
			decompressed_data, decompressed_size);

	ZSTD_freeCCtx(cctx);

	if (ZSTD_isError(compressed_size)) {
		free(compressed_data);
		result->error = ZSTD_getErrorCode(compressed_size);
		return result;
	}

	result->size = compressed_size;
	result->data = compressed_data;
	return result;
}

#endif

#ifndef DISABLE_DECOMPRESSION

[[clang::export_name("decompress")]]
struct result *decompress(char *compressed_data, size_t compressed_size,
		char *dictionary_data, size_t dictionary_size)
{
	struct result *result = malloc(sizeof(struct result));
	memset(result, 0, sizeof(struct result));

	uint64_t decompressed_cap = ZSTD_getFrameContentSize(
			compressed_data, compressed_size);
	if (decompressed_cap == ZSTD_CONTENTSIZE_UNKNOWN ||
			decompressed_cap == ZSTD_CONTENTSIZE_ERROR) {
		result->error = (decompressed_cap ^ (0ULL - 1)) + 1001;
		return result;
	}

	char *decompressed_data = malloc(decompressed_cap);

	ZSTD_DCtx *dctx = ZSTD_createDCtx();
	size_t decompressed_size = ZSTD_decompress_usingDict(dctx,
			decompressed_data, decompressed_cap,
			compressed_data, compressed_size,
			dictionary_data, dictionary_size);
	ZSTD_freeDCtx(dctx);

	if (ZSTD_isError(decompressed_size)) {
		free(decompressed_data);
		result->error = ZSTD_getErrorCode(decompressed_size);
		return result;
	}

	result->size = decompressed_size;
	result->data = decompressed_data;
	return result;
}

#endif

[[clang::export_name("get_result_error")]]
uint32_t get_result_error(struct result *result)
{
	return result->error;
}

[[clang::export_name("get_result_size")]]
size_t get_result_size(struct result *result)
{
	return result->size;
}

[[clang::export_name("get_result_data")]]
uint8_t *get_result_data(struct result *result)
{
	return result->data;
}
