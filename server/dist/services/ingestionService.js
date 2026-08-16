// codeauthor chetas karnam
import { logger } from '../middleware/logger.js';
import { buildDashboardSnapshot } from './dashboardService.js';
const history = [];
export async function collectTelemetrySnapshot() {
    const snapshot = await buildDashboardSnapshot(true);
    const telemetrySnapshot = {
        timestamp: new Date().toISOString(),
        orbit: snapshot.orbit,
        weather: snapshot.weather,
        missionStatus: snapshot.missionStatus,
        nasaHighlight: snapshot.nasaHighlight,
        lastUpdated: snapshot.lastUpdated,
        spaceWeatherStatus: snapshot.spaceWeatherStatus,
        crewAndVehicleHealth: snapshot.crewAndVehicleHealth
    };
    history.push(telemetrySnapshot);
    if (history.length > 20) {
        history.shift();
    }
    logger.info('Collected telemetry snapshot from public aerospace feeds');
    return telemetrySnapshot;
}
export function getTelemetryHistory() {
    return history;
}
export function startTelemetryIngestion() {
    const intervalMs = Number(process.env.INGESTION_INTERVAL_MS ?? 1000);
    setInterval(() => {
        collectTelemetrySnapshot().catch((error) => logger.error(`Telemetry ingestion failed: ${String(error)}`));
    }, intervalMs);
}
