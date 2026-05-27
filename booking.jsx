// booking.jsx — Seat map + booking confirmation (UC5)

const { useState: useStateB, useEffect: useEffectB, useMemo: useMemoB } = React;

function BookingScreen({ train, user, onConfirm, goBack, seatStyle }) {
  const { stationName, buildSeatMap, TRAIN_TYPES } = window.RoRailData;
  const [step, setStep] = useStateB(1); // 1 seat, 2 passenger, 3 confirmed
  const [car, setCar] = useStateB(3);
  const [selected, setSelected] = useStateB(null);
  const [pass, setPass] = useStateB({
    nume: user?.name?.split(" ")[1] || "Popescu",
    prenume: user?.name?.split(" ")[0] || "Andrei",
    tip: "întreg",
  });

  const layout = useMemoB(() => buildSeatMap(car, train.id), [car, train.id]);

  const ticketTypes = [
    { id: "întreg", label: "Întreg", multiplier: 1 },
    { id: "elev", label: "Elev", multiplier: 0 },
    { id: "student", label: "Student", multiplier: 0.1 },
  ];

  const finalPrice = Math.round(train.price * (ticketTypes.find(t => t.id === pass.tip)?.multiplier || 1));

  const confirm = () => {
    setStep(3);
    setTimeout(() => {
      onConfirm({
        id: "BLT-2026-" + Math.floor(Math.random() * 9999).toString().padStart(4, "0") + "-" + Math.random().toString(36).substring(2, 5).toUpperCase(),
        trainId: train.id,
        trainName: train.name || TRAIN_TYPES[train.type].label,
        from: train.from, to: train.to,
        date: "2026-05-12",
        dep: train.dep, arr: train.arr,
        car, seat: selected.id,
        class: car <= 2 ? "1" : "2",
        type: pass.tip,
        price: finalPrice,
        status: "confirmed",
        passenger: `${pass.prenume} ${pass.nume}`,
      });
    }, 1800);
  };

  return (
    <div className="booking-screen fade-in">
      <div className="container">
        <div className="booking-top">
          <button onClick={goBack} className="auth-link" style={{padding: 0}}>← Înapoi la rezultate</button>
          <div className="eyebrow" style={{marginTop: 14}}>UC5 · Rezervare loc</div>
          <div className="booking-summary">
            <div>
              <div className="serif" style={{fontSize: 18, lineHeight: 1}}>
                {stationName(train.from)} <span style={{color:"var(--ink-4)"}}>—</span> {stationName(train.to)}
              </div>
              <div className="mono" style={{marginTop: 12, fontSize: 11, letterSpacing: ".14em", textTransform:"uppercase", color:"var(--ink-3)"}}>
                {train.id} · {train.name} · {train.dep} → {train.arr} · {train.duration}
              </div>
            </div>
            <BookingSteps step={step} />
          </div>
        </div>

        <hr className="hrule" />

        {step === 1 && (
          <div className="seat-stage fade-up">
            <div className="seat-left">
              <div className="eyebrow">Pasul 1</div>
              <h2 className="serif" style={{fontSize: 16, margin: "12px 0 22px", lineHeight: 1}}>
                Alege<br/><em style={{color:"var(--accent)"}}>locul tău.</em>
              </h2>
              <div className="seat-cars">
                <span className="label" style={{marginBottom: 8, display:"block"}}>Vagonul</span>
                <div className="car-tabs">
                  {[1,2,3,4,5,6].slice(0, train.cars).map(c => (
                    <button
                      key={c}
                      onClick={() => { setCar(c); setSelected(null); }}
                      className={"car-tab " + (car === c ? "car-tab-on" : "")}
                    >
                      <span className="serif tabular">{c}</span>
                      <span className="mono">{c <= 2 ? "Cls 1" : "Cls 2"}</span>
                    </button>
                  ))}
                </div>
              </div>
              <SeatLegend />
              {selected && (
                <div className="seat-pick fade-up">
                  <div className="label">Locul ales</div>
                  <div className="serif" style={{fontSize: 16, lineHeight: 1, marginTop: 6}}>
                    {selected.id}
                  </div>
                  <div className="mono" style={{fontSize: 11, letterSpacing: ".14em", textTransform:"uppercase", color: "var(--ink-3)", marginTop: 6}}>
                    Vagonul {car} · Clasa {car <= 2 ? "1" : "2"} · {selected.letter === "A" || selected.letter === "D" ? "fereastră" : "culoar"}
                  </div>
                </div>
              )}
              <div style={{marginTop: 36}}>
                <button className="btn btn-accent" disabled={!selected} onClick={() => setStep(2)}>
                  Continuă către pasager →
                </button>
              </div>
            </div>
            <div className="seat-right">
              <Carriage layout={layout} selected={selected} onSelect={setSelected} car={car} style={seatStyle} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="pass-stage fade-up">
            <div className="pass-left">
              <div className="eyebrow">Pasul 2</div>
              <h2 className="serif" style={{fontSize: 16, margin: "12px 0 22px", lineHeight: 1}}>
                Datele<br/><em style={{color:"var(--accent)"}}>pasagerului.</em>
              </h2>
              <p style={{fontSize:20, color:"var(--ink-3)", maxWidth: 460, lineHeight: 1.4}}>
                Biletul electronic va fi emis pe numele introdus mai jos și trimis pe email.
              </p>
            </div>
            <div className="pass-right">
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 28}}>
                <div className="field">
                  <span className="label">Prenume</span>
                  <input value={pass.prenume} onChange={(e) => setPass(p => ({...p, prenume: e.target.value}))} />
                </div>
                <div className="field">
                  <span className="label">Nume</span>
                  <input value={pass.nume} onChange={(e) => setPass(p => ({...p, nume: e.target.value}))} />
                </div>
              </div>

              <div style={{marginTop: 32}}>
                <span className="label" style={{display:"block", marginBottom: 12}}>Tip bilet</span>
                <div className="ticket-types">
                  {ticketTypes.map(tt => (
                    <button
                      key={tt.id}
                      onClick={() => setPass(p => ({...p, tip: tt.id}))}
                      className={"tt " + (pass.tip === tt.id ? "tt-on" : "")}
                    >
                      <div className="serif" style={{fontSize: 18}}>{tt.label}</div>
                      <div className="mono" style={{fontSize: 11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--ink-3)", marginTop: 8}}>
                        {tt.multiplier === 1 ? "preț integral" : tt.multiplier === 0 ? "−100% gratuit" : "−90% reducere"}
                      </div>
                      <div className="serif tabular" style={{fontSize: 16, marginTop: 14}}>
                        {Math.round(train.price * tt.multiplier)} <span style={{fontFamily:"var(--mono)", fontSize: 11}}>RON</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="receipt">
                <div className="receipt-row">
                  <span className="mono lbl">Cursa</span>
                  <span className="serif">{train.id} · {train.name}</span>
                </div>
                <div className="receipt-row">
                  <span className="mono lbl">Loc</span>
                  <span className="serif">Vagonul {car}, locul {selected?.id}</span>
                </div>
                <div className="receipt-row">
                  <span className="mono lbl">Pasager</span>
                  <span className="serif">{pass.prenume} {pass.nume}</span>
                </div>
                <hr className="hrule-soft" />
                <div className="receipt-row receipt-total">
                  <span className="mono lbl">Total de plată</span>
                  <span className="serif tabular" style={{fontSize: 38, color:"var(--accent)"}}>
                    {finalPrice} <span style={{fontFamily:"var(--mono)", fontSize: 12}}>RON</span>
                  </span>
                </div>
              </div>

              <p className="auth-fine" style={{marginTop: 18}}>
                Prin confirmare accepți condițiile de călătorie și politica de anulare. Anularea este posibilă cu cel puțin 60 minute înainte de plecarea trenului.
              </p>

              <div className="auth-actions" style={{marginTop: 24}}>
                <button onClick={confirm} className="btn btn-accent">Confirmă și emite biletul →</button>
                <button onClick={() => setStep(1)} className="auth-link">← Schimbă locul</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="confirm-stage fade-up">
            <div className="eyebrow" style={{color: "var(--accent)"}}>✓ Bilet emis</div>
            <h2 className="display" style={{fontSize: 18, margin: "16px 0 0", lineHeight: 0.95}}>
              Călătorie<br/>
              <em style={{color:"var(--accent)"}}>plăcută.</em>
            </h2>
            <p style={{fontSize: 16, color:"var(--ink-3)", marginTop: 18}}>
              Biletul electronic a fost trimis pe email. Te redirecționăm spre Istoric călătorii…
            </p>
            <div className="ticket-stub fade-up" style={{animationDelay: "300ms"}}>
              <div className="stub-l">
                <div className="mono lbl">Cursa</div>
                <div className="serif" style={{fontSize: 18, marginTop: 4}}>{train.name}</div>
                <div className="mono" style={{fontSize: 11, letterSpacing: ".14em", textTransform:"uppercase", color:"var(--ink-3)", marginTop: 4}}>{train.id}</div>

                <div style={{display:"flex", gap: 40, marginTop: 28}}>
                  <div>
                    <div className="mono lbl">Plecare</div>
                    <div className="serif tabular" style={{fontSize: 24}}>{train.dep}</div>
                    <div className="mono" style={{fontSize:11, letterSpacing:".14em", textTransform:"uppercase"}}>{stationName(train.from)}</div>
                  </div>
                  <div>
                    <div className="mono lbl">Sosire</div>
                    <div className="serif tabular" style={{fontSize: 24}}>{train.arr}</div>
                    <div className="mono" style={{fontSize:11, letterSpacing:".14em", textTransform:"uppercase"}}>{stationName(train.to)}</div>
                  </div>
                </div>
              </div>
              <div className="stub-r">
                <div className="mono lbl">Loc</div>
                <div className="serif tabular" style={{fontSize: 16}}>{selected?.id}</div>
                <div className="mono" style={{fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--ink-3)"}}>Vagonul {car}</div>
                <div style={{marginTop: 22}}>
                  <div className="mono lbl">Pasager</div>
                  <div className="serif" style={{fontSize:18}}>{pass.prenume} {pass.nume}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingSteps({ step }) {
  const steps = ["Loc", "Pasager", "Bilet"];
  return (
    <div className="booking-steps">
      {steps.map((s, i) => (
        <div key={s} className={"bk-step " + (i + 1 <= step ? "bk-step-on" : "")}>
          <span className="bk-num mono">0{i + 1}</span>
          <span className="bk-lbl">{s}</span>
        </div>
      ))}
    </div>
  );
}

function SeatLegend() {
  return (
    <div className="seat-legend">
      <span><i className="lg lg-free"></i> liber</span>
      <span><i className="lg lg-sel"></i> ales</span>
      <span><i className="lg lg-tk"></i> ocupat</span>
      <span><i className="lg lg-win"></i> fereastră</span>
    </div>
  );
}

function Carriage({ layout, selected, onSelect, car, style }) {
  if (style === "photo") {
    return <CarriagePhoto layout={layout} selected={selected} onSelect={onSelect} car={car} />;
  }
  return (
    <div className={"carriage carriage-" + (style || "topdown")}>
      <div className="carriage-frame">
        <div className="carriage-head">
          <div className="ch-arrow">▶</div>
          <div className="mono ch-lbl">SENS DE MERS · VAGON {car}</div>
        </div>
        <div className="carriage-body">
          <div className="seat-grid">
            {layout.map((row, ri) => (
              <div className="seat-row" key={ri}>
                <span className="row-num mono">{ri + 1}</span>
                <Seat s={row[0]} selected={selected} onSelect={onSelect} window />
                <Seat s={row[1]} selected={selected} onSelect={onSelect} />
                <span className="aisle"></span>
                <Seat s={row[2]} selected={selected} onSelect={onSelect} />
                <Seat s={row[3]} selected={selected} onSelect={onSelect} window />
                <span className="row-num mono">{ri + 1}</span>
              </div>
            ))}
          </div>
          <div className="carriage-amenities">
            <div><span className="mono">⌧ WC</span></div>
            <div><span className="mono">≋ Bagaje</span></div>
          </div>
        </div>
        <div className="carriage-tail">
          <div className="mono ct-lbl">VAGON {car}</div>
        </div>
      </div>
    </div>
  );
}

// Carriage photo variant: overlay seat numbers on real carriage image (642x1600).
// Positions hand-mapped to the red dots drawn on the source image.
function CarriagePhoto({ layout, selected, onSelect, car }) {
  const SEATS = [
    // Row 1 — right top (next to WC), only 2 seats
    { row: 1, col: "C", x: 62.2, y: 21.6 },
    { row: 1, col: "D", x: 75.9, y: 21.6 },
    // Row 2 — full row, 4 seats
    { row: 2, col: "A", x: 21.9, y: 28.7 },
    { row: 2, col: "B", x: 35.8, y: 28.7 },
    { row: 2, col: "C", x: 62.0, y: 28.7 },
    { row: 2, col: "D", x: 76.2, y: 28.7 },
    // Row 3 — full row, 4 seats
    { row: 3, col: "A", x: 22.1, y: 34.3 },
    { row: 3, col: "B", x: 36.3, y: 34.3 },
    { row: 3, col: "C", x: 62.0, y: 34.3 },
    { row: 3, col: "D", x: 76.2, y: 34.3 },
    // Rows 4-5 — left side only (right has control panel), 2 seats each
    { row: 4, col: "A", x: 22.4, y: 42.5 },
    { row: 4, col: "B", x: 36.3, y: 42.5 },
    { row: 5, col: "A", x: 22.4, y: 48.3 },
    { row: 5, col: "B", x: 35.8, y: 48.3 },
    // Rows 6-7 — full rows
    { row: 6, col: "A", x: 22.7, y: 57.2 },
    { row: 6, col: "B", x: 35.8, y: 57.2 },
    { row: 6, col: "C", x: 61.2, y: 57.2 },
    { row: 6, col: "D", x: 76.6, y: 57.2 },
    { row: 7, col: "A", x: 21.9, y: 62.7 },
    { row: 7, col: "B", x: 35.8, y: 62.7 },
    { row: 7, col: "C", x: 62.2, y: 62.7 },
    { row: 7, col: "D", x: 76.6, y: 62.7 },
    // Rows 8-9 — full rows
    { row: 8, col: "A", x: 21.9, y: 71.4 },
    { row: 8, col: "B", x: 35.5, y: 71.4 },
    { row: 8, col: "C", x: 62.0, y: 71.4 },
    { row: 8, col: "D", x: 75.6, y: 71.4 },
    { row: 9, col: "A", x: 22.4, y: 76.7 },
    { row: 9, col: "B", x: 36.5, y: 76.7 },
    { row: 9, col: "C", x: 61.7, y: 76.7 },
    { row: 9, col: "D", x: 77.0, y: 76.7 },
    // Rows 10-11 — full rows (carriage end)
    { row: 10, col: "A", x: 21.9, y: 85.4 },
    { row: 10, col: "B", x: 37.1, y: 85.4 },
    { row: 10, col: "C", x: 61.5, y: 85.4 },
    { row: 10, col: "D", x: 76.2, y: 85.4 },
    { row: 11, col: "A", x: 22.4, y: 90.9 },
    { row: 11, col: "B", x: 36.3, y: 90.9 },
    { row: 11, col: "C", x: 61.7, y: 90.9 },
    { row: 11, col: "D", x: 77.0, y: 90.9 },
  ];
  const COL_IDX = { A: 0, B: 1, C: 2, D: 3 };
  const SEAT_W = 6.5;
  const SEAT_H = 3.4;

  const positions = SEATS.map(p => {
    const rowArr = layout[p.row - 1];
    if (!rowArr) return null;
    const seat = rowArr[COL_IDX[p.col]];
    if (!seat) return null;
    return { s: seat, x: p.x, y: p.y, isWin: p.col === "A" || p.col === "D" };
  }).filter(Boolean);

  return (
    <div className="carriage carriage-photo">
      <div className="cp-frame">
        <div className="cp-head">
          <span className="ch-arrow">▶</span>
          <span>SENS DE MERS · VAGON {car}</span>
        </div>
        <div className="cp-stage">
          <img src="assets/carriage.png" alt="" className="cp-img" />
          <div className="cp-overlay">
            {positions.map((p, i) => {
              const isSel = selected?.id === p.s.id;
              const cls = ["cp-seat"];
              if (p.s.taken) cls.push("cp-seat-taken");
              if (isSel) cls.push("cp-seat-sel");
              if (p.isWin) cls.push("cp-seat-window");
              return (
                <button
                  key={i}
                  className={cls.join(" ")}
                  disabled={p.s.taken}
                  onClick={() => onSelect(p.s)}
                  style={{
                    left: `${p.x - SEAT_W / 2}%`,
                    top: `${p.y - SEAT_H / 2}%`,
                    width: `${SEAT_W}%`,
                    height: `${SEAT_H}%`,
                  }}
                  title={p.s.taken ? "Ocupat" : `Loc ${p.s.id}`}
                >
                  <span className="cp-seat-id">{p.s.id}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Seat({ s, selected, onSelect, window: isWin }) {
  const isSel = selected?.id === s.id;
  const cls = ["seat"];
  if (s.taken) cls.push("seat-taken");
  if (isSel) cls.push("seat-sel");
  if (isWin) cls.push("seat-window");
  return (
    <button
      className={cls.join(" ")}
      disabled={s.taken}
      onClick={() => onSelect(s)}
      title={s.taken ? "Ocupat" : `Loc ${s.id}`}
    >
      <span className="seat-id mono">{s.id}</span>
    </button>
  );
}

window.RoRailBooking = { BookingScreen };
