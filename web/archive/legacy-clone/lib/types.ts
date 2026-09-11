export type Acc = "PERIOD" | "YTD";
export type TabKey = "overview" | "detail" | "compare";

export interface WardRow {
  location_code: string;
  location_name: string;
  name_slug: string;
}

export interface PeriodRow {
  year: number;
  quarter: number | null;
  month: number | null;
  period_type: "YEAR" | "QUARTER" | "MONTH";
  n_ward_with_data: number | null;
  has_ward_data: boolean;
}

/** Khoá kỳ đã parse — chỉ dùng chuỗi, đúng như bundle gốc. */
export interface PeriodKey {
  year: string;
  quarter?: string;
  month?: string;
}

export interface ByWardRow {
  location_code: string;
  location_name: string;
  name_slug: string;
  amount: number;
}

export interface ByItemRow {
  name: string;
  amount: number;
}

export interface ByScopeRow {
  code: string;
  name: string;
  amount: number;
}

export interface ByWardScopeRow {
  location_code: string;
  location_name: string;
  code: string;
  name: string;
  amount: number;
}

export interface ByWardItemRow {
  location_code: string;
  location_name: string;
  name: string;
  amount: number;
}

export interface TrendRow {
  year: number;
  month: number;
  acc: Acc;
  amount: number;
}

export interface HeatmapRow {
  location_code: string;
  location_name: string;
  year: number;
  month: number;
  amount: number;
}

export interface KpiRow {
  item: string;
  acc: Acc;
  location_level: "city" | "ward";
  amount: number;
  n_locations: number;
}

export interface KpiCompare {
  current: KpiRow[];
  previous: KpiRow[];
}

export interface WaterfallBar {
  name: string;
  delta: number;
}

export interface WaterfallData {
  bars: WaterfallBar[];
  total_delta: number | null;
}

export interface TreemapData {
  parent: string;
  total: number | null;
  rows: ByItemRow[];
}

export interface CorrectionRow {
  location_name: string;
  report_item_name: string;
  old_amount: number;
  new_amount: number;
  version: number | string;
}

export interface IgnoredParam {
  param: string;
  value: string;
  reason: string;
}

/** Tham số gửi lên API. `ward` là mã 5 chữ số, không phải slug. */
export interface ApiParams {
  year?: string;
  quarter?: string;
  month?: string;
  acc?: Acc;
  item?: string;
  ward?: string | null;
  [k: string]: string | null | undefined;
}
