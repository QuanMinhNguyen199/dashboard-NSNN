import { KY_CUA_BAO_CAO_QL1 } from "@/data/ql1";
import { KY_CUA_BAO_CAO } from "@/data/ql2";
import { KY_QL3 } from "@/data/ql3";
import { KY_CUA_BAO_CAO_QL4 } from "@/data/ql4";
import type { Phong } from "@/domain/types";

/*
  MỌI khóa duyệt của một phòng — dùng để đếm "báo cáo chờ duyệt".

  Khóa duyệt không cùng một hình dạng ở bốn phòng, và đó không phải sự tùy
  tiện: ba phòng có NHIỀU báo cáo chạy nhịp khác nhau nên khóa phải mang mã
  báo cáo (`QL2|QL2-02|q202-w39`), còn QL3 mới dựng một báo cáo nên khóa chỉ
  có kỳ (`QL3|ky-09`). Gộp chúng lại bằng một chuỗi `${phong}|${ky}` chung là
  đếm trúng đúng một phòng và trả về 0 cho ba phòng kia — mà số 0 ấy trông
  hợp lệ, nên không ai phát hiện.

  Trang Công việc theo kỳ vì thế hỏi ở đây, không tự ghép chuỗi.
*/
export function khoaDuyetCua(phong: Phong): string[] {
  if (phong === "QL3") return KY_QL3.map((k) => `QL3|${k.id}`);

  const theoBaoCao: Record<string, Record<string, { id: string }[]>> = {
    QL1: KY_CUA_BAO_CAO_QL1,
    QL2: KY_CUA_BAO_CAO,
    QL4: KY_CUA_BAO_CAO_QL4,
  };
  const bang = phong ? theoBaoCao[phong] : undefined;
  if (!bang) return [];
  return Object.entries(bang).flatMap(([baoCao, ds]) => ds.map((k) => `${phong}|${baoCao}|${k.id}`));
}
