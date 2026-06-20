Pill search input with a leading magnifier (e.g. "Name or mission ID…").

```jsx
<SearchField value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ('')}
  placeholder="Name or mission ID…" />
```
