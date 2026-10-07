import { useMemo } from "react";
import { Badge, Button, Panel, TableWrap, money } from "@/components/ui";
import { useAction } from "@/state/ActionContext";
import { usePhieu } from "@/state/PhieuContext";
import { rutGonTenDonVi } from "@/data/danhMuc";
import { CAU_HINH, dsPhieu, type LoaiPhieu } from "@/data/phieu";

/*
  Bảng tiến độ phiếu, góc nhìn PHÒNG GIAO PHIẾU — §6:
  "Bảng tiến độ theo đơn vị: giao / đã phản hồi / quá hạn · Nút Nhắc".

  Khối này trả lời câu mà vòng email cũ không trả lời được: giao rồi thì ai
  đã trả, ai chưa, và ai trễ. Trong vòng cũ, chuyên viên phải mở hộp thư ra
  đếm; ở đây nó là một bảng, và nút Nhắc nằm đúng trên dòng của đơn vị chưa
  trả chứ không phải một nút chung ở đầu màn.

  Chỉ CHUYÊN VIÊN thấy khối này. Ma trận §3 ghi "Giao phiếu rà soát cho đơn
  vị | ● | ✗" — trưởng phòng đọc số, không giao việc xuống đơn vị.
*/
export function TienDoPhieu({ loai, hatKy }: { loai: LoaiPhieu; hatKy: number }) {
  const notify = useAction();
  const { daTraLoi } = usePhieu();
  const ch = CAU_HINH[loai];

  const theoDonVi = useMemo(() => {
    const dong = dsPhieu(loai, hatKy);
    const bo = new Map<string, { donVi: string; ids: string[]; quaHan: string[]; maPhieu: string }>();
    for (const d of dong) {
      const cu = bo.get(d.donVi) ?? { donVi: d.donVi, ids: [], quaHan: [], maPhieu: d.maPhieu };
      cu.ids.push(d.id);
      if (d.quaHan > 0) cu.quaHan.push(d.id);
      bo.set(d.donVi, cu);
    }
    return [...bo.values()];
  }, [loai, hatKy]);

  const tongGiao = theoDonVi.reduce((t, x) => t + x.ids.length, 0);
  const tongTra = theoDonVi.reduce((t, x) => t + daTraLoi(x.ids), 0);
  const chuaTra = theoDonVi.filter((x) => daTraLoi(x.ids) < x.ids.length);

  return <Panel
    title={`Tiến độ phiếu ${ch.loai}`}
    subtitle={`${money(tongTra)}/${money(tongGiao)} dòng đã có phản hồi · ${money(chuaTra.length)} đơn vị chưa trả đủ`}
    actions={chuaTra.length > 0 ? <Button
      kind="secondary"
      onClick={() => notify(`Đã lập nhắc tới ${money(chuaTra.length)} đơn vị chưa trả đủ phiếu ${ch.loai}. Bản demo chưa gửi thật.`)}
    >Nhắc tất cả đơn vị chưa trả</Button> : undefined}
  >
    <TableWrap label={`tiến độ phiếu ${ch.loai}`}>
      <table className="ql1-ds-table" style={{ minWidth: 1066 }}>
        <colgroup>{[230, 150, 130, 150, 150, 256].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
        <thead><tr>
          <th scope="col">Đơn vị</th>
          <th scope="col">Mã phiếu</th>
          <th scope="col" className="num">Đã giao</th>
          <th scope="col" className="num">Đã phản hồi</th>
          <th scope="col" className="num">Quá hạn chưa trả</th>
          <th scope="col">Tình trạng</th>
        </tr></thead>
        <tbody>
          {theoDonVi.map((x) => {
            const tra = daTraLoi(x.ids);
            const treChuaTra = x.quaHan.length - daTraLoi(x.quaHan);
            const xong = tra >= x.ids.length;
            return <tr key={x.donVi} className={treChuaTra > 0 ? "is-co" : undefined}>
              <td title={x.donVi}>{rutGonTenDonVi(x.donVi)}</td>
              <td>{x.maPhieu}</td>
              <td className="num">{money(x.ids.length)}</td>
              <td className="num">{money(tra)}</td>
              <td className="num">{money(Math.max(0, treChuaTra))}</td>
              <td>
                {xong
                  ? <Badge tone="positive">Đã trả đủ</Badge>
                  : <>
                      <Badge tone={treChuaTra > 0 ? "critical" : "warning"}>{treChuaTra > 0 ? "Quá hạn" : "Đang chờ"}</Badge>{" "}
                      <Button kind="quiet" onClick={() => notify(`Đã lập nhắc gửi ${x.donVi}. Bản demo chưa gửi thật.`)}>Nhắc</Button>
                    </>}
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </TableWrap>
  </Panel>;
}
