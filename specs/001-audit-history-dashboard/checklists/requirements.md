# Requirements Checklist: M&A Audit History Dashboard

**Purpose**: Verify implementation completeness and quality of the M&A Audit History Dashboard.
**Created**: 2026-06-18
**Feature**: [spec.md](../spec.md)

**Note**: This checklist is generated based on feature context and requirements.

## User Interface & Core Search/Filtering

- [ ] CHK001 UI structure displays a sidebar with the target company list and search/filter inputs, and a main content area for detail view.
- [ ] CHK002 Search input filters the list of target companies by name (case-insensitive substring matching).
- [ ] CHK003 Filter controls filter the list by compliance status (All, Compliant, Non-Compliant).
- [ ] CHK004 Selecting a company updates the detail panel to show company name, audit date, simulated compliance badge, and current financial values.
- [ ] CHK005 Detail panel displays a bulleted list of identified risks/violations when a company is non-compliant.

## Financial Trend Visualization

- [ ] CHK006 Line or bar charts render historical cash runway (in months) over time.
- [ ] CHK007 Line or bar charts render monthly burn rate trends over time.
- [ ] CHK008 Tooltips or data labels appear on hover to show exact values for each trend point.
- [ ] CHK009 Visual charts scale gracefully and handle varying ranges of data without rendering issues.

## Interactive Policy Simulation

- [ ] CHK010 Sliders are implemented for Max Debt Limit, Min Runway Limit, and Max Burn Rate Limit.
- [ ] CHK011 Sliders display their current values clearly in USD or months.
- [ ] CHK012 Adjusting any slider triggers dynamic recalculation of compliance status for all loaded companies instantly.
- [ ] CHK013 The company list and details panel immediately reflect compliance badge updates based on recalculated status.
- [ ] CHK014 A "Reset Policy Defaults" button restores sliders to defaults (Max Debt: $3M, Min Runway: 6 months, Max Burn: $200k) and updates status accordingly.

## Data & Robustness

- [ ] CHK015 A default seed dataset of at least 5 companies is loaded, covering various scenarios (e.g. initially compliant, debt violations, runway violations, burn-rate violations, pending lawsuits).
- [ ] CHK016 No-search-results state displays a clean, user-friendly message rather than a blank list.
- [ ] CHK017 No-company-selected state displays a placeholder message guiding the user to select a company.
- [ ] CHK018 Performance check: UI updates (filtering, search, slider recalculation) execute smoothly without lag.

## Notes

- Check items off as completed: `[x]`
- Add comments or findings inline
- Items are numbered sequentially for easy reference
