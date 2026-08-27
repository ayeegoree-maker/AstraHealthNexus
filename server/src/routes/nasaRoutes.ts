import { Router, Request, Response, NextFunction } from 'express';
import {
  buildDashboardSnapshot,
  getCachedDashboardSnapshot,
  snapshotEvents
} from '../services/dashboardService.js';

const router = Router();

router.get(
    '/nasa/stream',
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        let snapshot = getCachedDashboardSnapshot();

        if (!snapshot) {
          snapshot = await buildDashboardSnapshot(true);
        }

        res.set({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        });

        res.write(`data: ${JSON.stringify(snapshot)}\n\n`);

        const onUpdate = (updatedSnapshot: typeof snapshot) => {
          if (res.writableEnded || res.destroyed) {
            return;
          }

          try {
            res.write(`data: ${JSON.stringify(updatedSnapshot)}\n\n`);
          } catch {
            snapshotEvents.off('snapshotUpdated', onUpdate);
          }
        };

        snapshotEvents.on('snapshotUpdated', onUpdate);

        res.on('close', () => {
          snapshotEvents.off('snapshotUpdated', onUpdate);
        });
      } catch (err) {
        if (!res.headersSent) {
          next(err);
        } else {
          res.end();
        }
      }
    }
);

export default router;