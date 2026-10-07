import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer-core";

/* Bỏ dấu gạch chéo cuối để `${base}/?view=` không thành đường dẫn hai gạch —
   máy chủ tĩnh trả 404 cho nó và lỗi hiện ra ở nơi khác hẳn nguyên nhân. */
const base = (process.argv[2] ?? "http://127.0.0.1:5174").replace(/\/+$/, "");

/*
  Màn hình không còn là một danh sách chung: mỗi tài khoản mở được một tập
  khác nhau, theo ma trận phòng × vai ở mục 3 bản thiết kế. Cổng kiểm vì thế
  nhận danh sách theo TÀI KHOẢN, và kiểm cả hai chiều — màn phải mở được, và
  màn của phòng khác phải không mở được.
*/
const MAN_QL1 = ["workbench", "debt", "tinhtrang"];
const MAN_QL3 = ["workbench", "risk", "tinhtrang"];

const browser = await puppeteer.launch({ channel: "chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`${message.text()} ${message.location().url ?? ""}`.trim());
});
await mkdir(".impeccable/review", { recursive: true });

/*
  Mỗi lượt nghiệm thu bắt đầu từ màn đăng nhập để kiểm tra đúng luồng demo,
  sau đó giữ phiên trong sessionStorage cho các deep link kế tiếp.

  Không còn ô tài khoản/mật khẩu: màn đăng nhập của bản demo chỉ có lối
  Keycloak tượng trưng và sáu thẻ vai bấm vào là vào thẳng. Cổng kiểm vì thế
  bấm đúng thẻ mang mã tài khoản cần dùng, như người xem demo làm.
*/
async function dangNhap(page, username) {
  if (username === "lanhdao.nhanuoc" && new URL(page.url()).pathname.endsWith("/quan-ly/")) {
    await page.goto(`${base}/nsnn/`, { waitUntil: "networkidle0" });
  }
  await page.waitForSelector(".demo-accounts-list");
  const bamDuoc = await page.evaluate((ma) => {
    const nut = [...document.querySelectorAll(".demo-accounts-list button")]
      .find((b) => b.querySelector("code")?.textContent?.trim() === ma);
    if (!nut) return false;
    nut.click();
    return true;
  }, username);
  if (!bamDuoc) throw new Error(`Màn đăng nhập không có thẻ vai cho tài khoản ${username}.`);
}

/* Nút Đăng xuất nằm trong thanh điều hướng, và ở khổ hẹp thanh đó chỉ dựng
   trong ngăn kéo. Kiểm hiển thị thật bằng `offsetParent` chứ không bằng sự
   tồn tại trong DOM — phần tử bị CSS ẩn vẫn `querySelector` ra được. */
async function dangXuat(page) {
  const hien = await page.evaluate(() => {
    const nut = document.querySelector(".logout-button");
    return Boolean(nut && nut.offsetParent !== null);
  });
  if (!hien) {
    await page.click(".menu-button");
    await page.waitForSelector(".mobile-drawer .logout-button");
    await page.click(".mobile-drawer .logout-button");
  } else {
    await page.click(".logout-button");
  }
  await page.waitForSelector(".login-page");
  if (await page.$(".workspace") !== null) throw new Error("Đăng xuất không xoá phiên demo.");
}

await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${base}/`, { waitUntil: "networkidle0" });
const hasLogin = await page.$(".login-page") !== null;
if (!hasLogin) throw new Error("Không thấy màn đăng nhập khi chưa có phiên demo.");
await page.screenshot({ path: ".impeccable/review/login-desktop.png", fullPage: true });
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.reload({ waitUntil: "networkidle0" });
await page.screenshot({ path: ".impeccable/review/login-mobile.png", fullPage: true });
/*
  Màn đăng nhập còn đúng hai lối: Keycloak tượng trưng và các thẻ vai. Ô nhập
  đã gỡ, nên nếu nó quay lại thì đây là chỗ báo.

  Số thẻ ĐẾM TỪ DANH SÁCH TÀI KHOẢN, không viết cứng. Viết cứng thì mỗi lần
  thêm một phòng là chốt kiểm đỏ ở một chỗ không liên quan gì tới cái vừa
  thêm, và người sửa sẽ sửa con số cho hết đỏ thay vì đọc xem nó canh gì.
  Thứ cần canh là: bản `/quan-ly/` KHÔNG có tài khoản Dashboard NSNN.
*/
/*
  The Same Spine Rule và The One Uppercase Tier Rule (DESIGN.md) đều là luật
  dễ trôi ngược: thêm một dải mục trên trang hay một nhãn viết hoa bao giờ
  cũng là đường ngắn nhất. Nên cả hai có chốt kiểm, không chỉ có đoạn văn.
*/
const manDangNhap = await page.evaluate(() => ({
  soThe: document.querySelectorAll(".demo-accounts-list button").length,
  conOnhap: Boolean(document.querySelector('input[name="username"], input[name="password"]')),
  coKeycloak: Boolean(document.querySelector(".login-sso")),
}));
/*
  Kiểm theo DANH SÁCH MÃ tài khoản, không theo số lượng.

  Một con số viết cứng chỉ nói "có đúng n thẻ", nên thêm một phòng là nó đỏ ở
  chỗ không liên quan và người sửa chỉ việc tăng số cho hết đỏ. Thứ thật sự
  cần canh là hai điều: mọi vai nghiệp vụ đều vào được, và bản `/quan-ly/`
  KHÔNG có tài khoản Dashboard NSNN (mục S1 — ẩn hẳn, không làm mờ).
*/
const VAI_NGHIEP_VU = ["cv.ql1", "tp.ql1", "cv.ql2", "tp.ql2", "cv.ql3", "tp.ql3", "cv.ql4", "tp.ql4", "vanhanh.dulieu"];
const maThe = await page.$$eval(".demo-accounts-list code", (ds) => ds.map((d) => d.textContent.trim()));
const thieu = VAI_NGHIEP_VU.filter((m) => !maThe.includes(m));
if (thieu.length) throw new Error(`Màn đăng nhập thiếu vai: ${JSON.stringify(thieu)} — đang có ${JSON.stringify(maThe)}`);
const chiQuanLy = new URL(page.url()).pathname.endsWith("/quan-ly/");
if (chiQuanLy && maThe.includes("lanhdao.nhanuoc")) throw new Error("Bản /quan-ly/ không được có tài khoản Dashboard NSNN.");
if (!chiQuanLy && !maThe.includes("lanhdao.nhanuoc")) throw new Error("Bản đầy đủ thiếu tài khoản Dashboard NSNN.");
if (manDangNhap.conOnhap) throw new Error("Màn đăng nhập vẫn còn ô tài khoản hoặc mật khẩu.");
if (!manDangNhap.coKeycloak) throw new Error("Màn đăng nhập thiếu lối Keycloak.");

/* Hai cột là luật của khổ RỘNG; dưới 560px lưới tự về một cột vì hai thẻ cạnh
   nhau lúc đó không đủ chỗ cho tên phòng. Nên đo ở 1440, không đo ở 390. */
await page.setViewport({ width: 1440, height: 900 });
const haiCot = await page.evaluate(() => {
  const n = [...document.querySelectorAll(".demo-accounts-list button")];
  if (n.length < 2) return false;
  const a = n[0].getBoundingClientRect(), b = n[1].getBoundingClientRect();
  return Math.abs(a.top - b.top) < 2 && b.left > a.left;
});
if (!haiCot) throw new Error("Thẻ vai không xếp thành hai cột ở khổ rộng.");
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.screenshot({ path: ".impeccable/review/login-demo-accounts.png", fullPage: true });

/* Bấm thẳng vào một thẻ là vào luôn, không qua bước nào nữa. */
await page.evaluate(() => document.querySelector(".demo-accounts-list button").click());
await page.waitForSelector(".workspace", { timeout: 5000 });
await page.evaluate(() => {
  const nut = document.querySelector(".logout-button");
  if (nut && nut.offsetParent !== null) nut.click();
  else document.querySelector(".menu-button")?.click();
});
await page.waitForSelector(".mobile-drawer .logout-button, .login-page");
if (await page.$(".login-page") === null) {
  await page.click(".mobile-drawer .logout-button");
  await page.waitForSelector(".login-page");
}
await dangNhap(page, "cv.ql1");
await page.waitForSelector(".workspace");
await page.reload({ waitUntil: "networkidle0" });
if (await page.$(".workspace") === null) throw new Error("Phiên đăng nhập demo không được khôi phục sau reload.");

async function soatChuHoa(nhan) {
  /* Đếm phần tử có chữ ĐANG HIỆN và `text-transform: uppercase`. Không bậc
     nào được phép nữa — The No Uppercase Tier Rule. */
  const pham = await page.evaluate(() => [...document.querySelectorAll("body *")]
    .filter((el) => {
      if (!(el.textContent ?? "").trim()) return false;
      const k = getComputedStyle(el);
      return k.textTransform === "uppercase" && k.display !== "none" && k.visibility !== "hidden";
    })
    .map((el) => `${el.tagName.toLowerCase()}.${el.className}`)
    .filter((x, i, a) => a.indexOf(x) === i)
    .slice(0, 5));
  if (pham.length) throw new Error(`${nhan}: còn bậc viết hoa — ${JSON.stringify(pham)}`);
}

async function soatTrucDoc(nhan) {
  /* Thứ tự dọc của phân hệ, và mục phải nằm trong THANH BÊN. */
  const d = await page.evaluate(() => {
    const than = document.querySelector(".page-stack");
    const thu = (sel) => {
      const el = document.querySelector(sel);
      return el ? [...(than?.children ?? [])].findIndex((c) => c === el || c.contains(el)) : -1;
    };
    return {
      duyet: thu(".thanh-duyet"),
      loc: thu(".bo-loc-chung"),
      mucTrenTrang: Boolean(document.querySelector('.page-stack [aria-label^="Mục "]')),
      mucTrongBen: Boolean(document.querySelector('.sidebar [aria-label^="Mục "]')),
    };
  });
  if (d.mucTrenTrang) throw new Error(`${nhan}: cụm mục của phân hệ đang nằm trên trang, đáng lẽ trong thanh bên.`);
  if (!d.mucTrongBen) throw new Error(`${nhan}: không thấy cụm mục trong thanh bên.`);
  if (d.duyet !== -1 && d.loc !== -1 && d.duyet > d.loc) {
    throw new Error(`${nhan}: thanh duyệt đứng SAU thanh lọc — xem The Same Spine Rule.`);
  }
}

async function inspect(width, height, mobile, views) {
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile });
  for (const view of views) {
    await page.goto(`${base}/?view=${view}`, { waitUntil: "networkidle0" });
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
    });
    /* Một màn rơi về Trang công việc vẫn có h1 hợp lệ, nên chỉ kiểm "có tiêu
       đề" là không đủ: phải kiểm đúng màn đã yêu cầu thật sự mở ra. */
    const dungMan = await page.evaluate(() => new URLSearchParams(location.search).get("view"));
    const navActive = await page.$eval(".nav-item.is-active span, .mobile-nav button.is-active span", (el) => el.textContent).catch(() => null);
    if (!navActive) throw new Error(`${mobile ? "mobile" : "desktop"}/${view}: không xác định được mục điều hướng đang mở.`);
    if (dungMan !== view) throw new Error(`${mobile ? "mobile" : "desktop"}/${view}: URL không giữ được view.`);
    /*
      The No-Overlay Rule (DESIGN.md). Không `<dialog>`, không tấm màn phủ
      toàn trang. Luật này dễ trôi ngược — thêm một hộp thoại bao giờ cũng là
      đường ngắn nhất — nên nó phải có chốt kiểm, không chỉ có một đoạn văn.

      BA ngoại lệ đã ghi trong DESIGN.md: toast, drawer điều hướng ở khổ điện
      thoại, và ngăn trượt chi tiết một bản ghi (chốt 07/10/2026). Phép kiểm
      này chạy lúc màn vừa mở, khi chưa ai bấm vào dòng nào — nên ngăn trượt
      chưa dựng, và `<dialog>` xuất hiện ở đây vẫn là lỗi.
    */
    const phu = await page.evaluate(() => {
      if (document.querySelector("dialog")) return "<dialog>";
      const mien = [...document.querySelectorAll("body *")].find((el) => {
        if (el.closest(".mobile-nav, .nav-scrim, .nav-drawer, .toast-stack, .skip-link")) return false;
        const k = getComputedStyle(el);
        if (k.position !== "fixed" || k.display === "none" || k.visibility === "hidden") return false;
        const r = el.getBoundingClientRect();
        return r.width >= innerWidth * .9 && r.height >= innerHeight * .9;
      });
      return mien ? `${mien.tagName.toLowerCase()}.${mien.className}` : null;
    });
    if (phu) throw new Error(`${mobile ? "mobile" : "desktop"}/${view}: còn lớp phủ ${phu} — xem The No-Overlay Rule.`);
    /*
      KHÔNG còn hàng nút lẻ ở đầu trang — The No Masthead Rule.

      Măng sét bỏ rồi, nút cấp trang rơi xuống thành một nút đứng một mình
      trên một hàng trắng ngay đầu nội dung. Người dùng chỉ đúng chỗ ấy và
      bảo nó phải nằm trong đầu khối. Lỗi này tái phát rất dễ: thêm `actions`
      vào `PageIntro` là một dòng.
    */
    /*
      Nút xuất CẢ BỘ báo cáo chỉ được nằm TRONG khối xem báo cáo.

      Phạm vi mã hóa bằng vị trí: cả bộ ở khối xem trước · một bảng ở đầu khối
      của bảng ấy · danh sách đang lọc ở chân khối ấy. Bản trước đặt nút cả bộ
      vào đầu khối chính, nên ở màn KPI nó đứng cạnh "Lưu KPI đã nhập" — hai
      nút cùng hàng mà khác phạm vi.
    */
    const xuatLacCho = await page.evaluate(() => [...document.querySelectorAll("button")]
      .filter((b) => /^Xuất (Excel|Word)$/.test(b.textContent.trim()) && !b.closest(".xem-truoc"))
      .map((b) => b.textContent.trim()));
    if (xuatLacCho.length) throw new Error(`${mobile ? "mobile" : "desktop"}/${view}: nút ${JSON.stringify(xuatLacCho)} nằm ngoài khối xem báo cáo.`);

    const hangNutLe = await page.evaluate(() => document.querySelectorAll(".page-actions").length);
    if (hangNutLe) throw new Error(`${mobile ? "mobile" : "desktop"}/${view}: còn ${hangNutLe} hàng nút lẻ ở đầu trang — nút cấp báo cáo phải nằm trong đầu khối chính.`);
    await soatChuHoa(`${mobile ? "mobile" : "desktop"}/${view}`);
    if (["debt", "risk", "hoadon", "hoan"].includes(view)) await soatTrucDoc(`${mobile ? "mobile" : "desktop"}/${view}`);
    const result = await page.evaluate((isMobile) => {
      const doc = document.documentElement;
      const tran = doc.scrollWidth > doc.clientWidth + 1;
      const nho = [...document.querySelectorAll("main button, main a[href], main summary, main input, main select")]
        .map((el) => el.getBoundingClientRect())
        .filter((box) => box.width > 0 && box.height > 0 && box.height < (isMobile ? 36 : 28)).length;
      return { tran, nho, tieuDe: document.querySelector("main h1")?.textContent?.trim() ?? null };
    }, mobile);
    if (result.tran) throw new Error(`${mobile ? "mobile" : "desktop"}/${view}: trang tràn ngang.`);
    if (result.nho) throw new Error(`${mobile ? "mobile" : "desktop"}/${view}: ${result.nho} vùng chạm thấp hơn ngưỡng.`);
    if (!result.tieuDe) throw new Error(`${mobile ? "mobile" : "desktop"}/${view}: thiếu tiêu đề màn.`);
    await page.screenshot({ path: `.impeccable/review/${view}-${mobile ? "mobile" : "desktop"}.png` });
  }
}

/* Màn của phòng khác phải bị chặn HẲN: mục S1 ghi "ẩn hẳn menu, không chỉ làm
   mờ", nên vừa không có trong điều hướng, vừa không mở được bằng deep link. */
async function chanCheoPhong(view, nhan) {
  await page.goto(`${base}/?view=${view}`, { waitUntil: "networkidle0" });
  const ket = await page.evaluate((nhanMan) => ({
    trongNav: [...document.querySelectorAll(".nav-item span, .mobile-nav button span")].some((el) => el.textContent?.trim() === nhanMan),
    tieuDe: document.querySelector("main h1")?.textContent?.trim() ?? null,
  }), nhan);
  if (ket.trongNav) throw new Error(`${view}: màn của phòng khác vẫn hiện trong điều hướng.`);
  if (ket.tieuDe === nhan) throw new Error(`${view}: deep link mở được màn của phòng khác.`);
}

/*
  Khối chi tiết mở theo hàng, dạng TRONG LUỒNG — The No-Overlay Rule.

  Phép kiểm chạy trên mục "Danh sách phiếu" của QL4: bấm ô Mô tả mở khối chi
  tiết ngay dưới bảng, không phủ lên nó.

  Nhật ký thu thập (Tình trạng dữ liệu) KHÔNG nằm ở đây nữa: nó đang dùng
  `CaseLayout presentation="drawer"`, tức một `<dialog showModal()>` có khoá
  cuộn trang — thứ The No-Overlay Rule trong DESIGN.md cấm. Thay đổi ấy không
  do chốt kiểm này sinh ra và cũng chưa được quyết, nên nó được NÊU TÊN ở đây
  thay vì bị một phép kiểm lỏng tay cho qua.
*/
await inspect(1440, 1000, false, MAN_QL1);
{
  /* Mục này thuộc QL4 nên phải đổi tài khoản; đổi lại ngay sau đó để phần
     còn lại của chốt kiểm chạy tiếp trên QL1 như cũ. */
  await dangXuat(page);
  await dangNhap(page, "cv.ql4");
  await page.goto(`${base}/?view=hoan&muc=dsphieu`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".ql1-ds-table .o-mota");
  if (await page.$(".case-detail") !== null) throw new Error("Danh sách phiếu: khối chi tiết hiện sẵn khi chưa ai bấm hàng nào.");

  await page.$eval(".ql1-ds-table tbody tr:nth-child(2) .o-mota", (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.click(".ql1-ds-table tbody tr:nth-child(2) .o-mota");
  await page.waitForSelector(".case-detail", { timeout: 5000 });

  const chiTiet = await page.evaluate(() => {
    const ct = document.querySelector(".case-detail").getBoundingClientRect();
    /* Đo VÙNG CUỘN chứ không đo thẻ `<table>`: bảng dài hơn vùng chứa nó,
       nên hộp của chính thẻ bảng thò xuống dưới khối chi tiết và phép so sẽ
       báo chồng ở chỗ mắt không thấy chồng. */
    const bang = document.querySelector(".ql1-ds-table").closest(".table-wrap").getBoundingClientRect();
    return {
      coTieuDe: Boolean(document.querySelector(".case-detail .panel-head h2")),
      chong: ct.top < bang.bottom - 1,
    };
  });
  if (!chiTiet.coTieuDe) throw new Error("Khối chi tiết của Danh sách phiếu không có tiêu đề.");
  if (chiTiet.chong) throw new Error("Khối chi tiết phủ lên bảng — xem The No-Overlay Rule.");

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector(".case-detail"), { timeout: 5000 });

  await dangXuat(page);
  await dangNhap(page, "cv.ql1");
}

/* ---- Màn báo cáo nợ QL1: bảy mục, hai tầng tiêu đề, lọc theo kỳ ---- */
const moMuc = async (chu) => {
  const duoc = await page.evaluate((c) => {
    const nut = [...document.querySelectorAll('[aria-label^="Mục "] button')]
      .find((b) => b.textContent?.includes(c));
    if (!nut) return false;
    nut.click();
    return true;
  }, chu);
  if (!duoc) throw new Error(`Không tìm thấy mục "${chu}".`);
  await new Promise((r) => setTimeout(r, 180));
};

await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });

/* Màn mở ở tab Tổng quan, đúng §4.3: trưởng phòng nhìn một màn là biết nợ
   tăng hay giảm. Bảng chi tiết nằm ở các mục sau. */
const tongQuan = await page.evaluate(() => ({
  soThe: document.querySelectorAll(".the-so").length,
  coXepHang: document.querySelectorAll(".xep-hang li").length,
  coBang: Boolean(document.querySelector(".ql1-table")),
}));
if (tongQuan.soThe < 4) throw new Error(`Tab Tổng quan QL1 chỉ có ${tongQuan.soThe} thẻ số.`);
if (!tongQuan.coXepHang) throw new Error("Tab Tổng quan QL1 thiếu khối xếp hạng đơn vị.");
if (tongQuan.coBang) throw new Error("Tab Tổng quan QL1 không nên dựng bảng tổng hợp theo đơn vị.");

/* Hai tab chỉ có ở bản này: tham số ngưỡng và nguồn dữ liệu. */
await moMuc("Quy tắc và nguồn");
const quyTac = await page.evaluate(() => ({
  soDong: document.querySelectorAll(".rules-table tbody tr").length,
  loDuongDan: /[A-Z]:\\/.test(document.body.textContent || ""),
}));
if (quyTac.soDong < 4) throw new Error(`Tab Quy tắc & nguồn chỉ có ${quyTac.soDong} dòng.`);
if (quyTac.loDuongDan) throw new Error("Màn hình để lộ đường dẫn thư mục máy cá nhân — mục S4 cấm.");

await moMuc("Dữ liệu gốc");
const nguon = await page.evaluate(() => ({
  soNguon: document.querySelectorAll(".nguon-table tbody tr").length,
  coCanhBao: document.querySelectorAll(".notice.warning, .notice.critical").length,
  loDuongDan: /[A-Z]:\\/.test(document.body.textContent || ""),
}));
if (nguon.soNguon < 4) throw new Error(`Tab Dữ liệu gốc chỉ liệt kê ${nguon.soNguon} nguồn.`);
if (!nguon.coCanhBao) throw new Error("Tab Dữ liệu gốc không cảnh báo lệch ngày chốt hoặc lệch số dòng.");
if (nguon.loDuongDan) throw new Error("Tab Dữ liệu gốc để lộ đường dẫn thư mục máy cá nhân.");

await moMuc("So sánh nợ");
await page.waitForSelector(".ql1-table");
const ql1 = await page.evaluate(() => {
  const dong = [...document.querySelectorAll(".ql1-table thead tr")];
  const goc = document.querySelector(".ql1-table th.dv-cot");
  return {
    soTab: document.querySelectorAll('[aria-label="Mục của báo cáo nợ"] button, [aria-label="Mục của báo cáo nợ"] option').length,
    soDongDau: dong.length,
    coNhomCot: document.querySelectorAll(".ql1-table th.nhom").length,
    gocDinh: goc ? getComputedStyle(goc).position === "sticky" : false,
    coTong: [...document.querySelectorAll(".ql1-table tbody th")].some((el) => el.textContent?.trim() === "Tổng cộng"),
    coKhoi: [...document.querySelectorAll(".ql1-table tbody th")].some((el) => el.textContent?.includes("Khối Thuế cơ sở")),
    coChonKy: Boolean(document.querySelector(".bo-loc-select")),
    soDongDs: document.querySelectorAll(".ql1-ds-table tbody tr").length,
  };
});
if (ql1.soTab !== 7) throw new Error(`Màn QL1 có ${ql1.soTab} mục, đáng lẽ 7.`);
if (ql1.soDongDau !== 2 || !ql1.coNhomCot) throw new Error(`Bảng tổng hợp QL1 chưa có hai tầng tiêu đề: ${JSON.stringify(ql1)}`);
if (!ql1.gocDinh) throw new Error("Cột đơn vị của bảng tổng hợp QL1 không cố định khi cuộn ngang.");
if (!ql1.coTong || !ql1.coKhoi) throw new Error(`Bảng tổng hợp QL1 thiếu dòng tổng hoặc dòng khối: ${JSON.stringify(ql1)}`);
if (!ql1.coChonKy) throw new Error("Thanh lọc chung chưa có ô chọn kỳ.");
if (ql1.soDongDs !== 10) throw new Error(`Danh sách chi tiết QL1 hiện ${ql1.soDongDs} dòng, đáng lẽ 10 dòng một trang.`);

/*
  Tổng toàn ngành phải BẰNG tổng hai khối. Đây là chỗ bảng nhiều tầng hay sai
  nhất: dòng tổng sinh riêng một đường rồi lệch dần so với các dòng bên dưới.
*/
const congKhop = await page.evaluate(() => {
  const so = (tr) => [...tr.querySelectorAll("td")].map((td) => Number((td.textContent || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) || 0);
  const hang = [...document.querySelectorAll(".ql1-table tbody tr")];
  const tong = hang.find((r) => r.classList.contains("is-tong"));
  const khoi = hang.filter((r) => r.classList.contains("is-khoi"));
  if (!tong || khoi.length !== 2) return { ok: false, vi: "thiếu dòng tổng hoặc dòng khối" };
  const t = so(tong), a = so(khoi[0]), b = so(khoi[1]);
  /* Chỉ đối chiếu bốn cột tiền đầu; cột tăng giảm và cột tỷ lệ không cộng được. */
  for (let i = 0; i < 4; i++) {
    if (Math.abs(t[i] - (a[i] + b[i])) > 0.5) return { ok: false, vi: `cột ${i}: ${t[i]} ≠ ${a[i]} + ${b[i]}` };
  }
  return { ok: true };
});
if (!congKhop.ok) throw new Error(`Dòng tổng của bảng QL1 không khớp tổng hai khối — ${congKhop.vi}`);

/*
  Hai control của mục Tình hình nợ: mốc so sánh và dạng số. Mẫu Excel có 28
  cột vì nó dựng cả ba mốc; màn hình dựng một mốc nên hai control này PHẢI
  đổi được số, nếu không bảng chỉ còn một phần tư nội dung mẫu mà không có
  đường nào xem phần còn lại.
*/
const docCotTangGiam = () => page.$$eval(".ql1-table tbody tr.is-tong td", (td) => td.slice(-4).map((x) => x.textContent?.trim()));
const mocTuanTruoc = await docCotTangGiam();
await page.select(".panel-actions select", "dauNam");
await new Promise((resolve) => setTimeout(resolve, 150));
const mocDauNam = await docCotTangGiam();
if (JSON.stringify(mocTuanTruoc) === JSON.stringify(mocDauNam)) throw new Error("Đổi mốc so sánh không đổi cột tăng giảm.");
await page.evaluate(() => [...document.querySelectorAll('[aria-label="Cách hiện số tăng giảm"] button')].find((b) => b.textContent?.trim() === "Phần trăm")?.click());
await new Promise((resolve) => setTimeout(resolve, 150));
const dangRel = await docCotTangGiam();
if (!dangRel.some((x) => x?.includes("%"))) throw new Error(`Chuyển sang số tương đối mà cột không hiện %: ${JSON.stringify(dangRel)}`);
await page.evaluate(() => [...document.querySelectorAll('[aria-label="Cách hiện số tăng giảm"] button')].find((b) => b.textContent?.trim() === "Số tiền")?.click());

/* G3: bấm tên một đơn vị lọc cả màn về đơn vị đó, và dùng CHUNG trạng thái với
   thanh lọc đầu trang chứ không sinh một bộ lọc thứ hai chạy song song. */
const truocLoc = await page.$$eval(".ql1-table tbody tr", (r) => r.length);
await page.$eval(".ql1-table tbody .dv-nut", (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
const tenDonVi = await page.$eval(".ql1-table tbody .dv-nut span", (el) => el.textContent.trim());
await page.click(".ql1-table tbody .dv-nut");
await new Promise((resolve) => setTimeout(resolve, 150));
const sauLoc = await page.evaluate(() => ({
  soHang: document.querySelectorAll(".ql1-table tbody tr").length,
  nhanLoc: document.querySelector(".bo-loc-nut span")?.textContent?.trim() ?? null,
}));
if (sauLoc.soHang >= truocLoc) throw new Error("Bấm một đơn vị trên bảng tổng hợp không thu hẹp được bảng.");
if (sauLoc.nhanLoc !== tenDonVi) throw new Error(`Bấm đơn vị không cập nhật thanh lọc chung: "${sauLoc.nhanLoc}" ≠ "${tenDonVi}".`);
/* Lựa chọn phải theo sang mục khác — G1: đổi tab không mất lựa chọn. */
await page.evaluate(() => [...document.querySelectorAll('[aria-label^="Mục "] button')].find((b) => b.textContent?.includes("Kết quả cưỡng chế"))?.click());
await new Promise((resolve) => setTimeout(resolve, 150));
const giuQuaTab = await page.$eval(".bo-loc-nut span", (el) => el.textContent.trim());
if (giuQuaTab !== tenDonVi) throw new Error(`Đổi mục làm mất lựa chọn đơn vị: "${giuQuaTab}" ≠ "${tenDonVi}".`);
await page.evaluate(() => [...document.querySelectorAll(".bo-loc-chung button")].find((b) => b.textContent?.trim() === "Đặt lại")?.click());

/*
  Bốn mục của QL1 phải mở đầu danh sách chi tiết bằng CÙNG một bộ cột, cùng
  thứ tự. Ba sheet Excel gốc tự chúng xếp khác nhau — sheet cưỡng chế để
  "Phòng/TCS" ở cột 5, sheet trạng thái 06 để nó ở cột 10 — nên bê nguyên lên
  màn là người dùng đổi mục phải dò lại từ đầu xem cột đơn vị nằm đâu.
*/
await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
const DAU_CHUNG = ["MST", "Tên NNT", "Phòng / Thuế cơ sở", "Mã CQT", "Loại NNT"];
const dauCotCua = async (chu) => {
  await moMuc(chu);
  await page.waitForSelector(".ql1-ds-table");
  return page.$$eval(".ql1-ds-table thead th", (th) => th.map((x) => x.textContent.trim()));
};
for (const chu of ["So sánh nợ", "Kết quả cưỡng chế", "Tạm hoãn xuất cảnh", "trạng thái 06"]) {
  const cot = await dauCotCua(chu);
  const dau = cot.slice(0, DAU_CHUNG.length);
  if (JSON.stringify(dau) !== JSON.stringify(DAU_CHUNG)) {
    throw new Error(`Mục "${chu}" mở đầu bằng ${JSON.stringify(dau)}, đáng lẽ ${JSON.stringify(DAU_CHUNG)}`);
  }
  /* Hai cột chữ tự do, khi có, phải ở CUỐI cùng — chúng dài và không căn thẳng
     được, để giữa bảng là chen vào giữa các cột số. */
  const iKetLuan = cot.indexOf("Kết luận");
  if (iKetLuan !== -1 && (cot[iKetLuan + 1] !== "Ghi chú" || iKetLuan + 2 !== cot.length)) {
    throw new Error(`Mục "${chu}": Kết luận và Ghi chú phải là hai cột cuối, hiện ${JSON.stringify(cot.slice(iKetLuan))}`);
  }
}
await moMuc("So sánh nợ");

await chanCheoPhong("risk", "Kiểm tra tại bàn");
await chanCheoPhong("giamsat", "Giám sát dữ liệu");

/*
  Bốn màn đã gỡ theo §1.2 bản thiết kế. Deep link cũ phải rơi về màn mặc định,
  không được dựng lại màn cũ và cũng không được ra trang trắng.
*/
for (const cu of ["reports", "runs", "batches", "mapping", "rules", "refund"]) {
  await page.goto(`${base}/?view=${cu}`, { waitUntil: "networkidle0" });
  const con = await page.evaluate(() => ({
    coShell: Boolean(document.querySelector(".workspace")),
    trongNav: [...document.querySelectorAll(".nav-item span, .mobile-nav button span")].map((e) => e.textContent?.trim()),
  }));
  if (!con.coShell) throw new Error(`Đường dẫn cũ ?view=${cu} làm hỏng màn.`);
  if (con.trongNav.some((x) => ["Báo cáo", "Lượt chạy dữ liệu", "Lô dữ liệu", "Ánh xạ quản lý", "Quy tắc nghiệp vụ"].includes(x))) {
    throw new Error(`Điều hướng vẫn còn màn đã gỡ: ${JSON.stringify(con.trongNav)}`);
  }
}

/* Măng sét không còn nút cấp hệ thống nào; tải tay chỉ hiện ở Tình trạng dữ liệu. */
await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
if (await page.$("#global-create-report") !== null) throw new Error("Măng sét vẫn còn nút Tạo báo cáo.");
/* Măng sét đã bỏ; nút "Tải tay" nay phải không có mặt ở BẤT KỲ đâu trên màn
   phân hệ, nên phép kiểm quét cả trang thay vì chỉ quét một khung. */
const taiTayOPhanHe = await page.evaluate(() => [...document.querySelectorAll("button")].some((b) => /Tải tay|Nhập dữ liệu/.test(b.textContent || "")));
if (taiTayOPhanHe) throw new Error("Nút tải tay không được đứng ở măng sét — G12 ghi nó chỉ hiện khi nguồn thiếu.");
await page.goto(`${base}/?view=tinhtrang`, { waitUntil: "networkidle0" });
/*
  Màn Tình trạng dữ liệu có cụm mục trong THANH BÊN và mở đầu bằng "Tổng
  quan", đúng khuôn của bốn phân hệ — The Same Spine Rule. Nó cũng phải trả
  lời đủ câu hỏi dòng 48 bản thiết kế đòi: nguồn nào thiếu, và số dòng nguồn
  so với số dòng vào kho.
*/
const tinhTrang = await page.evaluate(() => ({
  conCum: document.querySelectorAll('.sidebar [aria-label="Mục của tình trạng dữ liệu"] button').length,
  tieuDe: [...document.querySelectorAll(".panel-head h2")].map((h) => h.textContent?.trim()),
  coBangNguon: [...document.querySelectorAll(".ql1-ds-table thead th")].some((th) => /File đã nhận/.test(th.textContent || "")),
  coCotLech: [...document.querySelectorAll(".case-list thead th")].some((th) => /Dòng vào kho/.test(th.textContent || "")),
  coTaiTay: [...document.querySelectorAll("button")].some((b) => /Tải tệp bổ sung/.test(b.textContent || "")),
}));
/* MỘT màn, không tab con: §1.2 gọi tên đúng một màn và không tài liệu nào
   liệt kê tab con cho nó. */
if (tinhTrang.conCum) throw new Error(`Màn Tình trạng dữ liệu lại mọc ${tinhTrang.conCum} tab con — tài liệu không có tab con cho màn này.`);
if (!tinhTrang.tieuDe.includes("Tổng quan")) throw new Error(`Màn Tình trạng dữ liệu thiếu khối "Tổng quan": ${JSON.stringify(tinhTrang.tieuDe)}`);
if (!tinhTrang.coBangNguon) throw new Error("Màn Tình trạng dữ liệu thiếu bảng nguồn dữ liệu của kỳ.");
if (!tinhTrang.coCotLech) throw new Error("Màn Tình trạng dữ liệu thiếu cột đối chiếu số dòng nguồn với số dòng vào kho.");
if (!tinhTrang.coTaiTay) throw new Error("Màn Tình trạng dữ liệu thiếu nút tải tay dự phòng dù đang có nguồn thiếu.");

await page.goto(`${base}/?view=workbench`, { waitUntil: "networkidle0" });
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, 0); });
await page.screenshot({ path: ".impeccable/review/desktop.png", fullPage: true });
await inspect(390, 844, true, MAN_QL1);
for (const view of ["hoan&muc=dsphieu"]) {
  await dangXuat(page);
  await dangNhap(page, "cv.ql4");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${base}/?view=${view}`, { waitUntil: "networkidle0" });
  await page.$eval(".ql1-ds-table tbody tr:nth-child(2) .o-mota", (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.click(".ql1-ds-table tbody tr:nth-child(2) .o-mota");
  await page.waitForSelector(".case-detail");
  await new Promise((resolve) => setTimeout(resolve, 220));
  await page.screenshot({ path: `.impeccable/review/chitiet-mobile.png` });
  await page.keyboard.press("Escape");
  /* Khối bị gỡ khỏi cây rồi focus mới được trả về, qua một `requestAnimationFrame`
     — nên phải chờ React dựng lại xong mới đo được con trỏ đang ở đâu. */
  await page.waitForFunction(() => !document.querySelector(".case-detail"), { timeout: 5000 });
  await new Promise((resolve) => setTimeout(resolve, 120));
  const restored = await page.evaluate(() => !document.querySelector(".case-detail") && document.activeElement?.matches(".ql1-ds-table tbody tr:nth-child(2) .o-mota"));
  if (!restored) throw new Error(`${view}: đóng chi tiết chưa trả focus về ô vừa bấm.`);
  await dangXuat(page);
  await dangNhap(page, "cv.ql1");
}

/*
  Ma trận quyền §3: trưởng phòng KHÔNG chỉ khác chuyên viên ở chỗ duyệt thay
  vì gửi. Hai dòng dưới đây có thể đo được và từng sai cả hai.
*/
{
  for (const [ma, manDau] of [["tp.ql1", "debt"], ["tp.ql2", "hoadon"], ["tp.ql3", "risk"], ["tp.ql4", "hoan"], ["cv.ql4", "hoan"]]) {
    await dangXuat(page);
    await dangNhap(page, ma);
    const dau = await page.evaluate(() => new URLSearchParams(location.search).get("view"));
    if (dau !== manDau) throw new Error(`${ma} đăng nhập xong vào "${dau}", đáng lẽ "${manDau}" — §3 ghi trang mặc định theo vai.`);
  }
  /* Giao phiếu rà soát: "● (PRS-03) | ✗" — chuyên viên giao, trưởng phòng không. */
  for (const [ma, url, mongDoi] of [["cv.ql2", "hoadon&muc=dschenh", true], ["tp.ql2", "hoadon&muc=dschenh", false], ["cv.ql4", "hoan&muc=venh", true], ["tp.ql4", "hoan&muc=venh", false]]) {
    await dangXuat(page);
    await dangNhap(page, ma);
    await page.goto(`${base}/?view=${url}`, { waitUntil: "networkidle0" });
    const co = await page.evaluate(() => [...document.querySelectorAll("button")].some((b) => /Giao phiếu/.test(b.textContent || "")));
    if (co !== mongDoi) throw new Error(`${ma} ${co ? "thấy" : "không thấy"} nút Giao phiếu, đáng lẽ ${mongDoi ? "thấy" : "không"}.`);
  }
  await dangXuat(page);
  await dangNhap(page, "cv.ql1");
}

/*
  Nhập kết quả phiếu rà soát — §6 `design_ql2ql4`, nhánh "QL2 tự tổng hợp"
  của Q-96. Vai "Cán bộ đơn vị" [R] đã gỡ, nên ba điều phải đúng là:

  • Không còn vai nào ngoài CV / TP / Vận hành / Lãnh đạo. Màn `?view=phieu`
    phải không dựng được nữa, kể cả khi dán tay địa chỉ cũ.
  • Khối nhập thuộc CHUYÊN VIÊN của phòng giao phiếu, cùng quyền với "Giao
    phiếu" (§3: "Giao phiếu rà soát cho đơn vị | ● | ✗") — trưởng phòng không
    thấy, vì §3 ghi "Điền phiếu rà soát | ✗ | ✗ | ✗ | ✗ | ●".
  • Phép kiểm bắt buộc của §6 vẫn chặn: PRS-03 chọn "Đã điều chỉnh" mà không
    nhập số thuế thì không ghi được.
*/
{
  await dangXuat(page);
  await dangNhap(page, "tp.ql2");
  await page.goto(`${base}/?view=hoadon&muc=dschenh`, { waitUntil: "networkidle0" });
  if (await page.$(".phieu-dien")) throw new Error("Trưởng phòng QL2 thấy khối nhập kết quả phiếu, đáng lẽ không (§3 điền phiếu ✗).");

  await dangXuat(page);
  await dangNhap(page, "cv.ql2");
  /* Địa chỉ của vai đã gỡ phải rơi về màn mặc định, không dựng màn trắng. */
  await page.goto(`${base}/?view=phieu`, { waitUntil: "networkidle0" });
  if (await page.$(".phieu-bang")) throw new Error("Địa chỉ ?view=phieu của vai đã gỡ vẫn dựng được màn phiếu.");

  await page.goto(`${base}/?view=hoadon&muc=dschenh`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".phieu-bang tbody tr");
  /* Cột Đơn vị là cột bắt buộc: người gõ không phải người trả lời (G17). */
  const cot = await page.$eval(".phieu-bang thead tr", (tr) => [...tr.children].map((th) => th.textContent.trim()));
  if (!cot.includes("Đơn vị")) throw new Error(`Bảng nhập kết quả thiếu cột Đơn vị: ${JSON.stringify(cot)}`);

  /* Phép kiểm §6: chọn một dòng, chọn "Đã điều chỉnh", bỏ trống số thuế. */
  await page.evaluate(() => document.querySelector(".phieu-bang tbody .o-chon input").click());
  await page.select(".phieu-dien-o select + select, .phieu-dien-o label:nth-of-type(2) select", "Đã điều chỉnh");
  await page.evaluate(() => [...document.querySelectorAll(".phieu-dien button")].find((b) => /Điền cho dòng/.test(b.textContent || "")).click());
  const chan = await page.evaluate(() => document.querySelector(".phieu-dien .quality-note")?.textContent ?? "");
  if (!/số thuế/i.test(chan)) throw new Error(`PRS-03 cho ghi "Đã điều chỉnh" mà không có số thuế: ${JSON.stringify(chan)}`);

  await dangXuat(page);
  await dangNhap(page, "cv.ql1");
}

/* ---- Luồng duyệt ba bước (G10), chạy NGAY TRÊN phân hệ ---- */
/*
  Không còn màn "Báo cáo" riêng: mục 3 bản thiết kế vẽ luồng duyệt trên chính
  phân hệ của kỳ đang xem. Cổng kiểm vì thế đi đúng đường người dùng đi — mở
  phân hệ, đọc thanh duyệt, bấm nút ở đó.
*/
const trangThaiDuyet = () => page.$eval(".thanh-duyet .badge", (el) => el.textContent.trim());
const nutDuyet = () => page.$$eval(".duyet-hanh-dong button", (b) => b.map((x) => x.textContent.trim()));

/*
  Hai cú chốt — Gửi duyệt và Duyệt — PHẢI đi qua ô xác nhận.

  Trước đây chúng chốt thẳng từ `onClick`: một cú bấm là kỳ khóa số, không
  tóm tắt, không hoàn tác — trong khi Trả lại, việc gỡ lại được, bắt gõ tới
  200 ký tự. Độ khó đang ngược với hệ quả, và duyệt là việc DUY NHẤT trong
  sản phẩm người dùng không tự gỡ (QR-03 bắt mở bản điều chỉnh kèm lý do).

  Trợ thủ này vừa là đường đi của mọi phép kiểm sau, vừa là chính phép kiểm:
  nếu một ngày nào đó nút chốt thẳng trở lại, `waitForSelector` ở đây đỏ.
*/
const chot = async (nhan) => {
  await page.evaluate((n) => [...document.querySelectorAll(".duyet-hanh-dong button")].find((b) => b.textContent.trim() === n).click(), nhan);
  await page.waitForSelector(".duyet-lydo .duyet-tomtat", { timeout: 5000 });
  /* Ô xác nhận phải NÓI đang chốt cái gì. Một ô chỉ hỏi "chắc chưa" mà không
     tóm tắt thì chỉ là một cú bấm thừa, không phải một bước bảo vệ. */
  const tt = await page.evaluate(() => ({
    hang: [...document.querySelectorAll(".duyet-tomtat > div")].map((d) => d.querySelector("dt")?.textContent?.trim()),
    heQua: document.querySelector(".duyet-lydo-dan")?.textContent?.trim() ?? "",
    oNhap: Boolean(document.querySelector(".duyet-lydo textarea")),
  }));
  if (!tt.hang.includes("Kỳ")) throw new Error(`Ô xác nhận "${nhan}" không nói đang chốt kỳ nào: ${JSON.stringify(tt.hang)}`);
  if (!tt.hang.includes("Bộ sheet sẽ gửi")) throw new Error(`Ô xác nhận "${nhan}" không nói bộ báo cáo gồm mấy sheet: ${JSON.stringify(tt.hang)}`);
  if (tt.oNhap) throw new Error(`Ô xác nhận "${nhan}" lại hỏi lý do — chốt không cần lý do, nó cần tóm tắt.`);
  if (!tt.heQua) throw new Error(`Ô xác nhận "${nhan}" không nói hệ quả của cú chốt.`);
  await page.evaluate(() => document.querySelector(".duyet-lydo button[type='submit']").click());
  await page.waitForFunction(() => !document.querySelector(".duyet-lydo"), { timeout: 5000 });
};

await page.setViewport({ width: 1440, height: 1000 });
await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
await page.waitForSelector(".thanh-duyet");
if (await trangThaiDuyet() !== "Nháp") throw new Error("Kỳ chưa gửi phải ở trạng thái Nháp.");
const nutCV = await nutDuyet();
if (!nutCV.includes("Gửi duyệt") || nutCV.includes("Duyệt") || nutCV.includes("Trả lại")) {
  throw new Error(`Quyền chuyên viên trên thanh duyệt sai: ${JSON.stringify(nutCV)}`);
}

/*
  Vai KHÔNG có việc ở trạng thái hiện tại phải được nói vì sao.

  Trưởng phòng mở màn lúc kỳ còn ở Nháp thì không có nút nào; một thanh trống
  trơn đọc ra rất giống chức năng duyệt bị thiếu, và người dùng sẽ đi tìm lỗi
  ở chỗ không có lỗi. Đây là lỗi đã xảy ra thật, nên nó có chốt kiểm riêng.
*/
const khongCoViec = async (ma, mongDoi) => {
  await dangXuat(page);
  await dangNhap(page, ma);
  await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".thanh-duyet");
  /*
    Lời giải thích có thể nằm ở khối trạng thái bên trái (`DIEN_GIAI`) hoặc ở
    dòng phụ bên phải (`CHO_AI`) — chốt kiểm đọc cả thanh, vì thứ cần đảm bảo
    là NGƯỜI DÙNG ĐƯỢC NÓI vì sao họ không có việc, không phải là nó được nói
    ở ô nào.
  */
  const d = await page.evaluate(() => ({
    nut: [...document.querySelectorAll(".duyet-hanh-dong button")].length,
    cho: document.querySelector(".thanh-duyet")?.textContent?.trim() ?? null,
    coXemTruoc: [...document.querySelectorAll(".duyet-nut button")].some((b) => /Xem báo cáo/.test(b.textContent || "")),
  }));
  if (d.nut !== 0) throw new Error(`${ma} đáng lẽ chưa có thao tác nào ở bước này, nhưng thấy ${d.nut} nút.`);
  if (!d.cho || !d.cho.includes(mongDoi)) throw new Error(`${ma} không được nói việc đang ở ai: ${JSON.stringify(d.cho)}`);
  /* Bản còn ở Nháp thì người KHÔNG giữ nó không được mời đọc: số trong đó
     còn đổi, mà người đọc không có cách nào biết điều đó. */
  if (d.coXemTruoc) throw new Error(`${ma} thấy nút xem báo cáo dù bản còn đang sửa.`);
};
await khongCoViec("tp.ql1", "Chưa gửi duyệt");
await dangXuat(page);
await dangNhap(page, "cv.ql1");
await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
await page.waitForSelector(".thanh-duyet");
/*
  Mở báo cáo RỒI mới gửi duyệt — đúng thứ tự một người thật làm: nhìn lại bộ
  báo cáo lần cuối, thấy ổn thì gửi.

  Hai thứ phải đúng sau khi gửi. Một, chuyên viên vẫn đọc lại được bản mình
  vừa gửi: số đã khóa nên không còn rủi ro đọc bản đang đổi, và người bị hỏi
  "anh gửi cái gì" phải mở ra được mà không phải tải file về.

  Hai, và đây là lỗi đã xảy ra thật: NÚT và KHỐI không bao giờ được lệch nhau.
  Trước đây điều kiện chỉ gác cái nút, nên gửi xong thì nút biến mất mà khối
  vẫn nằm giữa trang, không còn gì đóng được nó.
*/
await page.evaluate(() => [...document.querySelectorAll(".duyet-nut button")].find((b) => /Xem báo cáo/.test(b.textContent)).click());
await page.waitForSelector(".xem-truoc", { timeout: 5000 });
await chot("Gửi duyệt");
if (await trangThaiDuyet() !== "Đã rà soát") throw new Error("Gửi duyệt nhưng trạng thái kỳ chưa đổi.");
const sauGui = await page.evaluate(() => ({
  coKhoi: Boolean(document.querySelector(".xem-truoc")),
  coNut: [...document.querySelectorAll(".duyet-nut button")].some((b) => /báo cáo/.test(b.textContent || "")),
  xem: new URLSearchParams(location.search).get("xem"),
}));
if (!sauGui.coKhoi) throw new Error("Gửi duyệt xong, chuyên viên mất luôn đường đọc lại bản mình vừa gửi.");
if (!sauGui.xem) throw new Error("Khối báo cáo đang mở mà địa chỉ không còn `xem=`.");
/* Lệch nhau là lỗi dù lệch chiều nào: khối mở mà không có nút thì không đóng
   được, nút hiện mà không có khối thì bấm vào không ra gì. */
if (sauGui.coKhoi !== sauGui.coNut) {
  throw new Error(`Nút và khối báo cáo lệch nhau sau khi gửi: khối=${sauGui.coKhoi}, nút=${sauGui.coNut}.`);
}
/*
  Nút vừa bấm phải còn ở đó, dưới dạng đã tắt với nhãn thể hoàn thành — không
  biến mất không dấu vết.
*/
const daGui = await page.evaluate(() => {
  const n = [...document.querySelectorAll(".duyet-hanh-dong button")].find((b) => b.disabled);
  return n ? n.textContent.trim() : null;
});
if (daGui !== "Đã gửi") throw new Error(`Gửi duyệt xong không thấy nút đã tắt "Đã gửi" trong ô quyết định: ${JSON.stringify(daGui)}`);

/*
  The Fixed Slots Rule (DESIGN.md). Ô đọc đứng trước ô quyết định, với MỌI
  vai và MỌI trạng thái — hai cán bộ cùng mở một kỳ phải chỉ được cho nhau
  "nút thứ hai từ phải" mà không cần hỏi đối phương đang thấy mấy nút.

  Lỗi đã xảy ra: "Xem báo cáo" đứng thứ nhất với người duyệt nhưng thứ hai
  với chuyên viên, vì nó chỉ việc xếp sau cái gì có mặt.
*/
const thuTuO = async (ai) => {
  const o = await page.evaluate(() => [...document.querySelectorAll(".duyet-nut > *")].map((x) => x.className));
  const iDoc = o.indexOf("duyet-doc");
  const iQuyet = o.indexOf("duyet-hanh-dong");
  if (iDoc === -1) throw new Error(`${ai}: không thấy ô đọc trên thanh duyệt.`);
  if (iQuyet !== -1 && iDoc > iQuyet) throw new Error(`${ai}: ô đọc đứng SAU ô quyết định — ${JSON.stringify(o)}`);
  /* Nút không được co giãn: hai nút cùng nhãn dài khác nhau mà rộng bằng
     nhau nghĩa là chúng đang bị kéo cho đầy chỗ. */
  const coGian = await page.evaluate(() => [...document.querySelectorAll(".duyet-nut .button")]
    .some((b) => getComputedStyle(b).flexGrow !== "0"));
  if (coGian) throw new Error(`${ai}: nút trên thanh duyệt đang co giãn theo chỗ trống.`);
};
await thuTuO("cv.ql1 sau khi gửi");
await page.screenshot({ path: ".impeccable/review/duyet-cv-da-gui.png" });
await dangXuat(page);

await dangNhap(page, "tp.ql1");
await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
await page.waitForSelector(".thanh-duyet");
if (await trangThaiDuyet() !== "Đã rà soát") throw new Error("Trưởng phòng không thấy kỳ chuyên viên đã gửi.");
await thuTuO("tp.ql1 ở Đã rà soát");
/* Khổ hẹp cũng phải giữ nguyên hai ô và nguyên bề rộng nút: luật co giãn cũ
   nằm trong một media query, nên chỉ kiểm ở desktop là không chạm tới nó. */
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.reload({ waitUntil: "networkidle0" });
await page.waitForSelector(".thanh-duyet");
await thuTuO("tp.ql1 ở khổ 390");
await page.setViewport({ width: 1440, height: 900 });
await page.reload({ waitUntil: "networkidle0" });
await page.waitForSelector(".thanh-duyet");
/*
  Người duyệt phải XEM ĐƯỢC thứ mình sắp ký, ngay tại chỗ ký.

  Trước đây họ chỉ có Duyệt và Trả lại; muốn nhìn bộ báo cáo nguyên hình thì
  phải tải file về rồi mở Excel — lúc đó bước duyệt rơi ra ngoài hệ, đúng cái
  hệ sinh ra để thay.
*/
await page.evaluate(() => [...document.querySelectorAll(".duyet-nut button")].find((b) => /Xem báo cáo/.test(b.textContent)).click());
await page.waitForSelector(".xem-truoc", { timeout: 5000 });
/* Mở khối ra thì nút xuất cả bộ phải có mặt NGAY TRONG đầu khối ấy. */
const xuatTrongKhoi = await page.evaluate(() => [...document.querySelectorAll(".xem-truoc .panel-actions button")].map((b) => b.textContent.trim()));
if (!xuatTrongKhoi.includes("Xuất Excel")) throw new Error(`Khối xem báo cáo không có nút Xuất Excel: ${JSON.stringify(xuatTrongKhoi)}`);

const xemTruoc = await page.evaluate(() => ({
  soSheet: document.querySelectorAll('.xem-truoc [aria-label="Sheet trong bộ báo cáo"] button, .xem-truoc [aria-label="Sheet trong bộ báo cáo"] option').length,
  coBang: document.querySelectorAll(".xt-bang tbody tr").length,
}));
if (xemTruoc.soSheet < 5) throw new Error(`Xem trước chỉ có ${xemTruoc.soSheet} sheet, đáng lẽ cả bộ báo cáo.`);
if (!xemTruoc.coBang) throw new Error("Xem trước không dựng được bảng của sheet.");

/*
  Soát MỌI sheet, không chỉ sheet đang mở.

  Lần đầu tôi chỉ đo sheet đầu tiên và kết luận là xong; tám sheet còn lại vỡ
  hết, vì mỗi sheet một hình dạng cột — sheet này mở đầu bằng số thứ tự, sheet
  kia bằng tên đơn vị, sheet `QuyTac_Nguon` chỉ có hai cột chữ. Kiểm một sheet
  rồi suy ra cả bộ chính là cái sai đã xảy ra, nên chốt kiểm đi qua từng cái.
*/
const soSheet = await page.$$eval('.xem-truoc [aria-label="Sheet trong bộ báo cáo"] button', (b) => b.length);
for (let i = 0; i < soSheet; i++) {
  await page.evaluate((k) => document.querySelectorAll('.xem-truoc [aria-label="Sheet trong bộ báo cáo"] button')[k].click(), i);
  await new Promise((resolve) => setTimeout(resolve, 160));
  const v = await page.evaluate(() => {
    const t = document.querySelector(".xt-bang");
    const xau = [];
    for (const c of t.querySelectorAll("td, th")) {
      if (c.scrollWidth - c.clientWidth > 2) xau.push((c.textContent || "").trim().slice(0, 24));
    }
    return { ten: document.querySelector('.xem-truoc [aria-pressed="true"]')?.textContent?.trim(), tran: [...new Set(xau)].slice(0, 3) };
  });
  if (v.tran.length) throw new Error(`Sheet "${v.ten}" trong xem trước có ô bị cắt chữ: ${JSON.stringify(v.tran)}`);
}
/*
  Trạng thái xem trước phải nằm trong ĐỊA CHỈ, không trong bộ nhớ của tab.

  Trợ lý cần gửi được một liên kết mở thẳng đúng sheet đang bàn, và người nhận
  mở ra phải thấy đúng cái đó. Nên chốt kiểm nạp lại trang từ chính URL hiện
  tại: nếu khối xem trước không dựng lại ở đúng sheet, địa chỉ ấy không mô tả
  được trạng thái và liên kết gửi đi là liên kết rỗng.
*/
const sheetDangXem = await page.evaluate(() => new URLSearchParams(location.search).get("xem"));
if (!sheetDangXem) throw new Error("Mở xem trước nhưng địa chỉ không mang tham số `xem`.");
await page.reload({ waitUntil: "networkidle0" });
await page.waitForSelector(".xem-truoc", { timeout: 5000 });
const sheetSauNap = await page.evaluate(() => document.querySelector('.xem-truoc [aria-pressed="true"]')?.textContent?.trim());
if (sheetSauNap !== sheetDangXem) throw new Error(`Nạp lại theo địa chỉ ra sheet "${sheetSauNap}", đáng lẽ "${sheetDangXem}".`);

/* Đóng bằng nút, và địa chỉ phải sạch lại — tham số thừa mô tả một trạng
   thái không còn tồn tại. */
await page.evaluate(() => [...document.querySelectorAll(".duyet-nut button")].find((b) => /báo cáo/.test(b.textContent)).click());
await page.waitForFunction(() => !document.querySelector(".xem-truoc"), { timeout: 5000 });
if (await page.evaluate(() => new URLSearchParams(location.search).get("xem"))) {
  throw new Error("Đóng báo cáo rồi mà tham số `xem` vẫn còn trong địa chỉ.");
}

const nutTP = await nutDuyet();
if (!nutTP.includes("Duyệt") || !nutTP.includes("Trả lại") || nutTP.includes("Gửi duyệt")) {
  throw new Error(`Quyền trưởng phòng trên thanh duyệt sai: ${JSON.stringify(nutTP)}`);
}

/* Trả lại BẮT BUỘC có lý do — bản thiết kế ghi "Trả lại + lý do" trên sơ đồ. */
await page.evaluate(() => [...document.querySelectorAll(".duyet-hanh-dong button")].find((b) => b.textContent.trim() === "Trả lại").click());
await page.waitForSelector(".duyet-lydo textarea[name='lyDoTraLai']");
/*
  Mở ô lý do trả lại là đã chọn một nhánh, nên nhánh NGƯỢC phải tắt. Nút Duyệt
  là nút chính nằm ngay cạnh; gõ lý do dở mà chạm nhầm là kỳ bị duyệt luôn,
  và QR-03 thì bắt phải mở bản điều chỉnh kèm lý do mới sửa lại được.
*/
const khiMoLyDo = await page.evaluate(() => Object.fromEntries(
  [...document.querySelectorAll(".duyet-hanh-dong button")].map((b) => [b.textContent.trim(), b.disabled]),
));
if (khiMoLyDo["Duyệt"] !== true) throw new Error(`Đang viết lý do trả lại mà nút Duyệt vẫn bấm được: ${JSON.stringify(khiMoLyDo)}`);
if (khiMoLyDo["Trả lại"] !== false) throw new Error("Nút vừa bấm để mở ô lý do lại bị tắt theo.");
const sangLen = await page.evaluate(() => Boolean(document.querySelector(".duyet-hanh-dong .button.is-mo[aria-expanded='true']")));
if (!sangLen) throw new Error("Nút mở ô lý do không cho biết nó đang mở.");
await page.evaluate(() => document.querySelector(".duyet-lydo button[type='submit']").click());
if (await page.$(".duyet-lydo .quality-note") === null) throw new Error("Trả lại không có lý do mà hệ vẫn cho qua.");
/*
  Lý do DÀI, không phải "123".

  Ô cho tới 200 ký tự, nên chốt kiểm phải gõ gần hết ngần ấy. Lý do ngắn đi
  lọt mọi bố cục, kể cả bố cục sai — lỗi tràn lề chỉ lộ ra ở chuỗi dài, và nó
  đã lộ ra thật khi lý do còn nằm trong cột dấu vết co giãn.
*/
const lyDo = `Đề nghị làm rõ vì sao Thuế cơ sở 5 tăng nợ khả năng thu so với đầu năm trong khi tỷ lệ cưỡng chế lại giảm, kèm danh sách mười người nộp thuế lớn nhất ${Date.now()}`;
await page.type(".duyet-lydo textarea[name='lyDoTraLai']", lyDo);
await page.evaluate(() => document.querySelector(".duyet-lydo button[type='submit']").click());
await page.waitForFunction(() => !document.querySelector(".duyet-lydo"));
if (await trangThaiDuyet() !== "Nháp") throw new Error("Trả lại nhưng trạng thái kỳ chưa về Nháp.");
await dangXuat(page);

/*
  QR-03 (Phải): "người lập báo cáo không tự duyệt báo cáo của mình". Trưởng
  phòng vừa trả lại thì không phải người gửi, nên bước này kiểm phía còn lại —
  không có vai nào thấy cả hai nút Gửi duyệt và Duyệt cùng lúc.
*/
const nutChongCheo = await nutDuyet();
if (nutChongCheo.includes("Gửi duyệt") && nutChongCheo.includes("Duyệt")) {
  throw new Error(`Một vai thấy cả nút gửi lẫn nút duyệt: ${JSON.stringify(nutChongCheo)}`);
}

/* Chuyên viên phải ĐỌC ĐƯỢC lý do bị trả lại, nếu không vòng duyệt thứ hai
   hỏng y như vòng thứ nhất. */
await dangNhap(page, "cv.ql1");
await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
await page.waitForSelector(".thanh-duyet");
const thayLyDo = await page.evaluate((l) => (document.querySelector(".duyet-tralai")?.textContent ?? "").includes(l), lyDo);
/*
  Lý do dài KHÔNG được làm thanh duyệt tràn lề, ở bất kỳ khổ nào. Nó là chuỗi
  do người dùng gõ, nên nó là chỗ duy nhất trên thanh có bề dài không đoán
  trước được.
*/
for (const [w, h] of [[1440, 900], [768, 1024], [390, 844]]) {
  await page.setViewport({ width: w, height: h, isMobile: w < 900, hasTouch: w < 900 });
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector(".duyet-tralai");
  const tran = await page.evaluate(() => {
    const thanh = document.querySelector(".thanh-duyet");
    const o = thanh.getBoundingClientRect();
    const xau = [...thanh.querySelectorAll("*")].find((el) => {
      const r = el.getBoundingClientRect();
      return r.right > o.right + 1 || r.left < o.left - 1;
    });
    return {
      thanhTran: thanh.scrollWidth - thanh.clientWidth > 1,
      trangTran: document.documentElement.scrollWidth - document.documentElement.clientWidth > 1,
      vuot: xau ? `${xau.tagName.toLowerCase()}.${xau.className}` : null,
    };
  });
  if (tran.thanhTran || tran.trangTran || tran.vuot) {
    throw new Error(`Lý do trả lại dài làm tràn ở khổ ${w}: ${JSON.stringify(tran)}`);
  }
  /*
    Và nó phải là KHỐI RIÊNG trải hết thanh, không phải một dòng nhét trong
    cột dấu vết. Chỉ đo tràn là chưa đủ: chuỗi dài trong một cột hẹp thì gấp
    dòng chứ không tràn, nên phép đo ấy vẫn xanh trong khi lý do bị bóp thành
    năm dòng ở một phần ba bề ngang. Đây mới là phép thử của quyết định.
  */
  const khoiRieng = await page.evaluate(() => {
    const el = document.querySelector(".duyet-tralai");
    if (!el) return { thieu: true };
    const thanh = document.querySelector(".thanh-duyet");
    return {
      conTrucTiep: el.parentElement === thanh,
      trongVet: Boolean(el.closest(".duyet-vet")),
      tyLe: el.getBoundingClientRect().width / (thanh.clientWidth - 32),
    };
  });
  if (khoiRieng.thieu) throw new Error(`Khổ ${w}: không thấy khối lý do trả lại.`);
  if (khoiRieng.trongVet || !khoiRieng.conTrucTiep) throw new Error(`Khổ ${w}: lý do trả lại vẫn nằm trong cột dấu vết.`);
  if (khoiRieng.tyLe < 0.9) throw new Error(`Khổ ${w}: lý do trả lại chỉ rộng ${Math.round(khoiRieng.tyLe * 100)}% bề ngang thanh.`);
}
await page.setViewport({ width: 1440, height: 900 });
await page.reload({ waitUntil: "networkidle0" });
await page.waitForSelector(".thanh-duyet");
if (!thayLyDo) throw new Error("Chuyên viên không thấy lý do trưởng phòng trả lại.");
await chot("Gửi duyệt");
await dangXuat(page);

await dangNhap(page, "tp.ql1");
await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
await page.waitForSelector(".thanh-duyet");
await chot("Duyệt");
if (await trangThaiDuyet() !== "Đã duyệt") throw new Error("Chốt số nhưng trạng thái kỳ chưa đổi.");
/* Đã chốt là điểm cuối: không còn thao tác nào đẩy nó đi tiếp được nữa. */
/*
  "Đã duyệt" KHÔNG phải điểm cuối — BC-06 và bảng 13.2 của FRS mở đường tạo bản
  Điều chỉnh từ đó. Nút còn lại phải đúng MỘT nút ấy, và nó phải đòi lý do.
*/
const nutSauDuyet = await nutDuyet();
if (JSON.stringify(nutSauDuyet) !== JSON.stringify(["Điều chỉnh"])) {
  throw new Error(`Sau khi duyệt chỉ nên còn nút mở bản điều chỉnh: ${JSON.stringify(nutSauDuyet)}`);
}
await page.evaluate(() => [...document.querySelectorAll(".duyet-hanh-dong button")].find((b) => b.textContent.trim() === "Điều chỉnh").click());
await page.waitForSelector(".duyet-lydo textarea[name='lyDoTraLai']");
await page.evaluate(() => document.querySelector(".duyet-lydo button[type='submit']").click());
if (await page.$(".duyet-lydo .quality-note") === null) throw new Error("Mở điều chỉnh không có lý do mà hệ vẫn cho qua.");
await page.type(".duyet-lydo textarea[name='lyDoTraLai']", "Nguồn 9.9.4.15 chốt lại ngày 03");
await page.evaluate(() => document.querySelector(".duyet-lydo button[type='submit']").click());
await page.waitForFunction(() => !document.querySelector(".duyet-lydo"));
if (await trangThaiDuyet() !== "Đang điều chỉnh") throw new Error("Mở điều chỉnh nhưng trạng thái kỳ chưa đổi.");
/* Bản điều chỉnh tự nhận mình là bản thay thế, để người đọc biết bản đã trình
   trước đó sắp bị thay. */
const laBanThayThe = await page.evaluate(() => (document.querySelector(".duyet-chu strong")?.textContent ?? "").includes("bản thay thế"));
if (!laBanThayThe) throw new Error("Bản điều chỉnh không được đánh dấu là bản thay thế.");
await page.screenshot({ path: ".impeccable/review/duyet-tp-da-chot.png" });
await dangXuat(page);

/* ---- Phòng QL3 mở màn của mình và không mở màn của QL1 ---- */
await dangNhap(page, "cv.ql3");
await inspect(1440, 1000, false, MAN_QL3);

/* Màn QL3: bốn mục của §5.2, bảng kết quả đúng 17 cột của mẫu kết xuất. */
await page.goto(`${base}/?view=risk`, { waitUntil: "networkidle0" });
const ql3TongQuan = await page.evaluate(() => ({
  tenTab: [...document.querySelectorAll('[aria-label="Mục của báo cáo kiểm tra tại bàn"] button')].map((b) => b.textContent?.trim()),
  soThe: document.querySelectorAll(".the-so").length,
  /* Ba nội dung của QLDN2 không được nằm ở màn QL3 — BRD mục 8 xếp chúng ở
     phòng khác, và bản demo đang nói về phân công giữa các phòng. */
  lanSangQL2: /Hệ số K|Xác minh hóa đơn/.test(document.body.textContent || ""),
}));
/* Bốn mục của §5.2. Mục "Kết quả tổng hợp" từng rơi khỏi cụm trong khi mã
   dựng nó vẫn còn, nên bảng 17 cột — thứ cả phân hệ sinh ra để tái hiện —
   không còn đường nào mở ra. Chốt kiểm đếm theo TÊN để lần sau lộ ngay. */
/* Bảng 17 cột không còn là mục của "Kiểm tra tại bàn": nó đứng thành đích
   riêng "Kết quả tổng hợp" trong nhóm Phân hệ — kiểm ở dưới. */
/*
  QL3 KHÔNG còn mục "Dữ liệu gốc": nó liệt kê nguồn kéo về, tức việc của vai
  Vận hành dữ liệu — vai ấy đã có màn riêng. Chỗ đó nay là "Danh sách NNT",
  bảng KTTB_THEO_DN mà `SPec/QLDN3` §4.1 bước 2 đặt làm lớp giữa và mọi ô của
  mẫu báo cáo đều đếm hoặc cộng trên đó.
*/
const CAN_CO_QL3 = ["Tổng quan", "Danh sách NNT", "KPI đăng ký"];
const thieuQL3 = CAN_CO_QL3.filter((x) => !ql3TongQuan.tenTab.includes(x));
if (thieuQL3.length) throw new Error(`Màn QL3 thiếu mục: ${JSON.stringify(thieuQL3)} — đang có ${JSON.stringify(ql3TongQuan.tenTab)}`);
for (const bo of ["Dữ liệu gốc", "Đối chiếu báo cáo thủ công"]) {
  if (ql3TongQuan.tenTab.includes(bo)) throw new Error(`Màn QL3 vẫn còn mục "${bo}".`);
}
if (ql3TongQuan.soThe < 5) throw new Error(`Tab Tổng quan QL3 chỉ có ${ql3TongQuan.soThe} thẻ số.`);
if (ql3TongQuan.lanSangQL2) throw new Error("Màn QL3 vẫn mang nội dung của phòng QLDN2.");

/*
  Bảng 17 cột nay là ĐÍCH RIÊNG trong nhóm Phân hệ, không còn là mục của
  "Kiểm tra tại bàn" — nên chốt kiểm đi qua đúng đường người dùng đi: bấm
  mục đó trong thanh bên.
*/
const coDichTongHop = await page.evaluate(() => {
  const nut = [...document.querySelectorAll(".sidebar .nav-item")].find((b) => b.textContent?.trim() === "Kết quả tổng hợp");
  if (!nut) return false;
  nut.click();
  return true;
});
if (!coDichTongHop) throw new Error("Thanh bên thiếu đích 'Kết quả tổng hợp' của phòng QL3.");
await page.waitForSelector(".ql3-table");
const ql3 = await page.evaluate(() => {
  const dong2 = document.querySelectorAll(".ql3-table thead tr:nth-child(2) th");
  const dv = [...document.querySelectorAll(".ql3-table tbody th")].map((el) => el.textContent?.trim() ?? "");
  return {
    soCot: dong2.length,
    soNhom: document.querySelectorAll(".ql3-table th.nhom").length,
    coMaDiaBan: dv.some((x) => /\(HKI\)/.test(x)),
    coPhongDat: dv.some((x) => x.includes("thu từ đất")),
    soPhongVP: dv.filter((x) => x.startsWith("Phòng QLHTDN")).length,
  };
});
/* 17 cột của mẫu = 1 cột đơn vị + 16 cột số. */
if (ql3.soCot !== 16) throw new Error(`Bảng QL3 có ${ql3.soCot} cột số, đáng lẽ 16 (cộng cột đơn vị là 17).`);
if (ql3.soNhom !== 4) throw new Error(`Bảng QL3 có ${ql3.soNhom} nhóm cột, đáng lẽ 4.`);
if (!ql3.coMaDiaBan) throw new Error("Thuế cơ sở ở QL3 phải mang mã địa bàn, ví dụ Thuế cơ sở 01 (HKI).");
/*
  Phụ lục A của FRS: năm Thuế cơ sở gồm HAI mã địa bàn (18, 19, 20, 21, 22).
  Danh mục khai mỗi đơn vị một mã sẽ gom hụt mất một nửa số liệu kéo theo mã
  địa bàn, mà không có dấu hiệu nào trên màn.
*/
const haiDiaBan = await page.evaluate(() => [...document.querySelectorAll(".ql3-table tbody th")]
  .map((el) => el.textContent?.trim() ?? "")
  .filter((x) => /Thuế cơ sở (18|19|20|21|22)/.test(x)));
if (haiDiaBan.length !== 5) throw new Error(`Không thấy đủ 5 Thuế cơ sở 18–22: ${JSON.stringify(haiDiaBan)}`);
for (const x of haiDiaBan) {
  if (!/\(\w{3}, \w{3}\)/.test(x)) throw new Error(`Thuế cơ sở hai địa bàn phải hiện cả hai mã: "${x}"`);
}
if (ql3.coPhongDat) throw new Error("Danh mục QL3 không có Phòng Quản lý các khoản thu từ đất.");
if (ql3.soPhongVP !== 5) throw new Error(`Khối VP của QL3 có ${ql3.soPhongVP} phòng, đáng lẽ 5.`);

await chanCheoPhong("debt", "Báo cáo nợ");
await dangXuat(page);

/* ---- Vận hành dữ liệu: đúng một màn, không thuộc phòng nào ---- */
await dangNhap(page, "vanhanh.dulieu");
await page.goto(`${base}/?view=giamsat`, { waitUntil: "networkidle0" });
const vanHanh = await page.evaluate(() => ({
  /* Thanh bên và thanh đáy cùng dựng một mục; chỉ một trong hai hiện ở mỗi
     khổ màn hình, nên đếm phần tử nhìn thấy chứ không đếm nút trong DOM. */
  soMuc: [...document.querySelectorAll(".nav-item, .mobile-nav button")].filter((el) => el.offsetParent !== null).length,
  tieuDe: document.querySelector("main h1")?.textContent?.trim() ?? null,
  taoBaoCao: Boolean(document.querySelector("#global-create-report")),
}));
if (vanHanh.tieuDe !== "Giám sát dữ liệu") throw new Error(`Vai Vận hành dữ liệu không mở được màn của mình: ${JSON.stringify(vanHanh)}`);
if (vanHanh.soMuc !== 1) throw new Error(`Vai Vận hành dữ liệu thấy ${vanHanh.soMuc} mục điều hướng, đáng lẽ đúng 1.`);
if (vanHanh.taoBaoCao) throw new Error("Vai Vận hành dữ liệu không lập báo cáo nhưng vẫn thấy nút Tạo báo cáo.");
await page.screenshot({ path: ".impeccable/review/giamsat-desktop.png", fullPage: true });
await chanCheoPhong("debt", "Báo cáo nợ");
await chanCheoPhong("reports", "Báo cáo");
await dangXuat(page);

/* Ba vai, chốt 28/09: Lãnh đạo nhà nước KHÔNG vào Web quản lý. Đăng nhập được
   nhưng phải sang Dashboard Thu NSNN, không phải một shell rỗng hay màn trắng. */
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

/*
  Bước này chỉ chạy được trên BẢN DỰNG CỔNG CHUNG, nơi Dashboard nằm ở
  `/nsnn/` cùng origin. Chạy cổng kiểm trên dev server của tax-ops thì
  Dashboard không tồn tại ở đó, và một lần gãy ở đây sẽ che mất kết quả của
  mọi bước phía trước. Nên dò trước rồi báo rõ là bỏ qua, chứ không im lặng
  đổi tiêu chuẩn.
*/
await dangNhap(page, "lanhdao.nhanuoc");
/* Chờ hệ tự chuyển hướng; không dùng `waitForSelector` vì nếu đích không tồn
   tại thì nó treo 30 giây rồi mới báo một lỗi nói sai nguyên nhân. */
await new Promise((resolve) => setTimeout(resolve, 2500));
const dich = page.url();
const cungGoc = dich.startsWith(new URL(base).origin);

if (!cungGoc || dich.startsWith("chrome-error")) {
  console.log(`⚠ Bỏ qua bước Lãnh đạo nhà nước: bản dựng này trỏ Dashboard ra ngoài origin (${dich.slice(0, 48)}).`);
  console.log("  Đó là cấu hình của bản dev. Chạy `npm run preview:portal` rồi chạy lại để kiểm đủ bước.");
} else {
  await page.waitForSelector(".dheader, .dmobile-header", { timeout: 8000 });
  if (new URL(dich).pathname !== new URL(`${base}/nsnn/`).pathname) throw new Error("Lãnh đạo nhà nước chưa được điều hướng vào NSNN.");
  await page.screenshot({ path: ".impeccable/review/nsnn-mobile.png", fullPage: true });
}

/*
  Báo cáo KHUNG không gửi duyệt được.

  QL2-03/04/05/06 mới có khung, chưa có mẫu từ phòng nghiệp vụ; màn của chúng
  tự nói "bố cục cột sẽ đổi khi mẫu về, đừng trích số từ đây". Nút Gửi duyệt
  từng vẫn bật ngay trên những màn ấy, nên chuyên viên đẩy được một báo cáo
  rỗng vào hàng chờ, và trưởng phòng duyệt một cái vỏ.

  Chặn phải nói LÝ DO ngay tại chỗ, không phải giấu nút: giấu thì người dùng
  đi tìm một chức năng đã biến mất.
*/
{
  /*
    Bước NSNN phía trên bỏ trình duyệt lại ở Dashboard và ở khổ điện thoại.
    Dashboard là ỨNG DỤNG KHÁC: nó không có nút đăng xuất của hệ tác nghiệp,
    nên `dangXuat` ở đây không có gì để bấm. Quay về hệ tác nghiệp và dọn
    phiên bằng tay, rồi mới đăng nhập vai mới.
  */
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${base}/quan-ly/`, { waitUntil: "networkidle0" });
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(`${base}/quan-ly/`, { waitUntil: "networkidle0" });
  await dangNhap(page, "cv.ql2");
  for (const [muc, ma] of [["tpr", "QL2-03"], ["cbrr", "QL2-05"], ["congan", "QL2-06"]]) {
    await page.goto(`${base}/?view=hoadon&muc=${muc}`, { waitUntil: "networkidle0" });
    await page.waitForSelector(".thanh-duyet");
    const k = await page.evaluate(() => {
      const n = [...document.querySelectorAll(".duyet-hanh-dong button")].find((b) => b.textContent.trim() === "Gửi duyệt");
      return { co: Boolean(n), tat: n?.disabled ?? null, lyDo: [...document.querySelectorAll(".duyet-tralai")].map((p) => p.textContent).join(" ") };
    });
    if (!k.co) throw new Error(`${ma}: nút Gửi duyệt bị GIẤU thay vì tắt kèm lý do.`);
    if (k.tat !== true) throw new Error(`${ma}: báo cáo khung vẫn gửi duyệt được.`);
    if (!/chưa có mẫu/.test(k.lyDo)) throw new Error(`${ma}: chặn gửi duyệt mà không nói vì sao — ${JSON.stringify(k.lyDo.slice(0, 80))}`);
  }

  /*
    Dải gợi ý cuộn phải bám THỰC TẾ TRÀN, không bám điểm ngắt.

    Nó từng chỉ hiện từ 900px xuống. Ở 1440px bảng nhập kết quả PRS-03 rộng
    1752px trong khung 1146px — khoảng 35% khuất, và cột khuất đúng là cột
    Kết quả. Chốt kiểm này đo từng bảng trên màn: tràn thì phải có dải, không
    tràn thì không được có.
  */
  await page.goto(`${base}/?view=hoadon&muc=dschenh`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".phieu-bang tbody tr");
  await new Promise((resolve) => setTimeout(resolve, 260));
  const lech = await page.evaluate(() => {
    const xau = [];
    for (const vo of document.querySelectorAll(".table-shell")) {
      const vung = vo.querySelector(".table-wrap");
      const tran = vung.scrollWidth - vung.clientWidth > 1;
      const coDai = Boolean(vo.querySelector(".scroll-hint"));
      if (tran !== coDai) xau.push({ nhan: vung.getAttribute("aria-label"), tran, coDai, thua: vung.scrollWidth - vung.clientWidth });
    }
    return xau;
  });
  if (lech.length) throw new Error(`Dải gợi ý cuộn lệch với thực tế tràn: ${JSON.stringify(lech)}`);
  const coTran = await page.evaluate(() => [...document.querySelectorAll(".table-shell")]
    .some((vo) => vo.querySelector(".table-wrap").scrollWidth - vo.querySelector(".table-wrap").clientWidth > 1));
  if (!coTran) throw new Error("Màn này đáng lẽ có bảng tràn ở 1440px — phép kiểm đang không kiểm gì.");

  await dangXuat(page);
  await dangNhap(page, "cv.ql1");
}

/*
  Danh sách NNT của QL3 phải CỘNG RA đúng bảng tổng hợp của chính nó.

  Đây là lý do màn này tồn tại: `SPec/QLDN3` §4.1 đặt bảng KTTB_THEO_DN làm
  lớp giữa, và mọi ô của mẫu báo cáo là một phép đếm hoặc phép cộng trên đó.
  Bấm vào ô "Đã thực hiện" mà danh sách ra số khác là bản mẫu tự mâu thuẫn
  trước mặt người dùng — và đó là kiểu sai không ai phát hiện bằng mắt, vì cả
  hai con số đều trông hợp lý.

  So ở mức TOÀN NGÀNH, dòng "Tổng cộng" của bảng 17 cột với số dòng của danh
  sách khi lọc "Trong kế hoạch: Có" — đúng tập mà cột (3) đếm.
*/
{
  await page.setViewport({ width: 1440, height: 900 });
  await dangXuat(page);
  await dangNhap(page, "cv.ql3");
  await page.goto(`${base}/?view=tonghopql3`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".ql1-table tbody tr");
  const daThucHien = await page.evaluate(() => {
    /* Tiêu đề hai tầng: dòng CUỐI của `thead` mới là tầng lá, và nó không có
       ô đơn vị — nên ô dữ liệu thứ i của dòng tổng ứng với lá thứ i−1. */
    const la = [...document.querySelectorAll(".ql1-table thead tr:last-child th")].map((th) => th.textContent.trim());
    const cot = la.findIndex((t) => /đã thực hiện/i.test(t));
    if (cot === -1) return { loi: `không thấy cột "Đã thực hiện": ${JSON.stringify(la)}` };
    const tong = document.querySelector(".ql1-table tbody tr.is-tong");
    if (!tong) return { loi: "không thấy dòng Tổng cộng" };
    const o = [...tong.children].map((td) => td.textContent.trim());
    return { mau: Number((o[cot + 1] || "").replace(/\./g, "")) };
  });
  if (daThucHien.loi) throw new Error(`Bảng tổng hợp QL3: ${daThucHien.loi}`);
  if (!daThucHien.mau) throw new Error("Bảng tổng hợp QL3: dòng Tổng cộng không đọc được số đã thực hiện.");

  await page.goto(`${base}/?view=risk&muc=dsnnt`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".ql1-ds-table tbody tr");
  const ds = await page.evaluate(() => {
    const o = [...document.querySelectorAll(".inline-controls label")].map((l) => ({
      nhan: l.querySelector("span")?.textContent?.trim(),
      gia: l.querySelector("select")?.value ?? null,
      chon: [...(l.querySelectorAll("select option") || [])].map((x) => x.textContent.trim()),
    }));
    return {
      phu: document.querySelector(".panel-head")?.textContent || "",
      boLoc: o,
      cot: [...document.querySelectorAll(".ql1-ds-table thead th")].map((th) => th.textContent.trim()),
      soDong: document.querySelectorAll(".ql1-ds-table tbody tr").length,
    };
  });
  if (!ds.soDong) throw new Error("Danh sách NNT của QL3 không dựng được dòng nào.");

  /*
    CQT là BỘ LỌC, không phải cột — yêu cầu của người dùng, và nó còn là thứ
    giữ cho bảng 27 cột không mở đầu bằng hai cột giống hệt nhau.
  */
  const loCqt = ds.boLoc.find((x) => x.nhan === "CQT");
  if (!loCqt) throw new Error(`Danh sách NNT thiếu bộ lọc CQT: ${JSON.stringify(ds.boLoc.map((x) => x.nhan))}`);
  if (loCqt.chon.length < 3) throw new Error(`Bộ lọc CQT chỉ có ${loCqt.chon.length} lựa chọn.`);
  for (const c of ds.cot) {
    if (/^CQT$|Cơ quan quản lý thuế/i.test(c)) throw new Error(`CQT vẫn còn là CỘT của danh sách: ${JSON.stringify(ds.cot)}`);
  }

  /*
    Bảng giữ ĐÚNG NĂM CỘT nhận dạng và VỪA KHUNG.

    Bản 27 cột trước đó rộng 3.700px trong khung 1.146px — trung thực với
    sheet nhưng hai phần ba nằm ngoài tầm nhìn. Cột tiền dọn sang khối chi
    tiết, nên ở đây vừa đếm cột vừa đo xem bảng còn tràn không.
  */
  const COT_BANG = ["Tên NNT", "MST", "Loại thuế", "Kỳ kê khai", "Trạng thái hồ sơ"];
  if (JSON.stringify(ds.cot) !== JSON.stringify(COT_BANG)) {
    throw new Error(`Bảng danh sách NNT phải là ${JSON.stringify(COT_BANG)}, đang là ${JSON.stringify(ds.cot)}`);
  }
  const tranBang = await page.evaluate(() => {
    const w = document.querySelector(".case-list .table-wrap");
    return w ? w.scrollWidth - w.clientWidth : -1;
  });
  if (tranBang > 0) throw new Error(`Bảng danh sách NNT vẫn tràn ${tranBang}px ở 1440px khi chưa mở chi tiết.`);

  const loKeHoach = ds.boLoc.find((x) => x.nhan === "Trong kế hoạch");
  if (loKeHoach?.gia !== "co") throw new Error(`Danh sách NNT không mặc định lọc "Trong kế hoạch: Có" — ${JSON.stringify(loKeHoach)}`);

  /*
    Phép buộc chính: số DOANH NGHIỆP ĐƯỢC ĐẾM của danh sách = ô "Đã thực hiện"
    của bảng tổng hợp.

    Một dòng ở đây là một hồ sơ khai thuế, nên số dòng KHÁC số doanh nghiệp —
    và đó chính là lý do phải kiểm: nếu phép gom theo MST hỏng, hai con số sẽ
    rời nhau mà màn vẫn trông bình thường.
  */
  const soDN = Number((ds.phu.match(/([\d.]+) doanh nghiệp/) || [])[1]?.replace(/\./g, "") || 0);
  if (!soDN) throw new Error(`Không đọc được số doanh nghiệp ở đầu khối danh sách: ${JSON.stringify(ds.phu.slice(0, 120))}`);
  if (soDN !== daThucHien.mau) {
    throw new Error(`Danh sách NNT gom ra ${soDN} doanh nghiệp nhưng bảng tổng hợp nói đã thực hiện ${daThucHien.mau}.`);
  }
  /*
    Bấm một dòng mở NGĂN TRƯỢT từ mép phải.

    Đây là ngoại lệ đã được người dùng chốt của The No-Overlay Rule — xem mục
    "Địa chỉ và lớp phủ" trong DESIGN.md. Ngoại lệ có điều kiện, và chốt kiểm
    này canh đúng những điều kiện ấy:

    • Dùng LẠI ngăn trượt chung `.case-drawer`, không dựng cái thứ hai. Hai
      đường dựng cho cùng một việc thì mỗi luật bố cục mới phải kiểm hai lần.
    • Dòng đang mở nằm trong ĐỊA CHỈ (`so=`). Đây là cái giá nặng nhất của lớp
      phủ — không ai dẫn tới được nó — và nó phải được trả lại.
    • Ngăn trượt mang ĐỦ cột tiền của sheet; đó là lý do bảng rút ngắn được.
    • Bảng giữ TRỌN bề ngang khi ngăn trượt đóng, không bị một cột cố định ăn
      mất chỗ.
  */
  {
    await page.evaluate(() => document.querySelector(".ql1-ds-table tbody tr").click());
    await page.waitForSelector("dialog.case-drawer[open]", { timeout: 5000 });
    /* Ngăn trượt VÀO trong 180ms (`case-drawer-enter`, translateX(100%) → 0).
       Đo ngay lúc bấm thì bắt được khung hình đầu, nơi ngăn còn nằm trọn
       ngoài mép phải — và phép kiểm sẽ báo một lỗi bố cục không có thật. */
    await page.evaluate(() => Promise.all(document.querySelector("dialog.case-drawer").getAnimations().map((a) => a.finished)));
    const ngan = await page.evaluate(() => {
      const el = document.querySelector("dialog.case-drawer[open]");
      const o = el.getBoundingClientRect();
      return {
        /* Trượt từ MÉP PHẢI: mép phải của ngăn chạm mép phải khung nhìn. */
        chamPhai: Math.abs(o.right - window.innerWidth) <= 2,
        rong: Math.round(o.width),
        nhan: [...el.querySelectorAll(".detail-grid dt")].map((x) => x.textContent.trim()),
        coDong: [...el.querySelectorAll("button")].some((b) => /Đóng chi tiết/.test(b.textContent || "")),
        so: new URLSearchParams(location.search).get("so"),
      };
    });
    if (!ngan.chamPhai) throw new Error(`Ngăn chi tiết không trượt từ mép phải (mép phải lệch ${ngan.rong}px).`);
    if (!ngan.coDong) throw new Error("Ngăn chi tiết không có nút Đóng.");
    if (!ngan.so) throw new Error("Mở ngăn chi tiết nhưng địa chỉ không mang tham số `so` — lớp phủ không có địa chỉ là cái giá phải trả lại.");
    for (const n of ["Tổng số thuế tăng thu", "Giảm khấu trừ", "Giảm lỗ", "Số tiền phạt", "Tiền nộp chậm", "Tiền thuế điều chỉnh tăng"]) {
      if (!ngan.nhan.includes(n)) throw new Error(`Ngăn chi tiết thiếu cột tiền "${n}": ${JSON.stringify(ngan.nhan)}`);
    }

    /* Nạp lại theo chính địa chỉ ấy phải mở lại đúng hồ sơ đang xem. */
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForSelector("dialog.case-drawer[open]", { timeout: 5000 });

    /* Đóng bằng Escape — ngăn trượt là `<dialog>`, nên phím này phải chạy. */
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("dialog.case-drawer[open]"), { timeout: 5000 });
    if (await page.evaluate(() => new URLSearchParams(location.search).get("so"))) {
      throw new Error("Đóng ngăn chi tiết nhưng tham số `so` còn lại trong địa chỉ.");
    }

    /* Ngăn đóng thì bảng phải giữ trọn bề ngang, không tràn. */
    const tranSauDong = await page.evaluate(() => {
      const w = document.querySelector(".case-list .table-wrap");
      return w ? w.scrollWidth - w.clientWidth : -1;
    });
    if (tranSauDong !== 0) throw new Error(`Bảng danh sách NNT tràn ${tranSauDong}px ở 1440px khi ngăn chi tiết đã đóng.`);
  }

  /* Số hồ sơ phải LỚN HƠN số doanh nghiệp: cùng một MST có nhiều tờ khai.
     Bằng nhau nghĩa là bảng lại quay về một dòng một doanh nghiệp. */
  const soHoSo = Number((ds.phu.match(/([\d.]+) hồ sơ/) || [])[1]?.replace(/\./g, "") || 0);
  if (soHoSo <= soDN) throw new Error(`Danh sách có ${soHoSo} hồ sơ cho ${soDN} doanh nghiệp — một dòng không còn là một hồ sơ khai thuế.`);

  /*
    KPI đăng ký — M-Q3-02 của `SPec/QLDN3`. Ba điều phải đúng:

    • CHỈ CHUYÊN VIÊN nhập được; trưởng phòng đọc và duyệt. Cùng lằn ranh đã
      áp cho phiếu rà soát bên QL2 và QL4.
    • Phép kiểm "không nhỏ hơn tháng trước" phải CHẶN. KPI là số lũy kế; đi
      lùi nghĩa là đơn vị rút bớt cam kết của chính mình mà không ai thấy.
    • Sửa KPI xong thì BẢNG TỔNG HỢP phải đổi theo. Cột (7) của mẫu là số
      đăng ký và cột (8) chia cho nó; màn cho sửa mà bảng giữ số cũ thì người
      dùng kết luận nút Lưu không chạy.
  */
  {
    await page.goto(`${base}/?view=risk&muc=kpi`, { waitUntil: "networkidle0" });
    await page.waitForSelector(".ql1-ds-table tbody tr");
    const cv = await page.evaluate(() => ({
      coO: document.querySelectorAll(".ql1-ds-table tbody input").length,
      cot: [...document.querySelectorAll(".ql1-ds-table thead th")].map((th) => th.textContent.trim()),
      dem: document.querySelector(".panel-head")?.textContent?.match(/(\d+)\/(\d+) đơn vị đã đăng ký/) ?? null,
    }));
    if (!cv.coO) throw new Error("Chuyên viên QL3 không nhập được KPI — màn không có ô nhập nào.");
    if (!cv.dem) throw new Error("Màn KPI không đếm số đơn vị đã đăng ký — phép kiểm \"đủ 30 đơn vị\" của M-Q3-02.");
    for (const c of ["Đơn vị", "Đã hoàn thành", "Tình trạng"]) {
      if (!cv.cot.includes(c)) throw new Error(`Màn KPI thiếu cột "${c}": ${JSON.stringify(cv.cot)}`);
    }

    /* Nhập một số nhỏ hơn kỳ trước: phải bị chặn, và phải nói đơn vị nào. */
    const kyTruoc = await page.evaluate(() => {
      const tr = document.querySelector(".ql1-ds-table tbody tr");
      return Number((tr.children[1].textContent || "").replace(/\./g, "")) || 0;
    });
    if (kyTruoc > 0) {
      await page.evaluate((v) => {
        const o = document.querySelector(".ql1-ds-table tbody input");
        const dat = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        dat.call(o, String(v));
        o.dispatchEvent(new Event("input", { bubbles: true }));
      }, kyTruoc - 1);
      await page.evaluate(() => [...document.querySelectorAll(".panel-head button")].find((b) => /Lưu KPI/.test(b.textContent || "")).click());
      const chan = await page.evaluate(() => document.querySelector(".quality-note")?.textContent ?? "");
      if (!/nhỏ hơn/.test(chan)) throw new Error(`KPI lùi so với kỳ trước mà vẫn lưu được: ${JSON.stringify(chan)}`);
      if (!/Phòng|Thuế cơ sở/.test(chan)) throw new Error(`Báo lỗi KPI không nói đơn vị nào: ${JSON.stringify(chan)}`);
    }

    /* Nhập một số hợp lệ rồi lưu: bảng tổng hợp phải đổi theo. */
    const moi = kyTruoc + 777;
    await page.evaluate((v) => {
      const o = document.querySelector(".ql1-ds-table tbody input");
      const dat = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      dat.call(o, String(v));
      o.dispatchEvent(new Event("input", { bubbles: true }));
    }, moi);
    await page.evaluate(() => [...document.querySelectorAll(".panel-head button")].find((b) => /Lưu KPI/.test(b.textContent || "")).click());
    await page.waitForFunction(() => /Đã ghi KPI/.test(document.querySelector(".toast")?.textContent || ""), { timeout: 5000 });

    await page.goto(`${base}/?view=tonghopql3`, { waitUntil: "networkidle0" });
    await page.waitForSelector(".ql1-table tbody tr");
    const coTrenBang = await page.evaluate((v) => {
      const la = [...document.querySelectorAll(".ql1-table thead tr:last-child th")].map((th) => th.textContent.trim());
      const cot = la.findIndex((t) => /KPI/i.test(t));
      if (cot === -1) return null;
      return [...document.querySelectorAll(".ql1-table tbody tr")]
        .some((tr) => Number((tr.children[cot + 1]?.textContent || "").replace(/\./g, "")) === v);
    }, moi);
    if (coTrenBang === null) throw new Error("Bảng tổng hợp QL3 không có cột KPI.");
    if (!coTrenBang) throw new Error(`Sửa KPI thành ${moi} nhưng bảng tổng hợp không đổi theo.`);

    /* Trưởng phòng ĐỌC, không nhập. */
    await dangXuat(page);
    await dangNhap(page, "tp.ql3");
    await page.goto(`${base}/?view=risk&muc=kpi`, { waitUntil: "networkidle0" });
    await page.waitForSelector(".ql1-ds-table tbody tr");
    const tp = await page.evaluate(() => ({
      coO: document.querySelectorAll(".ql1-ds-table tbody input").length,
      coLuu: [...document.querySelectorAll("button")].some((b) => /Lưu KPI/.test(b.textContent || "")),
    }));
    if (tp.coO || tp.coLuu) throw new Error("Trưởng phòng QL3 nhập được KPI, đáng lẽ chỉ đọc.");
  }


  await dangXuat(page);
  await dangNhap(page, "cv.ql1");
}

await browser.close();
if (errors.length) throw new Error(`JavaScript errors: ${errors.slice(0, 3).join(" | ")}`);
console.log(`✓ ${MAN_QL1.length} màn QL1 và ${MAN_QL3.length} màn QL3 đạt kiểm tra; danh mục CQT theo Phụ lục A, vòng đời báo cáo bốn trạng thái của BC-06, và luật bố cục chung của bốn phân hệ đều đúng.`);
