import { RiskQL3 } from "@/features/RiskQL3";
import type { VaiTro } from "@/domain/types";

/*
  Màn của phòng QL3.

  Bản trước gom bốn thứ vào đây: kiểm tra tại bàn, chênh lệch tờ khai – hóa
  đơn, xác minh hóa đơn, và một dải hệ số K. Ba thứ sau KHÔNG phải việc của
  QL3. BRD mục 8 xếp chúng vào QLDN2 — `BR-QL2-01` chênh lệch tờ khai – HĐĐT,
  `BR-QL2-02` hệ số K, `BR-QL2-04` xác minh hóa đơn — còn QL3 chỉ có hai báo
  cáo: `BR-QL3-01` kiểm tra tại bàn theo kế hoạch năm và `BR-QL3-02` tổng hợp
  báo cáo khối QLDN.

  Để chúng ở màn QL3 làm bản demo nói sai về phân công giữa các phòng, đúng
  loại sai mà việc tách tài khoản theo phòng đang cố tránh. Phòng QLDN2 chưa
  có phân hệ trong bản này, nên ba nội dung ấy chờ ở đó.
*/
export function Risk({ actor, vaiTro }: { actor: string; vaiTro: VaiTro }) {
  return <RiskQL3 actor={actor} vaiTro={vaiTro}/>;
}
