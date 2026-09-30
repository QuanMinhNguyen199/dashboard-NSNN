/*
  Nạp bộ dữ liệu thật lúc chạy, KHÔNG nhúng vào mã nguồn.

  Bộ này có khoảng 21 nghìn dòng người nộp thuế kèm mã số thuế và tên doanh
  nghiệp thật. Nhúng vào `src/data/` thì nó đi theo mọi bản build và lên remote
  ngay lần push đầu tiên. Ở đây nó nằm trong `public/du-lieu-that/` — thư mục đã
  được .gitignore — và chỉ tồn tại trên máy đã chạy `scripts/nap-du-lieu-that.py`.

  Không có tệp thì mọi hàm dưới đây trả `null`, và màn hình rơi về bộ dữ liệu mô
  phỏng có sẵn. Bản deploy công khai vì thế vẫn chạy được mà không mang dữ liệu
  thật theo.
*/

export interface MocNo {
  tongCong: number | null;
  noKNT: number | null;
  khoThu: number | null;
  dangXuLy: number | null;
}

/** Một dòng trong bảng nợ theo phòng. Đơn vị tiền: TRIỆU ĐỒNG. */
export interface DonViNo {
  ten: string;
  stt: string | null;
  /** Dòng tổng ("TỔNG TOÀN NGÀNH", "TỔNG VP THUẾ TP HÀ NỘI", "TỔNG THUẾ CƠ SỞ") không có số thứ tự. */
  laTongHop: boolean;
  hienTai: MocNo;
  soVoiDauNam: MocNo;
  soVoiDauNamPhanTram: MocNo;
  soVoiThangTruoc: MocNo;
  soVoiTuanTruoc: MocNo;
}

/** Cưỡng chế và tạm hoãn xuất cảnh dùng chung khuôn này. Đơn vị tiền: ĐỒNG. */
export interface HangThucHien {
  donVi: string;
  phaiNNT: number | null;
  phaiTien: number | null;
  daNNT: number | null;
  daTien: number | null;
  chuaNNT: number | null;
  chuaTien: number | null;
  tyLe: number | null;
}

export interface QuyTacNguon {
  noiDung: string;
  giaTri: string | null;
}

export interface TongHopThat {
  tenTep: string;
  tieuDe: string;
  ngayBaoCao: string | null;
  nguongTangNoKNT: number | string | null;
  donViTien: string;
  quyTacNguon: QuyTacNguon[];
  noTheoDonVi: DonViNo[];
  cuongChe: HangThucHien[];
  tamHoanXuatCanh: HangThucHien[];
  tamHoanTongHop: { donVi: string; chuaTamHoanNNT: number | null; chuaTamHoanTien: number | null; tyLeChuaTamHoan: number | null }[];
  soDong: Record<string, number>;
}

/** Một người nộp thuế chưa bị cưỡng chế. Đơn vị tiền: ĐỒNG. */
export interface HangChuaCuongChe {
  stt: string | null;
  mst: string | null;
  ten: string | null;
  maCQT: string | null;
  donVi: string | null;
  loaiNNT: string | null;
  chuong: number | null;
  noThang: number | null;
  noNgay: number | null;
  noDanhGia: number | null;
  tongNoDanhGia: number | null;
  nguong: number | null;
  tinhTrang: string | null;
  bienPhap: string | null;
  quyetDinh: string | null;
  ketLuan: string | null;
  ghiChu: string | null;
}

const GOC = `${import.meta.env.BASE_URL}du-lieu-that/`;

/*
  Một lần hỏng là hỏng hẳn: nếu tệp không có, đừng thử lại ở mỗi lần dựng lại
  component. `null` được nhớ lại như một kết quả hợp lệ.
*/
const bo = new Map<string, Promise<unknown | null>>();

async function nap<T>(ten: string): Promise<T | null> {
  if (!bo.has(ten)) {
    bo.set(ten, (async () => {
      try {
        const res = await fetch(`${GOC}${ten}`, { cache: "no-cache" });
        if (!res.ok) return null;
        return (await res.json()) as unknown;
      } catch {
        return null;
      }
    })());
  }
  return (await bo.get(ten)!) as T | null;
}

export const napTongHop = () => nap<TongHopThat>("tong-hop.json");
export const napChuaCuongChe = () => nap<HangChuaCuongChe[]>("chua-cuong-che.json");

/** Tìm một dòng đơn vị theo tên gần đúng; bảng gốc viết đầy đủ "Phòng Quản lý, Hỗ trợ doanh nghiệp số 1". */
export const timDonVi = (ds: DonViNo[], khoa: string) =>
  ds.find((d) => d.ten.toLowerCase().includes(khoa.toLowerCase())) ?? null;
