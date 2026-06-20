Toggleable selection chip — solid electric-blue when selected, light-grey card when idle. Used in clusters for feedback tags / filters.

```jsx
<Chip selected={good} onToggle={setGood}>High Quality</Chip>
<Chip tone="orange" selected={delayed} onToggle={setDelayed}>Delays</Chip>
```

Lay chips in a `display:flex; gap:8px; flex-wrap:wrap` row. Tones: `blue | orange | green | ink`.
