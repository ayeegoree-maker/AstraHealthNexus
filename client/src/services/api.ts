import {
  DatasetKeysResponse,
  DatasetResponse,
  DashboardSnapshot,
  DatasetKey,
  RefreshResponse,
} from '../types/api';

const BASE_URL = window.location.origin;

async function apiJson<T>(
    resource: string,
    init?: RequestInit
): Promise<T> {
  const response = await fetch(`${BASE_URL}${resource}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
        `Request failed: ${response.status} ${errorText}`
    );
  }

  return response.json() as Promise<T>;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const result = await apiJson<DatasetResponse<DashboardSnapshot>>(
      '/api/telemetry/live'
  );

  if (result.status !== 'success') {
    throw new Error(
        result.message || 'Unable to load dashboard snapshot'
    );
  }

  return result.data;
}

export async function getDatasetKeys(): Promise<DatasetKey[]> {
  const result = await apiJson<DatasetKeysResponse>(
      '/api/dataset/keys'
  );

  if (result.status !== 'success') {
    throw new Error('Unable to load dataset keys');
  }

  return result.keys;
}

export async function getDataset(
    key: DatasetKey
): Promise<unknown> {
  const result = await apiJson<DatasetResponse<unknown>>(
      `/api/dataset/${key}`
  );

  if (result.status !== 'success') {
    throw new Error(
        result.message || `Unable to load dataset ${key}`
    );
  }

  return result.data;
}

export async function refreshDatasetCache(): Promise<string> {
  const result = await apiJson<RefreshResponse>(
      '/api/dataset/refresh',
      {
        method: 'POST',
      }
  );

  return result.message;
}

/*
 * =========================================================
 * NASA / LIVE DASHBOARD SSE STREAM
 * =========================================================
 *
 * Connects the frontend to:
 *
 * GET /api/nasa/stream
 *
 * The backend sends:
 *
 * data: { ...dashboard snapshot... }
 *
 * approximately once per second.
 */

export function connectNASAStream(
    onData: (data: DashboardSnapshot) => void,
    onError?: (error: Event) => void,
    onOpen?: () => void
): EventSource {
  const streamUrl = `${BASE_URL}/api/nasa/stream`;

  console.log('[NASA STREAM] Connecting:', streamUrl);

  const eventSource = new EventSource(streamUrl);

  eventSource.onopen = () => {
    console.log('[NASA STREAM] Connected');

    if (onOpen) {
      onOpen();
    }
  };

  eventSource.onmessage = (event: MessageEvent<string>) => {
    try {
      const data = JSON.parse(event.data) as DashboardSnapshot;

      console.log('[NASA STREAM] Update received:', data);

      onData(data);
    } catch (error) {
      console.error(
          '[NASA STREAM] Failed to parse server data:',
          error
      );
    }
  };

  eventSource.onerror = (error: Event) => {
    console.error('[NASA STREAM] Connection error:', error);

    if (onError) {
      onError(error);
    }
  };

  return eventSource;
}