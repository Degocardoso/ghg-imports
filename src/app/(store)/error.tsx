'use client';

import { useEffect } from 'react';

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-store flex flex-col items-center py-28 text-center">
      <h1 className="text-3xl font-extrabold">Algo deu errado</h1>
      <p className="mt-3 text-muted">Tente novamente. Se o problema continuar, fale conosco pelo WhatsApp.</p>
      <button type="button" onClick={reset} className="btn-gold mt-8">Tentar novamente</button>
    </div>
  );
}
