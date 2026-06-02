import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/cargo";
const SYNC_LABEL = "Sync Data";
const SYNC_BUSY_LABEL = "Aligning quantum drives...";
const SYNC_DURATION_MS = 2500;

const TOTAL_CHANNELS = 16;
const ACTIVE_CHANNELS = 14;

function sortManifest(records) {
  // Business Rule 4: heaviest first; any "Earth" destination pinned to bottom.
  const earth = [];
  const others = [];
  for (const r of records) {
    (r.destination === "Earth" ? earth : others).push(r);
  }
  others.sort((a, b) => b.weight_in_kg - a.weight_in_kg);
  earth.sort((a, b) => b.weight_in_kg - a.weight_in_kg);
  return [...others, ...earth];
  
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [filter, setFilter] = useState("");
  const [poppedId, setPoppedId] = useState(null);

  const fetchManifest = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`API responded ${res.status}`);
      const data = await res.json();
      setRecords(data);
      setLastSync(new Date());
    } catch (err) {
      setError(err.message || "Unable to reach mission control.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  const sorted = useMemo(() => sortManifest(records), [records]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((r) => {
      const status = r.destination === "Earth" ? "earth pinned" : "pending";
      return (
        r.cargo_id.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        status.includes(q)
      );
    });
  }, [sorted, filter]);

  const heaviest = useMemo(
    () => sorted.find((r) => r.destination !== "Earth"),
    [sorted]
  );
  const earthCount = useMemo(
    () => sorted.filter((r) => r.destination === "Earth").length,
    [sorted]
  );
  const deepSpaceCount = sorted.length - earthCount;

  const handleSync = useCallback(() => {
    if (syncing) return;
    setSyncing(true);
    const start = Date.now();
    fetchManifest().finally(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, SYNC_DURATION_MS - elapsed);
      setTimeout(() => setSyncing(false), remaining);
    });
  }, [syncing, fetchManifest]);

  return (
    <div className="app">
      <BackgroundLayers />

      <header className="topbar">
        <div className="topbar__brand">
          <div className="logo">
            <span className="logo__ring" />
            <span className="logo__core" />
          </div>
          <div className="topbar__title">
            <h1>Intergalactic Cargo Triager</h1>
            <span className="topbar__eyebrow">Sector Control · Node 07</span>
          </div>
        </div>
        <div className={`status-pill${error ? " status-pill--err" : ""}`}>
          <span className="pulse" />
          <span>{error ? "Relay Offline" : "Quantum Relay Online"}</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero__text">
          <span className="hero__eyebrow">Manifest Operations</span>
          <h2 className="hero__title">Cargo Triage Control Center</h2>
          <p className="hero__lead">
            Live oversight of every shipment crossing your sector. Heaviest cargo
            is prioritized at the top; all Earth-bound manifests stay pinned at
            the bottom for final clearance.
          </p>
        </div>
        <button
          type="button"
          className={`sync-btn${syncing ? " sync-btn--busy" : ""}`}
          onClick={handleSync}
          disabled={syncing || loading}
        >
          <svg
            className="sync-btn__icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 0 1-15.4 6.4M3 12a9 9 0 0 1 15.4-6.4M21 4v5h-5M3 20v-5h5"
            />
          </svg>
          {syncing ? SYNC_BUSY_LABEL : SYNC_LABEL}
        </button>
      </section>

      <section className="stats">
        <StatCard
          label="Total Cargo"
          value={sorted.length}
          hint={`${earthCount} Earth-bound · ${deepSpaceCount} deep space`}
          icon="cube"
        />
        <StatCard
          label="Heaviest Shipment"
          value={`${(heaviest?.weight_in_kg ?? 0).toLocaleString()} kg`}
          hint={
            heaviest
              ? `${heaviest.cargo_id} → ${heaviest.destination}`
              : "Awaiting data"
          }
          icon="gauge"
        />
        <StatCard
          label="Active Channels"
          value={`${ACTIVE_CHANNELS} / ${TOTAL_CHANNELS}`}
          hint={`${TOTAL_CHANNELS - ACTIVE_CHANNELS} channels in standby`}
          icon="signal"
        />
        <SystemStatus lastSync={lastSync} online={!error} />
      </section>

      <section className="filter-row">
        <div className="search">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <circle
              cx="11"
              cy="11"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m20 20-3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Filter by ID, destination, status..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="filter-row__count">
          Showing <strong>{filtered.length}</strong> of{" "}
          <strong>{sorted.length}</strong> manifests
        </div>
      </section>

      {error && (
        <div className="error-banner">
          <strong>Connection lost.</strong> {error} · Make sure the Flask API is
          running on <code>http://127.0.0.1:5000</code>.
        </div>
      )}

      <section className="manifest-panel">
        <header className="manifest-panel__head">
          <div>
            <h3>Cargo Manifest</h3>
            <p>Sorted heaviest first · Earth-bound shipments pinned to bottom</p>
          </div>
          <span className="record-badge">{sorted.length} RECORDS</span>
        </header>

        {loading ? (
          <div className="empty">Receiving telemetry…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No manifests match your filter.</div>
        ) : (
          <div className="cargo-grid">
            {filtered.map((r, idx) => {
              const isEarth = r.destination === "Earth";
              const popped = poppedId === r.cargo_id;
              return (
                <button
                  key={r.cargo_id}
                  type="button"
                  onClick={() =>
                    setPoppedId((cur) => (cur === r.cargo_id ? null : r.cargo_id))
                  }
                  className={`cargo-card${isEarth ? " cargo-card--earth" : ""}${
                    popped ? " cargo-card--popped" : ""
                  }`}
                  aria-pressed={popped}
                >
                  <span className="cargo-card__rank">#{idx + 1}</span>
                  <header className="cargo-card__head">
                    <span className="cargo-card__id mono">{r.cargo_id}</span>
                    <span
                      className={`status ${
                        isEarth ? "status--earth" : "status--pending"
                      }`}
                    >
                      <span className="status__dot" />
                      {isEarth ? "Earth · Pinned" : "Pending"}
                    </span>
                  </header>

                  <div className="cargo-card__weight">
                    <span className="cargo-card__weight-value">
                      {r.weight_in_kg.toLocaleString()}
                    </span>
                    <span className="cargo-card__weight-unit">kg</span>
                  </div>

                  <div className="cargo-card__dest">
                    <span className="cargo-card__label">Destination</span>
                    <DestinationPill
                      destination={r.destination}
                      isEarth={isEarth}
                    />
                  </div>
                  
                  <footer className="cargo-card__foot">
                    <span className="cargo-card__label">Manifest date</span>
                    <span className="cargo-card__date mono">{r.date}</span>
                  </footer>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <footer className="footer">
        <span>Intergalactic Cargo Authority · Node 07</span>
        <span className="dim">
          Built by Surya Theja · Task 3 Dashboard · {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}

function StatCard({ label, value, hint, icon }) {
  return (
    <div className="stat">
      <div className="stat__head">
        <span className="stat__label">{label}</span>
        <StatIcon name={icon} />
      </div>
      <span className="stat__value">{value}</span>
      <span className="stat__hint">{hint}</span>
    </div>
  );
}

function StatIcon({ name }) {
  switch (name) {
    case "cube":
      return (
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
          className="stat__icon"
        >
          <path
            d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5L12 2.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M12 12l8.5-4.75M12 12v9.5M12 12L3.5 7.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
      );
    case "gauge":
      return (
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
          className="stat__icon"
        >
          <circle
            cx="12"
            cy="13"
            r="8.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M12 13l4.5-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="13" r="1.4" fill="currentColor" />
        </svg>
      );
    case "signal":
      return (
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
          className="stat__icon"
        >
          <path
            d="M5 12a7 7 0 0 1 14 0M2 12a10 10 0 0 1 20 0M8 12a4 4 0 0 1 8 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

function SystemStatus({ lastSync, online }) {
  const rows = [
    { label: "Quantum Relay", value: "98.6%", ok: online },
    { label: "Manifest Sync", value: online ? "Live" : "Offline", ok: online },
    { label: "Subspace Latency", value: "42ms", ok: true },
    { label: "Bay Authority", value: "Nominal", ok: true },
  ];
  return (
    <div className="stat stat--system">
      <div className="stat__head">
        <span className="stat__label stat__label--bold">System Status</span>
        <span className="stat__node">NODE 07</span>
      </div>
      <ul className="sysrows">
        {rows.map((r) => (
          <li key={r.label}>
            <span className={`dot${r.ok ? " dot--ok" : " dot--err"}`} />
            <span className="sysrows__label">{r.label}</span>
            <span className="sysrows__val">{r.value}</span>
          </li>
        ))}
      </ul>
      <div className="sysrows__sync">
        Last sync:{" "}
        <span className="mono">
          {lastSync ? lastSync.toLocaleTimeString() : "—"}
        </span>
      </div>
    </div>
  );
}

function DestinationPill({ destination, isEarth }) {
  return (
    <span className={`dest-pill${isEarth ? " dest-pill--earth" : ""}`}>
      <span className="dest-pill__dot" />
      {destination}
    </span>
  );
}

function BackgroundLayers() {
  return (
    <>
      <div className="starfield" aria-hidden="true" />
      <div className="star-dust" aria-hidden="true" />
      <div className="aurora" aria-hidden="true">
        <span className="aurora__blob aurora__blob--1" />
        <span className="aurora__blob aurora__blob--2" />
        <span className="aurora__blob aurora__blob--3" />
      </div>
      <div className="shooting-stars" aria-hidden="true">
        <span className="shooting-star shooting-star--1" />
        <span className="shooting-star shooting-star--2" />
        <span className="shooting-star shooting-star--3" />
      </div>
      <div className="orbit-rings" aria-hidden="true">
        <span className="orbit-rings__ring orbit-rings__ring--1" />
        <span className="orbit-rings__ring orbit-rings__ring--2" />
        <span className="orbit-rings__ring orbit-rings__ring--3" />
      </div>
      <div className="grid-overlay" aria-hidden="true" />
    </>
  );
}