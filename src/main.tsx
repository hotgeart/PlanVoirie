import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// En développement, le store est accessible depuis la console (débogage).
if (import.meta.env.DEV) {
  void Promise.all([import('./store/useStore'), import('./canvas/registry')]).then(([s, r]) => {
    Object.assign(window, { __store: s.useStore, __world: r.getWorldNode });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
