function initFoundedValuationScatter(canvasId) {
  const RAW_DATA = [
    { x: 1972, y: 215.0,  label: "SAP" },
    { x: 1975, y: 3000.0, label: "Microsoft" },
    { x: 1977, y: 350.0,  label: "Oracle" },
    { x: 1982, y: 240.0,  label: "Adobe" },
    { x: 1983, y: 180.0,  label: "Intuit" },
    { x: 1999, y: 227.8,  label: "Salesforce" },
    { x: 2001, y: 8.0,    label: "Five9" },
    { x: 2002, y: 55.0,   label: "Atlassian" },
    { x: 2002, y: 9.0,    label: "Procore" },
    { x: 2003, y: 10.0,   label: "DocuSign" },
    { x: 2003, y: 52.0,   label: "Palantir" },
    { x: 2003, y: 5.0,    label: "RingCentral" },
    { x: 2004, y: 147.0,  label: "ServiceNow" },
    { x: 2004, y: 1.5,    label: "Vimeo" },
    { x: 2005, y: 65.0,   label: "Workday" },
    { x: 2005, y: 3.5,    label: "Box" },
    { x: 2005, y: 7.0,    label: "UiPath" },
    { x: 2005, y: 95.0,   label: "Palo Alto Networks" },
    { x: 2005, y: 7.5,    label: "Automattic" },
    { x: 2006, y: 95.0,   label: "Shopify" },
    { x: 2006, y: 32.0,   label: "HubSpot" },
    { x: 2006, y: 9.0,    label: "Bill.com" },
    { x: 2006, y: 10.0,   label: "Wix" },
    { x: 2007, y: 26.0,   label: "MongoDB" },
    { x: 2007, y: 13.2,   label: "Zendesk" },
    { x: 2007, y: 35.0,   label: "Veeva Systems" },
    { x: 2007, y: 12.0,   label: "Zoom Info" },
    { x: 2007, y: 9.5,    label: "Tanium" },
    { x: 2008, y: 12.0,   label: "Twilio" },
    { x: 2008, y: 5.5,    label: "Asana" },
    { x: 2008, y: 8.5,    label: "Dropbox" },
    { x: 2008, y: 6.5,    label: "New Relic" },
    { x: 2008, y: 30.0,   label: "Zscaler" },
    { x: 2008, y: 5.7,    label: "JFrog" },
    { x: 2009, y: 25.0,   label: "Okta" },
    { x: 2009, y: 85.0,   label: "Square" },
    { x: 2009, y: 2.8,    label: "PagerDuty" },
    { x: 2009, y: 28.0,   label: "Cloudflare" },
    { x: 2009, y: 13.0,   label: "Grammarly" },
    { x: 2009, y: 1.1,    label: "Mixpanel" },
    { x: 2010, y: 44.0,   label: "Datadog" },
    { x: 2010, y: 65.0,   label: "Stripe" },
    { x: 2010, y: 5.2,    label: "Freshworks" },
    { x: 2010, y: 2.3,    label: "Sumo Logic" },
    { x: 2010, y: 4.3,    label: "Marqeta" },
    { x: 2011, y: 85.0,   label: "Zoom" },
    { x: 2011, y: 8.0,    label: "GitLab" },
    { x: 2011, y: 17.5,   label: "Miro" },
    { x: 2011, y: 1.3,    label: "Intercom" },
    { x: 2011, y: 70.0,   label: "CrowdStrike" },
    { x: 2011, y: 20.0,   label: "Toast" },
    { x: 2011, y: 2.3,    label: "Salesloft" },
    { x: 2011, y: 5.6,    label: "Braze" },
    { x: 2011, y: 9.5,    label: "Gusto" },
    { x: 2011, y: 13.0,   label: "Celonis" },
    { x: 2011, y: 2.0,    label: "Redis" },
    { x: 2011, y: 1.7,    label: "CircleCI" },
    { x: 2012, y: 75.0,   label: "Snowflake" },
    { x: 2012, y: 14.0,   label: "Monday.com" },
    { x: 2012, y: 11.0,   label: "Airtable" },
    { x: 2012, y: 9.5,    label: "Klaviyo" },
    { x: 2012, y: 13.0,   label: "HashiCorp" },
    { x: 2012, y: 8.0,    label: "Elastic" },
    { x: 2012, y: 4.0,    label: "Amplitude" },
    { x: 2012, y: 7.4,    label: "Carta" },
    { x: 2012, y: 12.0,   label: "Affirm" },
    { x: 2012, y: 6.1,    label: "Benchling" },
    { x: 2012, y: 2.3,    label: "Algolia" },
    { x: 2012, y: 7.5,    label: "Netskope" },
    { x: 2012, y: 9.5,    label: "ServiceTitan" },
    { x: 2013, y: 10.0,   label: "Notion" },
    { x: 2013, y: 40.0,   label: "Canva" },
    { x: 2013, y: 43.0,   label: "Databricks" },
    { x: 2013, y: 3.0,    label: "Calendly" },
    { x: 2013, y: 13.4,   label: "Plaid" },
    { x: 2014, y: 9.1,    label: "Confluent" },
    { x: 2014, y: 4.4,    label: "Outreach" },
    { x: 2014, y: 3.0,    label: "LaunchDarkly" },
    { x: 2014, y: 6.0,    label: "Rubrik" },
    { x: 2015, y: 7.3,    label: "Gong" },
    { x: 2015, y: 9.2,    label: "Navan" },
    { x: 2015, y: 12.0,   label: "Samsara" },
    { x: 2015, y: 7.4,    label: "Snyk" },
    { x: 2016, y: 13.5,   label: "Rippling" },
    { x: 2016, y: 3.2,    label: "Verkada" },
    { x: 2016, y: 5.3,    label: "OneTrust" },
    { x: 2017, y: 12.3,   label: "Brex" },
    { x: 2019, y: 8.1,    label: "Ramp" }
  ];

  // Drop any points that would break a log scale (y must be > 0)
  const DATA = RAW_DATA
    .filter(d => d.y != null && isFinite(d.y) && d.y > 0)
    .map(d => ({
      // Add a small deterministic x-jitter per company to separate dots stacked
      // on the same founding year. Jitter is ±0.35 based on label character sum
      // so it stays stable across renders (not random each load).
      x: d.x + (charSum(d.label) % 7 - 3) * 0.1,
      y: d.y,
      label: d.label,
      year: d.x   // preserve original year for tooltip
    }));

  // Simple deterministic jitter: sum of char codes mod N
  function charSum(str) {
    return str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  }

  // Log-scale tick values we want labeled
  const LOG_TICKS = [1, 10, 100, 1000, 10000];

  return new Chart(document.getElementById(canvasId), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'SaaS Companies',
        data: DATA,
        backgroundColor: 'rgba(54, 162, 235, 0.65)',
        borderColor: 'rgba(54, 162, 235, 0.9)',
        borderWidth: 1,
        pointRadius: 6,
        pointHoverRadius: 9
      }]
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        title: {
          display: true,
          text: 'Founded Year vs. Valuation — Top 100 SaaS Companies',
          font: { size: 15, weight: 'bold' },
          padding: { bottom: 16 }
        },
        legend: { display: false },  // redundant with the title
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const pt = ctx.raw;
              const valuation = pt.y >= 1000
                ? `$${(pt.y / 1000).toFixed(1)}T`
                : `$${pt.y}B`;
              return `${pt.label} — ${valuation} (founded ${pt.year})`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Founded Year' },
          min: 1969,
          max: 2021,
          ticks: {
            stepSize: 5,
            // Only label clean 5-year multiples; skip jitter-fractional ticks
            callback: function(value) {
              return Number.isInteger(value) && value % 5 === 0 ? value : '';
            }
          },
          grid: { color: 'rgba(0,0,0,0.06)' }
        },
        y: {
          type: 'logarithmic',
          min: 1,
          max: 10000,
          title: { display: true, text: 'Valuation (USD Billions, log scale)' },
          ticks: {
            callback: function(value) {
              // Floating-point safe: check if value rounds to a labeled tick
              const match = LOG_TICKS.find(t => Math.abs(value - t) / t < 0.01);
              if (!match) return '';
              if (match >= 1000) return '$' + (match / 1000) + 'T';
              return '$' + match + 'B';
            }
          },
          grid: { color: 'rgba(0,0,0,0.06)' }
        }
      }
    }
  });
}
