import { mockOverviewProvider } from './data';
import type { OverviewData, OverviewDataProvider } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Runtime boundary for untrusted API/MCP JSON. Components never receive raw payloads. */
export function validateOverviewData(value: unknown): OverviewData {
  if (!isRecord(value) || !isRecord(value.meta) || !Array.isArray(value.sources) ||
      !Array.isArray(value.items) || !Array.isArray(value.wards) || !Array.isArray(value.trend) ||
      !isRecord(value.period) || !isRecord(value.ytd)) {
    throw new Error('Payload dashboard không đúng schema 1.0.');
  }
  const finite = (number: unknown) => typeof number === 'number' && Number.isFinite(number);
  const validRow = (row: unknown) => isRecord(row) && typeof row.id === 'string' && typeof row.name === 'string' && finite(row.amount) && (row.previous === null || finite(row.previous));
  if (![value.period, value.ytd, ...value.sources, ...value.items, ...value.wards, ...(Array.isArray(value.budgets) ? value.budgets : [])].every(validRow)) throw new Error('Payload chứa dòng số liệu không hợp lệ.');
  const sources = ['api', 'mcp', 'fixture', 'mock'];
  const levels = ['NSNN', 'NSTW', 'NSDP'];
  if (!sources.includes(String(value.meta.source)) || value.meta.unit !== 'tỷ đồng' || typeof value.meta.scope !== 'string' || !finite(value.meta.covered) || !finite(value.meta.total) || typeof value.meta.periodLabel !== 'string' || !levels.includes(String(value.meta.level)) || typeof value.meta.derived !== 'boolean') throw new Error('Metadata dashboard không đúng schema 1.0.');
  if (!finite(value.total) || !finite(value.previous) || !Array.isArray(value.budgets) || !value.trend.every(point => isRecord(point) && typeof point.month === 'string' && (point.current === null || finite(point.current)) && (point.previous === null || finite(point.previous)))) throw new Error('Chuỗi thời gian dashboard không đúng schema 1.0.');
  return value as unknown as OverviewData;
}

class JsonOverviewProvider implements OverviewDataProvider {
  constructor(private readonly endpoint: string) {}
  async getOverview(filters: Parameters<OverviewDataProvider['getOverview']>[0], signal: AbortSignal) {
    const response = await fetch(this.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ schemaVersion: '1.0', filters }), signal });
    if (!response.ok) throw new Error(`Dashboard provider trả về HTTP ${response.status}.`);
    const payload: unknown = await response.json();
    let rawData = payload;
    let envelopeSource: OverviewData['meta']['source'] | null = null;
    if (isRecord(payload) && 'data' in payload) {
      const allowedSources = ['api', 'mcp', 'fixture', 'mock'];
      if (payload.schemaVersion !== '1.0' || typeof payload.requestId !== 'string' || !allowedSources.includes(String(payload.source)) || typeof payload.generatedAt !== 'string' || Number.isNaN(Date.parse(payload.generatedAt)) || !isRecord(payload.filters)) {
        throw new Error('Envelope dashboard không đúng schema 1.0.');
      }
      envelopeSource = payload.source as OverviewData['meta']['source'];
      rawData = payload.data;
    }
    const data = validateOverviewData(rawData);
    const source: OverviewData['meta']['source'] = envelopeSource ?? (this.endpoint.startsWith('/mcp/') ? 'mcp' : 'api');
    return { ...data, meta: { ...data.meta, source } };
  }
}

export function createOverviewProvider(): OverviewDataProvider {
  const mode = import.meta.env.VITE_DASHBOARD_PROVIDER;
  if (mode === 'api') return new JsonOverviewProvider('/api/overview');
  if (mode === 'mcp') return new JsonOverviewProvider('/mcp/dashboard/overview');
  return mockOverviewProvider;
}

export const overviewProvider = createOverviewProvider();
