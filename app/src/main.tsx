
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import { ErrorBoundary } from "./app/ErrorBoundary";
  import "./styles/index.css";

  // Browsers restore the last scroll position for a URL on their own by
  // default, which fights with the app's own scroll-to-top-on-navigate
  // logic and is why reopening the site could land mid-page (e.g. on
  // Hoteles) instead of at the top. Taking manual control here stops that.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  // On iOS/mobile Safari, switching away from the tab (another app, the
  // tab switcher, a swipe-back gesture) and returning to it usually restores
  // the page instantly from the back/forward cache instead of reloading it —
  // React never remounts, so the scroll-to-top-on-navigate effect never
  // re-runs, and the page reappears exactly as scrolled before. This is the
  // likely cause of "every time I open it, it's on Hoteles": force the top
  // whenever a bfcache restore happens.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) window.scrollTo(0, 0);
  });

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
