/**
 * Dựng 27 artboard trên Figma — 9 màn hình × 3 khổ.
 *
 * Đây KHÔNG phải script Node. Nó là mã Figma Plugin API, chạy bằng đúng MỘT
 * lệnh `use_figma`. Gói Figma Starter chỉ cho 20 lệnh MCP mỗi tháng, nên toàn
 * bộ việc dựng được gom vào một lần gọi thay vì chia nhỏ theo từng màn hình.
 *
 * Cách chạy:
 *   node scripts/figma-screens.mjs > scripts/.figma-screens.out.js
 *   rồi nạp nguyên nội dung file đó làm tham số `code` của `use_figma`.
 *
 * Script tự dọn trang trước khi dựng lại, nên chạy lại bao nhiêu lần cũng ra
 * cùng một kết quả — chạy lại sau lỗi thì an toàn.
 *
 * Phụ thuộc: id của bộ component trên trang `02 · Components`. Nếu dựng lại
 * thư viện thì phải cập nhật bảng SET và CO bên dưới.
 */

const D = {"tong-quan":{"tabs":[["Tổng quan",1],["Báo cáo",0],["Phân tích thu",0],["Chi tiết Địa bàn & Đơn vị Thuế",0],["So sánh nâng cao",0]],"subnav":[],"filters":[["Chu kỳ","Tháng 8/2026",0],["Cách tính","Lũy kế",0]],"subject":"","kpis":[["Tổng thu trong kỳ","56.117 tỷ","+15,4% so cùng kỳ",0],["Lũy kế đầu năm","434.710 tỷ","+13,2% so cùng kỳ",0],["Tổng thu nội địa","394.530 tỷ","+13,4% so cùng kỳ",0],["% đạt dự toán thu nội địa","66,7%","Dự toán 651.452 tỷ",0]],"cards":[{"t":"Xu hướng thu ngân sách","cols":[],"rows":[],"bars":[],"leg":[]},{"t":"Cơ cấu theo cấp ngân sách","cols":[],"rows":[],"bars":[],"leg":["Ngân sách trung ương 57,1%","Ngân sách địa phương 42,9%"]},{"t":"Cơ cấu 4 nhóm nguồn thu","cols":[],"rows":[],"bars":[],"leg":[]},{"t":"Theo dõi quản lý nhà nước","cols":[],"rows":[],"bars":[],"leg":[]},{"t":"Động lực ngành nghề và doanh nghiệp","cols":[],"rows":[],"bars":["Khác|64.888|14,9%","Khoa học, Y tế, Giáo dục|54.621|12,6%","Thông tin, Truyền thông|50.004|11,5%","Xây dựng|45.409|10,4%","Tài chính, Ngân hàng, Bảo hiểm|41.284|9,5%"],"leg":[]}],"acts":["Bộ lọc"]},"bao-cao-nsnn":{"tabs":[["Tổng quan",0],["Báo cáo",1],["Phân tích thu",0],["Chi tiết Địa bàn & Đơn vị Thuế",0],["So sánh nâng cao",0]],"subnav":[["Thu NSNN",1],["Dự toán & dự báo",0],["Quản lý thu",0],["Kết quả kiểm tra",0]],"filters":[["Chu kỳ","Tháng 8/2026",0],["Cách tính","Lũy kế",0]],"subject":"","kpis":[["Tổng thu trong phạm vi","434.710 tỷ","",0],["Số địa bàn có dữ liệu","127","",0],["Đóng góp lớn nhất","6.658 tỷ","Quảng Oai",0],["Đã xác định được nhóm","99,7%","1.435 tỷ chưa xác định, vẫn nằm trong tổng",0]],"cards":[{"t":"Bảng báo cáo","cols":["Chỉ tiêu","Tổng (tỷ)","An Khánh","Ba Đình","Ba Vì","Bạch Mai"],"rows":[["TỔNG THU NỘI ĐỊA (I+II+III)","404.709","2.827","2.554","4.823","1.342"],["TỔNG THU NỘI ĐỊA TRỪ DẦU","389.657","914","1.943","4.360","2.646"],["THU DO NGÀNH THUẾ QUẢN LÝ","351.726","1.486","5.239","2.431","1.836"],["THU TỪ DẦU THÔ, CONDENSATE","15.052","87","111","93","22"]],"bars":[],"leg":[]}],"acts":["Bộ lọc","Xuất toàn bộ Excel","Cột trước","Cột sau"]},"bao-cao-budget":{"tabs":[["Tổng quan",0],["Báo cáo",1],["Phân tích thu",0],["Chi tiết Địa bàn & Đơn vị Thuế",0],["So sánh nâng cao",0]],"subnav":[["Thu NSNN",0],["Dự toán & dự báo",1],["Quản lý thu",0],["Kết quả kiểm tra",0]],"filters":[["Chu kỳ","Tháng 8/2026",0],["Cách tính","Lũy kế",0],["Cách xem","Theo phường, xã",0],["Trạng thái","Tất cả",0]],"subject":"","kpis":[["Thực hiện lũy kế","396.921 tỷ","124 đơn vị có số",0],["Dự toán được giao","398.478 tỷ","",0],["Tỷ lệ hoàn thành","99,6%","",0],["Số còn phải thu","1.558 tỷ","Dự toán trừ thực hiện",0],["Dự báo cuối kỳ","400.304 tỷ","Số mô phỏng, chưa phải dự báo nghiệp vụ",0],["Sai số dự báo","0,9%","Mục tiêu ≤ 3% — chưa kết luận trên số mô phỏng",1]],"cards":[{"t":"Tham chiếu điều hành 2026","cols":[],"rows":[],"bars":[],"leg":[]},{"t":"Tiến độ dự toán theo phường, xã","cols":["Phường, xã","Thực hiện (tỷ)","Dự toán (tỷ)","Hoàn thành ↓","Còn thiếu (tỷ)","So cùng kỳ"],"rows":[["Đông Ngạc","2.251","1.861","120,9%","390","−28,8%"],["Sóc Sơn","607","503","120,7%","104","+3,3%"],["Tây Tựu","423","351","120,5%","72","+22,5%"],["Quảng Oai","2.836","2.368","119,8%","468","+39,1%"]],"bars":[],"leg":[]},{"t":"Thực hiện và dự báo theo tháng","cols":[],"rows":[],"bars":[],"leg":[]}],"acts":["Bộ lọc","Xuất Excel"]},"bao-cao-taxpayer":{"tabs":[["Tổng quan",0],["Báo cáo",1],["Phân tích thu",0],["Chi tiết Địa bàn & Đơn vị Thuế",0],["So sánh nâng cao",0]],"subnav":[["Thu NSNN",0],["Dự toán & dự báo",0],["Quản lý thu",1],["Kết quả kiểm tra",0]],"filters":[["Chu kỳ","Tháng 8/2026",0],["Cách tính","Lũy kế",0],["Xem theo","Ngành nghề",0]],"subject":"","kpis":[["Số thu trong phạm vi","434.710 tỷ","",0],["Bản ghi danh bạ","473.618","13 nhóm ngành nghề có dữ liệu",0],["Đóng góp lớn nhất","63.616 tỷ","Công nghiệp chế biến, chế tạo",0],["Đã xác định được nhóm","89,8%","Chưa xác định: 44.273 tỷ",0]],"cards":[{"t":"Số thu theo ngành nghề","cols":["Ngành nghề","Số thu (tỷ) ↓","Tỷ trọng","So cùng kỳ","Doanh nghiệp"],"rows":[["Công nghiệp chế biến, chế tạo","63.616","14,6%","+44,1%","52.640"],["Dịch vụ","61.111","14,1%","+188,2%","75.922"],["Sản xuất","45.638","10,5%","+28,8%","3.475"],["Bất động sản","34.979","8,0%","+56,6%","13.169"]],"bars":[],"leg":[]},{"t":"Doanh nghiệp thuộc Công nghiệp chế biến, chế tạo","cols":["Doanh nghiệp","Số thu (tỷ) ↓","So cùng kỳ"],"rows":[["DN-87351 · DN mô phỏng 002","8.596","+226,5%"],["DN-75971 · DN mô phỏng 006","7.764","+290,4%"],["DN-06383 · DN mô phỏng 010","6.913","+291,4%"],["DN-90260 · DN mô phỏng 012","6.910","+148,9%"]],"bars":[],"leg":[]}],"acts":["Bộ lọc","Xuất Excel","Trang trước","Trang sau"]},"bao-cao-inspection":{"tabs":[["Tổng quan",0],["Báo cáo",1],["Phân tích thu",0],["Chi tiết Địa bàn & Đơn vị Thuế",0],["So sánh nâng cao",0]],"subnav":[["Thu NSNN",0],["Dự toán & dự báo",0],["Quản lý thu",0],["Kết quả kiểm tra",1]],"filters":[["Chu kỳ","Tháng 8/2026",0],["Cách tính","Lũy kế",0],["Chu kỳ báo cáo","Tháng",0],["Trạng thái","Tất cả",0]],"subject":"","kpis":[["Tổng số cuộc kiểm tra","233","",0],["Đã hoàn thành","174","74,7% tổng số cuộc",0],["Số tiền xử lý qua kiểm tra","6.822 tỷ","Tên chỉ tiêu chờ cơ quan thuế xác nhận",0],["Số tiền đã nộp","5.010 tỷ","73,4% số tiền xử lý",0]],"cards":[{"t":"Diễn biến theo tháng","cols":[],"rows":[],"bars":[],"leg":[]},{"t":"Kết quả theo đơn vị","cols":["Đơn vị","Số cuộc","Hoàn thành","Số tiền xử lý (tỷ)","Đã nộp (tỷ)","Tỷ lệ nộp"],"rows":[["Đoàn kiểm tra số 6","34/49","69,4%","1.786","1.383","77,4%"],["Đoàn kiểm tra số 2","36/55","65,5%","1.631","1.367","83,8%"],["Đoàn kiểm tra số 3","9/18","50,0%","1.329","957","72,0%"],["Đoàn kiểm tra số 4","25/28","89,3%","941","530","56,3%"]],"bars":[],"leg":[]},{"t":"Biến động chính sách","cols":["Chính sách","Hiệu lực từ","Phạm vi ảnh hưởng","Đánh giá"],"rows":[["Chính sách mô phỏng A","1/7/2026","Khoản thu tài nguyên, phí","Đã đánh giá"],["Chính sách mô phỏng B","1/9/2026","Lệ phí trước bạ, tiền đất","Đang đánh giá"],["Chính sách mô phỏng C","1/10/2026","Khu vực ngoài quốc doanh","Chưa đánh giá"]],"bars":[],"leg":[]}],"acts":["Bộ lọc","Xuất Excel"]},"phan-tich-thu":{"tabs":[["Tổng quan",0],["Báo cáo",0],["Phân tích thu",1],["Chi tiết Địa bàn & Đơn vị Thuế",0],["So sánh nâng cao",0]],"subnav":[["Thu nội địa không kể dầu thô",1],["Thu xuất nhập khẩu",0],["Thu khác",0]],"filters":[["Chu kỳ","Tháng 8/2026",0],["Cách tính","Lũy kế",0]],"subject":"","kpis":[["Thu nội địa không kể dầu thô","394.530 tỷ","+13,4% so cùng kỳ",0],["Tỷ trọng trên tổng thu","90,8%","Trên cùng chỉ tiêu và cấp ngân sách đang lọc",0],["% tiến độ dự toán","66,8%","Dự toán năm 590.235 tỷ",0]],"cards":[{"t":"Xu hướng và nhịp độ thu nội địa","cols":[],"rows":[],"bars":[],"leg":[]},{"t":"Cơ cấu 3 nhóm thu nội địa","cols":[],"rows":[],"bars":["Khu vực kinh tế ngoài quốc doanh|96.697|46,3%","Doanh nghiệp nhà nước trung ương|55.734|26,7%","Doanh nghiệp có vốn đầu tư nước ngoài|44.101|21,1%","Doanh nghiệp nhà nước địa phương|12.175|5,8%"],"leg":["Khối doanh nghiệp 52,9%","Khối nhà đất 17,1%","Khối phí, lệ phí và khoản khác 30,0%"]},{"t":"Chi tiết chỉ tiêu đang chọn","cols":["Khoản mục / Đối tượng","Kỳ này","Cùng kỳ","Chênh lệch","Tăng trưởng","Tỷ trọng"],"rows":[["Khu vực kinh tế ngoài quốc doanh","96.697","79.912","+16.785","+21,0%","46,3%"],["Doanh nghiệp nhà nước trung ương","55.734","50.731","+5.002","+9,9%","26,7%"],["Doanh nghiệp có vốn đầu tư nước ngoài","44.101","39.785","+4.317","+10,9%","21,1%"],["Doanh nghiệp nhà nước địa phương","12.175","10.924","+1.251","+11,4%","5,8%"]],"bars":[],"leg":[]},{"t":"Top doanh nghiệp nộp thuế","cols":["STT","Mã hiển thị","Người nộp thuế","Ngành nghề chính","Đơn vị quản lý","Số đã nộp"],"rows":[["1","DN-001","Tổng công ty A","Chưa xác định","Thuế cơ sở 9","46.683"],["2","DN-002","Công ty TNHH B","Xây dựng","Thuế cơ sở 13","25.445"],["3","DN-003","Công ty CP C","Thông tin, Truyền thông","Thuế cơ sở 18","17.649"],["4","DN-004","Công ty TNHH MTV D","Nông, Lâm, Thủy sản","Thuế cơ sở 23","12.181"]],"bars":[],"leg":[]}],"acts":["Bộ lọc"]},"chi-tiet-dia-ban":{"tabs":[["Tổng quan",0],["Báo cáo",0],["Phân tích thu",0],["Chi tiết Địa bàn & Đơn vị Thuế",1],["So sánh nâng cao",0]],"subnav":[],"filters":[["Chu kỳ","Tháng 8/2026",0],["Cách tính","Lũy kế",0]],"subject":"Ba Đình · Mã địa bàn 00004 · Thuế cơ sở 2 thành phố Hà Nội","kpis":[["Thu trong kỳ","449 tỷ","+20,6% so cùng kỳ",0],["Lũy kế từ đầu năm","3.504 tỷ","+18,6% so cùng kỳ",0],["Dự toán năm 2026","5.018 tỷ","Số mô phỏng",0],["Hoàn thành dự toán","69,8%","Lũy kế trên dự toán mô phỏng",0]],"cards":[{"t":"Xu hướng theo tháng","cols":[],"rows":[],"bars":[],"leg":[]},{"t":"Cơ cấu nguồn thu","cols":[],"rows":[],"bars":[],"leg":["Thu nội địa 99,4%","Thu khác 0,6%"]},{"t":"Bản đồ 126 phường, xã","cols":["#","Phường, xã","Số thu ↓"],"rows":[["1","Phú Diễn","14.618"],["2","Nam Phù","12.981"],["3","Dương Nội","12.179"],["4","Phú Lương","10.100"]],"bars":[],"leg":[]},{"t":"Sắc thuế địa bàn phụ trách thu","cols":[],"rows":[],"bars":["Khối doanh nghiệp|2.038|58,2%","Khối phí, lệ phí và khoản khác|976|27,8%","Khối nhà đất|471|13,4%"],"leg":[]},{"t":"Số thu phát sinh theo cơ quan thu","cols":[],"rows":[],"bars":["Do Thuế cơ sở phụ trách địa bàn thu|3.237|92,4%","Do Chi cục Doanh nghiệp lớn thu|144|4,1%","Do Văn phòng Cục Thuế Hà Nội thu|123|3,5%"],"leg":[]}],"acts":["Bộ lọc","So sánh với địa bàn khác"]},"chi-tiet-cqt":{"tabs":[["Tổng quan",0],["Báo cáo",0],["Phân tích thu",0],["Chi tiết Địa bàn & Đơn vị Thuế",1],["So sánh nâng cao",0]],"subnav":[],"filters":[["Chu kỳ","Tháng 8/2026",0],["Cách tính","Lũy kế",0]],"subject":"Thuế cơ sở 1 thành phố Hà Nội · Mã CQT 0106 · 2 phường/xã phụ trách","kpis":[["Thu trong kỳ do đơn vị quản lý","1.799 tỷ","+16,6% so cùng kỳ",0],["Lũy kế từ đầu năm","13.920 tỷ","+14,7% so cùng kỳ",0],["Dự toán năm 2026","19.374 tỷ","Chưa có số giao cho cơ quan thuế",0],["Hoàn thành dự toán","71,9%","Lũy kế trên dự toán mô phỏng",0]],"cards":[{"t":"Xu hướng thu của đơn vị","cols":[],"rows":[],"bars":[],"leg":[]},{"t":"Phường, xã đơn vị phụ trách","cols":["Phường, xã","Lũy kế (tỷ)","Tỷ trọng"],"rows":[["Ngọc Hà","8.142","58,5%"],["Trúc Bạch","5.778","41,5%"]],"bars":[],"leg":[]}],"acts":["Bộ lọc"]},"so-sanh":{"tabs":[["Tổng quan",0],["Báo cáo",0],["Phân tích thu",0],["Chi tiết Địa bàn & Đơn vị Thuế",0],["So sánh nâng cao",1]],"subnav":[],"filters":[["Chu kỳ","Tháng 8/2026",0],["Cách tính","Lũy kế",0]],"subject":"","kpis":[["Tháng 8/2025","384.009 tỷ","Vế A",0],["Tháng 8/2026","434.710 tỷ","Vế B",0],["Chênh lệch tuyệt đối","+ 50.701 tỷ","B trừ A",0],["Chênh lệch tương đối","+13,2%","Trên giá trị vế A",0]],"cards":[{"t":"Cầu nối chênh lệch","cols":[],"rows":[],"bars":[],"leg":[]},{"t":"Bảng chênh lệch","cols":["Đối tượng","A","B","Chênh","Đóng góp"],"rows":[["Khu vực kinh tế ngoài quốc doanh","79.912","96.697","▲ 16.785","33,1%"],["Thuế thu nhập cá nhân","52.758","60.237","▲ 7.479","14,8%"],["Doanh nghiệp nhà nước trung ương","50.731","55.734","▲ 5.002","9,9%"],["Tiền sử dụng đất","40.231","44.651","▲ 4.420","8,7%"]],"bars":[],"leg":[]},{"t":"Xu hướng hai vế","cols":[],"rows":[],"bars":[],"leg":[]}],"acts":["Bộ lọc"]}};

const CHINH = async () => {
/**
 * `figma.createAutoLayout` chi ton tai trong moi truong MCP. Plugin chay tai
 * may dung Plugin API tran, nen dung lai bang createFrame.
 */
const AL = (a, b) => {
  const huong = typeof a === "string" ? a : "HORIZONTAL";
  const props = (typeof a === "object" ? a : b) || {};
  const f = figma.createFrame();
  f.layoutMode = huong;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = 0;
  f.paddingLeft = 0; f.paddingRight = 0; f.paddingTop = 0; f.paddingBottom = 0;
  f.fills = [];
  for (const k of Object.keys(props)) f[k] = props[k];
  return f;
};
for (const style of ["Regular", "Medium", "Semibold", "Bold"]) {
  await figma.loadFontAsync({ family: "SF Pro", style });
}
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const V = {};
for (const c of cols) for (const id of c.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id); V[v.name] = v;
}
const TS = {};
for (const s of await figma.getLocalTextStylesAsync()) TS[s.name.replace("Typography/", "")] = s;

const paintVar = (n) => figma.variables.setBoundVariableForPaint(
  { type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", V[n]);
const fillVar = (node, n) => { node.fills = n ? [paintVar(n)] : []; };
const strokeVar = (node, n) => { node.strokes = n ? [paintVar(n)] : []; };
const radius = (node, n) => {
  for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) node.setBoundVariable(k, V[n]);
};
const T = (chars, styleName, ink, weight) => {
  const t = figma.createText();
  t.fontName = { family: "SF Pro", style: "Regular" };
  t.characters = String(chars == null ? "" : chars);
  if (TS[styleName]) t.textStyleId = TS[styleName].id;
  if (ink) fillVar(t, ink);
  if (weight) t.fontName = { family: "SF Pro", style: weight };
  return t;
};

/* Thư viện dựng ở trang `02 · Components`. Không vẽ lại hình ở đây. */
const SET = {};
for (const k of Object.keys({
  Button: 1, Tag: 1, Segment: 1, Tab: 1, Nav: 1, Change: 1, Field: 1,
  KPI: 1, TableRow: 1, BarRow: 1, Legend: 1, State: 1,
})) SET[k] = null;
const ID_SET = {
  Button: "21:18", Tag: "21:33", Segment: "21:41", Tab: "21:51", Nav: "21:61",
  Change: "21:73", Field: "21:97", KPI: "22:31", TableRow: "22:58",
  BarRow: "22:91", Legend: "22:103", State: "22:116",
};
for (const k of Object.keys(ID_SET)) SET[k] = await figma.getNodeByIdAsync(ID_SET[k]);
const ID_CO = { Card: "22:35", CardList: "22:62", Tooltip: "22:120", Fab: "22:127", Cta: "22:130" };
const CO = {};
for (const k of Object.keys(ID_CO)) CO[k] = await figma.getNodeByIdAsync(ID_CO[k]);

const bien = (set, ten) => set.children.find((c) => c.name === ten) || set.children[0];
const inst = (set, ten) => bien(set, ten).createInstance();
const dat = (node, ds) => {
  const t = node.findAll((n) => n.type === "TEXT");
  ds.forEach((v, i) => { if (t[i] && v !== null) t[i].characters = String(v); });
  return node;
};

const THU_TU = ["tong-quan", "bao-cao-nsnn", "bao-cao-budget", "bao-cao-taxpayer",
  "bao-cao-inspection", "phan-tich-thu", "chi-tiet-dia-ban", "chi-tiet-cqt", "so-sanh"];
const TEN_MAN = {
  "tong-quan": "Tổng quan", "bao-cao-nsnn": "Báo cáo · Thu NSNN",
  "bao-cao-budget": "Báo cáo · Dự toán & dự báo", "bao-cao-taxpayer": "Báo cáo · Quản lý thu",
  "bao-cao-inspection": "Báo cáo · Kết quả kiểm tra", "phan-tich-thu": "Phân tích thu",
  "chi-tiet-dia-ban": "Chi tiết · Phường/xã", "chi-tiet-cqt": "Chi tiết · Đơn vị thuế",
  "so-sanh": "So sánh nâng cao",
};
/* Bản mobile dùng nhãn rút gọn — MỘT nhãn trong DOM, không phải hai nhãn rồi
   ẩn bớt một. Đây là lý do cổng nghiệm thu từng rớt từ 18/18 xuống 12/18. */
const NHAN_NGAN = ["Tổng quan", "Báo cáo", "Phân tích", "Chi tiết", "So sánh"];

/* ── Hình đại diện cho biểu đồ ───────────────────────────────────────────── */
const rnd = (seed) => { let s = seed; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; };
const khungVe = (w, h) => {
  const f = figma.createFrame();
  f.name = "chart"; f.resize(w, h); f.fills = []; f.clipsContent = true;
  return f;
};
const luoi = (f, w, h) => {
  for (let i = 0; i <= 3; i += 1) {
    const r = figma.createRectangle();
    r.resize(w, 1); r.x = 0; r.y = Math.round((h - 18) * i / 3);
    fillVar(r, "border/divider"); f.appendChild(r);
  }
};
const veDuong = (w, h, seed) => {
  const f = khungVe(w, h);
  luoi(f, w, h);
  const n = 12, g = rnd(seed), day = h - 24;
  const diem = (bias) => Array.from({ length: n }, (_, i) =>
    [i * (w / (n - 1)), day - (0.28 + 0.55 * (i / n) + 0.16 * g()) * day * bias]);
  const path = (pts) => "M " + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L ");
  const truoc = figma.createVector();
  truoc.vectorPaths = [{ windingRule: "NONE", data: path(diem(0.82)) }];
  strokeVar(truoc, "data/reference"); truoc.strokeWeight = 2; truoc.dashPattern = [5, 4]; truoc.fills = [];
  f.appendChild(truoc);
  const nay = figma.createVector();
  nay.vectorPaths = [{ windingRule: "NONE", data: path(diem(1)) }];
  strokeVar(nay, "data/primary"); nay.strokeWeight = 2.5; nay.fills = [];
  f.appendChild(nay);
  return f;
};
const veCot = (w, h, seed) => {
  const f = khungVe(w, h);
  luoi(f, w, h);
  const n = 12, g = rnd(seed), day = h - 18, rong = Math.max(6, (w - (n - 1) * 8) / n);
  for (let i = 0; i < n; i += 1) {
    const cao = Math.max(8, (0.3 + 0.62 * g()) * day);
    const r = figma.createRectangle();
    r.resize(rong, cao);
    r.x = i * (rong + 8); r.y = day - cao;
    r.topLeftRadius = 4; r.topRightRadius = 4;
    fillVar(r, i === n - 1 ? "data/secondary" : "data/primary");
    f.appendChild(r);
  }
  return f;
};
const veDonut = (w, h, phan) => {
  const f = khungVe(w, h);
  const d = Math.min(w, h) - 8;
  const MAU = ["data/donut-1", "data/donut-2", "data/donut-3", "data/donut-4"];
  let goc = -Math.PI / 2;
  const tong = phan.reduce((a, b) => a + b, 0) || 1;
  phan.forEach((p, i) => {
    const e = figma.createEllipse();
    e.resize(d, d); e.x = (w - d) / 2; e.y = (h - d) / 2;
    const het = goc + (p / tong) * Math.PI * 2;
    e.arcData = { startingAngle: goc, endingAngle: het, innerRadius: 0.62 };
    fillVar(e, MAU[i % MAU.length]);
    f.appendChild(e);
    goc = het;
  });
  return f;
};

const theCard = (rong, tieu, phu) => {
  const c = AL("VERTICAL", { name: "Card · " + tieu, itemSpacing: 0 });
  c.clipsContent = true;
  radius(c, "radius/surface");
  fillVar(c, "surface/default");
  strokeVar(c, "border/hairline"); c.strokeWeight = 1;
  c.layoutSizingHorizontal = "FIXED";
  c.resize(rong, c.height);
  const head = AL("VERTICAL", {
    name: "header", itemSpacing: 2, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
  });
  c.appendChild(head); head.layoutSizingHorizontal = "FILL";
  head.fills = [];
  head.strokes = [paintVar("border/hairline")];
  head.strokeBottomWeight = 1;
  head.strokeTopWeight = 0; head.strokeLeftWeight = 0; head.strokeRightWeight = 0;
  const t1 = T(tieu, "Title", "ink/default", "Semibold");
  head.appendChild(t1); t1.layoutSizingHorizontal = "FILL"; t1.textAutoResize = "HEIGHT";
  if (phu) { const t2 = T(phu, "Label", "ink/tertiary"); head.appendChild(t2); t2.layoutSizingHorizontal = "FILL"; }
  const body = AL("VERTICAL", {
    name: "body", itemSpacing: 10, paddingLeft: 16, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
  });
  c.appendChild(body); body.layoutSizingHorizontal = "FILL"; body.fills = [];
  return { card: c, body };
};

const veBang = (body, cot, hang, rong) => {
  const trong = rong - 32;
  const rongCot = Math.max(58, Math.min(120, (trong - 180) / Math.max(1, cot.length - 1)));
  const dongBang = (o, dau, nang, muc, nen) => {
    const r = AL("HORIZONTAL", { name: "row", itemSpacing: 10, paddingTop: 8, paddingBottom: 8, counterAxisAlignItems: "CENTER" });
    body.appendChild(r); r.layoutSizingHorizontal = "FILL";
    fillVar(r, nen);
    r.strokes = [paintVar("border/divider")];
    r.strokeBottomWeight = 1;
    r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0;
    o.forEach((v, i) => {
      const t = T(v, dau ? "Label" : "Caption", muc, nang);
      r.appendChild(t);
      if (i === 0) { t.layoutSizingHorizontal = "FILL"; t.textAutoResize = "HEIGHT"; }
      else { t.textAlignHorizontal = "RIGHT"; t.layoutSizingHorizontal = "FIXED"; t.resize(rongCot, t.height); }
    });
  };
  dongBang(cot, true, "Semibold", "ink/secondary", "surface/sunken");
  for (const h of hang) dongBang(h, false, "Regular", "ink/default", null);
};

const veThanh = (body, ds) => {
  const max = Math.max.apply(null, ds.map((s) => parseFloat(String(s).split("|")[2]) || 1));
  for (const s of ds) {
    const p = String(s).split("|");
    const i = inst(SET.BarRow, "State=Default");
    body.appendChild(i);
    i.layoutSizingHorizontal = "FILL";
    dat(i, [p[0], p[1] + (p[2] ? "  ·  " + p[2] : "")]);
    const track = i.findOne((n) => n.name === "track");
    const fill = track && track.children[0];
    if (fill) fill.resize(Math.max(6, track.width * (parseFloat(p[2]) || 0) / max), fill.height);
  }
};

const veChuGiai = (body, ds) => {
  for (const s of ds) {
    const m = String(s).match(/^(.*?)\s([\d.,]+%)$/);
    const i = inst(SET.Legend, "State=Default");
    body.appendChild(i);
    i.layoutSizingHorizontal = "FILL";
    dat(i, [m ? m[1] : s, m ? m[2] : ""]);
  }
};

/* Chọn hình theo TỪ VỰNG của sản phẩm, không đoán bừa. */
const loaiBieuDo = (t) =>
  /xu hướng|diễn biến|dự báo|nhịp độ|cầu nối/i.test(t) ? "duong"
  : /cơ cấu/i.test(t) ? "donut"
  : "cot";

/* ─────────────────────── Vỏ nền tảng ────────────────────────────────────────
 *
 * Artboard trước đây bắt đầu thẳng từ thanh tab, nên nhìn vào không biết đang
 * xem máy tính hay điện thoại. Ba khối dưới đây dựng lại đúng phần vỏ mà sản
 * phẩm thật có: header navy của app (App.tsx:200), header rút gọn của bản
 * mobile (App.tsx:193), và thanh trạng thái iOS do chính hệ điều hành vẽ.
 */

/** Header navy của bản web — logo, tên đơn vị, hai nút xem thử. */
const veHeaderWeb = (f, kho) => {
  const dem = kho.id === "iframe" ? 16 : 38;
  const h = AL("HORIZONTAL", {
    name: "Header", itemSpacing: 24, counterAxisAlignItems: "CENTER",
    paddingLeft: dem, paddingRight: dem, paddingTop: 14, paddingBottom: 14,
  });
  f.appendChild(h);
  h.layoutSizingHorizontal = "FILL";
  h.clipsContent = true;
  fillVar(h, "navy/default");

  const mark = AL("HORIZONTAL", { name: "mark", itemSpacing: 12, counterAxisAlignItems: "CENTER" });
  h.appendChild(mark);
  mark.layoutSizingHorizontal = "FILL";
  const o = AL("HORIZONTAL", {
    name: "HN", counterAxisAlignItems: "CENTER", primaryAxisAlignItems: "CENTER",
  });
  mark.appendChild(o);
  o.layoutSizingHorizontal = "FIXED"; o.layoutSizingVertical = "FIXED";
  o.resize(34, 34);
  radius(o, "radius/control");
  fillVar(o, "on-dark/fill");
  strokeVar(o, "on-dark/line"); o.strokeWeight = 1;
  o.appendChild(T("HN", "Label", "ink/on-dark", "Bold"));

  const ten = AL("VERTICAL", { name: "title", itemSpacing: 2 });
  mark.appendChild(ten);
  ten.layoutSizingHorizontal = "FILL";
  const t1 = T("Thu Ngân sách TP Hà Nội", "Headline", "ink/on-dark", "Semibold");
  ten.appendChild(t1); t1.layoutSizingHorizontal = "FILL"; t1.textAutoResize = "HEIGHT";
  const t2 = T("Kho bạc Nhà nước khu vực I · Thành phố Hà Nội", "Label", "navy/ink");
  ten.appendChild(t2); t2.layoutSizingHorizontal = "FILL"; t2.textAutoResize = "HEIGHT";

  /* Khổ nhúng hẹp: hai nút xem thử chiếm hơn nửa hàng nên bỏ. Tên đơn vị mới
     là thứ bắt buộc phải đọc được ở khổ này. */
  if (kho.id !== "iframe") {
    const nut = AL("HORIZONTAL", { name: "tools", itemSpacing: 12, counterAxisAlignItems: "CENTER" });
    h.appendChild(nut);
    const NHAN = ["Xem thử iframe", "Xem thử mobile"];
    for (const chu of NHAN) {
      const b = AL("HORIZONTAL", {
        name: chu, paddingLeft: 14, paddingRight: 14,
        counterAxisAlignItems: "CENTER", primaryAxisAlignItems: "CENTER",
      });
      nut.appendChild(b);
      b.layoutSizingVertical = "FIXED"; b.resize(b.width, 34);
      radius(b, "radius/control");
      fillVar(b, "on-dark/fill");
      strokeVar(b, "on-dark/line"); b.strokeWeight = 1;
      b.appendChild(T(chu, "Label", "ink/on-dark", "Semibold"));
    }
  }
  return h;
};

/** Thanh trạng thái iOS — giờ, sóng, wifi, pin. Hệ điều hành vẽ, không phải app. */
const veThanhTrangThai = (f) => {
  const h = AL("HORIZONTAL", {
    name: "iOS status bar", counterAxisAlignItems: "CENTER",
    paddingLeft: 27, paddingRight: 21, paddingTop: 12, paddingBottom: 6,
  });
  f.appendChild(h);
  h.layoutSizingHorizontal = "FILL";
  h.layoutSizingVertical = "FIXED";
  h.resize(h.width, 47);
  /* Cùng màu navy với header ngay bên dưới: trên máy thật hai dải này liền
     nhau thành một mảng, cắt màu ở đây sẽ tạo một đường kẻ không có thật. */
  fillVar(h, "navy/default");

  const gio = T("9:41", "Caption", "ink/on-dark", "Semibold");
  h.appendChild(gio);
  gio.layoutSizingHorizontal = "FILL";

  const icon = AL("HORIZONTAL", { name: "icons", itemSpacing: 7, counterAxisAlignItems: "CENTER" });
  h.appendChild(icon);

  /* Sóng: bốn vạch cao dần. */
  const song = figma.createFrame();
  song.name = "signal"; song.resize(17, 11); song.fills = []; song.clipsContent = false;
  icon.appendChild(song);
  const CAO = [4, 6.3, 8.6, 11];
  CAO.forEach((cao, i) => {
    const r = figma.createRectangle();
    r.resize(3, cao); r.x = i * 4.5; r.y = 11 - cao;
    r.cornerRadius = 1;
    fillVar(r, "ink/on-dark");
    song.appendChild(r);
  });

  /* Wifi: rút còn một cung dày và một chấm — ở 11px thì ba cung đồng tâm dính
     vào nhau thành một mảng đặc, không đọc ra hình wifi nữa. */
  const wifi = figma.createFrame();
  wifi.name = "wifi"; wifi.resize(16, 11); wifi.fills = []; wifi.clipsContent = false;
  icon.appendChild(wifi);
  const cung = figma.createEllipse();
  cung.resize(16, 16); cung.x = 0; cung.y = 0;
  cung.arcData = { startingAngle: -Math.PI * 0.82, endingAngle: -Math.PI * 0.18, innerRadius: 0.62 };
  fillVar(cung, "ink/on-dark");
  wifi.appendChild(cung);
  const cham = figma.createEllipse();
  cham.resize(3.4, 3.4); cham.x = 6.3; cham.y = 7.4;
  fillVar(cham, "ink/on-dark");
  wifi.appendChild(cham);

  /* Pin: vỏ, nắp, phần pin còn lại. */
  const pin = figma.createFrame();
  pin.name = "battery"; pin.resize(27, 13); pin.fills = []; pin.clipsContent = false;
  icon.appendChild(pin);
  const vo = figma.createRectangle();
  vo.resize(24, 12); vo.x = 0; vo.y = 0.5; vo.cornerRadius = 4;
  vo.fills = [];
  strokeVar(vo, "ink/on-dark"); vo.strokeWeight = 1; vo.opacity = 0.42;
  pin.appendChild(vo);
  const nap = figma.createRectangle();
  nap.resize(1.6, 4.6); nap.x = 25; nap.y = 4.2; nap.cornerRadius = 1;
  fillVar(nap, "ink/on-dark"); nap.opacity = 0.42;
  pin.appendChild(nap);
  const con = figma.createRectangle();
  con.resize(18, 8); con.x = 2; con.y = 2.5; con.cornerRadius = 2.4;
  fillVar(con, "ink/on-dark");
  pin.appendChild(con);
  return h;
};

/** Header rút gọn của bản mobile: tên sản phẩm + tên màn đang mở. */
const veHeaderMobile = (f, tenMan) => {
  const h = AL("VERTICAL", {
    name: "Mobile header", itemSpacing: 1,
    paddingLeft: 12, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
  });
  f.appendChild(h);
  h.layoutSizingHorizontal = "FILL";
  fillVar(h, "navy/default");
  const t1 = T("Thu Ngân sách TP Hà Nội", "Title", "ink/on-dark", "Bold");
  h.appendChild(t1); t1.layoutSizingHorizontal = "FILL"; t1.textAutoResize = "HEIGHT";
  const t2 = T(tenMan, "Label", "navy/ink");
  h.appendChild(t2); t2.layoutSizingHorizontal = "FILL"; t2.textAutoResize = "HEIGHT";
  return h;
};

/** Vạch home của iPhone — đè lên thanh điều hướng, đúng như trên máy thật. */
const veVachHome = (f, kho) => {
  const r = figma.createRectangle();
  r.name = "Home indicator";
  r.resize(139, 5);
  r.cornerRadius = 2.5;
  fillVar(r, "ink/default");
  f.appendChild(r);
  r.layoutPositioning = "ABSOLUTE";
  r.x = (kho.w - 139) / 2;
  r.y = kho.h - 13;
  return r;
};

/**
 * Vỏ iPhone bao ngoài artboard mobile.
 *
 * Màu vỏ viết thẳng bằng giá trị chứ không qua biến: đây là cái MÁY, không
 * phải giao diện sản phẩm. Đưa màu vỏ nhôm vào bảng màu thiết kế thì lần sau
 * sẽ có người lấy nó tô cho một cái thẻ.
 */
const veKhungMay = (man, kho) => {
  const VIEN = 14;   /* độ dày viền máy quanh màn hình */
  const BO_MAY = 56; /* bo góc thân máy */
  const BO_MAN = 44; /* bo góc màn hình, nhỏ hơn thân đúng bằng độ dày viền */

  const may = figma.createFrame();
  may.name = "iPhone 14 · " + man.name;
  may.resize(kho.w + VIEN * 2, kho.h + VIEN * 2);
  may.cornerRadius = BO_MAY;
  may.clipsContent = true;
  may.fills = [{ type: "SOLID", color: { r: 0.055, g: 0.06, b: 0.07 } }];
  /* Vành sáng mảnh: thiếu nó thì thân máy đen dính vào nền tối và mất hẳn
     đường viền — đúng thứ làm người xem nhận ra đây là một cái máy. */
  may.strokes = [{ type: "SOLID", color: { r: 0.35, g: 0.37, b: 0.4 } }];
  may.strokeWeight = 1.5;
  may.strokeAlign = "INSIDE";

  /* Màn hình: bo góc và cắt sát, nên bốn góc giao diện bị bo đúng như máy thật. */
  man.x = VIEN;
  man.y = VIEN;
  man.cornerRadius = BO_MAN;
  man.clipsContent = true;
  may.appendChild(man);

  /*
    Tai thỏ treo từ mép trên xuống: chỉ bo hai góc DƯỚI. Bo cả bốn góc thì nó
    thành một viên thuốc lơ lửng, không dính vào cạnh máy.

    Thanh trạng thái bên dưới đã chừa sẵn hai bên — giờ ở trái, cụm sóng/wifi/
    pin ở phải — nên tai thỏ rơi vào đúng khoảng trống giữa, không đè lên gì.
  */
  const tai = figma.createRectangle();
  tai.name = "Notch";
  tai.resize(162, 32);
  tai.topLeftRadius = 0;
  tai.topRightRadius = 0;
  tai.bottomLeftRadius = 16;
  tai.bottomRightRadius = 16;
  tai.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  tai.x = VIEN + (kho.w - 162) / 2;
  tai.y = VIEN;
  may.appendChild(tai);

  return may;
};

const veMan = (id, kho) => {
  const d = D[id];
  const f = figma.createFrame();
  f.name = TEN_MAN[id] + " · " + kho.ten + " " + kho.w + "×" + kho.h;
  f.resize(kho.w, kho.h);
  f.clipsContent = true;
  fillVar(f, "surface/canvas");
  f.layoutMode = "VERTICAL";
  f.primaryAxisSizingMode = "FIXED";
  f.counterAxisSizingMode = "FIXED";
  f.itemSpacing = 0;

  const mobile = kho.id === "mobile";
  const dem = mobile ? 12 : kho.id === "iframe" ? 16 : 24;

  /* Vỏ nền tảng dựng TRƯỚC nội dung: nhìn vào artboard phải biết ngay đây là
     máy tính hay điện thoại, trước cả khi đọc đến con số đầu tiên. */
  if (mobile) {
    veThanhTrangThai(f);
    veHeaderMobile(f, TEN_MAN[id]);
  } else {
    veHeaderWeb(f, kho);
  }

  /* Điều hướng trên cùng chỉ có ở bản web. Bản mobile dùng thanh đáy. */
  if (!mobile) {
    const bar = AL("HORIZONTAL", {
      name: "Tab bar", itemSpacing: kho.id === "iframe" ? 14 : 24,
      paddingLeft: dem, paddingRight: dem, counterAxisAlignItems: "MAX",
    });
    f.appendChild(bar);
    bar.layoutSizingHorizontal = "FILL";
    fillVar(bar, "surface/canvas");
    bar.strokes = [paintVar("border/hairline")];
    bar.strokeBottomWeight = 1;
    bar.strokeTopWeight = 0; bar.strokeLeftWeight = 0; bar.strokeRightWeight = 0;
    bar.clipsContent = true;
    d.tabs.forEach((t) => {
      const i = inst(SET.Tab, t[1] ? "State=Active" : "State=Default");
      bar.appendChild(i);
      dat(i, [t[0]]);
    });
  }

  const than = AL("VERTICAL", {
    name: "Body", itemSpacing: mobile ? 12 : 16,
    paddingLeft: dem, paddingRight: dem, paddingTop: mobile ? 12 : 16, paddingBottom: 16,
  });
  f.appendChild(than);
  than.layoutSizingHorizontal = "FILL";
  than.layoutSizingVertical = "FILL";
  than.fills = [];
  than.clipsContent = true;
  const rongThan = kho.w - dem * 2;

  if (!mobile) {
    const loc = AL("HORIZONTAL", { name: "Filter bar", itemSpacing: 12, counterAxisAlignItems: "MAX" });
    loc.layoutWrap = "WRAP"; loc.counterAxisSpacing = 10;
    than.appendChild(loc); loc.layoutSizingHorizontal = "FILL";
    for (const ff of d.filters.slice(0, kho.id === "iframe" ? 2 : 4)) {
      const i = inst(SET.Field, "State=" + (ff[2] ? "Disabled" : "Default") + ", Size=Desktop");
      loc.appendChild(i);
      i.resize(kho.id === "iframe" ? 150 : 190, i.height);
      dat(i, [ff[0], ff[1] || "—", "⌄"]);
    }
    const nut = AL("HORIZONTAL", { name: "actions", itemSpacing: 8, counterAxisAlignItems: "MAX" });
    loc.appendChild(nut);
    for (const a of d.acts.slice(0, kho.id === "iframe" ? 2 : 4)) {
      const chinh = /Xuất|So sánh/.test(a);
      const i = inst(SET.Button, "Type=" + (chinh ? "Primary" : "Secondary") + ", Size=Desktop");
      nut.appendChild(i);
      dat(i, [a]);
    }
  }

  if (d.subnav.length) {
    const sn = AL("HORIZONTAL", { name: "Subnav", itemSpacing: 6 });
    sn.layoutWrap = "WRAP"; sn.counterAxisSpacing = 6;
    than.appendChild(sn); sn.layoutSizingHorizontal = "FILL";
    d.subnav.forEach((s) => {
      const b = AL("HORIZONTAL", {
        name: s[0], paddingLeft: 11, paddingRight: 11, counterAxisAlignItems: "CENTER", primaryAxisAlignItems: "CENTER",
      });
      sn.appendChild(b);
      b.layoutSizingVertical = "FIXED";
      b.resize(b.width, mobile ? 40 : 34);
      radius(b, "radius/control");
      fillVar(b, s[1] ? "brand/default" : "surface/default");
      strokeVar(b, s[1] ? "brand/default" : "border/hairline"); b.strokeWeight = 1;
      b.appendChild(T(s[0], "Label", s[1] ? "ink/on-dark" : "ink/secondary", "Semibold"));
    });
  }

  if (d.subject) {
    const s = T(d.subject, "Headline", "ink/default", "Semibold");
    than.appendChild(s);
    s.layoutSizingHorizontal = "FILL"; s.textAutoResize = "HEIGHT";
  }

  /* Dải KPI GIỮ ĐỦ mọi ô ở mobile, chỉ đổi cách xếp: 2 cột thay vì một hàng. */
  const soCot = mobile || kho.id === "iframe" ? 2 : (d.kpis.length === 6 ? 3 : d.kpis.length);
  const dai = AL("HORIZONTAL", { name: "KPI", itemSpacing: 0 });
  dai.layoutWrap = "WRAP"; dai.counterAxisSpacing = 0;
  than.appendChild(dai);
  dai.layoutSizingHorizontal = "FILL";
  dai.clipsContent = true;
  radius(dai, "radius/surface");
  strokeVar(dai, "border/hairline"); dai.strokeWeight = 1;
  fillVar(dai, "surface/default");
  const rongO = Math.floor(rongThan / soCot);
  d.kpis.forEach((k, idx) => {
    const i = inst(SET.KPI, k[3] ? "Kind=Insight Neutral" : "Kind=Number");
    dai.appendChild(i);
    i.resize(idx % soCot === soCot - 1 ? rongThan - rongO * (soCot - 1) : rongO, i.height);
    dat(i, k[3] ? [k[0], k[1], k[2]] : [k[0], k[1], "", k[2]]);
    /* Chỉ giữ viền trái/trên: hai ô cạnh nhau mà ô nào cũng đủ bốn viền thì
       đường kẻ giữa dày 2px và dải KPI trông như bị kẻ đôi. */
    i.strokeLeftWeight = idx % soCot === 0 ? 0 : 1;
    i.strokeTopWeight = idx < soCot ? 0 : 1;
    i.strokeRightWeight = 0; i.strokeBottomWeight = 0;
  });

  const soCotThe = mobile || kho.id === "iframe" ? 1 : 2;
  const luoiThe = AL("HORIZONTAL", { name: "Cards", itemSpacing: 16 });
  luoiThe.layoutWrap = "WRAP"; luoiThe.counterAxisSpacing = 16;
  than.appendChild(luoiThe);
  luoiThe.layoutSizingHorizontal = "FILL";
  const rongThe = soCotThe === 1 ? rongThan : Math.floor((rongThan - 16) / 2);

  d.cards.forEach((ct, k) => {
    const rong = ct.cols.length >= 5 && soCotThe === 2 ? rongThan : rongThe;
    const t = theCard(rong, ct.t, k === 0 ? "Luỹ kế đến tháng 8/2026 · số mô phỏng" : null);
    luoiThe.appendChild(t.card);
    if (ct.rows.length) {
      if (mobile) {
        /* Bảng ở mobile thành thẻ, GIỮ ĐỦ mọi cột dưới dạng cặp nhãn–giá trị. */
        ct.rows.slice(0, 3).forEach((r) => {
          const i = CO.CardList.createInstance();
          t.body.appendChild(i);
          i.layoutSizingHorizontal = "FILL";
          const cap = [];
          for (let c = 1; c < 5; c += 1) cap.push(ct.cols[c] || "", r[c] || "—");
          dat(i, [r[0]].concat(cap));
        });
      } else {
        veBang(t.body, ct.cols, ct.rows, rong);
      }
    } else if (ct.bars.length) {
      veThanh(t.body, ct.bars);
    } else if (ct.leg.length) {
      const pct = ct.leg.map((s) => {
        const m = String(s).match(/([\d,]+)%/);
        return m ? parseFloat(m[1].replace(",", ".")) : 1;
      });
      const hang = AL(mobile ? "VERTICAL" : "HORIZONTAL", { name: "donut", itemSpacing: 16, counterAxisAlignItems: "CENTER" });
      t.body.appendChild(hang); hang.layoutSizingHorizontal = "FILL";
      hang.appendChild(veDonut(150, 150, pct));
      const ds = AL("VERTICAL", { name: "legend", itemSpacing: 4 });
      hang.appendChild(ds); ds.layoutSizingHorizontal = "FILL";
      veChuGiai(ds, ct.leg);
    } else {
      const loai = loaiBieuDo(ct.t);
      const w = rong - 32, h = mobile ? 150 : 190;
      t.body.appendChild(loai === "duong" ? veDuong(w, h, k + 7) : loai === "donut" ? veDonut(w, h, [42, 27, 19, 12]) : veCot(w, h, k + 3));
      const ghi = T(loai === "duong" ? "Kỳ này (nét liền) · Cùng kỳ (nét đứt) — số mô phỏng" : "Số mô phỏng", "Label", "ink/tertiary");
      t.body.appendChild(ghi); ghi.layoutSizingHorizontal = "FILL";
    }
  });

  /* ── Riêng mobile: thanh điều hướng đáy + nút lọc nổi ──────────────────── */
  if (mobile) {
    const nav = AL("HORIZONTAL", { name: "Bottom nav", itemSpacing: 0 });
    f.appendChild(nav);
    nav.layoutSizingHorizontal = "FILL";
    fillVar(nav, "surface/default");
    nav.strokes = [paintVar("border/hairline")];
    nav.strokeTopWeight = 1;
    nav.strokeBottomWeight = 0; nav.strokeLeftWeight = 0; nav.strokeRightWeight = 0;
    nav.paddingBottom = 30; /* chừa chỗ cho vạch home của iPhone */ /* chừa vùng an toàn dưới đáy máy */
    d.tabs.forEach((t, k) => {
      const i = inst(SET.Nav, t[1] ? "State=Active" : "State=Default");
      nav.appendChild(i);
      i.layoutSizingHorizontal = "FILL";
      dat(i, [NHAN_NGAN[k]]);
    });
    const fab = CO.Fab.createInstance();
    f.appendChild(fab);
    fab.layoutPositioning = "ABSOLUTE";
    fab.x = kho.w - fab.width - 16;
    fab.y = kho.h - 76 - 48;
    dat(fab, ["☰", "Bộ lọc · " + d.filters.length]);
    veVachHome(f, kho);
  }
  return f;
};

/*
  MOI KHO MOT PAGE RIENG.

  Ba kho nam chung mot page thi phai cuon ngang qua 27 artboard moi tim duoc
  cai can xem, va thiet bi trinh chieu - thu chi dat duoc o cap PAGE - se ap
  chung cho ca ba. Tach page thi moi kho duyet duoc doc lap.
*/
const KHO = [
  { id: "desktop", ten: "Desktop", w: 1440, h: 1024, page: "03 · Desktop" },
  { id: "iframe", ten: "Nhúng iframe", w: 500, h: 900, page: "04 · Nhúng iframe" },
  { id: "mobile", ten: "Điện thoại", w: 390, h: 844, page: "05 · Điện thoại" },
];

/*
  Thu tu chon page: dung ten -> page cua ban truoc -> mot page dang trong ->
  tao moi. Goi Starter co the chan `createPage()`, nen doi ten mot page trong
  luon duoc uu tien hon.
*/
const daDung = [];
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

const daTao = [];
const ketQua = [];
const loi = [];
for (const kho of KHO) {
  const page = layPage(kho.page);
  for (const c of page.children.slice()) c.remove();
  page.backgrounds = [{ type: "SOLID", color: { r: 0.949, g: 0.961, b: 0.976 } }];
  /*
    KHONG dat duoc thiet bi trinh chieu tu day.

    `PageNode.prototypeDevice` khong co setter, va PageNode la doi tuong khong
    mo rong duoc, nen moi phep gan deu nem "object is not extensible" - da thu
    sau dang tham so tren ca ba page, hong y het nhau. Day la gioi han cua
    Plugin API chu khong phai loi tham so.

    Bu lai, VO NEN TANG duoc ve thang vao artboard (thanh trang thai iOS, vach
    home, header navy cua app), nen nhin canvas la biet ngay kho nao la kho nao
    ma khong can den che do trinh chieu. Ai can khung may luc Present thi dat
    tay trong panel Prototype cua tung page.
  */
  const hang = AL("HORIZONTAL", { name: kho.ten, itemSpacing: 64, counterAxisAlignItems: "MIN" });
  hang.fills = [];
  page.appendChild(hang);
  hang.x = 0; hang.y = 0;
  for (const id of THU_TU) {
    const f = veMan(id, kho);
    /* Chi ban dien thoai moi co vo may. Kho nhung iframe cung hep nhung no la
       mot khung nhung trong trang khac, khong phai mot cai may. */
    hang.appendChild(kho.id === "mobile" ? veKhungMay(f, kho) : f);
    daTao.push(f.id);
  }
  ketQua.push(page.name + " · " + THU_TU.length + " artboard");
}
await figma.setCurrentPageAsync(figma.root.children.find((p) => p.name === KHO[0].page));

return { soArtboard: daTao.length, trang: ketQua, loi: loi, artboardIds: daTao };
};

return await CHINH();
