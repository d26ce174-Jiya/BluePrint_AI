import { SessionModel } from '../models/Session.js';
import { BrdModel } from '../models/Brd.js';
import { SolutionArchitectureModel } from '../models/SolutionArchitecture.js';
import { EffortEstimateModel } from '../models/EffortEstimate.js';
import { ExportModel } from '../models/Export.js';

import { pdfExporter } from '../services/export/pdfExporter.js';
import { wordExporter } from '../services/export/wordExporter.js';

export const exportController = {
  async exportBlueprint(req, res, next) {
    try {
      const { id: sessionId } = req.params;
      const { format = 'pdf' } = req.query; // 'pdf' | 'docx' | 'word' | 'json'

      const [session, brd, architecture, estimate] = await Promise.all([
        SessionModel.findById(sessionId),
        BrdModel.findBySessionId(sessionId),
        SolutionArchitectureModel.findBySessionId(sessionId),
        EffortEstimateModel.findBySessionId(sessionId),
      ]);

      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }

      const cleanTitle = (session.title || 'blueprint').replace(/[^a-zA-Z0-9_-]/g, '_');

      if (format === 'json') {
        const payload = {
          session,
          brd,
          architecture,
          estimate,
          exportedAt: new Date().toISOString(),
        };

        await ExportModel.create({
          sessionId,
          format: 'json',
          fileUrl: `/api/export/session/${sessionId}?format=json`,
          fileSizeBytes: Buffer.byteLength(JSON.stringify(payload)),
        });

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="blueprint_${cleanTitle}.json"`);
        return res.send(JSON.stringify(payload, null, 2));
      }

      let result;
      if (format === 'pdf' || format === 'html') {
        result = await pdfExporter.generate({ session, brd, architecture, estimate });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `inline; filename="blueprint_${cleanTitle}.html"`);
      } else {
        result = await wordExporter.generate({ session, brd, architecture, estimate });
        res.setHeader('Content-Type', 'application/msword; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="blueprint_${cleanTitle}.doc"`);
      }

      // Record export in MySQL
      await ExportModel.create({
        sessionId,
        format,
        fileUrl: `/api/export/session/${sessionId}?format=${format}`,
        fileSizeBytes: result.content.length,
      });

      return res.send(result.content);
    } catch (err) {
      next(err);
    }
  },
};
