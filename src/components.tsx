import { Octokit } from '@octokit/core';
import { Suspense, type Child } from 'hono/jsx';
import { useRequestContext } from 'hono/jsx-renderer';
import { groupBy } from 'lodash-es';
import { parseReleaseName } from './utils';
import type { HtmlEscapedString } from 'hono/utils/html';
import semiver from 'semiver';
import { getQueryParam } from 'hono/utils/url';
import { endTime, startTime } from 'hono/timing';
import type { HonoContext } from './types';
import { newQueue } from '@henrygd/queue';

async function RenderGeneratorFn({
  generator,
}: {
  generator: () => AsyncGenerator<HtmlEscapedString, HtmlEscapedString, any>;
}) {
  const value = generator();
  return <AsyncList generator={value} />;
}

export async function AsyncList({
  generator,
}: {
  generator: AsyncGenerator<any, any, any>;
}) {
  const value = await generator.next();

  if (value.done) {
    return value.value;
  }

  return (
    <Suspense fallback={value.value}>
      <AsyncList generator={generator} />
    </Suspense>
  );
}

export const timer = (ms: number) =>
  new Promise<string>((resolve) => setTimeout(() => resolve('hello!'), ms));

type AwaitProps<T> = { promise: Promise<T>; render: (value: T) => Child };

async function Await<T>({ promise, render }: AwaitProps<T>) {
  const resolved = await promise;
  return <>{render(resolved)}</>;
}

export function Form({ pkg }: { pkg?: string }) {
  return (
    <>
      <h1>
        <a href='/'>Github Release Browser</a>
      </h1>
      <p>
        by <a href='https://github.com/patdx'>@patdx</a>{' '}
        <a href='https://github.com/patdx/gh-release-browser'>(GitHub)</a>
      </p>
      <p>View GitHub project releases sorted in actual semver order.</p>
      <form method='post' action='/'>
        <label>
          Github Repository Name
          <input
            type='text'
            name='pkg'
            value={pkg}
            placeholder='vercel/next.js'
          />
        </label>
        <button type='submit'>Submit</button>
      </form>

      <h2>Examples</h2>
      <div style={{ columnCount: 3 }}>
        {[
          'vercel/next.js',
          'vercel/vercel',
          'ionic-team/capacitor',
          'ionic-team/capacitor-plugins',
          'angular/angular',
          'angular/angular-cli',
          'cloudflare/workers-sdk',
        ].map((pkg) => (
          <p>
            <a href={`/${pkg}`}>{pkg}</a>
          </p>
        ))}
      </div>
    </>
  );
}

export async function Releases({ pkg }: { pkg: string }) {
  const [owner, repo] = pkg.split('/');

  console.log('checking for releases for', pkg);

  const releases: any[] = [];

  const c = useRequestContext<HonoContext>();

  const octokit = new Octokit({ auth: c.env.GH_TOKEN });

  const queue = newQueue(5);

  const promises: Promise<any>[] = [];

  for (let page = 1; page <= 5; page++) {
    promises.push(
      queue.add(async () => {
        // I thought about adding server timings but it turns out these only work *before* the request
        // starts streaming to the client
        // const logKey = `page-${page}`;
        // startTime(c, logKey);
        console.log('fetching page', page);
        const response = await octokit.request(
          'GET /repos/{owner}/{repo}/releases',
          {
            owner,
            repo,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28',
            },
            page,
            per_page: 100,
          }
        );
        releases.push(...response.data);
        // endTime(c, logKey);
      })
    );
  }

  await Promise.all(promises);

  const releasesWithParsed = releases.map((release) => ({
    ...(release.name ? { parsed: parseReleaseName(release.name) } : {}),
    ...release,
  }));

  const grouped = groupBy(
    releasesWithParsed,
    (release) => release.parsed?.name || repo
  );

  return (
    <>
      {Object.entries(grouped).map(([name, releases]) => (
        <div key={name}>
          <h2>{name}</h2>
          {releases.map((release) => (
            <p key={release.id}>
              <a href={release.html_url} target='_blank'>
                {release.parsed?.version ??
                  // if failed to parse?
                  // release.name ??
                  // maybe we should use tag name??
                  '(Failed to parse)'}
              </a>
            </p>
          ))}
        </div>
      ))}
      {/* <pre>{JSON.stringify(response.data, null, 2)}</pre> */}
    </>
  );
}

export function ReleasesStreaming({ pkg }: { pkg: string }) {
  const c = useRequestContext<{ Bindings: { GH_TOKEN: string } }>();

  const octokit = new Octokit({ auth: c.env.GH_TOKEN });

  const [owner, repo] = pkg.split('/');

  return (
    <RenderGeneratorFn
      generator={async function* getData() {
        const releases: any[] = [];

        let page = 1;

        while (true) {
          console.log('fetching page', page);
          const response = await octokit.request(
            'GET /repos/{owner}/{repo}/releases',
            {
              owner,
              repo,
              headers: {
                'X-GitHub-Api-Version': '2022-11-28',
              },
              page,
              per_page: 100,
            }
          );
          releases.push(...response.data);

          const releasesWithParsed = releases.map((release) => ({
            ...(release.name ? { parsed: parseReleaseName(release.name) } : {}),
            ...release,
          }));

          const grouped = groupBy(
            releasesWithParsed,
            (release) => release.parsed?.name || repo
          );

          const out = (
            <>
              {Object.entries(grouped).map(([name, releases]) => (
                <div key={name}>
                  <h2>{name}</h2>
                  {releases
                    .sort((a, b) => {
                      try {
                        return semiver(b.parsed?.version, a.parsed?.version);
                      } catch (e) {
                        console.log(
                          `failed to sort ${b.parsed?.version} and ${a.parsed?.version}`
                        );
                        return 0;
                      }
                    })
                    .map((release) => (
                      <p key={release.id}>
                        <a href={release.html_url} target='_blank'>
                          {release.parsed?.version ??
                            // if failed to parse?
                            // release.name ??
                            // maybe we should use tag name??
                            '(Failed to parse)'}
                        </a>
                      </p>
                    ))}
                </div>
              ))}
            </>
          );

          if (page < 5) {
            yield out;
            page += 1;
          } else {
            return out;
          }
        }
      }}
    />
  );
}
