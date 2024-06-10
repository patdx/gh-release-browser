import type { TimingVariables } from 'hono/timing';

type Variables = TimingVariables;
type Bindings = { GH_TOKEN: string };

export type HonoContext = {
  Variables: Variables;
  Bindings: Bindings;
};
