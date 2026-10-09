import { useState } from "react";
import { Button } from "@/components/ui";
import type { KyQL2 } from "@/data/ql2";

export const isoNgay = (value: string) => value.split("/").reverse().join("-");
export const ngayHopLe = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export function KhoangNgayK({ ky, onApply }: { ky: KyQL2; onApply: (tu: string, den: string) => void }) {
  const [tu, datTu] = useState(isoNgay(ky.ngayDau ?? ky.ngayChot));
  const [den, datDen] = useState(isoNgay(ky.ngayChot));
  const [loi, datLoi] = useState("");
  return <form className="inline-controls" onSubmit={(e) => {
    e.preventDefault();
    if (!ngayHopLe(tu) || !ngayHopLe(den) || tu > den) { datLoi("Ngày bắt đầu phải hợp lệ và không sau ngày chốt."); return; }
    datLoi(""); onApply(tu, den);
  }}>
    <label className="compact-field"><span>Từ ngày</span><input aria-label="Hệ số K từ ngày" type="date" required value={tu} onChange={(e) => datTu(e.target.value)}/></label>
    <label className="compact-field"><span>Ngày chốt / giao ban</span><input aria-label="Hệ số K đến ngày" type="date" required value={den} onChange={(e) => datDen(e.target.value)}/></label>
    <Button type="submit">Áp dụng khoảng ngày</Button>
    {loi && <span role="alert">{loi}</span>}
  </form>;
}
