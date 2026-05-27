// manager.jsx — Manager dashboard (UC8 / UC9 / UC10)

const { useState: useMgr, useMemo: useMgrMemo } = React;

function ManagerScreen({ trains, setTrains, history, user, onAdd, onEdit, onDelete }) {
  const { TOTAL_SEATS_PER_CAR } = window.RoRailData;

  const [selectedTrain, setSelectedTrain] = useMgr(null);
  const [showAdd, setShowAdd] = useMgr(false);
  const [editTrain, setEditTrain] = useMgr(null);
  const [confirmDelete, setConfirmDelete] = useMgr(null);
  const [filter, setFilter] = useMgr("toate");

  // Use API callbacks if provided, fall back to direct setTrains for pure in-memory mode
  const addFn    = onAdd    || ((t) => setTrains(ts => [...ts, t]));
  const editFn   = onEdit   || ((t) => setTrains(ts => ts.map(tr => tr.id === t.id ? t : tr)));
  const deleteFn = onDelete || ((id) => setTrains(ts => ts.filter(t => t.id !== id)));

  // Compute occupancy stats for every train
  const trainStats = useMgrMemo(() => {
    return trains.map(t => {
      const totalSeats = (t.cars || 5) * TOTAL_SEATS_PER_CAR;
      const activeBookings = history.filter(b => b.trainId === t.id && b.status === "confirmed");
      const reserved = activeBookings.length;
      const available = totalSeats - reserved;
      const occPct = Math.round((reserved / totalSeats) * 100);
      return { trainId: t.id, totalSeats, reserved, available, occPct, activeBookings };
    });
  }, [trains, history]);

  const getStats = (id) =>
    trainStats.find(s => s.trainId === id) ||
    { totalSeats: 0, reserved: 0, available: 0, occPct: 0, activeBookings: [] };

  // Global stats row
  const totalBookings = history.filter(b => b.status === "confirmed").length;
  const totalVagoane = trains.reduce((a, t) => a + (t.cars || 5), 0);

  const handleAddTrain = async (newTrain) => {
    await addFn(newTrain);
    setShowAdd(false);
  };

  const handleEditTrain = async (edited) => {
    await editFn(edited);
    if (selectedTrain?.id === edited.id) setSelectedTrain(edited);
    setEditTrain(null);
  };

  const handleDeleteTrain = async (id) => {
    await deleteFn(id);
    if (selectedTrain?.id === id) setSelectedTrain(null);
    setConfirmDelete(null);
  };

  const { TRAIN_TYPES } = window.RoRailData;
  const filteredTrains = trains.filter(t =>
    filter === "toate" || TRAIN_TYPES[t.type]?.tier === filter
  );

  return (
    <div className="manager-screen fade-in">
      <div className="container">

        {/* Page header */}
        <div className="manager-head">
          <div>
            <div className="eyebrow">UC8 · UC9 · UC10 · Panou de control</div>
            <h1 className="display" style={{ fontSize: 32, margin: "10px 0 0" }}>
              Management <em style={{ color: "var(--accent)" }}>curse & vagoane</em>
            </h1>
          </div>
          <button className="btn btn-accent" onClick={() => setShowAdd(true)}>
            + Adaugă cursă
          </button>
        </div>

        {/* Stats row */}
        <div className="manager-stats">
          <div className="mgr-stat">
            <div className="mono mgr-stat-val">{trains.length}</div>
            <div className="mgr-stat-lbl">Curse totale</div>
          </div>
          <div className="mgr-stat">
            <div className="mono mgr-stat-val">{totalBookings}</div>
            <div className="mgr-stat-lbl">Rezervări active</div>
          </div>
          <div className="mgr-stat">
            <div className="mono mgr-stat-val">{totalBookings}</div>
            <div className="mgr-stat-lbl">Pasageri</div>
          </div>
          <div className="mgr-stat">
            <div className="mono mgr-stat-val">{totalVagoane}</div>
            <div className="mgr-stat-lbl">Total vagoane</div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="manager-grid">

          {/* Left — train list */}
          <div className="manager-list-col">
            <div className="trips-filter" style={{ marginBottom: 16 }}>
              {["toate", "expres", "rapid", "lent"].map(f => (
                <button
                  key={f}
                  className={"chip " + (filter === f ? "chip-on" : "")}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {filteredTrains.length === 0 && (
              <div className="res-empty">
                <div className="serif" style={{ fontSize: 18 }}>Nicio cursă pe tipul selectat.</div>
              </div>
            )}

            {filteredTrains.map(t => (
              <TrainRow
                key={t.id}
                t={t}
                stats={getStats(t.id)}
                selected={selectedTrain?.id === t.id}
                onSelect={() => setSelectedTrain(t)}
                onEdit={() => setEditTrain(t)}
                onDelete={() => setConfirmDelete(t)}
              />
            ))}
          </div>

          {/* Right — detail panel */}
          <div className="manager-detail-col">
            {selectedTrain ? (
              <TrainDetailPanel
                train={selectedTrain}
                stats={getStats(selectedTrain.id)}
              />
            ) : (
              <div className="mgr-empty">
                <div className="serif" style={{ fontSize: 20 }}>Selectează o cursă</div>
                <div style={{ color: "var(--ink-3)", marginTop: 10, fontSize: 14, lineHeight: 1.5 }}>
                  Apasă pe o cursă din stânga pentru a vedea detaliile de ocupare și lista de pasageri (UC10).
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <TrainFormModal
          title="UC8 · Adaugă cursă nouă"
          trains={trains}
          onSave={handleAddTrain}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editTrain && (
        <TrainFormModal
          title="UC9 · Editează cursă"
          trains={trains}
          initial={editTrain}
          onSave={handleEditTrain}
          onClose={() => setEditTrain(null)}
        />
      )}
      {confirmDelete && (
        <DeleteConfirmDialog
          train={confirmDelete}
          history={history}
          onConfirm={() => handleDeleteTrain(confirmDelete.id)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

/* ── Train row card ──────────────────────────────────────────────── */
function TrainRow({ t, stats, selected, onSelect, onEdit, onDelete }) {
  const { TRAIN_TYPES, stationName } = window.RoRailData;
  const typeLabel = TRAIN_TYPES[t.type]?.label || t.type;

  return (
    <div
      className={"mgr-train-row " + (selected ? "mgr-train-row-on" : "")}
      onClick={onSelect}
    >
      <div className="mtr-main">
        <div className="mtr-top">
          <span className="mono mtr-id">{t.id}</span>
          <span className="mtr-tier">{typeLabel}</span>
        </div>
        <div className="serif mtr-name">{t.name || typeLabel}</div>
        <div className="mtr-route">
          {stationName(t.from)} <span style={{ color: "var(--ink-4)" }}>→</span> {stationName(t.to)}
        </div>
        <div className="mono mtr-times">{t.dep} → {t.arr} · {t.duration}</div>
      </div>

      <div className="mtr-occ-wrap">
        <div className="occ-bar" style={{ marginBottom: 4 }}>
          <span style={{ width: `${stats.occPct}%` }}></span>
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          {stats.reserved} / {stats.totalSeats} locuri · {stats.occPct}%
        </div>
      </div>

      <div className="mtr-actions" onClick={e => e.stopPropagation()}>
        <button
          className="btn"
          style={{ padding: "6px 14px", fontSize: 13 }}
          onClick={onEdit}
        >Editează</button>
        <button
          className="btn mtr-del-btn"
          style={{ padding: "6px 14px", fontSize: 13 }}
          onClick={onDelete}
        >Șterge</button>
      </div>
    </div>
  );
}

/* ── Train detail panel (UC10) ───────────────────────────────────── */
function TrainDetailPanel({ train, stats }) {
  const { TRAIN_TYPES, stationName } = window.RoRailData;
  const typeLabel = TRAIN_TYPES[train.type]?.label || train.type;
  const passengers = stats.activeBookings;

  return (
    <div className="mgd-panel">

      {/* Header */}
      <div className="mgd-head">
        <div style={{ flex: 1 }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", letterSpacing: ".1em", textTransform: "uppercase" }}>
            {train.id}
          </div>
          <div className="serif" style={{ fontSize: 22, margin: "4px 0 2px" }}>
            {train.name || typeLabel}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
            {stationName(train.from)} → {stationName(train.to)} · {train.dep}–{train.arr} · {train.duration}
          </div>
        </div>
        <span className="mtr-tier" style={{ alignSelf: "flex-start" }}>{typeLabel}</span>
      </div>

      {/* Occupancy (UC10) */}
      <div className="mgd-occ-section">
        <div className="eyebrow" style={{ marginBottom: 14 }}>UC10 · Ocupare vagoane</div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "var(--ink-3)", whiteSpace: "nowrap" }}>Grad ocupare</span>
          <div className="occ-bar" style={{ flex: 1, height: 8, borderRadius: 4 }}>
            <span style={{ width: `${stats.occPct}%` }}></span>
          </div>
          <span className="mono" style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
            {stats.occPct}%
          </span>
        </div>

        <div className="mgd-occ-grid">
          <div className="mgd-occ-cell">
            <div className="mono mgd-occ-num">{stats.totalSeats}</div>
            <div className="mgd-occ-lbl">Total locuri</div>
          </div>
          <div className="mgd-occ-cell">
            <div className="mono mgd-occ-num" style={{ color: "var(--accent)" }}>{stats.reserved}</div>
            <div className="mgd-occ-lbl">Rezervate</div>
          </div>
          <div className="mgd-occ-cell">
            <div className="mono mgd-occ-num" style={{ color: "#1B5E3F" }}>{stats.available}</div>
            <div className="mgd-occ-lbl">Disponibile</div>
          </div>
          <div className="mgd-occ-cell">
            <div className="mono mgd-occ-num">{train.cars}</div>
            <div className="mgd-occ-lbl">Vagoane</div>
          </div>
        </div>
      </div>

      {/* Passenger list */}
      <div className="mgd-pass-section">
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Pasageri înregistrați
          {passengers.length > 0 && (
            <span style={{ marginLeft: 8, fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--ink-3)", fontSize: 12 }}>
              ({passengers.length})
            </span>
          )}
        </div>

        {passengers.length === 0 ? (
          <div className="mgd-no-pass">
            Nicio rezervare confirmată pe această cursă.
          </div>
        ) : (
          <div className="mgd-pass-table">
            <div className="mgd-pass-hdr">
              <span>Pasager</span>
              <span>Loc</span>
              <span>Vagon</span>
              <span>Tip</span>
              <span>ID rezervare</span>
              <span style={{ textAlign: "right" }}>Preț</span>
            </div>
            {passengers.map(b => (
              <div key={b.id} className="mgd-pass-row">
                <span style={{ fontWeight: 600 }}>{b.passenger}</span>
                <span className="mono">{b.seat}</span>
                <span className="mono">{b.car}</span>
                <span>{b.type}</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>{b.id}</span>
                <span className="mono" style={{ fontWeight: 700, textAlign: "right" }}>{b.price} RON</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Add / Edit train modal (UC8 + UC9 edit) ─────────────────────── */
function TrainFormModal({ title, trains, initial, onSave, onClose }) {
  const { STATIONS, TRAIN_TYPES } = window.RoRailData;
  const isEdit = !!initial;

  const [form, setForm] = useMgr(
    initial
      ? { ...initial, name: initial.name || "" }
      : { id: "", type: "IR", from: "BUH", to: "CLJ", dep: "08:00", arr: "15:00", price: "", cars: 5, name: "" }
  );
  const [err, setErr] = useMgr("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setNum = (k) => (e) => setForm(f => ({ ...f, [k]: Number(e.target.value) }));

  const computeDuration = () => {
    try {
      const [dh, dm] = form.dep.split(":").map(Number);
      const [ah, am] = form.arr.split(":").map(Number);
      let mins = (ah * 60 + am) - (dh * 60 + dm);
      if (mins < 0) mins += 24 * 60;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m.toString().padStart(2, "0")}m`;
    } catch (_) {
      return form.duration || "—";
    }
  };

  const submit = (e) => {
    e.preventDefault();
    setErr("");
    if (!form.id.trim()) { setErr("Indicativul este obligatoriu."); return; }
    if (!isEdit && trains.find(t => t.id === form.id.trim())) {
      setErr("Există deja o cursă cu acest indicativ. Alegeți un ID unic."); return;
    }
    if (form.from === form.to) { setErr("Stațiile de plecare și sosire trebuie să fie diferite."); return; }
    if (!form.dep || !form.arr) { setErr("Orele de plecare și sosire sunt obligatorii."); return; }
    if (!form.price || Number(form.price) <= 0) { setErr("Prețul trebuie să fie un număr pozitiv."); return; }
    if (!form.cars || Number(form.cars) < 1 || Number(form.cars) > 12) {
      setErr("Numărul de vagoane trebuie să fie între 1 și 12."); return;
    }

    const saved = {
      ...form,
      id: form.id.trim(),
      price: Number(form.price),
      cars: Number(form.cars),
      duration: computeDuration(),
      stops: [form.from, form.to],
      name: form.name.trim() || null,
    };
    onSave(saved);
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog mgr-modal" onClick={e => e.stopPropagation()}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>{title}</div>
        <form onSubmit={submit}>
          <div className="mgr-form-grid">
            <div className="field">
              <span className="label">Indicativ *</span>
              <input
                type="text"
                placeholder="ex. IR-2001"
                value={form.id}
                onChange={set("id")}
                disabled={isEdit}
                style={isEdit ? { opacity: 0.55, cursor: "not-allowed" } : {}}
              />
            </div>
            <div className="field">
              <span className="label">Tip *</span>
              <select value={form.type} onChange={set("type")}>
                {Object.entries(TRAIN_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <span className="label">Stație plecare *</span>
              <select value={form.from} onChange={set("from")}>
                {STATIONS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="label">Stație sosire *</span>
              <select value={form.to} onChange={set("to")}>
                {STATIONS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>

            <div className="field">
              <span className="label">Ora plecare *</span>
              <input type="time" value={form.dep} onChange={set("dep")} />
            </div>
            <div className="field">
              <span className="label">Ora sosire *</span>
              <input type="time" value={form.arr} onChange={set("arr")} />
            </div>

            <div className="field">
              <span className="label">Preț de bază (RON) *</span>
              <input type="number" min="1" step="1" placeholder="120" value={form.price} onChange={set("price")} />
            </div>
            <div className="field">
              <span className="label">Vagoane (1–12) *</span>
              <input type="number" min="1" max="12" value={form.cars} onChange={setNum("cars")} />
            </div>

            <div className="field" style={{ gridColumn: "span 2" }}>
              <span className="label">Denumire cursă (opțional)</span>
              <input type="text" placeholder="ex. Transilvania" value={form.name} onChange={set("name")} />
            </div>
          </div>

          {err && <div className="auth-err" style={{ marginTop: 14 }}>{err}</div>}

          <div className="dialog-actions">
            <button type="button" className="btn" onClick={onClose}>Anulează</button>
            <button type="submit" className="btn btn-accent">
              {isEdit ? "Salvează modificările →" : "Adaugă cursa →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete confirmation dialog (UC9 delete) ─────────────────────── */
function DeleteConfirmDialog({ train, history, onConfirm, onClose }) {
  const { stationName } = window.RoRailData;
  const active = history.filter(b => b.trainId === train.id && b.status === "confirmed");
  const blocked = active.length > 0;

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>UC9 · Ștergere cursă</div>
        <h2 className="serif" style={{ fontSize: 20, margin: "0 0 14px" }}>
          {blocked ? "Ștergere blocată" : "Confirmare ștergere"}
        </h2>

        <div className="dialog-trip">
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>{train.id}</div>
          <div style={{ fontWeight: 600, marginTop: 2 }}>{train.name || train.id}</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>
            {stationName(train.from)} → {stationName(train.to)} · {train.dep}
          </div>
        </div>

        {blocked ? (
          <>
            <div className="auth-err" style={{ marginTop: 16 }}>
              Nu puteți șterge o cursă cu pasageri activi. Există {active.length} rezervare{active.length !== 1 ? "i" : ""} confirmată{active.length !== 1 ? "" : ""}.
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {active.map(b => (
                <div key={b.id} style={{
                  fontSize: 13, padding: "8px 12px",
                  background: "var(--paper-2)", borderRadius: "var(--r)",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <span style={{ fontWeight: 600 }}>{b.passenger}</span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>{b.id}</span>
                </div>
              ))}
            </div>
            <div className="dialog-actions">
              <button className="btn btn-accent" onClick={onClose}>Înapoi</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 12, lineHeight: 1.5 }}>
              Această cursă nu are rezervări active. Confirmați ștergerea permanentă din sistem?
            </p>
            <div className="dialog-actions">
              <button className="btn" onClick={onClose}>Anulează</button>
              <button
                className="btn"
                style={{ color: "var(--accent)", borderColor: "rgba(232,65,43,.35)" }}
                onClick={onConfirm}
              >
                Șterge cursa definitiv
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

window.RoRailManager = { ManagerScreen };
