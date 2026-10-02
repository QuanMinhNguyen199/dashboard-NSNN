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
  Màn đăng nhập còn đúng hai lối: Keycloak tượng trưng và sáu thẻ vai. Ô nhập
  đã gỡ, nên nếu nó quay lại thì đây là chỗ báo.
*/
const manDangNhap = await page.evaluate(() => ({
  soThe: document.querySelectorAll(".demo-accounts-list button").length,
  conOnhap: Boolean(document.querySelector('input[name="username"], input[name="password"]')),
  coKeycloak: Boolean(document.querySelector(".login-sso")),
}));
const expectedAccounts = new URL(page.url()).pathname.endsWith("/quan-ly/") ? 5 : 6;
if (manDangNhap.soThe !== expectedAccounts) throw new Error(`Màn đăng nhập có ${manDangNhap.soThe} thẻ vai, đáng lẽ ${expectedAccounts}.`);
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

/* `debt` KHÔNG nằm đây nữa: màn QL1 là báo cáo kỳ để đọc và kết xuất, mọi
   trường đã nằm trên chính hàng đó, nên nó không có thanh trượt chi tiết —
   xem kiểm riêng ở dưới. */
/* Chỉ còn một màn có thanh trượt chi tiết: Tình trạng dữ liệu. */
const DRAWER = ["tinhtrang"];
await inspect(1440, 1000, false, MAN_QL1);
for (const view of DRAWER) {
  await page.goto(`${base}/?view=${view}`, { waitUntil: "networkidle0" });
  /* Không còn cột chi tiết cố định ở bất kỳ khổ nào: chi tiết mở trong thanh
     trượt bên phải khi bấm một hàng. Kiểm bảng chiếm trọn bề ngang khối. */
  const bang = await page.evaluate(() => {
    const list = document.querySelector(".case-list")?.getBoundingClientRect();
    const workspace = document.querySelector(".workspace")?.getBoundingClientRect();
    return {
      conCot: document.querySelector(".case-detail") !== null,
      tronBeNgang: Boolean(list && workspace && list.width > workspace.width - 60),
    };
  });
  if (bang.conCot) throw new Error(`${view}: vẫn còn cột chi tiết cố định.`);
  if (!bang.tronBeNgang) throw new Error(`${view}: bảng chưa chiếm trọn bề ngang sau khi bỏ cột chi tiết.`);
  /* Đưa hàng vào GIỮA khung nhìn trước khi bấm. Thanh điều hướng đáy cố định
     phủ 62px cuối màn; để puppeteer tự cuộn thì cú bấm có thể rơi trúng thanh
     đó và nhảy sang màn khác — đúng như một người dùng bấm nhầm. */
  await page.$eval(".case-list tbody tr:nth-child(2) .row-select", (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.click(".case-list tbody tr:nth-child(2) .row-select");
  await page.waitForSelector(".case-detail-dialog[open]", { timeout: 5000 });
  const moDuoc = await page.evaluate(() => Boolean(document.querySelector(".case-detail-dialog .panel-head h2")));
  if (!moDuoc) throw new Error(`${view}: bấm hàng không mở được thanh trượt chi tiết trên desktop.`);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector(".case-detail-dialog")?.open, { timeout: 5000 });
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
const taiTayOPhanHe = await page.evaluate(() => [...document.querySelectorAll(".topbar button")].some((b) => /Tải tay|Nhập dữ liệu/.test(b.textContent || "")));
if (taiTayOPhanHe) throw new Error("Nút tải tay không được đứng ở măng sét — G12 ghi nó chỉ hiện khi nguồn thiếu.");
await page.goto(`${base}/?view=tinhtrang`, { waitUntil: "networkidle0" });
const mucTinhTrang = await page.evaluate(() => ({
  soMuc: document.querySelectorAll('[aria-label="Mục tình trạng dữ liệu"] button, [aria-label="Mục tình trạng dữ liệu"] option').length,
  coTaiTay: [...document.querySelectorAll("button")].some((b) => /Tải tệp bổ sung/.test(b.textContent || "")),
}));
if (mucTinhTrang.soMuc !== 3) throw new Error(`Màn Tình trạng dữ liệu có ${mucTinhTrang.soMuc} mục, đáng lẽ 3.`);
if (!mucTinhTrang.coTaiTay) throw new Error("Màn Tình trạng dữ liệu thiếu nút tải tay dự phòng dù đang có nguồn thiếu.");

await page.goto(`${base}/?view=workbench`, { waitUntil: "networkidle0" });
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, 0); });
await page.screenshot({ path: ".impeccable/review/desktop.png", fullPage: true });
await inspect(390, 844, true, MAN_QL1);
for (const view of DRAWER) {
  await page.goto(`${base}/?view=${view}`, { waitUntil: "networkidle0" });
  await page.$eval(".case-list tbody tr:nth-child(2) .row-select", (el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.click(".case-list tbody tr:nth-child(2) .row-select");
  await page.waitForSelector(".case-detail-dialog[open]");
  await new Promise((resolve) => setTimeout(resolve, 220));
  await page.screenshot({ path: `.impeccable/review/${view}-detail-mobile.png` });
  await page.keyboard.press("Escape");
  const restored = await page.evaluate(() => !document.querySelector(".case-detail-dialog")?.open && document.activeElement?.matches(".case-list tbody tr:nth-child(2) .row-select"));
  if (!restored) throw new Error(`${view}: đóng chi tiết chưa trả focus về hồ sơ đã chọn.`);
}

/* ---- Luồng duyệt ba bước (G10), chạy NGAY TRÊN phân hệ ---- */
/*
  Không còn màn "Báo cáo" riêng: mục 3 bản thiết kế vẽ luồng duyệt trên chính
  phân hệ của kỳ đang xem. Cổng kiểm vì thế đi đúng đường người dùng đi — mở
  phân hệ, đọc thanh duyệt, bấm nút ở đó.
*/
const trangThaiDuyet = () => page.$eval(".thanh-duyet .badge", (el) => el.textContent.trim());
const nutDuyet = () => page.$$eval(".duyet-nut button", (b) => b.map((x) => x.textContent.trim()));

await page.setViewport({ width: 1440, height: 1000 });
await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
await page.waitForSelector(".thanh-duyet");
if (await trangThaiDuyet() !== "Nháp") throw new Error("Kỳ chưa gửi phải ở trạng thái Nháp.");
const nutCV = await nutDuyet();
if (!nutCV.includes("Gửi trưởng phòng duyệt") || nutCV.includes("Duyệt và chốt số") || nutCV.includes("Trả lại")) {
  throw new Error(`Quyền chuyên viên trên thanh duyệt sai: ${JSON.stringify(nutCV)}`);
}
await page.evaluate(() => [...document.querySelectorAll(".duyet-nut button")].find((b) => b.textContent.trim() === "Gửi trưởng phòng duyệt").click());
if (await trangThaiDuyet() !== "Chờ duyệt") throw new Error("Gửi duyệt nhưng trạng thái kỳ chưa đổi.");
await page.screenshot({ path: ".impeccable/review/duyet-cv-da-gui.png" });
await dangXuat(page);

await dangNhap(page, "tp.ql1");
await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
await page.waitForSelector(".thanh-duyet");
if (await trangThaiDuyet() !== "Chờ duyệt") throw new Error("Trưởng phòng không thấy kỳ chuyên viên đã gửi.");
const nutTP = await nutDuyet();
if (!nutTP.includes("Duyệt và chốt số") || !nutTP.includes("Trả lại") || nutTP.includes("Gửi trưởng phòng duyệt")) {
  throw new Error(`Quyền trưởng phòng trên thanh duyệt sai: ${JSON.stringify(nutTP)}`);
}

/* Trả lại BẮT BUỘC có lý do — bản thiết kế ghi "Trả lại + lý do" trên sơ đồ. */
await page.evaluate(() => [...document.querySelectorAll(".duyet-nut button")].find((b) => b.textContent.trim() === "Trả lại").click());
await page.waitForSelector("dialog[open] input[name='lyDoTraLai']");
await page.evaluate(() => document.querySelector("dialog[open] .report-form button[type='submit']").click());
if (await page.$("dialog[open] .quality-note") === null) throw new Error("Trả lại không có lý do mà hệ vẫn cho qua.");
const lyDo = `Đề nghị làm rõ Thuế cơ sở 5 ${Date.now()}`;
await page.type("dialog[open] input[name='lyDoTraLai']", lyDo);
await page.evaluate(() => document.querySelector("dialog[open] .report-form button[type='submit']").click());
await page.waitForFunction(() => !document.querySelector("dialog[open]"));
if (await trangThaiDuyet() !== "Nháp") throw new Error("Trả lại nhưng trạng thái kỳ chưa về Nháp.");
await dangXuat(page);

/* Chuyên viên phải ĐỌC ĐƯỢC lý do bị trả lại, nếu không vòng duyệt thứ hai
   hỏng y như vòng thứ nhất. */
await dangNhap(page, "cv.ql1");
await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
await page.waitForSelector(".thanh-duyet");
const thayLyDo = await page.evaluate((l) => (document.querySelector(".duyet-tralai")?.textContent ?? "").includes(l), lyDo);
if (!thayLyDo) throw new Error("Chuyên viên không thấy lý do trưởng phòng trả lại.");
await page.evaluate(() => [...document.querySelectorAll(".duyet-nut button")].find((b) => b.textContent.trim() === "Gửi trưởng phòng duyệt").click());
await dangXuat(page);

await dangNhap(page, "tp.ql1");
await page.goto(`${base}/?view=debt`, { waitUntil: "networkidle0" });
await page.waitForSelector(".thanh-duyet");
await page.evaluate(() => [...document.querySelectorAll(".duyet-nut button")].find((b) => b.textContent.trim() === "Duyệt và chốt số").click());
if (await trangThaiDuyet() !== "Đã chốt") throw new Error("Chốt số nhưng trạng thái kỳ chưa đổi.");
/* Đã chốt là điểm cuối: không còn thao tác nào đẩy nó đi tiếp được nữa. */
if ((await nutDuyet()).length) throw new Error("Kỳ đã chốt vẫn còn nút đẩy trạng thái.");
await page.screenshot({ path: ".impeccable/review/duyet-tp-da-chot.png" });
await dangXuat(page);

/* ---- Phòng QL3 mở màn của mình và không mở màn của QL1 ---- */
await dangNhap(page, "cv.ql3");
await inspect(1440, 1000, false, MAN_QL3);

/* Màn QL3: bốn mục của §5.2, bảng kết quả đúng 17 cột của mẫu kết xuất. */
await page.goto(`${base}/?view=risk`, { waitUntil: "networkidle0" });
const ql3TongQuan = await page.evaluate(() => ({
  soTab: document.querySelectorAll('[aria-label="Mục của báo cáo kiểm tra tại bàn"] button, [aria-label="Mục của báo cáo kiểm tra tại bàn"] option').length,
  soThe: document.querySelectorAll(".the-so").length,
  /* Ba nội dung của QLDN2 không được nằm ở màn QL3 — BRD mục 8 xếp chúng ở
     phòng khác, và bản demo đang nói về phân công giữa các phòng. */
  lanSangQL2: /Hệ số K|Xác minh hóa đơn/.test(document.body.textContent || ""),
}));
if (ql3TongQuan.soTab !== 4) throw new Error(`Màn QL3 có ${ql3TongQuan.soTab} mục, đáng lẽ 4.`);
if (ql3TongQuan.soThe < 5) throw new Error(`Tab Tổng quan QL3 chỉ có ${ql3TongQuan.soThe} thẻ số.`);
if (ql3TongQuan.lanSangQL2) throw new Error("Màn QL3 vẫn mang nội dung của phòng QLDN2.");

await moMuc("Kết quả tổng hợp");
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

await browser.close();
if (errors.length) throw new Error(`JavaScript errors: ${errors.slice(0, 3).join(" | ")}`);
console.log(`✓ ${MAN_QL1.length} màn QL1 và ${MAN_QL3.length} màn QL3 đạt kiểm tra; QL1 7 mục, QL3 4 mục với bảng 17 cột, bốn màn đã gỡ không còn lối vào, và luồng duyệt chạy trên chính phân hệ.`);
