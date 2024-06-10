// @vercel/next@4.2.12
// vercel@34.2.0
// @vercel/static-build@2.5.9

type ReleaseSegments = {
  name?: string;
  version?: string;
};

export function parseReleaseName(originalName: string): ReleaseSegments {
  const segments = originalName.split('@');
  const version = segments.pop();
  const name = segments.join('@');

  return {
    name,
    version,
  };
}
