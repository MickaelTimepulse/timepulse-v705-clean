import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader, Zap, AlertCircle } from 'lucide-react';
import { testFFAConnection } from '../../lib/ffa-webservice';

interface FFAConnectionMonitorProps {
  autoTest?: boolean;
  showDetails?: boolean;
}

export default function FFAConnectionMonitor({ autoTest = false, showDetails = true }: FFAConnectionMonitorProps) {
  const [status, setStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [details, setDetails] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (autoTest) {
      handleTest();
    }
  }, [autoTest]);

  async function handleTest() {
    setTesting(true);
    setStatus('testing');
    setMessage('Test de connexion en cours...');
    setDetails(null);

    console.log('[FFAConnectionMonitor] Starting test...');

    try {
      const result = await testFFAConnection();

      console.log('[FFAConnectionMonitor] Test result:', result);

      if (result.connected) {
        setStatus('connected');
        setMessage(result.message);
        setDetails(result.details);
      } else {
        setStatus('error');
        setMessage(result.message);
        setDetails(result.details);
      }
    } catch (error) {
      console.error('[FFAConnectionMonitor] Test error:', error);
      setStatus('error');
      setMessage('Erreur lors du test : ' + (error as Error).message);
      setDetails({ error: (error as Error).message });
    } finally {
      setTesting(false);
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'testing':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'testing':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className={`flex items-start p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-center space-x-3 flex-1">
          {getStatusIcon()}
          <div className="flex-1">
            <p className="font-medium">Statut de connexion FFA</p>
            <p className="text-sm">{message || 'En attente de test'}</p>
            {testing && (
              <div className="mt-2 flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-xs">Test en cours...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDetails && details && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Détails techniques</h4>
          <pre className="text-xs text-gray-700 overflow-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}

      {status === 'idle' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Connexion non testée</p>
              <p>Cliquez sur "Tester" pour vérifier que vos identifiants FFA sont corrects et que le webservice est accessible.</p>
            </div>
          </div>
        </div>
      )}

      {status === 'connected' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Connexion réussie</p>
              <p>
                Votre système est connecté au webservice FFA. Les licences pourront être vérifiées automatiquement lors des inscriptions.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">Erreur de connexion</p>
              <p className="mb-2">
                Impossible de se connecter au webservice FFA. Vérifiez :
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Que vos identifiants SIFFA (UID/MDP) sont corrects</li>
                <li>Que votre compte est activé sur le SIFFA</li>
                <li>Que vous êtes référencé comme société de chronométrage</li>
                <li>Que le webservice FFA est accessible</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
