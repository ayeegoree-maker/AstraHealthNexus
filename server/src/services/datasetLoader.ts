// codeauthor chetas karnam
import { readFile, stat } from 'fs/promises';
import { watch } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import type { DatasetBundle, DatasetKey } from '../types/dataset.js';

const DATA_FOLDER_PATH = path.resolve(
    fileURLToPath(new URL('../data-files/', import.meta.url))
);

const DATASET_FILE_NAMES: Record<DatasetKey, string> = {
  iss: 'iss.json',
  spaceWeather: 'spaceWeather.json',
  astronauts: 'astronauts.json',
  rocket: 'rocket.json',
  nasa: 'nasa.json',
  mission: 'mission.json'
};

type DatasetCacheEntry = {
  data: unknown;
  mtimeMs: number;
};

function assertObject(
    value: unknown,
    name: string
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
}

function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} must be a string`);
  }
}

function assertNumber(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new TypeError(`${name} must be a valid number`);
  }
}

const datasetCache: Partial<Record<DatasetKey, DatasetCacheEntry>> = {};

// Debounce filesystem events so one file change does not trigger
// multiple cache invalidations.
const fileChangeTimers: Map<string, NodeJS.Timeout> = new Map();

function keyFromFilename(filename: string): DatasetKey | null {
  for (const key of Object.keys(DATASET_FILE_NAMES) as DatasetKey[]) {
    if (DATASET_FILE_NAMES[key] === filename) {
      return key;
    }
  }

  return null;
}

function scheduleClearForKey(key: DatasetKey): void {
  const existingTimer = fileChangeTimers.get(key);

  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    if (datasetCache[key]) {
      delete datasetCache[key];

      // eslint-disable-next-line no-console
      console.info(
          `[DatasetLoader] Cleared cache for key '${key}' due to file change`
      );
    }

    try {
      datasetEvents.emit('datasetChanged', key);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
          '[DatasetLoader] Failed to emit datasetChanged event',
          err
      );
    }

    fileChangeTimers.delete(key);
  }, 250);

  fileChangeTimers.set(key, timer);
}

function startFileWatcher(): void {
  try {
    const watcher = watch(
        DATA_FOLDER_PATH,
        { persistent: false },
        (_eventType, filename) => {
          if (!filename) {
            return;
          }

          const fileName = String(filename);

          if (!fileName.toLowerCase().endsWith('.json')) {
            return;
          }

          const key = keyFromFilename(fileName);

          if (!key) {
            return;
          }

          scheduleClearForKey(key);
        }
    );

    // eslint-disable-next-line no-console
    console.info(
        '[DatasetLoader] Watching dataset folder for changes:',
        DATA_FOLDER_PATH
    );

    process.on('exit', () => {
      watcher.close();
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
        '[DatasetLoader] Failed to start file watcher:',
        err
    );
  }
}

export const datasetEvents = new EventEmitter();

startFileWatcher();

export class DatasetLoader {
  static async loadFile<T extends DatasetKey>(
      key: T
  ): Promise<DatasetBundle[T]> {
    const cacheEntry = datasetCache[key];
    const fileName = DATASET_FILE_NAMES[key];

    const filePath = path.join(DATA_FOLDER_PATH, fileName);
    const fileStats = await stat(filePath);
    const mtimeMs = fileStats.mtimeMs;

    if (cacheEntry && cacheEntry.mtimeMs === mtimeMs) {
      return deepClone(cacheEntry.data) as DatasetBundle[T];
    }

    const raw = await readFile(filePath, 'utf8');

    // Remove UTF-8 BOM if present.
    const clean = raw.replace(/^\uFEFF/, '');

    const parsed = JSON.parse(clean);

    this.validateDataset(key, parsed);

    datasetCache[key] = {
      data: parsed,
      mtimeMs
    };

    return deepClone(parsed) as DatasetBundle[T];
  }

  static async loadAll(): Promise<DatasetBundle> {
    const entries = await Promise.all(
        (Object.keys(DATASET_FILE_NAMES) as DatasetKey[]).map(
            async (key) => {
              const dataset = await this.loadFile(key);
              return [key, dataset] as const;
            }
        )
    );

    return Object.fromEntries(entries) as unknown as DatasetBundle;
  }

  static clearCache(): void {
    for (const key of Object.keys(datasetCache) as DatasetKey[]) {
      delete datasetCache[key];
    }
  }

  private static validateDataset(
      key: DatasetKey,
      value: unknown
  ): void {
    switch (key) {
      case 'iss':
        this.validateISSData(value);
        break;

      case 'spaceWeather':
        this.validateSpaceWeatherData(value);
        break;

      case 'astronauts':
        this.validateAstronautData(value);
        break;

      case 'rocket':
        this.validateRocketData(value);
        break;

      case 'nasa':
        this.validateNASAData(value);
        break;

      case 'mission':
        this.validateMissionData(value);
        break;

      default:
        throw new Error(`Unknown dataset key '${key}'`);
    }
  }

  private static validateISSData(value: unknown): void {
    assertObject(value, 'ISS dataset');

    assertString(value.name, 'iss.name');
    assertNumber(value.latitude, 'iss.latitude');
    assertNumber(value.longitude, 'iss.longitude');
    assertNumber(value.altitude, 'iss.altitude');
    assertNumber(value.velocity, 'iss.velocity');
    assertString(value.timestamp, 'iss.timestamp');
  }

  private static validateSpaceWeatherData(value: unknown): void {
    assertObject(value, 'Space weather dataset');

    assertString(value.status, 'spaceWeather.status');
    assertNumber(value.auroralPower, 'spaceWeather.auroralPower');
    assertNumber(value.plasmaDensity, 'spaceWeather.plasmaDensity');
    assertNumber(value.solarWindSpeed, 'spaceWeather.solarWindSpeed');
    assertNumber(
        value.magneticFieldIntensity,
        'spaceWeather.magneticFieldIntensity'
    );
    assertString(value.description, 'spaceWeather.description');
    assertNumber(value.kpIndex, 'spaceWeather.kpIndex');
    assertNumber(value.solarFlux, 'spaceWeather.solarFlux');
  }

  private static validateAstronautData(value: unknown): void {
    if (!Array.isArray(value)) {
      throw new TypeError('astronauts dataset must be an array');
    }

    for (const [index, astronaut] of value.entries()) {
      assertObject(astronaut, `astronauts[${index}]`);

      assertString(
          astronaut.id,
          `astronauts[${index}].id`
      );

      assertString(
          astronaut.name,
          `astronauts[${index}].name`
      );

      assertString(
          astronaut.role,
          `astronauts[${index}].role`
      );

      assertString(
          astronaut.missionSpecialty,
          `astronauts[${index}].missionSpecialty`
      );

      assertNumber(
          astronaut.healthScore,
          `astronauts[${index}].healthScore`
      );

      assertString(
          astronaut.status,
          `astronauts[${index}].status`
      );

      assertObject(
          astronaut.vitalSigns,
          `astronauts[${index}].vitalSigns`
      );

      assertNumber(
          astronaut.vitalSigns.heartRate,
          `astronauts[${index}].vitalSigns.heartRate`
      );

      assertNumber(
          astronaut.vitalSigns.oxygenSaturation,
          `astronauts[${index}].vitalSigns.oxygenSaturation`
      );

      assertNumber(
          astronaut.vitalSigns.cabinPressure,
          `astronauts[${index}].vitalSigns.cabinPressure`
      );

      assertNumber(
          astronaut.vitalSigns.temperature,
          `astronauts[${index}].vitalSigns.temperature`
      );

      assertString(
          astronaut.lastUpdate,
          `astronauts[${index}].lastUpdate`
      );
    }
  }

  private static validateRocketData(value: unknown): void {
    assertObject(value, 'rocket dataset');

    assertString(value.id, 'rocket.id');
    assertString(value.name, 'rocket.name');
    assertString(value.status, 'rocket.status');
    assertNumber(value.healthScore, 'rocket.healthScore');
    assertString(value.currentStage, 'rocket.currentStage');
    assertString(value.lastCheck, 'rocket.lastCheck');

    assertObject(value.systems, 'rocket.systems');

    assertNumber(
        value.systems.thrust,
        'rocket.systems.thrust'
    );

    assertNumber(
        value.systems.fuelPressure,
        'rocket.systems.fuelPressure'
    );

    assertNumber(
        value.systems.thermalManagement,
        'rocket.systems.thermalManagement'
    );

    assertNumber(
        value.systems.propulsionSystem,
        'rocket.systems.propulsionSystem'
    );

    assertNumber(
        value.systems.avionicsHealth,
        'rocket.systems.avionicsHealth'
    );
  }

  private static validateNASAData(value: unknown): void {
    assertObject(value, 'nasa dataset');

    assertObject(value.apod, 'nasa.apod');

    assertString(
        value.apod.title,
        'nasa.apod.title'
    );

    assertString(
        value.apod.explanation,
        'nasa.apod.explanation'
    );

    assertString(
        value.apod.url,
        'nasa.apod.url'
    );

    assertString(
        value.apod.hdurl,
        'nasa.apod.hdurl'
    );

    assertString(
        value.apod.date,
        'nasa.apod.date'
    );

    assertObject(
        value.asteroids,
        'nasa.asteroids'
    );

    assertNumber(
        value.asteroids.hazardousCount,
        'nasa.asteroids.hazardousCount'
    );

    assertString(
        value.asteroids.closestAsteroid,
        'nasa.asteroids.closestAsteroid'
    );

    assertNumber(
        value.asteroids.closestDistance,
        'nasa.asteroids.closestDistance'
    );

    assertNumber(
        value.asteroids.trackedToday,
        'nasa.asteroids.trackedToday'
    );

    assertString(
        value.asteroids.summary,
        'nasa.asteroids.summary'
    );

    assertObject(
        value.solarActivity,
        'nasa.solarActivity'
    );

    assertString(
        value.solarActivity.flareIndex,
        'nasa.solarActivity.flareIndex'
    );

    assertString(
        value.solarActivity.geomagneticStormLevel,
        'nasa.solarActivity.geomagneticStormLevel'
    );
  }

  private static validateMissionData(value: unknown): void {
    assertObject(value, 'mission dataset');

    assertString(
        value.missionId,
        'mission.missionId'
    );

    assertString(
        value.missionName,
        'mission.missionName'
    );

    assertString(
        value.phase,
        'mission.phase'
    );

    assertString(
        value.duration,
        'mission.duration'
    );

    assertString(
        value.startDate,
        'mission.startDate'
    );

    if (
        !Array.isArray(value.objectives) ||
        value.objectives.some(
            (item) => typeof item !== 'string'
        )
    ) {
      throw new TypeError(
          'mission.objectives must be a string array'
      );
    }

    if (
        !Array.isArray(value.crewManifest) ||
        value.crewManifest.some(
            (item) => typeof item !== 'string'
        )
    ) {
      throw new TypeError(
          'mission.crewManifest must be a string array'
      );
    }
  }
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}