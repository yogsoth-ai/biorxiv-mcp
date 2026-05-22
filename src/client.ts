const API_BASE = 'https://api.biorxiv.org';

export interface BiorxivError {
  error: string;
  status?: number;
  message?: string;
}

export class BiorxivClient {
  private lastRequestTime = 0;
  private minInterval = 100;

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minInterval) {
      await new Promise(r => setTimeout(r, this.minInterval - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  async getDetails(server: string, doi: string): Promise<unknown | BiorxivError> {
    const url = `${API_BASE}/details/${server}/${doi}/na/json`;
    return this.requestJson(url);
  }

  async fetchXml(url: string): Promise<string | null> {
    await this.rateLimit();
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  private async requestJson(url: string, retries = 3): Promise<unknown | BiorxivError> {
    await this.rateLimit();

    let lastError: BiorxivError = { error: 'unknown' };
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json' },
        });

        if (res.ok) return await res.json();

        if (res.status === 404) {
          return { error: 'not_found', status: 404, message: `Not found: ${url}` };
        }

        if (res.status === 429) {
          lastError = { error: 'rate_limited', status: 429 };
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
          continue;
        }

        if (res.status >= 500) {
          lastError = { error: 'api_error', status: res.status, message: await res.text().catch(() => '') };
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }
          return lastError;
        }

        return { error: 'api_error', status: res.status, message: await res.text().catch(() => '') };
      } catch (e: any) {
        lastError = { error: 'network_error', message: e.message };
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
      }
    }
    return lastError;
  }
}

export function isBiorxivError(v: unknown): v is BiorxivError {
  return typeof v === 'object' && v !== null && 'error' in v && typeof (v as any).error === 'string';
}
