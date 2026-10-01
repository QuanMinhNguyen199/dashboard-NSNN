import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, Icon } from "@/components/ui";
import { KY_MAC_DINH } from "@/data/ql1";

/*
  Bộ lọc chung Kỳ + Đơn vị của mục G1 bản thiết kế.

  Hai điều kiện trong yêu cầu quyết định cách dựng:

  1. "Áp cho mọi tab của phân hệ" — nên lựa chọn KHÔNG nằm trong màn. Nó nằm ở
     context trên App, vì thế đổi tab hay đổi màn đều không mất lựa chọn; một
     state cục bộ trong Debt sẽ bị dựng lại mỗi lần người dùng rời màn.
  2. "Đặt cố định đầu trang" — thanh dính dưới măng sét, không cuộn theo bảng.
*/
export interface LuaChonLoc {
  ky: string;
  /** Mảng rỗng = toàn ngành. Giữ rỗng thay vì liệt kê hết để "Đặt lại" có nghĩa rõ. */
  donVi: string[];
}

export interface MucKy { id: string; nhan: string; loai: "TUAN" | "THANG" }

const KHOA = "tax-ops-boloc";
const RONG: LuaChonLoc = { ky: KY_MAC_DINH, donVi: [] };

const Ngu = createContext<{ chon: LuaChonLoc; datDonVi: (dv: string[]) => void; datKy: (ky: string) => void } | null>(null);

export function BoLocProvider({ children }: { children: ReactNode }) {
  const [chon, setChon] = useState<LuaChonLoc>(() => {
    try {
      const raw = JSON.parse(sessionStorage.getItem(KHOA) ?? "null");
      return raw && Array.isArray(raw.donVi) ? { ky: typeof raw.ky === "string" ? raw.ky : RONG.ky, donVi: raw.donVi.map(String) } : RONG;
    } catch { return RONG; }
  });
  useEffect(() => { try { sessionStorage.setItem(KHOA, JSON.stringify(chon)); } catch { /* phiên riêng tư: lọc vẫn chạy, chỉ không nhớ qua lần tải sau */ } }, [chon]);
  const gia = useMemo(() => ({
    chon,
    datDonVi: (donVi: string[]) => setChon((truoc) => ({ ...truoc, donVi })),
    datKy: (ky: string) => setChon((truoc) => ({ ...truoc, ky })),
  }), [chon]);
  return <Ngu.Provider value={gia}>{children}</Ngu.Provider>;
}

export function useBoLoc() {
  const gia = useContext(Ngu);
  if (!gia) throw new Error("useBoLoc phải nằm trong BoLocProvider.");
  return gia;
}

/** Lọc một danh sách theo đơn vị đang chọn. Rỗng = không lọc, không phải không khớp. */
export function theoDonVi<T>(rows: T[], chon: LuaChonLoc, lay: (row: T) => string | null | undefined) {
  if (chon.donVi.length === 0) return rows;
  const bo = new Set(chon.donVi);
  return rows.filter((row) => bo.has(String(lay(row) ?? "")));
}

export function BoLocChung({ ky, kyCo, donViCo, rutGon = (v) => v, phuChu }: {
  /** Kỳ viết sẵn thành chữ. Dùng khi dữ liệu chỉ có MỘT kỳ. */
  ky?: string;
  /** Danh sách kỳ chọn được. Có nó thì `ky` bị bỏ qua. */
  kyCo?: MucKy[];
  donViCo: string[];
  rutGon?: (donVi: string) => string;
  /** Một dòng ngắn nói phạm vi dữ liệu đang xem, đứng cuối thanh. */
  phuChu?: string;
}) {
  const { chon, datDonVi, datKy } = useBoLoc();
  const [mo, setMo] = useState(false);

  /*
    Loại kỳ là nút phân đoạn, kỳ cụ thể là ô chọn.

    Hai thứ này có thể gộp thành một `<select>` bảy dòng, nhưng người dùng QL1
    hỏi "tuần hay tháng" trước rồi mới hỏi "kỳ nào" — gộp lại thì họ phải đọc
    hết bảy dòng để tìm ra ranh giới giữa hai loại, mỗi lần chọn.
  */
  const kyHienTai = kyCo?.find((k) => k.id === chon.ky) ?? kyCo?.[0];
  const loai = kyHienTai?.loai ?? "TUAN";
  /* Chỉ dựng công tắc loại kỳ khi danh sách có THẬT SỰ hai loại. QL3 làm việc
     theo kỳ lũy kế từ đầu năm nên chỉ có một loại; dựng nút "Tuần" ở đó là
     dựng một control bấm vào không đổi được gì. */
  const coHaiLoai = Boolean(kyCo && kyCo.some((k) => k.loai === "TUAN") && kyCo.some((k) => k.loai === "THANG"));
  const kyCungLoai = kyCo?.filter((k) => !coHaiLoai || k.loai === loai) ?? [];

  const doiLoai = (moi: "TUAN" | "THANG") => {
    if (!kyCo || moi === loai) return;
    /* Đổi loại kỳ thì nhảy sang kỳ MỚI NHẤT của loại đó, không giữ lại một id
       không còn tồn tại trong danh sách vừa đổi. */
    const dau = kyCo.find((k) => k.loai === moi);
    if (dau) datKy(dau.id);
  };

  const dangChon = chon.donVi.filter((dv) => donViCo.includes(dv));
  const tomTat = dangChon.length === 0 ? "Toàn ngành"
    : dangChon.length === 1 ? rutGon(dangChon[0])
    : `${dangChon.length} đơn vị`;

  const bat = (dv: string) => {
    const co = chon.donVi.includes(dv);
    datDonVi(co ? chon.donVi.filter((x) => x !== dv) : [...chon.donVi, dv]);
  };

  const datLaiDuoc = dangChon.length > 0 || (kyCo ? chon.ky !== kyCo[0].id : false);

  return <div className="bo-loc-chung">
    {kyCo
      ? <>
          {coHaiLoai && <div className="bo-loc-muc">
            <span className="bo-loc-nhan">Loại kỳ</span>
            <div className="bo-loc-seg" role="group" aria-label="Loại kỳ">
              <button type="button" aria-pressed={loai === "TUAN"} onClick={() => doiLoai("TUAN")}>Tuần</button>
              <button type="button" aria-pressed={loai === "THANG"} onClick={() => doiLoai("THANG")}>Tháng</button>
            </div>
          </div>}
          <div className="bo-loc-muc">
            <span className="bo-loc-nhan" id="bo-loc-ky-nhan">Kỳ</span>
            <select className="bo-loc-select" aria-labelledby="bo-loc-ky-nhan" value={kyHienTai?.id ?? ""} onChange={(e) => datKy(e.target.value)}>
              {kyCungLoai.map((k) => <option key={k.id} value={k.id}>{k.nhan}</option>)}
            </select>
          </div>
        </>
      : <div className="bo-loc-muc">
          <span className="bo-loc-nhan">Kỳ</span>
          <strong className="bo-loc-ky">{ky}</strong>
        </div>}

    <div className="bo-loc-muc">
      <span className="bo-loc-nhan" id="bo-loc-donvi-nhan">Đơn vị</span>
      {/* Hộp chọn nhiều tự dựng thay vì `<select multiple>`: select nhiều trên
          khổ hẹp cao bằng nửa màn và không cho biết đã chọn gì nếu không cuộn. */}
      <div className="bo-loc-chon">
        <button type="button" className="bo-loc-nut" aria-expanded={mo} aria-haspopup="true" aria-labelledby="bo-loc-donvi-nhan" onClick={() => setMo((t) => !t)}>
          <span>{tomTat}</span><Icon name="chevronDown" size={16}/>
        </button>
        {mo && <>
          <button type="button" className="bo-loc-man" aria-label="Đóng danh sách đơn vị" onClick={() => setMo(false)}/>
          <div className="bo-loc-menu" role="group" aria-label="Chọn đơn vị">
            {donViCo.map((dv) => <label key={dv}>
              <input type="checkbox" checked={chon.donVi.includes(dv)} onChange={() => bat(dv)}/>
              <span>{rutGon(dv)}</span>
            </label>)}
          </div>
        </>}
      </div>
    </div>

    {datLaiDuoc && <Button kind="quiet" onClick={() => { datDonVi([]); if (kyCo) datKy(kyCo[0].id); }}>Đặt lại</Button>}
    {phuChu && <span className="bo-loc-phu">{phuChu}</span>}
  </div>;
}
