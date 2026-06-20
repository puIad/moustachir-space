Icon-only button for toolbar/header actions (back arrow, notification bell), nav, and field affordances. Always pass `ariaLabel`.

```jsx
<IconButton variant="plain" ariaLabel="Back"><i className="ph ph-arrow-left" /></IconButton>
<IconButton variant="solid" badge ariaLabel="Notifications"><i className="ph-fill ph-bell" /></IconButton>
```

Variants: `plain | tint | solid | ghost`. Sizes `sm 36 · md 44 · lg 52`. `rounded="square"` for soft-rect. `badge` adds the blue notification dot.
