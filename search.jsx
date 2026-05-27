// search.jsx — Search & results screen (UC4)

const { useState: useStateS, useMemo: useMemoS } = React;

function SearchScreen({ goBook, history, user, trains }) {
  const { STATIONS, TRAIN_TYPES, stationName } = window.RoRailData;
  const [from, setFrom] = useStateS("BUH");
  const [to, setTo] = useStateS("CLJ");
  const [date, setDate] = useStateS("2026-05-12");
  const [pax, setPax] = useStateS(1);
  const [tier, setTier] = useStateS("toate"); // toate / expres / rapid / lent
  const [departWindow, setDepartWindow] = useStateS("oricând");
  const [sortBy, setSortBy] = useStateS("dep");
  const [searched, setSearched] = useStateS(true);

  const swap = () => { const f = from; setFrom(to); setTo(f); };

  const results = useMemoS(() => {
    if (!searched) return [];
    let r = trains.filter(t => t.from === from && t.to === to);
    if (tier !== "toate") r = r.filter(t => TRAIN_TYPES[t.type].tier === tier);
    if (departWindow !== "oricând") {
      r = r.filter(t => {
        const h = parseInt(t.dep.split(":")[0], 10);
        if (departWindow === "dimineața") return h >= 5 && h < 12;
        if (departWindow === "după-amiază") return h >= 12 && h < 18;
        if (departWindow === "seara") return h >= 18 || h < 5;
        return true;
      });
    }
    if (sortBy === "dep") r = [...r].sort((a, b) => a.dep.localeCompare(b.dep));
    if (sortBy === "price") r = [...r].sort((a, b) => a.price - b.price);
    if (sortBy === "duration") r = [...r].sort((a, b) => a.duration.localeCompare(b.duration));
    return r;
  }, [trains, from, to, tier, departWindow, sortBy, searched]);

  const formatDate = (d) => {
    const dt = new Date(d);
    const months = ["ian","feb","mar","apr","mai","iun","iul","aug","sep","oct","nov","dec"];
    const days = ["dum","lun","mar","mie","joi","vin","sâm"];
    return `${days[dt.getDay()]} · ${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
  };

  return (
    <div className="search-screen fade-in">
      {/* Scroll-controlled hero video */}
      <ScrollVideo />
      {/* Hero search */}
      <section className="search-hero">
        <div className="container">
          <div className="hero-top">
            <div>
              <div className="eyebrow">UC4 · Caută o cursă</div>
              <h1 className="display" style={{fontSize: 48, margin: "16px 0 0", maxWidth: 900}}>
                De unde<br/>
                <em style={{color:"var(--accent)"}}>pleci astăzi?</em>
              </h1>
            </div>
          </div>

          <div className="search-form">
            <div className="sf-row">
              <div className="sf-field sf-grow">
                <span className="label">Stația de plecare</span>
                <select value={from} onChange={(e) => setFrom(e.target.value)}>
                  {STATIONS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
              <button className="sf-swap" onClick={swap} title="Inversează">⇄</button>
              <div className="sf-field sf-grow">
                <span className="label">Stația de sosire</span>
                <select value={to} onChange={(e) => setTo(e.target.value)}>
                  {STATIONS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
              <div className="sf-field">
                <span className="label">Data</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="sf-field" style={{maxWidth: 110}}>
                <span className="label">Pasageri</span>
                <div className="sf-stepper">
                  <button onClick={() => setPax(Math.max(1, pax - 1))}>−</button>
                  <span className="serif tabular">{pax}</span>
                  <button onClick={() => setPax(Math.min(6, pax + 1))}>+</button>
                </div>
              </div>
              <button className="btn btn-accent sf-submit" onClick={() => setSearched(true)}>
                Caută trenuri →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="search-results">
        <div className="container">
          <div className="res-header">
            <div>
              <div className="eyebrow">Rezultate</div>
              <h2 className="serif" style={{fontSize: 18, margin: "10px 0 6px", lineHeight: 1}}>
                {stationName(from)} <span style={{color:"var(--ink-4)"}}>→</span> {stationName(to)}
              </h2>
              <div className="mono" style={{fontSize: 11, letterSpacing: ".14em", textTransform:"uppercase", color:"var(--ink-3)"}}>
                {formatDate(date)} · {results.length} curse · {pax} pasager{pax > 1 ? "i" : ""}
              </div>
            </div>
            <div className="res-filters">
              <FilterChip label="Tip" value={tier} options={["toate","expres","rapid","lent"]} onChange={setTier} />
              <FilterChip label="Plecare" value={departWindow} options={["oricând","dimineața","după-amiază","seara"]} onChange={setDepartWindow} />
              <FilterChip label="Sortare" value={sortBy} options={[["dep","plecare"],["price","preț"],["duration","durată"]]} onChange={setSortBy} />
            </div>
          </div>

          <div className="res-list">
            {results.length === 0 && (
              <div className="res-empty">
                <div className="serif" style={{fontSize: 24}}>
                  Nu există trenuri pe ruta și criteriile selectate.
                </div>
                <div style={{marginTop: 14, color:"var(--ink-3)"}}>
                  Încearcă o altă dată sau elimină filtrele.
                </div>
              </div>
            )}
            {results.map((t, idx) => (
              <TrainCard key={t.id} t={t} idx={idx} pax={pax} onSelect={() => goBook(t)} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterChip({ label, value, options, onChange }) {
  const opts = options.map(o => Array.isArray(o) ? o : [o, o]);
  return (
    <div className="filter-chip">
      <span className="label">{label}</span>
      <div className="chip-options">
        {opts.map(([val, lbl]) => (
          <button
            key={val}
            className={"chip " + (value === val ? "chip-on" : "")}
            onClick={() => onChange(val)}
          >{lbl}</button>
        ))}
      </div>
    </div>
  );
}

function TrainCard({ t, idx, pax, onSelect }) {
  const { TRAIN_TYPES, stationName } = window.RoRailData;
  const seatsLeft = 12 + ((idx * 7) % 60);
  const occ = Math.round((1 - seatsLeft / 80) * 100);
  return (
    <article className="train-card" style={{animationDelay: `${idx * 60}ms`}}>
      <div className="tc-num">
        <div className="mono tc-id">{t.id}</div>
        <div className="serif tc-name" style={{}}>{t.name || TRAIN_TYPES[t.type].label}</div>
        <div className="mono tc-tier">{TRAIN_TYPES[t.type].label}</div>
      </div>
      <div className="tc-time">
        <div className="serif tc-hr tabular">{t.dep}</div>
        <div className="mono tc-stn">{stationName(t.from)}</div>
      </div>
      <div className="tc-line">
        <div className="tc-line-bar">
          <span className="tc-dot tc-dot-l"></span>
          <span className="tc-dot tc-dot-r"></span>
        </div>
        <div className="mono tc-dur">{t.duration} · {t.stops.length - 2} opriri</div>
      </div>
      <div className="tc-time tc-time-r">
        <div className="serif tc-hr tabular">{t.arr}</div>
        <div className="mono tc-stn">{stationName(t.to)}</div>
      </div>
      <div className="tc-meta">
        <div className="mono tc-occ">
          <span className="occ-bar"><span style={{width: `${occ}%`}}></span></span>
          {seatsLeft} locuri
        </div>
      </div>
      <div className="tc-price">
        <div className="mono tc-from">de la</div>
        <div className="serif tc-amt tabular">{t.price * pax}<span className="tc-cur"> RON</span></div>
      </div>
      <button className="btn tc-cta" onClick={onSelect}>Rezervă →</button>
    </article>
  );
}

window.RoRailSearch = { SearchScreen };

function ScrollVideo() {
  const canvasRef = React.useRef(null);
  const stageRef = React.useRef(null);
  const framesRef = React.useRef([]);
  const [ready, setReady] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // Set the sticky child's top to the header height so it sticks immediately
  // at scroll=0 (the stage sits just below the header, so top:0 has a dead-zone
  // equal to the header height before sticky engages). With top:headerH the
  // child sticks from the first pixel of scroll and the header floats above it.
  React.useLayoutEffect(() => {
    const header = document.querySelector('.hdr');
    const sticky = stageRef.current?.querySelector('.scroll-video-sticky');
    if (!header || !sticky) return;
    sticky.style.top = `${header.offsetHeight + 2}px`;
    sticky.style.height = 'calc(100vh + 2px)';
  }, []);

  // Pre-decode all frames to ImageBitmaps for instant scrub
  React.useEffect(() => {
    let cancelled = false;
    const FRAME_COUNT = 60;
    (async () => {
      const blob = await fetch("assets/hero.mp4").then(r => r.blob());
      const url = URL.createObjectURL(blob);
      const v = document.createElement("video");
      v.src = url;
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      await new Promise(r => v.addEventListener("loadedmetadata", r, { once: true }));
      const dur = v.duration;
      const frames = [];
      for (let i = 0; i < FRAME_COUNT; i++) {
        if (cancelled) return;
        const t = (i / (FRAME_COUNT - 1)) * dur;
        v.currentTime = t;
        await new Promise(r => v.addEventListener("seeked", r, { once: true }));
        // Draw to offscreen canvas, store as ImageBitmap (fast to draw)
        const w = v.videoWidth, h = v.videoHeight;
        const oc = document.createElement("canvas");
        oc.width = w; oc.height = h;
        oc.getContext("2d").drawImage(v, 0, 0);
        const bitmap = await createImageBitmap(oc);
        frames.push(bitmap);
        if (i === 5 && !cancelled) {
          // Show first usable frame as soon as a few are ready
          framesRef.current = frames;
          setReady(true);
        }
      }
      if (cancelled) return;
      framesRef.current = frames;
      setReady(true);
      URL.revokeObjectURL(url);
    })();
    return () => { cancelled = true; };
  }, []);

  // Render the current frame to canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const ctx = canvas.getContext("2d");
    const draw = (p) => {
      const frames = framesRef.current;
      if (!frames.length) return;
      const idx = Math.max(0, Math.min(frames.length - 1, Math.round(p * (frames.length - 1))));
      const bm = frames[idx];
      // Resize canvas to displayed size for crisp rendering
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(rect.width * dpr);
      const ch = Math.round(rect.height * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw; canvas.height = ch;
      }
      // cover-fit
      const ar = bm.width / bm.height;
      const car = cw / ch;
      let dw, dh, dx, dy;
      if (ar > car) {
        dh = ch; dw = ch * ar; dx = (cw - dw) / 2; dy = 0;
      } else {
        dw = cw; dh = cw / ar; dx = 0; dy = (ch - dh) / 2;
      }
      ctx.drawImage(bm, dx, dy, dw, dh);
    };
    draw(progress);
    // Redraw on resize
    const onResize = () => draw(progress);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [progress, ready]);

  // Track scroll → progress
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let raf = null;
    const update = () => {
      const winH = window.innerHeight;
      const stageH = stage.offsetHeight;
      // Use scrollY directly so animation starts on the very first scroll,
      // regardless of how far down the stage sits below the sticky header.
      const p = Math.max(0, Math.min(1, window.scrollY / (stageH - winH)));
      setProgress(p);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = null; update(); });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="scroll-video-stage" ref={stageRef}>
      <div className="scroll-video-sticky">
        <canvas ref={canvasRef} className="scroll-video"></canvas>
        <div className="scroll-video-overlay">
          <div className="container">
            <div className="eyebrow" style={{color:"rgba(255,255,255,.7)"}}>RoRail · România pe șine</div>
            <h1 className="display" style={{fontSize: 72, color:"#FFF", margin:"12px 0 0", letterSpacing:"-.03em"}}>
              Drumul prin<br/>Carpați.
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
