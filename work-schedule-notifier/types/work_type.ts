/**
 * 勤怠区分のオプションリスト（UIの選択肢に使用）
 */
export const WORK_TYPE_OPTIONS = [
  { value: "full_day_off", title: "全休" },
  { value: "half_day_am", title: "午前休" },
  { value: "half_day_pm", title: "午後休" },
  { value: "hourly_leave", title: "時間休" },
  { value: "work_from_home", title: "在宅勤務" },
  { value: "in_office", title: "出社" },
  { value: "flextime", title: "時差出勤" },
] as const;

/**
 * 勤怠区分 {@link WORK_TYPE_OPTIONS} の value から表示名を引くための対応表
 *
 * @example
 * WORK_TYPE_LABELS["half_day_am"]; // "午前休"
 */
export const WORK_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  WORK_TYPE_OPTIONS.map((option) => [option.value, option.title]),
);

/**
 * 勤怠区分 {@link WORK_TYPE_OPTIONS} の value（複数）から表示名を取得する
 *
 * @param value 勤怠区分の値（単一の区分または複数区分）
 * @returns 勤怠区分の表示用ラベル
 *
 * @example
 * getWorkTypesLabel(["half_day_am", "work_from_home"]);
 * // => "午前休・在宅勤務"
 */
export function getWorkTypesLabel(
  value: string | readonly string[],
): string {
  const values = typeof value === "string" ? [value] : value;
  return values
    .map((value) =>
      WORK_TYPE_OPTIONS.find((option) => option.value === value)?.title ?? value
    )
    .join("・");
}
