// auth.jsx — Register, Login, Reset password screens

const { useState } = React;

function AuthShell({ eyebrow, title, subtitle, children, side }) {
  return (
    <div className="auth-shell fade-in">
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="eyebrow" style={{marginBottom: 24}}>{eyebrow}</div>
          <h1 className="display" style={{fontSize: 18, margin: "0 0 28px"}}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize: 16, lineHeight: 1.35,
              color: "var(--ink-3)", maxWidth: 480, margin: 0
            }}>
              {subtitle}
            </p>
          )}
          <div style={{marginTop: 56}}>{children}</div>
        </div>
        <div className="auth-foot">
          <span className="mono" style={{fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-4)"}}>
            RoRail · CFR Călători Network · 2026
          </span>
          <span className="mono" style={{fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-4)"}}>
            Conform GDPR
          </span>
        </div>
      </div>
      <div className="auth-right">{side}</div>
    </div>
  );
}

function PosterSide({ caption, lines }) {
  return (
    <div className="auth-poster">
      <div className="placeholder" style={{position:"absolute", inset:0}}>
        <span className="ph-cap">{caption}</span>
      </div>
      <div className="auth-poster-overlay">
        <div className="mono" style={{fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(244,240,232,.7)"}}>
          Carnet de călătorie
        </div>
        <div className="serif" style={{fontSize: 16, lineHeight: 0.95, marginTop: 18, color: "var(--paper)"}}>
          {lines[0]}<br/>
          <span style={{color: "var(--accent)"}}>{lines[1]}</span>
        </div>
        <div style={{marginTop: 28, display:"flex", gap: 28, color: "rgba(244,240,232,.8)"}}>
          {lines.slice(2).map((l, i) => (
            <div key={i} className="mono" style={{fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase"}}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Register({ go, onRegister }) {
  const [data, setData] = useState({ username: "", email: "", pass: "", pass2: "" });
  const [step, setStep] = useState(1); // 1: form, 2: email-sent, 3: confirmed
  const [err, setErr] = useState("");

  const update = (k) => (e) => setData(d => ({ ...d, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setErr("");
    if (!data.username || !data.email || !data.pass) {
      setErr("Toate câmpurile sunt obligatorii."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setErr("Adresa de email este invalidă."); return;
    }
    if (data.pass.length < 6) {
      setErr("Parola trebuie să aibă minim 6 caractere."); return;
    }
    if (data.pass !== data.pass2) {
      setErr("Parolele nu coincid."); return;
    }
    setStep(2);
  };

  const confirm = async () => {
    setStep(3);
    try {
      await onRegister(data.username, data.email, data.pass);
    } catch (e) {
      setStep(2);
      setErr(e.message || "Eroare la înregistrare."); return;
    }
    setTimeout(() => go("login"), 1200);
  };

  return (
    <AuthShell
      eyebrow="UC1 · Înregistrare cont"
      title={<>Bun venit <em style={{color:"var(--accent)"}}>la bord.</em></>}
      subtitle="Creează un cont pentru a căuta rute, rezerva bilete și păstra istoricul călătoriilor."
      side={<PosterSide caption="poster · gara de nord, 06:42" lines={["O rută nouă", "începe aici.", "Cluj — 06:45", "InterRegio 1641", "Peron 4"]} />}
    >
      {step === 1 && (
        <form onSubmit={submit} className="auth-form">
          <div className="field">
            <span className="label">Nume utilizator</span>
            <input type="text" placeholder="ex. andrei.popescu" value={data.username} onChange={update("username")} />
          </div>
          <div className="field">
            <span className="label">Email</span>
            <input type="email" placeholder="numele@exemplu.ro" value={data.email} onChange={update("email")} />
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 28}}>
            <div className="field">
              <span className="label">Parolă</span>
              <input type="password" placeholder="••••••••" value={data.pass} onChange={update("pass")} />
            </div>
            <div className="field">
              <span className="label">Confirmă parola</span>
              <input type="password" placeholder="••••••••" value={data.pass2} onChange={update("pass2")} />
            </div>
          </div>
          {err && <div className="auth-err">{err}</div>}
          <div className="auth-actions">
            <button type="submit" className="btn btn-accent">Creează cont →</button>
            <button type="button" className="auth-link" onClick={() => go("login")}>
              Ai deja cont? Autentifică-te
            </button>
          </div>
          <p className="auth-fine">
            Prin crearea contului accepți <u>Termenii de utilizare</u> și <u>Politica de confidențialitate</u> conform GDPR. Datele cu caracter personal sunt criptate și folosite exclusiv pentru emiterea biletelor.
          </p>
        </form>
      )}
      {step === 2 && (
        <div className="auth-stage fade-up">
          <div className="mono" style={{fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-4)"}}>Pasul 2 din 3</div>
          <h2 className="serif" style={{fontSize: 38, margin: "12px 0 14px", lineHeight: 1.05}}>
            Ți-am trimis un email de confirmare la <span style={{color:"var(--accent)"}}>{data.email}</span>.
          </h2>
          <p style={{fontSize: 19, color:"var(--ink-3)", lineHeight:1.45, maxWidth: 460}}>
            Accesează linkul din email pentru a-ți activa contul. Dacă nu îl găsești, verifică folderul Spam.
          </p>
          <div className="auth-actions" style={{marginTop: 32}}>
            <button onClick={confirm} className="btn btn-accent">Simulează confirmarea →</button>
            <button onClick={() => setStep(1)} className="auth-link">← Editează datele</button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="auth-stage fade-up">
          <div className="mono" style={{fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--accent)"}}>✓ Cont confirmat</div>
          <h2 className="serif" style={{fontSize: 18, margin: "12px 0", lineHeight: 1}}>
            Te redirecționăm către autentificare…
          </h2>
        </div>
      )}
    </AuthShell>
  );
}

function Login({ go, onLogin, registered }) {
  const [data, setData] = useState({ email: registered?.email || "andrei@rorail.ro", pass: "demo123" });
  const [err, setErr] = useState("");
  const update = (k) => (e) => setData(d => ({ ...d, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!data.email || !data.pass) { setErr("Completează ambele câmpuri."); return; }
    try {
      const role = await onLogin(data.email, data.pass);
      go(role === "manager" ? "manager" : "search");
    } catch (e) {
      setErr(e.message || "Parola și utilizatorul nu se potrivesc.");
    }
  };

  return (
    <AuthShell
      eyebrow="UC2 · Autentificare"
      title={<>La timpul <em style={{color:"var(--accent)"}}>tău.</em></>}
      subtitle="Intră în contul tău pentru a-ți gestiona rezervările și a beneficia de tarife salvate."
      side={<PosterSide caption="poster · sibiu, valea oltului" lines={["Drumul prin", "Carpați.", "Brașov — 07:15", "InterRegio 1622", "Peron 2"]} />}
    >
      <form onSubmit={submit} className="auth-form">
        <div className="field">
          <span className="label">Email</span>
          <input type="email" placeholder="numele@exemplu.ro" value={data.email} onChange={update("email")} />
        </div>
        <div className="field">
          <span className="label">Parolă</span>
          <input type="password" placeholder="••••••••" value={data.pass} onChange={update("pass")} />
        </div>
        {err && <div className="auth-err">{err}</div>}
        <div className="auth-actions">
          <button type="submit" className="btn btn-accent">Autentifică-te →</button>
          <button type="button" className="auth-link" onClick={() => go("reset")}>
            Am uitat parola
          </button>
        </div>
        <div className="auth-fine">
          Nu ai cont încă?{" "}
          <button type="button" className="auth-inline-link" onClick={() => go("register")}>
            Înregistrează-te
          </button>
          {" "}— durează mai puțin decât o cafea în vagonul-restaurant.
        </div>
      </form>
    </AuthShell>
  );
}

function Reset({ go }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState({ a: "", b: "" });
  const [err, setErr] = useState("");

  const sendLink = (e) => {
    e.preventDefault();
    setErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Contul nu a fost găsit."); return;
    }
    setStep(2);
  };
  const setNew = (e) => {
    e.preventDefault();
    setErr("");
    if (pass.a.length < 6) { setErr("Minim 6 caractere."); return; }
    if (pass.a !== pass.b) { setErr("Parolele nu coincid."); return; }
    setStep(3);
    setTimeout(() => go("login"), 1400);
  };

  return (
    <AuthShell
      eyebrow="UC3 · Resetare parolă"
      title={<>Recapătă <em style={{color:"var(--accent)"}}>accesul.</em></>}
      subtitle="Îți trimitem un link sigur de resetare la adresa de email asociată contului."
      side={<PosterSide caption="poster · constanța, terminus" lines={["Spre malul", "mării.", "Constanța — 09:00", "InterCity 562", "Peron 1"]} />}
    >
      {step === 1 && (
        <form onSubmit={sendLink} className="auth-form fade-up">
          <div className="field">
            <span className="label">Email asociat contului</span>
            <input type="email" placeholder="numele@exemplu.ro" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {err && <div className="auth-err">{err}</div>}
          <div className="auth-actions">
            <button type="submit" className="btn btn-accent">Trimite linkul →</button>
            <button type="button" className="auth-link" onClick={() => go("login")}>← Înapoi la autentificare</button>
          </div>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={setNew} className="auth-form fade-up">
          <div className="mono" style={{fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 18}}>
            Link valid · /reset/9f3b2-a81e-c4d2
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 28}}>
            <div className="field">
              <span className="label">Parolă nouă</span>
              <input type="password" placeholder="••••••••" value={pass.a} onChange={(e) => setPass(p => ({...p, a: e.target.value}))} />
            </div>
            <div className="field">
              <span className="label">Confirmă</span>
              <input type="password" placeholder="••••••••" value={pass.b} onChange={(e) => setPass(p => ({...p, b: e.target.value}))} />
            </div>
          </div>
          {err && <div className="auth-err">{err}</div>}
          <div className="auth-actions">
            <button type="submit" className="btn btn-accent">Salvează parola →</button>
          </div>
        </form>
      )}
      {step === 3 && (
        <div className="auth-stage fade-up">
          <div className="mono" style={{fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--accent)"}}>✓ Parolă actualizată</div>
          <h2 className="serif" style={{fontSize: 18, margin: "12px 0", lineHeight: 1}}>
            Te trimitem la autentificare…
          </h2>
        </div>
      )}
    </AuthShell>
  );
}

window.RoRailAuth = { Register, Login, Reset };
