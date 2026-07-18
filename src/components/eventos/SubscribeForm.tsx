import { useState, type FormEvent } from 'react';
import { subscribe } from './api';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const { ok, data } = await subscribe(email);
    setMsg(data.message || data.error || 'Algo ha fallado. Inténtalo de nuevo.');
    setStatus(ok ? 'ok' : 'error');
    if (ok) setEmail('');
  }

  return (
    <form className="subscribe-form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="sub-email">Avísame de nuevos eventos</label>
        <input
          id="sub-email"
          className="input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
        />
      </div>
      <button className="btn" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Enviando…' : 'Suscribirme'} <span className="ar">→</span>
      </button>
      {msg && (
        <p className={`form-msg ${status === 'ok' ? 'form-msg--ok' : 'form-msg--err'}`}>{msg}</p>
      )}
    </form>
  );
}
