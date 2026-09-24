import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <AlertTriangle size={28} />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              {this.props.fallbackTitle || 'Rendering Interrupted'}
            </h2>

            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              {this.props.fallbackMessage ||
                'A component encountered an issue during preview rendering. Narrofy has caught this to keep the application responsive.'}
            </p>

            {this.state.error && (
              <div className="text-left bg-zinc-950 border border-zinc-800 rounded-xl p-3 mb-6 overflow-x-auto text-[11px] font-mono text-rose-400 max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
              >
                <RefreshCw size={14} />
                <span>Recover View</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Home size={14} />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
