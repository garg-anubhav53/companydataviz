# companydataviz

> **Chat with your data** — Ask natural language questions about the top 100 SaaS companies and get instant visualizations.

A living example of how modern web technologies can transform static CSV data into an interactive, conversational analytics experience.

---

## 🚀 Quick Start

```bash
git clone https://github.com/garg-anubhav53/companydataviz.git
cd companydataviz
npm install
npm start
```

Open http://localhost:3000 and start asking questions.

**No API key?** The app will prompt you — just paste your Anthropic key and it validates it instantly.

---

## 💬 What You Can Ask

### **Visual Analytics**
- *"Show me the industry breakdown"* → Pie chart of market segments
- *"ARR vs valuation scatter"* → Revenue multiples with 5x/10x/20x/50x reference lines
- *"Founded year vs valuation"* → Company age vs market value
- *"Top investors"* → Most active VCs by portfolio count

### **Company Intelligence**
- *"What is Stripe's valuation?"* → `$50B valuation`
- *"Show me Salesforce's ARR"* → `$34B annual recurring revenue`
- *"Who invested in Airtable?"* → List of top investors
- *"What industry is HubSpot in?"* → Marketing automation

### **Why This Approach?**
Even for non visualization questions (e.g. specific company or investor level), natural language feels more intuitive than dropdown menus and filters. Users don't need to learn the interface — they just ask questions the way they would to a data analyst.

---

## 🏗️ Architecture

**The Flow:** You type natural language → Claude extracts intent → Client renders response (chart, lookup, or query).

**Key Design Decisions:**
- **One CSV Load, Many Uses** - Eliminates network latency, ensures consistency
- **Server-Side LLM** - Secure API calls, avoids CORS issues  
- **Fresh Canvas Per Response** - Prevents Chart.js memory leaks
- **Smart Currency Parsing** - Handles real-world data messiness

**📖 For complete technical details, see [CODEBASE.md](./CODEBASE.md)**

---

## 📊 The Data

**Source:** Top 100 SaaS companies by market cap
- **88 companies** with both ARR and valuation data
- **$100M to $100B+** valuation range (logarithmic scales)
- **5 major industries** with clear market leaders
- **15+ active VCs** with multiple portfolio companies

---

## 🎯 Implementation Journey

Built iteratively over 9 weeks:
1. **Pie Chart** - Chart.js integration and data loading
2. **Scatter Plot** - Logarithmic scales for wide value ranges  
3. **Investor Analysis** - Data aggregation and string parsing
4. **LLM Integration** - Natural language routing
5. **Data Verification** - Parsing accuracy validation
6. **Real CSV** - Production dataset integration
7. **Advanced Analytics** - Revenue multiples and regression
8. **Visual Polish** - Modern UI with typing indicators
9. **Query Extension** - Ranked/filtered company lists

**Each iteration was production-ready** — never broke existing functionality.

---

## ⚖️ Trade-offs

**Vanilla JavaScript over React**
- ✅ Faster load (<2s), fewer dependencies
- ❌ Manual DOM manipulation

**CSV over Database** 
- ✅ Zero setup, git versioning
- ❌ Not scalable to millions of records

**Minimal Error Handling**
- ✅ Simpler code, faster development
- ❌ Generic error messages

**Horizontal Bar Chart for Industry Breakdown**
- ✅ Consistent Chart.js implementation, easier visualization
- ❌ Less precise than table for exact percentages

**LLM-Generated Company Insights**
- ✅ Scales to any company or question type
- ❌ Some chance of incorrectness, depends on training data

**Choices reflect scope:** demonstration prioritizing clarity and speed over enterprise robustness, with strategic use of LLM for scalable insights.

---

## 🔧 Technical Highlights

**Real-time ARR Multiple Calculation** - Shows market efficiency (10-20x typical)

**Industry Color Coding** - Visual patterns emerge by market segment

**Logarithmic Reference Lines** - Key analytical insight for valuation analysis

**Natural Language Queries** - "top 5 by revenue multiple" → ranked company lists

---

## � Understanding the ARR vs Valuation Chart

### **Why Log-Log Scale?**

The ARR vs valuation chart uses logarithmic scales on both axes because SaaS companies span an enormous range:

- **Small companies**: $100M ARR, $1B valuation
- **Large companies**: $10B+ ARR, $100B+ valuation

On a linear scale, the small companies would be invisible dots crowded near the origin. Logarithmic scales let us see patterns across the entire spectrum.

### **How to Read It**

**Reference Lines** (10x, 50x) show revenue multiples:
- **10x line**: Companies valued at 10 times their annual revenue
- **Above 20x**: High-growth, premium valuations  
- **Below 10x**: Mature, slower-growing companies

**Industry Colors** reveal patterns:
- Some industries command consistently higher multiples
- Helps identify if a company is over/under valued for its market

**Regression Line** shows the market trend:
- Slope indicates how multiples change at scale
- Most companies cluster around this trend line

### **What It Tells You**

- **Market efficiency**: Most companies trade 10-20x ARR
- **Growth premium**: Companies above 20x are expected to grow faster
- **Scale effects**: Larger companies often get lower multiples (growth compresses)

This visualization transforms complex financial relationships into intuitive patterns that anyone can understand.

---

## �� Project Structure

```
companydataviz/
├── 📄 server.js              # Express + Claude routing
├── 📄 package.json           # Dependencies
├── 📁 public/
│   ├── 💬 main.js           # Chat interface, orchestration
│   ├── 📊 data.js           # CSV loading + parsing
│   ├── 🎨 charts/           # One file per visualization
│   └── 🌐 index.html        # Modern chat UI
├── 📁 iterative_specs/      # Complete development history
├── 📄 companies.csv         # Source data
├── 📄 CODEBASE.md           # Technical reference
└── 📄 CLAUDE.md             # Developer guide
```

---

## 🎯 What Makes This Special

- **No frameworks** - Pure web technologies
- **Instant feedback** - <100ms chart render after data loads
- **Natural language** - Users don't need to learn UI
- **Real data** - Actual company valuations and metrics
- **Extensible** - New charts take ~30 lines of code

This is a template for conversational analytics tools that make data accessible to everyone.

---

## 🚀 Next Steps

- Add new chart types in `charts/` folder
- Extend natural language queries in `server.js`
- Add more data sources via `data.js`
- Enhance UI in `index.html`

**The foundation is solid** — limited only by imagination and data availability.
