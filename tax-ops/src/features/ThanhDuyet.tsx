import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge, Button } from "@/components/ui";
import { useAction } from "@/state/ActionContext";
import { useDuyet } from "@/state/DuyetContext";
import type { ReportStatus, Tone } from "@/domain/types";

/*
  Thanh duyệt của kỳ, đặt ngay đầu phân hệ.

  Mục 3 bản thiết kế vẽ luồng duyệt chạy trên chính phân hệ, nên trạng thái và
  thao tác phải nằm cạnh bảng số liệu mà nó nói về. Đặt chúng ở một màn "Báo
  cáo" riêng thì người duyệt phải rời khỏi số vừa đọc để đi tìm nút duyệt, và
  lúc bấm thì không còn nhìn thấy thứ mình đang duyệt.

  Tên trạng thái lấy theo BC-06 của FRS: **Nháp → Đã rà soát → Đã duyệt**, cộng
  **Điều chỉnh** mở từ bản đã duyệt. Trước đó bản demo dùng bộ tên của bản
  thiết kế ("Chờ duyệt", "Đã chốt"); FRS là tài liệu đặc tả chức năng nên nó
  chốt cách gọi, và hai tài liệu nói hai tên cho cùng một bước là thứ phải
  dừng ở đây chứ không mang sang lúc triển khai.

  Một nhãn và một màu cho mỗi trạng thái, giống nhau với mọi vai — cùng một kỳ
  mà chuyên viên gọi tên khác người duyệt thì hai người không đối chiếu được
  màn hình với nhau.
*/

const NHAN: Record<ReportStatus, string> = {
  DRAFT: "Nháp",
  REVIEWED: "Đã rà soát",
  APPROVED: "Đã duyệt",
  AMEND: "Đang điều chỉnh",
  BLOCKED: "Chưa đủ dữ liệu",
};

const SAC: Record<ReportStatus, Tone> = {
  DRAFT: "neutral", REVIEWED: "warning", APPROVED: "positive", AMEND: "info", BLOCKED: "critical",
};

/*
  Việc vừa làm xong — một nút ĐÃ TẮT, đứng đúng chỗ nút vừa biến mất.

  Trước đây chỗ này là một dòng chữ phụ ("Việc đang ở người duyệt của phòng").
  Nó có hai cái dở. Thứ nhất, nó lặp lại điều mà `DIEN_GIAI` ở khối trạng thái
  bên trái đã nói, chỉ bằng chữ khác. Thứ hai, và nặng hơn: bấm Gửi duyệt xong
  thì nút biến mất và chỗ ấy thành một câu văn — người dùng không thấy xác
  nhận việc mình vừa làm, chỉ thấy nút mình vừa bấm không còn ở đó nữa.

  Một nút đã tắt mang nhãn ở thể hoàn thành ("Đã gửi") giữ nguyên hình dáng và
  vị trí của nút vừa bấm, nên nó đọc ra là "xong rồi" chứ không phải "mất rồi".

  Trạng thái nào không có việc vừa làm xong thì KHÔNG có nút: Nháp với người
  duyệt là việc chưa tới lượt họ, không phải việc họ vừa làm.
*/
const NUT_XONG: Partial<Record<ReportStatus, string>> = {
  REVIEWED: "Đã gửi",
  APPROVED: "Đã duyệt",
  BLOCKED: "Chưa đủ dữ liệu",
};

const DIEN_GIAI: Record<ReportStatus, string> = {
  DRAFT: "Chuyên viên đang hoàn thiện số liệu. Chưa gửi duyệt.",
  REVIEWED: "Chuyên viên đã xác nhận số liệu, đang chờ duyệt.",
  APPROVED: "Số liệu kỳ này đã khóa. Muốn sửa phải mở một bản điều chỉnh.",
  AMEND: "Đang sửa để thay cho bản đã duyệt. Bản cũ vẫn giữ cho tới khi bản này được duyệt.",
  BLOCKED: "Chưa đủ dữ liệu để gửi duyệt. Xem mục Tình trạng dữ liệu.",
};

/*
  Ai được mở bản báo cáo — MỘT phép tính, hai nơi dùng.

  Điều kiện này từng chỉ gác cái NÚT, còn phân hệ thì luôn dựng khối theo tham
  số `?xem=`. Hệ quả: chuyên viên mở báo cáo rồi bấm Gửi duyệt — nút biến mất
  mà khối vẫn nằm đó, không còn gì đóng được nó. Một điều kiện viết ở một chỗ
  rồi quên ở chỗ thứ hai, nên nay nó chỉ còn sống ở một chỗ.

  ── Luật nói theo BẢN BÁO CÁO, không theo người xem ─────────────────────────

  Bản đã được tuyên bố xong (Đã rà soát, Đã duyệt): ai mở được màn đều xem
  được. Bản còn đang sửa (Nháp, Điều chỉnh): chỉ người đang giữ nó.

  Luật cũ nói theo người xem — "có việc để làm thì được xem" — và đó là một
  luật về HÀNH ĐỘNG đem đi gác một việc ĐỌC. Hai thứ trùng nhau ở Nháp nên nó
  chạy đúng, rồi tách ra đúng ở Đã rà soát: chuyên viên vừa gửi xong không còn
  việc, nên mất luôn đường nhìn lại thứ chính mình vừa gửi.

  Cái rào ở Nháp vẫn đứng, nhưng vì lý do khác hẳn quyền hạn: số trong bản
  Nháp còn đổi và người đọc không có cách nào biết. Gửi duyệt xong thì người
  lập đã tuyên bố số xong, nên rủi ro ấy hết — và cái rào hết lý do tồn tại.

  Căn cứ trong tài liệu (ghi rõ là DIỄN GIẢI, không phải điều khoản): FRS 13.2
  liệt kê việc của từng vai ở mỗi trạng thái chứ không liệt kê điều cấm; ma
  trận 3.2 cho VT-03 quyền S trên BC-06, mà sửa thì bao hàm xem; và KD-05 chỉ
  khóa kỳ ở Đã duyệt. Không dòng nào cấm người lập đọc lại bản mình vừa gửi.
*/
export function choXemTruoc(trangThai: ReportStatus, coViec: boolean) {
  return coViec || trangThai === "REVIEWED" || trangThai === "APPROVED";
}

/** Phiên bản dùng trong phân hệ, nơi chỉ có khóa kỳ chứ chưa có bản ghi. */
export function useChoXemTruoc(khoa: string) {
  const { layBanGhi, duoc } = useDuyet();
  const b = layBanGhi(khoa);
  const coViec = duoc(khoa, "send") || duoc(khoa, "approve") || duoc(khoa, "return") || duoc(khoa, "amend");
  return choXemTruoc(b.trangThai, coViec);
}

/*
  BỐN nhánh dùng CHUNG một ô, vì với người dùng chúng là cùng một việc: dừng
  lại, đọc hệ quả, rồi mới chốt.

  `return` và `amend` bắt buộc có lý do. `send` và `approve` không hỏi lý do —
  chúng hỏi một thứ khác: "anh đang chốt cái gì".

  Trước đây hai nhánh sau chốt THẲNG từ `onClick`: không xác nhận, không tóm
  tắt, không hoàn tác — trong khi `return`, nhánh gỡ lại được, bắt gõ tới 200
  ký tự. Độ khó đang ngược với hệ quả. Duyệt là việc DUY NHẤT trong sản phẩm
  mà người dùng không tự gỡ được: QR-03 bắt mở bản điều chỉnh kèm lý do mới
  sửa lại được, và bản đã phát hành thì đã có người nhận.
*/
type Viec = "return" | "amend" | "send" | "approve";

const CHU_VIEC: Record<Viec, { dan: string; nhan?: string; goiY?: string; nut: string }> = {
  return: {
    dan: "Chuyên viên lập báo cáo sẽ thấy lý do này khi nhận lại bản nháp.",
    nhan: "Lý do trả lại",
    goiY: "Ví dụ: đề nghị làm rõ Thuế cơ sở 5 tăng nợ",
    nut: "Trả lại cho chuyên viên",
  },
  amend: {
    dan: "Bản đã duyệt vẫn được giữ, và chỉ bị đánh dấu đã thay thế khi bản điều chỉnh được duyệt.",
    nhan: "Lý do điều chỉnh",
    goiY: "Ví dụ: nguồn 9.9.4.15 chốt lại ngày 03, số nợ khó thu thay đổi",
    nut: "Mở bản điều chỉnh",
  },
  send: {
    dan: "Số liệu của kỳ khóa lại từ lúc gửi cho tới khi có kết quả duyệt. Muốn sửa trước đó thì trưởng phòng phải trả lại.",
    nut: "Gửi duyệt",
  },
  approve: {
    dan: "Duyệt xong là kỳ khóa số. Muốn sửa phải mở bản điều chỉnh kèm lý do — không có nút hoàn tác.",
    nut: "Duyệt",
  },
};

export function ThanhDuyet({ khoa, nhanKy, xemTruoc, chan = null, tomTat }: {
  khoa: string;
  nhanKy: string;
  /*
    Lý do KHÔNG cho gửi duyệt, do phân hệ quyết định. `null` = không chặn.

    Có những thứ phải chặn ở cửa chứ không phải nhắc rồi vẫn cho qua: báo cáo
    tổng đài còn tài khoản chưa gán đơn vị thì số của chúng chưa vào đơn vị
    nào, nên bản gửi đi sẽ thiếu mà người duyệt không có cách nào biết. §5.4
    đặt cùng một luật cho phép cân đối của QL4-01 [R].

    Chặn bằng cách TẮT nút và nói lý do ngay tại nút, không phải bằng cách
    giấu nút — giấu thì người dùng đi tìm chức năng bị mất.
  */
  chan?: string | null;
  /* Nút xem trước bộ báo cáo, do phân hệ truyền vào vì chỉ nó biết bộ sheet
     của mình. Nó đứng CẠNH nút Duyệt chứ không ở đâu khác: người duyệt cần
     nhìn thứ mình sắp ký ngay trước lúc ký. */
  xemTruoc?: ReactNode;
  /*
    Những dòng hiện trong ô xác nhận trước khi chốt, do phân hệ truyền vào.

    Thanh duyệt biết tên kỳ và trạng thái, nhưng KHÔNG biết bộ báo cáo này
    gồm mấy sheet hay phủ phạm vi nào — chỉ phân hệ biết. Mà "tôi đang ký cái
    gì" lại đúng là câu mà ô xác nhận sinh ra để trả lời, nên nếu phân hệ
    không nói thì ô ấy chỉ còn là một lần bấm thừa.
  */
  tomTat?: readonly (readonly [string, string])[];
}) {
  const { layBanGhi, duoc, guiRaSoat, duyet, traLai, moDieuChinh } = useDuyet();
  const notify = useAction();
  const oLyDo = useRef<HTMLTextAreaElement>(null);
  const oForm = useRef<HTMLFormElement>(null);
  /* `null` = không có ô lý do nào đang mở. Mẩu này KHÔNG vào địa chỉ: một ô
     nhập dở không phải trạng thái ai cần gửi liên kết tới, và địa chỉ của màn
     này chỉ mô tả thứ đang xem chứ không mở sẵn một hành động. */
  const [viec, setViec] = useState<Viec | null>(null);
  const [lyDo, setLyDo] = useState("");
  const [loi, setLoi] = useState("");

  const b = layBanGhi(khoa);
  const coViec = duoc(khoa, "send") || duoc(khoa, "approve") || duoc(khoa, "return") || duoc(khoa, "amend");
  /* Bấm lại chính nút đang mở thì đóng — nút mang `aria-expanded`, nên nó
     phải gạt được cả hai chiều. */
  const moHop = (v: Viec) => {
    if (viec === v) { dongHop(); return; }
    setViec(v); setLyDo(""); setLoi("");
  };
  const dongHop = () => { setViec(null); setLyDo(""); setLoi(""); };

  /* Ô vừa mở thì con trỏ phải nằm trong ô. `autoFocus` chỉ chạy lúc dựng lần
     đầu, mà khối này ở lại trong cây giữa hai lần mở.

     Nhánh chốt không có ô nhập, nên focus rơi vào nút chốt: người dùng bàn
     phím vừa bấm "Duyệt" ở thanh trên, ô xác nhận hiện ra ở dưới, và phím
     Enter kế tiếp phải rơi đúng vào nút chốt chứ không vào khoảng không. */
  useEffect(() => {
    if (!viec) return;
    if (oLyDo.current) { oLyDo.current.focus(); return; }
    /* `Button` là component dùng chung và không nhận `ref`; thêm forwardRef
       vào nó chỉ vì một chỗ này là sửa lan ra cả hệ. Hỏi ngay trong form thì
       đủ chính xác, vì form chỉ có đúng một nút submit. */
    oForm.current?.querySelector<HTMLButtonElement>("button[type=submit]")?.focus();
  }, [viec]);

  /*
    Không có tiêu đề cho ô này, và dòng giải thích không nhắc lại tên kỳ.

    Tên kỳ đã in đậm cách đó hai dòng, ngay trong cùng một thanh. Còn tiêu đề
    thì từng là cách gọi THỨ BA cho cùng một việc — nút mở "Trả lại", tiêu đề
    "Trả lại báo cáo", nút chốt "Trả lại cho chuyên viên" — và người đọc phải
    dừng lại kiểm xem ba cái có khác nhau không. Nút mở nay sáng lên khi đang
    mở, nên nó đã tự nói ô này thuộc về nó.

    Hai nhãn còn lại cố ý khác nhau vì chúng là hai việc khác nhau: một cái MỞ
    ô nhập, một cái CHỐT và nói rõ hệ quả rơi vào ai.
  */
  const CHU = CHU_VIEC[viec ?? "return"];
  const canLyDo = viec === "return" || viec === "amend";

  const xong = () => {
    if (viec === "send") {
      if (!guiRaSoat(khoa)) { setLoi("Không gửi duyệt được ở trạng thái này."); return; }
      notify(`Đã gửi ${nhanKy} đi duyệt. Số liệu khóa lại cho tới khi có kết quả.`);
      dongHop();
      return;
    }
    if (viec === "approve") {
      /* QR-03: người lập không duyệt bản của chính mình. Báo NGAY TRONG ô
         xác nhận chứ không bằng toast — người dùng đang đứng ở ô ấy, và đây
         là câu trả lời cho cú bấm họ vừa thực hiện. */
      if (!duyet(khoa)) { setLoi("Bạn không duyệt được bản báo cáo do chính mình gửi."); return; }
      notify(`Đã duyệt ${nhanKy}. Kỳ này khóa số; muốn sửa phải mở bản điều chỉnh.`);
      dongHop();
      return;
    }
    if (!lyDo.trim()) { setLoi(viec === "return" ? "Nhập lý do trả lại để chuyên viên biết cần sửa gì." : "Nhập lý do điều chỉnh để lưu vào nhật ký của kỳ."); return; }
    const ok = viec === "return" ? traLai(khoa, lyDo.trim()) : moDieuChinh(khoa, lyDo.trim());
    if (!ok) { setLoi("Bạn không có quyền thực hiện việc này ở trạng thái hiện tại."); return; }
    notify(viec === "return"
      ? `Đã trả ${nhanKy} về bản nháp kèm lý do. Chuyên viên lập báo cáo nhận lại để sửa.`
      : `Đã mở bản điều chỉnh cho ${nhanKy}. Bản đã duyệt trước đó vẫn tra cứu được.`);
    dongHop();
  };

  return <section className="thanh-duyet" aria-label="Trạng thái duyệt của kỳ">
    <div className="duyet-trai">
      <Badge tone={SAC[b.trangThai]}>{NHAN[b.trangThai]}</Badge>
      <div className="duyet-chu">
        <strong>{nhanKy}{b.soBanDaDuyet > 0 && b.trangThai !== "APPROVED" ? " · bản thay thế" : ""}</strong>
        <span>{DIEN_GIAI[b.trangThai]}</span>
      </div>
    </div>

    {/* Dấu vết: ai gửi, ai duyệt, lúc nào. Một dòng, không phải một bảng —
        đây là ngữ cảnh, không phải thứ cần đọc kỹ ở mỗi lần vào màn. */}
    <div className="duyet-vet">
      {b.guiLuc && <span>Gửi duyệt bởi {b.guiBoi} · {b.guiLuc}</span>}
      {b.duyetLuc && <span>Duyệt bởi {b.duyetBoi} · {b.duyetLuc}</span>}
    </div>

    {/*
      HAI Ô CỐ ĐỊNH, không phải một hàng nút xếp theo thứ tự xuất hiện.

      Ô đọc đứng trước, ô quyết định đứng sau, và chúng không bao giờ đổi chỗ
      cho nhau. Trước đây nút "Xem báo cáo" đứng thứ nhất với người duyệt
      nhưng thứ hai với chuyên viên, vì nó chỉ việc xếp sau cái gì có mặt —
      hai người cùng nhìn một kỳ không chỉ cho nhau được "nút bên trái".

      Nút "Đã gửi" đã tắt nằm trong ô QUYẾT ĐỊNH chứ không đứng riêng: nó đứng
      đúng chỗ nút Gửi duyệt vừa biến mất, và đó là toàn bộ lý do nó tồn tại.
    */}
    <div className="duyet-nut">
      {/* Điều kiện ở `choXemTruoc` phía trên — đọc ghi chú ở đó. */}
      {choXemTruoc(b.trangThai, coViec) && <span className="duyet-doc">{xemTruoc}</span>}
      {(coViec || NUT_XONG[b.trangThai]) && <span className="duyet-hanh-dong">
      {/* `title` nhắc lại lời giải thích đầy đủ khi trỏ tới; bản đầy đủ luôn
          đứng sẵn ở khối trạng thái bên trái nên không ai phải trỏ mới hiểu. */}
      {!coViec && NUT_XONG[b.trangThai] && <Button
        className={`duyet-xong${b.trangThai === "BLOCKED" ? " duyet-xong-chan" : ""}`}
        icon={b.trangThai === "BLOCKED" ? "alert" : "check"}
        disabled
        title={DIEN_GIAI[b.trangThai]}
      >{NUT_XONG[b.trangThai]}</Button>}
      {/*
        Nút mở mang `aria-expanded` và sáng lên khi ô của nó đang mở, nên có
        một sợi dây nhìn thấy được giữa nút vừa bấm và ô vừa hiện ra.
      */}
      {duoc(khoa, "return") && <Button
        aria-expanded={viec === "return"} aria-controls="duyet-lydo"
        className={viec === "return" ? "is-mo" : undefined}
        disabled={viec !== null && viec !== "return"}
        onClick={() => moHop("return")}
      >Trả lại</Button>}
      {duoc(khoa, "amend") && <Button
        aria-expanded={viec === "amend"} aria-controls="duyet-lydo"
        className={viec === "amend" ? "is-mo" : undefined}
        disabled={viec !== null && viec !== "amend"}
        onClick={() => moHop("amend")}
      >Điều chỉnh</Button>}
      {/*
        Hai quyết định ngược nhau KHÔNG được cùng sống một lúc.

        Trước đây mở ô lý do trả lại xong thì nút Duyệt — nút chính, nằm ngay
        cạnh — vẫn bấm được. Gõ lý do dở mà chạm nhầm là kỳ bị duyệt luôn,
        không có bước xác nhận nào ở giữa; mà theo QR-03 thì duyệt xong phải
        mở bản điều chỉnh kèm lý do mới sửa lại được. Mở ô lý do là đã chọn
        một nhánh, nên nhánh kia tắt cho tới lúc Hủy.
      */}
      {/*
        Hai nút chốt MỞ Ô XÁC NHẬN, không chốt thẳng. Chúng vẫn là nút chính,
        vẫn đứng đúng ô quyết định, vẫn một cú bấm để tới — chỉ là cú bấm ấy
        nay dẫn tới một câu hỏi chứ không tới một kỳ đã khóa.
      */}
      {duoc(khoa, "send") && <Button
        kind="primary"
        aria-expanded={viec === "send"} aria-controls="duyet-lydo"
        className={viec === "send" ? "is-mo" : undefined}
        disabled={(viec !== null && viec !== "send") || chan !== null}
        title={chan ?? undefined}
        onClick={() => moHop("send")}
      >Gửi duyệt</Button>}
      {duoc(khoa, "approve") && <Button
        kind="primary"
        aria-expanded={viec === "approve"} aria-controls="duyet-lydo"
        className={viec === "approve" ? "is-mo" : undefined}
        disabled={viec !== null && viec !== "approve"}
        onClick={() => moHop("approve")}
      >Duyệt</Button>}
      </span>}
    </div>

    {/*
      Lý do trả lại là MỘT KHỐI RIÊNG trải hết thanh, không phải một dòng
      trong cột dấu vết.

      Nó từng nằm chung với "Gửi duyệt bởi…" ở cột giữa — cột co giãn, rộng
      vài trăm pixel. Cột ấy dành cho ngữ cảnh một dòng, còn lý do trả lại dài
      tới 200 ký tự: nhét vào đó thì nó hoặc tràn, hoặc gấp thành bốn năm dòng
      và kéo cả thanh cao lên.

      Nó cũng không phải siêu dữ liệu. Đây là lời người duyệt viết riêng cho
      người lập, và là thứ DUY NHẤT nói cho họ biết phải sửa gì — nên nó được
      đọc như một câu, ở đúng chỗ ô lý do đã hiện ra khi người kia viết nó.
    */}
    {b.lyDoTraLai && b.trangThai === "DRAFT" && <p className="duyet-tralai">
      <strong>Lý do trả lại</strong>{b.lyDoTraLai}
    </p>}
    {b.lyDoDieuChinh && b.trangThai === "AMEND" && <p className="duyet-tralai">
      <strong>Lý do điều chỉnh</strong>{b.lyDoDieuChinh}
    </p>}

    {/* Lý do chặn đứng cùng chỗ với lý do trả lại: cả hai đều là câu trả lời
        cho "vì sao tôi không đi tiếp được". */}
    {chan && duoc(khoa, "send") && <p className="duyet-tralai">
      <strong>Chưa gửi duyệt được</strong>{chan}
    </p>}

    {/*
      Trả lại và mở điều chỉnh đều BẮT BUỘC có lý do, nên dùng chung một ô.
      Trả lại không nói vì sao thì chuyên viên nhận về một bản nháp và không
      biết phải sửa gì; điều chỉnh không nói vì sao thì bản đã trình bị thay
      mà không ai giải thích được cho người đã nhận bản cũ.

      Ô này nằm TRONG thanh duyệt, không phải hộp thoại phủ lên trang: cùng ba
      lý do đã bỏ hộp xem trước (xem đầu `XemTruocBaoCao.tsx`), cộng một lý do
      riêng — lý do trả lại là lời viết cho người đọc bảng số, nên người viết
      cần còn nhìn thấy bảng số lúc viết.
    */}
    {viec && <form ref={oForm} id="duyet-lydo" className="duyet-lydo" noValidate onSubmit={(e) => { e.preventDefault(); xong(); }}>
      <p className="duyet-lydo-dan">{CHU.dan}</p>
      {/* `noValidate`: thông báo mặc định của trình duyệt là "Please fill out
          this field" — tiếng Anh, và không nói cần điền gì. */}
      {/*
        Tóm tắt đứng TRƯỚC nút chốt và sau dòng hệ quả: thứ tự đọc là "việc
        gì xảy ra → trên cái gì → chốt". Đảo lại thì người dùng đọc số trước
        khi biết số ấy dùng để làm gì.
      */}
      {!canLyDo && <dl className="duyet-tomtat">
        <div><dt>Kỳ</dt><dd>{nhanKy}</dd></div>
        {tomTat?.map(([nhan, gia]) => <div key={nhan}><dt>{nhan}</dt><dd>{gia}</dd></div>)}
      </dl>}
      {canLyDo && <label>{CHU.nhan}
        {/*
          `<textarea rows={1}>` cao đúng một dòng lúc mở, rồi tự giãn theo nội
          dung. Ô một dòng cố định thì gõ quá nửa là chữ đầu trôi khỏi tầm
          nhìn, mà lý do trả lại là thứ người viết cần đọc lại trước khi gửi.

          Enter GỬI, không xuống dòng: ô này trông như một dòng và người dùng
          đối xử với nó như một dòng. Muốn xuống dòng thì Shift+Enter.
        */}
        <textarea
          ref={oLyDo} rows={1} maxLength={200} name="lyDoTraLai" value={lyDo} placeholder={CHU.goiY}
          onInput={(e) => { const o = e.currentTarget; o.style.height = "auto"; o.style.height = `${o.scrollHeight}px`; }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); xong(); } }}
          onChange={(e) => { setLyDo(e.target.value); setLoi(""); }}
        />
      </label>}
      {loi && <p role="alert" className="quality-note">{loi}</p>}
      <div className="duyet-lydo-nut">
        <Button type="button" onClick={dongHop}>Hủy</Button>
        <Button type="submit" kind="primary">{CHU.nut}</Button>
      </div>
    </form>}
  </section>;
}
