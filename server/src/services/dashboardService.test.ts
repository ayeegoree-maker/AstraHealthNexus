import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildDashboardSnapshot } from './dashboardService.js';
import { DatasetService } from './datasetService.js';

test('derives astronaut and rocket health from mission dataset', async () => {
  const snapshot = await buildDashboardSnapshot();

  assert.equal(snapshot.crewAndVehicleHealth.astronautHealthScore, 95);
  assert.equal(snapshot.crewAndVehicleHealth.rocketHealthScore, 97);

  assert.equal(snapshot.crewAndVehicleHealth.astronautStatus, 'Stable');
  assert.equal(snapshot.crewAndVehicleHealth.rocketStatus, 'Stable');
});

test('loads dataset values from local data source and preserves key fields', async () => {
  const mission = await DatasetService.getMissionData();

  assert.equal(mission.missionId, 'ISS-NEXUS-2024');
  assert.equal(mission.missionName, 'AstraHealth Nexus - ISS Operations');
  assert.equal(mission.phase, 'Active Orbital Operations');

  assert.ok(Array.isArray(mission.objectives));
  assert.ok(Array.isArray(mission.crewManifest));
  assert.ok(mission.objectives.length > 0);
  assert.ok(mission.crewManifest.length > 0);
});