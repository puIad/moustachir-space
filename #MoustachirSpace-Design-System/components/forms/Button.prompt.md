Glossy electric-blue pill button — the primary action across MoustachirSpace; use for the one main action on a screen (Log In, Submit).

```jsx
<Button variant="primary" full onClick={submit}>Log In</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost" size="sm">Skip</Button>
```

Variants: `primary` (gradient + top sheen + blue glow shadow), `secondary` (blue-50 tint), `ghost` (hairline outline), `danger` (red). Sizes `sm | md | lg`. Press scales to 0.97. Pass `leadingIcon`/`trailingIcon` for icon+label. One primary per view.
