import { DoldForm } from '@/components/dold-form';
import { DecryptView } from '@/components/decrypt-view';
import { DoldLogo } from '@/components/logo';

const App = () => {
  const isDecryptPage = window.location.pathname.startsWith('/m/');

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <DoldLogo />
        {isDecryptPage ? <DecryptView /> : <DoldForm />}
      </div>
    </div>
  );
};

export default App;
