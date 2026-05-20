import {
  LoadPackagesMessage,
  RunPythonMessage,
  HostToWorkerMessage,
  StdoutWriteMessage,
  StderrWriteMessage,
  ShowRtlilMessage,
  ShowVerilogMessage,
  ShowWaveformsMessage,
  PythonDoneMessage,
  WorkerToHostMessage
} from './proto';

describe('Proto Message Types', () => {
  describe('LoadPackagesMessage', () => {
    it('should have the correct type and structure', () => {
      const message: LoadPackagesMessage = {
        type: 'loadPackages',
        pkgs: ['numpy', 'pandas']
      };

      expect(message.type).toBe('loadPackages');
      expect(Array.isArray(message.pkgs)).toBe(true);
      expect(message.pkgs).toEqual(['numpy', 'pandas']);
    });

    it('should work with empty package array', () => {
      const message: LoadPackagesMessage = {
        type: 'loadPackages',
        pkgs: []
      };

      expect(message.type).toBe('loadPackages');
      expect(message.pkgs).toEqual([]);
    });
  });

  describe('RunPythonMessage', () => {
    it('should have the correct type and structure', () => {
      const message: RunPythonMessage = {
        type: 'runPython',
        code: 'print("Hello World")'
      };

      expect(message.type).toBe('runPython');
      expect(message.code).toBe('print("Hello World")');
    });

    it('should work with empty code string', () => {
      const message: RunPythonMessage = {
        type: 'runPython',
        code: ''
      };

      expect(message.type).toBe('runPython');
      expect(message.code).toBe('');
    });
  });

  describe('StdoutWriteMessage', () => {
    it('should have the correct type and structure', () => {
      const message: StdoutWriteMessage = {
        type: 'stdoutWrite',
        text: 'Output message'
      };

      expect(message.type).toBe('stdoutWrite');
      expect(message.text).toBe('Output message');
    });
  });

  describe('StderrWriteMessage', () => {
    it('should have the correct type and structure', () => {
      const message: StderrWriteMessage = {
        type: 'stderrWrite',
        text: 'Error message'
      };

      expect(message.type).toBe('stderrWrite');
      expect(message.text).toBe('Error message');
    });
  });

  describe('ShowRtlilMessage', () => {
    it('should have the correct type and structure', () => {
      const message: ShowRtlilMessage = {
        type: 'showRtlil',
        code: 'module top(...); endmodule'
      };

      expect(message.type).toBe('showRtlil');
      expect(message.code).toBe('module top(...); endmodule');
    });
  });

  describe('ShowVerilogMessage', () => {
    it('should have the correct type and structure', () => {
      const message: ShowVerilogMessage = {
        type: 'showVerilog',
        code: 'module top; endmodule'
      };

      expect(message.type).toBe('showVerilog');
      expect(message.code).toBe('module top; endmodule');
    });
  });

  describe('ShowWaveformsMessage', () => {
    it('should have the correct type and structure', () => {
      const data = { signal: 'clk', values: [0, 1, 0, 1] };
      const message: ShowWaveformsMessage = {
        type: 'showWaveforms',
        data: data
      };

      expect(message.type).toBe('showWaveforms');
      expect(message.data).toEqual(data);
    });

    it('should work with empty object', () => {
      const message: ShowWaveformsMessage = {
        type: 'showWaveforms',
        data: {}
      };

      expect(message.type).toBe('showWaveforms');
      expect(message.data).toEqual({});
    });
  });

  describe('PythonDoneMessage', () => {
    it('should have the correct type and structure with no error', () => {
      const message: PythonDoneMessage = {
        type: 'pythonDone',
        error: null
      };

      expect(message.type).toBe('pythonDone');
      expect(message.error).toBeNull();
    });

    it('should have the correct type and structure with error', () => {
      const message: PythonDoneMessage = {
        type: 'pythonDone',
        error: 'An error occurred'
      };

      expect(message.type).toBe('pythonDone');
      expect(message.error).toBe('An error occurred');
    });
  });

  describe('Union Types', () => {
    it('should correctly type HostToWorkerMessage', () => {
      const loadPackagesMsg: HostToWorkerMessage = {
        type: 'loadPackages',
        pkgs: ['numpy']
      };

      const runPythonMsg: HostToWorkerMessage = {
        type: 'runPython',
        code: 'print("test")'
      };

      expect(loadPackagesMsg.type).toBe('loadPackages');
      expect(runPythonMsg.type).toBe('runPython');
    });

    it('should correctly type WorkerToHostMessage', () => {
      const stdoutMsg: WorkerToHostMessage = {
        type: 'stdoutWrite',
        text: 'output'
      };

      const pythonDoneMsg: WorkerToHostMessage = {
        type: 'pythonDone',
        error: null
      };

      expect(stdoutMsg.type).toBe('stdoutWrite');
      expect(pythonDoneMsg.type).toBe('pythonDone');
    });
  });

  describe('Message Discrimination', () => {
    it('should allow proper type discrimination', () => {
      const handleMessage = (message: HostToWorkerMessage | WorkerToHostMessage) => {
        switch (message.type) {
          case 'loadPackages':
            expect(message.pkgs).toBeDefined();
            expect(Array.isArray(message.pkgs)).toBe(true);
            return 'loadPackages';
          case 'runPython':
            expect(message.code).toBeDefined();
            expect(typeof message.code).toBe('string');
            return 'runPython';
          case 'stdoutWrite':
            expect(message.text).toBeDefined();
            expect(typeof message.text).toBe('string');
            return 'stdoutWrite';
          case 'stderrWrite':
            expect(message.text).toBeDefined();
            expect(typeof message.text).toBe('string');
            return 'stderrWrite';
          case 'showRtlil':
            expect(message.code).toBeDefined();
            expect(typeof message.code).toBe('string');
            return 'showRtlil';
          case 'showVerilog':
            expect(message.code).toBeDefined();
            expect(typeof message.code).toBe('string');
            return 'showVerilog';
          case 'showWaveforms':
            expect(message.data).toBeDefined();
            expect(typeof message.data).toBe('object');
            return 'showWaveforms';
          case 'pythonDone':
            expect(message.error).toBeDefined();
            expect(message.error === null || typeof message.error === 'string').toBe(true);
            return 'pythonDone';
          default:
            // This should never be reached if all types are handled
            const exhaustiveCheck: never = message;
            return exhaustiveCheck;
        }
      };

      const loadPackagesMsg: HostToWorkerMessage = {
        type: 'loadPackages',
        pkgs: ['numpy']
      };

      const runPythonMsg: HostToWorkerMessage = {
        type: 'runPython',
        code: 'print("test")'
      };

      const stdoutMsg: WorkerToHostMessage = {
        type: 'stdoutWrite',
        text: 'output'
      };

      expect(handleMessage(loadPackagesMsg)).toBe('loadPackages');
      expect(handleMessage(runPythonMsg)).toBe('runPython');
      expect(handleMessage(stdoutMsg)).toBe('stdoutWrite');
    });
  });
});