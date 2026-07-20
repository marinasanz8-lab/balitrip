import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Catches render-time crashes so they surface as a visible message instead
 * of silently blanking the page — local data is untouched either way since
 * every edit is already written to localStorage before anything else. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("Uncaught render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-lg font-semibold">Algo ha fallado</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Tus datos siguen guardados en este dispositivo — nada se ha perdido. Prueba a recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Recargar
          </button>
          <p className="text-[10px] text-muted-foreground/60 max-w-md break-words">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
