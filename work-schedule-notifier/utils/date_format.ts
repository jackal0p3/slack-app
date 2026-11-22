/**
 * `YYYY-MM-DD` 形式の日付文字列を `yyyy/MM/dd(曜日)` 形式に変換する。
 * 例: "2026-09-30" -> "2026/09/30(水)"
 */
export function formatDateWithWeekday(dateStr: string): string {
  const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

  const [year, month, day] = dateStr.split("-").map(Number);

  // 実行環境のタイムゾーンに左右されないよう、UTC で日付を作って曜日を求める
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = WEEKDAYS[date.getUTCDay()];

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");

  return `${year}/${mm}/${dd}(${weekday})`;
}
