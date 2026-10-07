import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/*
  KPI tháng do đơn vị tự đăng ký — M-Q3-02 của `SPec/QLDN3`.

  Tài liệu ghi rõ đây là dữ liệu PHÒNG PHẢI NHẬP, không kéo được từ nguồn nào:
  "Không có file riêng cho KPI: KPI tháng do các đơn vị tự đăng ký đang được gõ
  thẳng vào Sheet9 / sheet TH". Nó vào cột (7) của mẫu báo cáo, và cột (8) —
  tỷ lệ hoàn thành trên KPI — chia cho nó.

  Lưu ở `localStorage` cùng lý do đã ghi ở `DuyetContext` và `PhieuContext`:
  số đăng ký phải còn đó khi mở lại tab, vì nó là thứ người ta nhập một lần
  rồi đối chiếu suốt tháng. Bản thật phải giữ ở máy chủ.

  Khóa gồm CẢ KỲ: KPI là số lũy kế theo tháng, nên mỗi kỳ một giá trị, và sửa
  KPI tháng 8 không được đụng tới tháng 7 đã chốt.
*/

const KHOA = "tax-ops-kpi-ql3";

type Kho = Record<string, number>;

const Ngu = createContext<{
  layKpi: (kyId: string, dvId: string) => number | null;
  ghiKpi: (kyId: string, so: Record<string, number>) => void;
  daDangKy: (kyId: string, dvIds: string[]) => number;
} | null>(null);

const doc = (): Kho => {
  try {
    const t = JSON.parse(window.localStorage.getItem(KHOA) ?? "{}");
    return t && typeof t === "object" ? t : {};
  } catch {
    return {};
  }
};

export function KpiProvider({ children }: { children: ReactNode }) {
  const [kho, datKho] = useState<Kho>(doc);

  useEffect(() => {
    try { window.localStorage.setItem(KHOA, JSON.stringify(kho)); } catch { /* chế độ riêng tư */ }
  }, [kho]);

  const layKpi = useCallback((kyId: string, dvId: string) => kho[`${kyId}|${dvId}`] ?? null, [kho]);

  /* Ghi theo LÔ, không từng ô: người nhập điền cả bảng ba mươi đơn vị rồi mới
     lưu, và một phép kiểm "đủ 30 đơn vị" chỉ có nghĩa khi cả lô vào cùng lúc. */
  const ghiKpi = useCallback((kyId: string, so: Record<string, number>) => {
    datKho((t) => {
      const moi = { ...t };
      for (const [dvId, v] of Object.entries(so)) moi[`${kyId}|${dvId}`] = v;
      return moi;
    });
  }, []);

  const daDangKy = useCallback(
    (kyId: string, dvIds: string[]) => dvIds.filter((id) => kho[`${kyId}|${id}`] !== undefined).length,
    [kho],
  );

  const gia = useMemo(() => ({ layKpi, ghiKpi, daDangKy }), [layKpi, ghiKpi, daDangKy]);
  return <Ngu.Provider value={gia}>{children}</Ngu.Provider>;
}

export function useKpi() {
  const t = useContext(Ngu);
  if (!t) throw new Error("useKpi phải nằm trong KpiProvider.");
  return t;
}
