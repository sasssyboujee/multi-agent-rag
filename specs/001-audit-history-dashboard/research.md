# Technical Research: M&A Audit History Dashboard

## Dynamic Auditing Logic

To perform client-side policy evaluation in real-time, the frontend auditor must replicate the logic of the python M&A orchestrator.

The default corporate buying policies defined in `buyer_policies.txt` are:
1. **Max Debt**: $3,000,000
2. **Min Runway**: 6 months
3. **Max Burn Rate**: $200,000
4. **Legal**: Zero active lawsuits or litigation (`hasLawsuits = false`)

### Recalculation Formulas

Whenever a policy slider is adjusted, the frontend will execute the following evaluation for each target company $i$:

$$DebtViolation_i = TotalDebt_i > MaxDebt_{slider}$$
$$RunwayViolation_i = Runway_i < MinRunway_{slider}$$
$$BurnRateViolation_i = BurnRate_i > MaxBurnRate_{slider}$$
$$LawsuitViolation_i = HasLawsuits_i == true$$

$$Compliant_i = \neg (DebtViolation_i \lor RunwayViolation_i \lor BurnRateViolation_i \lor LawsuitViolation_i)$$

The user interface will instantly regenerate the risk reasons based on active violations:
- If $DebtViolation_i$ is true: *"Outstanding debt of $X exceeds policy limit of $Y"*
- If $RunwayViolation_i$ is true: *"Cash runway of X months is below policy limit of Y months"*
- If $BurnRateViolation_i$ is true: *"Monthly burn rate of $X exceeds policy limit of $Y"*
- If $LawsuitViolation_i$ is true: *"Target has active pending litigation"*

## Charting Library Integration

We will use Chart.js via CDN. Chart.js is loaded asynchronously.
To support a high-fidelity visual layout, the chart will feature:
- Two lines on a single canvas: Cash Runway (plotted on the left Y-axis in months) and Monthly Burn Rate (plotted on the right Y-axis in USD).
- Hover tooltips showing formatted currencies and durations.
- Smooth bezier curve smoothing (`tension: 0.4`).
- Premium aesthetic matching the dark mode layout (indigo/emerald line colors, translucent gridlines, and Outfit/Inter fonts).

### Chart.js Configuration Example

```javascript
const ctx = document.getElementById('trendChart').getContext('2d');
const trendChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: company.historicalData.months,
        datasets: [
            {
                label: 'Runway (months)',
                data: company.historicalData.runwayHistory,
                borderColor: '#10b981',
                yAxisID: 'yRunway',
                tension: 0.4
            },
            {
                label: 'Burn Rate ($)',
                data: company.historicalData.burnRateHistory,
                borderColor: '#6366f1',
                yAxisID: 'yBurn',
                tension: 0.4
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#9ca3af' } }
        },
        scales: {
            yRunway: { type: 'linear', position: 'left' },
            yBurn: { type: 'linear', position: 'right' }
        }
    }
});
```
