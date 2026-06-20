/* global React */
// MoustachirSpace · New Lead form.
function NewLeadScreen({ onBack, onSubmit }) {
  const NS = window.MoustachirSpaceDesignSystem_d4c8ce;
  const { AppHeader, IconButton, TextField, Select, Textarea, Button } = NS;
  const { useState } = React;
  const [f, setF] = useState({
    name: 'Houssem Eddine Bouslimane',
    project: 'HealthCare Resilience',
    sector: 'Medical',
    phone: '(+213) 999 99 99 99',
    email: '',
    source: 'Event / Expo',
    state: 'Beginning',
    notes: '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-2)' }}>
      <AppHeader
        variant="title"
        title="New Lead"
        leading={<IconButton variant="plain" ariaLabel="Back" onClick={onBack}><i className="ph ph-arrow-left" /></IconButton>}
        trailing={<IconButton variant="plain" badge ariaLabel="Notifications"><i className="ph-fill ph-bell" /></IconButton>}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TextField label="Full Name" value={f.name} onChange={set('name')} />
        <TextField label="Project Name" value={f.project} onChange={set('project')} />
        <TextField label="Project Sector" value={f.sector} onChange={set('sector')} />
        <div style={{ display: 'flex', gap: 12 }}>
          <TextField label="Phone Number" value={f.phone} onChange={set('phone')} />
          <TextField label="Email Address" value={f.email} onChange={set('email')} placeholder="name@email.com" />
        </div>
        <Select label="Lead Source" value={f.source} onChange={set('source')}
          leadingIcon={<i className="ph ph-megaphone-simple" />}
          options={['Event / Expo', 'Referral', 'Website', 'Cold Outreach', 'Social']} />
        <Select label="Project State" value={f.state} onChange={set('state')}
          leadingIcon={<i className="ph ph-flag-banner" />}
          options={['Beginning', 'Scoping', 'Proposal Sent', 'Won', 'Lost']} />
        <Textarea label="Notes" rows={4} value={f.notes} onChange={set('notes')} placeholder="Context, scope, next steps…" />
      </div>
      <div style={{ padding: '12px 16px 18px', background: 'linear-gradient(to top, var(--surface-2) 70%, transparent)' }}>
        <Button variant="primary" full size="lg" onClick={onSubmit} leadingIcon={<i className="ph-fill ph-paper-plane-tilt" />}>Submit</Button>
      </div>
    </div>
  );
}
window.NewLeadScreen = NewLeadScreen;
