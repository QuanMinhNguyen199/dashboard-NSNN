import catalog from './wards.json';
import type { AmountRow, OverviewData, OverviewDataProvider, OverviewFilters } from './types';

// Synthetic monthly observations; all aggregates derive from this single model.
export const ITEMS = [
  ['1.1', 'Doanh nghiệp nhà nước trung ương'], ['1.2', 'Doanh nghiệp nhà nước địa phương'],
  ['2', 'Doanh nghiệp có vốn đầu tư nước ngoài'], ['3', 'Khu vực ngoài quốc doanh'],
  ['4', 'Thuế thu nhập cá nhân'], ['5', 'Thuế bảo vệ môi trường'], ['6', 'Lệ phí trước bạ'],
  ['7', 'Phí, lệ phí'], ['8', 'Thuế sử dụng đất nông nghiệp'], ['9', 'Thuế sử dụng đất phi nông nghiệp'],
  ['10', 'Tiền thuê đất, thuê mặt nước'], ['11', 'Tiền sử dụng đất'], ['12', 'Thuê và bán nhà thuộc sở hữu nhà nước'],
  ['13', 'Hoạt động xổ số kiến thiết'], ['14', 'Cấp quyền khai thác khoáng sản, tài nguyên nước'],
  ['15', 'Tiền sử dụng khu vực biển'], ['16', 'Thu khác ngân sách'], ['17', 'Quỹ đất công ích, hoa lợi công sản'],
  ['18', 'Cổ tức, lợi nhuận và vốn địa phương'], ['19', 'Cổ tức, lợi nhuận và vốn trung ương'], ['20', 'Chênh lệch thu chi Ngân hàng Nhà nước'],
] as const;
const SOURCE_NAMES = ['Thu nội địa', 'Thu xuất nhập khẩu (ròng)', 'Thu dầu thô', 'Thu khác (IV–VIII)'];
const weights = [15, 3, 13, 23, 14, 3, 5, 2, .02, .5, 6, 12, .4, .3, .2, 0, 1.6, .1, 1, 2, .3];
export const wardCatalog = catalog.filter(w => /^\d{5}$/.test(w.location_code));
export function yoy(current: number, previous: number | null): number | null {
  return previous === null || previous <= 0 ? null : (current - previous) / previous * 100;
}
export const latestMonth = (year: number) => year === 2026 ? 8 : 12;
export const periodCount = (f: Pick<OverviewFilters, 'year' | 'periodType'>) => f.periodType === 'MONTH' ? latestMonth(f.year) : Math.floor(latestMonth(f.year) / 3);
export const defaultFilters: OverviewFilters = { year: 2026, periodType: 'MONTH', period: 8, acc: 'PERIOD', level: 'NSNN', indicator: 'TỔNG SỐ' };
function monthly(year: number, month: number, source: number, item: number, level: OverviewFilters['level']) {
  // Mỗi cặp (nguồn, khoản) có tốc độ tăng riêng. Nếu mọi chuỗi dùng chung một
  // hệ số thì mọi ô %YoY trên dashboard đều ra đúng một con số, và bảng xếp
  // hạng biến động mất hết ý nghĩa.
  const rate = .094 + Math.sin(item * 1.7 + source * 2.9) * .072;
  const growth = (1 + rate) ** (year - 2024);
  const season = [1.25, .72, 1.08, 1.2, .91, 1.16, 1.04, 1.11, 1.08, 1.17, 1.12, 1.48][month - 1];
  const share = source === 0 ? weights[item] / weights.reduce((a, b) => a + b, 0) : 1;
  const central = source === 0 ? .35 + (item % 4) * .08 : [.5, .9, 1, .15][source];
  const levelShare = level === 'NSNN' ? 1 : level === 'NSTW' ? central : 1 - central;
  return Math.round([28500, 4100, 850, 1450][source] * growth * season * share * levelShare * (1 + Math.sin(month * 2 + item + source) * .055) * 100) / 100;
}
function sum(year: number, months: number[], source: number, item: number, level: OverviewFilters['level']) {
  return months.reduce((total, m) => total + monthly(year, m, source, item, level), 0);
}
function sources(year: number, months: number[], level: OverviewFilters['level'], indicator: string): AmountRow[] {
  const indicatorFactor = indicator === 'THU NGÂN SÁCH NHÀ NƯỚC' ? .972 : indicator.includes('hoàn thuế') ? .944 : 1;
  return SOURCE_NAMES.map((name, source) => {
    const amount = (y: number) => source === 0 ? ITEMS.reduce((n, _, i) => n + sum(y, months, source, i, level), 0) : sum(y, months, source, 0, level);
    return { id: String(source), name, amount: amount(year) * indicatorFactor, previous: amount(year - 1) * indicatorFactor };
  });
}
const totalOf = (rows: AmountRow[]) => rows.reduce((n, r) => n + r.amount, 0);
export function buildOverview(f: OverviewFilters): OverviewData | null {
  if (![2024, 2025, 2026].includes(f.year) || f.period < 1 || f.period > periodCount(f)) return null;
  const end = f.periodType === 'MONTH' ? f.period : f.period * 3;
  const start = f.periodType === 'MONTH' ? end : end - 2;
  const periodMonths = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const ytdMonths = Array.from({ length: end }, (_, i) => i + 1);
  const months = f.acc === 'YTD' ? ytdMonths : periodMonths;
  const all = sources(f.year, months, f.level, f.indicator);
  const total = totalOf(all);
  const previous = all.reduce((n, r) => n + (r.previous ?? 0), 0);
  const kpi = (name: string, ms: number[]) => ({ id: name, name, amount: totalOf(sources(f.year, ms, f.level, f.indicator)), previous: totalOf(sources(f.year - 1, ms, f.level, f.indicator)) });
  // Coverage excludes two synthetic missing observations; no fabricated zero rows.
  const coveredWards = f.year === 2026 ? wardCatalog.slice(0, -2) : wardCatalog;
  // Mỗi địa bàn có xu hướng riêng để %YoY trải ra, không dồn về một giá trị.
  const wardWeight = (i: number, year: number) =>
    (1 + ((i * 37 + 11) % 101)) ** 1.35
    * (1 + Math.sin(i * 3 + year) * .11)
    * (1 + Math.sin(i * 1.31 + .4) * .19) ** (year - 2024);
  const denominator = (year: number) => coveredWards.reduce((n, _, i) => n + wardWeight(i, year), 0);
  return {
    meta: { source: 'mock', unit: 'tỷ đồng', scope: 'Toàn thành phố Hà Nội', covered: coveredWards.length, total: wardCatalog.length, periodLabel: `${f.periodType === 'MONTH' ? 'Tháng' : 'Quý'} ${f.period}/${f.year}`, level: f.level, derived: f.periodType === 'QUARTER' },
    period: kpi('Thu trong kỳ', periodMonths), ytd: kpi('Thu lũy kế từ đầu năm', ytdMonths), total, previous, sources: all,
    items: ITEMS.map(([id, name], i) => ({ id, name, amount: sum(f.year, months, 0, i, f.level), previous: sum(f.year - 1, months, 0, i, f.level) })),
    budgets: f.level !== 'NSNN' ? [] : ['NSTW', 'NSDP'].map((level, i) => ({ id: level, name: i === 0 ? 'Ngân sách trung ương' : 'Ngân sách địa phương', amount: totalOf(sources(f.year, months, level as 'NSTW' | 'NSDP', f.indicator)), previous: totalOf(sources(f.year - 1, months, level as 'NSTW' | 'NSDP', f.indicator)) })),
    wards: coveredWards.map((w, i) => ({ id: w.location_code, name: w.location_name, amount: total * .82 * wardWeight(i, f.year) / denominator(f.year), previous: previous * .82 * wardWeight(i, f.year - 1) / denominator(f.year - 1) })),
    trend: Array.from({ length: 12 }, (_, i) => {
      const ms = f.acc === 'YTD' ? Array.from({ length: i + 1 }, (_, j) => j + 1) : [i + 1];
      return { month: `T${i + 1}`, current: i < latestMonth(f.year) ? totalOf(sources(f.year, ms, f.level, f.indicator)) : null, previous: totalOf(sources(f.year - 1, ms, f.level, f.indicator)) };
    }),
  };
}
export const mockOverviewProvider: OverviewDataProvider = {
  async getOverview(filters, signal) {
    await new Promise<void>((resolve, reject) => {
      if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
      const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 180);
      signal.addEventListener('abort', abort, { once: true });
    });
    return buildOverview(filters);
  },
};
