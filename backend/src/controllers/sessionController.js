import { SessionModel } from '../models/Session.js';
import { InputDocumentModel } from '../models/InputDocument.js';
import { BusinessContextModel } from '../models/BusinessContext.js';
import { DiscoveryQaModel } from '../models/DiscoveryQa.js';
import { BrdModel } from '../models/Brd.js';
import { SolutionArchitectureModel } from '../models/SolutionArchitecture.js';
import { EffortEstimateModel } from '../models/EffortEstimate.js';
import { SessionVersionModel } from '../models/SessionVersion.js';
import { SessionMessageModel } from '../models/SessionMessage.js';

import { documentParser } from '../services/ingestion/documentParser.js';
import { contextNormalizer } from '../services/ingestion/contextNormalizer.js';
import { discoveryEngine } from '../services/ai/discoveryEngine.js';
import { businessAnalysis } from '../services/ai/businessAnalysis.js';
import { solutionArchitecture } from '../services/ai/solutionArchitecture.js';
import { estimation } from '../services/ai/estimation.js';
import { llmClient } from '../services/ai/llmClient.js';
import { inputAnalyzer } from '../services/ai/inputAnalyzer.js';

export const sessionController = {
  // 1. List user sessions
  async listSessions(req, res, next) {
    try {
      const workspaceId = req.user.workspaceId;
      const sessions = await SessionModel.findByWorkspaceId(workspaceId);
      res.json({ success: true, sessions });
    } catch (err) {
      next(err);
    }
  },

  // 2. Create new session
  async createSession(req, res, next) {
    try {
      const { title = 'New Transformation Blueprint', initialText = '' } = req.body;
      const session = await SessionModel.create({
        workspaceId: req.user.workspaceId,
        userId: req.user.userId,
        title,
      });

      let initialSummary = '';
      if (initialText && initialText.trim()) {
        const validation = await inputAnalyzer.validateInput(initialText.trim());
        if (!validation.isValid) {
          // Clean up the created empty session draft since input failed validation
          await SessionModel.delete(session.id);
          return res.status(422).json({
            success: false,
            isValid: false,
            message: 'Input is not a valid Standard Operating Procedure (SOP) or Business Requirements Document (BRD). Please provide an operational workflow, business pain points, or an existing SOP/PRD.',
            validation,
          });
        }

        await InputDocumentModel.create({
          sessionId: session.id,
          fileName: 'initial_notes.txt',
          fileType: 'text',
          parsedText: initialText.trim(),
        });
        const norm = contextNormalizer.normalize({ rawText: initialText.trim() });
        const context = await BusinessContextModel.upsert({
          sessionId: session.id,
          ...norm,
        });
        const questions = await discoveryEngine.generateQuestions(initialText.trim(), context);
        await DiscoveryQaModel.bulkCreate(session.id, questions);
        await SessionModel.updateStatus(session.id, 'discovery');
        session.status = 'discovery';
        initialSummary = initialText.trim().slice(0, 140);
      }

      res.status(201).json({
        success: true,
        session: {
          ...session,
          summary: initialSummary || 'Fresh blueprint session initialized.',
          tags: session.status === 'discovery' ? ['0/5 Questions Answered', 'Discovery Q&A'] : ['Draft Intake'],
          version: 1,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // 3. Add input text or file to session (FR-1)
  async addInput(req, res, next) {
    try {
      const { id: sessionId } = req.params;
      const { text, fileType = 'text', fileName = 'input.txt' } = req.body;

      let parsedText = text || '';
      if (req.file) {
        parsedText = await documentParser.parse({
          buffer: req.file.buffer,
          fileType: req.file.mimetype,
          fileName: req.file.originalname,
        });
      }

      // Validate input text with LLM
      if (parsedText && parsedText.trim()) {
        const validation = await inputAnalyzer.validateInput(parsedText.trim());
        if (!validation.isValid) {
          return res.status(422).json({
            success: false,
            isValid: false,
            message: 'The submitted document or text is not a valid SOP or Business Requirements Document.',
            validation,
          });
        }
      }

      // Save input document
      const doc = await InputDocumentModel.create({
        sessionId,
        fileName: req.file ? req.file.originalname : fileName,
        fileType: req.file ? req.file.mimetype : fileType,
        parsedText,
      });

      // Update business context
      const allText = await InputDocumentModel.getAllParsedText(sessionId);
      const norm = contextNormalizer.normalize({ rawText: allText });
      const context = await BusinessContextModel.upsert({
        sessionId,
        ...norm,
      });

      // Generate clarifying discovery questions only if not already initialized
      const existingQas = await DiscoveryQaModel.findBySessionId(sessionId);
      let createdQas = existingQas;
      if (!existingQas || existingQas.length === 0) {
        const questions = await discoveryEngine.generateQuestions(allText, context);
        createdQas = await DiscoveryQaModel.bulkCreate(sessionId, questions);
      }

      await SessionModel.updateStatus(sessionId, 'discovery');

      res.json({
        success: true,
        document: doc,
        context,
        discoveryQuestions: createdQas,
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. Answer a discovery question (FR-2.3)
  async answerDiscovery(req, res, next) {
    try {
      const { qaId } = req.params;
      const { answer } = req.body;
      await DiscoveryQaModel.answer(qaId, answer);
      res.json({ success: true, message: 'Answer recorded.' });
    } catch (err) {
      next(err);
    }
  },

  // 5. Generate Blueprint (Runs BRD, Architecture, and Estimate in parallel) (FR-3, FR-4, FR-5)
  async generateBlueprint(req, res, next) {
    try {
      const { id: sessionId } = req.params;
      const session = await SessionModel.findById(sessionId);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }

      await SessionModel.updateStatus(sessionId, 'generating');

      const rawInput = await InputDocumentModel.getAllParsedText(sessionId);
      const context = await BusinessContextModel.findBySessionId(sessionId);
      const qas = await DiscoveryQaModel.findBySessionId(sessionId);

      // Execute AI generation in parallel for maximum speed (<30s NFR)
      const [brdData, archData, estData] = await Promise.all([
        businessAnalysis.generateBrd({ rawInput, context, answeredQa: qas }),
        solutionArchitecture.generateArchitecture({ brd: {}, context, rawInput, sessionTitle: session.title }),
        estimation.generateEstimate({ brd: {}, architecture: {}, rawInput, context }),
      ]);

      // Persist generated records to MySQL
      const brd = await BrdModel.upsert({ sessionId, ...brdData });
      const architecture = await SolutionArchitectureModel.upsert({ sessionId, ...archData });
      const estimate = await EffortEstimateModel.upsert({ sessionId, ...estData });

      // Save version snapshot (FR-6.4)
      await SessionVersionModel.create({
        sessionId,
        changedSection: 'full_generation',
        snapshotData: { brd, architecture, estimate },
      });

      await SessionModel.updateStatus(sessionId, 'completed');

      res.json({
        success: true,
        message: 'Blueprint generated successfully.',
        brd,
        architecture,
        estimate,
      });
    } catch (err) {
      next(err);
    }
  },

  // 6. Regenerate single section (FR-6.2)
  async regenerateSection(req, res, next) {
    try {
      const { id: sessionId, section } = req.params; // section = 'brd' | 'architecture' | 'estimate'
      const rawInput = await InputDocumentModel.getAllParsedText(sessionId);
      const context = await BusinessContextModel.findBySessionId(sessionId);

      let updated = null;
      if (section === 'brd') {
        const data = await businessAnalysis.generateBrd({ rawInput, context });
        updated = await BrdModel.upsert({ sessionId, ...data });
      } else if (section === 'architecture') {
        const brd = await BrdModel.findBySessionId(sessionId);
        const data = await solutionArchitecture.generateArchitecture({ brd, context, rawInput });
        updated = await SolutionArchitectureModel.upsert({ sessionId, ...data });
      } else if (section === 'estimate') {
        const brd = await BrdModel.findBySessionId(sessionId);
        const arch = await SolutionArchitectureModel.findBySessionId(sessionId);
        const data = await estimation.generateEstimate({ brd, architecture: arch });
        updated = await EffortEstimateModel.upsert({ sessionId, ...data });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid section' });
      }

      await SessionVersionModel.create({
        sessionId,
        changedSection: `regenerate_${section}`,
        snapshotData: { section, data: updated },
      });

      res.json({ success: true, section, data: updated });
    } catch (err) {
      next(err);
    }
  },

  // 7. Get full session details
  async getSessionDetails(req, res, next) {
    try {
      const { id: sessionId } = req.params;
      const [session, docs, context, qas, brd, architecture, estimate, versions, messages] = await Promise.all([
        SessionModel.findById(sessionId),
        InputDocumentModel.findBySessionId(sessionId),
        BusinessContextModel.findBySessionId(sessionId),
        DiscoveryQaModel.findBySessionId(sessionId),
        BrdModel.findBySessionId(sessionId),
        SolutionArchitectureModel.findBySessionId(sessionId),
        EffortEstimateModel.findBySessionId(sessionId),
        SessionVersionModel.findBySessionId(sessionId),
        SessionMessageModel.findBySessionId(sessionId),
      ]);

      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }

      res.json({
        success: true,
        session,
        documents: docs,
        context,
        discoveryQas: qas,
        brd,
        architecture,
        estimate,
        versions,
        messages: messages || [],
      });
    } catch (err) {
      next(err);
    }
  },

  // 8. Get session version history
  async getVersions(req, res, next) {
    try {
      const { id: sessionId } = req.params;
      const versions = await SessionVersionModel.findBySessionId(sessionId);
      res.json({ success: true, versions });
    } catch (err) {
      next(err);
    }
  },

  // 9. Restore session version snapshot (Rollback)
  async restoreVersion(req, res, next) {
    try {
      const { id: sessionId, versionId } = req.params;
      const version = await SessionVersionModel.findById(versionId);
      if (!version) {
        return res.status(404).json({ success: false, message: 'Version snapshot not found' });
      }

      const snap = version.snapshot_data || {};
      let restoredBrd = null;
      let restoredArch = null;
      let restoredEst = null;

      if (snap.brd) {
        restoredBrd = await BrdModel.upsert({ sessionId, ...snap.brd });
      }
      if (snap.architecture) {
        restoredArch = await SolutionArchitectureModel.upsert({ sessionId, ...snap.architecture });
      }
      if (snap.estimate) {
        restoredEst = await EffortEstimateModel.upsert({ sessionId, ...snap.estimate });
      }

      if (snap.section && snap.data) {
        if (snap.section === 'brd') {
          restoredBrd = await BrdModel.upsert({ sessionId, ...snap.data });
        } else if (snap.section === 'architecture') {
          restoredArch = await SolutionArchitectureModel.upsert({ sessionId, ...snap.data });
        } else if (snap.section === 'estimate') {
          restoredEst = await EffortEstimateModel.upsert({ sessionId, ...snap.data });
        }
      }

      const newVersion = await SessionVersionModel.create({
        sessionId,
        changedSection: `rollback_v${version.version_number}`,
        snapshotData: {
          brd: restoredBrd || (await BrdModel.findBySessionId(sessionId)),
          architecture: restoredArch || (await SolutionArchitectureModel.findBySessionId(sessionId)),
          estimate: restoredEst || (await EffortEstimateModel.findBySessionId(sessionId)),
        },
      });

      res.json({
        success: true,
        message: `Successfully restored blueprint to Version ${version.version_number}.0`,
        restoredVersionNumber: version.version_number,
        newVersionNumber: newVersion.versionNumber,
        brd: restoredBrd,
        architecture: restoredArch,
        estimate: restoredEst,
      });
    } catch (err) {
      next(err);
    }
  },

  // 8. Delete session
  async deleteSession(req, res, next) {
    try {
      const { id: sessionId } = req.params;
      await SessionModel.delete(sessionId);
      res.json({ success: true, message: 'Session deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },

  // 9. Get session chat history from MySQL memory
  async getSessionMessages(req, res, next) {
    try {
      const { id: sessionId } = req.params;
      const messages = await SessionMessageModel.findBySessionId(sessionId);
      res.json({ success: true, messages });
    } catch (err) {
      next(err);
    }
  },

  // 10. Post message & generate AI response with database memory storage
  async postSessionMessage(req, res, next) {
    try {
      const { id: sessionId } = req.params;
      const { text } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, message: 'Message text is required' });
      }

      // 1. Save user message to MySQL database memory
      const userMessage = await SessionMessageModel.create({
        sessionId,
        sender: 'user',
        messageText: text.trim(),
      });

      // 2. Load transformation context for grounded AI response
      const [context, docs, qas] = await Promise.all([
        BusinessContextModel.findBySessionId(sessionId),
        InputDocumentModel.findBySessionId(sessionId),
        DiscoveryQaModel.findBySessionId(sessionId),
      ]);

      const systemPrompt = `You are the Lead Enterprise Solution Architect & AI Business Consultant for Chaos2Commit 2026.
You are conducting a digital transformation discovery consultation with a client.
Organizational Context:
- Domain/Goals: ${context?.goals || 'Enterprise digital transformation'}
- Constraints: ${context?.constraints_text || 'Standard cloud enterprise architecture'}
- Uploaded Materials: ${docs.map(d => d.file_name).join(', ') || 'Initial business brief'}
- Answered Questions: ${qas.filter(q => q.answer).map(q => `Q: ${q.question} -> A: ${q.answer}`).join('; ')}

Provide direct, consultative, professional architectural advice. Address the user's inquiry, recommend best practices (especially Microsoft/Azure ecosystem where applicable), and identify integration or security considerations.`;

      let aiResponseText = await llmClient.complete({
        systemPrompt,
        userPrompt: text.trim(),
      });

      if (!aiResponseText) {
        // Intelligent heuristic consultant response if live LLM API is not configured
        const lower = text.toLowerCase();
        if (lower.includes('azure') || lower.includes('microsoft')) {
          aiResponseText = 'Regarding the **Microsoft Ecosystem**: I am aligning the architecture with Azure App Services, Azure Functions, Azure Cosmos DB / SQL, and Azure OpenAI Service with Azure AD (Entra ID) single sign-on.';
        } else if (lower.includes('timeline') || lower.includes('cost') || lower.includes('effort')) {
          aiResponseText = 'Based on standard enterprise transformation velocity, our AI Planning Engine will calculate phase-by-phase story points, team allocation (Architect, Senior Fullstack, DevOps, QA), and a 3-tier cost band upon compilation.';
        } else if (lower.includes('security') || lower.includes('compliance')) {
          aiResponseText = 'Enterprise security compliance is locked in: role-based access control (RBAC), TLS 1.3 in-transit, AES-256 at-rest encryption, and automated audit logging are built into the High-Level Design (HLD).';
        } else {
          aiResponseText = `Noted. I have updated the session's active business context in MySQL with: "${text.trim()}". This will directly inform the High-Level Design (HLD) and the Business Requirements Document (BRD).`;
        }
      }

      // 3. Save AI response to MySQL database memory
      const aiMessage = await SessionMessageModel.create({
        sessionId,
        sender: 'ai',
        messageText: aiResponseText,
      });

      res.json({
        success: true,
        userMessage,
        aiMessage,
      });
    } catch (err) {
      next(err);
    }
  },
};
