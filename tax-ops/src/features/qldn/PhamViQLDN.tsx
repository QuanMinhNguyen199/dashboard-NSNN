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
const Ngu = createContext<{ chon: string[]; datChon: (ds: string[]) => void; kyId: string; datKyId: (id: string) => void; xem: string; datXem: (id: string) => void } | null>(null);

export function PhamViProvider({ children }: { children: ReactNode }) {
  const [chon, datChon] = useState<string[]>([]);
  const [kyId, datKyId] = useState(KY_Q[0].id);
  /* Phòng trưởng phòng đang xem: "" = phòng của mình, "P1"…"P5", hoặc "TCS". */
  const [xem, datXem] = useState("");
  const gia = useMemo(() => ({ chon, datChon, kyId, datKyId, xem, datXem }), [chon, kyId, xem]);
  return <Ngu.Provider value={gia}>{children}</Ngu.Provider>;
}

/*
  Ô chọn phòng của trưởng phòng, phó phòng (chốt 15/10/2026). Năm phòng QLDN
  làm cùng một việc; chia phòng chỉ để chia nhau số doanh nghiệp quản lý, nên
  trưởng phòng xem được số của phòng khác — và cả khối 25 thuế cơ sở, vốn
  cũng làm đúng những việc ấy (14/10/2026). Mặc định là phòng của mình.
  Lựa chọn sống ở provider như của lãnh đạo: chọn một lần, ba mô-đun đi theo.

  Xem được KHÔNG có nghĩa là duyệt được: báo cáo của phòng khác chỉ đọc —
  `canChangeApproval` chỉ cho người của đúng phòng ấy gửi và duyệt.

  Cán bộ không có ô chọn: biên bản §3 "chuyên viên xem số của mình".
*/
export const coCongTacKhoi = (pv: PhamVi | null) => Boolean(pv) && (pv!.vai === "TP" || pv!.vai === "PP");

export function usePhamVi(user: DemoUser): { pv: PhamVi | null; ky: KyQ; datKy: (id: string) => void } {
  const ngu = useContext(Ngu);
  if (!ngu) throw new Error("usePhamVi phải nằm trong PhamViProvider.");
  const pv = useMemo(() => {
    const goc = phamViCua(user, ngu.chon);
    if (!goc || !coCongTacKhoi(goc) || !ngu.xem || ngu.xem === goc.donVi[0].id) return goc;
    const donVi = ngu.xem === "TCS" ? DON_VI_Q.filter((d) => d.khoi === "TCS") : DON_VI_Q.filter((d) => d.id === ngu.xem);
    return donVi.length ? { ...goc, donVi, phongGoc: goc.donVi[0] } : goc;
  }, [user, ngu.chon, ngu.xem]);
  return { pv, ky: KY_Q.find((k) => k.id === ngu.kyId) ?? KY_Q[0], datKy: ngu.datKyId };
}

/* Ô chọn gốc của trình duyệt: bảy lựa chọn chia hai nhóm theo khối, đọc
   được bằng bàn phím và trình đọc màn hình, không cần dựng hộp riêng. */
function ChonPhong({ pv }: { pv: PhamVi }) {
  const ngu = useContext(Ngu)!;
  const cuaToi = pv.phongGoc ?? pv.donVi[0];
  return <select className="bo-loc-select" aria-labelledby="qd-pham-vi-nhan" value={ngu.xem || cuaToi.id} onChange={(e) => ngu.datXem(e.target.value === cuaToi.id ? "" : e.target.value)}>
    <optgroup label={NHAN_KHOI.VP}>
      {DON_VI_Q.filter((d) => d.khoi === "VP").map((d) => <option key={d.id} value={d.id}>{d.ngan}{d.id === cuaToi.id ? " · phòng của tôi" : ""}</option>)}
    </optgroup>
    <optgroup label={NHAN_KHOI.TCS}>
      <option value="TCS">Cả khối thuế cơ sở · {DON_VI_Q.filter((d) => d.khoi === "TCS").length} đơn vị</option>
    </optgroup>
  </select>;
}

/*
  Thanh phạm vi — CÁC Ô CỐ ĐỊNH, giống nhau ở mọi vai VÀ MỌI MÀN (Fixed Slots
  Rule, critique 27/10/2026):
    [Kỳ] [Phạm vi] [thêm] [Vai · quyền chờ chốt · Số liệu mô phỏng]
  Thanh luôn là khối ĐẦU TIÊN của nội dung, trên mọi hàng tab — nên nó đứng
  đúng một độ cao ở mọi màn. Bản trước đứng dưới hàng tab, nên trôi từ 45 tới
  142px tuỳ màn có mấy hàng tab, và biến mất ở bốn màn.

  Màn nào kỳ hay phạm vi không đổi được (Xếp hạng phòng chấm một kỳ cố định,
  Bộ tiêu chí là định nghĩa chung, Báo cáo có kỳ riêng) thì ô VẪN ĐỨNG ĐÓ và
  nói giá trị đang áp dụng bằng chữ (`kyChu`, `phamViChu`) — người đọc luôn
  biết con số trước mắt thuộc kỳ nào.
*/
export function ThanhPhamVi({ pv, ky, datKy, coKy = true, kyChu, phamViChu, them }: { pv: PhamVi; ky?: KyQ; datKy?: (id: string) => void; coKy?: boolean; kyChu?: string; phamViChu?: string; them?: ReactNode }) {
  const cho = choChotCua(pv.vai);
  const chonKy = coKy && ky && datKy && !kyChu;
  return <div className="bo-loc-chung qd-pham-vi">
    <div className="bo-loc-muc">
      <span className="bo-loc-nhan" id="qd-ky">Kỳ</span>
      {chonKy
        ? <select className="bo-loc-select" aria-labelledby="qd-ky" value={ky!.id} onChange={(e) => datKy!(e.target.value)}>
          {KY_Q.map((k) => <option key={k.id} value={k.id}>{k.nhan}</option>)}
        </select>
        : <span className="bo-loc-gia" aria-labelledby="qd-ky" title={kyChu ?? ky?.nhan}>{kyChu ?? ky?.nhan}</span>}
    </div>
    <div className="bo-loc-muc">
      <span className="bo-loc-nhan" id="qd-pham-vi-nhan">Phạm vi</span>
      {phamViChu ? <span className="bo-loc-gia" aria-labelledby="qd-pham-vi-nhan" title={phamViChu}>{phamViChu}</span>
        : pv.vai === "LD" ? <ChonDonVi/>
        : coCongTacKhoi(pv) ? <ChonPhong pv={pv}/>
        : <span className="bo-loc-gia" aria-labelledby="qd-pham-vi-nhan" title={nhanPhamVi(pv)}>{nhanPhamVi(pv)}</span>}
    </div>
    {them}
    {/* Thời điểm cập nhật đứng cạnh nhãn mô phỏng: người đọc số cần biết số
        "tươi" tới đâu trước khi trích nó đi họp. Giờ kéo là giờ của lịch kéo
        dữ liệu hằng ngày (mô phỏng). */}
    <span className="bo-loc-phu">
      <b>{NHAN_VAI_Q[pv.vai]}</b>
      {cho.length > 0 && <> · <span className="qd-cho-chot" title="Ma trận chỉ số theo vai trò, biên bản 09/10/2026 §4">{cho.map((c) => NHAN_CHI_SO[c]).join(", ")}: chờ chốt quyền</span></>}
      {" · "}Cập nhật 06:00 {new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}{" · "}Số liệu mô phỏng
    </span>
  </div>;
}

/*
  Hộp chọn đơn vị của lãnh đạo: ba lối tắt theo §3 ("theo khối thuế cơ sở,
  khối phòng"), ô tìm, và danh sách tích chọn ("một/nhiều đơn vị mình phụ
  trách"). Mỗi đơn vị có thêm nút "Chỉ chọn": chọn năm thuế cơ sở mình phụ
  trách không còn là bỏ tích hai mươi ô.

  Đóng khi bấm ra ngoài bằng `pointerdown` trên tài liệu, không bằng tiêu
  điểm — bấm vào phần chữ của một `<label>` thả tiêu điểm trước khi ô tích
  nhận nó. Mở thì tiêu điểm vào ô tìm; Esc đóng và trả tiêu điểm về nút mở.
*/
function ChonDonVi() {
  const ngu = useContext(Ngu)!;
  const [mo, datMo] = useState(false);
  const [tim, datTim] = useState("");
  const hop = useRef<HTMLDivElement>(null);
  const nut = useRef<HTMLButtonElement>(null);
  const oTim = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!mo) return;
    oTim.current?.focus();
    const ngoai = (e: PointerEvent) => { if (!hop.current?.contains(e.target as Node)) datMo(false); };
    document.addEventListener("pointerdown", ngoai);
    return () => document.removeEventListener("pointerdown", ngoai);
  }, [mo]);
  const dong = () => { datMo(false); datTim(""); nut.current?.focus(); };

  const dangChon = ngu.chon.length ? ngu.chon : TAT_CA_ID;
  const tomTat = nhanPhamVi({ vai: "LD", canBo: null, donVi: DON_VI_Q.filter((d) => dangChon.includes(d.id)) });
  const chonKhoi = (k: Khoi | null) => ngu.datChon(k ? DON_VI_Q.filter((d) => d.khoi === k).map((d) => d.id) : []);
  const bat = (id: string) => {
    const co = dangChon.includes(id);
    const moi = co ? dangChon.filter((x) => x !== id) : [...dangChon, id];
    /* Bỏ hết thì về toàn thành phố, không để phạm vi rỗng. */
    ngu.datChon(moi.length === DON_VI_Q.length ? [] : moi);
  };
  const q = tim.trim().toLowerCase();
  const khop = (d: (typeof DON_VI_Q)[number]) => !q || d.ngan.toLowerCase().includes(q) || d.ten.toLowerCase().includes(q);

  return <div className="bo-loc-chon" ref={hop} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); dong(); } }}>
    <button ref={nut} type="button" className="bo-loc-nut" aria-expanded={mo} aria-haspopup="true" aria-labelledby="qd-pham-vi-nhan qd-pham-vi-gia" onClick={() => (mo ? dong() : datMo(true))}>
      <span id="qd-pham-vi-gia">{tomTat} ({dangChon.length})</span><Icon name="chevronDown" size={16}/>
    </button>
    {mo && <div className="bo-loc-menu qd-menu" role="group" aria-label="Chọn đơn vị hiển thị">
      <div className="qd-loi-tat">
        <button type="button" onClick={() => chonKhoi(null)}>Toàn thành phố</button>
        <button type="button" onClick={() => chonKhoi("VP")}>{NHAN_KHOI.VP}</button>
        <button type="button" onClick={() => chonKhoi("TCS")}>{NHAN_KHOI.TCS}</button>
      </div>
      <input ref={oTim} className="qd-menu-tim" type="search" value={tim} onChange={(e) => datTim(e.target.value)} placeholder="Tìm đơn vị (vd: TCS 07, HKI)" aria-label="Tìm đơn vị"/>
      {(["VP", "TCS"] as Khoi[]).map((k) => {
        const ds = DON_VI_Q.filter((d) => d.khoi === k && khop(d));
        if (!ds.length) return null;
        return <div key={k} className="qd-nhom-dv">
          <span className="bo-loc-nhan">{NHAN_KHOI[k]}</span>
          {ds.map((d) => <div key={d.id} className="qd-dong-dv">
            <label>
              <input type="checkbox" checked={dangChon.includes(d.id)} onChange={() => bat(d.id)}/>
              <span>{d.ngan}</span>
            </label>
            <button type="button" className="qd-chi-chon" onClick={() => ngu.datChon([d.id])} aria-label={`Chỉ chọn ${d.ngan}`}>Chỉ chọn</button>
          </div>)}
        </div>;
      })}
      {DON_VI_Q.every((d) => !khop(d)) && <p className="qd-menu-trong">Không có đơn vị khớp “{tim}”.</p>}
    </div>}
  </div>;
}

/*
  Màn dành cho vai không thuộc khối QLDN — không tới được qua thanh bên, chỉ
  khi dán đường dẫn. Nói lý do VÀ lối đi tiếp, không để một câu cụt.
*/
export function NgoaiPhamVi() {
  return <div className="empty-state">
    <strong>Tài khoản này không thuộc không gian làm việc khối QLDN.</strong>
    <span>Không gian này dành cho cán bộ, phó phòng, trưởng phòng các phòng QLDN và lãnh đạo Thuế TP. Dùng thanh bên để mở màn của vai bạn; nếu bạn cần quyền xem, liên hệ quản trị hệ thống.</span>
  </div>;
}