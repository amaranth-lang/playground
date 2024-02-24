import * as React from 'react';
import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

window.MonacoEnvironment = {
	getWorker: (moduleId, label) =>
    new Worker('editor.worker.js', { type: 'module' }),
};

export class EditorState {
  readonly model: monaco.editor.IModel;
  readonly readOnly: boolean;
  viewState: monaco.editor.ICodeEditorViewState | null = null;

  constructor(text: string | null = '', setText: ((text: string) => void) | null = null, language = 'text') {
    this.model = monaco.editor.createModel(text || '', language);
    this.readOnly = (setText === null);
    if (!this.readOnly)
      this.model.onDidChangeContent(event => setText!(this.model.getValue()));
  }

  get text(): string {
    return this.model.getValue();
  }

  set text(text: string) {
    if (this.readOnly)
      this.model.setValue(text); // don't care about undo buffer, can't undo
    else
      this.model.pushEditOperations([], [{ range: this.model.getFullModelRange(), text }], () => null);
  }

  dispose() {
    this.model.dispose();
  }
}

export interface EditorProps {
  state: EditorState,
  actions?: monaco.editor.IActionDescriptor[];
  padding?: monaco.editor.IEditorPaddingOptions;
  focus?: boolean;
}

export function Editor({ state, actions = [], padding, focus = false }: EditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    editorRef.current = monaco.editor.create(containerRef.current!, {
      model: state.model,
      readOnly: state.readOnly,
      padding,
    });
    actions.forEach(action => editorRef.current?.addAction(action));
    const resizeObserver = new ResizeObserver(events => editorRef.current?.layout());
    resizeObserver.observe(containerRef.current!);
    editorRef.current.restoreViewState(state.viewState);
    if (focus)
      editorRef.current.focus();
    return () => {
      state.viewState = editorRef.current!.saveViewState();
      resizeObserver.disconnect();
      editorRef.current?.dispose();
    };
  }, []);

  return <div style={{ height: '100%' }} ref={containerRef}/>;
}
