import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught client error:", error, errorInfo);
    // In production with Sentry, call Sentry.captureException(error, { extra: errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    try {
      window.history.pushState({}, "", "/");
    } catch {
      // ignore
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6 py-12">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-100 shadow-sm text-center">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-stone-900 mb-2">Something went wrong</h1>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              An unexpected error occurred while rendering this page. We've logged the incident and our engineering team has been notified.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Return to Homepage
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
