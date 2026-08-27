// codeauthor chetas karnam
import { Router } from 'express';
import { DatasetService } from '../services/datasetService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

type PublicError = Error & {
  status?: number;
  publicMessage?: string;
};

function createNotFoundError(message: string): PublicError {
  const error = new Error(message) as PublicError;
  error.status = 404;
  error.publicMessage = message;
  return error;
}

const router = Router();

const validDatasetKeys = new Set([
  'iss',
  'weather',
  'spaceWeather',
  'astronauts',
  'rocket',
  'nasa',
  'mission'
]);

router.get('/dataset', asyncHandler(async (_req, res) => {
  const data = await DatasetService.getAllData();

  res.json({
    status: 'success',
    message: 'Complete mission dataset loaded from the local dataset provider',
    data
  });
}));

router.get('/dataset/keys', (_req, res) => {
  res.json({
    status: 'success',
    keys: Array.from(validDatasetKeys)
  });
});

router.post('/dataset/refresh', (_req, res) => {
  DatasetService.reloadData();

  res.json({
    status: 'success',
    message: 'Local dataset cache cleared and refreshed'
  });
});

router.get('/dataset/:datasetKey', asyncHandler(async (req, res) => {
  const key = req.params.datasetKey as string;

  if (!validDatasetKeys.has(key)) {
    throw createNotFoundError(
        `Dataset '${key}' is not available`
    );
  }

  const payload =
      key === 'weather'
          ? await DatasetService.getSpaceWeatherData()
          : await DatasetService.getDatasetByKey(key as never);

  res.json({
    status: 'success',
    data: payload
  });
}));

router.get('/dataset/astronauts/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const astronauts = await DatasetService.getAstronautData();
  const astronaut = astronauts.find((crew) => crew.id === id);

  if (!astronaut) {
    throw createNotFoundError(
        `Astronaut '${id}' not found in local dataset`
    );
  }

  res.json({
    status: 'success',
    data: astronaut
  });
}));

export default router;