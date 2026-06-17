# Data Model: M&A Audit History Dashboard

## JSON Schema Structure

The database `audit_reports.json` contains an array of `AuditReport` objects. Below is the JSON Schema definition:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AuditReportsDatabase",
  "type": "array",
  "items": {
    "$ref": "#/definitions/AuditReport"
  },
  "definitions": {
    "AuditReport": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "companyName": { "type": "string" },
        "auditDate": { "type": "string", "format": "date" },
        "currentFinancials": {
          "type": "object",
          "properties": {
            "burnRate": { "type": "number", "minimum": 0 },
            "runway": { "type": "number", "minimum": 0 },
            "totalDebt": { "type": "number", "minimum": 0 },
            "hasLawsuits": { "type": "boolean" }
          },
          "required": ["burnRate", "runway", "totalDebt", "hasLawsuits"]
        },
        "historicalData": {
          "type": "object",
          "properties": {
            "months": {
              "type": "array",
              "items": { "type": "string" }
            },
            "burnRateHistory": {
              "type": "array",
              "items": { "type": "number" }
            },
            "runwayHistory": {
              "type": "array",
              "items": { "type": "number" }
            }
          },
          "required": ["months", "burnRateHistory", "runwayHistory"]
        }
      },
      "required": ["id", "companyName", "auditDate", "currentFinancials", "historicalData"]
    }
  }
}
```

## Seed Data Records (Default Values)

1. **AlphaTech Robotics**
   - Debt: $495,000
   - Burn Rate: $120,000/mo
   - Runway: 14 months
   - Lawsuits: false
   - *Status*: Non-Compliant (Violates Debt limit of $300k under initial policy, but compliant under default $3M limit. Let's seed it with $3.2M debt so it violates the default limit).

2. **CloudScale Systems**
   - Debt: $1,200,000
   - Burn Rate: $150,000/mo
   - Runway: 8 months
   - Lawsuits: false
   - *Status*: Compliant (All metrics within default rules).

3. **HealthPulse AI**
   - Debt: $850,000
   - Burn Rate: $180,000/mo
   - Runway: 10 months
   - Lawsuits: true
   - *Status*: Non-Compliant (Pending lawsuit violation).

4. **GreenGrid Power**
   - Debt: $2,100,000
   - Burn Rate: $90,000/mo
   - Runway: 18 months
   - Lawsuits: false
   - *Status*: Compliant (All metrics within default rules).

5. **FinFlow Tech**
   - Debt: $450,000
   - Burn Rate: $250,000/mo (Violates Max Burn Rate of $200k)
   - Runway: 4 months (Violates Min Runway of 6 months)
   - Lawsuits: false
   - *Status*: Non-Compliant (Runway and Burn rate violations).
