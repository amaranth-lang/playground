import * as process from 'node:process';
import * as child_process from 'node:child_process';
import * as esbuild from 'esbuild';
import metaUrlPlugin from '@chialab/esbuild-plugin-meta-url';

const gitCommit = child_process.execSync('git rev-parse HEAD', { encoding: 'utf-8' }).replace(/\n$/, '');

const mode = (process.argv[2] ?? 'build');
const options = {
    logLevel: 'info',
    plugins: [metaUrlPlugin()],
    bundle: true,
    loader: {
        '.html': 'copy',
        '.svg': 'dataurl',
        '.ttf': 'file',
        '.woff': 'file',
        '.woff2': 'file',
        '.json': 'file',
        '.wasm': 'file',
        '.asm.wasm': 'copy',
        '.zip': 'file',
    },
    external: [
        'fs/promises', // @yowasp/yosys
        'node-fetch', // pyodide
    ],
    define: {
        'globalThis.GIT_COMMIT': `"${mode === 'minify' ? gitCommit : 'HEAD'}"`,
        'globalThis.IS_PRODUCTION': (mode === 'minify' ? 'true' : 'false'),
    },
    target: 'es2022',
    format: 'esm',
    sourcemap: 'linked',
    minify: (mode === 'minify'),
    outdir: 'dist',
    entryPoints: {
        'index': './src/index.html',
        'app': './src/app.tsx',
        'app.worker': './src/worker.ts',
        'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
        'pyodide.asm': 'pyodide/pyodide.asm.wasm',
    },
};

if (mode === 'build' || mode === 'minify') {
    await esbuild.build(options);
} else if (mode === 'watch') {
    const context = await esbuild.context(options);
    await context.watch();
} else if (mode === 'serve') {
    const context = await esbuild.context(options);
    await context.rebuild();
    await context.watch();
    // Specifying `servedir` is necessary for files built by meta URL plugin to be accessible.
    await context.serve({ servedir: 'dist', port: 8010 });
} else {
    console.error(`Usage: ${process.argv0} [build|watch|serve|minify]`);
}
