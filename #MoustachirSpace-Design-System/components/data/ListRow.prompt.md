White card list row with a tinted leading icon tile, title, status subtitle/meta, and a trailing slot. The backbone of "My Missions" and activity lists.

```jsx
<ListRow icon={<i className="ph-fill ph-globe" />} iconTone="blue"
  title="Website dev — Lazzouzi Lyna"
  subtitle={<StatusPill status="progress" />} meta="#MC-0418"
  trailing={<ProgressRing value={70} tone="blue" />} onClick={open} />
```
Stack rows in a `display:flex; flex-direction:column; gap:10px`.
