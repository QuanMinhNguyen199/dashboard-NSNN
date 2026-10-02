# Đối chiếu giao diện với general_data

Ngày đối chiếu: 02/10/2026.

## Căn cứ và phạm vi

Đã kiểm tra toàn bộ 35 tệp trong `general_data`: đọc hai tài liệu Markdown mới, nội dung hướng dẫn/văn bản theo định dạng thật và cấu trúc các bảng tính. Không đưa dữ liệu NNT thật vào prototype. Các bảng tính được kiểm tra tên sheet, cấu trúc và tiêu đề; đây không phải kiểm toán từng dòng số liệu.

- `NewBRD/design_ql1ql3.md`: căn cứ trực tiếp cho màn hình, tab và quyền của bản thiết kế QL1/QL3.
- `NewBRD/brd-he-thong-du-lieu-tap-trung-tu-dong-hoa-nghiep-vu-to-quan-ly.md`: phạm vi nghiệp vụ chung của QLDN1–QLDN5.
- `NewBRD/QL1 output` và `NewBRD/QL3 output`: mẫu đầu ra để đối chiếu chỉ tiêu.
- Tệp QL1–QL5: bằng chứng quy trình, nguồn dữ liệu và mẫu cũ; không tự biến mỗi tệp hay mỗi phòng thành một tab của bản thiết kế QL1/QL3.

## Quyết định về điều hướng

| Mục hiện hành | Căn cứ | Quyết định |
|---|---|---|
| Công việc theo kỳ | Thiết kế §3: danh sách việc/dữ liệu kỳ | Giữ |
| Báo cáo công tác nợ | Thiết kế §4; BRD §8.1 | Giữ, đặt lại tên rõ chức năng báo cáo |
| QL1: Tổng quan | §4.2 tab 0; §4.3 | Giữ |
| QL1: So sánh nợ và danh sách DN tăng nợ | §4.2 tab 1–2; sheet So_Sanh_No, DS_DN_TangnoTren500tr | Giữ cùng nhóm nghiệp vụ |
| QL1: Kết quả cưỡng chế và danh sách chưa cưỡng chế | §4.2 tab 3, 5 | Giữ; danh sách loại trường hợp đã cưỡng chế |
| QL1: Tạm hoãn xuất cảnh và danh sách trên ngưỡng chưa tạm hoãn | §4.2 tab 4, 6 | Giữ; danh sách theo ngưỡng dữ liệu, loại trường hợp đã tạm hoãn |
| QL1: Tạm hoãn XC · trạng thái 06 và danh sách chưa tạm hoãn | §4.2 tab 7–8 | Giữ; không gọi chung chung là Trạng thái 06 |
| QL1: Quy tắc và nguồn | §4.2 tab 9; QuyTac_Nguon | Giữ, liên kết sang nguồn dữ liệu |
| QL1: Dữ liệu gốc | §1.2, §3, §4.2 tab 10, §4.4 | Giữ; đây là tab, không phải bộ lọc |
| QL3: Tổng quan, Kết quả tổng hợp, Dữ liệu gốc | §5.2–5.4 | Giữ |
| QL3: Đối chiếu báo cáo thủ công | §5.2 tab 3, đề xuất thí điểm [R] | Giữ trạng thái chưa có báo cáo đối chiếu; không khẳng định đã khớp dữ liệu |
| Tình trạng dữ liệu | §1.2, §1.1; BRD YC-CĐ-03/04, YC-VH-03 | Giữ các mục lịch sử thu thập, lô dữ liệu, đơn vị quản lý NNT |
| Giám sát dữ liệu | §3: vai vận hành dữ liệu | Giữ theo quyền |
| Màn Báo cáo riêng với tạo/phát hành | Không được yêu cầu như một màn riêng trong thiết kế QL1/QL3 | Không khôi phục màn cũ; mở báo cáo QL1 ngay từ menu Báo cáo công tác nợ |
| Hoàn thuế, rủi ro hóa đơn, màn quy tắc chung độc lập | Thuộc BRD rộng hơn, không thuộc sitemap bản thiết kế QL1/QL3 | Không thêm lại các mục đã gỡ |

Các tab còn hiển thị đều có căn cứ; không xóa Dữ liệu gốc hoặc tab Đối chiếu chỉ vì không phải sheet Excel gốc. Bảy nhóm QL1 hiện gom nội dung của 11 tab thiết kế; không tuyên bố đã hoàn thành đầy đủ từng yêu cầu trong tài liệu.

## Quy ước câu chữ

- Báo cáo công tác nợ; Công việc theo kỳ; Quy tắc và nguồn.
- Thu thập dữ liệu thay cho kéo về; đơn vị quản lý NNT thay cho gắn về phòng; lượt thu thập bị lỗi thay cho job hỏng.
- Nháp → Chờ duyệt → Đã chốt; hành động Gửi trưởng phòng duyệt, Trả lại, Duyệt và chốt số.
- Giữ tên chỉ tiêu của mẫu; viết rõ người nộp thuế, mã số thuế trong tên thao tác. Các viết tắt NNT/MST/CQT vẫn dùng trong cột nghiệp vụ.
- Nguồn dùng cho mục nào được ghi bằng tên nghiệp vụ, không ghi Tab 1/2 khi giao diện đã gộp tab.
- Chênh lệch số dòng cần đối chiếu nhật ký; không kết luận tất cả số tiền đều thiếu tương ứng.
- Chỉ so ngày chốt của nguồn hiện tại; nguồn đầu năm, tháng trước, tuần trước và kế hoạch năm có mốc riêng.
- Không tự đặt ngày hiệu lực. Ngưỡng cưỡng chế và tạm hoãn vẫn chờ xác nhận theo thiết kế §4.2; số trong bộ dữ liệu mô phỏng không phải xác nhận pháp lý.
- Bỏ các dòng dẫn đầu trang và mô tả lặp lại theo yêu cầu người dùng; giữ thông tin kỳ, đơn vị tính và cảnh báo có ảnh hưởng tới việc sử dụng số liệu.

## Giới hạn hiện có

Xem từng dòng dữ liệu gốc và tải báo cáo đối chiếu chưa được triển khai đầy đủ. Luồng duyệt là mô phỏng theo phiên trình duyệt; quyền nghiệp vụ và quy trình thật vẫn cần xác nhận theo Q-78/Q-79/Q-81.

## Khôi phục chức năng báo cáo và rà soát vai trò

- Theo G7 và §1.1 của thiết kế: QL1 có Xuất cả bộ báo cáo (Excel 9 sheet), Xuất báo cáo Word, Xuất Excel tại bảng tổng hợp và Xuất danh sách đang lọc. QL3 có xuất Excel 17 cột. Công việc theo kỳ có lối mở báo cáo của phòng.
- Excel giữ cấu trúc cột nghiệp vụ của các mẫu đầu ra, kỳ, phạm vi đơn vị, người xuất và trạng thái duyệt. Danh sách xuất gồm toàn bộ kết quả lọc, không chỉ trang đang xem. Bố cục tiêu đề được dựng lại, chưa phải bản sao định dạng nguyên mẫu.
- Word chứa bốn bảng tổng hợp QL1. Đây là báo cáo mô phỏng, chưa có phần nhận xét được phê duyệt hoặc đầy đủ thể thức văn bản chính thức. Tất cả tệp ghi rõ dữ liệu mô phỏng.
- CV chỉ gửi trưởng phòng duyệt; TP chỉ duyệt/chốt hoặc trả lại báo cáo đang chờ duyệt của phòng mình. Kiểm tra quyền cả khi thực hiện chuyển trạng thái, không chỉ ẩn nút.
- Danh sách công việc đã lọc theo phòng và vai trò để CV không thấy nhiệm vụ duyệt của TP. TP không có thao tác tải tệp thủ công hay xác nhận đơn vị quản lý NNT, theo ma trận §3.
- Dữ liệu gốc, Quy tắc và nguồn, lịch sử thu thập, lô dữ liệu và đơn vị quản lý NNT vẫn có trong các màn nghiệp vụ. Không khôi phục màn tạo/phát hành báo cáo chung vì thiết kế không yêu cầu màn riêng đó.

Đã kiểm tra tải Excel/Word thực tế, số sheet/cột, công thức tổng, trạng thái nháp/đã chốt và luồng CV → TP trên trình duyệt. Phân quyền hiện là kiểm tra trong ứng dụng mô phỏng; khi nối nguồn thật cần thực thi lại ở backend.

## Danh mục tệp đã kiểm tra

Nhiều tệp mang đuôi không khớp nội dung. Bảng dưới ghi định dạng thực tế, không sửa hay đổi tên tệp nguồn.

| Tệp | Định dạng/nội dung kiểm tra |
|---|---|
| `NewBRD/brd-he-thong-du-lieu-tap-trung-tu-dong-hoa-nghiep-vu-to-quan-ly.md` | .md |
| `NewBRD/design_ql1ql3.md` | .md |
| `NewBRD/QL1 output/BAO_CAO_DANH_GIA_CONG_TAC_NO_DN_TO_CHUC_THANG7.2026.xlsx` | .xlsx; 9 sheet: So_Sanh_No, DS_DN_TangnoTren500tr, Danh gia Ket qua cuong che, Danh gia Tam hoan XC, DS NNT chua cuong che, DS tren 500tr chua Hoan XC, QuyTac_Nguon, Bao_cao_tong_hop, DS_chua_tam_hoan |
| `NewBRD/QL3 output/1_QL3_3_KQ tong hop cuoi cung.xls` | .xls; 1 sheet: TH DN trong ke hoach nam |
| `QL1/1.BC chốt sổ tháng 8 (2).xlsx` | Word nhị phân: đã trích nội dung |
| `QL1/5.DS rà soát cưỡng chế tài khoản tháng 09.2026 (2).xls` | xlsx; 3 sheet: Trang_tính1, Trang_tính2, 01NNT_BC |
| `QL1/6.danh bạ NNT (2).xls` | xlsx; 1 sheet: Sheet1 |
| `QL1/BAO CAO CONG TAC NO KHOI DN TO CHUC (THANG 7.2026) (2).doc` | xlsx; 4 sheet: Trang_tính2, Trang_tính3, Trang_tính4, Trang_tính1 |
| `QL1/BAO CAO CONG TAC NO KHOI DN TO CHUC (TUAN 1 - THANG 7.2026) (2).doc` | xls; 1 sheet: Sheet1 |
| `QL1/BAO CAO CONG TAC NO KHOI DN TO CHUC (TUAN 2 - THANG 7.2026) (2).doc` | Word nhị phân: đã trích nội dung |
| `QL1/BAO CAO CONG TAC NO KHOI DN TO CHUC (TUAN 3 - THANG 7.2026) (2).doc` | xlsx; 4 sheet: Ket qua Cuong che, DS tren nguong chua CC, Danh gia Tam hoan XC, DS tren 500tr chua Hoan XC |
| `QL1/BAO CAO CONG TAC NO KHOI DN TO CHUC (TUAN 4 - THANG 7.2026) (2).doc` | xlsx; 3 sheet: So_Sanh_No, DanhSachNNTtangNoTren500tr, DS_DN_TangnoTren500tr |
| `QL1/BAO CAO DANH GIA CONG TAC NO TUAN. _07.07.2026 (2).xlsx` | Excel XML; 1 sheet: NNT |
| `QL1/BAO CAO DANH GIA CONG TAC NO TUAN. _16.07.2026 (2).xlsx` | .xlsx; 9 sheet: So_Sanh_No, DS_DN_TangnoTren500tr, Danh gia Ket qua cuong che, Danh gia Tam hoan XC, DS NNT chua cuong che, DS tren 500tr chua Hoan XC, QuyTac_Nguon, Bao_cao_tong_hop, DS_chua_tam_hoan |
| `QL1/BAO_CAO_DANH_GIA_CONG_TAC_NO_DN_TO_CHUC_20260722 (002) (2).xlsx` | .xlsx; 2 sheet: Bao_cao_tong_hop, DS_chua_tam_hoan |
| `QL1/BAO_CAO_DANH_GIA_CONG_TAC_NO_DN_TO_CHUC_THANG7.2026 (2).xlsx` | .xlsx; 1 sheet: Trang_tính1 |
| `QL2/2_QLD2_1_kéo dữ liệu.docx` | ZIP chứa bảng tính Excel |
| `QL2/Mẫu báo cáo.xlsx` | .xlsx; 3 sheet: foxz, Tong hop 01GTGT, Tong hop 03,04GTGT |
| `QL2/QLDN 2 kéo dữ liệu (1).docx` | ZIP chứa bảng tính Excel |
| `QL3/1_QL3_2_File tho keo TTR ra (da ghep 30 CQT) (1).xls` | Word nhị phân: đã trích nội dung |
| `QL3/1_QL3_3_KQ tong hop cuoi cung (1).xls` | .xls; 2 sheet: Data, Tiếp theo...1 |
| `QL3/1_QL3_4_TH (03092026).xls` | .xls; 1 sheet: TH DN trong ke hoach nam |
| `QL3/1_QL3_5_TH (BC chon ke hoach) DS TPR RR cao 2026 p.Ktra1 ban giao L3 (ghep 31.110TCS+2.994pQLDN) (da chay lai CQT)- nen.xlsb` | xls; 9 sheet: Sheet1, Sheet2, Sheet6, Sheet7, Sheet9, TH DN trong ke hoach nam, Sheet4, Data, Sheet3 |
| `QL4/11.9.2026 BAO CAO HOAN.xlsx` | .xlsx; 4 sheet: Sheet, Sheet3, User, Sai hạn |
| `QL4/4_QL4_1_BAO_CAO_CUOC_GOI_THEO_NHAN_VIEN_nhung05_22_09_2026_1790074533407.xlsx` | docx |
| `QL4/4_QL4_2_BC Phieu ghi 260922.xlsx` | .xlsx; 1 sheet: 01 |
| `QL4/7.8.2026 BAO CAO HOAN.xlsx` | .xlsx; 50 sheet: foxz_19, foxz_20, foxz_21, foxz_22, foxz_23, foxz_24, foxz_25, foxz_26, foxz_27, foxz_28, foxz_29, foxz_30, foxz_31, foxz_32, foxz_33, foxz_34, foxz_35, foxz_36, foxz_37, foxz_38, foxz_39, foxz_40, foxz_41, foxz_42, foxz_43, foxz_44, foxz_45, foxz_46, foxz_47, foxz_48, foxz_49, foxz_2, foxz_3, foxz_4, foxz_5, foxz_6, foxz_7, foxz_8, foxz_9, foxz_10, foxz_11, foxz_12, foxz_13, foxz_14, foxz_15, foxz_16, foxz_17, foxz_18, BAOCAOTUANCHUAN, CHẤM ĐIỂM |
| `QL4/7.8.2026 CCT tồn.xlsx` | .xlsx; 1 sheet: Sheet1 |
| `QL4/7.8.2026 VPC tồn.xlsx` | .xlsx; 1 sheet: Sheet1 |
| `QL5/5_QL5_1_Thuế cơ sở 1 - T9_Rà soát đối tượng.XLSX` | .XLSX; 2 sheet: Nop thua, Sheet1 |
| `QL5/5_QL5_2_Thuế cơ sở 1 - T8_Rà soát đối tượng.XLSX` | .XLSX; 1 sheet: Sheet1 |
| `QL5/5_QL5_3_TONG HOP BAO CAO XPVPHC_xử phạt.xlsx` | .xlsx; 1 sheet: Sheet1 |
| `QL5/5_QL5_4_BAO CAO QL DOI TUONG THANG 8.xlsx` | .xlsx; 31 sheet: TONG HOP, QLDN1, QLDN2, QLDN3, QLDN4, QLDN5, TCS1, TCS2, TCS3, TCS4, TCS5, TCS6, TCS7, TCS8, TCS9, TCS10, TCS11, TCS12, TCS13, TCS14, TCS15, TCS16, TCS17, TCS18, TCS19, TCS20, TCS21, TCS22, TCS23, TCS24, TCS25 |
| `QL5/5_QL5_5_BC dong MST_tuan3 thang9.xlsx` | .xlsx; 4 sheet: TONG HOP, báo cáo QLDN5, Dữ liệu nợ QLDN1, 1.QLĐT |
| `QL5/5_QL5_CÁC BƯỚC KÉO DỮ LIỆU NỘP THỪA.doc` | xlsx; 1 sheet: Tuan2_thang9 |
