Mobile top bar in two layouts.

```jsx
// Screen header
<AppHeader variant="title" title="New Lead"
  leading={<IconButton variant="plain" ariaLabel="Back"><i className="ph ph-arrow-left" /></IconButton>}
  trailing={<IconButton variant="plain" badge ariaLabel="Alerts"><i className="ph-fill ph-bell" /></IconButton>} />

// Dashboard greeting
<AppHeader variant="greeting" name="Khaled Ferroukhi"
  avatar={<Avatar src={photo} name="Khaled Ferroukhi" />}
  trailing={<IconButton variant="plain" badge ariaLabel="Alerts"><i className="ph-fill ph-bell" /></IconButton>} />
```
"Merhba," (Welcome) is the default Algerian-Arabic greeting.
