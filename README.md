# RoRail

Romanian train ticket booking platform — desktop web prototype.

## Overview

RoRail is a fully interactive single-page application covering all traveler and manager flows of a national rail booking service. Built with React (CDN) + plain CSS, no build toolchain required.

**Aesthetic:** Modern app UI — Inter typeface, warm ivory base (`#FAFAF7`), signal vermilion accent (`#E8412B`), generous whitespace.

## Features

| Use Case | Screen |
|---|---|
| UC1 — Register | 3-step flow: form → email confirmation simulation → redirect |
| UC2 — Login | Demo credentials, role detection (traveler / manager), validation |
| UC3 — Reset password | Email link → new password → redirect |
| UC4 — Search trains | Station picker, date, passenger count, filters (type / departure window / sort), animated result cards |
| UC5 — Book a seat | 4 seat map styles, passenger form, receipt, ticket stub |
| UC6 — Trip history | Per-user list + detail panel, status badges |
| UC7 — Cancel trip | Confirmation dialog, refund message, struck-through entry |
| UC8 — Add train | Manager form: ID, type, route, times, price, cars — validated, auto-computes duration |
| UC9 — Edit / Delete train | Edit via pre-filled form; delete blocked with passenger list if active bookings exist |
| UC10 — Occupancy & passengers | Per-train occupancy bar + stats (total / reserved / available / cars) + confirmed passenger table |

**Tweaks panel** (bottom-right): accent color presets + custom picker, seat map style switcher, demo navigation shortcuts.

## Roles & Credentials

| Role | Email | Landing screen |
|---|---|---|
| Traveler | `andrei@rorail.ro` | Search (UC4) |
| Manager | `manager@rorail.ro` | Manager dashboard (UC8–UC10) |

Any other email + any password (except `wrong`) also logs in as a traveler.

## Seat Map Styles

- **Photo** — seat numbers overlaid on a real carriage photograph
- **Top-down** — schematic bird's-eye layout
- **Blueprint** — dark engineering-drawing theme
- **Compartment** — grouped coupé style

## Stations

București Nord · Cluj-Napoca · Iași · Brașov · Constanța · Timișoara Nord · Sibiu · Oradea · Galați · Craiova · Ploiești Vest · Suceava

## Running Locally

Serve over HTTP so the scroll-video asset loads correctly:

```bash
python -m http.server 8080
```

Then open [http://localhost:8080/](http://localhost:8080/).

Alternatively, open `RoRail.html` directly in a browser — all flows work except the scroll-controlled hero video (which requires HTTP for the `fetch()` call).

## File Structure

```
PWEB/
├── RoRail.html          # Entry point — loads React 18 + Babel via CDN
├── styles.css           # Global tokens, typography, buttons, inputs
├── components.css       # Per-screen component styles
├── tweaks-panel.jsx     # Floating dev panel (drag, accent, seat style)
├── data.jsx             # Stations, train schedules, mock booking history
├── auth.jsx             # Register / Login / Reset screens (UC1–UC3)
├── search.jsx           # Search + scroll-video hero (UC4)
├── booking.jsx          # Seat map + passenger form + ticket (UC5)
├── trips.jsx            # History + cancel dialog (UC6–UC7)
├── manager.jsx          # Manager dashboard: add/edit/delete trains, occupancy (UC8–UC10)
├── app.jsx              # Root component: routing + global state
└── assets/
    ├── carriage.png     # Train carriage photo (seat overlay)
    └── hero.mp4         # Scroll-scrubbed hero video
```

## Tech Stack

- **React 18** via CDN (no build step)
- **Babel Standalone** for in-browser JSX transpilation
- **Inter** + **JetBrains Mono** from Google Fonts
- **Pure CSS** - no framework
- **Node.js** - back end
- **Express.js** - Robust REST API architecture
- **MongoDB** - Non-Relational Database
- **Railway** - Deployed at [https://rorail.up.railway.app/](https://rorail.up.railway.app/)

## Architecture note

All state is in-memory (React `useState` in `app.jsx`). Trains, bookings, and user session reset on page refresh — intentional for a prototype. The structure is migration-ready: each state mutation is an isolated callback, so swapping in API calls later requires no UI changes.
