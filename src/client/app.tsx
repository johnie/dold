import { DoldForm } from '@/components/dold-form';
import { use, Suspense } from 'react';

// import { hc } from 'hono/client';
// import type { InferResponseType } from 'hono/client';
// import type { RouteType } from '@/index';

// const client = hc<RouteType>('/api');

const fetchData = async () => {
  const data = await fetch('https://jsonplaceholder.typicode.com/posts/1', {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!data.ok) {
    throw new Error('Network response was not ok');
  }
  return data.json() as Promise<{ title: string }>;
};

const Component = ({ promise }: { promise: Promise<{ title: string }> }) => {
  const data = use(promise);
  return <h2 className="text-2xl">{data.title}</h2>;
};

const App = () => {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={'loading...'}>
          <DoldForm className="my-custom-class" />
          <Component promise={fetchData()} />
        </Suspense>
      </div>
    </div>
  );
};

export default App;
