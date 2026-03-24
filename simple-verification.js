// Simple Node.js script to run data verification tests
const fs = require('fs');
const path = require('path');

// Load the CSV data
const csvPath = path.join(__dirname, 'public', 'companies.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Simple CSV parser that handles quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Currency parser from data.js
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

// Parse CSV
const lines = csvContent.split('\n').filter(line => line.trim());
const headers = parseCSVLine(lines[0]);
const data = [];

for (let i = 1; i < lines.length; i++) {
  if (lines[i].trim()) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    // Add computed fields
    row.arr_b = parseCurrency(row['ARR']);
    row.valuation_b = parseCurrency(row['Valuation']);
    row.founded_year = parseInt(row['Founded Year'], 10) || null;
    
    data.push(row);
  }
}

console.log('🚀 Running Data Verification Tests...\n');
console.log(`📊 Loaded ${data.length} companies from CSV\n`);

// Load verification functions
const verificationJs = fs.readFileSync(path.join(__dirname, 'public', 'data-verification.js'), 'utf8');
// Extract the runDataVerification function
const runDataVerificationMatch = verificationJs.match(/function runDataVerification\(rows\) \{[\s\S]*?\n\}/);
if (runDataVerificationMatch) {
  eval(runDataVerificationMatch[0]);
  runDataVerification(data);
} else {
  console.error('Could not find runDataVerification function');
}

console.log('\n✅ Verification completed!');
