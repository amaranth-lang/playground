// Setup test environment for DOM
// Mock Monaco environment
Object.defineProperty(window, 'MonacoEnvironment', {
  value: {
    getWorker: () => new Worker('editor.worker.js', { type: 'module' }),
  },
  writable: true,
});

// Mock Worker for tests
class MockWorker {
  constructor(scriptURL, options) {
    this.scriptURL = scriptURL;
    this.options = options;
    this.onerror = null;
    this.onmessage = null;
    this.onmessageerror = null;
  }
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

window.Worker = MockWorker;