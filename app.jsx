// app.jsx — RoRail main app, screen routing, state

const { useState: useStateA, useEffect: useEffectA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#E8412B",
  "seatStyle": "photo"
}/*EDITMODE-END*/;

// ── API helpers ───────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("rr_token");

const api = async (path, options = {}) => {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Eroare server.");
  return data;
};

// Decode stored JWT to restore user session on page load
const restoreUser = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("rr_token");
      return null;
    }
    return { email: payload.email, name: payload.name, role: payload.role };
  } catch { return null; }
};

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useStateA("login"); // login | register | reset | search | book | trips | manager
  const [user, setUser] = useStateA(() => restoreUser());
  const [registered, setRegistered] = useStateA(null);
  const [history, setHistory] = useStateA([]);
  const [trains, setTrains] = useStateA([...window.RoRailData.TRAINS]); // starts with static data
  const [activeTrain, setActiveTrain] = useStateA(null);

  useEffectA(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
  }, [t.accent]);

  // Redirect to correct screen when user session is restored
  useEffectA(() => {
    if (user) setScreen(user.role === "manager" ? "manager" : "search");
  }, []); // run once on mount

  // Load trains from API (falls back to static data if server is down)
  useEffectA(() => {
    api("/api/trains")
      .then(data => { if (Array.isArray(data)) setTrains(data); })
      .catch(() => {}); // keep static data as fallback
  }, []);

  // Load bookings from API whenever user changes
  useEffectA(() => {
    if (!user) { setHistory([]); return; }
    api("/api/bookings")
      .then(data => { if (Array.isArray(data)) setHistory(data); })
      .catch(() => {});
  }, [user?.email]);

  // ── Auth callbacks ──────────────────────────────────────────────────────────
  const onLogin = async (email, password) => {
    const { token, user } = await api("/api/auth/login", {
      method: "POST", body: { email, password },
    });
    localStorage.setItem("rr_token", token);
    setUser(user);
    return user.role;
  };

  const onRegister = async (username, email, password) => {
    await api("/api/auth/register", {
      method: "POST", body: { email, password, name: username },
    });
    setRegistered({ username, email });
  };

  const onLogout = () => {
    localStorage.removeItem("rr_token");
    setUser(null);
    setHistory([]);
    setScreen("login");
  };

  // ── Booking callbacks ───────────────────────────────────────────────────────
  const goBook = (train) => { setActiveTrain(train); setScreen("book"); };

  const onConfirm = async (booking) => {
    try {
      const saved = await api("/api/bookings", { method: "POST", body: booking });
      setHistory(h => [saved, ...h]);
    } catch {
      // Fallback: add locally if API fails
      setHistory(h => [{ ...booking, userEmail: user.email }, ...h]);
    }
    setScreen("trips");
  };

  const onCancel = async (id) => {
    try {
      await api(`/api/bookings/${id}/cancel`, { method: "PUT" });
    } catch {}
    // Update local state regardless (optimistic)
    setHistory(h => h.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
  };

  // ── Train callbacks (manager) ───────────────────────────────────────────────
  const handleAddTrain = async (train) => {
    try {
      const saved = await api("/api/trains", { method: "POST", body: train });
      setTrains(t => [...t, saved]);
    } catch (e) {
      throw e; // let ManagerScreen show the error
    }
  };

  const handleEditTrain = async (train) => {
    try {
      const saved = await api(`/api/trains/${train.id}`, { method: "PUT", body: train });
      setTrains(t => t.map(tr => tr.id === saved.id ? saved : tr));
    } catch (e) {
      throw e;
    }
  };

  const handleDeleteTrain = async (id) => {
    await api(`/api/trains/${id}`, { method: "DELETE" });
    setTrains(t => t.filter(tr => tr.id !== id));
  };

  const { Register, Login, Reset } = window.RoRailAuth;
  const { SearchScreen } = window.RoRailSearch;
  const { BookingScreen } = window.RoRailBooking;
  const { TripsScreen } = window.RoRailTrips;
  const { ManagerScreen } = window.RoRailManager;

  const showHeader = !!user;

  return (
    <div className="app-shell">
      {showHeader && <Header screen={screen} setScreen={setScreen} user={user} onLogout={onLogout} />}

      <main style={{flex: 1}}>
        {screen === "register" && <Register go={setScreen} onRegister={onRegister} />}
        {screen === "login"    && <Login go={setScreen} onLogin={onLogin} registered={registered} />}
        {screen === "reset"    && <Reset go={setScreen} />}
        {screen === "search" && user && (
          <SearchScreen goBook={goBook} history={history} user={user} trains={trains} />
        )}
        {screen === "book" && user && activeTrain && (
          <BookingScreen
            train={activeTrain}
            user={user}
            onConfirm={onConfirm}
            goBack={() => setScreen("search")}
            seatStyle={t.seatStyle}
          />
        )}
        {screen === "trips" && user && (
          <TripsScreen history={history} onCancel={onCancel} goSearch={() => setScreen("search")} />
        )}
        {screen === "manager" && user?.role === "manager" && (
          <ManagerScreen
            trains={trains}
            setTrains={setTrains}
            history={history}
            user={user}
            onAdd={handleAddTrain}
            onEdit={handleEditTrain}
            onDelete={handleDeleteTrain}
          />
        )}
      </main>

      <footer className="app-foot">
        <span>RoRail © 2026 — Romanian Rail Network</span>
        <span>Conform GDPR · Plată securizată · Asistență 24/7</span>
      </footer>

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor label="Culoare accent" value={t.accent} onChange={(v) => setTweak("accent", v)} />
        <div style={{display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap: 6, marginTop: 4}}>
          {["#E8412B", "#1B5E3F", "#9C2A2A", "#0E4F8A", "#C7903B"].map(c => (
            <button key={c}
              onClick={() => setTweak("accent", c)}
              style={{height: 22, background: c, border: t.accent === c ? "2px solid var(--ink)" : "1px solid rgba(0,0,0,.15)", borderRadius: 3, cursor: "pointer"}}
              title={c}
            />
          ))}
        </div>
        <TweakSection label="Vagoane" />
        <TweakSelect
          label="Stil hartă locuri"
          value={t.seatStyle}
          options={[
            { value: "photo",       label: "Foto vagon" },
            { value: "topdown",     label: "Top-down" },
            { value: "blueprint",   label: "Blueprint" },
            { value: "compartment", label: "Cupeu" },
          ]}
          onChange={(v) => setTweak("seatStyle", v)}
        />
        <TweakSection label="Navigare demo" />
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 6}}>
          <TweakButton label="Login"            onClick={() => setScreen("login")} />
          <TweakButton label="Register"         onClick={() => setScreen("register")} />
          <TweakButton label="Reset parolă"     onClick={() => setScreen("reset")} />
          <TweakButton label="Traveler →Căutare" onClick={() => { setUser({ email: "andrei@rorail.ro", name: "Andrei Popescu", role: "traveler" }); setScreen("search"); }} />
          <TweakButton label="Traveler →Călătorii" onClick={() => { setUser({ email: "andrei@rorail.ro", name: "Andrei Popescu", role: "traveler" }); setScreen("trips"); }} />
          <TweakButton label="Manager login"    onClick={() => { setUser({ email: "manager@rorail.ro", name: "Manager CFR", role: "manager" }); setScreen("manager"); }} />
        </div>
      </TweaksPanel>
    </div>
  );
}

function Header({ screen, setScreen, user, onLogout }) {
  const isManager = user.role === "manager";
  const navs = isManager
    ? [{ id: "manager", label: "Panou de control" }]
    : [
        { id: "search", label: "Caută o cursă" },
        { id: "trips",  label: "Călătoriile mele" },
      ];
  return (
    <header className="hdr">
      <div className="hdr-brand" style={{cursor:"pointer"}} onClick={() => setScreen(isManager ? "manager" : "search")}>
        <span className="mark">RoRail<span className="dot">.</span></span>
        <span className="meta">{isManager ? "Administrare · Manager" : "Rețeaua feroviară · România"}</span>
      </div>
      <nav className="hdr-nav">
        {navs.map(n => (
          <a key={n.id} href="#"
             className={screen === n.id || (n.id === "search" && screen === "book") ? "active" : ""}
             onClick={(e) => { e.preventDefault(); setScreen(n.id); }}>
            {n.label}
          </a>
        ))}
      </nav>
      <div className="hdr-user">
        <span className="name">{user.name}</span>
        <span className="avatar">{user.name.split(" ").map(s => s[0]).join("").slice(0,2)}</span>
        <button className="auth-link" onClick={onLogout} style={{paddingBottom: 0, borderBottom: 0}}>Ieșire</button>
      </div>
    </header>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
