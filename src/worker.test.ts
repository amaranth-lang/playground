import { HostToWorkerMessage, WorkerToHostMessage } from './proto';

// Mock the global self object to simulate a web worker
const mockSelf = {
  postMessage: jest.fn(),
  onmessage: null as any,
  onerror: null as any
};

// Mock global objects that would be available in a worker context
Object.assign(global, {
  self: mockSelf,
  console: {
    ...console,
    log: jest.fn(),
    error: jest.fn()
  }
});

// Mock TextEncoder and TextDecoder
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock fetch API for Node environment
global.fetch = jest.fn(((_input: RequestInfo, _init?: RequestInit) =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    text: () => Promise.resolve(''),
    json: () => Promise.resolve({}),
  } as Response)
) as typeof fetch);

describe('Worker', () => {
  let originalSelf: any;

  beforeEach(() => {
    jest.resetModules(); // Reset modules to clear any cached imports
    jest.clearAllMocks();

    // Store original self
    originalSelf = global.self;

    // Set up fresh mocks
    mockSelf.postMessage.mockClear();
    (global.console.log as jest.Mock).mockClear();
    (global.console.error as jest.Mock).mockClear();

    // Reset the worker's handlers
    mockSelf.onmessage = null;
    mockSelf.onerror = null;
  });

  afterEach(() => {
    // Restore original self
    global.self = originalSelf;
  });

  it('should handle loadPackages message', async () => {
    // Set up mock Pyodide
    const mockGlobalsDict = { destroy: jest.fn() };
    const mockDictFn: any = jest.fn(() => mockGlobalsDict);
    mockDictFn.destroy = jest.fn(); // The function itself is also a PyProxy
    
    const mockPyodide = {
      globals: {
        get: jest.fn((name: string) => name === 'dict' ? mockDictFn : jest.fn())
      },
      runPython: jest.fn().mockReturnValue('result'),
      loadPackage: jest.fn().mockResolvedValue(undefined),
      registerJsModule: jest.fn(),
      destroy: jest.fn()
    };

    // Mock the modules before importing the worker
    jest.doMock('./pyodide', () => ({
      loadPyodide: jest.fn().mockResolvedValue(mockPyodide)
    }));

    jest.doMock('@yowasp/yosys', () => ({
      runYosys: jest.fn().mockResolvedValue(Promise.resolve())
    }));

    // Now import the worker
    require('./worker');
    
    const event: MessageEvent<HostToWorkerMessage> = {
      data: { type: 'loadPackages', pkgs: ['numpy', 'pandas'] }
    } as any;

    if (mockSelf.onmessage) {
      await mockSelf.onmessage(event);
    }

    expect(mockPyodide.loadPackage).toHaveBeenCalledWith(['numpy', 'pandas']);
  });

  it('should handle runPython message successfully', async () => {
    // Set up mock Pyodide
    const mockGlobalsDict = { destroy: jest.fn() };
    const mockDictFn: any = jest.fn(() => mockGlobalsDict);
    mockDictFn.destroy = jest.fn(); // The function itself is also a PyProxy
    
    const mockPyodide = {
      globals: {
        get: jest.fn((name: string) => name === 'dict' ? mockDictFn : jest.fn())
      },
      runPython: jest.fn().mockReturnValue('result'),
      loadPackage: jest.fn().mockResolvedValue(undefined),
      registerJsModule: jest.fn(),
      destroy: jest.fn()
    };

    // Mock the modules before importing the worker
    jest.doMock('./pyodide', () => ({
      loadPyodide: jest.fn().mockResolvedValue(mockPyodide)
    }));

    jest.doMock('@yowasp/yosys', () => ({
      runYosys: jest.fn().mockResolvedValue(Promise.resolve())
    }));

    // Now import the worker
    require('./worker');

    const event: MessageEvent<HostToWorkerMessage> = {
      data: { type: 'runPython', code: 'print("hello world")' }
    } as any;

    if (mockSelf.onmessage) {
      await mockSelf.onmessage(event);
    }

    expect(mockPyodide.runPython).toHaveBeenCalledWith('print("hello world")', {
      globals: expect.anything(),
      locals: expect.anything()
    });

    // Wait a bit to ensure async operations complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockSelf.postMessage).toHaveBeenCalledWith(
      { type: 'pythonDone', error: null },
      { transfer: undefined }
    );
  });

  it('should handle runPython message with error', async () => {
    // Set up mock Pyodide
    const mockGlobalsDict = { destroy: jest.fn() };
    const mockDictFn: any = jest.fn(() => mockGlobalsDict);
    mockDictFn.destroy = jest.fn(); // The function itself is also a PyProxy
    
    // Create a mock that returns an error when runPython is called with specific code
    const mockRunPython = jest.fn((code: string, options?: any) => {
      if (code === 'invalid code') {
        throw new Error('Test Python error');
      }
      return 'result';
    });
    
    const mockPyodide = {
      globals: {
        get: jest.fn((name: string) => name === 'dict' ? mockDictFn : jest.fn())
      },
      runPython: mockRunPython,
      loadPackage: jest.fn().mockResolvedValue(undefined),
      registerJsModule: jest.fn(),
      destroy: jest.fn()
    };

    // Mock the modules before importing the worker
    jest.doMock('./pyodide', () => ({
      loadPyodide: jest.fn().mockResolvedValue(mockPyodide)
    }));

    jest.doMock('@yowasp/yosys', () => ({
      runYosys: jest.fn().mockResolvedValue(Promise.resolve())
    }));

    // Now import the worker
    require('./worker');

    // Initialize first
    const initEvent: MessageEvent<HostToWorkerMessage> = {
      data: { type: 'loadPackages', pkgs: [] }
    } as any;

    if (mockSelf.onmessage) {
      await mockSelf.onmessage(initEvent);
    }

    // Now send the actual message that should fail
    const event: MessageEvent<HostToWorkerMessage> = {
      data: { type: 'runPython', code: 'invalid code' }
    } as any;

    if (mockSelf.onmessage) {
      await mockSelf.onmessage(event);
    }

    // Wait a bit to ensure async operations complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockSelf.postMessage).toHaveBeenCalledWith(
      { type: 'pythonDone', error: 'Test Python error' },
      { transfer: undefined }
    );
  });

  it('should throw error for unexpected message type', async () => {
    // Set up mock Pyodide
    const mockGlobalsDict = { destroy: jest.fn() };
    const mockDictFn: any = jest.fn(() => mockGlobalsDict);
    mockDictFn.destroy = jest.fn(); // The function itself is also a PyProxy
    
    const mockPyodide = {
      globals: {
        get: jest.fn((name: string) => name === 'dict' ? mockDictFn : jest.fn())
      },
      runPython: jest.fn().mockReturnValue('result'),
      loadPackage: jest.fn().mockResolvedValue(undefined),
      registerJsModule: jest.fn(),
      destroy: jest.fn()
    };

    // Mock the modules before importing the worker
    jest.doMock('./pyodide', () => ({
      loadPyodide: jest.fn().mockResolvedValue(mockPyodide)
    }));

    jest.doMock('@yowasp/yosys', () => ({
      runYosys: jest.fn().mockResolvedValue(Promise.resolve())
    }));

    // Now import the worker
    require('./worker');

    const event: MessageEvent<HostToWorkerMessage> = {
      data: { type: 'unknownMessageType' as any } as any
    } as any;

    if (mockSelf.onmessage) {
      await expect(mockSelf.onmessage(event)).rejects.toThrow(
        '[Worker] Unexpected message unknownMessageType'
      );
    }
  });

  it('should register amaranth_playground module correctly', async () => {
    // Set up mock Pyodide
    const mockGlobalsDict = { destroy: jest.fn() };
    const mockDictFn: any = jest.fn(() => mockGlobalsDict);
    mockDictFn.destroy = jest.fn(); // The function itself is also a PyProxy
    
    // Mock runPython to return a function when called for show_waveforms, otherwise 'result'
    const mockRunPython = jest.fn((code: string, ...args: any[]) => {
      if (code.includes('show_waveforms')) {
        return jest.fn(); // Return a function when this specific code is run
      }
      return 'result';
    });
    
    const mockPyodide = {
      globals: {
        get: jest.fn((name: string) => name === 'dict' ? mockDictFn : jest.fn())
      },
      runPython: mockRunPython,
      loadPackage: jest.fn().mockResolvedValue(undefined),
      registerJsModule: jest.fn(),
      destroy: jest.fn()
    };

    // Mock the modules before importing the worker
    jest.doMock('./pyodide', () => ({
      loadPyodide: jest.fn().mockResolvedValue(mockPyodide)
    }));

    jest.doMock('@yowasp/yosys', () => ({
      runYosys: jest.fn().mockResolvedValue(Promise.resolve())
    }));

    // Now import the worker
    require('./worker');

    const event: MessageEvent<HostToWorkerMessage> = {
      data: { type: 'loadPackages', pkgs: [] }
    } as any;

    if (mockSelf.onmessage) {
      await mockSelf.onmessage(event);
    }

    // Check that registerJsModule was called with the right parameters
    expect(mockPyodide.registerJsModule).toHaveBeenCalledWith(
      'amaranth_playground',
      expect.objectContaining({
        show_rtlil: expect.any(Function),
        show_verilog: expect.any(Function),
        _show_waveforms: expect.any(Function),
        show_waveforms: expect.any(Function)
      })
    );
  });
});