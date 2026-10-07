/*
  Soát toàn bộ web qua TỪNG tài khoản.

  Khác `acceptance.mjs` ở mục đích: cổng nghiệm thu khẳng định những điều đã
  biết là đúng, còn tệp này đi tìm thứ chưa ai nhìn — nó không ném lỗi mà in
  ra một danh sách phát hiện, nên một lượt chạy thấy được hết thay vì dừng ở
  cái đầu tiên.

  Bốn nhóm phát hiện:
    TRAN      — trang hoặc ô tràn khỏi khung
    DINH      — cột dính để lọt nội dung chạy phía dưới
    CHAM      — vùng chạm dưới ngưỡng
    TUONGPHAN — chữ trên nền không đủ tương phản
    CAO       — hai khối cạnh nhau lệch chân
*/
import puppeteer from "puppeteer-core";

const base = (process.argv[2] ?? "http://127.0.0.1:5174").replace(/\/+$/, "");
const TAI_KHOAN = ["cv.ql1", "tp.ql1", "cv.ql2", "tp.ql2", "cv.ql3", "tp.ql3", "cv.ql4", "tp.ql4", "vanhanh.dulieu"];
const KHO = [{ w: 1512, h: 1000, m: false }, { w: 1280, h: 900, m: false }, { w: 390, h: 844, m: true }];

const phat = [];
const bao = (loai, cho, chiTiet) => phat.push({ loai, cho, chiTiet });

const browser = await puppeteer.launch({ channel: "chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
const loiJs = [];
page.on("pageerror", (e) => loiJs.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") loiJs.push(m.text()); });

async function dangNhap(ma) {
  await page.goto(`${base}/`, { waitUntil: "networkidle0" });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector(".demo-accounts-list");
  await page.evaluate((m) => {
    [...document.querySelectorAll(".demo-accounts-list button")]
      .find((b) => b.querySelector("code")?.textContent?.trim() === m)?.click();
  }, ma);
  await page.waitForSelector(".workspace");
}

/*
  Đi bằng URL chứ không bấm điều hướng. Ở khổ hẹp thanh đáy chỉ chứa năm mục
  đầu, phần còn lại nằm trong ngăn kéo — bấm theo tên sẽ im lặng không đổi màn
  và lượt soát báo cùng một lỗi ba lần cho ba màn khác nhau.
*/
const MAN = ["workbench", "debt", "tonghopql3", "hoadon", "risk", "hoan", "tinhtrang", "phieu", "giamsat"];

/* Danh sách mục con của màn đang mở, để soát cả những tab không mở sẵn. */
const mucCua = () => page.evaluate(() =>
  [...document.querySelectorAll('[aria-label^="Mục "] button')].map((b) => b.textContent?.trim() ?? ""));

const moMuc = async (ten) => {
  await page.evaluate((t) => {
    [...document.querySelectorAll('[aria-label^="Mục "] button')].find((b) => b.textContent?.trim() === t)?.click();
  }, ten);
  await new Promise((r) => setTimeout(r, 260));
};

async function soatMan(nhan, kho) {
  const ket = await page.evaluate(({ isMobile }) => {
    /* Độ sáng tương đối theo WCAG, để tính tỷ số tương phản. */
    const sang = (c) => {
      const m = c.match(/\d+(\.\d+)?/g);
      if (!m) return null;
      const [r, g, b, a] = m.map(Number);
      if (a === 0) return null;
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    /* Nền thật của chữ: leo lên cho tới tổ tiên đầu tiên có nền đục. */
    const nenCua = (el) => {
      let n = el;
      while (n && n !== document.documentElement) {
        const l = sang(getComputedStyle(n).backgroundColor);
        if (l !== null) return l;
        n = n.parentElement;
      }
      return 1;
    };
    const ra = { tran: false, oTran: [], cham: [], dinh: [], tuongPhan: [], cao: [] };
    const doc = document.documentElement;
    ra.tran = doc.scrollWidth > doc.clientWidth + 1;

    /*
      Ô tràn: nội dung rộng hơn ô chứa nó.

      Trừ hai thứ. Một, vùng bấm cả hàng (`.row-select`, `.dv-nut`) CỐ Ý nới
      rộng hơn ô 24px rồi kéo lại bằng lề âm, nên nó luôn tạo ra 2px scroll mà
      không có chữ nào bị cắt. Hai, ngưỡng 4px: dưới mức đó là sai số làm tròn
      của bố cục bảng, không phải chữ mất đuôi.
    */
    /*
      Khối con tràn ra ngoài khối chứa nó.

      Nhiều dải trong hệ cố ý mang `margin-inline: -14px` để chạm hẳn mép khối
      — luật ấy chỉ đúng khi khối cha có đệm ngang đúng 14px. Đặt một dải như
      thế vào khối cha đệm 0 thì nó thò ra ngoài thẻ, và lỗi này KHÔNG hiện ra
      ở phép đo tràn trong ô: từng ô vẫn vừa khít, chỉ cả bảng là nằm sai chỗ.
    */
    for (const el of document.querySelectorAll(".table-shell, .the-luoi, .task-list, .source-list, .rank-list, .detail-grid, .blocker-list")) {
      const cha = el.parentElement;
      if (!cha) continue;
      const a = el.getBoundingClientRect();
      const c = cha.getBoundingClientRect();
      const du = Math.round(Math.max(c.left - a.left, a.right - c.right));
      if (du > 1) ra.oTran.push(`${el.className.split(" ")[0]} thò ra ngoài ${cha.className.split(" ")[0] || cha.tagName.toLowerCase()} ${du}px`);
    }

    for (const o of document.querySelectorAll("main td, main th")) {
      const du = o.scrollWidth - o.clientWidth;
      if (du <= 4) continue;
      if (o.querySelector(".row-select, .dv-nut") && du <= 26) continue;
      ra.oTran.push(`${(o.textContent || "").trim().slice(0, 26)} (+${du}px)`);
    }

    /* Cột dính: có nội dung nào nằm BÊN TRÁI mép trái của ô dính mà vẫn hiện
       không? Nếu có, cột dính đang để lọt phần đang cuộn phía dưới. */
    for (const bang of document.querySelectorAll("main table")) {
      const dinh = [...bang.querySelectorAll("thead th, tbody th, tbody td")]
        .filter((el) => getComputedStyle(el).position === "sticky" && getComputedStyle(el).left !== "auto");
      if (!dinh.length) continue;
      const wrap = bang.closest(".table-wrap");
      if (!wrap || wrap.scrollLeft === 0) continue;
      /*
        Hỏi trình duyệt phần tử nào đang NẰM TRÊN tại vài điểm bên trong cột
        dính. So tọa độ là không đủ: ô đã cuộn qua vẫn nằm bên trái cột dính về
        mặt hình học, nhưng nếu cột dính đục và cao hơn tầng thì nó bị che hoàn
        toàn — đó mới là hành vi đúng.
      */
      const o1 = dinh[0].getBoundingClientRect();
      for (const el of dinh.slice(0, 6)) {
        const r = el.getBoundingClientRect();
        for (const tx of [r.left + 3, r.left + r.width / 2, r.right - 3]) {
          const tren = document.elementFromPoint(tx, r.top + r.height / 2);
          /* Thanh điều hướng đáy là lớp phủ cố định, nó che mọi thứ ở đáy
             khung nhìn theo đúng thiết kế — không phải lỗi cột dính. */
          /*
            Bỏ qua hai trường hợp che hợp lệ: lớp phủ cố định (thanh điều
            hướng đáy, măng sét) và một ô DÍNH KHÁC — dòng tiêu đề dính che
            hàng đang cuộn qua nó là đúng việc của nó, không phải lỗi.
          */
          const laPhu = tren?.closest(".mobile-nav, .nav-scrim, .topbar");
          const oTren = tren?.closest("th, td");
          const laDinhKhac = oTren && getComputedStyle(oTren).position === "sticky";
          if (tren && !laPhu && !laDinhKhac && !el.contains(tren) && tren !== el) {
            const chu = (tren.textContent || "").trim();
            ra.dinh.push(`${bang.className}: "${chu.slice(0, 22)}" lọt lên trên cột dính`);
          }
        }
      }
      void o1;
    }

    /*
      Hai khối đặt CẠNH NHAU phải thẳng chân.

      Lệch chân từng được "sửa" bằng cách cho mỗi khối cao theo nội dung của
      chính nó — cách ấy đổi một lỗi lấy một lỗi khác, và lỗi mới chỉ nhìn mắt
      mới thấy. Nên nó có phép đo riêng: gom các khối cùng mép trên thành một
      hàng, rồi so mép dưới.
    */
    for (const lu of document.querySelectorAll(".tq-doi, .two-column, .workbench-grid")) {
      const hang = new Map();
      for (const c of lu.children) {
        const r = c.getBoundingClientRect();
        if (r.height <= 0) continue;
        const khoa = Math.round(r.top / 4);
        if (!hang.has(khoa)) hang.set(khoa, []);
        hang.get(khoa).push({ c, r });
      }
      for (const nhom of hang.values()) {
        if (nhom.length < 2) continue;
        const day = nhom.map((x) => x.r.bottom);
        const d = Math.round(Math.max(...day) - Math.min(...day));
        if (d > 2) {
          const ten = nhom.map((x) => (x.c.querySelector(".panel-head h2")?.textContent ?? "?").trim().slice(0, 18));
          ra.cao.push(`lệch chân ${d}px: ${ten.join(" | ")}`);
        }
      }
    }

    /* Vùng chạm. */
    const san = isMobile ? 44 : 28;
    for (const el of document.querySelectorAll("main button, main a[href], main select, main input, main summary")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.height < san - 0.5) {
        ra.cham.push(`${el.tagName.toLowerCase()}.${el.className || "—"} cao ${Math.round(r.height)}px`);
      }
    }

    /* Tương phản chữ trên nền. Chỉ soát phần tử có chữ thật. */
    for (const el of document.querySelectorAll("main *")) {
      if (el.children.length) continue;
      const chu = (el.textContent || "").trim();
      if (!chu) continue;
      const st = getComputedStyle(el);
      if (st.visibility === "hidden" || st.display === "none") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const lt = sang(st.color);
      const ln = nenCua(el);
      if (lt === null || ln === null) continue;
      const ts = (Math.max(lt, ln) + 0.05) / (Math.min(lt, ln) + 0.05);
      const co = parseFloat(st.fontSize);
      const dam = parseInt(st.fontWeight, 10) >= 700;
      const can = (co >= 24 || (co >= 18.66 && dam)) ? 3 : 4.5;
      if (ts < can) ra.tuongPhan.push(`"${chu.slice(0, 24)}" ${ts.toFixed(2)}:1 (cần ${can}) ${st.color} / ${Math.round(co)}px`);
    }
    return ra;
  }, { isMobile: kho.m });

  const cho = `${nhan} @${kho.w}`;
  if (ket.tran) bao("TRAN", cho, "trang tràn ngang");
  for (const x of [...new Set(ket.oTran)].slice(0, 4)) bao("TRAN", cho, `ô tràn: ${x}`);
  for (const x of [...new Set(ket.dinh)].slice(0, 4)) bao("DINH", cho, x);
  for (const x of [...new Set(ket.cham)].slice(0, 4)) bao("CHAM", cho, x);
  for (const x of [...new Set(ket.tuongPhan)].slice(0, 6)) bao("TUONGPHAN", cho, x);
  for (const x of [...new Set(ket.cao)].slice(0, 4)) bao("CAO", cho, x);
}

for (const tk of TAI_KHOAN) {
  await page.setViewport({ width: 1512, height: 1000 });
  await dangNhap(tk);
  for (const kho of KHO) {
    await page.setViewport({ width: kho.w, height: kho.h, isMobile: kho.m, hasTouch: kho.m });
    for (const ten of MAN) {
      await page.goto(`${base}/?view=${ten}`, { waitUntil: "networkidle0" });
      /* Màn không thuộc quyền tài khoản này rơi về màn mặc định; bỏ qua để
         không soát hai lần cùng một thứ. */
      const dung = await page.evaluate(() => new URLSearchParams(location.search).get("view"));
      if (dung !== ten) continue;
      const mucs = await mucCua();
      if (!mucs.length) {
        await soatMan(`${tk}/${ten}`, kho);
        continue;
      }
      for (const m of mucs) {
        await moMuc(m);
        /* Cuộn bảng sang phải để bắt lỗi cột dính — lỗi chỉ hiện khi đã cuộn. */
        await page.evaluate(() => {
          for (const w of document.querySelectorAll(".table-wrap")) w.scrollLeft = Math.min(400, w.scrollWidth);
        });
        await new Promise((r) => setTimeout(r, 120));
        await soatMan(`${tk}/${ten}/${m}`, kho);
      }
    }
  }
}

await browser.close();

const nhom = {};
for (const p of phat) (nhom[p.loai] ??= []).push(p);
for (const loai of ["TRAN", "DINH", "CHAM", "TUONGPHAN", "CAO"]) {
  const ds = nhom[loai] ?? [];
  console.log(`\n### ${loai} — ${ds.length} phát hiện`);
  const gon = new Map();
  for (const p of ds) gon.set(p.chiTiet, [...(gon.get(p.chiTiet) ?? []), p.cho]);
  for (const [ct, chos] of [...gon].slice(0, 22)) console.log(`  • ${ct}\n      ${chos.slice(0, 3).join(" · ")}${chos.length > 3 ? ` … +${chos.length - 3}` : ""}`);
}
if (loiJs.length) console.log(`\n### LỖI JS — ${loiJs.length}\n  ${[...new Set(loiJs)].slice(0, 5).join("\n  ")}`);
console.log(`\nTổng: ${phat.length} phát hiện trên ${TAI_KHOAN.length} tài khoản × ${KHO.length} khổ.`);
