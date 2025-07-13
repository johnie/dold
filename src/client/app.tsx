import { DoldForm } from '@/components/dold-form';
import { DoldLogo } from '@/components/logo';

const App = () => {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <DoldLogo />
        <DoldForm className="my-custom-class" />
      </div>
    </div>
  );
};

export default App;
