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

## License

This application is released under the [two-clause BSD license](LICENSE.txt).
