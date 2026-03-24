// Debug script to test CSV parsing
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'public', 'companies.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

console.log('CSV file length:', csvContent.length);
console.log('First 200 characters:');
console.log(csvContent.substring(0, 200));
console.log('\nFirst 5 lines:');
console.log(csvContent.split('\n').slice(0, 5).map((line, i) => `${i + 1}: ${line}`).join('\n'));

// Test parsing function
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

const firstLine = csvContent.split('\n')[0];
const headers = parseCSVLine(firstLine);
console.log('\nHeaders:', headers);
console.log('Number of headers:', headers.length);

const secondLine = csvContent.split('\n')[1];
const values = parseCSVLine(secondLine);
console.log('\nFirst data row values:', values);
console.log('Number of values:', values.length);
