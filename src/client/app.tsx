import { lazy, Suspense } from "react";

import { DoldLogo } from "@/components/logo";

// Dynamic imports for route-level code splitting to keep client chunks under 500 kB
const DecryptView = lazy(async () => {
  const mod = await import("@/components/decrypt-view");
  return { default: mod.DecryptView };
});
const DoldForm = lazy(async () => {
  const mod = await import("@/components/dold-form");
  return { default: mod.DoldForm };
});
const App = () => {
  const isDecryptPage = window.location.pathname.startsWith("/m/");

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <DoldLogo />
        <Suspense fallback={null}>
          {isDecryptPage ? <DecryptView /> : <DoldForm />}
        </Suspense>
      </div>
    </div>
  );
};

export default App;
