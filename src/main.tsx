import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign ResizeObserver loop error warnings from interrupting runtime
window.addEventListener('error', (e) => {
  if (
    e.message &&
    (e.message.includes('ResizeObserver loop') ||
     e.message.includes('undelivered notifications'))
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

