require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const path     = require("path");

const User     = require("./models/User");
const Train    = require("./models/Train");
const Booking  = require("./models/Booking");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, "RoRail.html")));

// ── JWT middleware ────────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const managerOnly = (req, res, next) => {
  if (req.user.role !== "manager") return res.status(403).json({ error: "Manager only" });
  next();
};

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ error: "Toate câmpurile sunt obligatorii." });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ error: "Există deja un cont cu această adresă." });
    const hash = await bcrypt.hash(password, 10);
    await User.create({ email, password: hash, name, role: "traveler" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: "Parola și utilizatorul nu se potrivesc." });
    const token = jwt.sign(
      { email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Trains ────────────────────────────────────────────────────────────────────
app.get("/api/trains", async (req, res) => {
  res.json(await Train.find().select("-__v -createdAt -updatedAt"));
});

app.post("/api/trains", auth, managerOnly, async (req, res) => {
  try {
    const train = await Train.create(req.body);
    res.json(train);
  } catch (e) {
    res.status(400).json({ error: e.code === 11000 ? "Indicativul există deja." : e.message });
  }
});

app.put("/api/trains/:id", auth, managerOnly, async (req, res) => {
  const train = await Train.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  if (!train) return res.status(404).json({ error: "Cursa nu a fost găsită." });
  res.json(train);
});

app.delete("/api/trains/:id", auth, managerOnly, async (req, res) => {
  const active = await Booking.findOne({ trainId: req.params.id, status: "confirmed" });
  if (active) return res.status(409).json({ error: "Active bookings exist" });
  await Train.deleteOne({ id: req.params.id });
  res.json({ ok: true });
});

// ── Bookings ──────────────────────────────────────────────────────────────────
app.get("/api/bookings", auth, async (req, res) => {
  const filter = req.user.role === "manager" ? {} : { userEmail: req.user.email };
  res.json(await Booking.find(filter).sort({ createdAt: -1 }).select("-__v"));
});

app.post("/api/bookings", auth, async (req, res) => {
  try {
    const booking = await Booking.create({ ...req.body, userEmail: req.user.email });
    res.json(booking);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put("/api/bookings/:id/cancel", auth, async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    { id: req.params.id, userEmail: req.user.email },
    { status: "cancelled" },
    { new: true }
  );
  if (!booking) return res.status(404).json({ error: "Rezervarea nu a fost găsită." });
  res.json(booking);
});

// ── Seed ──────────────────────────────────────────────────────────────────────
const INITIAL_TRAINS = [
  { id: "IR-1641", type: "IR",  from: "BUH", to: "CLJ", dep: "06:45", arr: "14:12", duration: "7h 27m", price: 142, stops: ["BUH","PLO","BVR","SBI","CLJ"], cars: 6, name: "Someșul" },
  { id: "IC-583",  type: "IC",  from: "BUH", to: "CLJ", dep: "08:30", arr: "14:55", duration: "6h 25m", price: 189, stops: ["BUH","BVR","SBI","CLJ"],       cars: 5, name: "Transilvania" },
  { id: "IR-1745", type: "IR",  from: "BUH", to: "CLJ", dep: "13:10", arr: "21:02", duration: "7h 52m", price: 132, stops: ["BUH","PLO","BVR","SBI","CLJ"], cars: 7, name: "Apusenii" },
  { id: "IRN-401", type: "IRN", from: "BUH", to: "CLJ", dep: "22:35", arr: "06:48", duration: "8h 13m", price: 118, stops: ["BUH","PLO","BVR","CLJ"],       cars: 8, name: "Nordul de noapte" },
  { id: "IR-1622", type: "IR",  from: "BUH", to: "BVR", dep: "07:15", arr: "10:08", duration: "2h 53m", price: 67,  stops: ["BUH","PLO","BVR"],             cars: 5, name: "Carpații" },
  { id: "IC-562",  type: "IC",  from: "BUH", to: "CTA", dep: "09:00", arr: "11:24", duration: "2h 24m", price: 79,  stops: ["BUH","CTA"],                   cars: 4, name: "Marea Neagră" },
  { id: "IR-1932", type: "IR",  from: "BUH", to: "IAS", dep: "07:40", arr: "14:55", duration: "7h 15m", price: 134, stops: ["BUH","PLO","SCV","IAS"],       cars: 6, name: "Moldova" },
  { id: "IR-1833", type: "IR",  from: "CLJ", to: "TMS", dep: "08:15", arr: "13:48", duration: "5h 33m", price: 112, stops: ["CLJ","ORD","TMS"],             cars: 5, name: "Banatul" },
  { id: "R-2210",  type: "R",   from: "BUH", to: "BVR", dep: "10:45", arr: "14:22", duration: "3h 37m", price: 38,  stops: ["BUH","PLO","BVR"],             cars: 3, name: null },
];

async function seed() {
  // Trains
  if (await Train.countDocuments() === 0) {
    await Train.insertMany(INITIAL_TRAINS);
    console.log("✓ Seeded trains");
  }

  // Manager user
  if (!await User.findOne({ email: "manager@rorail.ro" })) {
    await User.create({
      email: "manager@rorail.ro",
      password: await bcrypt.hash("manager123", 10),
      name: "Manager CFR",
      role: "manager",
    });
    console.log("✓ Seeded manager user");
  }

  // Demo traveler user
  if (!await User.findOne({ email: "andrei@rorail.ro" })) {
    await User.create({
      email: "andrei@rorail.ro",
      password: await bcrypt.hash("demo123", 10),
      name: "Andrei Popescu",
      role: "traveler",
    });
    console.log("✓ Seeded demo traveler");
  }

  // Demo bookings for andrei@rorail.ro
  if (await Booking.countDocuments() === 0) {
    await Booking.insertMany([
      {
        id: "BLT-2026-0419-A8F", userEmail: "andrei@rorail.ro",
        trainId: "IC-583", trainName: "Transilvania",
        from: "BUH", to: "CLJ", date: "2026-05-12",
        dep: "08:30", arr: "14:55", car: 3, seat: "27A", class: "1",
        type: "întreg", price: 189, status: "confirmed", passenger: "Andrei Popescu",
      },
      {
        id: "BLT-2026-0301-K2P", userEmail: "andrei@rorail.ro",
        trainId: "IR-1622", trainName: "Carpații",
        from: "BUH", to: "BVR", date: "2026-03-18",
        dep: "07:15", arr: "10:08", car: 2, seat: "14C", class: "2",
        type: "student", price: 47, status: "completed", passenger: "Andrei Popescu",
      },
      {
        id: "BLT-2026-0114-X1D", userEmail: "andrei@rorail.ro",
        trainId: "IR-1932", trainName: "Moldova",
        from: "BUH", to: "IAS", date: "2026-01-29",
        dep: "07:40", arr: "14:55", car: 4, seat: "8B", class: "2",
        type: "întreg", price: 134, status: "completed", passenger: "Andrei Popescu",
      },
    ]);
    console.log("✓ Seeded demo bookings");
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✓ MongoDB connected");
    await seed();
    app.listen(process.env.PORT, () => console.log(`✓ RoRail running → http://localhost:${process.env.PORT}/`));
  })
  .catch(err => {
    console.error("✗ MongoDB connection failed:", err.message);
    process.exit(1);
  });
