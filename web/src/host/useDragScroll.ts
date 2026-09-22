import { useEffect } from "react";

/**
 * Kéo chuột để cuộn, thay cho thanh cuộn đã bị ẩn ở chế độ mobile.
 *
 * Điện thoại thật không có thanh cuộn thường trực: người dùng đặt ngón tay lên
 * nội dung rồi kéo. Bản xem thử chạy trên desktop nên vẫn còn thanh cuộn, và
 * người xem demo đọc ra rằng bản mobile có một thanh mà máy thật không có.
 *
 * Ẩn thanh đi thì phải trả lại cách cuộn tương ứng, nếu không vùng cuộn NGANG
 * trở thành vùng chết: bánh xe chuột chỉ cuộn dọc, muốn cuộn ngang phải giữ
 * Shift — một thao tác không tồn tại trên điện thoại.
 *
 * Hook chỉ gắn khi đang ở chế độ mobile, và gắn ở tầng `document` chứ không
 * từng vùng: vùng cuộn sinh ra theo dữ liệu (dải card, bảng rộng), nên đi tìm
 * chúng bằng selector là luôn sót.
 */
export function useDragScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    /** Bấm vào những thứ này là để dùng chúng, không phải để cuộn. */
    const isControl = (el: Element | null) =>
      !!el?.closest("input, select, textarea, option, [contenteditable='true']");

    /**
     * Vùng cuộn gần nhất tính từ điểm đặt chuột.
     *
     * Đi ngược lên cây và lấy vùng ĐẦU TIÊN còn chỗ để cuộn theo hướng đang kéo.
     * Lấy vùng đầu tiên có `overflow: auto` là sai: một bảng đã cuộn hết sang
     * phải vẫn nuốt cú kéo, và trang phía sau không nhúc nhích.
     */
    const scrollerFor = (start: Element | null, dx: number, dy: number): Element | null => {
      const ngang = Math.abs(dx) > Math.abs(dy);
      for (let el = start; el && el !== document.body; el = el.parentElement) {
        const cs = getComputedStyle(el);
        const truc = ngang ? cs.overflowX : cs.overflowY;
        if (truc !== "auto" && truc !== "scroll") continue;
        const con = ngang ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
        if (con <= 1) continue;
        const tai = ngang ? el.scrollLeft : el.scrollTop;
        const keoVeDau = ngang ? dx > 0 : dy > 0;
        if (keoVeDau ? tai > 0 : tai < con - 1) return el;
      }
      return document.scrollingElement;
    };

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let scroller: Element | null = null;
    let startLeft = 0;
    let startTop = 0;
    let dragging = false;
    let snapCu = "";

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      const target = event.target as Element | null;
      if (isControl(target)) return;
      // `.dtabs` tự xử lý cú kéo của nó, kèm phần chặn `click` riêng cho nút tab.
      if (target?.closest(".dtabs")) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      scroller = null;
      dragging = false;
    };

    const onMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!dragging) {
        // Ngưỡng 5px: dưới mức đó vẫn là một cú bấm, và bấm phải ra bấm.
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        scroller = scrollerFor(document.elementFromPoint(startX, startY), dx, dy);
        if (!scroller) return;
        startLeft = scroller.scrollLeft;
        startTop = scroller.scrollTop;
        dragging = true;
        // Tắt bám TRONG LÚC kéo. Chrome bám ngay ở mỗi lần gán `scrollLeft`, nên
        // để nguyên thì dải nhảy từng nấc thay vì đi theo tay — đo được: gán 300
        // thì nó về 257 tức khắc. Bám lại khi thả, ở `settle`.
        snapCu = (scroller as HTMLElement).style.scrollSnapType;
        (scroller as HTMLElement).style.scrollSnapType = "none";
        document.body.classList.add("is-drag-scroll");
      }
      if (!scroller) return;
      event.preventDefault();
      scroller.scrollLeft = startLeft - dx;
      scroller.scrollTop = startTop - dy;
    };

    /**
     * Thả tay thì đưa về đúng mép một card.
     *
     * Gán thẳng `scrollLeft` như cú kéo ở trên KHÔNG kích hoạt `scroll-snap`:
     * trình duyệt chỉ bám sau một lượt cuộn do chính nó điều khiển. Không tự
     * làm bước này thì dải có `scroll-snap-type: mandatory` vẫn dừng giữa hai
     * card, và người dùng thấy hai nửa card cụt ở hai mép.
     *
     * Bám theo mép GẦN NHẤT, không theo hướng vuốt: kéo nửa card rồi đổi ý thì
     * nó quay lại chỗ cũ, đúng như điện thoại làm.
     */
    const settle = (el: Element) => {
      (el as HTMLElement).style.scrollSnapType = snapCu;
      const cs = getComputedStyle(el);
      if (cs.scrollSnapType === "none") return;
      const goc = el.getBoundingClientRect().left - el.scrollLeft;
      let gan: number | null = null;
      for (const con of el.children) {
        const diem = con.getBoundingClientRect().left - goc;
        if (gan === null || Math.abs(diem - el.scrollLeft) < Math.abs(gan - el.scrollLeft)) gan = diem;
      }
      if (gan === null || Math.abs(gan - el.scrollLeft) < 1) return;
      el.scrollTo({ left: gan, behavior: "smooth" });
    };

    const onUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const daKeo = scroller;
      pointerId = null;
      scroller = null;
      if (daKeo && dragging) settle(daKeo);
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove("is-drag-scroll");
      // Chặn đúng cú `click` phát ngay sau cú kéo này, không chặn cú sau đó.
      const nuot = (e: Event) => {
        e.stopPropagation();
        e.preventDefault();
      };
      document.addEventListener("click", nuot, { capture: true, once: true });
      window.setTimeout(() => document.removeEventListener("click", nuot, { capture: true }), 0);
    };

    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointercancel", onUp, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointercancel", onUp, true);
      document.body.classList.remove("is-drag-scroll");
    };
  }, [enabled]);
}
