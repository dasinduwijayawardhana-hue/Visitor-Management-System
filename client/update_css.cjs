const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/\.auth-brand-headline\s*\{[^}]+\}/g, `.auth-brand-headline {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.15;
  color: #F8FAFC;
  letter-spacing: 0.05em;
  text-shadow: 0 5px 20px rgba(0,0,0,0.9);
}`);

css = css.replace(/\.auth-brand-sub\s*\{[^}]+\}/g, `.auth-brand-sub {
  margin-top: 1rem;
  font-size: 0.9375rem;
  line-height: 1.65;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 10px rgba(0,0,0,0.7);
}`);

css = css.replace(/\.auth-brand-tag\s*\{[^}]+\}/g, `.auth-brand-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid rgba(228, 200, 119, 0.45);
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(228, 200, 119, 0.85);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(228, 200, 119, 0.05);
  transition: all 200ms ease-in-out;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  cursor: pointer;
}
.auth-brand-tag:hover {
  background: rgba(228, 200, 119, 0.15);
  border-color: rgba(228, 200, 119, 0.8);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.4);
}
.auth-brand-tag:focus-visible {
  outline: 2px solid rgba(228, 200, 119, 0.8);
  outline-offset: 2px;
}`);

css = css.replace(/\.auth-form-card\s*\{[^}]+\}/g, `.auth-form-card {
  width: 100%;
  max-width: 26rem;
  background: rgba(15, 25, 45, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.25rem;
  padding: 2.25rem 2rem;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
}`);

css = css.replace(/\.input-field\s*\{[^}]+\}/g, `.input-field {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid var(--border-default);
  background-color: var(--bg-surface);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}`);

css = css.replace(/\.input-field::placeholder\s*\{[^}]+\}/g, `.input-field::placeholder {
  color: var(--text-muted);
  opacity: 0.8;
}`);

css = css.replace(/\.input-field:focus\s*\{[^}]+\}/g, `.input-field:focus {
  border-color: var(--brass);
  box-shadow: 0 0 0 3px rgba(201, 162, 75, 0.25);
}`);

css = css.replace(/\.btn-primary\s*\{[^}]+\}/g, `.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  background-color: var(--primary);
  color: var(--primary-text);
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}`);

css = css.replace(/\.btn-primary:hover:not\(:disabled\)\s*\{[^}]+\}/g, `.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
}
.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
.btn-primary:focus-visible {
  outline: 2px solid var(--primary-hover);
  outline-offset: 2px;
}`);

const additions = `
.auth-left-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(0,0,0,0.65) 0%,
    rgba(0,0,0,0.45) 35%,
    rgba(0,0,0,0.20) 55%,
    transparent 75%
  );
  z-index: 1;
}

.auth-desc-glass {
  background: rgba(0,0,0,0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 20px;
  color: rgba(255, 255, 255, 0.9);
}
`;

fs.writeFileSync('src/index.css', css + additions, 'utf8');
process.stdout.write('CSS improvements applied\n');
