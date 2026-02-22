/**
 * Configure Monaco to use self-hosted workers via Vite's ?worker imports.
 * Must be called before any Monaco editor is created.
 */

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

(self as any).MonacoEnvironment = {
  getWorker(_moduleId: string, label: string) {
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  },
};
