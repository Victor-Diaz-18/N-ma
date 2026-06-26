import React from "react";
import { NBButton, NBCard } from "./nb";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-[#F5F1E4] grain flex items-center justify-center px-4">
      <NBCard className="p-8 max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 mx-auto nb-border bg-[#FF6B6B] flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
        </div>
        <h2 className="font-display font-black text-2xl uppercase text-[#1F5A2A]">
          Algo salió mal
        </h2>
        <p className="text-[#3E5A3E] text-sm">
          {error?.message || "Ha ocurrido un error inesperado."}
        </p>
        <div className="flex gap-2 justify-center">
          <NBButton variant="dark" onClick={onRetry}>
            <RefreshCw className="inline w-4 h-4 mr-1" /> Reintentar
          </NBButton>
          <NBButton variant="ghost" onClick={() => window.location.reload()}>
            Recargar página
          </NBButton>
        </div>
      </NBCard>
    </div>
  );
}

export default ErrorBoundary;
