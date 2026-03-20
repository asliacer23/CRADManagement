import React from "react";
import { AlertCircle } from "lucide-react";

type PageErrorBoundaryProps = {
  children: React.ReactNode;
};

type PageErrorBoundaryState = {
  hasError: boolean;
};

export class PageErrorBoundary extends React.Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): PageErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Page render failed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <AlertCircle size={36} className="mx-auto mb-3 text-destructive" />
          <p className="text-sm font-semibold text-foreground">This page failed to load</p>
          <p className="mt-1 text-xs text-muted-foreground">Try refreshing the page. If it keeps happening, we need to inspect that route's data or render logic.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
