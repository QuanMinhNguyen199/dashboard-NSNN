import type { VaiTro } from "@/domain/types";
import { useState } from "react";
import { Button, PageIntro, Segmented } from "@/components/ui";
import { ImportDialog } from "@/components/ImportDialog";
import { sourceBatches } from "@/data/mock";
import { Runs } from "@/features/Runs";
import { Batches } from "@/features/Batches";
import { Mapping } from "@/features/Mapping";

/*
  Màn "Tình trạng dữ liệu" — tên lấy nguyên văn §1.2 bản thiết kế.

  Trước đây đây là ba màn riêng trong menu trái: Lượt chạy dữ liệu, Lô dữ
  liệu, Ánh xạ quản lý. Cả ba trả lời cùng MỘT câu hỏi — kỳ này dữ liệu đã về
  đủ và sạch chưa — nên tách ra ba mục menu bắt người dùng mở lần lượt cả ba
  mới trả lời được, và không chỗ nào cho họ biết là còn hai chỗ nữa phải xem.

  Thứ tự ba mục đi theo đường dữ liệu đi: kéo về (lượt kéo) → gom thành lô
  (lô dữ liệu) → gắn về phòng và cán bộ (ánh xạ). Ai đọc từ trên xuống là đi
  đúng chiều dữ liệu chảy.
*/

type MucTinhTrang = "luot" | "lo" | "anhxa";

export function TinhTrangDuLieu({ vaiTro }: { vaiTro: VaiTro }) {
  const [muc, setMuc] = useState<MucTinhTrang>("luot");
  const [nhapMo, setNhapMo] = useState(false);

  /*
    G12: "Tải tay chỉ là dự phòng… nút chỉ hiện khi nguồn thiếu". Nên nút này
    gắn vào điều kiện thật — có lô nào đang thiếu dữ liệu hay không — chứ không
    đứng sẵn ở măng sét mọi lúc. Không thiếu gì thì không có gì để tải tay.
  */
  const nguonThieu = sourceBatches.filter((b) => b.status === "MISSING");

  return <div className="page-stack">
    <PageIntro
      title="Tình trạng dữ liệu"
      actions={vaiTro === "CV" && nguonThieu.length > 0 ? <Button kind="secondary" icon="upload" onClick={() => setNhapMo(true)}>Tải tệp bổ sung</Button> : undefined}
    />

    <Segmented
      label="Mục tình trạng dữ liệu"
      value={muc}
      onChange={setMuc}
      options={[
        { value: "luot" as MucTinhTrang, label: "Lịch sử thu thập" },
        { value: "lo" as MucTinhTrang, label: "Lô dữ liệu" },
        { value: "anhxa" as MucTinhTrang, label: "Đơn vị quản lý NNT" },
      ]}
    />

    {muc === "luot" && <Runs readOnly={vaiTro !== "CV"}/>}
    {muc === "lo" && <Batches/>}
    {muc === "anhxa" && <Mapping readOnly={vaiTro !== "CV"}/>}

    {vaiTro === "CV" && <ImportDialog open={nhapMo} onClose={() => setNhapMo(false)}/>}
  </div>;
}
