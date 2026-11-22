import { Trigger } from "deno-slack-api/types.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import NoticeScheduleJobWorkflow from "../workflows/notice_schedule_job_workflow.ts";

/**
 * 勤怠予定をお知らせするトリガー
 */
const noticeScheduleJobTrigger: Trigger<
  typeof NoticeScheduleJobWorkflow.definition
> = {
  type: TriggerTypes.Scheduled,
  name: "勤怠予定のお知らせ",
  description: "当日の勤怠予定をお知らせします。",
  workflow: `#/workflows/${NoticeScheduleJobWorkflow.definition.callback_id}`,
  inputs: {},
  schedule: {
    start_time: "2026-12-01T08:55:00+09:00", // スケジュール開始日時
    // NOTE: 省略すると UTC で曜日（on_days）が判定されてしまうため、明示する
    //       例) JST の月曜朝が「日曜」扱いでスキップされるため、明示する。   timezone: "Asia/Tokyo",
    frequency: {
      type: "weekly",
      on_days: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ], // 平日のみ
      repeats_every: 1, // 毎週（1週間ごと）
    },
  },
};

export default noticeScheduleJobTrigger;
