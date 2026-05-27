// data.jsx — Romanian station data, mock trains, mock user history

const STATIONS = [
  { code: "BUH", name: "București Nord", region: "Muntenia" },
  { code: "CLJ", name: "Cluj-Napoca", region: "Transilvania" },
  { code: "IAS", name: "Iași", region: "Moldova" },
  { code: "BVR", name: "Brașov", region: "Transilvania" },
  { code: "CTA", name: "Constanța", region: "Dobrogea" },
  { code: "TMS", name: "Timișoara Nord", region: "Banat" },
  { code: "SBI", name: "Sibiu", region: "Transilvania" },
  { code: "ORD", name: "Oradea", region: "Crișana" },
  { code: "GLT", name: "Galați", region: "Moldova" },
  { code: "CRV", name: "Craiova", region: "Oltenia" },
  { code: "PLO", name: "Ploiești Vest", region: "Muntenia" },
  { code: "SCV", name: "Suceava", region: "Bucovina" },
];

const TRAIN_TYPES = {
  IR: { label: "InterRegio", tier: "rapid" },
  IRN: { label: "InterRegio Nord", tier: "rapid" },
  R:  { label: "Regio", tier: "lent" },
  IC: { label: "InterCity", tier: "expres" },
};

// Generate a deterministic-looking schedule
const TRAINS = [
  { id: "IR-1641", type: "IR", from: "BUH", to: "CLJ", dep: "06:45", arr: "14:12", duration: "7h 27m", price: 142, stops: ["BUH","PLO","BVR","SBI","CLJ"], cars: 6, name: "Someșul" },
  { id: "IC-583",  type: "IC", from: "BUH", to: "CLJ", dep: "08:30", arr: "14:55", duration: "6h 25m", price: 189, stops: ["BUH","BVR","SBI","CLJ"], cars: 5, name: "Transilvania" },
  { id: "IR-1745", type: "IR", from: "BUH", to: "CLJ", dep: "13:10", arr: "21:02", duration: "7h 52m", price: 132, stops: ["BUH","PLO","BVR","SBI","CLJ"], cars: 7, name: "Apusenii" },
  { id: "IRN-401", type: "IRN", from: "BUH", to: "CLJ", dep: "22:35", arr: "06:48", duration: "8h 13m", price: 118, stops: ["BUH","PLO","BVR","CLJ"], cars: 8, name: "Nordul de noapte" },
  { id: "IR-1622", type: "IR", from: "BUH", to: "BVR", dep: "07:15", arr: "10:08", duration: "2h 53m", price: 67, stops: ["BUH","PLO","BVR"], cars: 5, name: "Carpații" },
  { id: "IC-562",  type: "IC", from: "BUH", to: "CTA", dep: "09:00", arr: "11:24", duration: "2h 24m", price: 79, stops: ["BUH","CTA"], cars: 4, name: "Marea Neagră" },
  { id: "IR-1932", type: "IR", from: "BUH", to: "IAS", dep: "07:40", arr: "14:55", duration: "7h 15m", price: 134, stops: ["BUH","PLO","SCV","IAS"], cars: 6, name: "Moldova" },
  { id: "IR-1833", type: "IR", from: "CLJ", to: "TMS", dep: "08:15", arr: "13:48", duration: "5h 33m", price: 112, stops: ["CLJ","ORD","TMS"], cars: 5, name: "Banatul" },
  { id: "R-2210",  type: "R",  from: "BUH", to: "BVR", dep: "10:45", arr: "14:22", duration: "3h 37m", price: 38, stops: ["BUH","PLO","BVR"], cars: 3, name: null },
];

// Helpers
const stationByCode = (c) => STATIONS.find(s => s.code === c);
const stationName = (c) => stationByCode(c)?.name || c;

// Initial mock history
const INITIAL_HISTORY = [
  {
    id: "BLT-2026-0419-A8F",
    userEmail: "andrei@rorail.ro",
    trainId: "IC-583",
    trainName: "Transilvania",
    from: "BUH", to: "CLJ",
    date: "2026-05-12",
    dep: "08:30", arr: "14:55",
    car: 3, seat: "27A", class: "1",
    type: "întreg",
    price: 189,
    status: "confirmed",
    passenger: "Andrei Popescu",
  },
  {
    id: "BLT-2026-0301-K2P",
    userEmail: "andrei@rorail.ro",
    trainId: "IR-1622",
    trainName: "Carpații",
    from: "BUH", to: "BVR",
    date: "2026-03-18",
    dep: "07:15", arr: "10:08",
    car: 2, seat: "14C", class: "2",
    type: "student",
    price: 47,
    status: "completed",
    passenger: "Andrei Popescu",
  },
  {
    id: "BLT-2026-0114-X1D",
    userEmail: "andrei@rorail.ro",
    trainId: "IR-1932",
    trainName: "Moldova",
    from: "BUH", to: "IAS",
    date: "2026-01-29",
    dep: "07:40", arr: "14:55",
    car: 4, seat: "8B", class: "2",
    type: "întreg",
    price: 134,
    status: "completed",
    passenger: "Andrei Popescu",
  },
];

const MANAGER_CREDS = { email: "manager@rorail.ro", pass: "manager123" };
const TOTAL_SEATS_PER_CAR = 48; // 12 rows × 4 seats

// Make seat map for a given car
function buildSeatMap(carNumber, trainId) {
  // Deterministic seed from car + trainId
  const seed = (carNumber * 13 + trainId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 1000;
  const rand = (n) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  const rows = 12;
  const layout = []; // each row: [A,B, aisle, C,D]
  for (let r = 1; r <= rows; r++) {
    const row = [];
    ["A","B","C","D"].forEach((letter, i) => {
      const id = `${r}${letter}`;
      const taken = rand(r * 4 + i) < 0.32;
      row.push({ id, taken, row: r, letter });
    });
    layout.push(row);
  }
  return layout;
}

window.RoRailData = {
  STATIONS, TRAINS, TRAIN_TYPES, INITIAL_HISTORY,
  MANAGER_CREDS, TOTAL_SEATS_PER_CAR,
  stationByCode, stationName, buildSeatMap,
};
