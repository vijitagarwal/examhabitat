import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ExamAuthProvider } from '@/components/exam-dashboard/bridge/useExamAuth';
import { Toaster } from 'sonner';
import { appConfig } from '@/lib/site-config';

import appCss from '../styles.css?url';
import examCss from '../components/exam-dashboard/exam-styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'theme-color',
        content: appConfig.themeColor,
      },
      {
        name: 'description',
        content: appConfig.description,
      },
      {
        property: 'og:title',
        content: appConfig.name,
      },
      {
        property: 'og:description',
        content: appConfig.description,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        title: `${appConfig.name} — ${appConfig.headline}`,
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'stylesheet',
        href: examCss,
      },
      {
        rel: 'manifest',
        href: '/site.webmanifest',
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <ExamAuthProvider>
          {children}
          <Toaster position="bottom-right" theme="dark" />
        </ExamAuthProvider>
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  );
}
