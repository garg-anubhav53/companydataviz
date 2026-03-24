// Data Verification Script for Company Data Visualization
// Implements all verification checks from check_data_correctness.md

function runDataVerification(rows) {
  console.log('🔍 Starting Data Verification...\n');
  
  // 1. Parser sanity check - verify key companies
  console.log('📋 1. Parser Sanity Check - Key Companies:');
  const keyCompanies = ['Salesforce', 'Snowflake', 'Microsoft', 'HubSpot'];
  const keyCompanyData = rows.filter(r => keyCompanies.includes(r['Company Name']));
  console.table(keyCompanyData.map(r => ({ 
    name: r['Company Name'], 
    arr: r.arr_b, 
    val: r.valuation_b, 
    founded: r.founded_year, 
    industry: r.Industry, 
    investors: r['Top Investors'] 
  })));
  
  // Check for unexpected nulls on key companies
  const keyCompanyIssues = keyCompanyData.filter(r => 
    r.arr_b === null || r.valuation_b === null || r.founded_year === null
  );
  if (keyCompanyIssues.length > 0) {
    console.warn('⚠️  Key companies with data issues:', keyCompanyIssues.map(r => r['Company Name']));
  } else {
    console.log('✅ All key companies have valid data');
  }
  
  // 2. Per-chart spot checks
  console.log('\n📊 2. Per-Chart Spot Checks:');
  
  // Industry Pie Chart
  console.log('🥧 Industry Pie Chart:');
  const industryCounts = {};
  rows.forEach(r => {
    if (r.Industry) {
      industryCounts[r.Industry] = (industryCounts[r.Industry] || 0) + 1;
    }
  });
  const totalCompanies = Object.values(industryCounts).reduce((a, b) => a + b, 0);
  console.log(`Total companies across all slices: ${totalCompanies} (expected: 100)`);
  
  const largestIndustry = Object.entries(industryCounts)
    .sort((a, b) => b[1] - a[1])[0];
  console.log(`Largest slice: ${largestIndustry ? largestIndustry[0] : 'None'} (${largestIndustry ? largestIndustry[1] : 0} companies)`);
  
  // Founded Scatter Plot
  console.log('\n📈 Founded Scatter Plot:');
  const microsoft = rows.find(r => r['Company Name'] === 'Microsoft');
  if (microsoft) {
    console.log(`Microsoft founded year: ${microsoft.founded_year} (expected: 1975)`);
    console.log(`Microsoft founded check: ${microsoft.founded_year === 1975 ? '✅' : '❌'}`);
  }
  
  const validFoundedYears = rows.filter(r => r.founded_year && r.founded_year > 0);
  if (validFoundedYears.length > 0) {
    const earliestCompany = validFoundedYears.reduce((earliest, current) => 
      current.founded_year < earliest.founded_year ? current : earliest
    );
    console.log(`Earliest founded company: ${earliestCompany['Company Name']} (${earliestCompany.founded_year})`);
  }
  
  // Investor Bar Chart
  console.log('\n📊 Investor Bar Chart:');
  const investorCounts = {};
  rows.forEach(r => {
    if (r['Top Investors']) {
      const investors = r['Top Investors'].split(',').map(i => i.trim());
      investors.forEach(investor => {
        if (investor) {
          investorCounts[investor] = (investorCounts[investor] || 0) + 1;
        }
      });
    }
  });
  
  const sequoiaCount = investorCounts['Sequoia Capital'] || investorCounts['Sequoia'] || 0;
  console.log(`Sequoia count: ${sequoiaCount} (expected: 18)`);
  
  const topInvestors = Object.entries(investorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  console.log(`Top 15 investors count: ${topInvestors.length} (expected: 15)`);
  console.log('Top investors:', topInvestors.map(([name, count]) => `${name}: ${count}`));
  
  // ARR Scatter Plot
  console.log('\n💰 ARR Scatter Plot:');
  const validArrPoints = rows.filter(r => r.arr_b && r.arr_b > 0 && r.valuation_b && r.valuation_b > 0);
  console.log(`Valid ARR points: ${validArrPoints.length} (expected: ~88)`);
  
  if (microsoft) {
    console.log(`Microsoft position: ARR=${microsoft.arr_b}B, Valuation=${microsoft.valuation_b}B`);
    console.log(`Microsoft in top-right extreme: ${microsoft.arr_b > 100 && microsoft.valuation_b > 1000 ? '✅' : '❌'}`);
  }
  
  // 3. Currency parser edge cases
  console.log('\n💵 3. Currency Parser Edge Cases:');
  const withValidArrAndVal = rows.filter(r => r.arr_b && r.valuation_b);
  console.log(`Companies with both ARR and Valuation: ${withValidArrAndVal.length} (expected: ~88)`);
  
  const withNullArr = rows.filter(r => r.arr_b === null);
  console.log(`Companies with null ARR: ${withNullArr.length}`);
  if (withNullArr.length <= 20) {
    console.log('Companies with null ARR:', withNullArr.map(r => r['Company Name']));
  } else {
    console.log('Too many null ARR values to display');
  }
  
  // 4. Data quality checks
  console.log('\n🔍 4. Data Quality Checks:');
  const duplicateNames = rows.reduce((duplicates, r, index) => {
    const name = r['Company Name'];
    if (name) {
      if (!duplicates[name]) duplicates[name] = [];
      duplicates[name].push(index);
    }
    return duplicates;
  }, {});
  
  const actualDuplicates = Object.entries(duplicateNames).filter(([name, indices]) => indices.length > 1);
  if (actualDuplicates.length > 0) {
    console.warn('⚠️  Duplicate company names found:', actualDuplicates.map(([name]) => name));
  } else {
    console.log('✅ No duplicate company names found');
  }
  
  // Check for extreme values that might indicate parsing errors
  const extremeValuations = rows.filter(r => r.valuation_b && r.valuation_b > 10000);
  if (extremeValuations.length > 0) {
    console.warn('⚠️  Extremely high valuations (possible parsing errors):', 
      extremeValuations.map(r => `${r['Company Name']}: $${r.valuation_b}B`));
  }
  
  const extremeArr = rows.filter(r => r.arr_b && r.arr_b > 1000);
  if (extremeArr.length > 0) {
    console.warn('⚠️  Extremely high ARR (possible parsing errors):', 
      extremeArr.map(r => `${r['Company Name']}: $${r.arr_b}B`));
  }
  
  console.log('\n🎯 Data Verification Complete!');
  console.log('📝 Summary:');
  console.log(`- Total companies processed: ${rows.length}`);
  console.log(`- Companies with valid valuation: ${rows.filter(r => r.valuation_b).length}`);
  console.log(`- Companies with valid ARR: ${rows.filter(r => r.arr_b).length}`);
  console.log(`- Companies with valid founded year: ${rows.filter(r => r.founded_year).length}`);
  console.log(`- Unique industries: ${Object.keys(industryCounts).length}`);
  console.log(`- Unique investors: ${Object.keys(investorCounts).length}`);
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runDataVerification };
} else {
  window.runDataVerification = runDataVerification;
}
