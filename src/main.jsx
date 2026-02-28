import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import IronSovereignV2 from './IronSovereignV2.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <IronSovereignV2 />
  </StrictMode>,
)

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }, 1000);
  });
}
