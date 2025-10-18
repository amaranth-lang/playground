# Amaranth Playground

This repository contains the source code for the [Amaranth Playground][], a web application that introduces developers to the [Amaranth HDL][] with zero installation required.

[amaranth playground]: https://amaranth-lang.org/play/
[amaranth hdl]: https://amaranth-lang.org/

## Technical details

This application is built on:

* [TypeScript](https://typescriptlang.org/)
* [React](https://react.dev)
* [MUI (Joy UI)](https://mui.com/joy-ui/getting-started/)
* [Monaco](https://microsoft.github.io/monaco-editor/)
* [d3-wave](https://github.com/Nic30/d3-wave)
* [Pyodide](https://pyodide.org/en/stable/)
* [YoWASP](https://yowasp.org)
* [esbuild](https://esbuild.github.io/)

The amount of dependencies is intentionally kept minimal. All code processing tasks (TypeScript compilation, minification, bundling, polyfilling/transpilation, serving in development) are performed by esbuild, which is amazingly flexible and useful.

## Development

Requires [Node.js](https://nodejs.org/) and  [npm](https://npmjs.org/). Install them and run:

```console
npm install
npm run serve
```

This will start a local server at http://localhost:8010/ (or a subsequent port if this one is in use). Any modifications to the source will cause the application to be reloaded with the modifications applied.

If you are using Visual Studio Code, you can also use <kbd>Shift</kbd>+<kbd>Ctrl</kbd>+<kbd>B</kbd> instead.

## Publication

Except in the `amaranth-lang/playground` repository, the latest commit in the `main` branch is built and the result is published to the `gh-pages` branch. (This lets you show the changes made in your fork to others without them building the application on their machine.)

Only in the `amaranth-lang/playground` repository, the latest commit in the `main` branch is built and the result is published to the `pages` branch, which in turn is published at https://amaranth-lang.org/play/ via a webhook.

## License

This application is released under the [two-clause BSD license](LICENSE.txt).
