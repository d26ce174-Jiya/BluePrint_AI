import { useState } from 'react';

/**
 * SwaggerApiExplorer — Interactive API & Microservice Endpoint Explorer
 * Allows viewing endpoints (GET, POST, PUT, DELETE), request bodies, parameters,
 * and live "Try It Out" execution with realistic response simulation.
 */

export default function SwaggerApiExplorer({ endpoints = [], title = 'Generated API Specification (OpenAPI 3.1)' }) {
  const [openEndpointId, setOpenEndpointId] = useState(endpoints[0]?.id || null);
  const [executingId, setExecutingId] = useState(null);
  const [responseOutputs, setResponseOutputs] = useState({});

  const METHOD_COLORS = {
    GET: { bg: 'bg-blue-50 text-blue-700 border-blue-200', tag: 'bg-blue-600 text-white' },
    POST: { bg: 'bg-green-50 text-green-700 border-green-200', tag: 'bg-green-600 text-white' },
    PUT: { bg: 'bg-amber-50 text-amber-700 border-amber-200', tag: 'bg-amber-600 text-white' },
    DELETE: { bg: 'bg-red-50 text-red-700 border-red-200', tag: 'bg-red-600 text-white' },
    PATCH: { bg: 'bg-purple-50 text-purple-700 border-purple-200', tag: 'bg-purple-600 text-white' },
  };

  const handleExecute = (ep) => {
    setExecutingId(ep.id);
    setTimeout(() => {
      setResponseOutputs(prev => ({
        ...prev,
        [ep.id]: {
          status: 200,
          statusText: 'OK',
          timeMs: Math.floor(Math.random() * 80 + 35),
          data: ep.sampleResponse || {
            success: true,
            timestamp: new Date().toISOString(),
            requestId: `req_${Math.random().toString(36).substring(2, 9)}`,
            result: 'Executed successfully against solution mock service.',
          },
        },
      }));
      setExecutingId(null);
    }, 600);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden my-4">
      {/* Swagger Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-secondary/80 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-green-600 flex items-center justify-center text-white text-[10px] font-mono font-bold">
            API
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground">OAS 3.1.0 · Base URL: <code className="text-primary font-mono text-[11px]">https://api.blueprint.internal/v1</code></p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
          ● {endpoints.length} Endpoints Active
        </span>
      </div>

      {/* Endpoints List */}
      <div className="divide-y divide-border">
        {endpoints.map((ep) => {
          const colors = METHOD_COLORS[ep.method] || METHOD_COLORS.GET;
          const isOpen = openEndpointId === ep.id;
          const res = responseOutputs[ep.id];
          const isRunning = executingId === ep.id;

          return (
            <div key={ep.id} className="transition-colors">
              {/* Endpoint row */}
              <div
                onClick={() => setOpenEndpointId(isOpen ? null : ep.id)}
                className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-secondary/40 select-none ${isOpen ? 'bg-secondary/20' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md uppercase tracking-wider ${colors.tag}`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {ep.path}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    — {ep.summary}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {ep.auth && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                      🔒 Bearer JWT
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs font-mono">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Endpoint Expanded Details */}
              {isOpen && (
                <div className="p-4 bg-secondary/15 border-t border-border/60 text-xs">
                  <p className="text-foreground text-xs leading-relaxed mb-3">
                    {ep.description || ep.summary}
                  </p>

                  {/* Parameters / Request Body */}
                  {ep.params && ep.params.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Parameters
                      </div>
                      <div className="bg-card border border-border rounded-lg p-2.5 divide-y divide-border/60">
                        {ep.params.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1 text-xs">
                            <span className="font-mono font-bold text-primary">{p.name}</span>
                            <span className="text-muted-foreground font-mono">{p.type} · {p.in}</span>
                            <span className="text-foreground">{p.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ep.requestBody && (
                    <div className="mb-3">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Sample Request Body (application/json)
                      </div>
                      <pre className="bg-card border border-border rounded-lg p-3 font-mono text-[11px] text-foreground overflow-x-auto">
                        {JSON.stringify(ep.requestBody, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Actions & Live Try-It-Out */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecute(ep);
                      }}
                      disabled={isRunning}
                      className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isRunning ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Executing...
                        </>
                      ) : (
                        '▶ Try it out'
                      )}
                    </button>

                    <span className="text-[11px] text-muted-foreground font-mono">
                      Produces: application/json
                    </span>
                  </div>

                  {/* Response Console */}
                  {res && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-green-700 uppercase">
                          Server Response: {res.status} {res.statusText}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Time: {res.timeMs}ms
                        </span>
                      </div>
                      <pre className="bg-card border border-green-200 rounded-lg p-3 font-mono text-[11px] text-green-900 overflow-x-auto">
                        {JSON.stringify(res.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
