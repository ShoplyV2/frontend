'use client';

import { useState } from 'react';

export function TokenGate({ onSubmit }: { onSubmit: (token: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <div className="card" style={{ maxWidth: '28rem', margin: '3rem auto' }}>
      <h1 style={{ marginBottom: '0.75rem' }}>Shoply Seller Feed</h1>
      <p style={{ marginBottom: '1rem' }}>Enter your feed token to see your orders and handoff queue.</p>
      <form
        className="row"
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) onSubmit(value.trim());
        }}
      >
        <input
          type="password"
          placeholder="Feed token"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          style={{ flex: 1, minWidth: '12rem' }}
        />
        <button type="submit">Connect</button>
      </form>
    </div>
  );
}
