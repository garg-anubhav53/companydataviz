function initInvestorBar(canvasId) {
  const LABELS = [
    "Sequoia", "Accel", "Bessemer", "Andreessen Horowitz", "NEA",
    "Benchmark", "ICONIQ", "Greylock", "IVP", "Lightspeed",
    "Kleiner Perkins", "Founders Fund", "Tiger Global", "Insight", "General Catalyst",
  ];

  const COUNTS = [18, 13, 11, 10, 8, 7, 6, 6, 6, 6, 5, 5, 5, 4, 3];

  const COMPANIES = [
    "Snowflake, Notion, MongoDB, Stripe, Square, Canva, Dropbox, UiPath, Confluent, Amplitude, Mixpanel, Palo Alto Networks, RingCentral, Qualtrics, Gong, Verkada, Netskope, ServiceTitan",
    "DocuSign, Slack, Dropbox, Freshworks, Klaviyo, UiPath, Miro, Segment, Sumo Logic, CrowdStrike, Qualtrics, Algolia, Snyk",
    "Shopify, Twilio, Canva, Box, PagerDuty, SendGrid, Intercom, Auth0, Wix, LaunchDarkly, Procore",
    "Slack, Okta, Stripe, Databricks, PagerDuty, Mixpanel, Carta, Navan, Samsara, Tanium",
    "Workday, MongoDB, Box, Databricks, Elastic, Cloudflare, Braze, Plaid",
    "Asana, Airtable, Zendesk, Confluent, Elastic, New Relic, Wix",
    "Snowflake, Datadog, GitLab, Miro, Calendly, Marqeta",
    "Okta, Figma, Sumo Logic, Palo Alto Networks, Rubrik, AppDynamics",
    "UiPath, HashiCorp, Grammarly, Amplitude, Tanium, CircleCI",
    "Zscaler, Carta, Affirm, Netskope, Rubrik, AppDynamics",
    "Intuit, DocuSign, Intercom, Segment, Looker",
    "Palantir, Asana, Rippling, Affirm, Ramp",
    "Toast, Redis, Snyk, ServiceTitan, Procore",
    "Monday.com, Qualtrics, OneTrust, Automattic",
    "HubSpot, Grammarly, Gusto",
  ];

  // Wraps a comma-separated company string into lines of at most `maxLen` chars.
  function wrapCompanies(str, maxLen) {
    const words = str.split(', ');
    const lines = [];
    let line = '';
    for (const word of words) {
      if (line.length > 0 && (line + word).length > maxLen) {
        lines.push(line.replace(/,\s*$/, ''));
        line = '';
      }
      line += word + ', ';
    }
    if (line.length > 0) lines.push(line.replace(/,\s*$/, ''));
    return lines;
  }

  return new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: LABELS,
      datasets: [{
        label: 'Portfolio Companies',
        data: COUNTS,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Most Frequent Investors Across Top 100 SaaS Companies',
          font: { size: 15, weight: 'bold' },
          padding: { bottom: 16 },
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterBody(tooltipItems) {
              const idx = tooltipItems[0].dataIndex;
              return ['\nPortfolio:', ...wrapCompanies(COMPANIES[idx], 60)];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: 'Number of Companies' },
          ticks: { stepSize: 2 },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
        y: {
          grid: { display: false },
        },
      },
    },
  });
}
