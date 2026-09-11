import type { DomesticGroupId, SourceCode } from "./catalog";

/**
 * ID công khai trên URL. Đây là các opaque ID cố định, không mang tên nghiệp vụ
 * và không đổi giữa hai lần tải, để deep-link và bookmark luôn dùng lại được.
 */
const SOURCE_URL_ID: Record<SourceCode, string> = {
  domestic: "src_k7m2qx",
  "import-export": "src_v4n8pc",
  "crude-oil": "src_t9d3wf",
  other: "src_h6r1zb",
};

const GROUP_URL_ID: Record<DomesticGroupId, string> = {
  sxkd: "grp_p8x4kd",
  "nha-dat": "grp_m2q7vn",
  "phi-le-phi-khac": "grp_c5t9hs",
};

const SOURCE_FROM_URL = new Map(Object.entries(SOURCE_URL_ID).map(([key, value]) => [value, key as SourceCode]));
const GROUP_FROM_URL = new Map(Object.entries(GROUP_URL_ID).map(([key, value]) => [value, key as DomesticGroupId]));

export const sourceUrlId = (source: SourceCode) => SOURCE_URL_ID[source];
export const groupUrlId = (group: DomesticGroupId) => GROUP_URL_ID[group];

/** Nhận cả slug cũ để bookmark cũ tiếp tục mở được rồi được canonicalize. */
export function sourceFromUrl(value: string | null, fallback: SourceCode): SourceCode {
  if (!value) return fallback;
  return SOURCE_FROM_URL.get(value) ?? (value in SOURCE_URL_ID ? value as SourceCode : fallback);
}

export function groupFromUrl(value: string | null, fallback: DomesticGroupId): DomesticGroupId {
  if (!value) return fallback;
  return GROUP_FROM_URL.get(value) ?? (value in GROUP_URL_ID ? value as DomesticGroupId : fallback);
}
