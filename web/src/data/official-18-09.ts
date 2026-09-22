import source from "./official-18-09.json";
import { TAX_OFFICE_ENTITY_BY_ID } from "@/domain/tms";

export interface OfficialLocationPlan {
  id: string;
  name: string;
  plan: number;
  planExcludingLandUse: number;
  components: Record<string, number>;
}

interface OfficialData18September {
  meta: {
    sourceSet: string;
    generatedAt: string;
    containsTaxpayerIdentity: boolean;
    unit: "VND";
  };
  city2026: {
    plan: number;
    augustEstimate: number;
    ytdAugustEstimate: number;
    augustActual: number;
    ytdAugustActual: number;
  };
  cityHistory: Array<{
    year: number;
    plan?: number;
    actual?: number;
    actualOrEstimate?: number;
  }>;
  forecast2026: {
    actualFirstSixMonths: number;
    monthlyEstimate: Array<{ month: number; amount: number }>;
    annualEstimate: number;
  };
  locationPlans2026: OfficialLocationPlan[];
  locationPlanTotal: number;
  directory: {
    total: number;
    byIndustry: Record<string, number>;
    byTaxOfficeCode: Record<string, number>;
    byManagingUnit: Record<string, number>;
    byLocation: Record<string, number>;
  };
}

export const OFFICIAL_18_09 = source as unknown as OfficialData18September;

export const OFFICIAL_LOCATION_PLAN = new Map(
  OFFICIAL_18_09.locationPlans2026.map((row) => [row.id, row]),
);

export const OFFICIAL_FORECAST_BY_MONTH = new Map(
  OFFICIAL_18_09.forecast2026.monthlyEstimate.map((row) => [row.month, row.amount]),
);

export const LOCATION_PLAN_COMPONENT_LABEL: Record<string, string> = {
  nonStateBusiness: "Khu vực kinh tế ngoài quốc doanh",
  registrationFee: "Lệ phí trước bạ",
  environmentTax: "Thuế bảo vệ môi trường",
  agriculturalLandTax: "Thuế sử dụng đất nông nghiệp",
  nonAgriculturalLandTax: "Thuế sử dụng đất phi nông nghiệp",
  personalIncomeTax: "Thuế thu nhập cá nhân",
  fees: "Phí, lệ phí",
  landRent: "Tiền thuê mặt đất, mặt nước",
  landUse: "Tiền sử dụng đất",
  landCompensation: "Thu đền bù khi Nhà nước thu hồi đất",
  publicLand: "Thu quỹ đất công ích, hoa lợi công sản",
  otherRevenue: "Thu khác ngân sách",
};

const normalized = (value: string) =>
  value
    .toLowerCase()
    .replace(/^(phường|xã)\s+/u, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const directoryLocation = new Map(
  Object.entries(OFFICIAL_18_09.directory.byLocation).map(([name, count]) => [normalized(name), count]),
);
const directoryIndustry = new Map(
  Object.entries(OFFICIAL_18_09.directory.byIndustry).map(([name, count]) => [normalized(name), count]),
);

/** Số bản ghi danh bạ theo chiều; không chứa tên hoặc mã số thuế. */
export function officialDirectoryCount(
  groupBy: "industry" | "taxOffice" | "location",
  id: string,
  name: string,
): number | null {
  if (groupBy === "taxOffice") {
    // Danh bạ đếm theo MÃ NGUỒN, còn `id` là mã thực thể. Năm cơ quan có hai mã,
    // nên tra thẳng một mã là bỏ rơi nửa số dòng của chúng mà không báo gì.
    const codes = TAX_OFFICE_ENTITY_BY_ID[id]?.codes ?? [id];
    const co = codes.some((code) => code in OFFICIAL_18_09.directory.byTaxOfficeCode);
    if (!co) return null;
    return codes.reduce((sum, code) => sum + (OFFICIAL_18_09.directory.byTaxOfficeCode[code] ?? 0), 0);
  }
  if (groupBy === "location") return directoryLocation.get(normalized(name)) ?? null;
  // Danh bạ dùng dấu gạch ở "Nông - Lâm - Thủy sản", còn UI dùng dấu phẩy.
  return directoryIndustry.get(normalized(name)) ?? null;
}

export function officialDirectoryUnclassifiedCount(
  groupBy: "industry" | "taxOffice" | "location",
): number {
  if (groupBy === "taxOffice")
    return OFFICIAL_18_09.directory.byTaxOfficeCode["Chưa xác định"] ?? 0;
  if (groupBy === "location") return directoryLocation.get(normalized("Chưa xác định")) ?? 0;
  return (
    (OFFICIAL_18_09.directory.byIndustry["#N/A"] ?? 0) +
    (OFFICIAL_18_09.directory.byIndustry["Chưa xác định"] ?? 0)
  );
}

export const isOfficialCityTotalScope = (filters: {
  year: number;
  indicator: string;
  budgetLevel: string;
}) => filters.year === 2026 && filters.indicator === "tong-so" && filters.budgetLevel === "NSNN";
