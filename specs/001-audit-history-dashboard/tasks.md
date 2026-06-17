# Tasks: M&A Audit History Dashboard

**Input**: Design documents from `specs/001-audit-history-dashboard/`

**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required for user stories), [research.md](research.md), [data-model.md](data-model.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Contains exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create dashboard directory: `dashboard/`
- [x] T002 Configure mock database files: `dashboard/audit_reports.json`
- [x] T003 [P] Create static JS fallback file: `dashboard/data.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create root lightweight server script: `server.py`
- [x] T005 [P] Setup HTML framework structure: `dashboard/index.html`
- [x] T006 [P] Initialize Vanilla CSS custom properties and baseline layouts: `dashboard/style.css`
- [x] T007 Initialize frontend app core logic and data loading strategy: `dashboard/app.js`

**Checkpoint**: Foundation ready - local server serves the basic page and loads seed datasets cleanly.

---

## Phase 3: User Story 1 - Search and Filtering (Priority: P1) 🎯 MVP

**Goal**: Allow searching target companies by name and filtering by compliance status.

**Independent Test**: Loading page with mock records, verifying that typing "Alpha" filters to AlphaTech Robotics and selecting "Non-Compliant" shows only non-compliant targets.

### Implementation for User Story 1

- [x] T008 [US1] Build reactive company list container in HTML/CSS: `dashboard/index.html` and `dashboard/style.css`
- [x] T009 [US1] Implement search input filtering in `dashboard/app.js`
- [x] T010 [US1] Implement compliance status selection pill filters in `dashboard/app.js`
- [x] T011 [US1] Add empty search result placeholder state inside list view

**Checkpoint**: User Story 1 is functional. Users can search and filter the company audit cards.

---

## Phase 4: User Story 2 - Detail View and Historical Charts (Priority: P1)

**Goal**: View compliance details/identified risks and trend charts of runway and burn-rate.

**Independent Test**: Selecting a company card displays its current financial metrics, lawsuit status, risk breakdown, and plots a dual-axis trend chart.

### Implementation for User Story 2

- [x] T012 [P] [US2] Design detail view layout and placeholders in HTML/CSS: `dashboard/index.html` and `dashboard/style.css`
- [x] T013 [US2] Import Chart.js library via CDN in `dashboard/index.html`
- [x] T014 [US2] Implement company selection event handler in `dashboard/app.js` to populate textual details
- [x] T015 [US2] Implement dynamic risk list generator in `dashboard/app.js`
- [x] T016 [US2] Create and render dual-axis line chart (Runway vs. Burn Rate) in `dashboard/app.js`

**Checkpoint**: User Story 2 is functional. Selecting a company renders its detailed risks and loads its financial trend chart.

---

## Phase 5: User Story 3 - Interactive Policy Simulation (Priority: P2)

**Goal**: Add sliders to adjust policies and dynamically re-calculate compliance status in the UI.

**Independent Test**: Move the minimum runway slider to 3 months and verify "FinFlow Tech" automatically updates to "Compliant" and its runway risk reason is cleared.

### Implementation for User Story 3

- [x] T017 [US3] Add policy sliders container (Debt, Runway, Burn Rate) in HTML/CSS: `dashboard/index.html` and `dashboard/style.css`
- [x] T018 [US3] Implement dynamic compliance auditor calculation function in `dashboard/app.js`
- [x] T019 [US3] Bind slider change event listeners to trigger re-evaluation of target compliance statuses and update badges
- [x] T020 [US3] Implement "Reset Policy Defaults" handler to restore sliders to corporate defaults and refresh compliance state

**Checkpoint**: User Story 3 is functional. Compliance recalculation runs fully in-browser dynamically.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: High-fidelity visual excellence and validation

- [x] T021 Apply premium glassmorphism styles and transitions (hover animations, dark modes) in `dashboard/style.css`
- [x] T022 Implement initial empty instruction state when no company is selected
- [x] T023 Run verification plan: test file:// loading and server.py execution
- [x] T024 Perform final manual verification and performance check
