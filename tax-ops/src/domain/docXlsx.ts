/*
  Đọc tệp .xlsx ngay trên trình duyệt, không thêm thư viện: .xlsx là một tệp
  zip chứa XML. Giải nén bằng `DecompressionStream("deflate-raw")` có sẵn của
  trình duyệt, đọc XML bằng `DOMParser`. Chỉ lấy GIÁ TRỊ ô (chuỗi hoặc số) —
  đủ cho việc kiểm tra tệp nhập theo mẫu; không đọc định dạng, công thức.
*/

export type GiaTriO = string | number;
export interface SheetDoc { ten: string; o: Map<string, GiaTriO> }

async function giaiNen(buf: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const v = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65_557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Tệp không phải Excel (.xlsx) hợp lệ.");
  const soMuc = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const out = new Map<string, Uint8Array>();
  const td = new TextDecoder();
  for (let k = 0; k < soMuc; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const cach = v.getUint16(p + 10, true), nen = v.getUint32(p + 20, true);
    const dTen = v.getUint16(p + 28, true), dPhu = v.getUint16(p + 30, true), dGhi = v.getUint16(p + 32, true);
    const dau = v.getUint32(p + 42, true);
    const ten = td.decode(new Uint8Array(buf, p + 46, dTen));
    const batDau = dau + 30 + v.getUint16(dau + 26, true) + v.getUint16(dau + 28, true);
    const tho = new Uint8Array(buf, batDau, nen);
    if (cach === 0) out.set(ten, tho);
    else if (cach === 8) {
      const s = new Blob([tho]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      out.set(ten, new Uint8Array(await new Response(s).arrayBuffer()));
    }
    p += 46 + dTen + dPhu + dGhi;
  }
  return out;
}

const xml = (b: Uint8Array | undefined) => (b ? new DOMParser().parseFromString(new TextDecoder().decode(b), "application/xml") : null);
const chuCuaNut = (n: Element) => [...n.getElementsByTagName("t")].map((t) => t.textContent ?? "").join("");

export async function docXlsx(tep: File): Promise<SheetDoc[]> {
  const z = await giaiNen(await tep.arrayBuffer());
  const wb = xml(z.get("xl/workbook.xml"));
  const rels = xml(z.get("xl/_rels/workbook.xml.rels"));
  if (!wb || !rels) throw new Error("Tệp không phải Excel (.xlsx) hợp lệ.");
  const dich = new Map([...rels.getElementsByTagName("Relationship")].map((r) => [r.getAttribute("Id"), r.getAttribute("Target") ?? ""]));
  const chung = [...(xml(z.get("xl/sharedStrings.xml"))?.getElementsByTagName("si") ?? [])].map(chuCuaNut);
  return [...wb.getElementsByTagName("sheet")].map((s) => {
    const rid = s.getAttribute("r:id") ?? [...s.attributes].find((a) => a.name.endsWith(":id"))?.value ?? "";
    const dg = (dich.get(rid) ?? "").replace(/^\/?xl\//, "");
    const doc = xml(z.get(`xl/${dg}`));
    const o = new Map<string, GiaTriO>();
    for (const c of doc?.getElementsByTagName("c") ?? []) {
      const ref = c.getAttribute("r"), t = c.getAttribute("t");
      const val = c.getElementsByTagName("v")[0]?.textContent ?? null;
      if (!ref) continue;
      if (t === "s" && val !== null) o.set(ref, chung[Number(val)] ?? "");
      else if (t === "inlineStr") o.set(ref, chuCuaNut(c));
      else if (t === "str" && val !== null) o.set(ref, val);
      else if (t === "b" && val !== null) o.set(ref, val === "1" ? "TRUE" : "FALSE");
      else if (val !== null && val !== "") o.set(ref, Number(val));
    }
    return { ten: s.getAttribute("name") ?? "", o };
  });
}

/** Ngày từ ô: số sê-ri Excel hoặc chuỗi dd/mm/yyyy. `null` nếu không đọc được. */
export function ngayTuO(x: GiaTriO | undefined): Date | null {
  if (typeof x === "number" && x > 20_000 && x < 80_000) return new Date(Date.UTC(1899, 11, 30) + x * 86_400_000);
  const m = typeof x === "string" ? x.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/) : null;
  if (!m) return null;
  const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return d.getUTCDate() === +m[1] ? d : null;
}
