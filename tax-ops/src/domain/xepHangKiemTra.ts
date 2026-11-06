/** Giá trị lớn hơn đứng trước. Đồng giá trị cùng hạng: 1, 1, 3.
 * Giá trị chưa tính được không tham gia xếp hạng hay nhóm cuối.
 */
export function xepHangGiaTri(ds: { id: string; gia: number | null }[], soCuoi = 1) {
  const hopLe = ds.filter((x): x is { id: string; gia: number } => x.gia !== null && Number.isFinite(x.gia))
    .sort((a, b) => b.gia - a.gia);
  const hang = new Map<string, number>();
  hopLe.forEach((x, i) => hang.set(x.id, i && x.gia === hopLe[i - 1].gia ? hang.get(hopLe[i - 1].id)! : i + 1));
  const cao = new Set(hopLe.filter((x) => x.gia === hopLe[0]?.gia).map((x) => x.id));
  const thap = new Set(hopLe.filter((x) => x.gia === hopLe.at(-1)?.gia).map((x) => x.id));
  const nguong = hopLe[Math.max(0, hopLe.length - Math.max(0, Math.floor(soCuoi)))]?.gia;
  // Nếu cả nhóm bằng nhau, không gắn nhãn nhóm cuối cho toàn bộ đơn vị.
  const cuoi = new Set(hopLe.filter((x) => nguong !== undefined && cao.size < hopLe.length && x.gia <= nguong).map((x) => x.id));
  return { hang, cao, thap, cuoi };
}
