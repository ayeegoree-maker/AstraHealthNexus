// codeauthor chetas karnam
import { Router } from 'express';
import { buildDashboardSnapshot } from '../services/dashboardService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get(
    '/dashboard',
    asyncHandler(async (_req, res) => {
      const snapshot = await buildDashboardSnapshot();
      res.json(snapshot);
    })
);

export default router;