// trips.jsx — My trips / history (UC6) + cancel (UC7)

const { useState: useStateT } = React;

function TripsScreen({ history, onCancel, goSearch }) {
  const { stationName } = window.RoRailData;
  const [filter, setFilter] = useStateT("toate");
  const [active, setActive] = useStateT(history[0]?.id || null);
  const [confirmCancel, setConfirmCancel] = useStateT(null);

  const today = new Date("2026-04-26");
  const enriched = history.map(h => {
    const d = new Date(h.date);
    const future = d > today;
    return { ...h, future };
  });

  const filtered = enriched.filter(h => {
    if (filter === "viitoare") return h.future && h.status !== "cancelled";
    if (filter === "trecute") return !h.future || h.status === "completed";
    if (filter === "anulate") return h.status === "cancelled";
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const trip = filtered.find(t => t.id === active) || filtered[0];

  return (
    <div className="trips-screen fade-in">
      <div className="container">
        <div className="trips-head">
          <div>
            <div className="eyebrow">UC6 · UC7 · Istoric călătorii</div>
            <h1 className="display" style={{fontSize: 48, margin: "16px 0 0", lineHeight: 0.95}}>
              Drumurile<br/>
              <em style={{color:"var(--accent)"}}>tale.</em>
            </h1>
          </div>
          <div className="trips-stats">
            <Stat n={enriched.length} l="bilete totale" />
            <Stat n={enriched.filter(h => h.future && h.status !== "cancelled").length} l="viitoare" />
            <Stat n={enriched.filter(h => h.status === "completed").length} l="finalizate" />
          </div>
        </div>

        <div className="trips-filter">
          {[["toate","Toate"],["viitoare","Viitoare"],["trecute","Trecute"],["anulate","Anulate"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={"chip " + (filter === v ? "chip-on" : "")}
            >{l}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="res-empty" style={{padding: "120px 0"}}>
            <div className="serif" style={{fontSize: 26}}>
              Nu aveți nicio călătorie înregistrată în istoric.
            </div>
            <div style={{marginTop: 18}}>
              <button className="btn btn-accent" onClick={goSearch}>Caută o cursă →</button>
            </div>
          </div>
        ) : (
          <div className="trips-grid">
            <div className="trips-list">
              {filtered.map(h => (
                <TripRow
                  key={h.id} t={h}
                  active={trip?.id === h.id}
                  onClick={() => setActive(h.id)}
                />
              ))}
            </div>
            {trip && (
              <TripDetail
                key={trip.id}
                t={trip}
                onAskCancel={() => setConfirmCancel(trip.id)}
              />
            )}
          </div>
        )}
      </div>

      {confirmCancel && (
        <CancelDialog
          trip={enriched.find(h => h.id === confirmCancel)}
          onClose={() => setConfirmCancel(null)}
          onConfirm={() => { onCancel(confirmCancel); setConfirmCancel(null); }}
        />
      )}
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div className="stat">
      <div className="serif tabular" style={{fontSize: 16, lineHeight: 1}}>{n}</div>
      <div className="mono" style={{fontSize: 10, letterSpacing: ".14em", textTransform:"uppercase", color:"var(--ink-3)", marginTop: 4}}>{l}</div>
    </div>
  );
}

function TripRow({ t, active, onClick }) {
  const { stationName } = window.RoRailData;
  const status = t.status === "cancelled" ? "Anulat" : t.future ? "Confirmat" : "Finalizat";
  return (
    <button
      className={"trip-row " + (active ? "trip-row-on" : "") + (t.status === "cancelled" ? " trip-row-cancel" : "")}
      onClick={onClick}
    >
      <div className="tr-date">
        <div className="serif tabular" style={{fontSize: 18, lineHeight: 1}}>{t.date.split("-")[2]}</div>
        <div className="mono" style={{fontSize: 10, letterSpacing: ".14em", textTransform:"uppercase", color:"var(--ink-3)", marginTop: 2}}>
          {["ian","feb","mar","apr","mai","iun","iul","aug","sep","oct","nov","dec"][parseInt(t.date.split("-")[1])-1]} {t.date.split("-")[0]}
        </div>
      </div>
      <div className="tr-route">
        <div className="serif" style={{fontSize: 16}}>
          {stationName(t.from)} → {stationName(t.to)}
        </div>
        <div className="mono" style={{fontSize: 10, letterSpacing: ".14em", textTransform:"uppercase", color:"var(--ink-3)", marginTop: 4}}>
          {t.trainId} · {t.dep}–{t.arr} · loc {t.seat}
        </div>
      </div>
      <div className={"tr-status tr-status-" + (t.future && t.status !== "cancelled" ? "on" : t.status === "cancelled" ? "cancel" : "off")}>
        {status}
      </div>
    </button>
  );
}

function TripDetail({ t, onAskCancel }) {
  const { stationName } = window.RoRailData;
  const canCancel = t.future && t.status !== "cancelled";
  return (
    <div className="trip-detail fade-up" key={t.id}>
      <div className="td-stub">
        <div className="td-head">
          <div>
            <div className="mono lbl">Bilet electronic</div>
            <div className="serif" style={{fontSize: 16, marginTop: 6}}>{t.trainName}</div>
            <div className="mono" style={{fontSize: 11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--ink-3)", marginTop: 4}}>
              {t.trainId} · {t.id}
            </div>
          </div>
          <div className={"td-status td-" + (t.status === "cancelled" ? "cancel" : t.future ? "on" : "done")}>
            {t.status === "cancelled" ? "Anulat" : t.future ? "Confirmat" : "Finalizat"}
          </div>
        </div>

        <div className="td-route">
          <div className="td-leg">
            <div className="mono lbl">Plecare</div>
            <div className="serif tabular" style={{fontSize: 16, lineHeight: 1, marginTop: 8}}>{t.dep}</div>
            <div className="mono" style={{fontSize: 11, letterSpacing: ".14em", textTransform:"uppercase", marginTop: 6}}>
              {stationName(t.from)}
            </div>
          </div>
          <div className="td-line">
            <span className="td-dash"></span>
            <span className="mono td-date">{t.date}</span>
          </div>
          <div className="td-leg" style={{textAlign:"right"}}>
            <div className="mono lbl">Sosire</div>
            <div className="serif tabular" style={{fontSize: 16, lineHeight: 1, marginTop: 8}}>{t.arr}</div>
            <div className="mono" style={{fontSize: 11, letterSpacing: ".14em", textTransform:"uppercase", marginTop: 6}}>
              {stationName(t.to)}
            </div>
          </div>
        </div>

        <hr className="hrule-soft" />

        <div className="td-meta">
          <Meta l="Vagonul" v={t.car} />
          <Meta l="Locul" v={t.seat} />
          <Meta l="Clasa" v={t.class} />
          <Meta l="Tip bilet" v={t.type} />
          <Meta l="Pasager" v={t.passenger} />
          <Meta l="Preț" v={`${t.price} RON`} />
        </div>
      </div>

      {canCancel && (
        <div className="td-actions">
          <button className="btn btn-ghost" onClick={onAskCancel}>Anulează rezervarea</button>
          <span className="auth-fine" style={{maxWidth: 360, margin: 0, textAlign:"right"}}>
            Anularea este disponibilă cu cel puțin 60 de minute înainte de plecare. Suma achitată se restituie integral.
          </span>
        </div>
      )}
      {!canCancel && t.status !== "cancelled" && (
        <div className="td-actions">
          <span className="auth-fine" style={{margin: 0}}>Cursa a plecat deja — anularea nu mai este disponibilă.</span>
        </div>
      )}
    </div>
  );
}

function Meta({ l, v }) {
  return (
    <div className="td-meta-cell">
      <div className="mono lbl">{l}</div>
      <div className="serif" style={{fontSize: 16, marginTop: 2}}>{v}</div>
    </div>
  );
}

function CancelDialog({ trip, onClose, onConfirm }) {
  const { stationName } = window.RoRailData;
  return (
    <div className="dialog-backdrop fade-in" onClick={onClose}>
      <div className="dialog fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="eyebrow">UC7 · Confirmă anularea</div>
        <h2 className="serif" style={{fontSize: 18, margin: "16px 0 18px", lineHeight: 1.05}}>
          Ești sigur că vrei să anulezi acest bilet?
        </h2>
        <div className="dialog-trip">
          <div className="serif" style={{fontSize: 16}}>{stationName(trip.from)} → {stationName(trip.to)}</div>
          <div className="mono" style={{fontSize: 11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--ink-3)", marginTop: 6}}>
            {trip.trainId} · {trip.date} · {trip.dep} · loc {trip.seat}
          </div>
        </div>
        <p style={{fontSize: 17, color:"var(--ink-3)", lineHeight: 1.45, marginTop: 18}}>
          Locul va fi eliberat și redevine disponibil pentru alți călători. Suma de <b>{trip.price} RON</b> se restituie pe metoda de plată inițială în maxim 5 zile lucrătoare.
        </p>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onClose}>Renunță</button>
          <button className="btn btn-accent" onClick={onConfirm}>Da, anulează biletul →</button>
        </div>
      </div>
    </div>
  );
}

window.RoRailTrips = { TripsScreen };
