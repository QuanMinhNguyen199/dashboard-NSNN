import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, Icon } from "@/components/ui";
import { KY_MAC_DINH } from "@/data/ql1";
import { datThamSo } from "@/state/diaChi";
import { NHAN_LOAI_KY, type LoaiKy } from "@/components/MucPhanHe";

/*
  Bộ lọc chung Kỳ + Đơn vị của mục G1 bản thiết kế.

  Hai điều kiện trong yêu cầu quyết định cách dựng:

  1. "Áp cho mọi tab của phân hệ" — nên lựa chọn KHÔNG nằm trong màn. Nó nằm ở
     context trên App, vì thế đổi tab hay đổi màn đều không mất lựa chọn; một
     state cục bộ trong Debt sẽ bị dựng lại mỗi lần người dùng rời màn.
  2. "Đặt cố định đầu trang" — thanh dính dưới măng sét, không cuộn theo bảng.

  Lựa chọn sống trong ĐỊA CHỈ, không trong `sessionStorage`. `sessionStorage`
  chỉ sống trong một tab, nên một liên kết do trợ lý gửi sang, mở ở tab mới,
  sẽ không mang theo kỳ và bộ lọc — người nhận thấy một màn khác hẳn màn
  người gửi đang nói tới. Địa chỉ thì đi theo liên kết.

  Phần nối địa chỉ nằm ở `BoLocChung` chứ không ở provider, vì chỉ nó biết
  danh mục của phân hệ đang mở: địa chỉ ghi MÃ đơn vị cho ngắn và ổn định
  ("P1", "T6"), còn bộ lọc bên trong vẫn so theo tên như mọi bảng khác.
*/
export interface LuaChonLoc {
  ky: string;
  /** Mảng rỗng = toàn ngành. Giữ rỗng thay vì liệt kê hết để "Đặt lại" có nghĩa rõ. */
  donVi: string[];
}

/*
  `loai` có NĂM giá trị, không phải hai.

  QL1 làm việc theo tuần và tháng, nên bản đầu chỉ cần hai. QL2 và QL4 thêm ba
  nhịp nữa: ngày (hệ số K, tổng đài — G18 đòi duyệt trong vài phút), năm, và
  lũy kế từ 01/01 (QL2-01, QL4-01). G13 ghi thẳng nhãn phải hiện là "Kỳ ngày /
  tuần / tháng / lũy kế từ 01/01".
*/
export type { LoaiKy } from "@/components/MucPhanHe";
export interface MucKy { id: string; nhan: string; loai: LoaiKy }

const RONG: LuaChonLoc = { ky: KY_MAC_DINH, donVi: [] };

const Ngu = createContext<{ chon: LuaChonLoc; datDonVi: (dv: string[]) => void; datKy: (ky: string) => void } | null>(null);

export function BoLocProvider({ children }: { children: ReactNode }) {
  const [chon, setChon] = useState<LuaChonLoc>(RONG);
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

export interface MucDonVi { id: string; ten: string }

export function BoLocChung({ ky, kyCo, donViCo, rutGon = (v) => v, phuChu, kyTuyChon }: {
  /** Kỳ viết sẵn thành chữ. Dùng khi dữ liệu chỉ có MỘT kỳ. */
  ky?: string;
  /** Danh sách kỳ chọn được. Có nó thì `ky` bị bỏ qua. */
  kyCo?: MucKy[];
  /** Danh mục đơn vị của phân hệ: mã dùng cho địa chỉ, tên dùng để lọc và hiện. */
  donViCo: MucDonVi[];
  rutGon?: (donVi: string) => string;
  /** Một dòng ngắn nói phạm vi dữ liệu đang xem, đứng cuối thanh. */
  phuChu?: string;
  /** Ô nhập kỳ tùy chọn thay cho danh sách kỳ cố định. */
  kyTuyChon?: ReactNode;
}) {
  const { chon, datDonVi, datKy } = useBoLoc();
  const [mo, setMo] = useState(false);
  const hopChon = useRef<HTMLDivElement>(null);

  /*
    Đóng danh sách khi bấm ra ngoài — bằng một người NGHE trên tài liệu, không
    bằng một tấm màn `position: fixed` phủ toàn trang.

    Tấm màn cũ là một phần tử thật nằm đè lên mọi thứ: nó ăn cú bấm đầu tiên,
    nên bấm thẳng sang một ô lọc khác chỉ đóng danh sách chứ không mở ô kia;
    và nó là lớp phủ cuối cùng còn sót lại sau khi cả ba hộp thoại đã bỏ.
  */
  useEffect(() => {
    if (!mo) return;
    const ngoai = (e: PointerEvent) => {
      if (!hopChon.current?.contains(e.target as Node)) setMo(false);
    };
    document.addEventListener("pointerdown", ngoai);
    return () => document.removeEventListener("pointerdown", ngoai);
  }, [mo]);
  const ten = donViCo.map((d) => d.ten);

  /*
    Một lần duy nhất khi màn dựng: lấy kỳ và đơn vị từ địa chỉ.

    Chạy cả khi địa chỉ KHÔNG có tham số, vì lúc đó vẫn phải sửa một việc —
    kỳ mặc định của provider là kỳ của QL1, mở màn QL3 thì nó không nằm trong
    danh mục và phải rơi về kỳ đầu của phân hệ này.
  */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const kyURL = q.get("ky");
    if (kyCo?.length) {
      const hop = kyURL && kyCo.some((k) => k.id === kyURL) ? kyURL : null;
      const dung = hop ?? (kyCo.some((k) => k.id === chon.ky) ? chon.ky : kyCo[0].id);
      if (dung !== chon.ky) datKy(dung);
    }
    const ma = (q.get("donvi") ?? "").split(",").filter(Boolean);
    const tenTuMa = ma.map((m) => donViCo.find((d) => d.id === m)?.ten).filter((x): x is string => Boolean(x));
    if (tenTuMa.join("|") !== chon.donVi.join("|")) datDonVi(tenTuMa);
    // Chỉ chạy lúc dựng màn: sau đó địa chỉ do chính thanh lọc ghi ra.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Mọi thay đổi của thanh lọc đều ghi ngược vào địa chỉ. */
  const ghiDiaChi = (kyMoi: string, tenDonVi: string[]) => {
    const macDinhKy = kyCo?.[0]?.id;
    const maDonVi = tenDonVi.map((t) => donViCo.find((d) => d.ten === t)?.id).filter(Boolean).join(",");
    datThamSo({ ky: kyMoi === macDinhKy ? null : kyMoi, donvi: maDonVi || null });
  };

  /*
    Loại kỳ là nút phân đoạn, kỳ cụ thể là ô chọn.

    Hai thứ này có thể gộp thành một `<select>` bảy dòng, nhưng người dùng QL1
    hỏi "tuần hay tháng" trước rồi mới hỏi "kỳ nào" — gộp lại thì họ phải đọc
    hết bảy dòng để tìm ra ranh giới giữa hai loại, mỗi lần chọn.
  */
  const kyHienTai = kyCo?.find((k) => k.id === chon.ky) ?? kyCo?.[0];
  const loai: LoaiKy = kyHienTai?.loai ?? "TUAN";
  /* Chỉ dựng công tắc loại kỳ khi danh sách có THẬT SỰ từ hai loại trở lên.
     QL3 làm việc theo kỳ lũy kế từ đầu năm nên chỉ có một loại; dựng nút
     "Tuần" ở đó là dựng một control bấm vào không đổi được gì. */
  const loaiCo = [...new Set((kyCo ?? []).map((k) => k.loai))];
  const coHaiLoai = loaiCo.length > 1;
  const kyCungLoai = kyCo?.filter((k) => !coHaiLoai || k.loai === loai) ?? [];

  const doiLoai = (moi: LoaiKy) => {
    if (!kyCo || moi === loai) return;
    /* Đổi loại kỳ thì nhảy sang kỳ MỚI NHẤT của loại đó, không giữ lại một id
       không còn tồn tại trong danh sách vừa đổi. */
    const dau = kyCo.find((k) => k.loai === moi);
    if (dau) { datKy(dau.id); ghiDiaChi(dau.id, chon.donVi); }
  };

  const doiKy = (kyMoi: string) => { datKy(kyMoi); ghiDiaChi(kyMoi, chon.donVi); };

  const dangChon = chon.donVi.filter((dv) => ten.includes(dv));
  const tomTat = dangChon.length === 0 ? "Toàn ngành"
    : dangChon.length === 1 ? rutGon(dangChon[0])
    : `${dangChon.length} đơn vị`;

  const bat = (dv: string) => {
    const co = chon.donVi.includes(dv);
    const moi = co ? chon.donVi.filter((x) => x !== dv) : [...chon.donVi, dv];
    datDonVi(moi);
    ghiDiaChi(chon.ky, moi);
  };

  const datLaiDuoc = dangChon.length > 0 || (kyCo ? chon.ky !== kyCo[0].id : false);

  return <div className="bo-loc-chung">
    {kyCo
      ? <>
          {coHaiLoai && <div className="bo-loc-muc">
            <span className="bo-loc-nhan">Loại kỳ</span>
            {/* Dựng từ CÁC LOẠI CÓ THẬT trong danh mục kỳ, không từ một danh
                sách viết cứng: báo cáo tổng đài có ngày/tuần/tháng, QL2-01 chỉ
                có tháng và lũy kế. Viết cứng thì mỗi báo cáo mới lại phải sửa
                đúng chỗ này, và quên một lần là hiện một nút không bấm được. */}
            <div className="bo-loc-seg" role="group" aria-label="Loại kỳ">
              {loaiCo.map((l) => <button key={l} type="button" aria-pressed={loai === l} onClick={() => doiLoai(l)}>{NHAN_LOAI_KY[l]}</button>)}
            </div>
          </div>}
          {loai === "TUYCHON" && kyTuyChon ? kyTuyChon : <div className="bo-loc-muc">
            <span className="bo-loc-nhan" id="bo-loc-ky-nhan">Kỳ</span>
            <select className="bo-loc-select" aria-labelledby="bo-loc-ky-nhan" value={kyHienTai?.id ?? ""} onChange={(e) => doiKy(e.target.value)}>
              {kyCungLoai.map((k) => <option key={k.id} value={k.id}>{k.nhan}</option>)}
            </select>
          </div>}
        </>
      : <div className="bo-loc-muc">
          <span className="bo-loc-nhan">Kỳ</span>
          <strong className="bo-loc-ky">{ky}</strong>
        </div>}

    <div className="bo-loc-muc">
      <span className="bo-loc-nhan" id="bo-loc-donvi-nhan">Đơn vị</span>
      {/* Hộp chọn nhiều tự dựng thay vì `<select multiple>`: select nhiều trên
          khổ hẹp cao bằng nửa màn và không cho biết đã chọn gì nếu không cuộn. */}
      {/* Escape là đường thoát bằng bàn phím; focus vẫn ở nút mở nên người
          dùng không bị ném về đầu trang. */}
      <div className="bo-loc-chon" ref={hopChon} onKeyDown={(e) => { if (e.key === "Escape") setMo(false); }}>
        <button type="button" className="bo-loc-nut" aria-expanded={mo} aria-haspopup="true" aria-labelledby="bo-loc-donvi-nhan" onClick={() => setMo((t) => !t)}>
          <span>{tomTat}</span><Icon name="chevronDown" size={16}/>
        </button>
        {mo && <div className="bo-loc-menu" role="group" aria-label="Chọn đơn vị">
          {ten.map((dv) => <label key={dv}>
            <input type="checkbox" checked={chon.donVi.includes(dv)} onChange={() => bat(dv)}/>
            <span>{rutGon(dv)}</span>
          </label>)}
        </div>}
      </div>
    </div>

    {datLaiDuoc && <Button kind="quiet" onClick={() => {
      const kyGoc = kyCo?.[0]?.id ?? chon.ky;
      datDonVi([]); if (kyCo) datKy(kyGoc);
      ghiDiaChi(kyGoc, []);
    }}>Đặt lại</Button>}
    {phuChu && <span className="bo-loc-phu">{phuChu}</span>}
  </div>;
}
