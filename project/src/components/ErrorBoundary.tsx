import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-8 py-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Une erreur est survenue
                  </h1>
                  <p className="text-red-100 mt-1">
                    Ne vous inquiétez pas, vos données sont sauvegardées
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">
                  Une erreur inattendue s'est produite. Vous pouvez essayer de :
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition shadow-lg"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="font-semibold">Réessayer</span>
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="font-semibold">Recharger la page</span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
                >
                  <Home className="w-5 h-5" />
                  <span className="font-semibold">Retour à l'accueil</span>
                </button>
              </div>

              {/* Error Details */}
              {this.state.error && (
                <details className="mt-6" open>
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 mb-2">
                    Détails techniques
                  </summary>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-red-600 font-mono mb-2">
                      <strong>Erreur :</strong> {this.state.error.message}
                    </div>
                    <div className="text-xs text-red-600 font-mono mb-2">
                      <strong>Stack :</strong>
                      <pre className="mt-1 whitespace-pre-wrap overflow-auto max-h-48">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div className="text-xs text-gray-600 font-mono overflow-auto max-h-48">
                        <strong>Component Stack :</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Help Text */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Astuce :</strong> Si le problème persiste, essayez de vous déconnecter puis de vous reconnecter.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
