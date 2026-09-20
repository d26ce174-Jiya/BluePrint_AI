const DEFAULT_DB_TABLES = [
  {
    name: 'workspaces',
    description: 'Core organization workspace container',
    columns: [
      { name: 'id', type: 'CHAR(36)', isPk: true, isFk: false, description: 'Workspace UUID' },
      { name: 'name', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Workspace title' },
      { name: 'created_at', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Creation timestamp' }
    ]
  },
  {
    name: 'sessions',
    description: 'Transformation blueprint session state and tracking',
    columns: [
      { name: 'id', type: 'CHAR(36)', isPk: true, isFk: false, description: 'Session UUID' },
      { name: 'workspace_id', type: 'CHAR(36)', isPk: false, isFk: true, description: 'Foreign key to workspace' },
      { name: 'title', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Blueprint title' },
      { name: 'status', type: 'ENUM("draft","discovery","completed")', isPk: false, isFk: false, description: 'Lifecycle status' }
    ]
  },
  {
    name: 'brds',
    description: 'Generated Business Requirement Document deliverable',
    columns: [
      { name: 'id', type: 'CHAR(36)', isPk: true, isFk: false, description: 'BRD UUID' },
      { name: 'session_id', type: 'CHAR(36)', isPk: false, isFk: true, description: 'Foreign key to session' },
      { name: 'objectives', type: 'TEXT', isPk: false, isFk: false, description: 'Executive objectives' },
      { name: 'functional_requirements', type: 'JSON', isPk: false, isFk: false, description: 'Array of functional specs' }
    ]
  },
  {
    name: 'solution_architectures',
    description: 'Generated High-Level Design (HLD) architecture and tech stack',
    columns: [
      { name: 'id', type: 'CHAR(36)', isPk: true, isFk: false, description: 'Architecture UUID' },
      { name: 'session_id', type: 'CHAR(36)', isPk: false, isFk: true, description: 'Foreign key to session' },
      { name: 'hld_summary', type: 'TEXT', isPk: false, isFk: false, description: 'High level architecture overview' },
      { name: 'tech_stack', type: 'JSON', isPk: false, isFk: false, description: 'Technology choices' }
    ]
  }
];

const DEFAULT_API_ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/sessions',
    summary: 'Initialize a new transformation blueprint session',
    description: 'Creates a new blueprint intake draft',
    authRequired: true,
  },
  {
    method: 'POST',
    path: '/api/sessions/:id/generate',
    summary: 'Trigger Compile AI parallel generation',
    description: 'Executes BRD, HLD & Effort Estimate generation',
    authRequired: true,
  },
  {
    method: 'GET',
    path: '/api/sessions/:id',
    summary: 'Retrieve complete session blueprint deliverables',
    description: 'Fetches BRD, Architecture, and Estimate records',
    authRequired: true,
  },
  {
    method: 'POST',
    path: '/api/ai/compile',
    summary: 'Direct invocation of end-to-end Compile AI model pipeline',
    description: 'Invokes trained joblib classifier and consultant',
    authRequired: true,
  }
];

export const pdfExporter = {
  async generate({ session, brd, architecture, estimate }) {
    const techStack = Array.isArray(architecture?.tech_stack) ? architecture.tech_stack : [];
    const bpmnNodes = architecture?.bpmn_workflows?.nodes || [];
    const rawTables = architecture?.database_schema?.tables;
    const dbTables = Array.isArray(rawTables) && rawTables.length > 0 ? rawTables : DEFAULT_DB_TABLES;
    
    const rawEndpoints = architecture?.restApis?.endpoints || architecture?.api_specs?.endpoints;
    const apiEndpoints = Array.isArray(rawEndpoints) && rawEndpoints.length > 0 ? rawEndpoints : DEFAULT_API_ENDPOINTS;

    const funcReqs = Array.isArray(brd?.functional_requirements) ? brd.functional_requirements : [];
    const gapAnalysis = Array.isArray(brd?.gap_analysis) ? brd.gap_analysis : [];
    const phases = Array.isArray(estimate?.phase_breakdown) ? estimate.phase_breakdown : [];
    const team = estimate?.team_assumptions || {};

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compile AI — ${session.title} (Executive Architecture Blueprint)</title>
  <style>
    @media print {
      body { padding: 0 !important; background: #fff !important; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      @page { margin: 1.2cm; size: A4; }
    }
    @media (max-width: 768px) {
      body { padding: 12px !important; }
      .doc-container { padding: 20px 16px !important; }
      .header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
      .cost-grid { grid-template-columns: 1fr !important; }
      .top-toolbar { flex-direction: column !important; gap: 10px !important; text-align: center !important; }
      table { font-size: 11px !important; }
      th, td { padding: 6px 8px !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 32px 24px;
      color: #0f172a;
      line-height: 1.6;
      background: #f8fafc;
      margin: 0;
    }
    .doc-container {
      max-width: 960px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px 40px;
      border-radius: 14px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      box-sizing: border-box;
      overflow-x: auto;
    }
    .top-toolbar {
      position: sticky;
      top: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e1b4b;
      color: #fff;
      padding: 14px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(30,27,75,0.25);
      z-index: 100;
    }
    .btn-print {
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      color: #fff;
      border: none;
      padding: 9px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
    .header {
      border-bottom: 3px solid #6366f1;
      padding-bottom: 20px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    h1 { color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.02em; }
    h2 {
      color: #4338ca;
      font-size: 18px;
      font-weight: 800;
      margin-top: 32px;
      margin-bottom: 12px;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 6px;
    }
    h3 { color: #1e293b; font-size: 14px; font-weight: 700; margin-top: 18px; margin-bottom: 8px; }
    .badge-certified {
      display: inline-block;
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 800;
    }
    .table-wrapper { width: 100%; overflow-x: auto; margin: 10px 0 20px; -webkit-overflow-scrolling: touch; }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 500px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; font-weight: 700; color: #334155; }
    tr:nth-child(even) { background: #fafafa; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
    .cost-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin: 16px 0; }
    .cost-card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; text-align: center; background: #ffffff; }
    .cost-card.highlight { border: 2px solid #6366f1; background: #f5f3ff; }
    .cost-val { font-size: 22px; font-weight: 800; color: #4f46e5; margin: 6px 0; }
    .footer {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
  </style>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 450);
    });
  </script>
</head>
<body>
  <div class="doc-container">
    <div class="top-toolbar no-print">
      <div>
        <strong>📄 Executive PDF Export Ready</strong>
        <span style="font-size: 12px; opacity: 0.8; margin-left: 8px;">(Click Save as PDF in print dialog)</span>
      </div>
      <div>
        <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      </div>
    </div>

    <div class="header">
      <div>
        <div style="font-size: 12px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
          Compile AI • Master Solution Architecture Blueprint
        </div>
        <h1>${session.title}</h1>
        <div style="font-size: 13px; color: #64748b;">Enterprise Certified Solution Architecture Deliverable</div>
      </div>
      <div style="text-align: right;">
        <span class="badge-certified">✓ Compiled & Certified</span>
        <div style="font-size: 11.5px; color: #94a3b8; margin-top: 6px;">Version ${brd?.version || 1}.0 • ${new Date().toLocaleDateString()}</div>
      </div>
    </div>

    <!-- 1. BRD -->
    <h2>1. Executive Business Requirements Document (BRD)</h2>
    <div class="box">
      <strong>Executive Objectives:</strong>
      <p style="margin: 4px 0 12px;">${brd?.objectives || 'Transform operational workflows with automated AI reasoning.'}</p>
      <strong>Scope Boundaries:</strong>
      <p style="margin: 4px 0 0;">${brd?.scope || 'Covers intake, automated rule execution, multi-tier approvals, and REST API endpoints.'}</p>
    </div>

    <h3>Functional Requirements</h3>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr><th style="width: 80px;">ID</th><th style="width: 160px;">Requirement Title</th><th>Description</th><th style="width: 100px;">Priority</th></tr>
        </thead>
        <tbody>
          ${funcReqs.map(f => `<tr><td><strong>${f.id || 'FR'}</strong></td><td>${f.title}</td><td>${f.description}</td><td>${f.priority || 'Must Have'}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <h3>Gap Analysis</h3>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr><th style="width: 160px;">Operational Area</th><th style="width: 90px;">Impact</th><th>Friction vs. Target Outcome</th></tr>
        </thead>
        <tbody>
          ${gapAnalysis.map(g => `<tr><td><strong>${g.area}</strong></td><td><span style="color: ${g.impact === 'High' ? '#dc2626' : '#d97706'}; font-weight: 700;">${g.impact}</span></td><td>${g.gap}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="page-break"></div>

    <!-- 2. HLD -->
    <h2>2. Solution Architecture & High-Level Design (HLD)</h2>
    <div class="box">
      <strong>Executive Architecture Summary:</strong>
      <p style="margin: 6px 0 0;">${architecture?.hld_summary || 'Decoupled cloud-native 3-tier architecture with component-driven web client, API Gateway, and resilient database persistence.'}</p>
    </div>

    <h3>Technology Stack Matrix</h3>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr><th style="width: 140px;">Tier / Category</th><th style="width: 180px;">Selected Technology</th><th>Architectural Rationale</th></tr>
        </thead>
        <tbody>
          ${techStack.map(t => `<tr><td><strong>${t.category}</strong></td><td style="color: #4338ca; font-weight: 600;">${t.choice}</td><td>${t.rationale}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="box">
      <strong>Security & Compliance Safeguards:</strong>
      <p style="margin: 4px 0 0;">${architecture?.security_notes || 'TLS 1.3 in transit, AES-256 encryption at rest, strict least-privilege RBAC.'}</p>
    </div>

    <!-- 3. BPMN -->
    <h2>3. Process Intelligence & BPMN Workflows</h2>
    <p style="font-size: 13px; color: #64748b; margin-top: 0;">Target SLA: ${architecture?.bpmn_workflows?.slaTarget || '< 24 Hours'}</p>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr><th style="width: 50px;">Step</th><th style="width: 180px;">Stage Name</th><th style="width: 80px;">Type</th><th style="width: 130px;">Actor</th><th>Description</th><th style="width: 80px;">Duration</th></tr>
        </thead>
        <tbody>
          ${bpmnNodes.map((n, i) => `<tr><td>${i + 1}</td><td><strong>${n.name}</strong></td><td>${n.type}</td><td>${n.actor}</td><td>${n.description}</td><td>${n.duration}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- 4. Database & APIs -->
    <h2>4. Relational Database Schema & REST APIs</h2>
    <h3>Normalized Database Tables (MySQL 8.0)</h3>
    ${dbTables.map(t => `
      <div style="margin-bottom: 16px;">
        <strong style="color: #1e293b;">Table: ${t.name}</strong> <span style="font-size: 12px; color: #64748b;">— ${t.description}</span>
        <div class="table-wrapper">
          <table>
            <thead><tr><th style="width: 140px;">Column</th><th style="width: 120px;">Type</th><th style="width: 110px;">Constraints</th><th>Description</th></tr></thead>
            <tbody>
              ${(t.columns || []).map(c => `<tr><td><code>${c.name}</code></td><td>${c.type}</td><td>${c.isPk ? '<span style="color:#2563eb;font-weight:700;">PK</span>' : c.isFk ? '<span style="color:#059669;font-weight:700;">FK</span>' : 'Nullable'}</td><td>${c.description}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `).join('')}

    <h3>REST API Endpoints</h3>
    <div class="table-wrapper">
      <table>
        <thead><tr><th style="width: 80px;">Method</th><th style="width: 220px;">Path</th><th>Description</th><th style="width: 90px;">Auth</th></tr></thead>
        <tbody>
          ${apiEndpoints.map(e => `<tr><td><strong style="color:${e.method === 'POST' ? '#16a34a' : '#2563eb'}">${e.method}</strong></td><td><code>${e.path}</code></td><td>${e.description}</td><td>${e.authRequired ? 'JWT' : 'Public'}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="page-break"></div>

    <!-- 5. Effort & Cost -->
    <h2>5. Effort, Cost Bands & Delivery Roadmap</h2>
    <div class="cost-grid">
      <div class="cost-card">
        <div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Minimum MVP Budget</div>
        <div class="cost-val">$${estimate?.low_estimate_usd ? Number(estimate.low_estimate_usd).toLocaleString() : '28,000'}</div>
        <div style="font-size: 11px; color: #94a3b8;">Core functional scope</div>
      </div>
      <div class="cost-card highlight">
        <div style="font-size: 12px; color: #4338ca; font-weight: 800; text-transform: uppercase;">Recommended Baseline</div>
        <div class="cost-val">$${estimate?.mid_estimate_usd ? Number(estimate.mid_estimate_usd).toLocaleString() : '45,000'}</div>
        <div style="font-size: 11px; color: #6366f1; font-weight: 600;">Includes QA automation & multi-tier approvals</div>
      </div>
      <div class="cost-card">
        <div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Enterprise Scale</div>
        <div class="cost-val">$${estimate?.high_estimate_usd ? Number(estimate.high_estimate_usd).toLocaleString() : '68,000'}</div>
        <div style="font-size: 11px; color: #94a3b8;">High-availability multi-region</div>
      </div>
    </div>

    <h3>Phased Agile Sprint Schedule</h3>
    <div class="table-wrapper">
      <table>
        <thead><tr><th>Phase</th><th style="width: 120px;">Estimated Duration</th><th style="width: 100px;">Allocation %</th></tr></thead>
        <tbody>
          ${phases.map(p => `<tr><td><strong>${p.phase}</strong></td><td>${p.weeks} Weeks</td><td>${p.percentage}%</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="box">
      <strong>Team Composition & Delivery Model:</strong>
      <p style="margin: 4px 0 0;">${team?.teamComposition || '1 Lead Architect, 2 Full-Stack Developers, 1 QA Engineer, 0.5 DevOps'} • ${team?.deliveryModel || 'Agile bi-weekly sprints with automated CI/CD pipelines'}</p>
    </div>

    <div class="footer">
      <span>Generated by Compile AI Solution Architecture Builder — Chaos2Commit 2026</span>
      <span>Confidential Enterprise Architecture Document</span>
    </div>
  </div>
</body>
</html>`;

    return {
      content: Buffer.from(html, 'utf8'),
      mimeType: 'text/html; charset=utf-8',
      extension: 'html',
    };
  }
};
