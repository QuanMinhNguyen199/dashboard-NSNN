import { useRef, type MouseEvent } from "react";
import { useThamSo } from "@/state/diaChi";

/*
  Bảng gọn cộng ngăn trượt — MỘT cách dựng cho mọi danh sách hồ sơ.

  Danh sách chi tiết của bốn phòng đều rơi vào cùng một tình thế: nguồn có vài
  chục cột, màn có 1.146px, và việc trên màn là chọn ra hồ sơ cần xử lý chứ
  không phải đọc hết mọi cột của mọi dòng. Cách giải cũng chỉ có một: bảng giữ
  những cột đủ để CHỌN, phần còn lại đọc trong ngăn trượt khi đã chọn.

  Dựng lại cách ấy ở từng màn thì mỗi màn lạc một ít — chỗ nhớ nơi bấm, chỗ
  không; chỗ chặn nút trong hàng, chỗ để nút vừa chạy việc của nó vừa mở ngăn.
  Nên ba thứ dễ lạc nhất nằm ở đây:

  1. Hồ sơ đang mở nằm trong ĐỊA CHỈ, gửi được liên kết tới đúng hồ sơ đang bàn.
  2. Đóng ngăn thì con trỏ về đúng dòng vừa bấm, không bị ném lên đầu bảng.
  3. Nút nằm TRONG hàng là việc riêng của nó. Bấm nút không mở ngăn — nếu không,
     mỗi lần đánh dấu hay giao phiếu lại bật ra một ngăn không ai gọi.
*/
export function useChonHang(khoa: "so" | "nnt" = "so") {
  const [dangMo, datDangMo] = useThamSo<string>(khoa, "");
  const noiBam = useRef<HTMLButtonElement | null>(null);

  const dong = () => {
    datDangMo("");
    requestAnimationFrame(() => noiBam.current?.focus());
  };

  /** Rải vào `<tr>`: nền dòng đang mở, và cú bấm cả hàng. */
  const hang = (id: string) => ({
    className: id === dangMo ? "is-selected" : undefined,
    onClick: (e: MouseEvent<HTMLTableRowElement>) => {
      const nut = (e.target as HTMLElement).closest("button");
      if (nut && !nut.classList.contains("row-select")) return;
      noiBam.current = e.currentTarget.querySelector<HTMLButtonElement>(".row-select");
      datDangMo(id === dangMo ? "" : id);
    },
  });

  return { dangMo, datDangMo, dong, hang };
}

/*
  Ô đầu của dòng: nút phủ hết ô để bàn phím mở được hồ sơ, vì cú bấm cả hàng là
  đường tắt của chuột và chuột không phải ai cũng dùng — The Whole Row Rule.
*/
export function ONhan({ id, dangMo, title, children }: {
  id: string;
  dangMo: string;
  title?: string;
  children: React.ReactNode;
}) {
  return <td><button type="button" className="row-select" aria-expanded={id === dangMo} title={title}>{children}</button></td>;
}
