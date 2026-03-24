// Node.js script to run data verification tests
const fs = require('fs');
const path = require('path');

// Mock PapaParse for Node.js environment
const Papa = {
  parse: function(csvContent, options) {
    // Simple CSV parser that handles quoted fields
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = this.parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = this.parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    
    // Call complete immediately for synchronous behavior
    options.complete({ data: data });
  },
  
  parseCSVLine: function(line) {
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
};

// Load the CSV data
const csvPath = path.join(__dirname, 'public', 'companies.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Load and evaluate the data.js functions to get parseCurrency
const dataJs = fs.readFileSync(path.join(__dirname, 'public', 'data.js'), 'utf8');
eval(dataJs);

// Override loadData to work with file system instead of HTTP
function loadData(callback) {
  Papa.parse(csvContent, {
    download: false,  // Don't try to download, use the content we already have
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

// Load and evaluate the verification script
const verificationJs = fs.readFileSync(path.join(__dirname, 'public', 'data-verification.js'), 'utf8');
eval(verificationJs);

console.log('🚀 Running Data Verification Tests...\n');

// Run the verification with our fixed loadData function
loadData(function(rows) {
  console.log(`📊 Loaded ${rows.length} companies from CSV\n`);
  
  if (rows.length === 0) {
    console.error('❌ No data loaded! Check CSV file path and parsing.');
    return;
  }
  
  // Run the verification
  runDataVerification(rows);
  
  console.log('\n✅ Verification completed!');
  process.exit(0);
});
