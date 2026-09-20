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
    description: 'Initialize a new blueprint session',
    authRequired: true,
  },
  {
    method: 'POST',
    path: '/api/sessions/:id/generate',
    description: 'Trigger Compile AI parallel generation for BRD, HLD & Effort Estimate',
    authRequired: true,
  },
  {
    method: 'GET',
    path: '/api/sessions/:id',
    description: 'Retrieve complete session blueprint deliverables',
    authRequired: true,
  },
  {
    method: 'POST',
    path: '/api/ai/compile',
    description: 'Direct invocation of end-to-end Compile AI model pipeline',
    authRequired: true,
  }
];

export const wordExporter = {
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

    const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>Compile AI — ${session.title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; }
    h1 { font-size: 22pt; color: #1e1b4b; margin-bottom: 4pt; }
    h2 { font-size: 14pt; color: #4338ca; border-bottom: 1.5pt solid #c7d2fe; padding-bottom: 4pt; margin-top: 18pt; }
    h3 { font-size: 12pt; color: #0f172a; margin-top: 12pt; }
    table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 14pt; }
    th { background-color: #f1f5f9; border: 1pt solid #cbd5e1; padding: 6pt 8pt; font-weight: bold; text-align: left; }
    td { border: 1pt solid #e2e8f0; padding: 5pt 8pt; vertical-align: top; }
    .box { background-color: #f8fafc; border: 1pt solid #e2e8f0; padding: 8pt 12pt; margin-bottom: 10pt; }
    .footer { font-size: 9pt; color: #64748b; margin-top: 24pt; border-top: 1pt solid #cbd5e1; padding-top: 6pt; }
  </style>
</head>
<body>
  <h1>Compile AI: ${session.title}</h1>
  <p style="color: #64748b; font-size: 11pt;">Master Enterprise Solution Architecture & Delivery Blueprint</p>
  <p><strong>Status:</strong> Compiled & Certified &nbsp;|&nbsp; <strong>Version:</strong> v${brd?.version || 1}.0 &nbsp;|&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
  
  <hr style="border: none; border-top: 2pt solid #6366f1;" />

  <h2>1. Executive Business Requirements Document (BRD)</h2>
  <div class="box">
    <p><strong>Executive Objectives:</strong><br />${brd?.objectives || 'Transform operational workflows with automated AI reasoning.'}</p>
    <p><strong>Scope Boundaries:</strong><br />${brd?.scope || 'Covers intake, automated rule execution, multi-tier approvals, and REST API endpoints.'}</p>
  </div>

  <h3>Functional Requirements</h3>
  <table>
    <thead><tr><th style="width: 15%;">ID</th><th style="width: 25%;">Requirement</th><th>Description</th><th style="width: 15%;">Priority</th></tr></thead>
    <tbody>
      ${funcReqs.map(f => `<tr><td><strong>${f.id || 'FR'}</strong></td><td>${f.title}</td><td>${f.description}</td><td>${f.priority || 'Must Have'}</td></tr>`).join('')}
    </tbody>
  </table>

  <h3>Gap Analysis</h3>
  <table>
    <thead><tr><th style="width: 25%;">Operational Area</th><th style="width: 15%;">Impact</th><th>Friction vs Target Outcome</th></tr></thead>
    <tbody>
      ${gapAnalysis.map(g => `<tr><td><strong>${g.area}</strong></td><td>${g.impact}</td><td>${g.gap}</td></tr>`).join('')}
    </tbody>
  </table>

  <h2>2. Solution Architecture & High-Level Design (HLD)</h2>
  <div class="box">
    <p><strong>Architecture Overview:</strong><br />${architecture?.hld_summary || 'Decoupled cloud-native 3-tier architecture with web client, API Gateway, and managed database.'}</p>
  </div>

  <h3>Technology Stack Matrix</h3>
  <table>
    <thead><tr><th style="width: 20%;">Category</th><th style="width: 25%;">Choice</th><th>Architectural Rationale</th></tr></thead>
    <tbody>
      ${techStack.map(t => `<tr><td><strong>${t.category}</strong></td><td>${t.choice}</td><td>${t.rationale}</td></tr>`).join('')}
    </tbody>
  </table>

  <p><strong>Security & Compliance Safeguards:</strong><br />${architecture?.security_notes || 'TLS 1.3 in transit, AES-256 encryption at rest, strict RBAC boundary.'}</p>

  <h2>3. Process Intelligence & BPMN Workflows</h2>
  <table>
    <thead><tr><th style="width: 8%;">Step</th><th style="width: 25%;">Stage Name</th><th style="width: 12%;">Type</th><th style="width: 20%;">Actor</th><th>Description</th></tr></thead>
    <tbody>
      ${bpmnNodes.map((n, i) => `<tr><td>${i + 1}</td><td><strong>${n.name}</strong></td><td>${n.type}</td><td>${n.actor}</td><td>${n.description}</td></tr>`).join('')}
    </tbody>
  </table>

  <h2>4. Relational Database Schema & REST APIs</h2>
  ${dbTables.map(t => `
    <h4>Table: ${t.name} (${t.description})</h4>
    <table>
      <thead><tr><th style="width: 25%;">Column</th><th style="width: 20%;">Type</th><th style="width: 15%;">Key</th><th>Description</th></tr></thead>
      <tbody>
        ${(t.columns || []).map(c => `<tr><td>${c.name}</td><td>${c.type}</td><td>${c.isPk ? 'PRIMARY KEY' : c.isFk ? 'FOREIGN KEY' : 'Nullable'}</td><td>${c.description}</td></tr>`).join('')}
      </tbody>
    </table>
  `).join('')}

  <h3>REST API Endpoints</h3>
  <table>
    <thead><tr><th style="width: 15%;">Method</th><th style="width: 35%;">Path</th><th>Description</th><th style="width: 15%;">Auth</th></tr></thead>
    <tbody>
      ${apiEndpoints.map(e => `<tr><td><strong>${e.method}</strong></td><td><code>${e.path}</code></td><td>${e.description}</td><td>${e.authRequired ? 'JWT' : 'Public'}</td></tr>`).join('')}
    </tbody>
  </table>

  <h2>5. Effort, Cost Bands & Delivery Roadmap</h2>
  <div class="box">
    <p><strong>Cost Range:</strong> Low: $${estimate?.low_estimate_usd ? Number(estimate.low_estimate_usd).toLocaleString() : '28,000'} &nbsp;|&nbsp; <strong>Recommended Baseline:</strong> $${estimate?.mid_estimate_usd ? Number(estimate.mid_estimate_usd).toLocaleString() : '45,000'} &nbsp;|&nbsp; <strong>High Scale:</strong> $${estimate?.high_estimate_usd ? Number(estimate.high_estimate_usd).toLocaleString() : '68,000'}</p>
    <p><strong>Team Composition:</strong> ${team?.teamComposition || '1 Lead Architect, 2 Full-Stack Developers, 1 QA Engineer, 0.5 DevOps'}</p>
  </div>

  <table>
    <thead><tr><th>Phase</th><th style="width: 20%;">Duration</th><th style="width: 20%;">Allocation %</th></tr></thead>
    <tbody>
      ${phases.map(p => `<tr><td>${p.phase}</td><td>${p.weeks} Weeks</td><td>${p.percentage}%</td></tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated by Compile AI • Chaos2Commit 2026. Confidential Enterprise Architecture Document.</p>
  </div>
</body>
</html>`;

    return {
      content: Buffer.from(wordHtml, 'utf8'),
      mimeType: 'application/msword; charset=utf-8',
      extension: 'doc',
    };
  }
};
