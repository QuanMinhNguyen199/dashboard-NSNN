import type { ReactNode } from "react";
import { GoiYCachTinh } from "@/components/GoiYCachTinh";

/*
  Gọn chữ (11/11/2026, người dùng: "web đang hơi nhiều text, thay bớt bằng
  icon, indicator"). Hai mảnh dùng chung, cùng hành vi với "Cách tính ⓘ":
  rê chuột / Tab / chạm để đọc, không phải nút.

  • GhiChu: ⓘ xám đứng ngay sau tên khối. Thay các đoạn ghi chú cách đếm,
    nguồn, kỳ kéo… từng nằm thành 2–3 dòng dưới bảng.
  • ChoChot: chip vàng "Chờ chốt ⓘ". Thay các câu "bản đề xuất, chờ biên bản
    …, việc số …". Giữ CHỮ chứ không chỉ icon: đây là điều phải nói thẳng với
    phía Thuế, không được để người xem phải rê chuột mới biết số còn tạm.
*/
export function GhiChu({ children, tieuDe = "Ghi chú", placement }: { children: ReactNode; tieuDe?: string; placement?: "bottom start" | "bottom end" }) {
  return <GoiYCachTinh kieu="icon" nhan={tieuDe} tieuDe={tieuDe} className="is-ghi-chu" placement={placement}>{children}</GoiYCachTinh>;
}

export function ChoChot({ children, nhan = "Chờ chốt", placement }: { children: ReactNode; nhan?: string; placement?: "bottom start" | "bottom end" }) {
  return <GoiYCachTinh kieu="nhan" nhan={nhan} tieuDe={nhan} className="is-tam-tinh is-cho-chot" placement={placement} tenDoc={`${nhan} — xem lý do`}>{children}</GoiYCachTinh>;
}
