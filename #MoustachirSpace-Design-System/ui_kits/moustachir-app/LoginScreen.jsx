/* global React */
// MoustachirSpace · Login screen — navy "space" hero + glossy form.
function LoginScreen({ onLogin }) {
  const { TextField, Button } = window.MoustachirSpaceDesignSystem_d4c8ce;
  const { useState } = React;
  const [email, setEmail] = useState('thehicore@outlook.com');
  const [pw, setPw] = useState('secret123');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--white)' }}>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--grad-hero)', borderBottomLeftRadius: 26, borderBottomRightRadius: 26, padding: '64px 26px 30px' }}>
        <div className="ms-stars" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <img src="../../assets/moustachir-logo-white.png" alt="MoustachirSpace" style={{ height: 30, position: 'relative', marginBottom: 26 }} />
        <h1 style={{ position: 'relative', margin: 0, color: '#fff', font: 'var(--fw-bold) 30px/1.12 var(--font-display)', letterSpacing: '-0.02em' }}>Sign in to your<br />MousSpace Account</h1>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '26px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          label="Password"
          type={show ? 'text' : 'password'}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          trailingIcon={<i className={show ? 'ph ph-eye-slash' : 'ph ph-eye'} />}
          onTrailingClick={() => setShow(!show)}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', font: 'var(--fw-medium) 13px var(--font-text)', color: 'var(--ink-500)' }}>
            <span
              onClick={() => setRemember(!remember)}
              style={{
                width: 20, height: 20, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: remember ? 'var(--blue-500)' : 'var(--white)',
                boxShadow: remember ? 'none' : 'inset 0 0 0 1.5px var(--line-300)',
                color: '#fff', fontSize: 13, transition: 'all var(--dur-base) var(--ease-out)',
              }}
            >
              {remember && <i className="ph-bold ph-check" />}
            </span>
            Remember me
          </label>
          <a style={{ font: 'var(--fw-semibold) 13px var(--font-text)', color: 'var(--blue-500)', textDecoration: 'none', cursor: 'pointer' }}>Forgot Password?</a>
        </div>
        <Button variant="primary" full size="lg" style={{ marginTop: 4 }} onClick={onLogin}>Log In</Button>
      </div>
    </div>
  );
}
window.LoginScreen = LoginScreen;
