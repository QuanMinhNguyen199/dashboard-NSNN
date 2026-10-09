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
  nào có chênh lệch cần đối chiếu nhật ký xử lý trước khi kết luận thiếu số liệu.
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
      <strong>Nguồn dữ liệu khác ngày chốt báo cáo</strong>
      <span>
        Ngày chốt báo cáo: {ngayBaoCao}. Một số nguồn dữ liệu hiện tại chốt ngày {lechNgay.join(" và ")}.
        Cần xác nhận ngày chốt trước khi sử dụng số liệu.
      </span>
    </div>}

    {coLechDong.length > 0 && <div className="notice critical">
      <strong>{coLechDong.length} nguồn có chênh lệch số dòng</strong>
      <span>
        Tổng chênh lệch: {integer(coLechDong.reduce((t, n) => t + Math.abs(lechDong(n)), 0))} dòng.
        Đối chiếu nhật ký xử lý để xác định dòng đã loại, dòng trùng hoặc dữ liệu còn thiếu trước khi chốt báo cáo.
      </span>
    </div>}

    <Panel chinh title="Nguồn dữ liệu của kỳ">
      <TableWrap label="danh sách nguồn dữ liệu của kỳ"><table className="nguon-table">
        {/* Bề rộng đo theo chuỗi dài nhất THỰC SỰ có trong cột, không ước
            lượng: "Đối chiếu người nộp thuế" ở cột cuối và "Thời điểm thu
            thập" ở tiêu đề là hai chuỗi quyết định hai cột rộng nhất. */}
        <colgroup><col style={{ width: 300 }}/><col style={{ width: 210 }}/><col style={{ width: 124 }}/><col style={{ width: 116 }}/><col style={{ width: 142 }}/><col style={{ width: 118 }}/><col style={{ width: 124 }}/><col style={{ width: 112 }}/><col style={{ width: 196 }}/></colgroup>
        <thead><tr>
          <th scope="col">Nguồn</th><th scope="col">Hệ thống / chức năng</th><th scope="col">Cách thu thập</th>
          <th scope="col">Ngày chốt</th><th scope="col">Thời điểm thu thập</th>
          <th scope="col" className="num">Dòng nguồn</th><th scope="col" className="num">Dòng vào kho</th>
          <th scope="col" className="num">Chênh lệch</th><th scope="col">Dùng cho</th>
        </tr></thead>
        <tbody>{nguon.map((n) => {
          const lech = lechDong(n);
          return <tr key={n.id}>
            <th scope="row"><span>{n.ten}</span></th>
            <td>{n.heThong}</td>
            <td>{n.cach === "TU_DONG" ? <Badge tone="positive">Tự động</Badge> : <Badge tone="warning">Thủ công</Badge>}</td>
            <td>{n.ngayChot}</td>
            <td>{n.thoiDiemKeo}</td>
            <td className="num">{integer(n.dongNguon)}</td>
            <td className="num">{integer(n.dongVaoKho)}</td>
            <td className="num">{lech === 0 ? <span className="cell-empty">—</span> : <span className="quality-note">{integer(lech)}</span>}</td>
            <td><small>{n.dungCho}</small></td>
          </tr>;
        })}</tbody>
      </table></TableWrap>
      <footer className="table-footer">
        <Button kind="secondary" onClick={() => notify("Chức năng xem từng dòng dữ liệu gốc chưa có trong bản mô phỏng.")}>Xem dữ liệu gốc</Button>
      </footer>
    </Panel>
  </>;
}
