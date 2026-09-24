/**
 * Dựng lại 27 màn hình trên Figma từ hình học ĐÃ ĐO của giao diện thật.
 *
 * Ba việc, theo đúng thứ tự:
 *   1. Dựng lại CÂY LỚP theo đúng quan hệ cha–con trong DOM, thay vì đổ tất cả
 *      vào một lớp phẳng. Danh sách lớp phải duyệt được thì file mới sửa được.
 *   2. Tìm những cụm LẶP LẠI giống hệt nhau về hình học, biến cụm đầu tiên
 *      thành component và mọi chỗ còn lại thành instance.
 *   3. Vẽ vỏ nền tảng: thanh trạng thái iOS, vạch home, vỏ máy.
 *
 * Đây KHÔNG phải script Node. Sinh ra bằng `node scripts/figma-render.mjs`,
 * rồi chạy như một plugin Figma tại máy.
 */

const BAN = "__BAN__";
const D = /* __DATA__ */ {};

const CHINH = async () => {

const KHO = [
  { id: "desktop", ten: "Desktop", w: 1440, page: "03 · Desktop", cat: 0 },
  { id: "iframe", ten: "Nhúng iframe", w: 500, page: "04 · Nhúng iframe", cat: 0 },
  /*
    Riêng điện thoại CẮT ở đúng chiều cao máy.

    Hai khổ kia lấy trọn chiều cao trang để duyệt cả màn trong một cái nhìn.
    Nhưng một cái điện thoại dài 2941px thì không còn là điện thoại, và vạch
    home phải nằm ở đáy MÁY chứ không phải đáy trang.
  */
  { id: "mobile", ten: "Điện thoại", w: 390, page: "05 · Điện thoại", cat: 844 },
];
const THU_TU = ["tong-quan", "bao-cao-nsnn", "bao-cao-budget", "bao-cao-taxpayer",
  "bao-cao-inspection", "phan-tich-thu", "chi-tiet-dia-ban", "chi-tiet-cqt", "so-sanh"];

/* ── Chữ ─────────────────────────────────────────────────────────────────── */
/*
  Dùng đúng font TRÌNH DUYỆT ĐÃ VẼ, không phải font khai trong CSS.

  `dashboard.css:184` khai `system-ui` — trên Windows là Segoe UI. Dòng 590
  khai SF Pro nhưng chỉ cho host mobile, mà Windows không cài SF Pro nên cũng
  rơi về Segoe UI. Mọi số đo trong dữ liệu vì thế là số đo của Segoe UI: câu
  "Thu Ngân sách TP Hà Nội" cỡ 20px rộng 225,5px với Segoe UI và 212,7px với
  SF Pro. Vẽ lại bằng SF Pro thì chữ rộng hơn ô đo được và xuống dòng.
*/
const dsFont = await figma.listAvailableFontsAsync();
const coSan = new Set(dsFont.map((f) => f.fontName.family));
const HO = ["Segoe UI", "SF Pro Text", "SF Pro", "Inter", "Roboto"].find((f) => coSan.has(f)) || "Inter";
const NET = new Set(dsFont.filter((f) => f.fontName.family === HO).map((f) => f.fontName.style));
const co = (k, luiVe) => NET.has(k) ? k : luiVe;
/*
  Segoe UI không có nét Medium. Chrome khớp cân chữ theo quy tắc CSS: đích 500
  thì thử 500, không có thì LÙI XUỐNG 400 — tức Regular. Đẩy 500 lên Semibold
  sẽ cho chữ đậm hơn hẳn bản thật.
*/
const KIEU = (nang) => nang >= 700 ? co("Bold", "Regular")
  : nang >= 600 ? co("Semibold", co("Semi Bold", "Bold"))
  : nang >= 500 ? co("Medium", "Regular")
  : "Regular";
for (const k of [KIEU(400), KIEU(500), KIEU(600), KIEU(700)]) {
  await figma.loadFontAsync({ family: HO, style: k });
}
for (const st of await figma.getLocalTextStylesAsync()) {
  if (st.fontName.family === HO) continue;
  const nang = /Bold/i.test(st.fontName.style) ? 700
    : /Semi/i.test(st.fontName.style) ? 600
    : /Medium/i.test(st.fontName.style) ? 500 : 400;
  /* Việc PHỤ, không được quyền làm chết cả lượt dựng. */
  try {
    if (st.setFontNameAsync) await st.setFontNameAsync({ family: HO, style: KIEU(nang) });
    else st.fontName = { family: HO, style: KIEU(nang) };
  } catch (e) { /* trang Design System vẫn dùng được với font cũ */ }
}

/* ── Nối màu đo được với biến của hệ thống ───────────────────────────────── */
const V = {};
for (const c of await figma.variables.getLocalVariableCollectionsAsync()) {
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v.resolvedType !== "COLOR") continue;
    const val = v.valuesByMode[c.modes[0].modeId];
    if (!val || typeof val !== "object" || !("r" in val)) continue;
    const kh = [val.r, val.g, val.b].map((x) => Math.round(x * 255)).join(",")
      + "," + Math.round((val.a === undefined ? 1 : val.a) * 100);
    if (!V[kh]) V[kh] = v;
  }
}
const khoaMau = (m) => [m.r, m.g, m.b].map((x) => Math.round(x * 255)).join(",") + "," + Math.round(m.a * 100);
/*
  Màu trùng khít một biến thì GẮN VÀO BIẾN. Sửa một biến trong bảng màu là 27
  artboard đổi theo. Màu không trùng biến nào — bóng, màu trộn — vẫn tô thẳng,
  vì bịa thêm một biến cho nó còn tệ hơn.
*/
const son = (m) => {
  const thuong = { type: "SOLID", color: { r: m.r, g: m.g, b: m.b }, opacity: m.a };
  const v = V[khoaMau(m)];
  return v ? figma.variables.setBoundVariableForPaint(thuong, "color", v) : thuong;
};

/* ── Dựng lại cây từ danh sách phẳng ─────────────────────────────────────── */
/*
  Dữ liệu là danh sách phẳng theo thứ tự duyệt cây, mỗi phần tử mang độ sâu
  trong DOM. Một ngăn xếp theo độ sâu là đủ để nối lại quan hệ cha–con: gặp
  phần tử nông hơn thì nhả ngăn xếp tới đúng cấp. Những tổ tiên đã bị loại vì
  không vẽ gì chỉ làm độ sâu nhảy cóc, không làm sai thứ bậc.
*/
const dungCay = (ds) => {
  const goc = [];
  const ngan = [];
  for (const n of ds) {
    const nut = {
      x: n.x, y: n.y, w: n.w, h: n.h, d: n.d, tag: n.tag, cls: n.cls,
      nen: n.nen, vien: n.vien, bo: n.bo,
      chu: n.chu, cx: n.cx, cy: n.cy, cw: n.cw, ch: n.ch,
      mucChu: n.mucChu, co: n.co, nang: n.nang, canh: n.canh, cao: n.cao,
      lop: n.lop || 0,
      con: [],
    };
    while (ngan.length && ngan[ngan.length - 1].d >= n.d) ngan.pop();
    const cha = ngan.length ? ngan[ngan.length - 1] : null;
    if (cha) cha.con.push(nut); else goc.push(nut);
    ngan.push(nut);
  }
  return goc;
};

const CAY = {};
for (const kho of KHO) {
  for (const id of THU_TU) {
    const d = D[id + "--" + kho.id];
    if (!d) continue;
    const trong = d.nut.filter((n) =>
      n.x + n.w >= 0 && n.x <= kho.w && (!kho.cat || n.y <= kho.cat));
    CAY[id + "--" + kho.id] = { ten: d.ten, w: kho.w, h: kho.cat || d.h, goc: dungCay(trong) };
  }
}

/* ── Tìm cụm lặp lại để biến thành component ─────────────────────────────── */
/*
  Chữ ký chỉ mô tả HÌNH HỌC, cố tình bỏ qua nội dung chữ: hai cái nút giống
  nhau y hệt về khung và cách bố trí vẫn là cùng một component, dù một cái ghi
  "Xuất Excel" còn cái kia ghi "Đặt lại bộ lọc".
*/
const r0 = (v) => Math.round(v);
const chuKy = (n) => {
  const nen = n.nen ? khoaMau(n.nen) : "-";
  const vien = n.vien ? khoaMau(n.vien.m) + ":" + [n.vien.t, n.vien.r, n.vien.b, n.vien.l].join("/") : "-";
  const tuChu = n.chu ? "T" + n.co + "/" + n.nang + "/" + (n.canh || "") : "-";
  const conKy = n.con.map((c) => r0(c.x - n.x) + "," + r0(c.y - n.y) + "~" + chuKy(c)).join(";");
  return [n.tag + "." + n.cls, r0(n.w) + "x" + r0(n.h), nen, vien, tuChu,
    n.bo ? n.bo.map(r0).join("/") : "-", "[" + conKy + "]"].join("|");
};
const demNut = (n) => 1 + n.con.reduce((a, c) => a + demNut(c), 0);
const dsChu = (n, goc, ra) => {
  if (n.chu && n.cx !== undefined) {
    ra.push({
      cx: n.cx - goc.x, cy: n.cy - goc.y, cw: n.cw, ch: n.ch,
      canh: n.canh, co: n.co, nang: n.nang, cao: n.cao, mucChu: n.mucChu, chu: n.chu,
    });
  }
  for (const c of n.con) dsChu(c, goc, ra);
  return ra;
};

const THONG_KE = {};
const gomThongKe = (n) => {
  const so = demNut(n);
  /*
    Chỉ xét cụm ĐỦ NHỎ VÀ ĐỦ KÍN. Một cụm 40 phần tử lặp lại thường là cả một
    thẻ với nội dung khác hẳn nhau; biến nó thành component thì mỗi lần sửa nội
    dung đều phải tách instance — tệ hơn là không có component.
  */
  if (n.cls && n.con.length && so >= 2 && so <= 14 && n.w <= 640 && n.h <= 220) {
    const k = chuKy(n);
    const t = THONG_KE[k] || (THONG_KE[k] = { so: 0, ten: n.tag + "." + n.cls, w: n.w, h: n.h, o: [] });
    t.so += 1;
    if (t.o.length < 400) t.o.push(dsChu(n, n, []));
  }
  for (const c of n.con) gomThongKe(c);
};
for (const k of Object.keys(CAY)) for (const g of CAY[k].goc) gomThongKe(g);

/*
  Mốc ba lần: hai lần có thể là trùng hợp, ba lần trở lên là một mẫu thật sự.
  Dưới mốc đó mà vẫn dựng component thì trang thư viện đầy những thứ dùng đúng
  một lần — đọc mệt hơn là không có.
*/
const MAU = {};
for (const k of Object.keys(THONG_KE)) {
  const t = THONG_KE[k];
  if (t.so < 3) continue;
  /*
    Ô chữ trong component lấy bề rộng LỚN NHẤT trong nhóm, và neo theo kiểu
    canh lề. Lấy bề rộng của cái đầu tiên thì instance nào có chữ dài hơn sẽ bị
    ngắt dòng — đúng lỗi vừa sửa ở bước trước.
  */
  const n = Math.max.apply(null, t.o.map((x) => x.length));
  const o = [];
  for (let i = 0; i < n; i += 1) {
    const cot = t.o.map((x) => x[i]).filter(Boolean);
    if (!cot.length) { o.push(null); continue; }
    o.push({
      canh: cot[0].canh, co: cot[0].co, nang: cot[0].nang, cao: cot[0].cao,
      mucChu: cot[0].mucChu, chu: cot[0].chu,
      cw: Math.max.apply(null, cot.map((c) => c.cw)),
      ch: Math.max.apply(null, cot.map((c) => c.ch)),
      trai: Math.min.apply(null, cot.map((c) => c.cx)),
      phai: Math.max.apply(null, cot.map((c) => c.cx + c.cw)),
      giua: cot[0].cx + cot[0].cw / 2,
      cy: Math.min.apply(null, cot.map((c) => c.cy)),
    });
  }
  MAU[k] = { ten: t.ten, so: t.so, w: t.w, h: t.h, o: o };
}

/* ── Vẽ ──────────────────────────────────────────────────────────────────── */
const datChu = (t, o, cx, cy, cw, ch) => {
  t.fontName = { family: HO, style: KIEU(o.nang || 400) };
  t.fontSize = Math.max(1, o.co || 14);
  t.characters = o.chu;
  if (o.cao) t.lineHeight = { unit: "PIXELS", value: o.cao };
  const canh = o.canh === "right" || o.canh === "end" ? "RIGHT"
    : o.canh === "center" ? "CENTER" : "LEFT";
  t.textAlignHorizontal = canh;
  /*
    MỘT DÒNG thì để chữ ôm sát, KHÔNG ép vào bề rộng đo được.

    Figma và Chrome chênh nhau chừng nửa pixel mỗi ký tự do khác cách làm tròn.
    Với nhãn vừa khít ô, chừng đó đủ đẩy nó xuống dòng hai và phá cả hàng. Ôm
    sát thì không còn chỗ để xuống dòng; vị trí đặt lại theo kiểu canh lề nên
    mép chữ vẫn trùng bản thật.

    NHIỀU DÒNG thì ngược lại: bề rộng chính là thứ quyết định ngắt dòng ở đâu.
  */
  const motDong = ch <= (o.cao || Math.round((o.co || 14) * 1.4)) * 1.6;
  if (motDong) {
    t.textAutoResize = "WIDTH_AND_HEIGHT";
    t.x = canh === "RIGHT" ? cx + cw - t.width
      : canh === "CENTER" ? cx + (cw - t.width) / 2
      : cx;
    t.y = cy + (ch - t.height) / 2;
  } else {
    t.resize(Math.max(1, cw + 1), Math.max(1, ch));
    t.textAutoResize = "HEIGHT";
    t.x = cx; t.y = cy;
  }
  t.textAlignVertical = "CENTER";
  t.fills = o.mucChu ? [son(o.mucChu)] : [];
  t.name = o.chu.slice(0, 40);
};

const datKhung = (f, n) => {
  f.fills = n.nen ? [son(n.nen)] : [];
  if (n.bo) {
    f.topLeftRadius = n.bo[0]; f.topRightRadius = n.bo[1];
    f.bottomRightRadius = n.bo[2]; f.bottomLeftRadius = n.bo[3];
  }
  if (n.vien) {
    f.strokes = [son(n.vien.m)];
    f.strokeAlign = "INSIDE";
    /* Viền bốn cạnh khác nhau là chuyện thường trong bảng: chỉ kẻ đáy, chỉ kẻ
       trái. Gộp thành một độ dày thì mất hết đường phân dòng. */
    f.strokeTopWeight = n.vien.t;
    f.strokeRightWeight = n.vien.r;
    f.strokeBottomWeight = n.vien.b;
    f.strokeLeftWeight = n.vien.l;
  } else {
    f.strokes = [];
  }
};

/* ── Xếp lớp theo CSS, không theo DOM ───────────────────────────────────── */
/*
  Con nào có thứ tự lớp cao hơn thì nằm sau trong danh sách con của Figma, tức
  vẽ đè lên. Phép sắp phải ỔN ĐỊNH: hai con cùng bậc thì giữ nguyên thứ tự DOM,
  vì đó chính là thứ tự trình duyệt dùng để phân định.
*/
const xepTheoLop = (f, n) => {
  const bac = n.con.map((c) => c.lop || 0);
  if (!bac.length || Math.min.apply(null, bac) === Math.max.apply(null, bac)) return;
  const con = f.children.slice();
  const nhan = new Map();
  /* Con của Figma gồm cả ô chữ của chính khung, không chỉ các con DOM — nên
     nối theo thứ tự chứ không theo chỉ số. */
  let i = 0;
  for (const c of con) {
    nhan.set(c, i < n.con.length ? (n.con[i].lop || 0) : 0);
    i += 1;
  }
  const sap = con
    .map((c, k) => ({ c: c, lop: nhan.get(c), k: k }))
    .sort((a, b) => a.lop - b.lop || a.k - b.k);
  for (const x of sap) f.appendChild(x.c);
};

/* ── Suy ra auto layout từ hình học ──────────────────────────────────────── */
/*
  Một khung chỉ được bật auto layout khi hình học của nó THỰC SỰ là auto layout:
  các con xếp thành đúng một hàng hoặc một cột, không chồng nhau, khoảng cách
  giữa chúng đều nhau, và canh lề theo trục kia nhất quán.

  Ba điều kiện đó không phải để cho chặt chẽ hình thức — chúng đúng bằng những
  gì auto layout của Figma có thể diễn đạt. Bật nó cho một khung không thoả sẽ
  làm các con NHẢY về chỗ khác, tức là phá đúng cái độ chính xác vừa dựng được.
  Khung nào không thoả thì giữ toạ độ tuyệt đối, và như thế là trung thực.
*/
const XAP_XI = 1.5;
const deu = (ds) => ds.length === 0
  || Math.max.apply(null, ds) - Math.min.apply(null, ds) <= XAP_XI;

/**
 * Bộ con này có xếp thành đúng một hàng hoặc một cột không?
 * Trả về cấu hình auto layout, hoặc null nếu hình học không diễn đạt được.
 */
const thuXep = (o) => {
  if (o.length < 2) return null;

  /* Thử cột trước: dashboard xếp dọc nhiều hơn xếp ngang. */
  const doc = o.slice().sort((a, b) => a.y - b.y);
  let laDoc = true;
  for (let i = 1; i < doc.length; i += 1) {
    if (doc[i].y < doc[i - 1].y + doc[i - 1].h - XAP_XI) { laDoc = false; break; }
  }
  const ngang = o.slice().sort((a, b) => a.x - b.x);
  let laNgang = true;
  for (let i = 1; i < ngang.length; i += 1) {
    if (ngang[i].x < ngang[i - 1].x + ngang[i - 1].w - XAP_XI) { laNgang = false; break; }
  }
  /* Vừa là hàng vừa là cột thì hình học chưa đủ để kết luận. Không đoán. */
  if (laDoc === laNgang) return null;

  const ds = laDoc ? doc : ngang;
  /*
    Thứ tự con SAU khi sắp phải trùng thứ tự hiện có.

    Thứ tự con trong khung vừa quyết định thứ tự auto layout, vừa quyết định
    cái gì vẽ đè lên cái gì. Đảo nó để chiều được auto layout là đổi luôn thứ
    tự xếp lớp — sửa một thứ, hỏng một thứ khác.
  */
  for (let i = 0; i < ds.length; i += 1) if (ds[i] !== o[i]) return null;

  const khoang = [];
  for (let i = 1; i < ds.length; i += 1) {
    khoang.push(laDoc
      ? ds[i].y - (ds[i - 1].y + ds[i - 1].h)
      : ds[i].x - (ds[i - 1].x + ds[i - 1].w));
  }
  if (!deu(khoang)) return null;
  if (khoang.some((k) => k < -XAP_XI)) return null;

  /* Canh lề theo trục kia phải nhất quán, nếu không auto layout sẽ dồn hết về
     một phía. */
  const dau = ds.map((c) => laDoc ? c.x : c.y);
  const cuoi = ds.map((c) => laDoc ? c.x + c.w : c.y + c.h);
  const giua = ds.map((c, i) => dau[i] + (laDoc ? c.w : c.h) / 2);
  const canh = deu(dau) ? "MIN" : deu(cuoi) ? "MAX" : deu(giua) ? "CENTER" : null;
  if (!canh) return null;

  return { laDoc: laDoc, khoang: khoang.length ? khoang[0] : 0, canh: canh };
};

/*
  Một khung chỉ được bật auto layout khi hình học của nó THỰC SỰ là auto layout.
  Bật cho khung không thoả sẽ làm các con NHẢY chỗ, tức phá đúng độ chính xác
  vừa dựng được. Khung không thoả thì giữ toạ độ tuyệt đối, và như thế là trung
  thực.
*/
const tuDongXepLop = (f) => {
  const con = f.children.filter((c) => c.visible !== false);
  if (con.length < 2) return false;
  const o = con.map((c) => ({ n: c, x: c.x, y: c.y, w: c.width, h: c.height }));

  let cau = thuXep(o);
  let tham = o;
  let ngoai = [];
  /*
    Hỏng vì MỘT con nằm đè thì tách riêng con đó ra vị trí tuyệt đối.

    Huy hiệu góc thẻ, nhãn treo trên biểu đồ, lớp phủ — chúng nằm chồng lên
    anh em đúng theo thiết kế. Loại một con mà phần còn lại thành hàng hoặc cột
    sạch sẽ thì cả khung vẫn đáng là auto layout; con kia neo tuyệt đối, giữ
    nguyên vị trí đo được.
  */
  if (!cau && o.length >= 3 && o.length <= 14) {
    for (let i = 0; i < o.length; i += 1) {
      const bo = o.filter((_, j) => j !== i);
      const c2 = thuXep(bo);
      if (c2) { cau = c2; tham = bo; ngoai = [o[i]]; break; }
    }
  }
  if (!cau) return false;

  const truoc = o.map((c) => ({ n: c.n, x: c.x, y: c.y }));
  const rong = f.width, cao = f.height;
  const dem = {
    trai: Math.min.apply(null, tham.map((c) => c.x)),
    phai: rong - Math.max.apply(null, tham.map((c) => c.x + c.w)),
    tren: Math.min.apply(null, tham.map((c) => c.y)),
    duoi: cao - Math.max.apply(null, tham.map((c) => c.y + c.h)),
  };
  if (dem.trai < -XAP_XI || dem.phai < -XAP_XI || dem.tren < -XAP_XI || dem.duoi < -XAP_XI) return false;

  f.layoutMode = cau.laDoc ? "VERTICAL" : "HORIZONTAL";
  f.itemSpacing = Math.max(0, Math.round(cau.khoang * 10) / 10);
  f.paddingLeft = Math.max(0, dem.trai);
  f.paddingRight = Math.max(0, dem.phai);
  f.paddingTop = Math.max(0, dem.tren);
  f.paddingBottom = Math.max(0, dem.duoi);
  f.primaryAxisSizingMode = "FIXED";
  f.counterAxisSizingMode = "FIXED";
  /*
    Trả lại đúng kích thước đo được.

    Gán `layoutMode` làm Figma lập tức co khung về ôm nội dung; đặt `FIXED`
    sau đó chỉ khoá lại kích thước ĐÃ CO. Khung co lại thì mọi thứ bên trong
    và bên cạnh nó đều lệch theo.
  */
  f.resize(rong, cao);
  f.counterAxisAlignItems = cau.canh;
  f.primaryAxisAlignItems = "MIN";

  for (const c of ngoai) {
    c.n.layoutPositioning = "ABSOLUTE";
    c.n.x = c.x; c.n.y = c.y;
  }

  /*
    Kiểm lại bằng CHÍNH KẾT QUẢ: con nào xê dịch quá 1px thì phép suy sai, trả
    khung về toạ độ tuyệt đối. Rẻ hơn nhiều so với để sai lọt ra artboard.
  */
  let lech = 0;
  for (const c of truoc) lech = Math.max(lech, Math.abs(c.n.x - c.x), Math.abs(c.n.y - c.y));
  if (lech > 1) {
    for (const c of ngoai) c.n.layoutPositioning = "AUTO";
    f.layoutMode = "NONE";
    for (const c of truoc) { c.n.x = c.x; c.n.y = c.y; }
    return false;
  }
  return true;
};

let soLop = 0;
let soInstance = 0;
const COMP = {};

/**
 * Vẽ một nhánh vào `cha`, toạ độ tính theo gốc (gx, gy).
 * `duocThay` bật thì cụm nào khớp mẫu sẽ thành instance thay vì vẽ lại.
 */
const ve = (n, cha, gx, gy, duocThay) => {
  if (duocThay && n.cls && n.con.length) {
    const k = chuKy(n);
    if (MAU[k]) {
      if (!COMP[k]) COMP[k] = taoComponent(n, k);
      const i = COMP[k].createInstance();
      cha.appendChild(i);
      i.x = n.x - gx; i.y = n.y - gy;
      /* Ghi đè chữ theo thứ tự duyệt: cùng chữ ký thì cùng số ô chữ và cùng
         thứ tự, nên khớp một-một. */
      const dsT = i.findAll((z) => z.type === "TEXT");
      const oChu = dsChu(n, n, []);
      dsT.forEach((t, j) => { if (oChu[j]) t.characters = oChu[j].chu; });
      soInstance += 1;
      return;
    }
  }

  const ten = n.tag + (n.cls ? "." + n.cls : "");
  const coChu = !!(n.chu && n.cx !== undefined);
  const coHinh = !!(n.nen || n.vien);
  /*
    Nút vừa có nền vừa có chữ phải thành MỘT khung chứa chữ, không phải hai
    node anh em chồng lên nhau.

    Đây là lý do auto layout gần như không bao giờ bật được ở bản trước: phép
    kiểm đòi các con không chồng nhau, mà mỗi nút lá lại đẻ ra một hình nền và
    một ô chữ nằm đúng chồng lên nó. Gói vào một khung thì cha chỉ thấy một con
    và hình học trở lại đúng như trong trình duyệt.
  */
  const canKhung = n.con.length > 0 || (coHinh && coChu);

  let hop = null;
  if (canKhung) {
    hop = figma.createFrame();
    hop.name = ten;
    hop.x = n.x - gx; hop.y = n.y - gy;
    hop.resize(Math.max(0.01, n.w), Math.max(0.01, n.h));
    /* KHÔNG cắt: `overflow: visible` là mặc định của trình duyệt, cắt ở đây sẽ
       nuốt mất phần tràn ra ngoài ô. */
    hop.clipsContent = false;
    datKhung(hop, n);
    cha.appendChild(hop);
    for (const c of n.con) ve(c, hop, n.x, n.y, duocThay);
    if (coChu) {
      const t = figma.createText();
      hop.appendChild(t);
      datChu(t, n, n.cx - n.x, n.cy - n.y, n.cw, n.ch);
    }
    xepTheoLop(hop, n);
    /* Khung nào chỉ chứa đúng ô chữ của chính nó thì không có gì để xếp. */
    if (n.con.length && tuDongXepLop(hop)) soLop += 1;
  } else if (coHinh) {
    hop = figma.createRectangle();
    hop.name = ten;
    hop.x = n.x - gx; hop.y = n.y - gy;
    hop.resize(Math.max(0.01, n.w), Math.max(0.01, n.h));
    datKhung(hop, n);
    cha.appendChild(hop);
  } else if (coChu) {
    const t = figma.createText();
    cha.appendChild(t);
    datChu(t, n, n.cx - gx, n.cy - gy, n.cw, n.ch);
  }
};

/* ── Trang chứa component tự sinh ────────────────────────────────────────── */
/*
  Component tự sinh có PAGE RIÊNG, không trộn vào `02 · Components`.

  Hai bộ trả lời hai câu hỏi khác nhau: bộ dựng tay nói giao diện NÊN như thế
  nào theo đặc tả CSS, bộ tự sinh nói giao diện ĐANG như thế nào. Trộn chung
  thì không ai biết đang nhìn cái nào, và xoá một bộ sẽ kéo theo bộ kia.
*/
const trangThuVien = figma.root.children.find((p) => p.name === "06 · Component tự sinh")
  || figma.createPage();
trangThuVien.name = "06 · Component tự sinh";
const KHU_X = 0;
let khuX = KHU_X, khuY = 0, khuCao = 0;

function taoComponent(n, k) {
  const m = MAU[k];
  const khung = figma.createFrame();
  khung.name = m.ten;
  khung.resize(Math.max(0.01, n.w), Math.max(0.01, n.h));
  khung.clipsContent = false;
  datKhung(khung, n);
  /* Bên trong component KHÔNG thay tiếp bằng instance: component lồng component
     nghe thì gọn, nhưng khi chữ ký cha đã gộp cả hình học của con thì mỗi thay
     đổi nhỏ của con lại sinh một cha mới. Giữ một cấp là đủ dùng. */
  for (const c of n.con) ve(c, khung, n.x, n.y, false);
  if (n.chu && n.cx !== undefined) {
    const t = figma.createText();
    khung.appendChild(t);
    datChu(t, n, n.cx - n.x, n.cy - n.y, n.cw, n.ch);
  }
  /* Ô chữ lấy bề rộng lớn nhất trong nhóm và neo theo kiểu canh lề, nếu không
     instance có chữ dài hơn sẽ bị ngắt dòng. */
  const dsT = khung.findAll((z) => z.type === "TEXT");
  dsT.forEach((t, i) => {
    const o = m.o[i];
    if (!o) return;
    t.textAutoResize = "NONE";
    t.resize(Math.max(1, o.cw + 2), Math.max(1, o.ch));
    t.x = t.textAlignHorizontal === "RIGHT" ? o.phai - o.cw - 2
      : t.textAlignHorizontal === "CENTER" ? o.giua - (o.cw + 2) / 2
      : o.trai;
    t.y = o.cy;
  });

  trangThuVien.appendChild(khung);
  khung.x = khuX; khung.y = khuY;
  khuCao = Math.max(khuCao, khung.height);
  khuX += khung.width + 40;
  if (khuX > KHU_X + 1800) { khuX = KHU_X; khuY += khuCao + 40; khuCao = 0; }

  const c = figma.createComponentFromNode(khung);
  c.name = m.ten + " · " + Math.round(m.w) + "×" + Math.round(m.h);
  c.description = "Tự sinh từ giao diện thật. Xuất hiện " + m.so + " lần trên 27 artboard.";
  return c;
}

/* ── Vỏ nền tảng ─────────────────────────────────────────────────────────── */
const veThanhTrangThai = (man, w) => {
  const trang = { type: "SOLID", color: { r: 1, g: 1, b: 1 } };
  const nen = figma.createRectangle();
  nen.name = "iOS status bar";
  nen.resize(w, 47); nen.x = 0; nen.y = 0;
  /* Cùng navy với header ngay dưới: trên máy thật hai dải này liền thành một
     mảng, cắt màu ở đây tạo ra một đường kẻ không có thật. */
  nen.fills = [{ type: "SOLID", color: { r: 0.055, g: 0.165, b: 0.278 } }];
  man.appendChild(nen);

  const gio = figma.createText();
  gio.fontName = { family: HO, style: KIEU(600) };
  gio.fontSize = 15;
  gio.characters = "9:41";   /* giờ mặc định Apple dùng trong mọi ảnh sản phẩm */
  gio.x = 27; gio.y = 16;
  gio.fills = [trang];
  gio.name = "9:41";
  man.appendChild(gio);

  const X = w - 21;
  [4, 6.3, 8.6, 11].forEach((cao, i) => {
    const r = figma.createRectangle();
    r.resize(3, cao);
    r.x = X - 56 + i * 4.5; r.y = 20 + (11 - cao);
    r.cornerRadius = 1; r.fills = [trang]; r.name = "signal";
    man.appendChild(r);
  });
  /* Wifi rút còn một cung dày và một chấm: ở 11px, ba cung đồng tâm của iOS
     dính thành một mảng đặc, không còn đọc ra hình wifi. */
  const cung = figma.createEllipse();
  cung.resize(16, 16); cung.x = X - 33; cung.y = 19;
  cung.arcData = { startingAngle: -Math.PI * 0.82, endingAngle: -Math.PI * 0.18, innerRadius: 0.62 };
  cung.fills = [trang]; cung.name = "wifi";
  man.appendChild(cung);
  const cham = figma.createEllipse();
  cham.resize(3.4, 3.4); cham.x = X - 26.7; cham.y = 26.4;
  cham.fills = [trang]; cham.name = "wifi dot";
  man.appendChild(cham);

  const vo = figma.createRectangle();
  vo.resize(24, 12); vo.x = X - 24; vo.y = 20; vo.cornerRadius = 4;
  vo.fills = []; vo.strokes = [trang]; vo.strokeWeight = 1; vo.opacity = 0.42;
  vo.name = "battery"; man.appendChild(vo);
  const nap = figma.createRectangle();
  nap.resize(1.6, 4.6); nap.x = X + 1; nap.y = 23.7; nap.cornerRadius = 1;
  nap.fills = [trang]; nap.opacity = 0.42; nap.name = "battery cap";
  man.appendChild(nap);
  const con = figma.createRectangle();
  con.resize(18, 8); con.x = X - 22; con.y = 22; con.cornerRadius = 2.4;
  con.fills = [trang]; con.name = "battery level";
  man.appendChild(con);
};

const veVachHome = (man, w, h) => {
  const r = figma.createRectangle();
  r.name = "Home indicator";
  r.resize(139, 5); r.cornerRadius = 2.5;
  r.x = (w - 139) / 2; r.y = h - 13;
  r.fills = [{ type: "SOLID", color: { r: 0.086, g: 0.149, b: 0.235 } }];
  man.appendChild(r);
};

const veKhungMay = (man, w, h) => {
  const VIEN = 14;
  const may = figma.createFrame();
  may.name = "iPhone 14 · " + man.name;
  may.resize(w + VIEN * 2, h + VIEN * 2);
  may.cornerRadius = 56;
  may.clipsContent = true;
  may.fills = [{ type: "SOLID", color: { r: 0.055, g: 0.06, b: 0.07 } }];
  /* Vành sáng mảnh: thiếu nó thân máy đen dính vào nền và mất đường viền. */
  may.strokes = [{ type: "SOLID", color: { r: 0.35, g: 0.37, b: 0.4 } }];
  may.strokeWeight = 1.5;
  may.strokeAlign = "INSIDE";

  man.x = VIEN; man.y = VIEN;
  man.cornerRadius = 44;
  man.clipsContent = true;
  may.appendChild(man);

  /* Tai thỏ treo từ mép trên: chỉ bo hai góc DƯỚI. Bo cả bốn thì nó thành một
     viên thuốc lơ lửng, không dính vào cạnh máy. */
  const tai = figma.createRectangle();
  tai.name = "Notch";
  tai.resize(162, 32);
  tai.topLeftRadius = 0; tai.topRightRadius = 0;
  tai.bottomLeftRadius = 16; tai.bottomRightRadius = 16;
  tai.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  tai.x = VIEN + (w - 162) / 2;
  tai.y = VIEN;
  may.appendChild(tai);
  return may;
};

/* ── Dựng ────────────────────────────────────────────────────────────────── */
const daDung = [trangThuVien.id];
const layPage = (ten) => {
  const ranh = (x) => daDung.indexOf(x.id) === -1;
  let p = figma.root.children.find((x) => x.name === ten && ranh(x));
  if (!p) p = figma.root.children.find((x) => x.name === "03 · Màn hình" && ranh(x));
  if (!p) p = figma.root.children.find((x) => x.children.length === 0 && ranh(x));
  if (!p) p = figma.createPage();
  p.name = ten;
  daDung.push(p.id);
  return p;
};

/* Dọn sạch trang, nếu không mỗi lần chạy lại là một lớp component chồng lên
   lớp cũ. Trang này do plugin làm chủ hoàn toàn nên dọn hết là đúng. */
for (const c of trangThuVien.children.slice()) c.remove();
trangThuVien.backgrounds = [{ type: "SOLID", color: { r: 0.949, g: 0.961, b: 0.976 } }];

const ketQua = [];
for (const kho of KHO) {
  const page = layPage(kho.page);
  for (const c of page.children.slice()) c.remove();
  page.backgrounds = [{ type: "SOLID", color: { r: 0.949, g: 0.961, b: 0.976 } }];

  let x = 0;
  for (const id of THU_TU) {
    const t = CAY[id + "--" + kho.id];
    if (!t) continue;

    const man = figma.createFrame();
    man.name = t.ten + " · " + kho.ten + " " + t.w + "×" + Math.round(t.h);
    man.resize(t.w, t.h);
    man.clipsContent = true;
    man.fills = [{ type: "SOLID", color: { r: 0.949, g: 0.961, b: 0.976 } }];
    /*
      Nút gốc cũng phải xếp theo lớp.

      `.dshell` không vẽ gì nên bị loại khỏi phép đo, khiến thanh điều hướng,
      thanh lọc và nội dung cùng trở thành nút gốc của artboard. Chúng không đi
      qua `xepTheoLop` của một khung cha nào cả — nên phải sắp ngay ở đây, nếu
      không nội dung lại đè lên thanh điều hướng như cũ.
    */
    const goc = t.goc
      .map((g, i) => ({ g: g, lop: g.lop || 0, i: i }))
      .sort((a, b) => a.lop - b.lop || a.i - b.i);
    for (const g of goc) ve(g.g, man, 0, 0, true);

    if (kho.id === "mobile") {
      veThanhTrangThai(man, t.w);
      veVachHome(man, t.w, t.h);
    }
    const ngoai = kho.id === "mobile" ? veKhungMay(man, t.w, t.h) : man;
    page.appendChild(ngoai);
    ngoai.x = x; ngoai.y = 0;
    x += ngoai.width + 64;
  }
  ketQua.push(page.name + " · " + THU_TU.length + " artboard");
}
await figma.setCurrentPageAsync(figma.root.children.find((p) => p.name === KHO[0].page));

return {
  ban: BAN, ho: HO,
  soArtboard: KHO.length * THU_TU.length,
  soComponent: Object.keys(COMP).length,
  soInstance: soInstance,
  soLop: soLop,
  trang: ketQua,
};
};

return await CHINH();
