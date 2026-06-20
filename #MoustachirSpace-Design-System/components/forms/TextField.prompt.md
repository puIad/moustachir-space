The standard MoustachirSpace text input: a white card with the label small + grey above the typed value. Soft shadow at rest, blue ring on focus, red on error.

```jsx
<TextField label="Full Name" value={name} onChange={e => setName(e.target.value)} />
<TextField label="Password" type={show ? 'text' : 'password'}
  trailingIcon={<i className={show ? 'ph ph-eye-slash' : 'ph ph-eye'} />}
  onTrailingClick={() => setShow(!show)} />
<TextField label="Email" error="Enter a valid email" />
```

Use for every short text/email/password/phone input. For dropdowns use `Select`, for multi-line use `Textarea`.
