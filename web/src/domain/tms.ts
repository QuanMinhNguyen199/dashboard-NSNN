import catalog from "./tms-catalog.json";
import joins from "./tms-joins.json";
import { CRUDE_OIL_ITEMS, DOMESTIC_ITEMS } from "./catalog";

/**
 * Danh mục và quy tắc TMS — Chương, cấp quản lý, Mục và Tiểu mục.
 *
 * Danh mục ở `tms-catalog.json` được rút từ đặc tả kỹ thuật nội bộ: 104 Chương
 * chia theo bốn cấp, 37 Mục và 180 Tiểu mục. File này chỉ tra cứu và suy diễn,
 * không tự đặt thêm mã hay tên.
 *
 * Ba luật của phụ lục nghiệp vụ được cài đặt thành kiểu dữ liệu ở đây:
 *
 * 1. **Cấp quản lý đến từ danh mục, không từ dải mã.** Một Chương không có bản
 *    ghi thì `level` là `null` — "chưa xác định cấp" — chứ không được suy ra từ
 *    con số. Dải 001–399 chỉ mô tả cách danh mục hiện tại được nhóm.
 * 2. **Chương không sở hữu Mục.** Quan hệ duy nhất là Tiểu mục thuộc Mục; cấp
 *    quản lý và Mục gặp nhau ở dòng giao dịch, nên đường xem Cấp → Mục → Tiểu
 *    mục đi qua giao dịch chứ không qua danh mục.
 * 3. **Không tích ghép.** Cặp (Chương, Tiểu mục) là tập thưa dựng từ điều kiện
 *    báo cáo, không phải mọi Chương nhân với mọi Tiểu mục.
 */

export type ManagementLevel = "trung-uong" | "tinh" | "xa";

/**
 * Bộ lọc có thêm `dia-phuong` vì bốn cấp KHÔNG ngang hàng nhau.
 *
 * Danh mục chia làm hai tầng: trung ương, và địa phương gồm tỉnh, huyện, xã.
 * Bày các cấp ngang nhau là nói rằng thành phố và phường/xã là hai nhánh song
 * song với trung ương, trong khi cả hai nằm bên trong địa phương. Cùng hình
 * dạng với cấp ngân sách NSTW/NSĐP mà dashboard đã dùng — nhưng là hai TRƯỜNG
 * khác nhau, xem `correspondence` ở lớp dữ liệu.
 */
export type ManagementLevelFilter = ManagementLevel | "all" | "dia-phuong";

export interface ManagementLevelDef {
  id: ManagementLevel;
  name: string;
  /** Dải mã của danh mục đang đối chiếu — thông tin tra cứu, không phải phép suy. */
  range: string;
}

/**
 * Ba cấp của danh mục, đặt tên theo mô hình chính quyền hai cấp của Hà Nội.
 *
 * Cấp huyện đã bỏ. Từ 07/2025 Hà Nội chạy mô hình hai cấp — thành phố và
 * phường/xã — nên một nút lọc "Cấp huyện" là mời người dùng đi vào một nhánh
 * không còn tồn tại. Trong danh mục 104 Chương cũng chỉ có ĐÚNG MỘT Chương
 * mang cấp huyện (757 · Hộ gia đình, cá nhân); nó đã chuyển sang phường/xã
 * trong `tms-catalog.json` theo hướng nhiệm vụ cấp huyện chuyển xuống xã.
 *
 * Chuyển chứ không bỏ, vì bỏ là mất tiền: cộng hai cấp con sẽ thiếu so với
 * dòng Địa phương, và không ai biết phần thiếu đi đâu.
 *
 * Dải mã giữ nguyên mã gốc của danh mục ngân sách, kể cả 600–799 nay không còn
 * cấp riêng — dải mã là thông tin tra cứu, không phải phép suy.
 */
const MANAGEMENT_LEVELS: ManagementLevelDef[] = [
  { id: "trung-uong", name: "Trung ương", range: "001–399" },
  { id: "tinh", name: "Thành phố", range: "400–599" },
  { id: "xa", name: "Phường/xã", range: "800–989, 757" },
];

/** Hai cấp nằm trong địa phương; tổng của chúng bằng đúng dòng địa phương. */
export const LOCAL_LEVELS: ManagementLevel[] = ["tinh", "xa"];

export const LEVEL_BY_ID = Object.fromEntries(MANAGEMENT_LEVELS.map((l) => [l.id, l])) as Record<
  ManagementLevel,
  ManagementLevelDef
>;

/** Một Chương có cấp `actual` có nằm trong lựa chọn `filter` hay không. */
export function matchesLevel(filter: ManagementLevelFilter, actual: ManagementLevel | null): boolean {
  if (filter === "all") return true;
  // `actual === null` chỉ còn xảy ra nếu dữ liệu tới từ provider thật mang mã
  // ngoài danh mục. Lớp mô phỏng không sinh ra trường hợp này nữa.
  if (actual === null) return false;
  if (filter === "dia-phuong") return LOCAL_LEVELS.includes(actual);
  return actual === filter;
}

/** Nhãn phạm vi của một lựa chọn cấp — dùng chung cho KPI, tiêu đề và thông báo. */
export function levelLabel(filter: ManagementLevelFilter): string {
  if (filter === "all") return "Tất cả cấp quản lý";
  if (filter === "dia-phuong") return "Địa phương";
  return LEVEL_BY_ID[filter].name;
}

export interface ChapterDef {
  code: string;
  name: string;
  level: ManagementLevel;
}

export interface SectionDef {
  code: string;
  name: string;
}

export interface SubItemDef {
  code: string;
  name: string;
  /** Mã Mục cha theo phiên bản danh mục. */
  section: string;
}

/**
 * Cơ quan thuế quản lý chứng từ — một CHIỀU RIÊNG, không suy từ địa bàn.
 *
 * Phụ lục nói rõ: cơ quan thuế là chiều riêng, không suy từ cấp quản lý Chương,
 * và quy trình lấy số còn phải bổ sung chứng từ của cơ quan quản lý doanh nghiệp
 * lớn phát sinh trên địa bàn — chính là mã 9901 trong danh mục này. Bảng nối đã
 * bàn giao nên danh mục có thật; số tiền theo cơ quan thuế thì vẫn cần giao dịch.
 */
export interface TaxOfficeDef {
  code: string;
  name: string;
}

/** Danh mục CQT như bảng MAP đã bàn giao. Không sửa tay tệp này. */
export const TAX_OFFICES_GOC = joins.taxOffices as TaxOfficeDef[];

/**
 * Mã cơ quan thuế CÓ THẬT trong dữ liệu nhưng còn thiếu trong bảng MAP.
 *
 * `tms-joins.json` được sinh ra từ bảng MAP CQT, nên sửa tay vào đó là bản sinh
 * lần sau xoá mất và không ai biết. Khai riêng ở đây, kèm nguồn, rồi hợp nhất ở
 * ngay bên dưới.
 *
 * `9801` — CCT Thương mại điện tử. Nguồn: danh bạ doanh nghiệp có 116 dòng mang
 * mã này, và kỳ 07/2025 của TMS phát sinh 14.230.622 đồng dưới mã này. Bỏ nó ra
 * ngoài danh mục thì cả 116 dòng lẫn số tiền đó không thuộc về đâu cả — chúng
 * không hiện ra ở bất kỳ cơ quan nào, kể cả "Chưa xác định".
 */
export const SUPPLEMENTAL_TAX_OFFICES: TaxOfficeDef[] = [
  { code: "9801", name: "CCT Thương mại điện tử" },
];

/**
 * Danh mục dùng cho toàn bộ ứng dụng: gốc trước, bổ sung sau, khử trùng theo MÃ.
 *
 * Khử trùng theo mã chứ không theo tên: khi bảng MAP mới có `9801`, bản ghi gốc
 * thắng và dòng bổ sung tự biến mất, không cần ai nhớ đi xoá nó. Tên trong bảng
 * MAP là tên chuẩn, nên để bản bổ sung ghi đè tên gốc là đi lùi.
 */
export const TAX_OFFICES: TaxOfficeDef[] = (() => {
  const daCo = new Set(TAX_OFFICES_GOC.map((office) => office.code));
  return [...TAX_OFFICES_GOC, ...SUPPLEMENTAL_TAX_OFFICES.filter((o) => !daCo.has(o.code))];
})();

/**
 * Phạm vi địa bàn của 25 Thuế cơ sở Hà Nội từ 01/07/2025.
 *
 * Chỉ giữ quan hệ CQT → phường/xã; địa chỉ và số điện thoại không thuộc nhu
 * cầu báo cáo nên không đi vào domain. Tên địa bàn được đối chiếu với bảng nối
 * 126 phường/xã đang dùng trong dashboard.
 *
 * Ba đơn vị KHÔNG có phạm vi phường/xã cố định vì chúng quản theo đối tượng chứ
 * không theo địa bàn: Thuế TP Hà Nội, CCT Doanh nghiệp lớn và CCT Thương mại
 * điện tử. Danh sách rỗng ở đây là một sự thật nghiệp vụ, không phải dữ liệu
 * thiếu — và tuyệt đối không được lấp bằng phường/xã gán bừa.
 *
 * Tham chiếu nghiệp vụ:
 * https://tuvanketoanaz.com/cap-nhat-danh-sach-25-co-quan-thue-co-so-tai-thanh-pho-ha-noi-tu-01-07-2025/
 */
const TAX_OFFICE_AREA_NAMES: Record<number, string[]> = {
  1: ["Phường Hoàn Kiếm", "Phường Cửa Nam"],
  2: ["Phường Ba Đình", "Phường Ngọc Hà", "Phường Giảng Võ"],
  3: ["Phường Hai Bà Trưng", "Phường Bạch Mai", "Phường Vĩnh Tuy"],
  4: ["Phường Đống Đa", "Phường Kim Liên", "Phường Văn Miếu - Quốc Tử Giám", "Phường Láng", "Phường Ô Chợ Dừa"],
  5: ["Phường Cầu Giấy", "Phường Nghĩa Đô", "Phường Yên Hòa"],
  6: ["Phường Thanh Xuân", "Phường Khương Đình", "Phường Phương Liệt"],
  7: ["Phường Tây Hồ", "Phường Phú Thượng", "Phường Hồng Hà"],
  8: ["Phường Từ Liêm", "Phường Xuân Phương", "Phường Tây Mỗ", "Phường Đại Mỗ"],
  9: ["Phường Tây Tựu", "Phường Phú Diễn", "Phường Xuân Đỉnh", "Phường Đông Ngạc", "Phường Thượng Cát"],
  10: ["Xã Thư Lâm", "Xã Đông Anh", "Xã Phúc Thịnh", "Xã Thiên Lộc", "Xã Vĩnh Thanh"],
  11: ["Phường Long Biên", "Phường Bồ Đề", "Phường Việt Hưng", "Phường Phúc Lợi"],
  12: ["Xã Gia Lâm", "Xã Thuận An", "Xã Bát Tràng", "Xã Phù Đổng"],
  13: ["Phường Lĩnh Nam", "Phường Hoàng Mai", "Phường Vĩnh Hưng", "Phường Tương Mai", "Phường Định Công", "Phường Hoàng Liệt", "Phường Yên Sở"],
  14: ["Xã Thanh Trì", "Xã Đại Thanh", "Xã Nam Phù", "Xã Ngọc Hồi", "Phường Thanh Liệt"],
  15: ["Phường Hà Đông", "Phường Dương Nội", "Phường Yên Nghĩa", "Phường Phú Lương", "Phường Kiến Hưng"],
  16: ["Phường Sơn Tây", "Phường Tùng Thiện", "Xã Đoài Phương"],
  17: ["Xã Minh Châu", "Xã Quảng Oai", "Xã Vật Lại", "Xã Cổ Đô", "Xã Bất Bạt", "Xã Suối Hai", "Xã Ba Vì", "Xã Yên Bài"],
  18: ["Xã Sóc Sơn", "Xã Đa Phúc", "Xã Nội Bài", "Xã Trung Giã", "Xã Kim Anh", "Xã Mê Linh", "Xã Yên Lãng", "Xã Tiến Thắng", "Xã Quang Minh"],
  19: ["Xã Thường Tín", "Xã Thượng Phúc", "Xã Chương Dương", "Xã Hồng Vân", "Xã Phú Xuyên", "Xã Phượng Dực", "Xã Chuyên Mỹ", "Xã Đại Xuyên"],
  20: ["Xã Vân Đình", "Xã Ứng Thiên", "Xã Ứng Hòa", "Xã Hòa Xá", "Xã Mỹ Đức", "Xã Hồng Sơn", "Xã Phúc Sơn", "Xã Hương Sơn"],
  21: ["Phường Chương Mỹ", "Xã Thanh Oai", "Xã Bình Minh", "Xã Tam Hưng", "Xã Dân Hòa", "Xã Phú Nghĩa", "Xã Xuân Mai", "Xã Trần Phú", "Xã Hòa Phú", "Xã Quảng Bị"],
  22: ["Xã Thạch Thất", "Xã Hạ Bằng", "Xã Tây Phương", "Xã Hòa Lạc", "Xã Yên Xuân", "Xã Quốc Oai", "Xã Hưng Đạo", "Xã Kiều Phú", "Xã Phú Cát"],
  23: ["Xã Hoài Đức", "Xã Dương Hòa", "Xã Sơn Đồng", "Xã An Khánh"],
  24: ["Xã Đan Phượng", "Xã Ô Diên", "Xã Liên Minh"],
  25: ["Xã Phúc Lộc", "Xã Phúc Thọ", "Xã Hát Môn"],
};

const LOCATION_CODE_BY_FULL_NAME = Object.fromEntries(
  (joins.locations as { locationCode: string; kind: string; name: string }[]).map((row) => [
    `${row.kind} ${row.name}`,
    row.locationCode,
  ]),
);

export const TAX_OFFICE_LOCATION_IDS: Record<string, string[]> = Object.fromEntries(
  TAX_OFFICES.map((office) => {
    const number = Number(office.name.match(/cơ sở\s+(\d+)/i)?.[1]);
    const ids = (TAX_OFFICE_AREA_NAMES[number] ?? [])
      .map((name) => LOCATION_CODE_BY_FULL_NAME[name])
      .filter((id): id is string => Boolean(id));
    return [office.code, ids];
  }),
);

export const taxOfficeLocationIds = (code: string): string[] =>
  TAX_OFFICE_LOCATION_IDS[code] ?? TAX_OFFICE_LOCATION_IDS[TAX_OFFICE_ENTITY_BY_CODE[code]] ?? [];

/**
 * Một cơ quan thuế như một THỰC THỂ QUẢN LÝ, không phải một mã nguồn.
 *
 * `id` là mã đại diện — mã nhỏ nhất trong nhóm — và `codes` giữ đủ mã nguồn đã
 * sinh ra nó. Giữ cả hai vì hai câu hỏi khác nhau: "có bao nhiêu cơ quan thuế"
 * hỏi về thực thể, còn "chứng từ này thuộc mã nào" hỏi về nguồn. Bỏ `codes` đi
 * là mất đường đối chiếu ngược về chứng từ khi tổng lệch.
 */
export interface TaxOfficeEntity {
  id: string;
  name: string;
  /** Các mã nguồn cùng trỏ về thực thể này, tăng dần. */
  codes: string[];
}

/**
 * 33 mã nguồn quy về 28 cơ quan thuế.
 *
 * 28 gồm 25 Thuế cơ sở và 3 đơn vị khác: Thuế TP Hà Nội, CCT Doanh nghiệp lớn,
 * CCT Thương mại điện tử. Ba đơn vị sau không phải Thuế cơ sở, nên không được
 * gộp chung thành "28 Thuế cơ sở". "Chưa xác định" là một trạng thái dữ liệu,
 * không nằm trong 28 này.
 *
 * Năm cơ quan có hai mã do chuyển sang mô hình Thuế cơ sở từ 01/07/2025: cơ sở
 * 18, 19, 20, 21 và 22. Đếm thẳng trên mã là đếm một cơ quan hai lần, và số đó
 * đi thẳng vào mọi chỗ nói "có bao nhiêu cơ quan thuế" lẫn số cột của báo cáo
 * hai chiều.
 *
 * Nhóm theo TÊN chứ không theo một bảng cặp mã chép tay: tên là thứ danh mục
 * bàn giao đã khẳng định, còn một bảng cặp chép tay thì lặng lẽ lệch khỏi danh
 * mục ngay lần danh mục được cập nhật đầu tiên.
 */
export const TAX_OFFICE_ENTITIES: TaxOfficeEntity[] = (() => {
  const theo = new Map<string, string[]>();
  for (const office of TAX_OFFICES) {
    const codes = theo.get(office.name) ?? [];
    codes.push(office.code);
    theo.set(office.name, codes);
  }
  return [...theo.entries()].map(([name, codes]) => {
    const sorted = [...codes].sort();
    return { id: sorted[0], name, codes: sorted };
  });
})();

/** Mã nguồn → mã thực thể. Đủ 33 mã, kể cả mã tự đại diện cho chính nó. */
export const TAX_OFFICE_ENTITY_BY_CODE: Record<string, string> = Object.fromEntries(
  TAX_OFFICE_ENTITIES.flatMap((entity) => entity.codes.map((code) => [code, entity.id])),
);

export const TAX_OFFICE_ENTITY_BY_ID = Object.fromEntries(
  TAX_OFFICE_ENTITIES.map((entity) => [entity.id, entity]),
) as Record<string, TaxOfficeEntity>;

/**
 * Mã thực thể của một mã nguồn.
 *
 * Mã lạ được trả về nguyên trạng, không bị nuốt vào một nhóm nào: một mã ngoài
 * danh mục là dấu hiệu danh mục cần cập nhật, và gán bừa nó vào đâu đó là giấu
 * đúng cái cần thấy.
 */
export const taxOfficeEntityOf = (code: string): string =>
  TAX_OFFICE_ENTITY_BY_CODE[code] ?? code;

/**
 * Vì sao một cơ quan không có phường/xã phụ trách.
 *
 * Trả `null` khi cơ quan đó ĐÁNG LẼ phải có phạm vi mà lại rỗng — đó mới là dữ
 * liệu thiếu và màn hình phải nói khác đi. Với ba đơn vị quản theo đối tượng thì
 * rỗng là đúng, nên câu chữ phải nói ra điều đó thay vì để người dùng đọc thành
 * "mã này không hợp lệ".
 */
export const taxOfficeScopeNote = (code: string): string | null => {
  const id = taxOfficeEntityOf(code);
  const ten = TAX_OFFICE_ENTITY_BY_ID[id]?.name;
  if (!ten) return null;
  if (id === "9801" || id === "9901")
    return `${ten} quản lý theo đối tượng, không có phạm vi phường/xã cố định.`;
  if (id === "0101") return `${ten} không có phạm vi phường/xã cố định.`;
  return null;
};

/** Tên cơ quan thuế theo mã nguồn HOẶC mã thực thể. */
export const taxOfficeNameOf = (code: string): string | null =>
  TAX_OFFICE_ENTITY_BY_ID[taxOfficeEntityOf(code)]?.name ?? null;

/**
 * Nhãn mã cho giao diện: `0117 + 0127` khi thực thể có nhiều mã nguồn.
 *
 * Người dùng đối chiếu bảng này với chứng từ bên TMS, nên hiện một mã trong khi
 * số đã gộp hai mã là mời họ đi tìm phần chênh không có thật.
 */
export const taxOfficeCodeLabel = (id: string): string =>
  (TAX_OFFICE_ENTITY_BY_ID[id]?.codes ?? [id]).join(" + ");

export const CHAPTERS = catalog.chapters as ChapterDef[];
export const SECTIONS = catalog.sections as SectionDef[];
export const SUB_ITEMS = catalog.subItems as SubItemDef[];

export const CHAPTER_BY_CODE = Object.fromEntries(CHAPTERS.map((c) => [c.code, c]));
export const SECTION_BY_CODE = Object.fromEntries(SECTIONS.map((s) => [s.code, s]));
export const SUB_ITEM_BY_CODE = Object.fromEntries(SUB_ITEMS.map((s) => [s.code, s]));

/**
 * Cấp quản lý của một Chương, hoặc `null` khi mã chưa có bản ghi trong danh mục.
 *
 * Không suy từ dải số. Đặc tả nói rõ: có tên trong danh mục không xác nhận mã
 * còn hiệu lực, và chỉ dải mã thì càng không đủ để coi một mã là hợp lệ. Mã lạ
 * phải ở lại nhóm "chưa xác định cấp" để còn đối soát.
 */
/**
 * Cấp suy từ DẢI MÃ, dùng cho mã chưa có dòng tên trong danh mục.
 *
 * Kiểm trên toàn bộ 104 Chương: dải mã và cột "Cấp quản lý" của danh mục khớp
 * nhau 104/104, không một ngoại lệ. Dải chính là cách danh mục định nghĩa cấp —
 * cột đó ghi thẳng "Trung ương (001-399)", "Cấp tỉnh (400-599)".
 *
 * Suy CẤP khác hẳn với suy TÊN hay suy hiệu lực. Một mã chưa có tên vẫn thuộc
 * về một cấp xác định, và đặt nó đúng cấp thì tiền của nó nằm đúng nhánh khi
 * cộng; ném vào một nhóm "chưa xác định cấp" là tự tạo ra một nhánh thứ ba
 * không có trong mục lục ngân sách.
 *
 * 600–799 quy về phường/xã: nhóm mã cấp huyện đã bãi bỏ, 754–757 chuyển sang
 * 854–857.
 */
const levelFromRange = (code: string): ManagementLevel | null => {
  const n = Number(code);
  if (!Number.isInteger(n) || n < 1 || n > 989) return null;
  if (n <= 399) return "trung-uong";
  if (n <= 599) return "tinh";
  return "xa";
};

export const levelOfChapter = (code: string): ManagementLevel | null =>
  CHAPTER_BY_CODE[code]?.level ?? levelFromRange(code);

/**
 * Mã Mục suy từ mã Tiểu mục, dùng cho mã chưa có dòng tên trong danh mục.
 *
 * Kiểm trên toàn bộ 180 Tiểu mục: chặn mã xuống bội số của 50 cho ra đúng Mục
 * cha 180/180, không một ngoại lệ. Đây là cấu tạo của mục lục ngân sách chứ
 * không phải một mẫu tình cờ khớp.
 *
 * KHÔNG tra danh mục trước khi trả về. Danh mục Mục cũng thiếu — nó chỉ liệt kê
 * những Mục có ít nhất một Tiểu mục được ghi tên, nên 24 mã đang dùng suy ra
 * các Mục 1300, 3300, 3750, 3800, 4050 mà danh mục không có. Trả về mã Mục dù
 * Mục đó chưa có tên thì 3751–3799 gom thành MỘT dòng đọc được; đòi Mục phải có
 * tên trước thì chúng vỡ thành 24 dòng lẻ, mỗi dòng một mã.
 */
export const sectionFromCode = (code: string): string | null => {
  const n = Number(code);
  if (!Number.isInteger(n) || n <= 0) return null;
  return String(Math.floor(n / 50) * 50);
};

/** Mã Mục của một Tiểu mục; suy từ mã khi Tiểu mục chưa có tên trong danh mục. */
export const sectionOfSubItem = (code: string): string | null =>
  SUB_ITEM_BY_CODE[code]?.section ?? sectionFromCode(code);

// ---------------------------------------------------------------------------
// Điều kiện Chương và Tiểu mục theo nhóm thu (đặc tả kỹ thuật nội bộ §14)
// ---------------------------------------------------------------------------

/**
 * Hai mã được nêu trong điều kiện báo cáo nhưng chưa có dòng tên trong danh mục
 * 104 Chương.
 *
 * Giữ lại, vì tài liệu chuẩn của ngành nói rõ danh mục Chương/Tiểu mục là
 * **bảng tham chiếu mô tả, không phải danh mục kiểm soát** — không dùng nó để
 * validate và loại bỏ bản ghi. Dữ liệu thật còn có thêm những mã khác nữa
 * (tài liệu nêu đích danh 5 mã Chương và 7 mã Tiểu mục), trong đó có mã mang
 * khoản tiền lớn nhất của cả tập. Lọc theo danh mục là làm tổng cộng thiếu mà
 * không ai biết thiếu ở đâu.
 */
const CHAPTERS_WITHOUT_NAME = ["153", "553"];

const CHAPTER_POOL = [...CHAPTERS.map((c) => c.code), ...CHAPTERS_WITHOUT_NAME].sort();

const between = (code: string, lo: string, hi: string) => code >= lo && code <= hi;

const pick = (test: (code: string) => boolean) => CHAPTER_POOL.filter(test);

/** Sáu nhánh điều kiện Chương của §14.1, đã hợp tập nên không mã nào tính hai lần. */
const CHAPTER_BRANCHES = {
  "dnnn-tw": pick(
    (c) =>
      between(c, "001", "399") &&
      !["151", "152", "153", "154", "159", "161", "162"].includes(c) &&
      !between(c, "182", "208"),
  ),
  "dnnn-dp": pick(
    (c) =>
      between(c, "400", "989") &&
      !between(c, "516", "540") &&
      !between(c, "551", "557") &&
      !["559", "561", "562"].includes(c) &&
      !between(c, "716", "757") &&
      !["759", "816", "817", "818", "854", "855", "856", "857", "859"].includes(c) &&
      !between(c, "824", "828"),
  ),
  "ncc-nuoc-ngoai": pick((c) => c === "208"),
  fdi: pick((c) => ["151", "152", "161", "162", "551", "552", "561", "562"].includes(c)),
  "nqd-to-chuc": pick(
    (c) =>
      ["153", "154", "159", "553", "554", "555", "556", "559", "759"].includes(c) ||
      between(c, "182", "207") ||
      between(c, "516", "540") ||
      between(c, "716", "756") ||
      ["816", "817", "818", "854", "855", "856", "859"].includes(c) ||
      between(c, "824", "828"),
  ),
  "ho-ca-nhan": pick((c) => ["557", "757", "857"].includes(c)),
} satisfies Record<string, string[]>;

const range4 = (lo: number, hi: number) =>
  Array.from({ length: hi - lo + 1 }, (_, i) => String(lo + i));

/** Tập Tiểu mục theo sắc thuế của §14.2. */
const SUBITEM_GROUPS = {
  gtgt: ["1701", "1704", "1749", "4929", "4931"],
  ttdb: ["1753", "1754", "1755", "1756", "1757", "1758", "1762", "1763", "1764", "1765", "1766", "1767", "1799", "4933", "4934"],
  tndn: ["1052", "1053", "1055", "1056", "1058", "1099", "4918", "4919"],
  "tndn-ho": ["1052", "1099", "4918"],
  "tai-nguyen": ["1551", "1552", "1553", "1555", "1556", "1557", "1558", "1561", "1562", "1563", "1599", "4925", "4927"],
  khi: ["3801", "3802", "3803", "3804", "3805", "3806", "3807", "3849"],
  "ncc-208": ["1749", "1099", "4931", "4918"],
};

const SECTOR_TAXES = [
  ...SUBITEM_GROUPS.gtgt,
  ...SUBITEM_GROUPS.ttdb,
  ...SUBITEM_GROUPS.tndn,
  ...SUBITEM_GROUPS["tai-nguyen"],
  ...SUBITEM_GROUPS.khi,
];

/** Tiểu mục thuộc các Mục đã cho, lấy thẳng từ danh mục thay vì chép lại mã. */
const subItemsOfSections = (...sections: string[]) =>
  SUB_ITEMS.filter((s) => sections.includes(s.section)).map((s) => s.code);

interface ItemRule {
  /** Các nhánh (Chương, Tiểu mục) tạo nên khoản thu này. */
  branches: { chapters: string[]; subItems: string[] }[];
  /** Ghi chú trạng thái của §13; dòng nào chưa chốt thì nói rõ tại giao diện. */
  review?: string;
}

/**
 * Bảng quy đổi 21 khoản thu nội địa sang điều kiện Chương và Tiểu mục (§13).
 *
 * Mỗi khoản là một hoặc nhiều nhánh; trong một nhánh, Chương và Tiểu mục phải
 * cùng đúng. Khoản chưa có điều kiện riêng thì để rỗng chứ không mượn tạm nhánh
 * khác — đặc tả cấm tự chia A.I.2.10 sang I.14 và I.15.
 */
const ITEM_RULES: Record<string, ItemRule> = {
  "II.1": {
    branches: [
      {
        chapters: [],
        subItems: ["3751", "3752", "3753", "3754", "3755", "3756", "3757", "3799", "4926", "4942"],
      },
    ],
  },
  "II.2": {
    branches: [
      {
        chapters: [],
        subItems: ["3951", "3952", "3953", "3954", "3955", "3956", "3957", "3999"],
      },
    ],
  },
  "I.1.1": { branches: [{ chapters: CHAPTER_BRANCHES["dnnn-tw"], subItems: SECTOR_TAXES }] },
  "I.1.2": {
    branches: [{ chapters: CHAPTER_BRANCHES["dnnn-dp"], subItems: SECTOR_TAXES }],
    review: "Khoảng Chương địa phương có phần chồng nhau, cận phạm vi chờ nghiệp vụ xác nhận.",
  },
  "I.2": {
    branches: [
      { chapters: CHAPTER_BRANCHES.fdi, subItems: SECTOR_TAXES },
      { chapters: CHAPTER_BRANCHES["ncc-nuoc-ngoai"], subItems: SUBITEM_GROUPS["ncc-208"] },
    ],
  },
  "I.3": {
    branches: [
      { chapters: CHAPTER_BRANCHES["nqd-to-chuc"], subItems: SECTOR_TAXES },
      {
        chapters: CHAPTER_BRANCHES["ho-ca-nhan"],
        subItems: [...SUBITEM_GROUPS.gtgt, ...SUBITEM_GROUPS["tndn-ho"], ...SUBITEM_GROUPS.ttdb],
      },
    ],
  },
  "I.4": { branches: [{ chapters: [], subItems: ["1001", "1003", "1004", "1005", "1006", "1007", "1008", "1012", "1014", "1015", "1049", "4917"] }] },
  "I.5": {
    branches: [
      {
        chapters: [],
        subItems: [...range4(2001, 2013), "2019", ...range4(2022, 2026), ...range4(2041, 2049), "2146", "4938", "4939"],
      },
    ],
  },
  "I.6": { branches: [{ chapters: [], subItems: ["2801", "2802", "2803", "2804", "2824", "2825"] }] },
  "I.7": {
    branches: [
      {
        chapters: [],
        subItems: subItemsOfSections("2100", "2150", "2200", "2250", "2300", "2350", "2400", "2450", "2500", "2550", "2600", "2650", "2700", "2750", "2800", "2850", "3000", "3050").filter(
          (code) => !["2801", "2802", "2803", "2804", "2824", "2825"].includes(code),
        ),
      },
    ],
  },
  "I.8": { branches: [{ chapters: [], subItems: ["1301", "1302", "1303", "1304", "1305", "1349"] }] },
  "I.9": { branches: [{ chapters: [], subItems: ["1601", "1602", "1603", "1649"] }] },
  "I.10": { branches: [{ chapters: [], subItems: ["3601", "3602", "3603", "3604", "3605", "3606", "3607", "3608", "3611", "3612", "3649"] }] },
  "I.11": { branches: [{ chapters: [], subItems: ["1401", "1405", "1406", "1407", "1408", "1411", "1412", "1413", "1449"] }] },
  "I.12": { branches: [{ chapters: [], subItems: ["3301", "3851"] }] },
  "I.13": { branches: [{ chapters: [], subItems: ["1705", "1057", "1153", "1761", "4913", "4941"] }] },
  "I.14": {
    branches: [{ chapters: [], subItems: [...range4(1251, 1259), "1261", "1299", "4921", "4922", "4923", "4924"] }],
    review: "Ranh giới với khoản Tiền sử dụng khu vực biển chưa được xác nhận.",
  },
  "I.15": { branches: [], review: "Chưa có nhánh riêng; không tự tách từ khoản cấp quyền khai thác." },
  "I.16": { branches: [{ chapters: [], subItems: subItemsOfSections("4250", "4300", "4500", "4900") }] },
  "I.17": { branches: [{ chapters: [], subItems: ["3901", "3902", "3903", "3949"] }] },
  "I.18": {
    branches: [{ chapters: [], subItems: ["3653", "3655", "3656", "1154", "1155", "1151", "1199"] }],
    review: "Cấp ngân sách được hưởng cần dữ liệu phân bổ riêng, không suy từ Chương.",
  },
  "I.19": {
    branches: [{ chapters: [], subItems: ["3653", "3655", "3656", "1154", "1155", "1151", "1199"] }],
    review: "Cấp ngân sách được hưởng cần dữ liệu phân bổ riêng, không suy từ Chương.",
  },
  "I.20": { branches: [{ chapters: ["036"], subItems: ["4053"] }] },
};

export const reviewNoteOf = (itemCode: string): string | undefined => ITEM_RULES[itemCode]?.review;

/**
 * Các nhánh điều kiện của một khoản thu, đã điền sẵn tập Chương.
 *
 * Khoản không khoá vào một nhánh kinh tế nào — thuế TNCN, phí, lệ phí, tiền sử
 * dụng đất — thì điều kiện Chương của nó là **mọi Chương trong danh mục**, đúng
 * như hướng dẫn: chỉ điều kiện Tiểu mục quyết định, Chương không thu hẹp thêm.
 * Trước đây chỗ này lấy mẫu chín Chương trải đều danh mục để "có cái mà hiện" —
 * đó là bịa ra một phạm vi mà hướng dẫn không hề đặt ra.
 */
export interface ItemBranch {
  chapters: string[];
  subItems: string[];
  /**
   * `branch` là nhánh có điều kiện Chương riêng; `all` là khoản thu không khoá
   * vào Chương nào nên `chapters` là toàn bộ danh mục.
   *
   * Phân biệt này để lớp mô phỏng biết chỗ nào nó được phép lấy mẫu. Với nhánh
   * `all`, cả trăm Chương đều hợp lệ nhưng thực tế chỉ một phần có phát sinh;
   * chọn phần nào là việc của giao dịch, không phải của hướng dẫn.
   */
  chapterScope: "branch" | "all";
}

export function branchesOfItem(itemCode: string): ItemBranch[] {
  const rule = ITEM_RULES[itemCode];
  if (!rule) return [];
  return rule.branches.map((branch) => ({
    chapters: branch.chapters.length ? branch.chapters : CHAPTER_POOL,
    subItems: branch.subItems,
    chapterScope: branch.chapters.length ? ("branch" as const) : ("all" as const),
  }));
}

/** Các khoản của tổng A đã có điều kiện TMS, gồm nội địa, dầu thô và condensate. */
const TMS_SCOPE_ITEMS = [...DOMESTIC_ITEMS, ...CRUDE_OIL_ITEMS];

export const TMS_ITEMS = TMS_SCOPE_ITEMS.filter((item) => branchesOfItem(item.code).length > 0);

/**
 * Khoản thuộc tổng A nhưng **chưa có điều kiện** báo cáo nào.
 *
 * Khác hẳn với `TMS_ITEMS_WITHOUT_CATALOGUED_SUBITEMS` bên dưới, và phải khác:
 * một bên là chưa ai viết điều kiện, một bên là điều kiện đã có nhưng danh mục
 * Tiểu mục của ngành chưa có tên cho các mã mà nó nhắc tới. Gộp hai thứ vào
 * một dòng là báo sai cho người đi xử lý — họ sẽ đi tìm điều kiện cho một
 * khoản vốn đã có đủ điều kiện.
 */
export const TMS_ITEMS_WITHOUT_RULE = TMS_SCOPE_ITEMS.filter((item) => !ITEM_RULES[item.code]);

/**
 * Khoản CÓ điều kiện nhưng mọi Tiểu mục của nó chưa có tên trong danh mục.
 *
 * Không sinh số cho chúng, vì sinh là bịa ra một dòng báo cáo không tra được.
 * Việc cần làm là bổ sung danh mục Tiểu mục, không phải viết thêm điều kiện.
 */
export const TMS_ITEMS_WITHOUT_CATALOGUED_SUBITEMS = TMS_SCOPE_ITEMS.filter(
  (item) => !!ITEM_RULES[item.code] && branchesOfItem(item.code).length === 0,
);
