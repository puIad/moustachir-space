Dropdown styled as a card field, with an optional blue leading-icon chip (e.g. Lead Source). Needs Phosphor CSS loaded for the caret.

```jsx
<Select label="Lead Source" value={src} onChange={e => setSrc(e.target.value)}
  leadingIcon={<i className="ph ph-megaphone-simple" />}
  options={['Event / Expo', 'Referral', 'Website', 'Cold Outreach']} />
```
