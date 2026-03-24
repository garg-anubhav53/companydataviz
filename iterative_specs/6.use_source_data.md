## Coding Assistant Handoff — CSV Data Migration

### Context
- CSV is at `input_data/<filename>` in project root
- All charts currently use hardcoded data arrays
- PapaParse not yet added
- Target: all charts draw from real CSV data; new ARR vs. Valuation scatter added

---

### Steps

**1. Serve the CSV**
Copy the CSV from `input_data/` into `public/` so Express static middleware can serve it.

**2. Add PapaParse**
Add to `index.html` before chart scripts:
```html
<script src="https://cdn.jsdelivr.net/npm/papaparse@5/papaparse.min.js"></script>
```

**3. Create `public/data.js` — shared data loader**
- Parse CSV once via PapaParse (`download: true, header: true`)
- Write a currency normalizer: strips `$`, converts suffix to float in billions — `M` → `/1000`, `B` → as-is, `T` → `×1000`
- Expose `loadData(callback)` returning the full normalized row array
- Rows with unparseable/missing ARR or Valuation are flagged but not dropped — callers filter as needed

**4. Retrofit existing chart functions**
Replace hardcoded arrays with data passed in as a parameter. Keep function signatures compatible with `main.js` call sites — add `data` as a second argument.

**5. Build `public/charts/arrValuationScatter.js`**
- Filter to rows where both ARR and Valuation parse cleanly
- Both axes `type: 'logarithmic'`
- Tick labels only at `0.1, 1, 10, 100, 1000` → formatted as `$0.1B, $1B, $10B, $100B, $1T`
- Tooltip: `{label}: ARR ${x}B, Valuation ${y}B`

**6. Update `main.js`**
Call `loadData()` once on startup; pass result into each chart init function at render time.

---

### Critical edge cases
| Value | Expected output |
|---|---|
| `$3T` | `3000` |
| `$600M` | `0.6` |
| `N/A` or blank | `null` (exclude from scatter) |