import { APP_NAME } from '@/contants';
import { IconFingerprint } from '@tabler/icons-react';

export function DoldLogo() {
  return (
    <a href="/" className="flex items-center justify-center py-4 gap-3">
      <IconFingerprint className="w-8 h-8 text-neutral-200" stroke={1.5} />
      <span className="text-2xl font-mono font-bold text-neutral-50 tracking-wide">
        {APP_NAME}
      </span>
    </a>
  );
}
