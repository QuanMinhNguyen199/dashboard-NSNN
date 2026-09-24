/**
 * Đọc hình học THẬT của giao diện đã render, để dựng lại trên Figma đúng từng
 * ô một thay vì xếp lại bằng mắt.
 *
 * Bản trước dựng artboard từ việc đọc CHỮ trong DOM rồi tự bố trí lại. Cách đó
 * cho ra thứ giống về nội dung nhưng sai về cấu trúc — màn Tổng quan có 7 ô lọc
 * thì dựng ra 2. Ở đây đi theo hướng ngược lại: lấy toạ độ và thuộc tính hiển
 * thị của từng phần tử, rồi Figma chỉ việc vẽ lại. Không còn chỗ cho suy đoán.
 *
 * Chạy: node scripts/figma-scrape.mjs [baseUrl]
 */
import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:5174";
const KY = "year=2026&periodType=MONTH&period=8";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const MAN_HINH = [
  { id: "tong-quan", ten: "Tổng quan", url: `/?tab=overview&${KY}` },
  { id: "bao-cao-nsnn", ten: "Báo cáo · Thu NSNN", url: `/?tab=report&report=nsnn&${KY}` },
  { id: "bao-cao-budget", ten: "Báo cáo · Dự toán & dự báo", url: `/?tab=report&report=budget&${KY}` },
  { id: "bao-cao-taxpayer", ten: "Báo cáo · Quản lý thu", url: `/?tab=report&report=taxpayer&${KY}` },
  { id: "bao-cao-inspection", ten: "Báo cáo · Kết quả kiểm tra", url: `/?tab=report&report=inspection&${KY}` },
  { id: "phan-tich-thu", ten: "Phân tích thu", url: `/?tab=revenue-analysis&section=domestic&${KY}` },
  { id: "chi-tiet-dia-ban", ten: "Chi tiết · Phường/xã", url: `/?tab=location-detail&location=00004&${KY}` },
  { id: "chi-tiet-cqt", ten: "Chi tiết · Đơn vị thuế", url: `/?tab=location-detail&cqt=0106&${KY}` },
  { id: "so-sanh", ten: "So sánh nâng cao", url: `/?tab=advanced-compare&mode=period&${KY}` },
];

const KHO = [
  { id: "desktop", ten: "Desktop", w: 1440, h: 1024, them: "" },
  { id: "iframe", ten: "Nhúng iframe", w: 500, h: 900, them: "" },
  { id: "mobile", ten: "Điện thoại", w: 390, h: 844, them: "&host=mobile&platform=ios" },
];

/**
 * Chạy trong trình duyệt. Trả về cây phẳng gồm những phần tử THỰC SỰ vẽ ra
 * cái gì đó: có nền, có viền, hoặc có chữ. Mọi div chỉ để gom nhóm đều bị bỏ —
 * chúng không vẽ gì nên đưa sang Figma chỉ tạo ra hàng nghìn khung rỗng.
 */
const doDac = () => {
  const goc = document.querySelector(".dapp");
  if (!goc) return null;
  const KHUNG = goc.getBoundingClientRect();

  const mau = (s) => {
    const m = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/.exec(s || "");
    if (!m) return null;
    const a = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (a === 0) return null;
    return { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a };
  };

  /* Chữ nằm ở NODE VĂN BẢN, không ở phần tử. Lấy trực tiếp từng đoạn text để
     một thẻ vừa có chữ vừa có con không bị đếm chữ hai lần. */
  const chuTrucTiep = (el) => {
    let s = "";
    for (const n of el.childNodes) if (n.nodeType === 3) s += n.nodeValue;
    return s.replace(/\s+/g, " ").trim();
  };

  /*
    Ô CHỮ đo bằng Range, không suy từ ô chứa.

    Một `<td>` cao 38px chứa dòng chữ cao 20px: lấy ô chứa thì chữ trôi lên
    đỉnh ô, lệch 9px. Lỗi đó nhân với vài trăm dòng thì cả bảng lệch hẳn. Range
    trả về đúng hình chữ nhật mà trình duyệt vẽ chữ lên.
  */
  const oChu = (el) => {
    const r = document.createRange();
    let dau = null, cuoi = null;
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.nodeValue.trim()) continue;
      if (!dau) dau = n;
      cuoi = n;
    }
    if (!dau) return null;
    r.setStart(dau, 0);
    r.setEnd(cuoi, cuoi.nodeValue.length);
    const b = r.getBoundingClientRect();
    r.detach && r.detach();
    return b.width >= 0.5 && b.height >= 0.5 ? b : null;
  };

  const ds = [];
  const di = (el, sau) => {
    if (sau > 26) return;
    const st = getComputedStyle(el);
    /* `display: none` thì cả nhánh không render — cắt ở đây là đúng. */
    if (st.display === "none") return;

    const b = el.getBoundingClientRect();
    /*
      Phần tử 0×0 chỉ BỎ QUA CHÍNH NÓ, không cắt cả nhánh.

      Đây là lỗi làm bản quét đầu tiên chỉ ra 36 nút cho cả một màn: có 23 phần
      tử không chiếm chỗ, và một trong số đó là cha của toàn bộ vùng nội dung.
      Một thẻ có thể 0×0 mà con nó vẫn vẽ đầy màn — `display: contents` là ví
      dụ thường gặp nhất.
    */
    const coHinh = b.width >= 0.5 && b.height >= 0.5
      && st.visibility !== "hidden" && +st.opacity !== 0
      && b.bottom >= KHUNG.top - 4 && b.top <= KHUNG.bottom + 4;

    const nen = coHinh ? mau(st.backgroundColor) : null;
    const vienMau = mau(st.borderTopColor);
    const vien = {
      t: parseFloat(st.borderTopWidth) || 0, r: parseFloat(st.borderRightWidth) || 0,
      b: parseFloat(st.borderBottomWidth) || 0, l: parseFloat(st.borderLeftWidth) || 0,
    };
    const coVien = vienMau && (vien.t || vien.r || vien.b || vien.l);
    const chu = chuTrucTiep(el);
    const oc = chu ? oChu(el) : null;
    const bo = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"]
      .map((k) => parseFloat(st[k]) || 0);

    if (coHinh && (nen || coVien || chu)) {
      ds.push({
        x: +(b.left - KHUNG.left).toFixed(1),
        y: +(b.top - KHUNG.top).toFixed(1),
        w: +b.width.toFixed(1),
        h: +b.height.toFixed(1),
        d: sau,
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === "string" ? el.className : "").split(" ")[0] || "",
        nen: nen || undefined,
        vien: coVien ? { m: vienMau, ...vien } : undefined,
        bo: bo.some((v) => v > 0) ? bo : undefined,
        chu: chu || undefined,
        /* Ô chữ, toạ độ tương đối như mọi ô khác. */
        cx: oc ? +(oc.left - KHUNG.left).toFixed(1) : undefined,
        cy: oc ? +(oc.top - KHUNG.top).toFixed(1) : undefined,
        cw: oc ? +oc.width.toFixed(1) : undefined,
        ch: oc ? +oc.height.toFixed(1) : undefined,
        mucChu: chu ? mau(st.color) || undefined : undefined,
        co: chu ? Math.round(parseFloat(st.fontSize)) : undefined,
        nang: chu ? +st.fontWeight : undefined,
        canh: chu ? st.textAlign : undefined,
        /*
          Thứ tự XẾP LỚP, không phải thứ tự DOM.

          `.dshell > nav` là `position: fixed; z-index: 60` nên trình duyệt vẽ
          nó trên cùng, dù nó đứng trước nội dung trong DOM. Dựng lại theo thứ
          tự DOM thì nội dung đè lên thanh điều hướng và nó biến mất.

          Quy tắc rút gọn của CSS: khối tĩnh nằm dưới, rồi đến khối có định vị
          với z-index tự động, rồi đến z-index dương theo bậc.
        */
        lop: (() => {
          const dv = st.position !== "static";
          const z = st.zIndex === "auto" ? null : parseInt(st.zIndex, 10);
          if (z !== null && !Number.isNaN(z)) return z < 0 ? -1 : 1 + z;
          return dv ? 1 : 0;
        })(),
        cao: chu ? Math.round(parseFloat(st.lineHeight) || 0) : undefined,
      });
    }
    for (const con of el.children) di(con, sau + 1);
  };
  di(goc, 0);
  return { w: Math.round(KHUNG.width), h: Math.round(KHUNG.height), nut: ds };
};

const browser = await puppeteer.launch({ channel: "chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
const ra = {};
for (const kho of KHO) {
  await page.setViewport({
    width: kho.w, height: kho.h,
    isMobile: kho.id === "mobile", hasTouch: kho.id === "mobile",
    deviceScaleFactor: 1,
  });
  for (const m of MAN_HINH) {
    await page.goto(BASE + m.url + kho.them, { waitUntil: "networkidle0" });
    await wait(2600);
    const d = await page.evaluate(doDac);
    ra[`${m.id}--${kho.id}`] = { ten: m.ten, kho: kho.ten, ...d };
    console.log(`${m.id} · ${kho.id}: ${d.nut.length} nút`);
  }
}
await browser.close();

writeFileSync("scripts/figma-scrape.data.json", JSON.stringify(ra), "utf8");
const kb = (JSON.stringify(ra).length / 1024).toFixed(0);
console.log(`\nTổng ${Object.keys(ra).length} màn · ${kb} KB`);
