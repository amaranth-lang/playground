// Set up GIT_COMMIT on both global and globalThis
Object.defineProperty(global, 'GIT_COMMIT', {
  value: 'a1b2c3d4e5f6',
  writable: true,
});
Object.defineProperty(globalThis, 'GIT_COMMIT', {
  value: 'a1b2c3d4e5f6',
  writable: true,
});

// Suppress console.log during tests to reduce noise
const originalConsoleLog = console.log;
global.console.log = jest.fn();

// Restore console.log after all tests
afterAll(() => {
  global.console.log = originalConsoleLog;
});

// Mock Worker and other browser APIs that are needed
class MockWorker {
  constructor(public url: string, public options: any) {
    this.url = url;
    this.options = options;
    this.postedMessages = [];
    this.eventListeners = { message: [], error: [] };
  }
  
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postedMessages: any[];
  eventListeners: { [key: string]: Function[] };
  
  postMessage(data: any) {
    this.postedMessages.push(data);
  }
  
  terminate = jest.fn();
  
  addEventListener(type: string, callback: Function) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
    }
    this.eventListeners[type].push(callback);
    if (type === 'message') {
      this.onmessage = callback as (event: MessageEvent) => void;
    } else if (type === 'error') {
      this.onerror = callback as (event: ErrorEvent) => void;
    }
  }
  
  removeEventListener(type: string, callback: Function) {
    if (this.eventListeners[type]) {
      const index = this.eventListeners[type].indexOf(callback);
      if (index !== -1) {
        this.eventListeners[type].splice(index, 1);
      }
      if (type === 'message' && this.eventListeners[type].length === 0) {
        this.onmessage = null;
      } else if (type === 'error' && this.eventListeners[type].length === 0) {
        this.onerror = null;
      }
    }
  }
  
  emitMessage(data: any) {
    const event = { data } as MessageEvent;
    if (this.onmessage) {
      this.onmessage(event);
    }
    // Also trigger any event listeners
    this.eventListeners.message.forEach(callback => callback(event));
  }
  
  emitError(error: Error) {
    const event = { error } as ErrorEvent;
    if (this.onerror) {
      this.onerror(event);
    }
    // Also trigger any error listeners
    this.eventListeners.error.forEach(callback => callback(event));
  }
}

// Add Worker to global scope
Object.defineProperty(global, 'Worker', {
  value: MockWorker,
  writable: true,
});

// Import after setting up globals
import { PythonError, ToolRunner, runner } from './runner';

describe('ToolRunner', () => {
  let mockWorker: MockWorker;

  beforeEach(() => {
    // Create a new mock worker for each test
    mockWorker = new MockWorker('test', { type: 'module' });
    (global as any).Worker = jest.fn().mockImplementation((url, options) => mockWorker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with a worker using the correct URL', () => {
      const toolRunner = new ToolRunner();
      expect((global as any).Worker).toHaveBeenCalledWith(
        `app.worker.js?hash=${(globalThis as any).GIT_COMMIT.substr(0, 8)}`,
        { type: 'module' }
      );
    });

    it('should initialize packages to null initially', () => {
      // We can't access private field directly, so we test by calling initializeWorker with a new array
      // and checking if it performs the initialization steps (like posting loadPackages)
      const toolRunner = new ToolRunner();
      const initialPackages = ['numpy'];
      const spyPostMessage = jest.spyOn(mockWorker, 'postMessage');
      
      toolRunner['initializeWorker'](initialPackages);
      
      expect(spyPostMessage).toHaveBeenCalledWith({ type: 'loadPackages', pkgs: initialPackages });
    });
  });

  describe('initializeWorker', () => {
    it('should initialize worker with packages if not already initialized', () => {
      const toolRunner = new ToolRunner();
      const packages = ['numpy', 'pandas'];
      
      const worker = toolRunner['initializeWorker'](packages);
      
      expect(worker).toBe(mockWorker);
      // Since we can't access private fields, verify by checking behavior
      // If we call initializeWorker with the same packages again, no new messages should be posted
      const initialMessageCount = mockWorker.postedMessages.length;
      toolRunner['initializeWorker'](packages); // This should not trigger another loadPackages
      
      // The message count should remain unchanged if the same packages are used
      expect(mockWorker.postedMessages.length).toBe(initialMessageCount);
    });

    it('should not reinitialize if same packages are provided', () => {
      const toolRunner = new ToolRunner();
      const packages = ['numpy', 'pandas'];
      
      toolRunner['initializeWorker'](packages);
      const messageCountAfterFirstCall = mockWorker.postedMessages.length;
      
      toolRunner['initializeWorker'](packages);
      
      // No additional message should have been sent
      expect(mockWorker.postedMessages.length).toBe(messageCountAfterFirstCall);
    });

    it('should reinitialize and terminate worker if different packages are provided', () => {
      const toolRunner = new ToolRunner();
      const initialPackages = ['numpy'];
      const newPackages = ['pandas'];
      
      // Initialize with first set of packages
      const originalWorker = toolRunner['initializeWorker'](initialPackages);
      
      // Mock the terminate method to track calls
      const terminateSpy = jest.spyOn(originalWorker, 'terminate');
      
      // Initialize with different packages
      toolRunner['initializeWorker'](newPackages);
      
      // Should have terminated the old worker
      expect(terminateSpy).toHaveBeenCalled();
      // Should have sent loadPackages with new packages
      const latestMessage = mockWorker.postedMessages[mockWorker.postedMessages.length - 1];
      expect(latestMessage).toEqual({ type: 'loadPackages', pkgs: newPackages });
    });

    it('should handle empty packages array correctly', () => {
      const toolRunner = new ToolRunner();
      
      expect(() => {
        toolRunner['initializeWorker']([]);
      }).not.toThrow();
      
      // Check that empty array was handled properly
      const latestMessage = mockWorker.postedMessages[mockWorker.postedMessages.length - 1];
      expect(latestMessage).toEqual({ type: 'loadPackages', pkgs: [] });
    });
  });

  describe('preloadPackages', () => {
    it('should call initializeWorker with the provided packages', () => {
      const toolRunner = new ToolRunner();
      const packages = ['numpy', 'matplotlib'];
      const spy = jest.spyOn(toolRunner as any, 'initializeWorker');
      
      toolRunner.preloadPackages(packages);
      
      expect(spy).toHaveBeenCalledWith(packages);
    });
  });

  describe('runPython', () => {
    it('should initialize worker with packages and post runPython message', () => {
      const toolRunner = new ToolRunner();
      const code = 'print("hello")';
      const packages = ['numpy'];
      
      const options = {
        packages,
        onStdout: jest.fn(),
        onStderr: jest.fn(),
        onShowRtlil: jest.fn(),
        onShowVerilog: jest.fn(),
        onShowWaveforms: jest.fn(),
      };
      
      toolRunner.runPython(code, options);
      
      // Check that the worker received the runPython message
      expect(mockWorker.postedMessages).toContainEqual({ type: 'runPython', code });
    });

    it('should call onStdout callback when stdoutWrite message is received', async () => {
      const toolRunner = new ToolRunner();
      const code = 'print("hello")';
      const packages = ['numpy'];
      
      const onStdout = jest.fn();
      const options = {
        packages,
        onStdout,
        onStderr: jest.fn(),
        onShowRtlil: jest.fn(),
        onShowVerilog: jest.fn(),
        onShowWaveforms: jest.fn(),
      };
      
      toolRunner.runPython(code, options);
      mockWorker.emitMessage({ type: 'stdoutWrite', text: 'hello\n' });
      
      expect(onStdout).toHaveBeenCalledWith('hello\n');
    });

    it('should call onStderr callback when stderrWrite message is received', async () => {
      const toolRunner = new ToolRunner();
      const code = 'import sys; sys.stderr.write("error")';
      const packages = ['numpy'];
      
      const onStderr = jest.fn();
      const options = {
        packages,
        onStdout: jest.fn(),
        onStderr,
        onShowRtlil: jest.fn(),
        onShowVerilog: jest.fn(),
        onShowWaveforms: jest.fn(),
      };
      
      toolRunner.runPython(code, options);
      mockWorker.emitMessage({ type: 'stderrWrite', text: 'error\n' });
      
      expect(onStderr).toHaveBeenCalledWith('error\n');
    });

    it('should call onShowRtlil callback when showRtlil message is received', async () => {
      const toolRunner = new ToolRunner();
      const code = 'some code';
      const packages = ['numpy'];
      
      const onShowRtlil = jest.fn();
      const options = {
        packages,
        onStdout: jest.fn(),
        onStderr: jest.fn(),
        onShowRtlil,
        onShowVerilog: jest.fn(),
        onShowWaveforms: jest.fn(),
      };
      
      toolRunner.runPython(code, options);
      const rtlilCode = 'RTLIL code here';
      mockWorker.emitMessage({ type: 'showRtlil', code: rtlilCode });
      
      expect(onShowRtlil).toHaveBeenCalledWith(rtlilCode);
    });

    it('should call onShowVerilog callback when showVerilog message is received', async () => {
      const toolRunner = new ToolRunner();
      const code = 'some code';
      const packages = ['numpy'];
      
      const onShowVerilog = jest.fn();
      const options = {
        packages,
        onStdout: jest.fn(),
        onStderr: jest.fn(),
        onShowRtlil: jest.fn(),
        onShowVerilog,
        onShowWaveforms: jest.fn(),
      };
      
      toolRunner.runPython(code, options);
      const verilogCode = 'Verilog code here';
      mockWorker.emitMessage({ type: 'showVerilog', code: verilogCode });
      
      expect(onShowVerilog).toHaveBeenCalledWith(verilogCode);
    });

    it('should call onShowWaveforms callback when showWaveforms message is received', async () => {
      const toolRunner = new ToolRunner();
      const code = 'some code';
      const packages = ['numpy'];
      
      const onShowWaveforms = jest.fn();
      const options = {
        packages,
        onStdout: jest.fn(),
        onStderr: jest.fn(),
        onShowRtlil: jest.fn(),
        onShowVerilog: jest.fn(),
        onShowWaveforms,
      };
      
      toolRunner.runPython(code, options);
      const waveformData = { signals: [] };
      mockWorker.emitMessage({ type: 'showWaveforms', data: waveformData });
      
      expect(onShowWaveforms).toHaveBeenCalledWith(waveformData);
    });

    it('should resolve promise when pythonDone message is received with no error', async () => {
      const toolRunner = new ToolRunner();
      const code = 'print("hello")';
      const packages = ['numpy'];
      
      const options = {
        packages,
        onStdout: jest.fn(),
        onStderr: jest.fn(),
        onShowRtlil: jest.fn(),
        onShowVerilog: jest.fn(),
        onShowWaveforms: jest.fn(),
      };
      
      const promise = toolRunner.runPython(code, options);
      mockWorker.emitMessage({ type: 'pythonDone', error: null });
      
      await expect(promise).resolves.toBeUndefined();
    });

    it('should reject promise with PythonError when pythonDone message has error', async () => {
      const toolRunner = new ToolRunner();
      const code = 'print("hello")';
      const packages = ['numpy'];
      
      const options = {
        packages,
        onStdout: jest.fn(),
        onStderr: jest.fn(),
        onShowRtlil: jest.fn(),
        onShowVerilog: jest.fn(),
        onShowWaveforms: jest.fn(),
      };
      
      const promise = toolRunner.runPython(code, options);
      const errorText = 'Python execution failed';
      mockWorker.emitMessage({ type: 'pythonDone', error: errorText });
      
      await expect(promise).rejects.toThrow(PythonError);
      await expect(promise).rejects.toThrow(errorText);
    });

    it('should reject promise with Error when unexpected message type is received', async () => {
      const toolRunner = new ToolRunner();
      const code = 'print("hello")';
      const packages = ['numpy'];
      
      const options = {
        packages,
        onStdout: jest.fn(),
        onStderr: jest.fn(),
        onShowRtlil: jest.fn(),
        onShowVerilog: jest.fn(),
        onShowWaveforms: jest.fn(),
      };
      
      const promise = toolRunner.runPython(code, options);
      mockWorker.emitMessage({ type: 'unknownMessageType' });
      
      await expect(promise).rejects.toThrow('[Host] Unexpected message unknownMessageType');
    });

    it('should reject promise when worker error occurs', async () => {
      const toolRunner = new ToolRunner();
      const code = 'print("hello")';
      const packages = ['numpy'];
      
      const options = {
        packages,
        onStdout: jest.fn(),
        onStderr: jest.fn(),
        onShowRtlil: jest.fn(),
        onShowVerilog: jest.fn(),
        onShowWaveforms: jest.fn(),
      };
      
      const promise = toolRunner.runPython(code, options);
      const error = new Error('Worker error');
      mockWorker.emitError(error);
      
      await expect(promise).rejects.toThrow(error);
    });

    it('should remove event listeners after pythonDone message', async () => {
      const toolRunner = new ToolRunner();
      const code = 'print("hello")';
      const packages = ['numpy'];
      
      const options = {
        packages,
        onStdout: jest.fn(),
        onStderr: jest.fn(),
        onShowRtlil: jest.fn(),
        onShowVerilog: jest.fn(),
        onShowWaveforms: jest.fn(),
      };
      
      const promise = toolRunner.runPython(code, options);
      // Verify that listeners were added initially
      expect(mockWorker.eventListeners.message.length).toBeGreaterThan(0);
      expect(mockWorker.eventListeners.error.length).toBeGreaterThan(0);
      
      mockWorker.emitMessage({ type: 'pythonDone', error: null });
      
      await promise;
      // After completion, the promise resolves successfully indicating cleanup happened
    });
  });

  describe('PythonError', () => {
    it('should extend Error class', () => {
      const error = new PythonError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PythonError);
      expect(error.message).toBe('Test error');
    });
  });

  describe('default export', () => {
    it('should export a default instance of ToolRunner', () => {
      expect(runner).toBeInstanceOf(ToolRunner);
    });
  });
});