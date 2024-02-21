import { WorkerToHostMessage } from './proto';

export class PythonError extends Error {}

export class ToolRunner {
  #worker = new Worker('app.worker.js', { type: 'module' });
  #packages: null | string[] = null;

  private initializeWorker(packages: string[]): Worker {
    if (JSON.stringify(this.#packages) !== JSON.stringify(packages)) {
      if (this.#worker !== null && this.#packages !== null) {
        // Terminate and re-initialize if the set of packages has changed.
        this.#worker.terminate();
        this.#worker = new Worker('app.worker.js', { type: 'module' });
      }
      this.#worker.postMessage({ type: 'loadPackages', pkgs: packages });
      this.#packages = packages;
    }
    return this.#worker;
  }

  preloadPackages(packages: string[]) {
    this.initializeWorker(packages);
  }

  runPython(code: string, options: {
    packages: string[],
    onStdout: (text: string) => void,
    onStderr: (text: string) => void,
    onShowRtlil: (code: string) => void,
    onShowVerilog: (code: string) => void,
    onShowWaveforms: (data: object) => void,
  }): Promise<void> {
    console.log('[Host] Running', { packages: options.packages, code });
    const worker = this.initializeWorker(options.packages);
    return new Promise((resolve, reject) => {
      function onmessage(event: MessageEvent<WorkerToHostMessage>) {
        console.log('[Host] Received', event.data);
        if (event.data.type === 'stdoutWrite') {
          options.onStdout(event.data.text);
        } else if (event.data.type === 'stderrWrite') {
          options.onStderr(event.data.text);
        } else if (event.data.type === 'showRtlil') {
          options.onShowRtlil(event.data.code);
        } else if (event.data.type === 'showVerilog') {
          options.onShowVerilog(event.data.code);
        } else if (event.data.type === 'showWaveforms') {
          options.onShowWaveforms(event.data.data);
        } else if (event.data.type === 'pythonDone') {
          worker.removeEventListener('message', onmessage);
          worker.removeEventListener('error', onerror);
          if (event.data.error === null)
            resolve();
          else
            reject(new PythonError(event.data.error));
        } else {
          reject(new Error(`[Host] Unexpected message ${(event.data as any).type}`));
        }
      }
      function onerror(event: ErrorEvent) {
        console.log('[Host] Failure', event.error);
        worker.removeEventListener('message', onmessage);
        reject(event.error);
      }
      worker.addEventListener('message', onmessage);
      worker.addEventListener('error', onerror, { once: true });
      worker.postMessage({ type: 'runPython', code });
    });
  }
}

export let runner = new ToolRunner();
