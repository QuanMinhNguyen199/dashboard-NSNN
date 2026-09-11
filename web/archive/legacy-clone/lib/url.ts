import { parsePeriodToken, periodToken } from "./periods";
import type { Acc, IgnoredParam, TabKey } from "./types";
import type { OverviewFilters } from "../overview/types";

/** `Po` — slug URL → chuỗi chỉ tiêu gửi lên API. */
export const ITEM_BY_SLUG: Record<string, string> = Object.assign(Object.create(null), {
  "tong-so": "TỔNG SỐ",
  "thu-nsnn": "THU NGÂN SÁCH NHÀ NƯỚC",
  "tong-so-tru-hoan-thue": "TỔNG SỐ (Đã loại trừ hoàn thuế GTGT)",
});

/** `a2` — ánh xạ ngược. */
export const SLUG_BY_ITEM: Record<string, string> = Object.assign(
  Object.create(null),
  Object.fromEntries(Object.entries(ITEM_BY_SLUG).map(([slug, item]) => [item, slug])),
);

/** `u2` — ba lựa chọn của ô Chỉ tiêu, nhãn khác giá trị gửi API. */
export const ITEM_OPTIONS = [
  { value: ITEM_BY_SLUG["tong-so"], label: "TỔNG SỐ" },
  { value: ITEM_BY_SLUG["thu-nsnn"], label: "THU NGÂN SÁCH NHÀ NƯỚC" },
  { value: ITEM_BY_SLUG["tong-so-tru-hoan-thue"], label: "TỔNG SỐ (trừ hoàn thuế GTGT)" },
];

const KNOWN = new Set([
  "year",
  "quarter",
  "month",
  "acc",
  "item",
  "ward",
  "location",
  "tab",
  "cmpa",
  "cmpb",
  "district",
  "periodType",
  "period",
  "level",
  "ovIndicator",
]);

/** `Cz` — gợi ý cho tên tham số viết sai. */
const ALIASES: Record<string, string> = Object.assign(Object.create(null), {
  quater: "quarter",
  quarters: "quarter",
  months: "month",
  years: "year",
  wards: "ward",
  ward_id: "ward",
  ward_code: "ward",
  tabs: "tab",
});

/** `dP` — chuẩn hoá slug: thường hoá, `-` thành `_`. */
export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/-/g, "_");
}

export interface ParsedUrl {
  ignored: IgnoredParam[];
  year?: string;
  quarter?: string;
  month?: string;
  acc?: Acc;
  item?: string;
  district?: string;
  wardCode?: string;
  wardSlug?: string;
  tab?: TabKey;
  cmpa?: string;
  cmpb?: string;
}

/** `jz` — parser URL, giữ nguyên từng thông điệp cảnh báo. */
export function parseUrl(search: string): ParsedUrl {
  const params = new URLSearchParams(search.split("#")[0]);
  const out: ParsedUrl = { ignored: [] };
  const ignore = (param: string, value: string, reason: string) =>
    out.ignored.push({ param, value, reason });

  for (const key of new Set(params.keys())) {
    if (KNOWN.has(key)) {
      if (params.getAll(key).length > 1)
        ignore(
          key,
          params.getAll(key).slice(1).join(", "),
          "tham số lặp lại, chỉ lấy giá trị đầu tiên",
        );
    } else {
      const lower = key.toLowerCase();
      const guess = ALIASES[lower] ?? (KNOWN.has(lower) ? lower : undefined);
      ignore(
        key,
        params.get(key) ?? "",
        guess
          ? `không nhận ra tên tham số (ý bạn là "${guess}"?)`
          : "không nhận ra tên tham số",
      );
    }
  }

  const year = params.get("year");
  if (year !== null && year.trim() !== "") {
    if (/^\d{4}$/.test(year.trim())) out.year = year.trim();
    else ignore("year", year, "phải là năm 4 chữ số");
  }

  const quarter = params.get("quarter");
  if (quarter !== null && quarter.trim() !== "") {
    const m = /^q?([1-4])$/i.exec(quarter.trim());
    if (m) out.quarter = m[1];
    else ignore("quarter", quarter, "phải là 1..4 (hoặc q1..q4)");
  }

  const month = params.get("month");
  if (month !== null && month.trim() !== "") {
    const m = /^(0?[1-9]|1[0-2])$/.exec(month.trim());
    if (m) out.month = String(Number(m[1]));
    else ignore("month", month, "phải là 1..12");
  }

  if (out.month && out.quarter && String(Math.ceil(Number(out.month) / 3)) !== out.quarter) {
    ignore(
      "quarter",
      out.quarter,
      `tháng ${out.month} không thuộc quý ${out.quarter}, đã bỏ quý`,
    );
    delete out.quarter;
  }

  const acc = params.get("acc");
  if (acc !== null && acc.trim() !== "") {
    const upper = acc.trim().toUpperCase();
    if (upper === "PERIOD" || upper === "YTD") out.acc = upper;
    else ignore("acc", acc, "chỉ nhận PERIOD hoặc YTD");
  }

  const item = params.get("item");
  if (item !== null && item.trim() !== "") {
    const raw = item.trim();
    if (ITEM_BY_SLUG[raw.toLowerCase()]) out.item = ITEM_BY_SLUG[raw.toLowerCase()];
    else if (SLUG_BY_ITEM[raw]) out.item = raw;
    else
      ignore(
        "item",
        item,
        `chỉ nhận ${Object.keys(ITEM_BY_SLUG).join(" | ")} (hoặc chuỗi tiếng Việt gốc)`,
      );
  }

  const district = params.get("district")?.trim();
  if (district) {
    if (/^[a-zA-Z0-9_-]+$/.test(district)) out.district = slugify(district);
    else ignore("district", district, "mã hoặc slug quận/huyện không hợp lệ");
  }

  const ward = params.get("ward")?.trim() || null;
  const location = params.get("location")?.trim() || null;
  if (ward !== null && location !== null)
    ignore("location", location, 'trùng với tham số "ward", đã bỏ qua');
  const usedParam = ward !== null ? "ward" : "location";
  const value = ward ?? location;
  if (value !== null) {
    if (/^\d{5}$/.test(value)) out.wardCode = value;
    else if (/^[a-zA-Z0-9_-]+$/.test(value)) out.wardSlug = slugify(value);
    else ignore(usedParam, value, "phải là mã 5 chữ số hoặc slug tên phường/xã");
  }

  const tab = params.get("tab");
  if (tab !== null && tab.trim() !== "") {
    const lower = tab.trim().toLowerCase();
    if (lower === "detail" || lower === "overview" || lower === "compare")
      out.tab = lower as TabKey;
    else ignore("tab", tab, "chỉ nhận detail, overview hoặc compare");
  }

  const readCmp = (name: "cmpa" | "cmpb") => {
    const raw = params.get(name)?.trim() || null;
    if (raw === null) return undefined;
    const parsed = parsePeriodToken(raw);
    if (parsed) return periodToken(parsed);
    ignore(name, raw, "phải là dạng 2024q1, 2025m3 hoặc 2024y");
    return undefined;
  };
  const cmpa = readCmp("cmpa");
  const cmpb = readCmp("cmpb");
  if (cmpa) out.cmpa = cmpa;
  if (cmpb) out.cmpb = cmpb;

  return out;
}

export interface SerializeInput {
  year: string;
  quarter: string;
  month: string;
  acc: Acc;
  item: string;
  ward: string | null;
  district: string | null;
  tab: TabKey;
  cmpa: string;
  cmpb: string;
  overview?: OverviewFilters;
}

/** `Nz` — serialize; `ward` xuất ra slug nối bằng dấu `-`. */
export function serializeUrl(
  state: SerializeInput,
  slugOf: (code: string) => string | undefined,
): string {
  const params = new URLSearchParams();
  if (state.year) params.set("year", state.year);
  if (state.quarter) params.set("quarter", state.quarter);
  if (state.month) params.set("month", state.month);
  params.set("acc", state.acc);
  params.set("item", SLUG_BY_ITEM[state.item] ?? state.item);
  if (state.ward) {
    const slug = slugOf(state.ward);
    params.set("ward", (slug ?? state.ward).replace(/_/g, "-"));
  }
  if (state.district) params.set("district", state.district.replace(/_/g, "-"));
  params.set("tab", state.tab);
  if (state.cmpa) params.set("cmpa", state.cmpa);
  if (state.cmpb) params.set("cmpb", state.cmpb);
  if (state.overview) {
    params.set("periodType", state.overview.periodType);
    params.set("period", String(state.overview.period));
    params.set("level", state.overview.level);
    params.set("ovIndicator", state.overview.indicator);
  }
  return `?${params.toString()}`;
}
