import { Badge, Button, Panel, TableWrap, integer } from "@/components/ui";
import { useAction } from "@/state/ActionContext";
import { lechDong, lechNgayChot, type NguonDuLieu } from "@/data/nguonDuLieu";

/*
  Tab "Dữ liệu gốc" — §4.4 (QL1) và §5.4 (QL3) bản thiết kế.

  Một component cho cả hai phân hệ: yêu cầu của hai mục giống nhau đến từng
  dòng (danh sách nguồn với kỳ kéo, số dòng nguồn so với số dòng vào kho,
  trạng thái), chỉ khác danh sách nguồn truyền vào.

  Màn này tồn tại để trả lời đúng một câu: "số trên báo cáo lấy từ đâu ra".
  Vì thế cột đáng chú ý nhất không phải tên nguồn mà là CHÊNH LỆCH DÒNG — nguồn
  nào có dòng vào kho ít hơn dòng nguồn thì mọi con số dẫn xuất từ nó đều thiếu.
*/
export function DuLieuGoc({ nguon, ngayBaoCao }: { nguon: NguonDuLieu[]; ngayBaoCao: string }) {
  const notify = useAction();
  const lechNgay = lechNgayChot(nguon, ngayBaoCao);
  const coLechDong = nguon.filter((n) => lechDong(n) !== 0);

  return <>
    {/*
      Cảnh báo lệch ngày chốt đứng TRƯỚC bảng, không phải một chú thích cuối
      trang: nó làm thay đổi cách đọc mọi con số bên dưới. File mẫu thật có ba
      mốc ngày cho cùng một kỳ mà không chỗ nào giải thích.
    */}
    {lechNgay.length > 0 && <div className="notice warning">
      <strong>Các nguồn không cùng một ngày chốt</strong>
      <span>
        Báo cáo ghi kỳ chốt {ngayBaoCao}, nhưng nguồn dùng cho bảng tổng hợp chốt ngày {lechNgay.join(" và ")}.
        Số trên báo cáo vì thế không phải ảnh chụp của một thời điểm duy nhất. Cần phòng nghiệp vụ xác nhận mốc nào là mốc đúng.
      </span>
    </div>}

    {coLechDong.length > 0 && <div className="notice critical">
      <strong>{coLechDong.length} nguồn có số dòng vào kho ít hơn số dòng nguồn</strong>
      <span>
        Thiếu {integer(coLechDong.reduce((t, n) => t + lechDong(n), 0))} dòng. Mọi chỉ tiêu tính từ các nguồn này đều thiếu tương ứng,
        nên phải xử lý trước khi chốt số kỳ.
      </span>
    </div>}

    <Panel title="Danh sách nguồn của kỳ" subtitle="Đường dẫn thư mục không hiển thị trên màn hình theo quy định bảo mật dữ liệu.">
      <TableWrap label="danh sách nguồn dữ liệu của kỳ"><table className="nguon-table">
        <colgroup><col style={{ width: 300 }}/><col style={{ width: 200 }}/><col style={{ width: 112 }}/><col style={{ width: 116 }}/><col style={{ width: 128 }}/><col style={{ width: 118 }}/><col style={{ width: 118 }}/><col style={{ width: 112 }}/><col style={{ width: 120 }}/></colgroup>
        <thead><tr>
          <th scope="col">Nguồn</th><th scope="col">Hệ thống / chức năng</th><th scope="col">Cách lấy</th>
          <th scope="col">Ngày chốt</th><th scope="col">Thời điểm kéo</th>
          <th scope="col" className="num">Dòng nguồn</th><th scope="col" className="num">Dòng vào kho</th>
          <th scope="col" className="num">Chênh lệch</th><th scope="col">Dùng cho</th>
        </tr></thead>
        <tbody>{nguon.map((n) => {
          const lech = lechDong(n);
          return <tr key={n.id}>
            <th scope="row"><span>{n.ten}</span></th>
            <td>{n.heThong}</td>
            <td>{n.cach === "TU_DONG" ? <Badge tone="positive">Tự động</Badge> : <Badge tone="warning">Tải tay</Badge>}</td>
            <td>{n.ngayChot}</td>
            <td>{n.thoiDiemKeo}</td>
            <td className="num">{integer(n.dongNguon)}</td>
            <td className="num">{integer(n.dongVaoKho)}</td>
            <td className="num">{lech === 0 ? <span className="cell-empty">—</span> : <span className="delta is-up">▲ {integer(lech)}</span>}</td>
            <td><small>{n.dungCho}</small></td>
          </tr>;
        })}</tbody>
      </table></TableWrap>
      <footer className="table-footer">
        <p className="bang-ghi-chu">Bảng thô của từng nguồn chỉ đọc, không sửa được trong hệ.</p>
        <Button kind="secondary" onClick={() => notify("Bản demo chưa dựng bảng thô. Bản thật mở bảng chỉ đọc, phân trang, tìm theo mã số thuế.")}>Xem bảng thô</Button>
      </footer>
    </Panel>
  </>;
}
