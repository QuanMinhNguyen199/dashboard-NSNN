import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui";
import type { DemoUser } from "@/auth/demoAuth";
import {
  DON_VI_Q, KY_Q, NHAN_CHI_SO, NHAN_KHOI, NHAN_VAI_Q, TAT_CA_ID, choChotCua, nhanPhamVi, phamViCua,
  type Khoi, type KyQ, type PhamVi,
} from "@/data/qldn";

/*
  Phạm vi dữ liệu của khối QLDN — biên bản 09/10/2026 §3: "Một giao diện cho
  mọi vai trò. Màn hình giống hệt nhau, dữ liệu lọc theo phân quyền."

  Lựa chọn đơn vị của lãnh đạo Thuế TP sống ở provider trên App, không trong
  từng màn: lãnh đạo chọn năm thuế cơ sở mình phụ trách một lần rồi đi qua cả
  ba mô-đun, chọn lại ở mỗi màn là bắt họ làm một việc ba lần.
*/
const Ngu = createContext<{ chon: string[]; datChon: (ds: string[]) => void; kyId: string; datKyId: (id: string) => void } | null>(null);

export function PhamViProvider({ children }: { children: ReactNode }) {
  const [chon, datChon] = useState<string[]>([]);
  const [kyId, datKyId] = useState(KY_Q[0].id);
  const gia = useMemo(() => ({ chon, datChon, kyId, datKyId }), [chon, kyId]);
  return <Ngu.Provider value={gia}>{children}</Ngu.Provider>;
}

export function usePhamVi(user: DemoUser): { pv: PhamVi | null; ky: KyQ; datKy: (id: string) => void } {
  const ngu = useContext(Ngu);
  if (!ngu) throw new Error("usePhamVi phải nằm trong PhamViProvider.");
  const pv = useMemo(() => phamViCua(user, ngu.chon), [user, ngu.chon]);
  return { pv, ky: KY_Q.find((k) => k.id === ngu.kyId) ?? KY_Q[0], datKy: ngu.datKyId };
}

/*
  Thanh phạm vi — CÁC Ô CỐ ĐỊNH, giống nhau ở mọi vai (Fixed Slots Rule):
    [Kỳ] [Phạm vi] [Vai · quyền chờ chốt] [Số liệu mô phỏng]
  Vai chỉ đổi NỘI DUNG ô Phạm vi: lãnh đạo Thuế TP có hộp chọn đơn vị, các
  vai khác thấy tên phạm vi của mình — ma trận §4 ghi "Chọn đơn vị hiển thị"
  chỉ lãnh đạo có.
*/
export function ThanhPhamVi({ pv, ky, datKy, coKy = true, them }: { pv: PhamVi; ky?: KyQ; datKy?: (id: string) => void; coKy?: boolean; them?: ReactNode }) {
  const cho = choChotCua(pv.vai);
  return <div className="bo-loc-chung qd-pham-vi">
    {coKy && ky && datKy && <div className="bo-loc-muc">
      <span className="bo-loc-nhan" id="qd-ky">Kỳ</span>
      <select className="bo-loc-select" aria-labelledby="qd-ky" value={ky.id} onChange={(e) => datKy(e.target.value)}>
        {KY_Q.map((k) => <option key={k.id} value={k.id}>{k.nhan}</option>)}
      </select>
    </div>}
    <div className="bo-loc-muc">
      <span className="bo-loc-nhan">Phạm vi</span>
      {pv.vai === "LD" ? <ChonDonVi/> : <strong className="bo-loc-ky">{nhanPhamVi(pv)}</strong>}
    </div>
    {them}
    <span className="bo-loc-phu">
      <b>{NHAN_VAI_Q[pv.vai]}</b>
      {cho.length > 0 && <> · <span className="qd-cho-chot" title="Ma trận chỉ số theo vai trò, biên bản 09/10/2026 §4">{cho.map((c) => NHAN_CHI_SO[c]).join(", ")}: chờ chốt quyền</span></>}
      {" · "}Số liệu mô phỏng
    </span>
  </div>;
}

/*
  Hộp chọn đơn vị của lãnh đạo: ba lối tắt theo §3 ("theo khối thuế cơ sở,
  khối phòng") cộng danh sách tích chọn ("một/nhiều đơn vị mình phụ trách").
  Đóng khi bấm ra ngoài bằng `pointerdown` trên tài liệu, không bằng tiêu
  điểm — bấm vào phần chữ của một `<label>` thả tiêu điểm trước khi ô tích
  nhận nó.
*/
function ChonDonVi() {
  const ngu = useContext(Ngu)!;
  const [mo, datMo] = useState(false);
  const hop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mo) return;
    const ngoai = (e: PointerEvent) => { if (!hop.current?.contains(e.target as Node)) datMo(false); };
    document.addEventListener("pointerdown", ngoai);
    return () => document.removeEventListener("pointerdown", ngoai);
  }, [mo]);

  const dangChon = ngu.chon.length ? ngu.chon : TAT_CA_ID;
  const tomTat = nhanPhamVi({ vai: "LD", canBo: null, donVi: DON_VI_Q.filter((d) => dangChon.includes(d.id)) });
  const chonKhoi = (k: Khoi | null) => ngu.datChon(k ? DON_VI_Q.filter((d) => d.khoi === k).map((d) => d.id) : []);
  const bat = (id: string) => {
    const co = dangChon.includes(id);
    const moi = co ? dangChon.filter((x) => x !== id) : [...dangChon, id];
    /* Bỏ hết thì về toàn thành phố, không để phạm vi rỗng. */
    ngu.datChon(moi.length === DON_VI_Q.length ? [] : moi);
  };

  return <div className="bo-loc-chon" ref={hop} onKeyDown={(e) => { if (e.key === "Escape") datMo(false); }}>
    <button type="button" className="bo-loc-nut" aria-expanded={mo} aria-haspopup="true" onClick={() => datMo((t) => !t)}>
      <span>{tomTat} ({dangChon.length})</span><Icon name="chevronDown" size={16}/>
    </button>
    {mo && <div className="bo-loc-menu qd-menu" role="group" aria-label="Chọn đơn vị hiển thị">
      <div className="qd-loi-tat">
        <button type="button" onClick={() => chonKhoi(null)}>Toàn thành phố</button>
        <button type="button" onClick={() => chonKhoi("VP")}>{NHAN_KHOI.VP}</button>
        <button type="button" onClick={() => chonKhoi("TCS")}>{NHAN_KHOI.TCS}</button>
      </div>
      {(["VP", "TCS"] as Khoi[]).map((k) => <div key={k} className="qd-nhom-dv">
        <span className="bo-loc-nhan">{NHAN_KHOI[k]}</span>
        {DON_VI_Q.filter((d) => d.khoi === k).map((d) => <label key={d.id}>
          <input type="checkbox" checked={dangChon.includes(d.id)} onChange={() => bat(d.id)}/>
          <span>{d.ngan}</span>
        </label>)}
      </div>)}
    </div>}
  </div>;
}

/** Màn dành cho vai không thuộc khối QLDN — không xảy ra qua thanh bên, chỉ khi dán đường dẫn. */
export function NgoaiPhamVi() {
  return <div className="empty-state"><strong>Tài khoản này không thuộc không gian làm việc khối QLDN.</strong></div>;
}
