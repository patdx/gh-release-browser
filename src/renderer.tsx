import { jsxRenderer } from 'hono/jsx-renderer';

export const renderer = jsxRenderer(
  ({ children, title }) => {
    return (
      <html>
        <head>
          <meta name='viewport' content='width=device-width, initial-scale=1' />
          <link href='/static/style.css' rel='stylesheet' />
          <link href='/static/matcha.css' rel='stylesheet' />
          <title>{title}</title>
        </head>
        <body>{children}</body>
      </html>
    );
  },
  { stream: true }
);
