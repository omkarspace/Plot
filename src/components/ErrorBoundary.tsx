"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center board-frame">
          <div className="text-6xl mb-4">⚠</div>
          <h2 className="text-flap-white text-lg uppercase tracking-[0.15em] font-[family-name:var(--font-board)] mb-2">
            Departure Board Error
          </h2>
          <p className="text-steel-dark text-sm uppercase tracking-wider font-[family-name:var(--font-board)] mb-4">
            Something went wrong. Please refresh the page.
          </p>
          <details className="text-left max-w-md text-xs text-steel-dark font-mono">
            <summary className="cursor-pointer mb-2">Error Details</summary>
            <pre className="whitespace-pre-wrap overflow-auto">{this.state.error?.message}</pre>
            {this.state.errorInfo?.componentStack && (
              <pre className="whitespace-pre-wrap overflow-auto mt-2">{this.state.errorInfo.componentStack}</pre>
            )}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}