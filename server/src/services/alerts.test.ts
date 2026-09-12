import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAlertSnapshot } from './dashboardService.js';

test('builds a valid alert snapshot', async () => {
  const alerts = await buildAlertSnapshot();

  assert.equal(
    alerts.summary,
    'Local dataset snapshot refreshed'
  );

  assert.equal(
    alerts.severity,
    'info'
  );

  assert.ok(
    Array.isArray(alerts.events),
    'alerts.events should be an array'
  );

  assert.ok(
    alerts.events.length > 0,
    'alerts.events should contain at least one event'
  );

  for (const event of alerts.events) {
    assert.equal(
      event.severity,
      'info'
    );

    assert.equal(
      typeof event.message,
      'string'
    );

    assert.ok(
      event.message.length > 0,
      'alert event message should not be empty'
    );
  }
});
