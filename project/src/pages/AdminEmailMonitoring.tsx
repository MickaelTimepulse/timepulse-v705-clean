import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Activity,
  TrendingUp,
  Users,
  Shield,
  BarChart3,
  MousePointerClick,
  Eye,
  UserX,
  Trash2,
  Plus,
} from 'lucide-react';
import AdminLayout from '../components/Admin/AdminLayout';
import { supabase } from '../lib/supabase';

interface EmailLog {
  id: string;
  to_email: string;
  from_email: string;
  subject: string;
  status: 'success' | 'failed' | 'pending';
  error_message?: string;
  message_id?: string;
  created_at: string;
  sent_at?: string;
}

interface Bounce {
  email: string;
  bounce_type: string;
  created_at: string;
  message?: string;
}

interface Sender {
  email: string;
  status: 'pending' | 'validated' | 'rejected';
  created_at: string;
}

interface Statistics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

interface BlacklistEntry {
  email: string;
  reason: string;
  added_at: string;
}

interface EmailEvent {
  email: string;
  event_type: string;
  timestamp: string;
}

export default function AdminEmailMonitoring() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Test OxiMailing - Timepulse');
  const [testMessage, setTestMessage] = useState('Ceci est un email de test envoyé depuis le monitoring Timepulse.');
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, pending: 0 });

  const [bounces, setBounces] = useState<Bounce[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [newSenderEmail, setNewSenderEmail] = useState('');
  const [newBlacklistEmail, setNewBlacklistEmail] = useState('');
  const [newBlacklistReason, setNewBlacklistReason] = useState('');

  const [activeTab, setActiveTab] = useState<'logs' | 'bounces' | 'senders' | 'statistics' | 'blacklist' | 'events'>('logs');

  useEffect(() => {
    loadLogs();
    checkApiStatus();
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab !== 'logs') {
      loadAdditionalData();
    }
  }, [activeTab]);

  const checkApiStatus = async () => {
    setApiStatus('checking');
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'OPTIONS',
      });
      setApiStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .rpc('admin_get_email_logs', { log_limit: 50 });

      if (error) throw error;

      if (data) {
        setLogs(data.logs || []);
        setStats({
          total: data.stats?.total || 0,
          success: data.stats?.success || 0,
          failed: data.stats?.failed || 0,
          pending: data.stats?.pending || 0
        });
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdditionalData = async () => {
    setLoadingData(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const headers = {
        'Authorization': `Bearer ${session.session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      };

      if (activeTab === 'bounces') {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oximailing-api`,
          {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getBounces' }),
          }
        );
        const data = await response.json();
        if (data.success) setBounces(data.data || []);
      } else if (activeTab === 'senders') {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oximailing-api`,
          {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getSenders' }),
          }
        );
        const data = await response.json();
        if (data.success) setSenders(data.data || []);
      } else if (activeTab === 'statistics') {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oximailing-api`,
          {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getStatistics' }),
          }
        );
        const data = await response.json();
        if (data.success) setStatistics(data.data);
      } else if (activeTab === 'blacklist') {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oximailing-api`,
          {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getBlacklist' }),
          }
        );
        const data = await response.json();
        if (data.success) setBlacklist(data.data || []);
      } else if (activeTab === 'events') {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oximailing-api`,
          {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getEvents', limit: 100 }),
          }
        );
        const data = await response.json();
        if (data.success) setEvents(data.data || []);
      }
    } catch (error) {
      console.error('Error loading additional data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const sendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTestResult(null);

    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session.session) {
        setTestResult({ success: false, message: 'Vous devez être connecté' });
        setSending(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          to: testEmail,
          subject: testSubject,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
                .badge { display: inline-block; padding: 8px 16px; background: #10b981; color: white; border-radius: 20px; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Test de l'API OxiMailing</h1>
                </div>
                <div class="content">
                  <p><span class="badge">SUCCÈS</span></p>
                  <p>Si vous recevez cet email, cela signifie que l'intégration OxiMailing fonctionne parfaitement !</p>
                  <p>${testMessage}</p>
                  <p>Date d'envoi : ${new Date().toLocaleString('fr-FR')}</p>
                  <p>Cordialement,<br>L'équipe Timepulse</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Timepulse - Monitoring des emails</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `Test de l'API OxiMailing\n\n${testMessage}\n\nDate d'envoi : ${new Date().toLocaleString('fr-FR')}\n\nCordialement,\nL'équipe Timepulse`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: `Email envoyé avec succès ! ID: ${data.messageId || 'N/A'}`,
        });
        setTimeout(() => loadLogs(), 2000);
      } else {
        setTestResult({
          success: false,
          message: `Erreur: ${data.error || 'Échec de l\'envoi'}`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setSending(false);
    }
  };

  const removeBounce = async (email: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oximailing-api`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ action: 'removeBounce', email }),
        }
      );

      if (response.ok) {
        setBounces(bounces.filter(b => b.email !== email));
      }
    } catch (error) {
      console.error('Error removing bounce:', error);
    }
  };

  const addSender = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oximailing-api`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ action: 'addSender', email: newSenderEmail }),
        }
      );

      if (response.ok) {
        setNewSenderEmail('');
        loadAdditionalData();
      }
    } catch (error) {
      console.error('Error adding sender:', error);
    }
  };

  const addToBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oximailing-api`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            action: 'addToBlacklist',
            email: newBlacklistEmail,
            reason: newBlacklistReason,
          }),
        }
      );

      if (response.ok) {
        setNewBlacklistEmail('');
        setNewBlacklistReason('');
        loadAdditionalData();
      }
    } catch (error) {
      console.error('Error adding to blacklist:', error);
    }
  };

  const removeFromBlacklist = async (email: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oximailing-api`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ action: 'removeFromBlacklist', email }),
        }
      );

      if (response.ok) {
        setBlacklist(blacklist.filter(b => b.email !== email));
      }
    } catch (error) {
      console.error('Error removing from blacklist:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'validated':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-green-100 text-green-800',
      validated: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'opened':
        return <Eye className="w-4 h-4" />;
      case 'clicked':
        return <MousePointerClick className="w-4 h-4" />;
      case 'bounced':
        return <XCircle className="w-4 h-4" />;
      case 'unsubscribed':
        return <UserX className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Monitoring des Emails</h1>
            <p className="text-gray-600 mt-2">Surveillance complète de l'API OxiMailing</p>
          </div>
          <button
            onClick={() => {
              checkApiStatus();
              loadLogs();
              loadAdditionalData();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Statut API</p>
                <div className="flex items-center gap-2 mt-2">
                  {apiStatus === 'checking' && <Activity className="w-5 h-5 text-blue-600 animate-pulse" />}
                  {apiStatus === 'online' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {apiStatus === 'offline' && <XCircle className="w-5 h-5 text-red-600" />}
                  <p className="text-lg font-bold text-gray-900 capitalize">
                    {apiStatus === 'checking' ? 'Vérification...' : apiStatus === 'online' ? 'En ligne' : 'Hors ligne'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réussis</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.success}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Échoués</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { key: 'logs', label: 'Test & Historique', icon: Send },
                { key: 'statistics', label: 'Statistiques', icon: BarChart3 },
                { key: 'bounces', label: 'Bounces', icon: AlertCircle },
                { key: 'senders', label: 'Expéditeurs', icon: Users },
                { key: 'blacklist', label: 'Blacklist', icon: Shield },
                { key: 'events', label: 'Événements', icon: Activity },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Send className="w-5 h-5" />
                    Test d'envoi d'email
                  </h2>
                  <form onSubmit={sendTestEmail} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email destinataire
                      </label>
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="test@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sujet
                      </label>
                      <input
                        type="text"
                        value={testSubject}
                        onChange={(e) => setTestSubject(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {testResult && (
                      <div
                        className={`p-4 rounded-lg ${
                          testResult.success
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {testResult.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                            {testResult.message}
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Envoyer l'email de test
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Historique des envois</h3>
                  <div className="overflow-x-auto">
                    {loading ? (
                      <div className="p-8 text-center text-gray-500">Chargement...</div>
                    ) : logs.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        Aucun email envoyé pour le moment
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Statut
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Destinataire
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Sujet
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Message ID
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(log.status)}
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                                      log.status
                                    )}`}
                                  >
                                    {log.status}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.to_email}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                {log.subject}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(log.created_at).toLocaleString('fr-FR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                {log.message_id ? (
                                  <span className="text-xs">{log.message_id.substring(0, 20)}...</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'statistics' && (
              <div>
                {loadingData ? (
                  <div className="p-8 text-center text-gray-500">Chargement des statistiques...</div>
                ) : statistics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-blue-900">Emails envoyés</p>
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-blue-900">{statistics.sent}</p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-green-900">Emails délivrés</p>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-green-900">{statistics.delivered}</p>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-orange-900">Taux de délivrabilité</p>
                          <TrendingUp className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-orange-900">
                          {statistics.sent > 0
                            ? ((statistics.delivered / statistics.sent) * 100).toFixed(1)
                            : 0}
                          %
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          Engagement
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Emails ouverts</span>
                            <span className="text-lg font-bold text-gray-900">{statistics.opened}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Taux d'ouverture</span>
                            <span className="text-lg font-bold text-blue-600">
                              {(statistics.open_rate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Clics</span>
                            <span className="text-lg font-bold text-gray-900">{statistics.clicked}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Taux de clic</span>
                            <span className="text-lg font-bold text-green-600">
                              {(statistics.click_rate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Problèmes
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Bounces</span>
                            <span className="text-lg font-bold text-gray-900">{statistics.bounced}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Taux de bounce</span>
                            <span className="text-lg font-bold text-red-600">
                              {(statistics.bounce_rate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Désabonnements</span>
                            <span className="text-lg font-bold text-gray-900">
                              {statistics.unsubscribed}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">Aucune statistique disponible</div>
                )}
              </div>
            )}

            {activeTab === 'bounces' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Liste des bounces</h3>
                  <span className="text-sm text-gray-500">{Array.isArray(bounces) ? bounces.length : 0} entrées</span>
                </div>
                {loadingData ? (
                  <div className="p-8 text-center text-gray-500">Chargement des bounces...</div>
                ) : !Array.isArray(bounces) || bounces.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Aucun bounce enregistré</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Array.isArray(bounces) && bounces.map((bounce, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{bounce.email}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                {bounce.bounce_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(bounce.created_at).toLocaleString('fr-FR')}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => removeBounce(bounce.email)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'senders' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <form onSubmit={addSender} className="flex gap-2">
                    <input
                      type="email"
                      value={newSenderEmail}
                      onChange={(e) => setNewSenderEmail(e.target.value)}
                      placeholder="Ajouter un expéditeur..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </form>
                </div>

                {loadingData ? (
                  <div className="p-8 text-center text-gray-500">Chargement des expéditeurs...</div>
                ) : !Array.isArray(senders) || senders.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Aucun expéditeur configuré</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {senders.map((sender, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{sender.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Ajouté le {new Date(sender.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(sender.status)}
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                                sender.status
                              )}`}
                            >
                              {sender.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'blacklist' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <form onSubmit={addToBlacklist} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newBlacklistEmail}
                        onChange={(e) => setNewBlacklistEmail(e.target.value)}
                        placeholder="Email à bloquer..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />
                      <input
                        type="text"
                        value={newBlacklistReason}
                        onChange={(e) => setNewBlacklistReason(e.target.value)}
                        placeholder="Raison..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Shield className="w-4 h-4" />
                        Bloquer
                      </button>
                    </div>
                  </form>
                </div>

                {loadingData ? (
                  <div className="p-8 text-center text-gray-500">Chargement de la blacklist...</div>
                ) : !Array.isArray(blacklist) || blacklist.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Aucun email bloqué</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Raison
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Array.isArray(blacklist) && blacklist.map((entry, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{entry.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{entry.reason}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(entry.added_at).toLocaleString('fr-FR')}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => removeFromBlacklist(entry.email)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Débloquer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Événements récents</h3>
                  <span className="text-sm text-gray-500">{Array.isArray(events) ? events.length : 0} événements</span>
                </div>
                {loadingData ? (
                  <div className="p-8 text-center text-gray-500">Chargement des événements...</div>
                ) : !Array.isArray(events) || events.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Aucun événement enregistré</div>
                ) : (
                  <div className="space-y-2">
                    {Array.isArray(events) && events.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getEventIcon(event.event_type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{event.email}</p>
                            <p className="text-sm text-gray-500 capitalize">{event.event_type}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
