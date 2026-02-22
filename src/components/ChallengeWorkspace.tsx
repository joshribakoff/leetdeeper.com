import { useState, useRef, useCallback, useEffect } from 'react';
import '../lib/monaco-setup';
import Editor from '@monaco-editor/react';
import type { TestResult } from '../lib/test-harness';
import type { WorkerMessage } from '../lib/test-worker';
import TestWorker from '../lib/test-worker?worker';
import type { SolutionWithCode } from '../lib/solutions-schema';

interface Props {
  slug: string;
  starterCode: string;
  testCode: string;
  solutions?: SolutionWithCode[];
}

const MIN_PANEL = 300;
const LS_KEY_PREFIX = 'leetdeeper:code:';
const LS_SPLIT_KEY = 'leetdeeper:split';

function useMonacoTheme() {
  const getTheme = () => document.documentElement.getAttribute('data-theme') === 'light' ? 'vs' : 'vs-dark';
  const [theme, setTheme] = useState(getTheme);
  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(getTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

export default function ChallengeWorkspace({ slug, starterCode, testCode, solutions = [] }: Props) {
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [leftTab, setLeftTab] = useState<'description' | 'solutions'>('description');
  const [activeSolution, setActiveSolution] = useState(0);
  const monacoTheme = useMonacoTheme();
  const editorRef = useRef<any>(null);
  const [splitPct, setSplitPct] = useState(() => {
    const saved = localStorage.getItem(LS_SPLIT_KEY);
    return saved ? parseFloat(saved) : 40;
  });
  const codeRef = useRef(localStorage.getItem(LS_KEY_PREFIX + slug) ?? starterCode);
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);

  // Read server-rendered description from DOM template
  useEffect(() => {
    const tpl = document.getElementById('challenge-description') as HTMLTemplateElement | null;
    if (tpl) setDescriptionHtml(tpl.innerHTML);
  }, []);

  // Persist split position
  useEffect(() => {
    localStorage.setItem(LS_SPLIT_KEY, String(splitPct));
  }, [splitPct]);

  // Persist code
  const onCodeChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      codeRef.current = value;
      localStorage.setItem(LS_KEY_PREFIX + slug, value);
    }
  }, [slug]);

  const runTests = useCallback(() => {
    setRunning(true);
    setResults(null);
    setError(null);

    // Terminate previous worker if still running
    workerRef.current?.terminate();

    const worker = new TestWorker();
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.type === 'results') {
        setResults(e.data.results);
        setRunning(false);

        // Mark challenge completed if all pass
        if (e.data.results.every((r) => r.pass)) {
          const completed = JSON.parse(localStorage.getItem('leetdeeper:completed') ?? '[]');
          if (!completed.includes(slug)) {
            completed.push(slug);
            localStorage.setItem('leetdeeper:completed', JSON.stringify(completed));
          }
        }
      } else if (e.data.type === 'error') {
        setError(e.data.error);
        setRunning(false);
      }
      worker.terminate();
    };

    worker.onerror = (e) => {
      setError(e.message || 'Worker crashed unexpectedly');
      setRunning(false);
      worker.terminate();
    };

    worker.postMessage({ type: 'run', userCode: codeRef.current, testCode } satisfies WorkerMessage);
  }, [slug, testCode]);

  // Keyboard shortcut: Cmd/Ctrl+Enter to run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runTests();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [runTests]);

  // Resize handle
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startPct = splitPct;
    const container = containerRef.current;
    if (!container) return;
    const containerWidth = container.offsetWidth;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const newPct = startPct + (dx / containerWidth) * 100;
      const minPct = (MIN_PANEL / containerWidth) * 100;
      const maxPct = 100 - minPct;
      setSplitPct(Math.min(maxPct, Math.max(minPct, newPct)));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [splitPct]);

  const allPass = results?.every((r) => r.pass);

  return (
    <div ref={containerRef} style={styles.container} data-testid="editor">
      {/* Left panel */}
      <div style={{ ...styles.panel, width: `${splitPct}%`, display: 'flex', flexDirection: 'column' }}>
        {solutions.length > 0 && (
          <div style={styles.tabBar}>
            <button
              style={{ ...styles.tab, ...(leftTab === 'description' ? styles.tabActive : {}) }}
              onClick={() => setLeftTab('description')}
            >Description</button>
            <button
              style={{ ...styles.tab, ...(leftTab === 'solutions' ? styles.tabActive : {}) }}
              onClick={() => setLeftTab('solutions')}
            >Solutions</button>
          </div>
        )}
        {leftTab === 'description' ? (
          <div className="prose" style={{ ...styles.panelContent, flex: 1, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
        ) : (
          <div style={{ ...styles.panelContent, flex: 1, overflow: 'auto' }}>
            <div style={styles.pillBar}>
              {solutions.map((s, i) => (
                <button
                  key={s.key}
                  style={{ ...styles.pill, ...(activeSolution === i ? styles.pillActive : {}) }}
                  onClick={() => setActiveSolution(i)}
                >{s.label}</button>
              ))}
            </div>
            {solutions[activeSolution] && (
              <>
                <p style={styles.approachText}>
                  {solutions[activeSolution].approach}
                  {solutions[activeSolution].complexity && (
                    <span style={styles.complexityBadge}>{solutions[activeSolution].complexity}</span>
                  )}
                </p>
                {solutions[activeSolution].steps && (
                  <ol style={styles.stepsList}>
                    {solutions[activeSolution].steps!.map((step, i) => (
                      <li key={i} style={styles.stepItem}>{step}</li>
                    ))}
                  </ol>
                )}
                <div style={styles.codeEditorWrap}>
                  <Editor
                    language="typescript"
                    value={solutions[activeSolution].code}
                    theme={monacoTheme}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'Fira Code', monospace",
                      lineNumbers: 'off',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      domReadOnly: true,
                      padding: { top: 12, bottom: 12 },
                      renderLineHighlight: 'none',
                      scrollbar: { vertical: 'hidden', horizontal: 'auto' },
                      overviewRulerLanes: 0,
                      folding: false,
                      glyphMargin: false,
                    }}
                  />
                </div>
                <button
                  style={styles.loadButton}
                  onClick={() => {
                    const current = codeRef.current;
                    if (current !== starterCode && current !== solutions[activeSolution].code) {
                      if (!window.confirm('This will replace your current code in the editor. Continue?')) return;
                    }
                    const code = solutions[activeSolution].code;
                    editorRef.current?.setValue(code);
                    codeRef.current = code;
                    localStorage.setItem(LS_KEY_PREFIX + slug, code);
                  }}
                >Load into Editor</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div style={styles.resizeHandle} onMouseDown={onMouseDown} />

      {/* Editor panel */}
      <div style={{ ...styles.panel, width: `${100 - splitPct}%`, display: 'flex', flexDirection: 'column' }}>
        <div style={styles.toolbar}>
          <button onClick={runTests} disabled={running} style={{
            ...styles.runButton,
            ...(running ? { opacity: 0.7, cursor: 'wait' } : {}),
          }}>
            {running ? 'Running\u2026' : 'Run Tests'}
          </button>
          <span style={styles.shortcutHint}>Ctrl+Enter</span>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            defaultLanguage="typescript"
            defaultValue={codeRef.current}
            onChange={onCodeChange}
            theme={monacoTheme}
            onMount={(editor) => {
              editorRef.current = editor;
              (window as any).__leetdeeperEditor = editor;
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', monospace",
              padding: { top: 12 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Test results */}
        <div style={styles.results}>
          {error && <div style={styles.errorBox}>{error}</div>}
          {results && (
            <div>
              <div style={{ ...styles.resultsSummary, color: allPass ? 'var(--color-success)' : 'var(--color-error)' }}>
                {allPass ? 'All tests passed!' : `${results.filter((r) => r.pass).length}/${results.length} passed`}
              </div>
              {(() => {
                // Split results into basic (shown in full) and extended (only show failures)
                const basic = results.filter((r) => !r.name.startsWith('Extended'));
                const extended = results.filter((r) => r.name.startsWith('Extended'));
                const extendedFails = extended.filter((r) => !r.pass);
                const extendedAllPass = extendedFails.length === 0;

                return (
                  <>
                    {basic.map((r, i) => {
                      const testName = r.name.includes(' > ') ? r.name.split(' > ').slice(1).join(' > ') : r.name;
                      return (
                        <div key={i} style={{ ...styles.resultRow, background: r.pass ? 'var(--color-success-dim)' : 'var(--color-error-dim)' }}>
                          <span>{r.pass ? '\u2713' : '\u2717'}</span>
                          <span style={{ flex: 1 }}>{testName}</span>
                          {r.error && <span style={styles.resultError}>{r.error}</span>}
                        </div>
                      );
                    })}
                    {extended.length > 0 && (
                      <>
                        <div style={styles.groupHeader}>
                          Extended — {extendedAllPass
                            ? `${extended.length}/${extended.length} passed`
                            : `${extended.length - extendedFails.length}/${extended.length} passed`}
                        </div>
                        {extendedFails.map((r, i) => {
                          const testName = r.name.includes(' > ') ? r.name.split(' > ').slice(1).join(' > ') : r.name;
                          return (
                            <div key={`ext-${i}`} style={{ ...styles.resultRow, background: 'var(--color-error-dim)' }}>
                              <span>{'\u2717'}</span>
                              <span style={{ flex: 1 }}>{testName}</span>
                              {r.error && <span style={styles.resultError}>{r.error}</span>}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}
          {!results && !error && <div style={styles.placeholder}>Click "Run Tests" to check your solution</div>}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 110px)',
    background: 'var(--color-bg)',
  },
  panel: {
    overflow: 'auto',
  },
  panelContent: {
    padding: '24px',
    lineHeight: '1.7',
  },
  resizeHandle: {
    width: 6,
    cursor: 'col-resize',
    background: 'var(--color-border)',
    flexShrink: 0,
    transition: 'background 150ms',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderBottom: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
  },
  runButton: {
    padding: '6px 16px',
    background: 'var(--color-accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  shortcutHint: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
  },
  results: {
    borderTop: '1px solid var(--color-border)',
    padding: 12,
    maxHeight: 200,
    overflow: 'auto',
    background: 'var(--color-surface)',
  },
  resultsSummary: {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: 14,
  },
  resultRow: {
    display: 'flex',
    gap: 8,
    padding: '4px 8px',
    borderRadius: 4,
    marginBottom: 4,
    fontSize: 13,
    fontFamily: "'Fira Code', monospace",
  },
  resultError: {
    color: 'var(--color-error)',
    fontSize: 12,
  },
  errorBox: {
    padding: '8px 12px',
    background: 'var(--color-error-dim)',
    color: 'var(--color-error)',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: "'Fira Code', monospace",
  },
  groupHeader: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    padding: '8px 8px 4px',
    marginTop: 4,
  },
  placeholder: {
    color: 'var(--color-text-muted)',
    fontSize: 13,
  },
  tabBar: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    flexShrink: 0,
  },
  tab: {
    padding: '8px 16px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    borderBottom: '2px solid transparent',
  },
  tabActive: {
    color: 'var(--color-accent)',
    borderBottom: '2px solid var(--color-accent)',
  },
  pillBar: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
    marginBottom: 16,
  },
  pill: {
    padding: '4px 12px',
    borderRadius: 16,
    border: '1px solid var(--color-border)',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 12,
    color: 'var(--color-text-muted)',
  },
  pillActive: {
    background: 'var(--color-accent)',
    color: '#fff',
    borderColor: 'var(--color-accent)',
  },
  approachText: {
    fontSize: 13,
    color: 'var(--color-text-muted)',
    marginBottom: 12,
    lineHeight: 1.5,
  },
  complexityBadge: {
    marginLeft: 8,
    padding: '2px 8px',
    borderRadius: 4,
    background: 'var(--color-surface)',
    fontSize: 11,
    fontFamily: "'Fira Code', monospace",
  },
  stepsList: {
    margin: '0 0 16px 0',
    paddingLeft: 20,
    fontSize: 13,
    lineHeight: 1.7,
    color: 'var(--color-text)',
  },
  stepItem: {
    marginBottom: 4,
  },
  codeEditorWrap: {
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid var(--color-border)',
    height: 250,
  },
  loadButton: {
    marginTop: 12,
    padding: '6px 16px',
    background: 'var(--color-accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
};
