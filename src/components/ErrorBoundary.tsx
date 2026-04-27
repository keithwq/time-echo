import React, { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper-base flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl text-ink-heavy mb-4">出现问题了</h1>
            <p className="text-lg text-ink-medium mb-6">
              应用遇到了一个错误。请刷新页面重试。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm transition-colors active:bg-opacity-80"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
