import * as monacoEditorMock from './__mocks__/monaco-editor';

describe('monaco-editor mock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('editor', () => {
    test('should have create function as jest mock', () => {
      expect(monacoEditorMock.editor.create).toBeDefined();
      expect(typeof monacoEditorMock.editor.create).toBe('function');
      expect(jest.isMockFunction(monacoEditorMock.editor.create)).toBe(true);
    });

    test('should have createModel function as jest mock', () => {
      expect(monacoEditorMock.editor.createModel).toBeDefined();
      expect(typeof monacoEditorMock.editor.createModel).toBe('function');
      expect(jest.isMockFunction(monacoEditorMock.editor.createModel)).toBe(true);
    });

    test('create function should be callable and return undefined by default', () => {
      const container = document.createElement('div');
      const result = monacoEditorMock.editor.create(container);
      expect(monacoEditorMock.editor.create).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    test('createModel function should be callable and return undefined by default', () => {
      const value = 'test code';
      const result = monacoEditorMock.editor.createModel(value);
      expect(monacoEditorMock.editor.createModel).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    test('create function should accept parameters', () => {
      const container = document.createElement('div');
      const options = { value: 'test code' };

      monacoEditorMock.editor.create(container, options);

      expect(monacoEditorMock.editor.create).toHaveBeenCalledWith(container, options);
    });

    test('createModel function should accept parameters', () => {
      const value = 'test code';
      const language = 'javascript';

      monacoEditorMock.editor.createModel(value, language);

      expect(monacoEditorMock.editor.createModel).toHaveBeenCalledWith(value, language);
    });
  });

  describe('KeyCode', () => {
    test('should have F1 constant with value 58', () => {
      expect(monacoEditorMock.KeyCode.F1).toBeDefined();
      expect(monacoEditorMock.KeyCode.F1).toBe(58);
    });
  });
});