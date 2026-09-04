'use client';

import { useState } from 'react';
import Link from 'next/link';

export function TokenGate({ onSubmit }: { onSubmit: (token: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <main className="page page--narrow page--centered">
      <div className="card stack">
        <h1>Shoply</h1>
        <p>Enter your shop key to see your catalog, orders, and anything your assistant needs you for.</p>
        <form
          className="cluster"
          onSubmit={(event) => {
            event.preventDefault();
            if (value.trim()) onSubmit(value.trim());
          }}
        >
          <input
            type="password"
            className="input field--grow"
            placeholder="Shop key"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <button type="submit" className="btn btn--primary">
            Connect
          </button>
        </form>
        <p className="text-sm">
          New seller? <Link href="/onboarding/signup">Set up your shop</Link>
        </p>
      </div>
    </main>
  );
}
