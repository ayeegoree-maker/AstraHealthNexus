// codeauthor chetas karnam
import { Router } from 'express';
import { buildAlertSnapshot } from '../services/dashboardService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get(
    '/alerts',
    asyncHandler(async (_req, res) => {
      const alertSnapshot = await buildAlertSnapshot();
      res.json(alertSnapshot);
    })
);

export default router;