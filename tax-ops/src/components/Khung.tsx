import { Panel } from "@/components/ui";

/*
  Màn KHUNG — báo cáo đã có tên và có chỗ đứng trong điều hướng, nhưng phòng
  nghiệp vụ chưa gửi mẫu nên chưa dựng được bảng thật.

  Ba cách làm sai mà khối này thay thế:

  • Bỏ hẳn mục khỏi điều hướng. Người dùng không biết báo cáo ấy nằm trong
    phạm vi, và lúc nó xuất hiện thì cả cụm mục đổi chỗ.
  • Dựng một bảng với cột bịa ra. Bản mẫu khi ấy nói sai về thứ sẽ được giao,
    và người đọc không có cách nào biết cột nào là thật.
  • Để trang trắng. Người dùng không phân biệt được "chưa có" với "hỏng".

  Khối này nói đúng ba thứ: biết gì rồi, thiếu gì, và đang chờ ai trả lời.
  Câu hỏi đang mở ghi thẳng mã (Q-99, Q-12…) để người đọc tra được trong §8 của
  bản thiết kế thay vì phải hỏi lại.
*/
export function Khung({ tieuDe, moTa, daBiet, conThieu, cauHoi }: {
  tieuDe: string;
  moTa: string;
  /** Những gì tài liệu đã xác lập — dựng được ngay khi có mẫu. */
  daBiet: string[];
  /** Những gì còn thiếu để dựng bảng thật. */
  conThieu: string[];
  /** Mã câu hỏi đang chờ trả lời, theo §8 bản thiết kế. */
  cauHoi: string[];
}) {
  return <Panel chinh title={tieuDe} subtitle={moTa}>
    <div className="khung">
      <div className="notice warning">
        <strong>Chưa có mẫu báo cáo từ phòng nghiệp vụ</strong>
        <span>
          Mục này dựng khung để giữ đúng chỗ trong điều hướng và trong vòng duyệt.
          Bố cục cột sẽ đổi khi mẫu về, nên đừng trích số từ đây.
        </span>
      </div>

      <div className="khung-cot">
        <section>
          <h3>Đã xác lập</h3>
          <ul>{daBiet.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section>
          <h3>Còn thiếu để dựng bảng</h3>
          <ul>{conThieu.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      </div>

      <p className="khung-hoi">
        Đang chờ trả lời: {cauHoi.join(" · ")}
      </p>
    </div>
  </Panel>;
}
