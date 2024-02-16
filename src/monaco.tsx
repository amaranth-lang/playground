import * as React from 'react';
import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

window.MonacoEnvironment = {
	getWorker: (moduleId, label) =>
    new Worker('editor.worker.js', { type: 'module' }),
};

export class EditorState {
  constructor(
    readonly text = '',
    readonly viewState: monaco.editor.ICodeEditorViewState | null = null
  ) {}

  updateText(newText: string = '') {
    return new EditorState(newText, this.viewState);
  }

  updateViewState(newViewState?: monaco.editor.ICodeEditorViewState | null) {
    return new EditorState(this.text, newViewState);
  }
}

export interface EditorProps {
  padding?: monaco.editor.IEditorPaddingOptions;
  language?: string;
  state: EditorState;
  setState?: Dispatch<SetStateAction<EditorState>>;
  focus?: boolean;
  actions?: monaco.editor.IActionDescriptor[];
}

export function Editor({ padding, language, state, setState, focus = false, actions = [] }: EditorProps) {
  const modelRef = useRef<monaco.editor.IModel | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modelRef.current = monaco.editor.createModel(state.text, language);
    if (setState) {
      modelRef.current.onDidChangeContent(event => {
        const newText = modelRef.current!.getValue();
        setState(state => state.updateText(newText));
      });
    }
    editorRef.current = monaco.editor.create(containerRef.current!, {
      padding,
      model: modelRef.current,
      readOnly: setState === undefined,
    });
    actions.forEach(action => editorRef.current?.addAction(action));
    const resizeObserver = new ResizeObserver((events) => {
      // without shrinking the editor, the browser will only stretch the viewport vertically
      editorRef.current?.layout({ width: 0, height: 0 });
      editorRef.current?.layout();
    });
    resizeObserver.observe(containerRef.current!); // to detect expansion
    resizeObserver.observe(window.document.body); // to detect shrinkage
    editorRef.current.restoreViewState(state.viewState);
    if (focus)
      editorRef.current.focus();
    return () => {
      setState?.(new EditorState(modelRef.current?.getValue(), editorRef.current?.saveViewState()));
      resizeObserver.disconnect();
      editorRef.current?.dispose();
      editorRef.current = null;
      modelRef.current?.dispose();
      modelRef.current = null;
    };
  }, []);

  useEffect(() => {
    monaco.editor.setModelLanguage(modelRef.current!, language ?? 'text');
  }, [language]);

  useEffect(() => {
    if (modelRef.current?.getValue() !== state.text)
      modelRef.current?.setValue(state.text);
  }, [state]);

  return <div style={{ height: '100%' }} ref={containerRef}/>;
}
