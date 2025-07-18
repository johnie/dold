import { createRoot } from 'react-dom/client';
import App from './idApp';
import { Toaster } from '@/components/ui/sonner';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <>
      <App />
      <Toaster />
    </>
  );
}
