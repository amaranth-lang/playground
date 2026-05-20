import * as React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { EditorState, Editor, EditorProps } from './monaco';
import * as monaco from 'monaco-editor';

// Import jest-dom matchers
import '@testing-library/jest-dom';

// Mock ResizeObserver
class MockResizeObserver {
  callback;
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  constructor(callback) {
    // ResizeObserver expects a callback (but make it optional for tests)
    this.callback = callback || (() => {});
  }
}

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock the MonacoEnvironment
global.window.MonacoEnvironment = {
  getWorker: () => new Worker('editor.worker.js', { type: 'module' }),
};

// Mock the monaco editor
jest.mock('monaco-editor', () => ({
  editor: {
    createModel: jest.fn(),
    create: jest.fn(),
  },
  languages: {},
}));

describe('EditorState', () => {
  let mockModel: any;
  let mockSetText: jest.Mock;

  beforeEach(() => {
    mockModel = {
      getValue: jest.fn(),
      setValue: jest.fn(),
      onDidChangeContent: jest.fn((callback) => {
        // Mock the event subscription
        return { dispose: jest.fn() };
      }),
      pushEditOperations: jest.fn(),
      getFullModelRange: jest.fn(() => ({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      })),
      dispose: jest.fn(),
    };

    (monaco.editor.createModel as jest.Mock).mockReturnValue(mockModel);
    mockSetText = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe('constructor', () => {
    it('should create an EditorState with default values', () => {
      const state = new EditorState();

      expect(monaco.editor.createModel).toHaveBeenCalledWith('', 'text');
      expect(state.model).toBe(mockModel);
      expect(state.readOnly).toBe(true); // setText is provided as null by default, making it read-only
      expect(state.viewState).toBeNull();
    });

    it('should create an EditorState with provided text, setText and language', () => {
      const text = 'Hello World';
      const language = 'javascript';

      const state = new EditorState(text, mockSetText, language);

      expect(monaco.editor.createModel).toHaveBeenCalledWith(text, language);
      expect(state.model).toBe(mockModel);
    });

    it('should handle readonly state when setText is null', () => {
      const state = new EditorState('some text', null, 'javascript');
      
      expect(state.readOnly).toBe(true);
    });

    it('should set up content change listener when setText is provided', () => {
      new EditorState('some text', mockSetText, 'javascript');
      
      expect(mockModel.onDidChangeContent).toHaveBeenCalled();
    });
  });

  describe('text getter', () => {
    it('should return the model value', () => {
      const expectedText = 'test text';
      mockModel.getValue.mockReturnValue(expectedText);
      
      const state = new EditorState();
      (state as any).model = mockModel; // override model with mocked one
      
      expect(state.text).toBe(expectedText);
    });
  });

  describe('text setter', () => {
    it('should call setValue when in readonly mode', () => {
      const state = new EditorState('initial', null); // readonly
      state.text = 'new text';
      
      expect(mockModel.setValue).toHaveBeenCalledWith('new text');
    });

    it('should call pushEditOperations when not in readonly mode', () => {
      const state = new EditorState('initial', mockSetText); // not readonly
      state.text = 'new text';
      
      expect(mockModel.pushEditOperations).toHaveBeenCalledWith(
        [],
        [{
          range: expect.any(Object),
          text: 'new text'
        }],
        expect.any(Function)
      );
    });
  });

  describe('dispose', () => {
    it('should dispose the model', () => {
      const state = new EditorState();
      (state as any).model = mockModel;
      
      state.dispose();
      
      expect(mockModel.dispose).toHaveBeenCalled();
    });
  });
});

describe('Editor', () => {
  beforeEach(() => {
    // Clear any previous mock implementations
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render a div container', () => {
    const mockEditor = {
      restoreViewState: jest.fn(),
      focus: jest.fn(),
      layout: jest.fn(),
      saveViewState: jest.fn(),
      dispose: jest.fn(),
      addAction: jest.fn(() => ({ dispose: jest.fn() })),
    };

    const mockModel = {
      getValue: jest.fn(),
      setValue: jest.fn(),
      onDidChangeContent: jest.fn(() => ({ dispose: jest.fn() })),
      pushEditOperations: jest.fn(),
      getFullModelRange: jest.fn(() => ({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      })),
      dispose: jest.fn(),
    };

    (monaco.editor.createModel as jest.Mock).mockReturnValue(mockModel);
    (monaco.editor.create as jest.Mock).mockReturnValue(mockEditor);

    const state = new EditorState();
    (state as any).model = mockModel; // Override with mock

    render(<Editor state={state} />);

    // Find the div with height: 100% style using querySelector
    const container = document.querySelector('div[style="height: 100%"]') ||
                     document.querySelector('div[style*="height: 100%"]') ||
                     document.querySelector('[style*="100%"]') ||
                     screen.queryAllByRole('generic', { hidden: true }).find(el => el.style?.height === '100%');
    expect(container).toBeTruthy();
  });

  it('should create a monaco editor instance', () => {
    const mockEditor = {
      restoreViewState: jest.fn(),
      focus: jest.fn(),
      layout: jest.fn(),
      saveViewState: jest.fn(),
      dispose: jest.fn(),
      addAction: jest.fn(() => ({ dispose: jest.fn() })),
    };

    const mockModel = {
      getValue: jest.fn(),
      setValue: jest.fn(),
      onDidChangeContent: jest.fn(() => ({ dispose: jest.fn() })),
      pushEditOperations: jest.fn(),
      getFullModelRange: jest.fn(() => ({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      })),
      dispose: jest.fn(),
    };

    (monaco.editor.createModel as jest.Mock).mockReturnValue(mockModel);
    (monaco.editor.create as jest.Mock).mockReturnValue(mockEditor);

    const state = new EditorState();
    (state as any).model = mockModel;

    render(<Editor state={state} />);

    // Verify that the editor was created with proper parameters
    expect(monaco.editor.create).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({
        model: mockModel,
        readOnly: state.readOnly,
      })
    );
  });

  it('should handle actions when provided', () => {
    const mockAction = {
      id: 'test-action',
      label: 'Test Action',
      run: jest.fn(),
    };

    const mockEditor = {
      restoreViewState: jest.fn(),
      focus: jest.fn(),
      layout: jest.fn(),
      saveViewState: jest.fn(),
      dispose: jest.fn(),
      addAction: jest.fn(() => ({ dispose: jest.fn() })),
    };

    const mockModel = {
      getValue: jest.fn(),
      setValue: jest.fn(),
      onDidChangeContent: jest.fn(() => ({ dispose: jest.fn() })),
      pushEditOperations: jest.fn(),
      getFullModelRange: jest.fn(() => ({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      })),
      dispose: jest.fn(),
    };

    (monaco.editor.createModel as jest.Mock).mockReturnValue(mockModel);
    (monaco.editor.create as jest.Mock).mockReturnValue(mockEditor);

    const state = new EditorState();
    (state as any).model = mockModel;

    render(<Editor state={state} actions={[mockAction]} />);

    // Wait for useEffect to run
    act(() => {
      // Simulate the useEffect running
    });

    expect(mockEditor.addAction).toHaveBeenCalledWith(mockAction);
  });

  it('should handle focus prop when true', () => {
    const mockEditor = {
      restoreViewState: jest.fn(),
      focus: jest.fn(),
      layout: jest.fn(),
      saveViewState: jest.fn(),
      dispose: jest.fn(),
      addAction: jest.fn(() => ({ dispose: jest.fn() })),
    };

    const mockModel = {
      getValue: jest.fn(),
      setValue: jest.fn(),
      onDidChangeContent: jest.fn(() => ({ dispose: jest.fn() })),
      pushEditOperations: jest.fn(),
      getFullModelRange: jest.fn(() => ({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      })),
      dispose: jest.fn(),
    };

    (monaco.editor.createModel as jest.Mock).mockReturnValue(mockModel);
    (monaco.editor.create as jest.Mock).mockReturnValue(mockEditor);

    const state = new EditorState();
    (state as any).model = mockModel;

    render(<Editor state={state} focus={true} />);

    // Wait for useEffect to run
    act(() => {
      // Simulate the useEffect running
    });

    expect(mockEditor.focus).toHaveBeenCalled();
  });
});