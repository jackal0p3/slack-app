import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

/**
 * 勤怠予定の Datastore 定義
 */
const WorkScheduleDatastore = DefineDatastore({
  name: "work_schedule",
  primary_key: "id",
  attributes: {
    /** ID（PK） */
    id: {
      type: Schema.types.string,
    },
    /** 登録 Slack ユーザー ID */
    user_id: {
      type: Schema.slack.types.user_id,
    },
    /** 日付 */
    date: {
      type: Schema.slack.types.date,
    },
    /** 勤怠区分 */
    work_type: {
      type: Schema.types.array,
      items: { type: Schema.types.string },
    },
    /** 詳細 */
    detail: {
      type: Schema.types.string,
    },
    /** 登録日時（UTC の ISO 8601 形式。例: "2026-11-22T01:30:00.000Z"） */
    created_at: {
      type: Schema.types.string,
    },
  },
});

export default WorkScheduleDatastore;
