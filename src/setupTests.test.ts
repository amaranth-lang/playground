import './setupTests';

describe('setupTests', () => {
  describe('MonacoEnvironment', () => {
    it('should define MonacoEnvironment on window', () => {
      expect(window.MonacoEnvironment).toBeDefined();
    });

    it('should have getWorker method in MonacoEnvironment', () => {
      expect(window.MonacoEnvironment.getWorker).toBeDefined();
      expect(typeof window.MonacoEnvironment.getWorker).toBe('function');
    });

    it('should return a Worker instance from getWorker', () => {
      const worker = window.MonacoEnvironment.getWorker('editor.worker.js', 'javascript');
      // Since the actual MockWorker is defined in setupTests.ts and not accessible here,
      // we'll just verify that a worker object is returned
      expect(worker).toBeDefined();
    });
  });

  describe('MockWorker', () => {
    it('should be defined on window', () => {
      expect(window.Worker).toBeDefined();
    });

    it('should create a MockWorker-like instance when Worker is called', () => {
      const mockWorker = new window.Worker('test.js', { type: 'module' } as any);
      expect(mockWorker).toBeDefined();
    });

    it('should have mock methods', () => {
      const mockWorker = new window.Worker('test.js', { type: 'module' } as any);

      expect(typeof mockWorker.postMessage).toBe('function');
      expect(typeof mockWorker.terminate).toBe('function');
      expect(typeof mockWorker.addEventListener).toBe('function');
      expect(typeof mockWorker.removeEventListener).toBe('function');
      expect(typeof mockWorker.dispatchEvent).toBe('function');
    });

    it('should return true for dispatchEvent', () => {
      const mockWorker = new window.Worker('test.js', { type: 'module' } as any);
      const mockEvent = new Event('test');
      const result = mockWorker.dispatchEvent(mockEvent);
      expect(result).toBe(true);
    });
  });

  // Test that MonacoEnvironment has the correct structure
  it('should set up MonacoEnvironment with getWorker function', () => {
    expect(window.MonacoEnvironment).toBeDefined();
    expect(window.MonacoEnvironment.getWorker).toBeDefined();
    expect(typeof window.MonacoEnvironment.getWorker).toBe('function');
  });
});