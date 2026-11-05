import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { Button, Checkbox, MenuPop, SelectMenu } from "@/components/ui";
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

/*
  KHÓA ĐƠN VỊ theo phòng của người đăng nhập (chốt 13/10/2026).

  Năm phòng QLDN làm cùng một việc, chỉ khác số liệu và người nộp thuế. Báo
  cáo của một phòng vì thế CỐ ĐỊNH là số của một phòng — phòng của người xem,
  hoặc phòng trưởng phòng chọn ở ô Phạm vi (15/10/2026: trưởng phòng xem được
  phòng của nhau; chọn phòng ở đó, không ở đây, để ba mô-đun đi cùng nhau). Khóa theo MÃ đơn vị (P1…P5),
  không theo tên: QL3 gọi cùng một phòng là "Phòng QLHTDN 3" trong khi ba
  phân hệ kia dùng tên đầy đủ. Lãnh đạo Thuế TP không có phòng nên không khóa.
*/
const KhoaNgu = createContext<string | null>(null);
const KhoaCuaToi = createContext(true);
/** `cuaToi` = false khi trưởng phòng đang xem báo cáo của phòng khác. */
export function KhoaDonVi({ id, cuaToi = true, children }: { id: string | null; cuaToi?: boolean; children: ReactNode }) {
  return <KhoaNgu.Provider value={id}><KhoaCuaToi.Provider value={cuaToi}>{children}</KhoaCuaToi.Provider></KhoaNgu.Provider>;
}
/** Mã đơn vị đang khóa, hoặc `null`. Bảng tổng hợp dùng nó để thêm dòng toàn thành phố. */
export const useKhoaDonVi = () => useContext(KhoaNgu);

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

/*
  Ô đặt thanh lọc (29/10/2026). Báo cáo phân hệ NHÚNG trong một nhóm chỉ tiêu
  không dựng thanh lọc thứ hai dưới các hàng tab: nó vẽ vào đúng ô thanh phạm vi
  ở đầu màn (Fixed Slots — ô đứng yên, nội dung đổi theo chế độ). Không có ô thì
  thanh lọc dựng tại chỗ như ở màn phân hệ riêng.
*/
export const ODatBoLoc = createContext<HTMLElement | null>(null);

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
  const khoaId = useContext(KhoaNgu);
  const khoaCuaToi = useContext(KhoaCuaToi);
  const khoaTen = khoaId ? donViCo.find((d) => d.id === khoaId)?.ten ?? null : null;
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
    /* Đang khóa thì địa chỉ không đổi được đơn vị: một liên kết `donvi=P2`
       gửi cho người phòng 3 vẫn mở số của phòng 3. */
    const ma = (q.get("donvi") ?? "").split(",").filter(Boolean);
    const tenTuMa = khoaTen ? [khoaTen] : ma.map((m) => donViCo.find((d) => d.id === m)?.ten).filter((x): x is string => Boolean(x));
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

  const datLaiDuoc = (!khoaTen && dangChon.length > 0) || (kyCo ? chon.ky !== kyCo[0].id : false);

  const oDat = useContext(ODatBoLoc);
  const noiDung = <>
    {kyCo
      ? <>
          {coHaiLoai && <div className="bo-loc-muc">
            {/* Trong ô thanh phạm vi, nút "Tháng | Quý" tự nói nó là gì — nhãn
                chỉ còn cho trình đọc màn hình, để thanh vừa một dòng. */}
            <span className={oDat ? "sr-only" : "bo-loc-nhan"}>Loại kỳ</span>
            {/* Dựng từ CÁC LOẠI CÓ THẬT trong danh mục kỳ, không từ một danh
                sách viết cứng: báo cáo tổng đài có ngày/tuần/tháng, QL2-01 chỉ
                có tháng và lũy kế. Viết cứng thì mỗi báo cáo mới lại phải sửa
                đúng chỗ này, và quên một lần là hiện một nút không bấm được. */}
            <ToggleButtonGroup className="bo-loc-seg" aria-label="Loại kỳ" selectionMode="single" disallowEmptySelection selectedKeys={[loai]}
              onSelectionChange={(k) => { const l = [...k][0]; if (l !== undefined) doiLoai(l as LoaiKy); }}>
              {loaiCo.map((l) => <ToggleButton key={l} id={l}>{NHAN_LOAI_KY[l]}</ToggleButton>)}
            </ToggleButtonGroup>
          </div>}
          {loai === "TUYCHON" && kyTuyChon ? kyTuyChon : <div className="bo-loc-muc">
            <span className="bo-loc-nhan" id="bo-loc-ky-nhan">Kỳ</span>
            <SelectMenu label="Kỳ" labelledBy="bo-loc-ky-nhan" value={kyHienTai?.id ?? ""} onChange={doiKy} options={kyCungLoai.map((k) => ({ value: k.id, label: k.nhan }))}/>
          </div>}
        </>
      : <div className="bo-loc-muc">
          <span className="bo-loc-nhan">Kỳ</span>
          <strong className="bo-loc-ky">{ky}</strong>
        </div>}

    <div className="bo-loc-muc">
      {/* Trong ô thanh phạm vi, nhãn giữ đúng chữ của ô ấy. */}
      <span className="bo-loc-nhan" id="bo-loc-donvi-nhan">{oDat ? "Phạm vi" : "Đơn vị"}</span>
      {/* Hộp chọn nhiều tự dựng thay vì `<select multiple>`: select nhiều trên
          khổ hẹp cao bằng nửa màn và không cho biết đã chọn gì nếu không cuộn. */}
      {khoaTen ? <strong className="bo-loc-ky" aria-labelledby="bo-loc-donvi-nhan" title="Đổi phòng: về Kết quả và chọn ở ô Phạm vi">{rutGon(khoaTen)}{khoaCuaToi ? (oDat ? "" : " · phòng của bạn") : " · chỉ xem"}</strong> :
      <MenuPop nut={<span>{tomTat}</span>} labelledBy="bo-loc-donvi-nhan" ten="Chọn đơn vị">
        {ten.map((dv) => <Checkbox key={dv} checked={chon.donVi.includes(dv)} onChange={() => bat(dv)}><span>{rutGon(dv)}</span></Checkbox>)}
      </MenuPop>}
    </div>

    {datLaiDuoc && <Button kind="quiet" onClick={() => {
      const kyGoc = kyCo?.[0]?.id ?? chon.ky;
      datDonVi(khoaTen ? [khoaTen] : []); if (kyCo) datKy(kyGoc);
      ghiDiaChi(kyGoc, []);
    }}>Đặt lại</Button>}
    {phuChu && <span className="bo-loc-phu">{phuChu}</span>}
  </>;
  if (oDat) return createPortal(noiDung, oDat);
  return <div className="bo-loc-chung">{noiDung}</div>;
}
