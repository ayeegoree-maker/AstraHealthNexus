import { useEffect, useState } from 'react';
import {
  connectNASAStream,
  getDashboardSnapshot,
} from '../services/api';

import type { DashboardSnapshot } from '../types/api';


/* =========================================================
   METRIC CARD
   ========================================================= */

function MetricCard({
                      title,
                      value,
                      suffix = '',
                    }: {
  title: string;
  value: string | number;
  suffix?: string;
}) {
  return (
      <div className="metric-card">
        <div className="metric-card-title">
          {title}
        </div>

        <div className="metric-card-value">
          {value}

          {suffix && (
              <span className="metric-card-suffix">
            {suffix}
          </span>
          )}
        </div>
      </div>
  );
}


/* =========================================================
   DASHBOARD PAGE
   ========================================================= */

function DashboardPage() {
  const [data, setData] = useState<DashboardSnapshot | null>(null);

  const [loading, setLoading] = useState(true);

  const [streamConnected, setStreamConnected] = useState(false);


  /* =======================================================
     INITIAL DATA + LIVE SSE STREAM
     ======================================================= */

  useEffect(() => {
    let mounted = true;


    /* -------------------------------------------------------
       INITIAL SNAPSHOT
       ------------------------------------------------------- */

    getDashboardSnapshot()
        .then((snapshot) => {
          if (!mounted) {
            return;
          }

          setData(snapshot);
          setLoading(false);
        })
        .catch((error) => {
          console.error(
              '[DASHBOARD] Initial snapshot failed:',
              error
          );

          if (mounted) {
            setLoading(false);
          }
        });


    /* -------------------------------------------------------
       NASA SSE STREAM
       ------------------------------------------------------- */

    const eventSource = connectNASAStream(
        (snapshot) => {
          if (!mounted) {
            return;
          }

          setData(snapshot);
          setLoading(false);
          setStreamConnected(true);
        },

        (error) => {
          console.error(
              '[NASA STREAM] Error:',
              error
          );

          if (mounted) {
            setStreamConnected(false);
          }
        },

        () => {
          console.log(
              '[NASA STREAM] Connected'
          );

          if (mounted) {
            setStreamConnected(true);
          }
        }
    );


    /* -------------------------------------------------------
       CLEANUP
       ------------------------------------------------------- */

    return () => {
      mounted = false;

      eventSource.close();

      console.log(
          '[NASA STREAM] Closed'
      );
    };
  }, []);


  /* =======================================================
     LOADING
     ======================================================= */

  if (loading && !data) {
    return (
        <div className="dashboard-page">

          <div className="dashboard-loading">

            <div className="dashboard-loading-spinner" />

            <h2>
              Loading AstraHealth Nexus...
            </h2>

            <p>
              Connecting to live mission telemetry.
            </p>

          </div>

        </div>
    );
  }


  /* =======================================================
     ERROR
     ======================================================= */

  if (!data) {
    return (
        <div className="dashboard-page">

          <div className="dashboard-error">

            <h2>
              Unable to load dashboard
            </h2>

            <p>
              The mission telemetry service is currently
              unavailable.
            </p>

            <button
                onClick={() => {
                  window.location.reload();
                }}
            >
              Retry
            </button>

          </div>

        </div>
    );
  }


  /* =======================================================
     VALUES
     ======================================================= */

  const crewHealth =
      data.crewAndVehicleHealth?.astronautHealthScore ?? 0;

  const rocketHealth =
      data.crewAndVehicleHealth?.rocketHealthScore ?? 0;

  const kpIndex =
      data.spaceWeatherKPIndex ?? 0;

  const solarFlux =
      data.solarFlux ?? 0;


  /* =======================================================
     TELEMETRY
     ======================================================= */

  const telemetry = [
    {
      label: 'Feed sync',
      value: 100,
    },

    {
      label: 'Orbital lock',
      value: 100,
    },

    {
      label: 'Space weather',
      value: Math.min(
          100,
          Math.max(
              0,
              kpIndex * 10
          )
      ),
    },

    {
      label: 'Crew health',
      value: crewHealth,
    },

    {
      label: 'Vehicle status',
      value: rocketHealth,
    },
  ];


  /* =======================================================
     PAGE
     ======================================================= */

  return (
      <div className="dashboard-page">


        {/* =================================================
          HEADER
          ================================================= */}

        <div className="dashboard-header">

          <div>

            <h1>
              Mission Dashboard
            </h1>

            <p>
              AstraHealth Nexus · ISS Operations
            </p>

          </div>


          <div
              className={
                streamConnected
                    ? 'stream-status connected'
                    : 'stream-status disconnected'
              }
          >

            <span className="stream-status-dot" />

            {streamConnected
                ? 'LIVE'
                : 'RECONNECTING'}

          </div>

        </div>


        {/* =================================================
          MISSION STATUS
          ================================================= */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <h2>
                Mission Status
              </h2>

              <p>
                Current mission state and orbital conditions
              </p>

            </div>

          </div>


          <div className="mission-status-card">

            <div className="mission-status-main">

              <div className="mission-status-label">
                STATUS
              </div>

              <div className="mission-status-value">
                {data.missionStatus}
              </div>

            </div>


            <div className="mission-status-grid">

              <MetricCard
                  title="Space Weather KPI"
                  value={`Kp ${kpIndex}`}
              />

              <MetricCard
                  title="Solar Flux"
                  value={solarFlux}
              />

              <MetricCard
                  title="Crew Health"
                  value={crewHealth}
                  suffix="%"
              />

              <MetricCard
                  title="Vehicle Readiness"
                  value={rocketHealth}
                  suffix="%"
              />

            </div>

          </div>

        </section>


        {/* =================================================
          ORBIT + WEATHER
          ================================================= */}

        <section className="dashboard-section">

          <div className="dashboard-two-column">


            <div className="dashboard-card">

              <div className="card-header">

                <h3>
                  Orbital Position
                </h3>

              </div>


              <div className="card-content">

                <div className="large-value">
                  ISS
                </div>

                <p>
                  {data.orbit}
                </p>

              </div>

            </div>


            <div className="dashboard-card">

              <div className="card-header">

                <h3>
                  Space Weather
                </h3>

              </div>


              <div className="card-content">

                <div className="large-value">
                  {data.spaceWeatherStatus}
                </div>

                <p>
                  {data.weather}
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
          TELEMETRY
          ================================================= */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <h2>
                Live Telemetry
              </h2>

              <p>
                Real-time mission system health
              </p>

            </div>

          </div>


          <div className="telemetry-grid">

            {telemetry.map((item) => (

                <div
                    className="telemetry-card"
                    key={item.label}
                >

                  <div className="telemetry-header">

                <span>
                  {item.label}
                </span>

                    <strong>
                      {Math.round(item.value)}%
                    </strong>

                  </div>


                  <div className="telemetry-bar">

                    <div
                        className="telemetry-bar-fill"
                        style={{
                          width: `${Math.min(
                              100,
                              Math.max(
                                  0,
                                  item.value
                              )
                          )}%`,
                        }}
                    />

                  </div>

                </div>

            ))}

          </div>

        </section>


        {/* =================================================
          CREW + VEHICLE
          ================================================= */}

        <section className="dashboard-section">

          <div className="dashboard-two-column">


            <div className="dashboard-card">

              <div className="card-header">

                <h3>
                  Crew Health
                </h3>

                <span className="status-badge">
                {data.crewAndVehicleHealth?.astronautStatus ??
                    'Stable'}
              </span>

              </div>


              <div className="health-score">

                <div className="health-score-number">
                  {crewHealth}%
                </div>

                <div className="health-score-label">
                  Average crew readiness
                </div>

              </div>


              <div className="vitals-grid">

                <MetricCard
                    title="Oxygen"
                    value={
                        data.crewAndVehicleHealth
                            ?.astronautVitalSigns?.oxygen ?? 0
                    }
                    suffix="%"
                />

                <MetricCard
                    title="Heart Rate"
                    value={
                        data.crewAndVehicleHealth
                            ?.astronautVitalSigns?.heartRate ?? 0
                    }
                    suffix=" bpm"
                />

                <MetricCard
                    title="Cabin Pressure"
                    value={
                        data.crewAndVehicleHealth
                            ?.astronautVitalSigns?.cabinPressure ?? 0
                    }
                    suffix=" kPa"
                />

                <MetricCard
                    title="Temperature"
                    value={
                        data.crewAndVehicleHealth
                            ?.astronautVitalSigns?.temperature ?? 0
                    }
                    suffix=" °C"
                />

              </div>


              <p className="card-narrative">

                {data.crewAndVehicleHealth?.astronautNarrative}

              </p>

            </div>


            <div className="dashboard-card">

              <div className="card-header">

                <h3>
                  Vehicle Health
                </h3>

                <span className="status-badge">
                {data.crewAndVehicleHealth?.rocketStatus ??
                    'Stable'}
              </span>

              </div>


              <div className="health-score">

                <div className="health-score-number">
                  {rocketHealth}%
                </div>

                <div className="health-score-label">
                  Vehicle readiness
                </div>

              </div>


              <div className="vitals-grid">

                <MetricCard
                    title="Thrust"
                    value={
                        data.crewAndVehicleHealth
                            ?.rocketSystems?.thrust ?? 0
                    }
                    suffix="%"
                />

                <MetricCard
                    title="Fuel Pressure"
                    value={
                        data.crewAndVehicleHealth
                            ?.rocketSystems?.fuelPressure ?? 0
                    }
                    suffix="%"
                />

                <MetricCard
                    title="Thermal"
                    value={
                        data.crewAndVehicleHealth
                            ?.rocketSystems?.thermal ?? 0
                    }
                    suffix="%"
                />

                <MetricCard
                    title="Avionics"
                    value={
                        data.crewAndVehicleHealth
                            ?.rocketSystems?.avionics ?? 0
                    }
                    suffix="%"
                />

              </div>


              <p className="card-narrative">

                {data.crewAndVehicleHealth?.rocketNarrative}

              </p>

            </div>

          </div>

        </section>


        {/* =================================================
          CREW
          ================================================= */}

        <section className="dashboard-section">

          <div className="dashboard-card">

            <div className="card-header">

              <h3>
                Mission Crew
              </h3>

              <span>
              {data.missionCrew?.length ?? 0} crew
            </span>

            </div>


            <div className="crew-list">

              {(data.missionCrew ?? []).map(
                  (member, index) => (

                      <div
                          className="crew-member"
                          key={`${member}-${index}`}
                      >

                        <div className="crew-avatar">

                          {member
                              .split(' ')
                              .map((word) => word[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}

                        </div>


                        <div className="crew-name">

                          {member}

                        </div>

                      </div>

                  )
              )}

            </div>

          </div>

        </section>


        {/* =================================================
          OBJECTIVES
          ================================================= */}

        <section className="dashboard-section">

          <div className="dashboard-card">

            <div className="card-header">

              <h3>
                Mission Objectives
              </h3>

            </div>


            <div className="objectives-list">

              {(data.missionObjectives ?? []).map(
                  (objective, index) => (

                      <div
                          className="objective-item"
                          key={`${objective}-${index}`}
                      >

                        <div className="objective-number">

                          {String(index + 1).padStart(2, '0')}

                        </div>


                        <div>
                          {objective}
                        </div>

                      </div>

                  )
              )}

            </div>

          </div>

        </section>


        {/* =================================================
          ALERTS
          ================================================= */}

        <section className="dashboard-section">

          <div className="dashboard-card">

            <div className="card-header">

              <h3>
                Mission Alerts
              </h3>

              <span>
              {data.alerts?.length ?? 0}
            </span>

            </div>


            <div className="alerts-list">

              {(data.alerts ?? []).map(
                  (alert, index) => (

                      <div
                          className="alert-item"
                          key={`${alert}-${index}`}
                      >

                  <span className="alert-icon">
                    !
                  </span>

                        <span>
                    {alert}
                  </span>

                      </div>

                  )
              )}

            </div>

          </div>

        </section>


        {/* =================================================
          NASA HIGHLIGHT
          ================================================= */}

        <section className="dashboard-section">

          <div className="dashboard-card nasa-highlight">

            <div className="card-header">

              <h3>
                NASA Highlight
              </h3>

            </div>


            <div className="nasa-highlight-content">

              <div>

                <div className="nasa-highlight-title">

                  {data.nasaHighlight}

                </div>


                {data.nasaAsteroidSummary && (

                    <p>
                      {data.nasaAsteroidSummary}
                    </p>

                )}

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
          LAST UPDATED
          ================================================= */}

        <div className="dashboard-last-updated">

        <span
            className={
              streamConnected
                  ? 'live-indicator active'
                  : 'live-indicator'
            }
        />

          {streamConnected
              ? 'Live telemetry connected'
              : 'Telemetry reconnecting'}

          <span>
          ·
        </span>

          Last update:{' '}

          {data.lastUpdated
              ? new Date(
                  data.lastUpdated
              ).toLocaleTimeString()
              : 'Unknown'}

        </div>

      </div>
  );
}


/* =========================================================
   EXPORTS
   ========================================================= */

/*
   Export BOTH ways.

   App.tsx currently uses:
   import { DashboardPage } from './pages/DashboardPage';

   Other files can also use:
   import DashboardPage from './pages/DashboardPage';
*/

export { DashboardPage };

export default DashboardPage;