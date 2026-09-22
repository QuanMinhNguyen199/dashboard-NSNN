/** Đưa người dùng tới đúng phần vừa yêu cầu mở, có tôn trọng Reduce Motion. */
export function revealSection(id: string) {
  window.requestAnimationFrame(() => {
    const target = document.getElementById(id);
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  });
}
