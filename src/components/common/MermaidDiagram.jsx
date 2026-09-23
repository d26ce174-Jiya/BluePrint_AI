import { useEffect, useRef, useState } from 'react';

/**
 * MermaidDiagram — Enterprise Diagram Renderer using Mermaid.js
 * Supports Architecture diagrams, ER diagrams, Sequence diagrams, and BPMN process workflows.
 *
 * Mermaid is loaded dynamically (dynamic import) so its 5 MB bundle is only
 * fetched when this component actually mounts — not on the landing page.
 */

// Singleton: mermaid is loaded and initialized exactly once
let _mermaidInstance = null;
let _mermaidLoading = null;

async function getMermaid() {
  if (_mermaidInstance) return _mermaidInstance;
  if (_mermaidLoading) return _mermaidLoading;

  _mermaidLoading = import('mermaid').then(({ default: mermaid }) => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, sans-serif',
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
        er: { useMaxWidth: true },
      });
    } catch (e) {
      console.warn('Mermaid initialization note:', e);
    }
    _mermaidInstance = mermaid;
    _mermaidLoading = null;
    return mermaid;
  });

  return _mermaidLoading;
}

export default function MermaidDiagram({ chart, id = 'mermaid-chart', title, subtitle }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      if (!chart || !chart.trim()) {
        setSvgContent('');
        return;
      }

      setError(null);
      try {
        const mermaid = await getMermaid();
        const uniqueId = `${id}-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, chart.trim());
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.warn('Mermaid render error:', err);
        if (isMounted) {
          setError('Could not render diagram syntax directly. Displaying diagram blueprint.');
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chart, id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${id || 'blueprint-diagram'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden my-4">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/60 border-b border-border">
        <div>
          {title && <h4 className="text-sm font-bold text-foreground">{title}</h4>}
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-card border border-border rounded-lg text-xs">
            <button
              onClick={() => setZoom(z => Math.max(0.6, z - 0.15))}
              className="px-2 py-1 text-muted-foreground hover:text-foreground border-r border-border cursor-pointer"
              title="Zoom out"
            >
              -
            </button>
            <span className="px-2 py-1 text-[11px] font-mono text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(2.0, z + 0.15))}
              className="px-2 py-1 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Zoom in"
            >
              +
            </button>
          </div>

          {/* Copy code button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title="Copy Mermaid Code"
          >
            {copied ? '✓ Copied' : 'Copy Code'}
          </button>

          {/* Download SVG */}
          {svgContent && (
            <button
              onClick={handleDownloadSvg}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
              title="Export SVG"
            >
              Export SVG
            </button>
          )}
        </div>
      </div>

      {/* Diagram Canvas */}
      <div className="p-6 overflow-x-auto min-h-[220px] flex items-center justify-center bg-white">
        {error ? (
          <div className="w-full">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg mb-3">
              ⚠️ {error}
            </p>
            <pre className="text-xs font-mono bg-secondary p-4 rounded-lg overflow-x-auto text-foreground">
              {chart}
            </pre>
          </div>
        ) : svgContent ? (
          <div
            ref={containerRef}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}
            className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="animate-spin h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Rendering enterprise diagram...
          </div>
        )}
      </div>
    </div>
  );
}
