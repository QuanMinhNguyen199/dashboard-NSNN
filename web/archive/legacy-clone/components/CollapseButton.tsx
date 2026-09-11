/** `cL` — nút "Thu gọn ▴" đặt ở góc phải tiêu đề card. */
export function CollapseButton({ show, onClick }: { show: boolean; onClick: () => void }) {
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full border border-line bg-card px-2.5 py-1 text-[.72rem] text-muted hover:bg-bg hover:text-ink"
    >
      Thu gọn ▴
    </button>
  );
}
