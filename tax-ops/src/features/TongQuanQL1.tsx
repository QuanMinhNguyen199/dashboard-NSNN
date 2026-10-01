import { useMemo } from "react";
import { Panel, integer, money } from "@/components/ui";
import {
  NHAN_MOC, donViCuaTab, tongHopCuaTab,
  type BoNo, type DonViQL1, type KyQL1, type MocSoSanh, type OTongHop06, type OTongHopNo, type OTongHopXuLy,
} from "@/data/ql1";

/*
  Tab Tổng quan của QL1 — §4.3 bản thiết kế.

  Một ràng buộc duy nhất nhưng chi phối cả màn: "Mọi số đều là số đã có trong
  các tab 1–8, không tạo chỉ tiêu mới." Nên ở đây không có chỉ số tổng hợp tự
  nghĩ ra, không có điểm số, không có xếp hạng rủi ro. Mỗi khối chỉ gom lại
  thứ đã nằm sẵn trong một tab và nói nó đến từ tab nào.

  Câu hỏi màn này trả lời, theo đúng lời bản thiết kế: trưởng phòng nhìn một
  màn là biết nợ đang tăng hay giảm, và đơn vị nào cần đôn đốc.
*/

const pt = (x: number) => Number.isFinite(x) ? `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(x * 100)}%` : "—";

function cong<T extends object>(bo: T[]): T {
  const ra = {} as Record<string, unknown>;
  for (const o of bo) {
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "number") ra[k] = Math.round((((ra[k] as number) ?? 0) + v) * 10) / 10;
      else if (v && typeof v === "object") {
        const cu = (ra[k] ?? {}) as Record<string, number>;
        for (const [k2, v2] of Object.entries(v as Record<string, number>)) cu[k2] = Math.round(((cu[k2] ?? 0) + v2) * 10) / 10;
        ra[k] = cu;
      }
    }
  }
  return ra as T;
}

/* Ba mốc nằm cạnh nhau trên cùng một thẻ, theo đúng §4.3: "kèm mũi tên
   tăng/giảm so với tuần trước, tháng trước, đầu năm". Ba mốc cho biết đây là
   xu hướng kéo dài hay một cú nhảy của riêng kỳ này — một mốc không nói được. */
function Mui({ nay, truoc }: { nay: number; truoc: number }) {
  const d = Math.round((nay - truoc) * 10) / 10;
  if (d === 0) return <span className="num">0</span>;
  return <span className={`delta ${d > 0 ? "is-up" : "is-down"}`}>{d > 0 ? "▲" : "▼"} {money(Math.abs(d))}</span>;
}

function TheNo({ nhan, khoa, o }: { nhan: string; khoa: keyof BoNo; o: OTongHopNo }) {
  const mocs: MocSoSanh[] = ["tuanTruoc", "thangTruoc", "dauNam"];
  return <div className="the-so">
    <span className="the-nhan">{nhan}</span>
    <strong className="the-gia">{money(o.cur[khoa])}</strong>
    <span className="the-dvt">triệu đồng</span>
    <dl className="the-moc">{mocs.map((m) => <div key={m}>
      <dt>so với {NHAN_MOC[m]}</dt>
      <dd><Mui nay={o.cur[khoa]} truoc={(o[m] as BoNo)[khoa]}/></dd>
    </div>)}</dl>
  </div>;
}

function Thanh({ ten, x, max, phu }: { ten: string; x: number; max: number; phu: string }) {
  return <li>
    <span className="xh-ten">{ten}</span>
    <span className="xh-so">{phu}</span>
    <span className="xh-thanh"><i style={{ width: `${max > 0 ? Math.max(2, (x / max) * 100) : 0}%` }}/></span>
  </li>;
}

const rutGon = (ten: string) => ten
  .replace(/^Phòng Quản lý,\s*Hỗ trợ doanh nghiệp số\s*/i, "Phòng QLHT DN ")
  .replace(/^Phòng Quản lý các khoản thu từ đất$/i, "Phòng QL thu từ đất")
  .replace(/^Phòng Thuế cá nhân, hộ kinh doanh và thu khác$/i, "Phòng Thuế cá nhân – HKD");

export function TongQuanQL1({ ky, trongPhamVi }: { ky: KyQL1; trongPhamVi: DonViQL1[] }) {
  const { no, cc, th, t06, xepHang, tyLe } = useMemo(() => {
    const dsNo = trongPhamVi.map((dv) => tongHopCuaTab.no(ky.hat, dv));
    const dvCC = trongPhamVi;
    const dvTH = trongPhamVi.filter((dv) => donViCuaTab("th").some((x) => x.id === dv.id));
    const dsCC = dvCC.map((dv) => tongHopCuaTab.cc(ky.hat, dv));
    const dsTH = dvTH.map((dv) => tongHopCuaTab.th(ky.hat, dv));
    const ds06 = dvTH.map((dv) => tongHopCuaTab.t06(ky.hat, dv));

    /* Xếp hạng theo mức TĂNG nợ khả năng thu so với đầu năm, đúng chỉ tiêu bản
       thiết kế nêu. Đơn vị giảm nợ không vào danh sách này — nó là danh sách
       để đôn đốc, không phải bảng xếp hạng tổng quát. */
    const tang = trongPhamVi
      .map((dv) => {
        const o = tongHopCuaTab.no(ky.hat, dv);
        return { dv, muc: Math.round((o.cur.C - o.dauNam.C) * 10) / 10 };
      })
      .filter((x) => x.muc > 0)
      .sort((a, b) => b.muc - a.muc)
      .slice(0, 10);

    const tl = trongPhamVi.map((dv) => {
      const c = tongHopCuaTab.cc(ky.hat, dv);
      const coTH = donViCuaTab("th").some((x) => x.id === dv.id);
      const t = coTH ? tongHopCuaTab.th(ky.hat, dv) : null;
      return { dv, cc: c.phaiT ? c.daT / c.phaiT : 0, th: t && t.phaiT ? t.daT / t.phaiT : null };
    }).sort((a, b) => a.cc - b.cc).slice(0, 10);

    return {
      no: cong<OTongHopNo>(dsNo),
      cc: cong<OTongHopXuLy>(dsCC),
      th: cong<OTongHopXuLy>(dsTH),
      t06: cong<OTongHop06>(ds06),
      xepHang: tang,
      tyLe: tl,
    };
  }, [ky, trongPhamVi]);

  if (trongPhamVi.length === 0) {
    return <Panel title="Tổng quan"><div className="empty-state"><strong>Không có đơn vị nào trong phạm vi lọc</strong></div></Panel>;
  }

  const maxTang = xepHang[0]?.muc ?? 0;

  return <>
    <Panel title="Nợ đến ngày báo cáo" subtitle={`Chốt ${ky.ngayChot} · số lấy từ mục Tình hình nợ`}>
      <div className="the-luoi">
        <TheNo nhan="Tổng cộng (B)" khoa="B" o={no}/>
        <TheNo nhan="Nợ khả năng thu (C)" khoa="C" o={no}/>
        <TheNo nhan="Khó thu (D)" khoa="D" o={no}/>
        <TheNo nhan="Đang xử lý (E)" khoa="E" o={no}/>
      </div>
    </Panel>

    <div className="tq-doi">
      <Panel title="Cưỡng chế nợ thuế" subtitle="Số lấy từ mục Cưỡng chế nợ thuế">
        <div className="the-luoi is-hep">
          <div className="the-so"><span className="the-nhan">Phải cưỡng chế</span><strong className="the-gia">{integer(cc.phaiN)}</strong><span className="the-dvt">người nộp thuế</span></div>
          <div className="the-so"><span className="the-nhan">Đã cưỡng chế</span><strong className="the-gia">{integer(cc.daN)}</strong><span className="the-dvt">người nộp thuế</span></div>
          <div className="the-so"><span className="the-nhan">Tỷ lệ đã cưỡng chế</span><strong className="the-gia">{pt(cc.phaiT ? cc.daT / cc.phaiT : 0)}</strong><span className="the-dvt">theo số tiền</span></div>
        </div>
      </Panel>

      <Panel title="Tạm hoãn xuất cảnh" subtitle="Số lấy từ mục Tạm hoãn XC và mục trạng thái 06">
        <div className="the-luoi is-hep">
          <div className="the-so"><span className="the-nhan">Tỷ lệ đã tạm hoãn</span><strong className="the-gia">{pt(th.phaiT ? th.daT / th.phaiT : 0)}</strong><span className="the-dvt">theo số tiền</span></div>
          <div className="the-so"><span className="the-nhan">Chưa tạm hoãn</span><strong className="the-gia">{integer(th.chuaN)}</strong><span className="the-dvt">người nộp thuế</span></div>
          <div className="the-so"><span className="the-nhan">Trạng thái 06 chưa tạm hoãn</span><strong className="the-gia">{integer(t06.chuaN)}</strong><span className="the-dvt">người nộp thuế</span></div>
        </div>
      </Panel>
    </div>

    <div className="tq-doi">
      <Panel title="Đơn vị tăng nợ khả năng thu nhiều nhất" subtitle="So với đầu năm · tối đa 10 đơn vị">
        {xepHang.length === 0
          ? <div className="empty-state"><strong>Không đơn vị nào trong phạm vi có nợ khả năng thu tăng so với đầu năm</strong></div>
          : <ol className="xep-hang">{xepHang.map((x) => <Thanh key={x.dv.id} ten={rutGon(x.dv.ten)} x={x.muc} max={maxTang} phu={`${money(x.muc)} tr.đ`}/>)}</ol>}
      </Panel>

      <Panel title="Đơn vị có tỷ lệ cưỡng chế thấp nhất" subtitle="Tỷ lệ đã cưỡng chế theo số tiền · tối đa 10 đơn vị">
        <ol className="xep-hang">{tyLe.map((x) => <Thanh key={x.dv.id} ten={rutGon(x.dv.ten)} x={x.cc} max={1} phu={`${pt(x.cc)}${x.th === null ? "" : ` · THXC ${pt(x.th)}`}`}/>)}</ol>
      </Panel>
    </div>
  </>;
}
