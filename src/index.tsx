import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { ErrorBoundary, Suspense } from 'hono/jsx';
import { timing } from 'hono/timing';
import { z } from 'zod';
import { Form, Releases } from './components';
import { renderer } from './renderer';
import type { HonoContext } from './types';

const app = new Hono<HonoContext>();

app.use(timing());

app.use(renderer);

app.get('/', (c) => {
  return c.render(<Form />, {
    title: 'Github Release Browser',
  });
});

// app.get('/test', (c) => {
//   return c.render(
//     <Suspense fallback={<div>Loading...</div>}>
//       <AsyncList
//         generator={(async function* () {
//           yield <div>hello</div>;
//           await timer(1000);
//           yield <div>world</div>;
//           await timer(1000);
//           return <div>goodbye</div>;
//         })()}
//       />
//     </Suspense>
//   );
// });

app.post(
  '/',
  zValidator(
    'form',
    z.object({
      pkg: z.string().trim().optional(),
    })
  ),
  async (c) => {
    console.log(c.req.valid('form'));
    const { pkg } = c.req.valid('form');
    return c.redirect(`/${pkg}`);
  }
);

app.get(
  '/:owner/:repo',
  cache({
    cacheName: 'my-app',
    cacheControl: 's-maxage=60',
  }),
  async (c) => {
    const { owner, repo } = c.req.param();
    const pkg = `${owner}/${repo}`;

    return c.render(
      <>
        <Form pkg={`${owner}/${repo}`} />
        <hr />
        {pkg ? (
          <h2>
            <a href={`https://github.com/${pkg}`} target='_blank'>
              {pkg}
            </a>
          </h2>
        ) : null}
        <ErrorBoundary
          fallbackRender={(error) => <div>Error: {error.message}</div>}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <Releases pkg={pkg} />
          </Suspense>
        </ErrorBoundary>
      </>,
      {
        title: 'Github Release Browser',
      }
    );
  }
);

export default app;
