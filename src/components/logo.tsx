import { APP_NAME } from '@/contants';
import { Fingerprint } from 'lucide-react';

export function DoldLogo() {
  return (
    <div className="flex items-center justify-center py-4 gap-3">
      <Fingerprint className="w-8 h-8 text-neutral-200" strokeWidth={1.5} />
      <span className="text-2xl font-mono font-bold text-neutral-50 tracking-wide">
        {APP_NAME}
      </span>
    </div>
  );
}
