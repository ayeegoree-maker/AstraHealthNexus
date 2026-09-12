// codeauthor chetas karnam
import { Router } from 'express';
import {
  collectTelemetrySnapshot,
  getTelemetryHistory
} from '../services/ingestionService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get(
    '/telemetry',
    asyncHandler(async (_req, res) => {
      const snapshot = await collectTelemetrySnapshot();

      res.json({
        snapshot,
        history: getTelemetryHistory()
      });
    })
);

router.get(
    '/telemetry/live',
    asyncHandler(async (_req, res) => {
      const snapshot = await collectTelemetrySnapshot();
      res.json(snapshot);
    })
);

export default router;