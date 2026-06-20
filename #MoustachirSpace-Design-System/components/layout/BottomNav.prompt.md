Bottom tab bar with a centre raised blue FAB. Up to 4 items flank the FAB; pass fill-weight icons for the active state.

```jsx
<BottomNav active="home" onSelect={setTab} onFab={newLead}
  items={[
    { key:'home',     icon:<i className="ph ph-house" />,         iconActive:<i className="ph-fill ph-house" /> },
    { key:'calendar', icon:<i className="ph ph-calendar-blank" />,iconActive:<i className="ph-fill ph-calendar-blank" /> },
    { key:'feedback', icon:<i className="ph ph-chat-circle-text" />,iconActive:<i className="ph-fill ph-chat-circle-text" /> },
    { key:'clients',  icon:<i className="ph ph-users-three" />,   iconActive:<i className="ph-fill ph-users-three" /> },
  ]} />
```
