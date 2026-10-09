import { KhoangNgayK, ngayHopLe } from "@/features/KhoangNgayK";
import { CongAnQL2, TPRQL2 } from "@/features/QL2BoSung";
import { QL2Provider, useQL2 } from "@/state/QL2Context";
import { useMemo } from "react";
import { BoLocChung, useBoLoc, theoDonVi, type MucDonVi } from "@/components/BoLoc";
import { Khung } from "@/components/Khung";
import { baoCaoCuaMuc, nhomCuaMuc, useMucPhanHe } from "@/components/MucPhanHe";
import { ExportButton } from "@/components/ExportButton";
import { XuatProvider } from "@/components/ui";
import { PageIntro, Panel, money } from "@/components/ui";
import { DuLieuGoc } from "@/features/DuLieuGoc";
import { ThanhDuyet, useChoXemTruoc } from "@/features/ThanhDuyet";
import { KhoiXemTruoc, NutXemTruoc } from "@/features/XemTruocBaoCao";
import { BangQL2_01, DanhSachChenhLech } from "@/features/QL2ChenhLech";
import { BangHeSoK, DanhSachK } from "@/features/QL2HeSoK";
import { BangXacMinh, TonQuaHanXM } from "@/features/QL2XacMinh";
import { NGUON_QL2 } from "@/data/nguonDuLieu";
import { rutGonTenDonVi } from "@/data/danhMuc";
import type { VaiTro } from "@/domain/types";
import {
  DON_VI_QL2, KY_CUA_BAO_CAO, KY_QL2_01, KY_QL2_02, KY_QL2_04,
  bangHeSoK, bangQL2_01, bangXM, canRaSoat, chuaCoKetQua, danhSachChenhLech, daTraXM,
  tonCuoiK, tongXM, type KyQL2,
} from "@/data/ql2";
import { exportExcel } from "@/domain/reportFiles";
import { ql2Workbook, type ReportMeta } from "@/domain/reportExport";
import { useDuyet } from "@/state/DuyetContext";
import { datThamSo, useThamSo } from "@/state/diaChi";

/*
  Phân hệ QL2 — rủi ro hóa đơn (`design_ql2ql4` §4).

  ── Vì sao cấu trúc khác DebtQL1 ────────────────────────────────────────────

  QL1 là MỘT báo cáo: một danh mục kỳ, một thanh duyệt, một bộ sheet xuất ra.
  QL2 là SÁU báo cáo độc lập chạy trên cùng một màn. Hệ quả cụ thể:

  • Danh mục kỳ lấy theo BÁO CÁO của mục đang mở, không theo phân hệ (G13).
  • Khóa duyệt là `QL2|<mã báo cáo>|<kỳ>` chứ không phải `QL2|<kỳ>`. QL2-02
    chạy hằng ngày còn QL2-01 chạy hằng tháng; dùng chung một khóa thì duyệt
    báo cáo hôm qua sẽ chốt luôn báo cáo tháng.
  • Mục Tổng quan và Dữ liệu gốc KHÔNG thuộc báo cáo nào, nên chúng không có
    thanh duyệt. Dựng một thanh duyệt ở đó là mời người dùng chốt một thứ
    không tồn tại.
*/

const DON_VI_CO: MucDonVi[] = DON_VI_QL2.map((d) => ({ id: d.id, ten: d.ten }));

export function HoaDonQL2(props: { actor: string; vaiTro: VaiTro }) {
  return <QL2Provider><HoaDonQL2NoiDung {...props}/></QL2Provider>;
}
function HoaDonQL2NoiDung({ actor, vaiTro }: { actor: string; vaiTro: VaiTro }) {
  const { vuongMac } = useQL2();
  const { muc, datMuc } = useMucPhanHe();
  const { chon, datDonVi, datKy } = useBoLoc();
  const { layBanGhi } = useDuyet();
  const [xem, datXem] = useThamSo<string>("xem", "");

  const baoCao = baoCaoCuaMuc("hoadon", muc);
  // QL2-05 còn chờ mẫu; TPR/Công an đã có mẫu theo tài liệu nhưng chưa có tệp đối chiếu trong workspace.
  const nhom = nhomCuaMuc("hoadon", muc);
  const [tuK, datTuK] = useThamSo<string>("ktu", "");
  const [denK, datDenK] = useThamSo<string>("kden", "");
  const kyCo = useMemo(() => {
    const ds = baoCao ? KY_CUA_BAO_CAO[baoCao] : undefined;
    if (baoCao !== "QL2-02") return ds;
    if (!ngayHopLe(tuK) || !ngayHopLe(denK) || tuK > denK) {
      return [...KY_QL2_02, { ...KY_QL2_02[0], id: "q202-custom", loai: "TUYCHON" as const, nhan: "Tùy chọn" }];
    }
    const format = (s: string) => s.split("-").reverse().join("/");
    return [...(ds ?? []), { id: `q202-custom-${tuK}-${denK}`, loai: "TUYCHON" as const, ngayDau: format(tuK), ngayChot: format(denK), nhan: `${format(tuK)} – ${format(denK)}`, hat: [...tuK + denK].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 0) }];
  }, [baoCao, tuK, denK]);
  const ky: KyQL2 = (kyCo?.find((k) => k.id === chon.ky) ?? kyCo?.[0] ?? KY_QL2_01[0]);

  const khoa = baoCao ? `QL2|${baoCao}|${ky.id}` : "";
  const banGhi = baoCao ? layBanGhi(khoa) : null;
  const choXem = useChoXemTruoc(khoa);

  const boSheet = useMemo(() => (baoCao ? ql2Workbook(baoCao, ky, chon.donVi, vuongMac[ky.id] ?? []) : []), [baoCao, ky, chon.donVi, vuongMac]);
  const moXemTruoc = choXem && xem !== "" && boSheet.some((s) => s.name === xem);

  const meta: ReportMeta = {
    period: ky.nhan,
    scope: chon.donVi.length === 0 ? "Toàn ngành" : chon.donVi.map(rutGonTenDonVi).join(", "),
    actor,
    status: banGhi?.trangThai ?? "DRAFT",
  };

  const moDanhSachChenh = (maDonVi: string, co = "", loc = "tatca", loai = "", ketqua = "") => {
    const ma = maDonVi.split(",");
    datDonVi(DON_VI_QL2.filter((d) => ma.includes(d.id)).map((d) => d.ten));
    datThamSo({ donvi: maDonVi, co, loc, loaitk: loai, ketqua, trang: null });
    datMuc("dschenh");
  };

  return <XuatProvider nut={baoCao && boSheet.length ? <ExportButton onExport={() => exportExcel(boSheet, meta, `${baoCao}_${ky.id}`)}>Xuất Excel</ExportButton> : undefined}><div className="page-stack">
    <PageIntro title="Rủi ro hóa đơn · Phòng QL2"/>

    {baoCao && <ThanhDuyet
      khoa={khoa}
      nhanKy={`${baoCao} · ${ky.nhan.toLowerCase()}`}
      chan={baoCao === "QL2-03" || baoCao === "QL2-06" ? "Chưa nạp tệp mẫu để đối chiếu đầy đủ các cột; chưa phát hành báo cáo." : nhom?.khung ? `${baoCao} chưa có mẫu báo cáo từ phòng nghiệp vụ. Bảng trên màn mới là khung, chưa gửi duyệt được.` : null}
      xemTruoc={boSheet.length > 0 && <NutXemTruoc mo={moXemTruoc} onToggle={() => datXem(moXemTruoc ? "" : boSheet[0]?.name ?? "")}/>}
      tomTat={[["Bộ sheet sẽ gửi", `${boSheet.length} sheet`], ["Phạm vi", meta.scope]]}
    />}

    {moXemTruoc && <KhoiXemTruoc
      sheets={boSheet}
      meta={meta}
      ten={`${baoCao} · ${nhanBaoCao(baoCao!)}`}
      sheet={xem}
      onChonSheet={datXem}
    />}

    {/*
      Thanh lọc đổi DANH MỤC KỲ theo báo cáo đang mở, nhưng giữ nguyên lựa chọn
      Đơn vị (G13): người dùng đang soi Thuế cơ sở 12 ở báo cáo chênh lệch thì
      chuyển sang hệ số K vẫn muốn soi đúng đơn vị ấy.
    */}
    <BoLocChung
      ky={baoCao ? undefined : "Theo từng báo cáo"}
      kyCo={kyCo}
      kyTuyChon={baoCao === "QL2-02" ? <KhoangNgayK key={ky.id} ky={ky} onApply={(tu, den) => { datTuK(tu); datDenK(den); const id = `q202-custom-${tu}-${den}`; datKy(id); datThamSo({ ky: id }); }}/> : undefined}
      donViCo={DON_VI_CO}
      rutGon={rutGonTenDonVi}
      phuChu={baoCao ? `Báo cáo ${baoCao}` : undefined}
    />


    {muc === "tongquan" && <TongQuanQL2 onMo={datMuc}/>}

    {muc === "th01" && <BangQL2_01 ky={ky} loaiTK="01" onMoDanhSach={moDanhSachChenh}/>}
    {muc === "th0304" && <BangQL2_01 ky={ky} loaiTK="0304" onMoDanhSach={moDanhSachChenh}/>}
    {muc === "dschenh" && <>
      <DanhSachChenhLech ky={ky} vaiTro={vaiTro} meta={meta}/>
    </>}

    {muc === "kbc" && <BangHeSoK ky={ky}/>}
    {muc === "kton" && <DanhSachK ky={ky} vaiTro={vaiTro}/>}

    {muc === "xm" && <BangXacMinh ky={ky}/>}
    {muc === "xmqh" && <TonQuaHanXM ky={ky}/>}

    {muc === "tpr" && <TPRQL2 key={ky.id} ky={ky}/>}

    {muc === "cbrr" && <Khung
      tieuDe="QL2-05 · Ứng dụng cảnh báo rủi ro"
      moTa="Danh sách cảnh báo đã gắn đơn vị, cộng bảng đếm đơn vị × trạng thái."
      daBiet={[
        "Giai đoạn đầu nhận bốn file tải tay; về sau nối API.",
        "Hiển thị: danh sách cảnh báo đã gắn đơn vị + bảng đếm đơn vị × trạng thái.",
        "Nhịp kỳ báo cáo chờ thống nhất với phòng nghiệp vụ.",
      ]}
      conThieu={[
        "Đầu mối API và dạng dữ liệu trả về.",
        "Mẫu và chỉ tiêu của báo cáo.",
        "Xác nhận trường tên trưởng đoàn và số tiền trong file nguồn để hiển thị theo quyền QL2 (Q-12, Q-13).",
      ]}
      cauHoi={["Q-04", "Q-12", "Q-13"]}
    />}

    {muc === "congan" && <CongAnQL2 key={ky.id} ky={ky} vaiTro={vaiTro} meta={meta}/>}

    {muc === "nguon" && <DuLieuGoc nguon={NGUON_QL2} ngayBaoCao={ky.ngayChot}/>}
  </div></XuatProvider>;
}

export const nhanBaoCao = (ma: string) => ({
  "QL2-01": "Chênh lệch tờ khai GTGT và hóa đơn điện tử",
  "QL2-02": "Cảnh báo hệ số K",
  "QL2-04": "Xác minh hóa đơn",
}[ma] ?? ma);

/* ── Tổng quan (§4.3) ────────────────────────────────────────────────────── */

/*
  Tổng quan CHỈ dùng số đã có ở các mục khác — §4.3 ghi rõ điều đó.

  Mỗi thẻ ghi kèm nhịp của chính nó, vì ba mảng chạy ba nhịp khác nhau: chênh
  lệch tờ khai là lũy kế tháng, hệ số K là cuối ngày, xác minh hóa đơn là tuần.
  Một dòng "số liệu đến 26/09" chung cho cả màn sẽ sai với hai trong ba mảng.
*/
function TongQuanQL2({ onMo }: { onMo: (muc: string) => void }) {
  const { chon } = useBoLoc();
  const { vuongMac } = useQL2();

  const kyCL = KY_QL2_01[0];
  const kyK = KY_QL2_02[0];
  const kyXM = KY_QL2_04[0];

  const cl = theoDonVi(bangQL2_01(kyCL.hat, "01"), chon, (h) => h.dv.ten);
  const ds = theoDonVi(danhSachChenhLech(kyCL.hat), chon, (r) => r.dv.ten);
  const k = theoDonVi(bangHeSoK(kyK.hat, vuongMac[kyK.id] ?? []), chon, (h) => h.dv.ten);
  const xm = theoDonVi(bangXM(kyXM.hat), chon, (h) => h.dv.ten);

  const canRa = cl.reduce((t, h) => t + canRaSoat(h.ra).nnt + canRaSoat(h.vao).nnt, 0);
  const chuaCo = cl.reduce((t, h) => t + chuaCoKetQua(h.ra).nnt + chuaCoKetQua(h.vao).nnt, 0);
  const phieuCho = ds.filter((r) => r.phieu && r.ketQua === "Chưa có kết quả").length;

  const tonK = k.reduce((t, h) => t + tonCuoiK(h), 0);
  const mauK = k.reduce((t, h) => t + h.tonDau + h.phatSinh, 0);
  const daXuLyK = k.reduce((t, h) => t + h.daXuLy, 0);

  const tongXm = xm.reduce((t, h) => t + tongXM(h), 0);
  const daTra = xm.reduce((t, h) => t + daTraXM(h), 0);
  const quaHan = xm.reduce((t, h) => t + h.quaHan, 0);

  const pct = (tu: number, mau: number) => (mau <= 0 ? "—" : `${((tu / mau) * 100).toFixed(2).replace(".", ",")}%`);

  /* Hai chỉ tiêu dùng để CHẤM ĐIỂM đơn vị (sheet CHẤM ĐIỂM mục 18, 19) [F],
     nên chúng được xếp cạnh nhau và có vạch bình quân — đơn vị cần biết mình
     đứng đâu so với mức chung, không chỉ biết con số của mình. */
  const binhQuanK = mauK <= 0 ? 0 : daXuLyK / mauK;
  const binhQuanXM = tongXm <= 0 ? 0 : daTra / tongXm;

  return <>
    {/*
      Dải thẻ là `.the-luoi` chứ không phải `KpiStrip`.

      `KpiStrip` tự mang viền và bo góc, nên đặt nó trong một `Panel` là dựng
      một thẻ BÊN TRONG một thẻ: hai đường viền cách nhau 14px, và mắt đọc ra
      hai khối lồng nhau thay vì một khối có mấy ô. QL1 và QL3 dùng `.the-luoi`
      — tràn hết bề ngang thân khối, các ô chia nhau bằng đường kẻ một pixel.
    */}
    <Panel chinh title="Chênh lệch tờ khai – hóa đơn điện tử" subtitle={`${kyCL.nhan} · từ mục Tổng hợp 01GTGT và DS NNT chênh lệch`}>
      <div className="the-luoi">
        <div className="the-so"><span className="the-nhan">NNT cần rà soát (lũy kế)</span><strong className="the-gia">{money(canRa)}</strong><span className="the-dvt">người nộp thuế</span></div>
        <div className="the-so"><span className="the-nhan">NNT chưa có kết quả</span><strong className="the-gia">{money(chuaCo)}</strong><span className="the-dvt">người nộp thuế</span></div>
        <div className="the-so"><span className="the-nhan">Phiếu PRS-03 chưa phản hồi</span><strong className="the-gia">{money(phieuCho)}</strong><span className="the-dvt">phiếu</span></div>
      </div>
    </Panel>

    <div className="tq-doi">
      <Panel title="Cảnh báo hệ số K" subtitle={`${kyK.nhan} · từ mục Hệ số K – Báo cáo`}>
        <div className="the-luoi is-hep">
          <div className="the-so"><span className="the-nhan">Tồn cuối ngày</span><strong className="the-gia">{money(tonK)}</strong><span className="the-dvt">lượt cảnh báo</span></div>
          <div className="the-so"><span className="the-nhan">Tỷ lệ đã xử lý trong kỳ</span><strong className="the-gia">{pct(daXuLyK, mauK)}</strong><span className="the-dvt">theo số lượt</span></div>
        </div>
      </Panel>

      <Panel title="Xác minh hóa đơn" subtitle={`${kyXM.nhan} · từ mục Xác minh hóa đơn`}>
        <div className="the-luoi is-hep">
          <div className="the-so"><span className="the-nhan">Tồn quá hạn</span><strong className="the-gia">{money(quaHan)}</strong><span className="the-dvt">yêu cầu</span></div>
          <div className="the-so"><span className="the-nhan">Tỷ lệ hoàn thành</span><strong className="the-gia">{pct(daTra, tongXm)}</strong><span className="the-dvt">theo số yêu cầu</span></div>
        </div>
      </Panel>
    </div>

    <Panel
      title="Hai chỉ tiêu chấm điểm, theo đơn vị"
      subtitle="Vạch là bình quân toàn ngành"
    >
      <SoSanhHaiChiTieu
        don={DON_VI_QL2.filter((d) => chon.donVi.length === 0 || chon.donVi.includes(d.ten))}
        lay={(id) => {
          const hk = k.find((h) => h.dv.id === id);
          const hx = xm.find((h) => h.dv.id === id);
          const mau = hk ? hk.tonDau + hk.phatSinh : 0;
          return {
            a: mau <= 0 ? null : (hk?.daXuLy ?? 0) / mau,
            b: hx && tongXM(hx) > 0 ? daTraXM(hx) / tongXM(hx) : null,
          };
        }}
        binhQuanA={binhQuanK}
        binhQuanB={binhQuanXM}
      />
    </Panel>

    <Panel
      title="Đơn vị nhiều NNT chênh lệch chưa có kết quả nhất"
      subtitle="Xếp 10 đơn vị đầu"
    >
      <ol className="xep-hang">
        {cl
          .map((h) => ({ dv: h.dv, so: chuaCoKetQua(h.ra).nnt + chuaCoKetQua(h.vao).nnt }))
          .sort((a, b) => b.so - a.so)
          .slice(0, 10)
          .map((x, _i, ds2) => <li key={x.dv.id}>
            <button type="button" className="xh-nut" onClick={() => onMo("dschenh")}>
              <span className="xh-ten" title={x.dv.ten}>{rutGonTenDonVi(x.dv.ten)}</span>
              <span className="xh-so">{money(x.so)} NNT</span>
              <span className="xh-thanh"><i style={{ width: `${ds2[0].so ? (x.so / ds2[0].so) * 100 : 0}%` }}/></span>
            </button>
          </li>)}
      </ol>
    </Panel>
  </>;
}

/*
  Hai thanh cho mỗi đơn vị, cùng một trục 0–100%, cộng một vạch bình quân.

  Vẽ hai biểu đồ rời thì mắt phải nhớ thứ hạng của biểu đồ thứ nhất khi đọc
  biểu đồ thứ hai. Đây đúng là câu hỏi "đơn vị nào kém cả hai mặt", nên hai
  thanh phải nằm trên cùng một dòng.
*/
function SoSanhHaiChiTieu({ don, lay, binhQuanA, binhQuanB }: {
  don: { id: string; ten: string }[];
  lay: (id: string) => { a: number | null; b: number | null };
  binhQuanA: number;
  binhQuanB: number;
}) {
  return <div className="so-sanh">
    <div className="so-sanh-dau">
      <span/>
      <span>Hệ số K · tỷ lệ đã xử lý</span>
      <span>Xác minh hóa đơn · tỷ lệ hoàn thành</span>
    </div>
    {don.map((d) => {
      const { a, b } = lay(d.id);
      return <div className="so-sanh-dong" key={d.id}>
        <span className="so-sanh-ten" title={d.ten}>{rutGonTenDonVi(d.ten)}</span>
        <ThanhBQ x={a} bq={binhQuanA}/>
        <ThanhBQ x={b} bq={binhQuanB}/>
      </div>;
    })}
  </div>;
}

function ThanhBQ({ x, bq }: { x: number | null; bq: number }) {
  if (x === null) return <span className="so-sanh-o"><em className="cell-empty">—</em></span>;
  const duoi = x < bq;
  return <span className="so-sanh-o">
    <span className="so-sanh-thanh">
      <i className={duoi ? "is-duoi" : undefined} style={{ width: `${Math.min(100, x * 100)}%` }}/>
      <b style={{ left: `${Math.min(100, bq * 100)}%` }} title={`Bình quân ${(bq * 100).toFixed(2).replace(".", ",")}%`}/>
    </span>
    <em>{(x * 100).toFixed(2).replace(".", ",")}%</em>
  </span>;
}
