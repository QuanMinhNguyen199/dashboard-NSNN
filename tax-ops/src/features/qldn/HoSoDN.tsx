import { useMemo } from "react";
import { DetailGrid, Icon, TableWrap, integer } from "@/components/ui";
import { TRANG_THAI_DN, type DongDN } from "@/data/qldn";
import { hoSoDN, type NamDN } from "@/data/hoSoQLDN";

/*
  Hồ sơ sức khỏe một doanh nghiệp (biên bản 22/10/2026 §3.2: "hiển thị lịch
  sử xử phạt, hồ sơ doanh nghiệp, thủ tục… và so sánh với các năm trước").

  Mở trong ngăn trượt dùng chung (`CaseLayout presentation="drawer"`), có địa
  chỉ `so=` — ngoại lệ thứ ba của The No-Overlay Rule, đúng như danh sách NNT
  của QL3.

  Thứ tự đọc: doanh nghiệp là ai → xếp loại (ô cố định, đang chờ tiêu chí) →
  dấu hiệu rủi ro → so qua các năm → ba lịch sử (xử phạt, cưỡng chế, thủ tục).

  KHÔNG chấm điểm. Biên bản giao Phòng Kiểm tra gửi tiêu chí xếp loại và cách
  so năm sau với năm trước ("1 DN bị phạt 1 lần đánh giá Trung bình, năm sau
  bị phạt lần nữa thì xuống hay giữ nguyên?"). Ô xếp loại vì thế đứng sẵn ở
  chỗ của nó và nói đang chờ gì — khi có tiêu chí thì chỉ đổi nội dung ô.
*/

const ngayVN = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const tyDong = (x: number) => x.toLocaleString("vi-VN", { maximumFractionDigits: 2 });

/* Các dòng của bảng so sánh: nhãn, cách đọc giá trị, và chiều tốt — để mũi
   tên so với năm trước nói "tốt lên" hay "xấu đi" bằng chữ, không chỉ màu. */
const CHI_SO: { nhan: string; gia: (n: NamDN) => number; hien: (n: NamDN) => string; tot: "cao" | "thap" }[] = [
  { nhan: "Số thu NSNN (tỷ đồng)", gia: (n) => n.thu, hien: (n) => tyDong(n.thu), tot: "cao" },
  { nhan: "Nợ thuế cuối kỳ (tỷ đồng)", gia: (n) => n.no, hien: (n) => n.no ? tyDong(n.no) : "0", tot: "thap" },
  { nhan: "Tờ khai nộp đúng hạn", gia: (n) => n.keKhaiKy ? n.keKhaiDung / n.keKhaiKy : 0, hien: (n) => `${n.keKhaiDung}/${n.keKhaiKy}`, tot: "cao" },
  { nhan: "Số lần bị xử phạt", gia: (n) => n.soLanPhat, hien: (n) => integer(n.soLanPhat), tot: "thap" },
  { nhan: "Tiền phạt (triệu đồng)", gia: (n) => n.tienPhat, hien: (n) => n.tienPhat ? integer(n.tienPhat) : "0", tot: "thap" },
  { nhan: "Hồ sơ thủ tục đã nộp", gia: (n) => n.soTTHC, hien: (n) => integer(n.soTTHC), tot: "cao" },
];

export function HoSoDN({ d }: { d: DongDN }) {
  const hs = useMemo(() => hoSoDN(d), [d]);
  const nam = hs.nam.filter((n) => n.co);
  const ttTen = TRANG_THAI_DN.find((t) => t.id === d.trangThai)!.ten;

  return <div className="qd-dn" data-motion="detail">
    <p className="qd-dn-ten"><strong>{d.ten}</strong><span>MST {d.mst}</span></p>
    <DetailGrid items={[
      { label: "Trạng thái", value: ttTen },
      { label: "Năm thành lập", value: d.namThanhLap },
      { label: "Đơn vị quản lý", value: d.donVi },
      { label: "Cán bộ quản lý", value: d.canBo },
      { label: "Vốn điều lệ", value: `${tyDong(d.von)} tỷ đồng` },
      { label: "Nợ thuế hiện tại", value: d.no ? `${tyDong(d.no)} tỷ đồng` : "Không nợ" },
    ]}/>

    <section className="qd-dn-khoi" aria-labelledby="qd-dn-xl">
      <h3 id="qd-dn-xl">Xếp loại sức khỏe</h3>
      <div className="qd-dn-cho">
        <Icon name="clock" size={18}/>
        <p><strong>Chưa xếp loại</strong><span>Chờ Phòng Kiểm tra gửi tiêu chí đánh giá và cách so sánh với các năm trước (biên bản 22/10/2026, việc số 3). Số liệu bên dưới là đầu vào cho xếp loại.</span></p>
      </div>
    </section>

    <section className="qd-dn-khoi" aria-labelledby="qd-dn-dh">
      <h3 id="qd-dn-dh">Dấu hiệu rủi ro{hs.dauHieu.length > 0 && <small>{hs.dauHieu.length} dấu hiệu</small>}</h3>
      {hs.dauHieu.length
        ? <ul className="qd-dn-dau-hieu">{hs.dauHieu.map((x) => <li key={x}><Icon name="alert" size={15}/>{x}</li>)}</ul>
        : <p className="qd-dn-trong">Chưa ghi nhận dấu hiệu rủi ro nào.</p>}
    </section>

    <section className="qd-dn-khoi" aria-labelledby="qd-dn-nam">
      <h3 id="qd-dn-nam">So sánh qua các năm<small>2026 lũy kế 9 tháng</small></h3>
      <TableWrap label="so sánh chỉ số qua các năm">
        <table className="qd-bang qd-dn-bang">
          <thead><tr><th scope="col">Chỉ số</th>{nam.map((n) => <th key={n.nam} scope="col" className="num">{n.nam}</th>)}</tr></thead>
          <tbody>{CHI_SO.map((c) => <tr key={c.nhan}>
            <th scope="row">{c.nhan}</th>
            {nam.map((n, i) => {
              const truoc = i ? c.gia(nam[i - 1]) : null;
              /* 2026 chưa trọn năm: không so chiều với 2025 cho các chỉ số cộng dồn. */
              const soDuoc = truoc !== null && (n.nam < 2026 || c.nhan.startsWith("Tờ khai"));
              const h = soDuoc ? c.gia(n) - truoc! : 0;
              const tot = c.tot === "cao" ? h > 0 : h < 0;
              return <td key={n.nam} className="num">
                {c.hien(n)}
                {soDuoc && h !== 0 && <small className={`qd-dn-chieu ${tot ? "is-tot" : "is-xau"}`}>{tot ? "tốt lên" : "xấu đi"}</small>}
              </td>;
            })}
          </tr>)}</tbody>
        </table>
      </TableWrap>
      {nam.length < 4 && <p className="qd-dn-trong">Thành lập năm {d.namThanhLap}: không có số của các năm trước đó.</p>}
    </section>

    <section className="qd-dn-khoi" aria-labelledby="qd-dn-xp">
      <h3 id="qd-dn-xp">Lịch sử xử phạt{hs.phat.length > 0 && <small>{hs.phat.length} quyết định</small>}</h3>
      {hs.phat.length
        ? <ol className="qd-dn-ds">{hs.phat.map((p) => <li key={p.soQD}>
          <span className="qd-dn-ngay">{ngayVN(p.ngay)}</span>
          <span className="qd-dn-noi"><strong>{p.hanhVi}</strong><small>Quyết định {p.soQD} · {integer(p.tien)} triệu đồng</small></span>
          <span className={`qd-dn-nhan ${p.daNop ? "is-tot" : "is-cho"}`}>{p.daNop ? "Đã nộp phạt" : "Chưa nộp phạt"}</span>
        </li>)}</ol>
        : <p className="qd-dn-trong">Chưa bị xử phạt vi phạm hành chính về thuế.</p>}
    </section>

    {/* Cưỡng chế: TỪNG biện pháp một dòng, không Có/Không (biên bản 22/10). */}
    <section className="qd-dn-khoi" aria-labelledby="qd-dn-cc">
      <h3 id="qd-dn-cc">Biện pháp cưỡng chế đã áp dụng{hs.cuongChe.length > 0 && <small>{hs.cuongChe.length} biện pháp</small>}</h3>
      {hs.cuongChe.length
        ? <ol className="qd-dn-ds">{hs.cuongChe.map((c) => <li key={c.soQD}>
          <span className="qd-dn-ngay">{ngayVN(c.tuNgay)}</span>
          <span className="qd-dn-noi"><strong>{c.bienPhap}</strong><small>Quyết định {c.soQD}</small></span>
          <span className={`qd-dn-nhan ${c.conHieuLuc ? "is-cho" : "is-tat"}`}>{c.conHieuLuc ? "Đang hiệu lực" : "Đã chấm dứt"}</span>
        </li>)}</ol>
        : <p className="qd-dn-trong">{d.no ? "Đang nợ nhưng chưa bị áp biện pháp cưỡng chế." : "Không nợ thuế, không bị cưỡng chế."}</p>}
    </section>

    <section className="qd-dn-khoi" aria-labelledby="qd-dn-tt">
      <h3 id="qd-dn-tt">Hồ sơ, thủ tục đã nộp<small>gần nhất trước</small></h3>
      <ol className="qd-dn-ds">{hs.thuTuc.map((t, i) => <li key={i}>
        <span className="qd-dn-ngay">{ngayVN(t.ngay)}</span>
        <span className="qd-dn-noi"><strong>{t.ten}</strong><small>{t.kenh}</small></span>
        <span className={`qd-dn-nhan ${t.ketQua === "Đã chấp nhận" ? "is-tot" : t.ketQua === "Đang giải quyết" ? "is-tat" : "is-cho"}`}>{t.ketQua}</span>
      </li>)}</ol>
    </section>
    <p className="quality-note">Số liệu mô phỏng.</p>
  </div>;
}
