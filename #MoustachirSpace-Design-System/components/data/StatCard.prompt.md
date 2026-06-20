Dashboard metric tile: label, big Space-Grotesk number, optional unit + delta, and a faint watermark glyph.

```jsx
<StatCard label="Leads Added" value="14" delta="+3 vs last week" deltaTone="up"
  watermark={<i className="ph-fill ph-seal-check" />} />
<StatCard label="Avg. Feedback" value="4.2" unit="★" delta="From 8 Clients" deltaTone="flat"
  watermark={<i className="ph-fill ph-medal" />} />
```
Place two side-by-side in a `display:grid; grid-template-columns:1fr 1fr; gap:12px`.
