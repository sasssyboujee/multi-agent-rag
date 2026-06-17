# Feature Specification: M&A Audit History Dashboard

**Feature Branch**: `001-audit-history-dashboard`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "I want to build an interactive dashboard that visualizes our M&A audit report history, letting users search past target companies, filter by compliance status, and view historical runway/burn-rate trends."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Audit History Search and Filtering (Priority: P1)

Users want to view a comprehensive list of all past M&A audits, search for specific target companies by name, and filter them based on their compliance status (Compliant, Non-Compliant, or All).

**Why this priority**: This is the core MVP functionality that allows users to find and access historical records of M&A evaluations.

**Independent Test**: The search and filter controls can be tested on a pre-populated dataset of mock target companies. The user can verify that the list updates correctly when typing a query or changing compliance filters.

**Acceptance Scenarios**:

1. **Given** the dashboard is loaded with audit records for "AlphaTech Robotics", "BetaSoftware", and "Gamma Energy", **When** the user types "tech" in the search box, **Then** only "AlphaTech Robotics" is displayed in the list.
2. **Given** the list contains 3 compliant and 2 non-compliant companies, **When** the user selects the "Non-Compliant" status filter, **Then** only the 2 non-compliant companies are listed.
3. **Given** a search or filter is active, **When** the user clicks "Reset Filters", **Then** the search input is cleared, status filter is reset to "All", and all original records are displayed.

---

### User Story 2 - Detail View and Historical Trend Charts (Priority: P1)

Users want to select a target company from the list to view its full compliance detail (compliance status, identified risks/violations) and see its historical financial metrics (cash runway and monthly burn rate) plotted over time on a visual chart.

**Why this priority**: Essential for understanding *why* a target company passed or failed compliance and analyzing its financial health trends (runway vs. burn rate) to support decision making.

**Independent Test**: Selecting a company row/card opens the detail section, loads its full risk breakdown, and renders the corresponding line charts for runway and burn rate.

**Acceptance Scenarios**:

1. **Given** the company list is loaded, **When** the user clicks on "AlphaTech Robotics", **Then** a detail panel opens showing its status (Non-Compliant), list of identified risks (e.g. "Outstanding Convertible Notes of $450,000 exceeds maximum debt limit of $3,000,000 under simulated limits" or "Active lawsuit pending"), and current runway/burn-rate stats.
2. **Given** the detail panel is open, **When** the user views the financial trends chart, **Then** they see a dual-axis or split chart displaying monthly burn rate and runway projections over a historical sequence.

---

### User Story 3 - Interactive Policy Simulation Slider (Priority: P2)

Users want to interactively adjust the corporate M&A buying policy limits (maximum debt ceiling, minimum runway months, and maximum monthly burn rate) using sliders on the dashboard and see the compliance status of all historical target companies re-evaluate dynamically.

**Why this priority**: Enables M&A strategists to simulate "what-if" scenarios (e.g., "what if we reduce our maximum burn rate limit to $150,000? Which past targets would have failed?") and assess overall portfolio risk sensitivity.

**Independent Test**: Dragging a slider re-calculates compliance criteria in real-time, changing status badges (Compliant/Non-Compliant) on the fly without refreshing the page.

**Acceptance Scenarios**:

1. **Given** a target company "BetaSoftware" is compliant under default policy (monthly burn rate of $120,000, maximum burn limit is $200,000), **When** the user drags the "Max Burn Rate Limit" slider down to $100,000, **Then** "BetaSoftware" is dynamically re-marked as "Non-Compliant" in the list and details.
2. **Given** the user has modified policy limits using sliders, **When** the user clicks "Reset Policy Defaults", **Then** all sliders return to corporate policy defaults (Max Debt: $3M, Min Runway: 6 months, Max Burn: $200k) and all company compliance statuses update to their original values.

---

### Edge Cases

- **No Results Found**: What happens when the user enters a search query that matches no target companies? The dashboard MUST display a friendly "No companies match your search criteria" message instead of a blank or broken state.
- **Empty Detail State**: How does the system handle the initial load before any company is selected? The dashboard should display a placeholder instruction (e.g., "Select a company from the list to view detailed audit reports and financial trends") in the detail panel.
- **Zero or Negative Financials**: How does the chart handle companies with $0 burn rate or negative runway? The chart must scale gracefully and handle exceptions without throwing runtime errors or rendering broken visuals.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display a searchable and filterable list of all past M&A target company audits.
- **FR-002**: The system MUST allow case-insensitive search by company name.
- **FR-003**: The system MUST allow filtering targets by compliance status (All, Compliant, Non-Compliant).
- **FR-004**: The system MUST show a detail view for a selected company, including name, overall compliance status, a list of identified risk reasons, and current financial values.
- **FR-005**: The system MUST render interactive visual charts depicting historical cash runway and monthly burn rate trends for the selected target.
- **FR-006**: The system MUST provide interactive policy limit adjustments (sliders/inputs) for:
  - Maximum Debt (range: $100,000 to $10,000,000)
  - Minimum Cash Runway (range: 1 to 24 months)
  - Maximum Monthly Burn Rate (range: $10,000 to $500,000)
- **FR-007**: The system MUST dynamically recalculate and update the compliance status of all companies instantly when policy limit values change.
- **FR-008**: The system MUST load its initial data from a mock database or JSON structure representing historical audit records.

### Key Entities *(include if feature involves data)*

- **AuditReport**: Represents the historical record of an M&A audit run.
  - `id`: Unique identifier (string/number)
  - `companyName`: Name of the target company (string)
  - `auditDate`: Date the audit was run (date string)
  - `compliant`: Calculated compliance status (boolean)
  - `risks`: Specific compliance or financial violation explanations (list of strings)
  - `currentFinancials`: The company's financial snapshot at the time of audit:
    - `burnRate`: Monthly burn rate in USD (number)
    - `runway`: Remaining cash runway in months (number)
    - `totalDebt`: Outstanding debt or liabilities in USD (number)
    - `hasLawsuits`: Whether the company has active litigation (boolean)
  - `historicalData`: Trend data points for rendering charts:
    - `months`: List of month labels (e.g., ["Jan", "Feb", "Mar", ...])
    - `burnRateHistory`: List of burn rates over those months (numbers)
    - `runwayHistory`: List of runways over those months (numbers)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Instant Search & Filter: Filtering or searching the target list must render updates in the UI in under 100ms.
- **SC-002**: Dynamic Recalculation: Adjusting policy sliders must update the compliance badges of all listed companies within 150ms.
- **SC-003**: High-Fidelity Visualization: The historical trend charts must accurately display up to 12 months of runway and burn-rate data points.
- **SC-004**: Zero-Config Mock Data: The system must load a default set of at least 5 distinct target companies (e.g., AlphaTech Robotics, CloudScale Systems, HealthPulse AI, GreenGrid Power, FinFlow) representing various compliance profiles and financial patterns.

## Assumptions

- The dashboard is a client-side application designed to run in modern web browsers (Chrome, Safari, Firefox).
- All calculations for the policy simulation can be performed dynamically client-side on the loaded dataset.
- Real-time communication with the live Gemini API is not required for the basic dashboard interaction; it can run on mock data seeded from previous session state files (`startup_finances.txt`, `buyer_policies.txt`, etc.).
