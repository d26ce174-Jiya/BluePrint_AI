import { compileAiClient } from './compileAiClient.js';
import { inputAnalyzer } from './inputAnalyzer.js';

export const solutionArchitecture = {
  async generateArchitecture({ brd = {}, context = {}, rawInput = '', sessionTitle = '' }) {
    const analysis = await inputAnalyzer.analyze(rawInput || brd.objectives || '', context);

    let hldSummaryContent = `Decoupled web application architecture with React frontend, Node.js API server, and Python Compile AI inference engine.`;

    try {
      if (await compileAiClient.isHealthy()) {
        const sections = await compileAiClient.generate(rawInput || brd.objectives || '', {}, 'architecture');
        if (Array.isArray(sections) && sections.length > 0 && sections[0].content) {
          hldSummaryContent = sections[0].content;
        }
      }
    } catch (err) {
      console.warn('[SolutionArchitecture] Compile AI server architecture generation fallback:', err.message);
    }

    return {
      hldSummary: hldSummaryContent,
      techStack: [
        { category: 'Frontend UI', choice: 'React + Vite', rationale: 'Modern component-driven web interface with responsive state management.' },
        { category: 'Backend Gateway', choice: 'Node.js / Express', rationale: 'High-throughput asynchronous API gateway handling session lifecycle and auth.' },
        { category: 'AI Inference Engine', choice: 'Python FastAPI + Compile AI', rationale: 'Trained scikit-learn classifier model combined with Gemini AI consultant.' },
        { category: 'Database Tier', choice: 'MySQL 8.0 (InnoDB)', rationale: 'Relational ACID persistence for workspaces, sessions, BRDs, and version history.' },
        { category: 'Security & Auth', choice: 'JWT + TLS 1.3', rationale: 'Stateless session tokens and encrypted transit for enterprise compliance.' }
      ],
      components: [
        { name: 'Web Application Client', responsibility: 'Interactive intake, discovery chat, and tabbed blueprint editor', tech: 'React / Vite', scaling: 'Static CDN' },
        { name: 'API Ingress Gateway', responsibility: 'JWT authentication, session routing, and document parsing', tech: 'Node.js Express', scaling: 'Horizontal Pods' },
        { name: 'Compile AI Microservice', responsibility: 'Trained model classification, discovery Q&A, and BRD/HLD generation', tech: 'Python FastAPI / Joblib', scaling: 'Microservice' },
        { name: 'Relational Persistence Store', responsibility: 'ACID transactional storage for workspaces, sessions, and audit logs', tech: 'MySQL 8.0', scaling: 'Primary/Replica' }
      ],
      dataFlow: '1. User submits requirement -> 2. Express API validates session & JWT -> 3. Express proxies to Python Compile AI service -> 4. Trained model classifies industry/scale & generates HLD -> 5. Persisted to MySQL -> 6. Rendered in React UI.',
      securityNotes: 'TLS 1.3 encryption in transit, AES-256 for credentials at rest, JWT RBAC, and workspace isolation.',
      bpmnWorkflows: {
        processName: `End-to-End ${analysis.problemTitle || 'Transformation'} Architecture Pipeline`,
        slaTarget: '< 24 Hours',
        nodes: [
          { id: 'node-1', name: 'Requirement Intake & Parsing', type: 'start', actor: 'User / System', description: 'Intakes free text, SOP or PDF documents', duration: 'Instant' },
          { id: 'node-2', name: 'Compile AI Classification', type: 'task', actor: 'Trained Joblib Model', description: 'Classifies industry, scale, problem title & cost band', duration: '< 1s' },
          { id: 'node-3', name: 'Discovery Question Generation', type: 'task', actor: 'AI Consultant', description: 'Generates targeted clarifying questions', duration: '< 3s' },
          { id: 'node-4', name: 'Blueprint Synthesis & Assembly', type: 'service', actor: 'Compile AI Engine', description: 'Generates BRD, HLD Architecture, and Effort Estimate', duration: '< 8s' },
          { id: 'node-5', name: 'Deliverable Archival & Versioning', type: 'end', actor: 'System', description: 'Saves version snapshot to MySQL and presents interactive blueprint', duration: 'Complete' }
        ],
        decisionGates: [
          { condition: 'Input validation confidence >= 80%', outcomeIfTrue: 'Proceed to Discovery & Blueprint Generation', outcomeIfFalse: 'Prompt user for additional operational context' }
        ],
        escalations: [
          { trigger: 'API processing timeout > 15s', action: 'Fallback to dataset synthesis pipeline', owner: 'Compile AI Engine' }
        ]
      },
      databaseSchema: {
        tables: [
          {
            name: 'workspaces',
            description: 'Core organization workspace container',
            columns: [
              { name: 'id', type: 'CHAR(36)', isPk: true, isFk: false, isNullable: false, description: 'Workspace UUID' },
              { name: 'name', type: 'VARCHAR(255)', isPk: false, isFk: false, isNullable: false, description: 'Workspace name' },
              { name: 'created_at', type: 'TIMESTAMP', isPk: false, isFk: false, isNullable: false, description: 'Creation timestamp' }
            ]
          },
          {
            name: 'sessions',
            description: 'Transformation blueprint session state and status tracking',
            columns: [
              { name: 'id', type: 'CHAR(36)', isPk: true, isFk: false, isNullable: false, description: 'Session UUID' },
              { name: 'workspace_id', type: 'CHAR(36)', isPk: false, isFk: true, isNullable: false, description: 'Foreign key to workspace' },
              { name: 'title', type: 'VARCHAR(255)', isPk: false, isFk: false, isNullable: false, description: 'Blueprint session title' },
              { name: 'status', type: 'ENUM("draft","discovery","generating","completed")', isPk: false, isFk: false, isNullable: false, description: 'Lifecycle status' }
            ]
          },
          {
            name: 'business_contexts',
            description: 'Normalized business goals, pain points, and existing legacy tools',
            columns: [
              { name: 'id', type: 'CHAR(36)', isPk: true, isFk: false, isNullable: false, description: 'Context UUID' },
              { name: 'session_id', type: 'CHAR(36)', isPk: false, isFk: true, isNullable: false, description: 'Foreign key to session' },
              { name: 'goals', type: 'TEXT', isPk: false, isFk: false, isNullable: true, description: 'Target transformation goals' },
              { name: 'existing_systems', type: 'TEXT', isPk: false, isFk: false, isNullable: true, description: 'Detected legacy tools/ERPs' }
            ]
          },
          {
            name: 'brds',
            description: 'Generated Business Requirement Document deliverable',
            columns: [
              { name: 'id', type: 'CHAR(36)', isPk: true, isFk: false, isNullable: false, description: 'BRD UUID' },
              { name: 'session_id', type: 'CHAR(36)', isPk: false, isFk: true, isNullable: false, description: 'Foreign key to session' },
              { name: 'objectives', type: 'TEXT', isPk: false, isFk: false, isNullable: true, description: 'Executive objectives' },
              { name: 'functional_requirements', type: 'JSON', isPk: false, isFk: false, isNullable: true, description: 'Array of functional specs' }
            ]
          },
          {
            name: 'solution_architectures',
            description: 'Generated High-Level Design (HLD) architecture and tech stack',
            columns: [
              { name: 'id', type: 'CHAR(36)', isPk: true, isFk: false, isNullable: false, description: 'Architecture UUID' },
              { name: 'session_id', type: 'CHAR(36)', isPk: false, isFk: true, isNullable: false, description: 'Foreign key to session' },
              { name: 'hld_summary', type: 'TEXT', isPk: false, isFk: false, isNullable: true, description: 'High level architecture overview' },
              { name: 'tech_stack', type: 'JSON', isPk: false, isFk: false, isNullable: true, description: 'Technology choices and rationales' }
            ]
          }
        ]
      },
      apiSpecs: {
        endpoints: [
          {
            method: 'POST',
            path: '/api/sessions',
            summary: 'Initialize a new transformation blueprint session',
            authRequired: true,
            requestBody: '{\n  "title": "Customer Onboarding & KYC",\n  "initialText": "Manual document review process..."\n}',
            responseSample: '{\n  "success": true,\n  "session": { "id": "sess-123", "status": "discovery" }\n}'
          },
          {
            method: 'POST',
            path: '/api/sessions/:id/generate',
            summary: 'Trigger Compile AI parallel generation for BRD, HLD & Effort Estimate',
            authRequired: true,
            requestBody: '{\n  "force": true\n}',
            responseSample: '{\n  "success": true,\n  "status": "completed",\n  "brd": { ... },\n  "architecture": { ... }\n}'
          },
          {
            method: 'GET',
            path: '/api/sessions/:id',
            summary: 'Retrieve complete session blueprint deliverables',
            authRequired: true,
            requestBody: 'None (URL Param :id)',
            responseSample: '{\n  "success": true,\n  "session": { ... },\n  "brd": { ... },\n  "architecture": { ... }\n}'
          },
          {
            method: 'POST',
            path: '/api/ai/compile',
            summary: 'Direct invocation of end-to-end Compile AI model pipeline',
            authRequired: true,
            requestBody: '{\n  "text": "Automate invoice reconciliation"\n}',
            responseSample: '{\n  "success": true,\n  "result": { "classification": { ... }, "consultant_output": [ ... ] }\n}'
          },
          {
            method: 'GET',
            path: '/api/export/session/:id?format=pdf',
            summary: 'Export complete blueprint deliverable as PDF or Word document',
            authRequired: true,
            requestBody: 'None',
            responseSample: 'Binary PDF File Download'
          }
        ]
      }
    };
  }
};
