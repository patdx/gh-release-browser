import { jsxRenderer } from "hono/jsx-renderer";
import css from "./matcha.css?url";

export const renderer = jsxRenderer(
  ({ children, title }) => {
    return (
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link href={css} rel="stylesheet" />
          <title>{title}</title>
        </head>
        <body>{children}</body>
      </html>
    );
  },
  { stream: true }
);
