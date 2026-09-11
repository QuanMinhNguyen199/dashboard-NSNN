export type Level = 'NSNN' | 'NSTW' | 'NSDP';
export interface OverviewFilters { year: number; periodType: 'MONTH' | 'QUARTER'; period: number; acc: 'PERIOD' | 'YTD'; level: Level; indicator: string; }
export interface AmountRow { id: string; name: string; amount: number; previous: number | null; }
export interface TrendPoint { month: string; current: number | null; previous: number | null; }
export interface OverviewData {
  meta: { source: 'api' | 'mcp' | 'fixture' | 'mock'; unit: 'tỷ đồng'; scope: string; covered: number; total: number; periodLabel: string; level: Level; derived: boolean };
  period: AmountRow; ytd: AmountRow; total: number; previous: number;
  sources: AmountRow[]; items: AmountRow[]; wards: AmountRow[];
  budgets: AmountRow[]; trend: TrendPoint[];
}
export type Resource<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'empty' } | { status: 'ready' | 'partial'; data: T };
interface WidgetBase { id: string; title: string; colSpan: 12 | 6 | 4 | 3; isVisible?: boolean; }
export type DashboardWidgetConfig = WidgetBase & (
  { type: 'kpi'; data: OverviewData } |
  { type: 'trend'; data: TrendPoint[] } |
  { type: 'rank' | 'structure' | 'budget' | 'growth' | 'waterfall'; data: AmountRow[] }
);
export interface OverviewDataProvider { getOverview(filters: OverviewFilters, signal: AbortSignal): Promise<OverviewData | null>; }
export interface DashboardEnvelope {
  schemaVersion: '1.0';
  requestId: string;
  source: 'api' | 'mcp' | 'fixture' | 'mock';
  generatedAt: string;
  filters: OverviewFilters;
  widgets: DashboardWidgetConfig[];
}
export interface OverviewResponseEnvelope {
  schemaVersion: '1.0';
  requestId: string;
  source: 'api' | 'mcp' | 'fixture' | 'mock';
  generatedAt: string;
  filters: OverviewFilters;
  data: OverviewData;
}
