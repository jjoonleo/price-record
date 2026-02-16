import { type ReactNode } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

type RootProps = {
  children: ReactNode;
};

const registerServiceWorkerScript = `(() => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[PWA] Service worker registration failed', error);
    });
  });
})();`;

const backgroundStyle = `body{background-color:#EAF5FF;}`;

export default function Root({ children }: RootProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta content="width=device-width, initial-scale=1, shrink-to-fit=no" name="viewport" />
        <meta content="#12243B" name="theme-color" />
        <link href="/manifest.json" rel="manifest" />
        <link href="/icons/apple-touch-icon.png" rel="apple-touch-icon" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: backgroundStyle }} />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: registerServiceWorkerScript }} />
      </body>
    </html>
  );
}
