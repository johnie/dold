import { IconFingerprint } from "@tabler/icons-react";

import { APP_NAME } from "@/constants";

export const DoldLogo = () => (
  <a href="/" className="flex items-center justify-center gap-3 py-4">
    <IconFingerprint className="h-8 w-8 text-neutral-200" stroke={1.5} />
    <span className="font-mono text-2xl font-bold tracking-wide text-neutral-50">
      {APP_NAME}
    </span>
  </a>
);
