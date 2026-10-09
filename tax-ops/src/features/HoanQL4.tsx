import { useMemo } from "react";
import { BoLocChung, theoDonVi, useBoLoc, type MucDonVi } from "@/components/BoLoc";
import { baoCaoCuaMuc, useMucPhanHe } from "@/components/MucPhanHe";
import { ExportButton } from "@/components/ExportButton";
import { XuatProvider } from "@/components/ui";
import { PageIntro, Panel, money } from "@/components/ui";
import { DuLieuGoc } from "@/features/DuLieuGoc";
import { ThanhDuyet, useChoXemTruoc } from "@/features/ThanhDuyet";
import { KhoiXemTruoc, NutXemTruoc } from "@/features/XemTruocBaoCao";
import { BangQL4_01, ChamDiem, DangXuLy, HoSoVenhBang } from "@/features/QL4Hoan";
import { TienDoPhieu } from "@/features/TienDoPhieu";
import { NhapKetQuaPhieu } from "@/features/NhapKetQuaPhieu";
import { CuocGoi, DanhSachPhieu, PhieuGhiMaTran, SaiHan, ThanhNgay } from "@/features/QL4TongDai";
import { NGUON_QL4 } from "@/data/nguonDuLieu";
import { rutGonTenDonVi } from "@/data/danhMuc";
import type { VaiTro } from "@/domain/types";
import {
  CHUA_XAC_DINH, DON_VI_QL4, KY_CUA_BAO_CAO_QL4, KY_QL4_01, KY_QL4_02,
  bangQL4_01, binhQuanQuaHan, dangXuLy, danhSachCuocGoi, danhSachPhieu, danhSachVenh,
  thoiGianTB, tongDen, tongTiepNhan, tyLeNho, tyLeQuaHan, type KyQL4,
} from "@/data/ql4";
import { exportExcel } from "@/domain/reportFiles";
import { ql4Workbook, type ReportMeta } from "@/domain/reportExport";
import { useAction } from "@/state/ActionContext";
import { useDuyet } from "@/state/DuyetContext";
import { useThamSo } from "@/state/diaChi";

/*
  Phân hệ QL4 — hoàn thuế TNCN và tổng đài (`design_ql2ql4` §5).

  Cùng khung với QL2: khóa duyệt `QL4|<mã báo cáo>|<kỳ>`, danh mục kỳ theo báo
  cáo (G13), mục trong thanh bên, trục dọc theo The Same Spine Rule.

  Khác QL2 ở một chỗ: báo cáo tổng đài chạy HẰNG NGÀY và mở thẳng từ email lúc
  18:00, nên nó đứng TRƯỚC hoàn thuế trong cụm mục, và thanh trạng thái ngày
  nằm ngay đầu nội dung chứ không phải cuối trang (G18).
*/

const DON_VI_CO: MucDonVi[] = DON_VI_QL4.map((d) => ({ id: d.id, ten: d.ten }));

export const nhanBaoCaoQL4 = (ma: string) => ({
  "QL4-01": "Tiến độ giải quyết hồ sơ hoàn thuế TNCN",
  "QL4-02": "Báo cáo tổng đài hỗ trợ người nộp thuế",
}[ma] ?? ma);

export function HoanQL4({ actor, vaiTro }: { actor: string; vaiTro: VaiTro }) {
  const { muc, datMuc } = useMucPhanHe();
  const { chon } = useBoLoc();
  const { layBanGhi } = useDuyet();
  const notify = useAction();
  const [xem, datXem] = useThamSo<string>("xem", "");

  const baoCao = baoCaoCuaMuc("hoan", muc);
  const kyCo = baoCao ? KY_CUA_BAO_CAO_QL4[baoCao] : undefined;
  const ky: KyQL4 = kyCo?.find((k) => k.id === chon.ky) ?? kyCo?.[0] ?? KY_QL4_02[0];

  const khoa = baoCao ? `QL4|${baoCao}|${ky.id}` : "";
  const banGhi = baoCao ? layBanGhi(khoa) : null;
  const choXem = useChoXemTruoc(khoa);

  const boSheet = useMemo(() => (baoCao ? ql4Workbook(baoCao, ky, chon.donVi) : []), [baoCao, ky, chon.donVi]);
  const moXemTruoc = choXem && xem !== "" && boSheet.some((s) => s.name === xem);

  /* Tài khoản tổng đài chưa gán đơn vị — con số này chặn gửi duyệt báo cáo
     tổng đài, vì số của chúng chưa vào đơn vị nào (G15). */
  const chuaGan = useMemo(
    () => (baoCao === "QL4-02" ? new Set(danhSachCuocGoi(ky.hat).filter((h) => h.donVi === CHUA_XAC_DINH).map((h) => h.user)).size : 0),
    [baoCao, ky.hat],
  );

  const meta: ReportMeta = {
    period: ky.nhan,
    scope: chon.donVi.length === 0 ? "Toàn ngành" : chon.donVi.map(rutGonTenDonVi).join(", "),
    actor,
    status: banGhi?.trangThai ?? "DRAFT",
  };

  return <XuatProvider nut={baoCao ? <ExportButton onExport={() => exportExcel(boSheet, meta, `${baoCao}_${ky.id}`)}>Xuất Excel</ExportButton> : undefined}><div className="page-stack">
    <PageIntro title="Hoàn thuế TNCN và tổng đài · Phòng QL4"/>

    {baoCao && <ThanhDuyet
      khoa={khoa}
      nhanKy={`${baoCao} · ${ky.nhan.toLowerCase()}`}
      chan={chuaGan > 0 ? `Còn ${chuaGan} tài khoản tổng đài chưa gán đơn vị. Gán xong mới gửi duyệt được.` : null}
      xemTruoc={<NutXemTruoc mo={moXemTruoc} onToggle={() => datXem(moXemTruoc ? "" : boSheet[0]?.name ?? "")}/>}
      tomTat={[["Bộ sheet sẽ gửi", `${boSheet.length} sheet`], ["Phạm vi", meta.scope]]}
    />}

    {moXemTruoc && <KhoiXemTruoc
      sheets={boSheet}
      meta={meta}
      ten={`${baoCao} · ${nhanBaoCaoQL4(baoCao!)}`}
      sheet={xem}
      onChonSheet={datXem}
    />}

    <BoLocChung
      ky={baoCao ? undefined : "Theo từng báo cáo"}
      kyCo={kyCo}
      donViCo={DON_VI_CO}
      rutGon={rutGonTenDonVi}
      phuChu={baoCao ? `Báo cáo ${baoCao}` : undefined}
    />

    {/* Thanh trạng thái ngày đứng ĐẦU nội dung của báo cáo tổng đài (G18). */}
    {baoCao === "QL4-02" && <ThanhNgay ky={ky} chuaGan={chuaGan}/>}

    {muc === "tongquan" && <TongQuanQL4/>}

    {muc === "goi" && <CuocGoi ky={ky} onGan={() => notify("Ngăn gán đơn vị cho tài khoản tổng đài sẽ dựng ở màn Danh mục của phòng.")}/>}
    {muc === "phieu" && <PhieuGhiMaTran ky={ky}/>}
    {muc === "saihan" && <SaiHan ky={ky}/>}
    {muc === "dsphieu" && <DanhSachPhieu ky={ky}/>}

    {muc === "tuan" && <BangQL4_01 ky={ky} onMoChiTiet={datMuc}/>}
    {muc === "dxtcs" && <DangXuLy ky={ky} nhom="TCS"/>}
    {muc === "dxvp" && <DangXuLy ky={ky} nhom="VP"/>}
    {muc === "venh" && <>
      <HoSoVenhBang ky={ky} vaiTro={vaiTro} onGiaoPhieu={(so) => notify(`Đã giao ${money(so)} hồ sơ thành phiếu PRS-05, tách theo đơn vị xử lý. Bản demo chưa gửi tới đơn vị.`)}/>
      {vaiTro === "CV" && <TienDoPhieu loai="PRS-05" hatKy={ky.hat}/>}
      {vaiTro === "CV" && <NhapKetQuaPhieu loai="PRS-05" hatKy={ky.hat}/>}
    </>}
    {muc === "diem" && <ChamDiem ky={ky}/>}

    {muc === "nguon" && <DuLieuGoc nguon={NGUON_QL4} ngayBaoCao={ky.ngayChot}/>}
  </div></XuatProvider>;
}

/* ── Tổng quan (§5.3) ────────────────────────────────────────────────────── */

/*
  Một màn cho cả hai mảng, và mảng TỔNG ĐÀI đặt trên vì nó ra số hằng ngày
  (§5.3). Hoàn thuế chạy theo tuần nên nó là bối cảnh, không phải việc hôm nay.
*/
function TongQuanQL4() {
  const { chon } = useBoLoc();
  const kyTD = KY_QL4_02[0];
  const kyHT = KY_QL4_01[0];

  const goi = useMemo(() => danhSachCuocGoi(kyTD.hat), [kyTD.hat]);
  const phieu = useMemo(() => danhSachPhieu(kyTD.hat), [kyTD.hat]);
  const hoan = theoDonVi(useMemo(() => bangQL4_01(kyHT.hat), [kyHT.hat]), chon, (h) => h.dv.ten);
  const venh = theoDonVi(useMemo(() => danhSachVenh(kyHT.hat), [kyHT.hat]), chon, (r) => r.dv.ten);

  const congGoi = goi.reduce((t, h) => ({
    denTraLoi: t.denTraLoi + h.denTraLoi, denKhongTraLoi: t.denKhongTraLoi + h.denKhongTraLoi,
    denThoiGian: t.denThoiGian + h.denThoiGian, diTraLoi: t.diTraLoi + h.diTraLoi,
    diKhongTraLoi: t.diKhongTraLoi + h.diKhongTraLoi, diThoiGian: t.diThoiGian + h.diThoiGian, noiBo: 0,
  }), { denTraLoi: 0, denKhongTraLoi: 0, denThoiGian: 0, diTraLoi: 0, diKhongTraLoi: 0, diThoiGian: 0, noiBo: 0 });

  const hetHan = phieu.filter((p) => p.trangThai === "Đang xử lý" && p.hetHan).length;

  const tiepNhan = hoan.reduce((t, h) => t + tongTiepNhan(h), 0);
  const tuDong = hoan.reduce((t, h) => t + h.tuDongCoRaSoat + h.tuDong, 0);
  const quaHan = hoan.reduce((t, h) => t + h.dangXuLyQuaHan, 0);
  const venhChua = venh.filter((r) => r.ketQua === "Chưa có kết quả").length;
  const bq = binhQuanQuaHan(hoan);

  const pct = (tu: number, mau: number) => (mau <= 0 ? "—" : `${((tu / mau) * 100).toFixed(2).replace(".", ",")}%`);
  const hienTyLe = (x: number | null) => (x === null ? "—" : `${(x * 100).toFixed(2).replace(".", ",")}%`);

  return <>
    <Panel chinh title="Tổng đài hỗ trợ người nộp thuế" subtitle={`${kyTD.nhan} · từ mục Cuộc gọi, Phiếu ghi, Sai hạn`}>
    {/*
      Dải thẻ là `.the-luoi` chứ không phải `KpiStrip`.

      `KpiStrip` tự mang viền và bo góc, nên đặt nó trong một `Panel` là dựng
      một thẻ BÊN TRONG một thẻ: hai đường viền cách nhau 14px, và mắt đọc ra
      hai khối lồng nhau thay vì một khối có mấy ô. QL1 và QL3 dùng `.the-luoi`
      — tràn hết bề ngang thân khối, các ô chia nhau bằng đường kẻ một pixel.
    */}
      <div className="the-luoi">
        <div className="the-so"><span className="the-nhan">Tổng cuộc gọi đến</span><strong className="the-gia">{money(tongDen(congGoi as never))}</strong><span className="the-dvt">cuộc gọi</span></div>
        <div className="the-so"><span className="the-nhan">Tỷ lệ nhỡ</span><strong className="the-gia">{hienTyLe(tyLeNho(congGoi as never))}</strong><span className="the-dvt">theo cuộc gọi đến</span></div>
        <div className="the-so"><span className="the-nhan">Thời gian gọi trung bình</span><strong className="the-gia">{money(thoiGianTB(congGoi as never) ?? 0)}</strong><span className="the-dvt">giây</span></div>
        <div className="the-so"><span className="the-nhan">Phiếu đang xử lý đã hết hạn</span><strong className="the-gia">{money(hetHan)}</strong><span className="the-dvt">phiếu</span></div>
      </div>
    </Panel>

    <Panel title="Hoàn thuế thu nhập cá nhân" subtitle={`${kyHT.nhan} · từ mục Báo cáo tuần chuẩn và Hồ sơ vênh`}>
      <div className="the-luoi">
        <div className="the-so"><span className="the-nhan">Tổng hồ sơ tiếp nhận</span><strong className="the-gia">{money(tiepNhan)}</strong><span className="the-dvt">hồ sơ</span></div>
        <div className="the-so"><span className="the-nhan">Tỷ lệ xử lý tự động</span><strong className="the-gia">{pct(tuDong, tiepNhan)}</strong><span className="the-dvt">theo số hồ sơ</span></div>
        <div className="the-so"><span className="the-nhan">Hồ sơ đang xử lý quá hạn</span><strong className="the-gia">{money(quaHan)}</strong><span className="the-dvt">hồ sơ</span></div>
        <div className="the-so"><span className="the-nhan">Hồ sơ vênh chưa rà soát</span><strong className="the-gia">{money(venhChua)}</strong><span className="the-dvt">hồ sơ</span></div>
      </div>
    </Panel>

    <Panel
      title="Tỷ lệ hồ sơ quá hạn theo đơn vị"
      subtitle="Vạch là bình quân toàn địa bàn"
    >
      <div className="so-sanh">
        <div className="so-sanh-dau">
          <span/>
          <span>Tỷ lệ hồ sơ quá hạn</span>
          <span>Hồ sơ đang xử lý</span>
        </div>
        {hoan.map((h) => {
          const t = tyLeQuaHan(h);
          const tren = t !== null && bq !== null && t > bq;
          return <div className="so-sanh-dong" key={h.dv.id}>
            <span className="so-sanh-ten" title={h.dv.ten}>{rutGonTenDonVi(h.dv.ten)}</span>
            <span className="so-sanh-o">
              <span className="so-sanh-thanh">
                <i className={tren ? "is-duoi" : undefined} style={{ width: `${Math.min(100, (t ?? 0) * 100 * 2)}%` }}/>
                {bq !== null && <b style={{ left: `${Math.min(100, bq * 100 * 2)}%` }} title={`Bình quân ${hienTyLe(bq)}`}/>}
              </span>
              <em>{hienTyLe(t)}</em>
            </span>
            <span className="so-sanh-o"><em>{money(dangXuLy(h))}</em></span>
          </div>;
        })}
      </div>
    </Panel>
  </>;
}
