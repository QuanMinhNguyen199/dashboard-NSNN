/* Tax Ops — Khôi phục component (23/11/2026).
   Tìm mọi instance trên mọi trang có main component đã bị xóa, rồi lấy lại main component đó.
   1. Quét: chỉ đọc, không sửa gì. Báo cáo số instance theo từng component và trang.
   2. Khôi phục:
      A. Main component đã xóa nhưng Figma còn giữ (instance vẫn trỏ tới) → đưa về trang "Khôi phục component".
         Giữ nguyên id nên mọi instance tự nối lại, không mất ghi đè. Nếu Figma không cho đưa về, tạo bản sao
         và swap instance sang bản sao (ghi đè giữ theo tên lớp).
      B. (Tùy chọn, mặc định tắt) Instance không còn main nào → dựng lại component từ một instance mẫu và swap
         các instance cùng tên, cùng cấu trúc sang đó. Đây là dựng lại, không phải bản gốc; nên ưu tiên
         Version history nếu cần đúng bản gốc.
   Plugin không xóa gì. Có thể Undo (Ctrl/Cmd+Z). */
const UI = `<!doctype html><meta charset="utf-8"><style>
body{font:12px/1.45 Inter,system-ui,sans-serif;margin:0;padding:12px;color:#1b1f24}
h1{font-size:13px;margin:0 0 6px}p{margin:0 0 8px;color:#4a5563}
.row{display:flex;gap:8px;margin:8px 0}button{font:inherit;padding:7px 12px;border-radius:6px;border:1px solid #c9ced6;background:#fff;cursor:pointer}
button.pri{background:#0d5bd7;border-color:#0d5bd7;color:#fff}button:disabled{opacity:.45;cursor:default}
label{display:flex;gap:6px;align-items:flex-start;margin:6px 0}
textarea{width:100%;box-sizing:border-box;height:330px;font:11px/1.4 ui-monospace,Consolas,monospace;border:1px solid #c9ced6;border-radius:6px;padding:8px;white-space:pre}
#st{font-weight:600;margin:4px 0}</style>
<h1>Khôi phục component đã xóa</h1>
<p>Bấm Quét trước (chỉ đọc). Kiểm báo cáo rồi mới bấm Khôi phục. Plugin không xóa gì; có thể Undo.</p>
<div class="row"><button id="quet" class="pri">1. Quét</button><button id="khoiphuc" disabled>2. Khôi phục</button><button id="chep">Chép báo cáo</button></div>
<label><input type="checkbox" id="dunglai"><span>Dựng lại cả component <b>không còn main</b> từ instance mẫu (không phải bản gốc — ưu tiên Version history nếu cần bản gốc)</span></label>
<div id="st">Chưa quét.</div><textarea id="bc" readonly></textarea>
<script>
const $=id=>document.getElementById(id);
$('quet').onclick=()=>{$('quet').disabled=$('khoiphuc').disabled=true;$('st').textContent='Đang quét…';parent.postMessage({pluginMessage:{type:'quet'}},'*');};
$('khoiphuc').onclick=()=>{$('quet').disabled=$('khoiphuc').disabled=true;$('st').textContent='Đang khôi phục…';parent.postMessage({pluginMessage:{type:'khoiphuc',dungLai:$('dunglai').checked}},'*');};
$('chep').onclick=()=>{$('bc').select();document.execCommand('copy');$('st').textContent='Đã chép báo cáo.';};
onmessage=e=>{const m=e.data.pluginMessage;if(!m)return;if(m.st)$('st').textContent=m.st;if(m.bc!=null)$('bc').value=m.bc;if(m.xong){$('quet').disabled=false;$('khoiphuc').disabled=!m.coViec;}};
</script>`;

figma.showUI(UI, { width: 480, height: 600 });
const gui = (o) => figma.ui.postMessage(o);
const trangCua = (n) => { for (let p = n; p; p = p.parent) if (p.type === 'PAGE') return p; return null; };
const gocCua = (m) => (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m);
const tenGoc = (m) => { const g = gocCua(m); return g === m ? m.name : g.name + ' › ' + m.name; };
const trongInstance = (n) => { for (let p = n.parent; p && p.type !== 'PAGE'; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };
/* Chữ ký cấu trúc của instance mất main: tên + kích thước + tên/loại lớp con 2 tầng. */
const chuKy = (n) => n.name + '|' + Math.round(n.width) + 'x' + Math.round(n.height) + '|' + ('children' in n ? n.children.map((c) => c.type[0] + ':' + c.name + ('children' in c ? '(' + c.children.map((d) => d.type[0] + ':' + d.name).join(',') + ')' : '')).join(';') : '');

let KQ = null;
async function quet() {
  const moCoi = new Map(); // id gốc → {goc, ten, dem, trang:Set, inst:[]}
  const matMain = new Map(); // chữ ký → {ten, dem, trang:Set, inst:[]}
  let tong = 0, thuVien = 0;
  const trang = figma.root.children;
  for (let i = 0; i < trang.length; i++) {
    const p = trang[i];
    gui({ st: 'Đang quét trang ' + (i + 1) + '/' + trang.length + ': ' + p.name });
    await p.loadAsync();
    for (const it of p.findAllWithCriteria({ types: ['INSTANCE'] })) {
      tong++;
      let m = null;
      try { m = await it.getMainComponentAsync(); } catch (e) { m = null; }
      if (!m) { const k = chuKy(it); const o = matMain.get(k) || { ten: it.name, dem: 0, trang: new Set(), inst: [] }; o.dem++; o.trang.add(p.name); o.inst.push(it); matMain.set(k, o); continue; }
      if (m.remote) { thuVien++; continue; }
      const g = gocCua(m);
      if (trangCua(g)) continue;
      const o = moCoi.get(g.id) || { goc: g, ten: g.name, dem: 0, trang: new Set(), inst: [] };
      o.dem++; o.trang.add(p.name); o.inst.push(it); moCoi.set(g.id, o);
    }
  }
  KQ = { moCoi, matMain, tong, thuVien };
  return KQ;
}
function baoCaoQuet(k) {
  const L = ['KHÔI PHỤC COMPONENT — QUÉT', 'Thời điểm: ' + new Date().toLocaleString('vi-VN'), 'File: ' + figma.root.name, '',
    'Đã quét ' + k.tong + ' instance trên ' + figma.root.children.length + ' trang (' + k.thuVien + ' instance dùng thư viện ngoài — bỏ qua).', ''];
  const a = [...k.moCoi.values()].sort((x, y) => y.dem - x.dem);
  L.push('A. Main đã xóa nhưng Figma còn giữ — khôi phục được nguyên bản: ' + a.length + ' component, ' + a.reduce((s, o) => s + o.dem, 0) + ' instance');
  for (const o of a) L.push('   • ' + o.ten + ' — ' + o.dem + ' instance · trang: ' + [...o.trang].join(', '));
  const b = [...k.matMain.values()].sort((x, y) => y.dem - x.dem);
  L.push('', 'B. Instance không còn main — chỉ dựng lại được từ instance mẫu: ' + b.length + ' nhóm, ' + b.reduce((s, o) => s + o.dem, 0) + ' instance');
  for (const o of b.slice(0, 60)) L.push('   • ' + o.ten + ' — ' + o.dem + ' instance · trang: ' + [...o.trang].join(', '));
  if (b.length > 60) L.push('   … và ' + (b.length - 60) + ' nhóm nữa');
  if (!a.length && !b.length) L.push('', 'Không có instance nào mất main component.');
  return L.join('\n');
}
async function napFont(n) {
  const texts = n.type === 'TEXT' ? [n] : 'findAllWithCriteria' in n ? n.findAllWithCriteria({ types: ['TEXT'] }) : [];
  const seen = new Set();
  for (const t of texts) {
    let fonts = [];
    try { fonts = t.getRangeAllFontNames(0, t.characters.length); } catch (e) { if (t.fontName && t.fontName !== figma.mixed) fonts = [t.fontName]; }
    for (const f of fonts) { const key = f.family + '|' + f.style; if (seen.has(key)) continue; seen.add(key); try { await figma.loadFontAsync(f); } catch (e) {} }
  }
}
async function khoiPhuc(dungLai) {
  const k = KQ || (await quet());
  const L = ['KHÔI PHỤC COMPONENT — KẾT QUẢ', 'Thời điểm: ' + new Date().toLocaleString('vi-VN'), 'File: ' + figma.root.name, ''];
  const ten = 'Khôi phục component — ' + (() => { const d = new Date(), h = (v) => String(v).padStart(2, '0'); return d.getFullYear() + '-' + h(d.getMonth() + 1) + '-' + h(d.getDate()) + ' ' + h(d.getHours()) + ':' + h(d.getMinutes()); })();
  const trang = figma.createPage(); trang.name = ten;
  let x = 0, y = 0, hangCao = 0;
  const datCho = (n) => { if (x > 0 && x + n.width > 6000) { x = 0; y += hangCao + 160; hangCao = 0; } n.x = x; n.y = y; x += n.width + 160; hangCao = Math.max(hangCao, n.height); };
  let nguyen = 0, saoCo = 0, loiA = 0, swapA = 0;
  L.push('A. Main đã xóa nhưng Figma còn giữ:');
  for (const o of k.moCoi.values()) {
    gui({ st: 'Khôi phục ' + o.ten + '…' });
    try {
      await napFont(o.goc);
      trang.appendChild(o.goc); datCho(o.goc); nguyen++;
      L.push('   ✓ ' + o.ten + ' — đưa về nguyên bản, ' + o.dem + ' instance tự nối lại');
    } catch (e) {
      try {
        const ban = o.goc.clone(); trang.appendChild(ban); datCho(ban); ban.name = o.ten; saoCo++;
        let ok = 0, hong = 0;
        for (const it of o.inst) {
          try {
            const m = await it.getMainComponentAsync();
            const dich = ban.type === 'COMPONENT_SET' ? ban.children.find((c) => c.name === m.name) : ban;
            if (!dich) { hong++; continue; }
            await napFont(it); it.swapComponent(dich); ok++;
          } catch (e2) { hong++; }
        }
        swapA += ok;
        L.push('   ~ ' + o.ten + ' — Figma không cho đưa về (' + String(e.message || e) + '); tạo bản sao, swap ' + ok + '/' + o.dem + ' instance' + (hong ? ', ' + hong + ' lỗi' : ''));
      } catch (e3) { loiA++; L.push('   ✗ ' + o.ten + ' — không khôi phục được: ' + String(e3.message || e3)); }
    }
  }
  if (!k.moCoi.size) L.push('   (không có)');
  let dung = 0, swapB = 0, loiB = 0;
  L.push('', 'B. Instance không còn main:');
  if (!dungLai) L.push('   Bỏ qua (chưa bật tùy chọn dựng lại). ' + k.matMain.size + ' nhóm, ' + [...k.matMain.values()].reduce((s, o) => s + o.dem, 0) + ' instance — nên lấy từ Version history.');
  else for (const o of k.matMain.values()) {
    gui({ st: 'Dựng lại ' + o.ten + '…' });
    try {
      const mau = o.inst.find((it) => !it.removed && !trongInstance(it)) || o.inst.find((it) => !it.removed);
      if (!mau) { loiB++; continue; }
      await napFont(mau);
      const ban = mau.clone(); trang.appendChild(ban);
      const khung = ban.detachInstance();
      const comp = figma.createComponentFromNode(khung); comp.name = o.ten + ' (dựng lại)'; datCho(comp); dung++;
      let ok = 0, hong = 0;
      for (const it of o.inst) { try { if (it.removed) continue; await napFont(it); it.swapComponent(comp); ok++; } catch (e) { hong++; } }
      swapB += ok;
      L.push('   ✓ ' + o.ten + ' — dựng lại từ instance trên trang ' + trangCua(mau).name + ', swap ' + ok + '/' + o.dem + (hong ? ', ' + hong + ' lỗi' : ''));
    } catch (e) { loiB++; L.push('   ✗ ' + o.ten + ' — ' + String(e.message || e)); }
  }
  L.push('', 'TÓM TẮT', 'Trang mới: "' + ten + '"',
    'A: ' + nguyen + ' component đưa về nguyên bản, ' + saoCo + ' qua bản sao (swap ' + swapA + ' instance), ' + loiA + ' lỗi.',
    'B: ' + (dungLai ? dung + ' component dựng lại, swap ' + swapB + ' instance, ' + loiB + ' lỗi.' : 'không chạy.'),
    'Kiểm lại: chạy Quét lần nữa — mục A phải về 0.');
  KQ = null;
  return L.join('\n');
}
figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'quet') { const k = await quet(); const coViec = k.moCoi.size > 0 || k.matMain.size > 0; gui({ bc: baoCaoQuet(k), st: coViec ? 'Quét xong. Kiểm báo cáo rồi bấm Khôi phục.' : 'Quét xong — không có gì cần khôi phục.', xong: true, coViec }); }
    if (msg.type === 'khoiphuc') { const bc = await khoiPhuc(!!msg.dungLai); gui({ bc, st: 'Xong. Chép báo cáo dán lại để kiểm tra.', xong: true, coViec: false }); }
  } catch (e) { gui({ st: 'Lỗi: ' + String(e.message || e), bc: String(e.stack || e), xong: true, coViec: false }); }
};
