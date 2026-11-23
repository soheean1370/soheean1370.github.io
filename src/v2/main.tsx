import { createRoot } from 'react-dom/client';
import { App } from './App';
import '../ui/styles/three.css';

createRoot(document.getElementById('root')!).render(<App />);
if (new URLSearchParams(location.search).has('debug')) (window as any).__v2 = true;
