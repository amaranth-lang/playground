// Slightly cursed wrapper to integrate with esbuild.

import 'pyodide/pyodide.asm.js';
// @ts-ignore
import pyodideStdLib from 'pyodide/python_stdlib.zip';
import pyodideLockFile from 'pyodide/pyodide-lock.json';
import { loadPyodide as originalLoadPyodide } from 'pyodide';

export type { PyodideInterface } from 'pyodide';
export type { PyProxy } from 'pyodide/ffi';

export const loadPyodide: typeof originalLoadPyodide = function(options) {
    return originalLoadPyodide({
        indexURL: '.',
        stdLibURL: pyodideStdLib,
        // @ts-ignore
        lockFileURL: pyodideLockFile,
        ...options
    });
}
