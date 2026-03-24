// Strips currency formatting and acquirer notes, returns a float in billions.
// Examples: "$3T" → 3000, "$400M" → 0.4, "$27.7B (Salesforce)" → 27.7
// Returns null for N/A, blank, or unparseable values.
function parseCurrency(str) {
  if (!str || str.trim() === '' || str.trim().toUpperCase() === 'N/A') return null;

  // Strip acquirer notes like "(Salesforce)" and whitespace
  const cleaned = str.replace(/\(.*?\)/, '').trim();

  const match = cleaned.match(/^\$?([\d.]+)\s*([BMTK])?$/i);
  if (!match) return null;

  const num = parseFloat(match[1]);
  const suffix = (match[2] || '').toUpperCase();

  if (suffix === 'T') return num * 1000;
  if (suffix === 'B') return num;
  if (suffix === 'M') return num / 1000;
  if (suffix === 'K') return num / 1000000;
  return num;
}

// Parses the CSV once and calls callback(rows) with normalized row objects.
// Each row has all original string fields plus numeric helpers:
//   arr_b        — ARR in billions (null if unparseable)
//   valuation_b  — Valuation in billions (null if unparseable)
//   founded_year — integer (null if unparseable)
function loadData(callback) {
  Papa.parse('/companies.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete(results) {
      const rows = results.data.map(row => ({
        ...row,
        arr_b:        parseCurrency(row['ARR']),
        valuation_b:  parseCurrency(row['Valuation']),
        founded_year: parseInt(row['Founded Year'], 10) || null,
      }));
      callback(rows);
    },
  });
}
