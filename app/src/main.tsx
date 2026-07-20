
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import { ErrorBoundary } from "./app/ErrorBoundary";
  import "./styles/index.css";

  // Browsers restore the last scroll position for a URL on their own by
  // default, which fights with the app's own scroll-to-top-on-navigate
  // logic and is why reopening the site could land mid-page (e.g. on
  // Hoteles) instead of at the top. Taking manual control here stops that.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
