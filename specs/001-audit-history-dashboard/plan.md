# Implementation Plan: M&A Audit History Dashboard

**Branch**: `001-audit-history-dashboard` | **Date**: 2026-06-18 | **Spec**: [spec.md](file:///Users/sasi/antigravity/multi%20agent rag/specs/001-audit-history-dashboard/spec.md)

**Input**: Feature specification from `specs/001-audit-history-dashboard/spec.md`

## Summary

Build an interactive, highly-polished Single Page Application (SPA) dashboard that visualizes historical M&A audit reports. The app will be served via a lightweight local Python HTTP server or openable directly via `file://` scheme using a robust dual-loading data strategy (JSON fetch + JS static fallback).

The dashboard will include:
1. **Search & Status Filtering**: Real-time filtering of audit cards.
2. **Detail View**: In-depth review of compliance status and identified risks.
3. **Runway & Burn-rate Trend Charts**: High-fidelity line charts rendering historical financial trajectories.
4. **Interactive Policy Slider Simulation**: Dynamic evaluation of target compliance using custom ranges.

## Technical Context

**Language/Version**: HTML5, ECMAScript 2022 (ES13), Python 3.12 (for server/data seeding)

**Primary Dependencies**: Chart.js (CDN) for trend charts, Google Fonts (Outfit & Inter) for typography

**Storage**: `audit_reports.json` (local JSON data store) + `data.js` (static JS fallback object)

**Testing**: Manual test suite verifying search inputs, slider recalculations, and visual chart rendering

**Target Platform**: Modern Web Browsers (Chrome, Safari, Firefox, Edge)

**Project Type**: Front-end Web Dashboard + Python Data Seed Integration

**Performance Goals**:
- UI Search/Filter response: < 100ms
- Slider recalculation/badge update: < 100ms
- Initial render & chart load: < 300ms

**Constraints**:
- Must run without external bundle builders (Vite/Webpack) to remain lightweight and easily integration-ready.
- Stylings must use modern Vanilla CSS custom properties (variables), transitions, and CSS grid/flexbox. No TailwindCSS.

## Project Structure

### Documentation (this feature)

```text
specs/001-audit-history-dashboard/
├── spec.md              # Feature Specification (completed)
├── plan.md              # This Implementation Plan file
├── research.md          # Technical research notes
├── data-model.md        # JSON schema and data structures
└── checklists/
    └── requirements.md  # Quality assurance checklist (completed)
```

### Source Code Layout

We will place the dashboard source code in a new `dashboard/` directory in the repository root to keep it decoupled from the core python orchestrator code:

```text
dashboard/
├── index.html           # Main SPA entrypoint
├── style.css            # Custom vanilla CSS with premium styling/animations
├── app.js               # Reactive frontend controller & slider math
├── data.js              # Seed data JS export (for file:// compatibility)
└── audit_reports.json   # Raw JSON database of audit history
server.py                # Lightweight python development server
```

**Structure Decision**: Selected a clean frontend dashboard subfolder (`dashboard/`) with a root-level `server.py` utility. This provides an organized separation of concerns, keeps the python backend directories clean, and ensures easy deployment.

## Proposed Changes

### [dashboard]

#### [NEW] [index.html](file:///Users/sasi/antigravity/multi%20agent%20rag/dashboard/index.html)
Main dashboard structure using semantic HTML5 tags:
- Header with Title and "Reset Policy" buttons.
- Filter and search sidebar.
- Policy limit sliders panel.
- Main dashboard view featuring the list of target companies and the detail/chart layout.

#### [NEW] [style.css](file:///Users/sasi/antigravity/multi%20agent%20rag/dashboard/style.css)
CSS rules containing the design system tokens:
- **Theme**: Premium Dark mode (`#0b0f19` canvas, `#161e31` card backgrounds).
- **Effects**: Glassmorphism with backdrop filters and translucent borders.
- **Animations**: Card scale on hover, smooth layout transitions, and compliance badge pulse animations.
- **Responsiveness**: Flexbox wrapper with CSS Grid content areas scaling down on mobile viewport sizes.

#### [NEW] [app.js](file:///Users/sasi/antigravity/multi%20agent%20rag/dashboard/app.js)
Frontend logic implementing:
- **Dual loading strategy**: Attempts to `fetch('audit_reports.json')` first. If it fails (due to CORS/file://), loads default database from global namespace in `data.js`.
- **Search & Filter state**: Reactive list rendering based on search keyup and compliance filter click.
- **Dynamic Auditor Engine**: Re-evaluates each target's compliance against current slider values using the standard mathematical buying limits:
  - `compliant = totalDebt <= maxDebt && runway >= minRunway && burnRate <= maxBurnRate && !hasLawsuits`
  - Regenerates custom `risks` lists dynamically based on which rules are violated.
* **Chart rendering**: Uses Chart.js to draw clean, dual-axis line charts for Burn Rate (USD) and Cash Runway (months) history.

#### [NEW] [data.js](file:///Users/sasi/antigravity/multi%20agent%20rag/dashboard/data.js)
Static JS module containing 5 pre-populated audit history datasets with 6-12 months of trend data points:
1. **AlphaTech Robotics**: Initially Non-Compliant (Debt violation of $495k under default limits, convertible notes, burn rate $120k, runway 14m).
2. **CloudScale Systems**: Initially Compliant (Debt $1.2M, burn rate $150k, runway 8m, zero lawsuits).
3. **HealthPulse AI**: Initially Non-Compliant (Active pending litigation / lawsuit check failure).
4. **GreenGrid Power**: Initially Compliant (Debt $2.1M, burn rate $90k, runway 18m).
5. **FinFlow Tech**: Initially Non-Compliant (Runway check failure: only 4 months runway left, burn rate $250k).

#### [NEW] [audit_reports.json](file:///Users/sasi/antigravity/multi%20agent%20rag/dashboard/audit_reports.json)
JSON equivalent of the seed dataset to act as the REST api response when served via http.

### [root]

#### [NEW] [server.py](file:///Users/sasi/antigravity/multi%20agent%20rag/server.py)
A lightweight python script using the built-in `http.server` to serve the `dashboard/` directory on port `8000` with proper MIME headers:
```python
import http.server
import socketserver
import os

PORT = 8000
DIRECTORY = "dashboard"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == "__main__":
    print(f"[*] Serving M&A Audit Dashboard on http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()
```

## Verification Plan

### Automated Tests
- Since it is a client-side layout with mock data, we will perform a self-contained health validation script or rely on manual validation in browser.

### Manual Verification
1. Open the dashboard by double-clicking `dashboard/index.html` (verifying `file://` compatibility).
2. Start the local server by running `python server.py` and navigate to `http://localhost:8000`.
3. Search for "AlphaTech" and verify only AlphaTech Robotics is shown.
4. Click the "Compliant" filter and verify only compliant targets are shown.
5. Select "FinFlow Tech" and verify that its cash runway of 4 months is marked as a risk (since default policy minimum runway is 6 months).
6. Adjust the "Min Runway Limit" slider down to 3 months. Verify that "FinFlow Tech" dynamically changes to "Compliant" and the risk message disappears.
7. Click "Reset Policy Defaults" and verify sliders and statuses return to their initial state.
