import { useCallback, useEffect, useState } from "react";

/*
  Trạng thái màn hình nằm trong ĐỊA CHỈ, không nằm trong bộ nhớ.

  Lý do không phải là tiện: nó là điều kiện để một trợ lý nói chuyện với người
  dùng dẫn họ tới đúng chỗ. Trước đó chỉ `?view=` nằm trong URL, nên câu dài
  nhất mà trợ lý nói được là "mở màn báo cáo nợ" — không nói được "báo cáo
  tuần 31/07 của Phòng QLHT DN 1, mục So sánh nợ, đang mở bản xem trước".
  Người dùng bấm vào rồi vẫn phải tự lọc lại, tức là cái liên kết không dẫn
  được ai tới đâu.

  Ba quy ước:

  1. **Giá trị mặc định KHÔNG ghi vào địa chỉ.** Liên kết chỉ mang những gì
     khác mặc định, nên nó ngắn và đọc ra ý định: `?view=debt&muc=cc` nói
     "mục cưỡng chế", không lẫn với sáu tham số đang ở giá trị gốc.

  2. **Dùng `replaceState`, không `pushState`.** Đổi bộ lọc là tinh chỉnh cùng
     một màn, không phải đi sang chỗ khác; đẩy vào lịch sử thì bấm Lùi mười
     lần mới ra khỏi một màn.

  3. **Địa chỉ chỉ ĐỌC trạng thái, không thực hiện hành động.** Không có tham
     số nào duyệt hay chốt số. Mở một liên kết là xem; chuyển tiếp liên kết
     cho người khác không được phép biến thành người đó duyệt hộ — mục QR-03
     còn cấm cả người lập tự duyệt bản của mình.
*/

const doc = (ten: string) => new URLSearchParams(window.location.search).get(ten);

/** Ghi nhiều tham số một lượt. `null` hoặc chuỗi rỗng là xoá tham số đó. */
export function datThamSo(cap: Record<string, string | null>) {
  const q = new URLSearchParams(window.location.search);
  for (const [khoa, gia] of Object.entries(cap)) {
    if (gia === null || gia === "") q.delete(khoa);
    else q.set(khoa, gia);
  }
  const chuoi = q.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${chuoi ? `?${chuoi}` : ""}`);
}

/*
  Tham số của RIÊNG từng màn. Đổi màn thì xoá hết, vì `muc=cc` của báo cáo nợ
  không có nghĩa gì ở màn tình trạng dữ liệu, và để nó lại thì địa chỉ mô tả
  một trạng thái không tồn tại.
*/
/* `nhom` là nhóm chỉ tiêu đang mở của bảng rộng — cùng loại với `moc` (mốc
   so sánh của QL1): một lựa chọn hiển thị mà người ta cần dẫn nhau tới. */
export const THAM_SO_MAN = ["ky", "donvi", "muc", "moc", "nhom", "co", "loc", "loaitk", "ketqua", "nhomk", "ktu", "kden", "khoi", "so", "nnt", "trang", "xem"] as const;

export const xoaThamSoMan = () =>
  datThamSo(Object.fromEntries(THAM_SO_MAN.map((t) => [t, null])));

/**
 * Một mẩu trạng thái sống trong địa chỉ.
 *
 * `hopLe` lọc giá trị người khác gõ tay vào thanh địa chỉ: một `muc=xyz` không
 * tồn tại phải rơi về mặc định chứ không được làm trắng màn.
 */
export function useThamSo<T extends string>(
  ten: string,
  macDinh: T,
  hopLe?: readonly T[],
): [T, (gia: T) => void] {
  const lay = useCallback((): T => {
    const x = doc(ten) as T | null;
    if (x === null) return macDinh;
    return !hopLe || hopLe.includes(x) ? x : macDinh;
  }, [ten, macDinh, hopLe]);

  const [gia, datNoiBo] = useState<T>(lay);

  const dat = useCallback((moi: T) => {
    datNoiBo(moi);
    datThamSo({ [ten]: moi === macDinh ? null : moi });
  }, [ten, macDinh]);

  /* Bấm Lùi phải đưa màn về đúng trạng thái của địa chỉ trước đó. */
  useEffect(() => {
    const khiLui = () => datNoiBo(lay());
    window.addEventListener("popstate", khiLui);
    return () => window.removeEventListener("popstate", khiLui);
  }, [lay]);

  return [gia, dat];
}

/** Dạng số, cho những thứ như số trang. */
export function useThamSoSo(ten: string, macDinh: number): [number, (gia: number) => void] {
  const [chuoi, datChuoi] = useThamSo<string>(ten, String(macDinh));
  const so = Number.parseInt(chuoi, 10);
  return [Number.isFinite(so) && so > 0 ? so : macDinh, (gia) => datChuoi(String(gia))];
}

/** Danh sách, mã ngăn bằng dấu phẩy. Rỗng = không lọc. */
export function useThamSoDanhSach(ten: string): [string[], (gia: string[]) => void] {
  const [chuoi, datChuoi] = useThamSo<string>(ten, "");
  const danhSach = chuoi ? chuoi.split(",").filter(Boolean) : [];
  return [danhSach, (gia) => datChuoi(gia.join(","))];
}
