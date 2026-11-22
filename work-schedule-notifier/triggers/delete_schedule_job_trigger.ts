import { Trigger } from "deno-slack-api/types.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import DeleteScheduleJobWorkflow from "../workflows/delete_schedule_job_workflow.ts";

/**
 * 勤怠予定を定期削除するトリガー
 */
const deleteScheduleJobTrigger: Trigger<
  typeof DeleteScheduleJobWorkflow.definition
> = {
  type: TriggerTypes.Scheduled,
  name: "勤怠予定の削除(job)",
  description: "過去の勤怠予定を定期削除します。",
  workflow:
    `#/workflows/${DeleteScheduleJobWorkflow.definition.callback_id}`,
  inputs: {},
  schedule: {
    start_time: "2026-12-01T18:05:00+09:00", // スケジュール開始日時
    // NOTE: 省略すると UTC で曜日（on_days）が判定されてしまうため、明示する
    //       例) JST の月曜朝が「日曜」扱いでスキップされるため、明示する。
    timezone: "Asia/Tokyo",
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

export default deleteScheduleJobTrigger;
