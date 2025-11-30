interface OxiMailingConfig {
  apiUser: string;
  apiPassword: string;
  baseUrl?: string;
}

interface SendEmailParams {
  to: string | string[];
  from?: string;
  fromName?: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
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
  validated_at?: string;
}

interface EmailStatistics {
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

interface EmailEvent {
  id: string;
  email: string;
  event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface BlacklistEntry {
  email: string;
  reason: string;
  added_at: string;
}

export class OxiMailingService {
  private config: OxiMailingConfig;
  private authHeader: string;

  constructor(config: OxiMailingConfig) {
    this.config = {
      baseUrl: 'https://api.oximailing.com',
      ...config,
    };
    this.authHeader = `Basic ${btoa(`${config.apiUser}:${config.apiPassword}`)}`;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authHeader,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API request failed: ${response.status}`);
    }

    return data;
  }

  async sendEmail(params: SendEmailParams) {
    const payload: any = {
      From: params.from,
      FromName: params.fromName,
      Subject: params.subject,
      Recipients: (Array.isArray(params.to) ? params.to : [params.to]).map((email) => ({
        Email: email,
      })),
    };

    if (params.html) payload.Html = params.html;
    if (params.text) payload.Text = params.text;
    if (params.replyTo) payload.ReplyTo = params.replyTo;
    if (params.cc) payload.Cc = params.cc.map((email) => ({ Email: email }));
    if (params.bcc) payload.Bcc = params.bcc.map((email) => ({ Email: email }));

    return this.request('/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getBounces(limit = 100): Promise<Bounce[]> {
    return this.request(`/bounces?limit=${limit}`);
  }

  async removeBounce(email: string) {
    return this.request(`/bounces/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
  }

  async getSenders(): Promise<Sender[]> {
    return this.request('/senders');
  }

  async addSender(email: string) {
    return this.request('/senders', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async validateSender(email: string) {
    return this.request(`/senders/${encodeURIComponent(email)}/validate`, {
      method: 'POST',
    });
  }

  async getStatistics(dateFrom?: string, dateTo?: string): Promise<EmailStatistics> {
    let endpoint = '/statistics';
    const params = new URLSearchParams();

    if (dateFrom) params.append('from', dateFrom);
    if (dateTo) params.append('to', dateTo);

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.request(endpoint);
  }

  async getEvents(filters?: {
    email?: string;
    eventType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<EmailEvent[]> {
    let endpoint = '/events';
    const params = new URLSearchParams();

    if (filters?.email) params.append('email', filters.email);
    if (filters?.eventType) params.append('type', filters.eventType);
    if (filters?.dateFrom) params.append('from', filters.dateFrom);
    if (filters?.dateTo) params.append('to', filters.dateTo);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.request(endpoint);
  }

  async getBlacklist(): Promise<BlacklistEntry[]> {
    return this.request('/blacklists');
  }

  async addToBlacklist(email: string, reason: string) {
    return this.request('/blacklists', {
      method: 'POST',
      body: JSON.stringify({ email, reason }),
    });
  }

  async removeFromBlacklist(email: string) {
    return this.request(`/blacklists/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
  }

  async getHistory(limit = 50) {
    return this.request(`/history?limit=${limit}`);
  }
}

export function createOxiMailingClient(apiUser: string, apiPassword: string): OxiMailingService {
  return new OxiMailingService({ apiUser, apiPassword });
}
