import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, Pager, TableWrap, integer } from "@/components/ui";
import type { CanBoQ, ChiTieuQ, KyQ } from "@/data/qldn";
import { nntCuaCanBo } from "@/data/hoSoQLDN";
import { HoSoDN } from "@/features/qldn/HoSoDN";

/*
  Ngăn "Người nộp thuế của một cán bộ" (người dùng chốt 28/10/2026).

  Hai tầng trong CÙNG một ngăn trượt: danh sách NNT của cán bộ → hồ sơ một
  NNT. Mở hồ sơ không đóng ngăn, không rời màn Thu NSNN: nút "Danh sách NNT"
  ở đầu hồ sơ đưa về đúng trang và đúng dòng vừa bấm. Cả hai tầng nằm trong
  địa chỉ (`so=` cán bộ, `nnt=` thứ tự NNT) — gửi liên kết là người nhận mở
  đúng hồ sơ ấy.

  Danh sách xếp theo số thu lũy kế giảm dần, như bảng của cán bộ đứng ngoài:
  trưởng phòng mở ra để xem NNT nào gánh số thu của cán bộ này. Cộng cả cột
  ra đúng số trên dòng của cán bộ — dòng đầu bảng nói điều đó một lần.
*/

const CO = 20;
/* Số thu từng NNT trải từ nghìn tỷ tới vài chục triệu: giữ khoảng ba, bốn chữ số có nghĩa. */
const tyDong = (x: number) => x.toLocaleString("vi-VN", { maximumFractionDigits: x >= 100 ? 1 : x >= 1 ? 2 : 3 });
const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

export function NNTCanBo({ ct, dvId, donVi, cb, ky, nnt, moNNT }: {
  ct: ChiTieuQ; dvId: string; donVi: string; cb: CanBoQ; ky: KyQ;
  /** Thứ tự NNT đang mở trong danh sách; `null` là đang ở tầng danh sách. */
  nnt: number | null;
  moNNT: (j: number | null) => void;
}) {
  const ds = useMemo(() => nntCuaCanBo(ct, dvId, cb, ky.thang), [ct, dvId, cb, ky.thang]);
  const [tim, datTim] = useState("");
  const [trang, datTrang] = useState(1);
  const vuaMo = useRef<number | null>(null);
  const nutVe = useRef<HTMLButtonElement>(null);
  const hop = useRef<HTMLDivElement>(null);
  const dn = nnt !== null ? ds[nnt] ?? null : null;

  const loc = useMemo(() => {
    const q = boDau(tim.trim());
    return ds.map((d, j) => ({ d, j })).filter(({ d }) => !q || d.mst.includes(q) || boDau(d.ten).includes(q));
  }, [ds, tim]);
  const soTrang = Math.max(1, Math.ceil(loc.length / CO));
  const trongTrang = loc.slice((trang - 1) * CO, trang * CO);
  const tong = ds.reduce((s, d) => s + d.thu2026, 0);

  /* Đổi tầng thì focus đi theo: vào hồ sơ → nút quay lại; về danh sách → đúng dòng vừa mở. */
  useEffect(() => {
    if (dn) { nutVe.current?.focus(); return; }
    if (vuaMo.current === null) return;
    const j = vuaMo.current;
    vuaMo.current = null;
    requestAnimationFrame(() => hop.current?.querySelector<HTMLButtonElement>(`[data-nnt="${j}"]`)?.focus());
  }, [dn]);

  if (dn) return <div className="qd-nnt-ho-so">
    <button ref={nutVe} type="button" className="qd-nnt-ve" onClick={() => { vuaMo.current = nnt; moNNT(null); }}>
      <Icon name="chevronLeft" size={16}/>Danh sách NNT của {cb.ten}
    </button>
    <HoSoDN d={dn} thang={ky.thang}/>
  </div>;

  return <div ref={hop} className="qd-nnt" data-motion="detail">
    <p className="qd-nnt-tom">{donVi} · {integer(ds.length)} NNT đang hoạt động · {ky.nhan.split(" · ")[0]} · cộng cả danh sách: <b>{tyDong(Math.round(tong * 10) / 10)} tỷ đồng</b>, đúng số trên dòng của cán bộ</p>
    <label className="search-field qd-nnt-tim">
      <Icon name="search" size={16}/>
      <span className="sr-only">Tìm theo MST hoặc tên người nộp thuế</span>
      <input type="search" value={tim} placeholder="Tìm MST hoặc tên" onChange={(e) => { datTim(e.target.value); datTrang(1); }}/>
    </label>
    {loc.length === 0
      ? <div className="qd-nnt-trong"><p>Không có NNT nào của {cb.ten} khớp “{tim.trim()}”.</p><button type="button" className="button is-secondary" onClick={() => datTim("")}>Xóa tìm kiếm</button></div>
      : <>
        <TableWrap label={`người nộp thuế của ${cb.ten}`}>
          <table className="qd-bang qd-nnt-bang">
            <thead><tr>
              <th scope="col">MST</th>
              <th scope="col">Tên người nộp thuế</th>
              <th scope="col" className="num"><span>{ct.nhanTu}</span><small className="qd-ct">tỷ đồng</small></th>
            </tr></thead>
            <tbody>{trongTrang.map(({ d, j }) => <tr key={d.khoa} className="qd-viec" onClick={() => moNNT(j)}>
              <td className="qd-nnt-mst">{d.mst}</td>
              {/* Cả hàng bấm được; nút nằm ở ô tên để bàn phím mở được — The Whole Row Rule. */}
              <td><button type="button" className="row-select" data-nnt={j}>{d.ten}</button></td>
              <td className="num">{tyDong(d.thu2026)}</td>
            </tr>)}</tbody>
          </table>
        </TableWrap>
        <div className="table-footer"><span>{tim.trim() ? `${integer(loc.length)} / ${integer(ds.length)} NNT khớp` : `${integer(ds.length)} NNT · xếp theo số thu giảm dần`}</span>{soTrang > 1 && <Pager trang={trang} soTrang={soTrang} onChange={datTrang}/>}</div>
      </>}
    <p className="quality-note">Số liệu mô phỏng. Số thu từng NNT chia ra từ số của cán bộ.</p>
  </div>;
}
