# Data Verification — SQL & Expected Output

SQL queries and expected table output for each of the three visualizations. Assumes a `companies` table and a `company_investors` join table as described below.

---

## Assumed Schema

```sql
companies (
  name              TEXT,
  founded_year      INT,
  industry          TEXT,
  valuation_billions NUMERIC   -- NULL for 12 companies with no data
)

company_investors (
  company_name  TEXT,
  investor_name TEXT
)
```

---

## 1. Pie Chart — Industry Breakdown

The chart buckets 100 companies into the top 5 industries plus an "Other" catch-all. The SQL below replicates that bucketing logic.

```sql
SELECT
  CASE
    WHEN industry = 'Work Management'    THEN 'Work Management'
    WHEN industry = 'Enterprise Software' THEN 'Enterprise Software'
    WHEN industry = 'Database'           THEN 'Database'
    WHEN industry = 'Communications'     THEN 'Communications'
    WHEN industry = 'Payments'           THEN 'Payments'
    ELSE 'Other'
  END                                          AS segment,
  COUNT(*)                                     AS company_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS pct_of_total
FROM companies
GROUP BY segment
ORDER BY company_count DESC;
```

**Expected output:**

| segment              | company_count | pct_of_total |
|----------------------|---------------|--------------|
| Other                | 89            | 89.00%       |
| Work Management      | 3             | 3.00%        |
| Enterprise Software  | 2             | 2.00%        |
| Database             | 2             | 2.00%        |
| Communications       | 2             | 2.00%        |
| Payments             | 2             | 2.00%        |
| **Total**            | **100**       | **100.00%**  |

> Note: The 85 unique industries in the raw data collapse to 6 display segments. "Other" dominates because the distribution is extremely flat — no single industry exceeds 3 companies.

---

## 2. Scatter Chart — Founded Year vs. Valuation

88 of 100 companies have valuation data. 12 are excluded (NULL valuation).

```sql
SELECT
  name,
  founded_year,
  valuation_billions,
  CASE
    WHEN valuation_billions >= 1000 THEN ROUND(valuation_billions / 1000.0, 1) || 'T'
    ELSE valuation_billions || 'B'
  END AS valuation_display
FROM companies
WHERE valuation_billions IS NOT NULL
ORDER BY valuation_billions DESC;
```

**Expected output** (88 rows, sorted highest to lowest valuation):

| name                | founded_year | valuation_billions | valuation_display |
|---------------------|--------------|--------------------|-------------------|
| Microsoft           | 1975         | 3000.0             | 3.0T              |
| Oracle              | 1977         | 350.0              | 350.0B            |
| Adobe               | 1982         | 240.0              | 240.0B            |
| Salesforce          | 1999         | 227.8              | 227.8B            |
| SAP                 | 1972         | 215.0              | 215.0B            |
| Intuit              | 1983         | 180.0              | 180.0B            |
| ServiceNow          | 2004         | 147.0              | 147.0B            |
| Palo Alto Networks  | 2005         | 95.0               | 95.0B             |
| Shopify             | 2006         | 95.0               | 95.0B             |
| Zoom                | 2011         | 85.0               | 85.0B             |
| Square              | 2009         | 85.0               | 85.0B             |
| CrowdStrike         | 2011         | 70.0               | 70.0B             |
| Workday             | 2005         | 65.0               | 65.0B             |
| Stripe              | 2010         | 65.0               | 65.0B             |
| Atlassian           | 2002         | 55.0               | 55.0B             |
| Palantir            | 2003         | 52.0               | 52.0B             |
| Datadog             | 2010         | 44.0               | 44.0B             |
| Databricks          | 2013         | 43.0               | 43.0B             |
| Canva               | 2013         | 40.0               | 40.0B             |
| Veeva Systems       | 2007         | 35.0               | 35.0B             |
| HubSpot             | 2006         | 32.0               | 32.0B             |
| Zscaler             | 2008         | 30.0               | 30.0B             |
| Cloudflare          | 2009         | 28.0               | 27.0B             |
| MongoDB             | 2007         | 26.0               | 26.0B             |
| Okta                | 2009         | 25.0               | 25.0B             |
| Twilio              | 2008         | 12.0               | 12.0B             |
| Snowflake           | 2012         | 75.0               | 75.0B             |
| Monday.com          | 2012         | 14.0               | 14.0B             |
| Notion              | 2013         | 10.0               | 10.0B             |
| Rippling            | 2016         | 13.5               | 13.5B             |
| Brex                | 2017         | 12.3               | 12.3B             |
| Ramp                | 2019         | 8.1                | 8.1B              |
| Mixpanel            | 2009         | 1.1                | 1.1B              |
| *(... 55 more rows)* | | | |

> The chart uses a **logarithmic Y-axis** because the valuation range spans $1.1B (Mixpanel) to $3,000B (Microsoft) — a 2,700x spread. On a linear scale, 80% of dots would collapse into the bottom 3% of the chart.

---

## 3. Bar Chart — Most Frequent Investors

```sql
SELECT
  ci.investor_name,
  COUNT(DISTINCT ci.company_name)                              AS portfolio_count,
  STRING_AGG(ci.company_name, ', ' ORDER BY ci.company_name)  AS portfolio_companies
FROM company_investors ci
GROUP BY ci.investor_name
ORDER BY portfolio_count DESC
LIMIT 15;
```

**Expected output:**

| investor_name         | portfolio_count | portfolio_companies (truncated)                              |
|-----------------------|-----------------|--------------------------------------------------------------|
| Sequoia               | 18              | Amplitude, Canva, Confluent, Dropbox, Gong, MongoDB, ...     |
| Accel                 | 13              | Algolia, CrowdStrike, DocuSign, Dropbox, Freshworks, ...     |
| Bessemer              | 11              | Box, Canva, Intercom, LaunchDarkly, PagerDuty, Procore, ...  |
| Andreessen Horowitz   | 10              | Carta, Databricks, Mixpanel, Navan, Okta, PagerDuty, ...     |
| NEA                   | 8               | Box, Braze, Cloudflare, Databricks, Elastic, MongoDB, ...    |
| Benchmark             | 7               | Airtable, Asana, Confluent, Elastic, New Relic, Wix, ...     |
| ICONIQ                | 6               | Calendly, Datadog, GitLab, Marqeta, Miro, Snowflake          |
| Greylock              | 6               | AppDynamics, Okta, Palo Alto Networks, Rubrik, ...           |
| IVP                   | 6               | Amplitude, CircleCI, Grammarly, HashiCorp, Tanium, UiPath    |
| Lightspeed            | 6               | Affirm, AppDynamics, Carta, Netskope, Rubrik, Zscaler        |
| Kleiner Perkins       | 5               | DocuSign, Intuit, Intercom, Looker, Segment                  |
| Founders Fund         | 5               | Affirm, Asana, Palantir, Ramp, Rippling                      |
| Tiger Global          | 5               | Procore, Redis, ServiceTitan, Snyk, Toast                    |
| Insight               | 4               | Automattic, Monday.com, OneTrust, Qualtrics                  |
| General Catalyst      | 3               | Grammarly, Gusto, HubSpot                                    |

> `STRING_AGG` syntax is PostgreSQL/BigQuery. Use `GROUP_CONCAT` for SQLite/MySQL, or `LISTAGG` for Redshift/Oracle.
