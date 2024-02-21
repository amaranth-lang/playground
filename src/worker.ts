import { loadPyodide, PyodideInterface, PyProxy } from './pyodide';
import { runYosys, Exit as YosysExit } from '@yowasp/yosys';

import { HostToWorkerMessage, WorkerToHostMessage } from './proto';

function postMessage(data: WorkerToHostMessage, transfer?: Transferable[]) {
  console.log('[Worker] Sending', data);
  self.postMessage(data, { transfer });
}

function runInNewContext(pyodide: PyodideInterface, code: string) {
  const dict = pyodide.globals.get('dict');
  const globals = dict();
  try {
    return pyodide.runPython(code, { globals, locals: globals });
  } finally {
    globals.destroy();
    dict.destroy();
  }
}

// Start preloading Yosys.
const yosysPromise = (runYosys() as unknown as Promise<void>).then(() => {
  console.log('[Worker] Preloaded Yosys');
});

// Start preloading Pyodide.
let pyodidePromise = loadPyodide({
  env: {
      HOME: '/',
      AMARANTH_USE_YOSYS: 'javascript',
  },
  stdout: line => postMessage({ type: 'stdoutWrite', text: `${line}\n` }),
  stderr: line => postMessage({ type: 'stderrWrite', text: `${line}\n` }),
  jsglobals: {
    Object,
    fetch: fetch.bind(globalThis),
    setTimeout: setTimeout.bind(globalThis),
    clearTimeout: clearTimeout.bind(globalThis),
    runAmaranthYosys: (args: PyProxy, stdinText: string) => {
      let stdin = new TextEncoder().encode(stdinText);
      const stdout: string[] = [];
      const stderr: string[] = [];
      try {
        runYosys(args.toJs(), {}, {
          stdin: (length) => {
            if (stdin.length === 0)
              return null;
            let chunk = stdin.subarray(0, length);
            stdin = stdin.subarray(length);
            return chunk;
          },
          stdout: data => data ? stdout.push(new TextDecoder().decode(data)) : null,
          stderr: data => data ? stderr.push(new TextDecoder().decode(data)) : null,
        });
        return [0, stdout.join(''), stderr.join('')];
      } catch(e) {
        if (e instanceof YosysExit) {
          return [e.code, stdout.join(''), stderr.join('')];
        } else {
          throw e;
        }
      } finally {
        args.destroy();
      }
    }
  }
}).then((pyodide) => {
  const show_waveforms = runInNewContext(pyodide, `\
import contextlib

def vcd_to_d3wave(vcd_file):
    from vcd.reader import TokenKind, tokenize

    root = {"name": "design", "type": {"name": "struct"}, "children": []}
    scope = [root]
    by_id = {}
    time = 0
    for token in tokenize(open(vcd_file, "rb")):
        if token.kind == TokenKind.SCOPE:
            new_child = {
                "name": token.data.ident,
                "type": {"name": "struct"},
                "children": []
            }
            scope[-1]["children"].append(new_child)
            scope.append(new_child)
        elif token.kind == TokenKind.UPSCOPE:
            scope.pop()
        elif token.kind == TokenKind.VAR:
            new_child = {
                "name": token.data.reference,
                "type": {"name": token.data.type_.value, "width": token.data.size},
                "data": []
            }
            scope[-1]["children"].append(new_child)
            by_id[token.data.id_code] = new_child
        elif token.kind == TokenKind.CHANGE_TIME:
            time = token.data
        elif token.kind in (TokenKind.CHANGE_SCALAR, TokenKind.CHANGE_VECTOR):
            signal = by_id[token.data.id_code]
            value = token.data.value
            if isinstance(value, int):
                value = f"{value:0{signal['type']['width']}d}"
            signal["data"].append([time, value])

    return (root if len(root["children"]) > 1 else root["children"][-1])


@contextlib.contextmanager
def show_waveforms(sim):
    import amaranth_playground

    vcd_file = "/tmp/waveforms.vcd"
    with sim.write_vcd(vcd_file=vcd_file):
        yield

    amaranth_playground._show_waveforms(vcd_to_d3wave(vcd_file=vcd_file))

show_waveforms
`);

  pyodide.registerJsModule('amaranth_playground', {
    show_rtlil: (code: string) => postMessage({ type: 'showRtlil', code }),
    show_verilog: (code: string) => postMessage({ type: 'showVerilog', code }),
    _show_waveforms: (data: PyProxy) => postMessage({
      type: 'showWaveforms',
      data: data.toJs({ dict_converter: Object.fromEntries })
    }),
    show_waveforms,
  });
  console.log('[Worker] Pyodide loaded');
  return pyodide;
});

self.onmessage = async (event: MessageEvent<HostToWorkerMessage>) => {
  console.log('[Worker] Received', event.data);
  if (event.data.type === 'loadPackages') {
    const pyodide = await pyodidePromise;
    // Make sure the following call to `loadPackages` or `runPython` waits until it's done.
    pyodidePromise = pyodide.loadPackage(event.data.pkgs).then(() => pyodide);
  } else if (event.data.type === 'runPython') {
    // Wait until all resources are loaded that the final `runYosys` call becomes synchronous.
    await yosysPromise;
    const pyodide = await pyodidePromise;
    try {
      runInNewContext(pyodide, event.data.code);
      postMessage({ type: 'pythonDone', error: null });
    } catch (e) {
      postMessage({ type: 'pythonDone', error: e.message });
    }
  } else {
    throw new Error(`[Worker] Unexpected message ${(event.data as any).type}`);
  }
}

self.onerror = (event) => {
  console.error('[Worker] Failure', event);
};
