import React from 'react';
import { createRoot } from 'react-dom/client';
import App from "./app.tsx";

// https://esbuild.github.io/api/#live-reload
if (!globalThis.IS_PRODUCTION)
  new EventSource('/esbuild').addEventListener('change', () => location.reload());

createRoot(document.getElementById('root')!).render(<App/>);
