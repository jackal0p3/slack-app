import { DefineWorkflow } from "deno-slack-sdk/mod.ts";
import { GetTodayScheduleFunction } from "../functions/get_today_schedule_list_function.ts";
import { PostMessageFunction } from "../functions/post_message_function.ts";

/**
 * 未実装
 * 勤怠予定をお知らせするワークフロー
 */
const NoticeScheduleJobWorkflow = DefineWorkflow({
  callback_id: "notice_schedule_job_workflow",
  title: "勤怠予定のお知らせ",
  description: "",
  input_parameters: {
    properties: {},
    required: [],
  },
});

/**
 * Step1：
 * お知らせ対象の勤怠予定を Datastore から取得する
 */
const getScheduleListStep = NoticeScheduleJobWorkflow.addStep(
  GetTodayScheduleFunction,
  {},
);

/**
 * Step2：
 * 通知先チャンネル（環境変数 NOTICE_CHANNEL_ID）に投稿する
 */
NoticeScheduleJobWorkflow.addStep(PostMessageFunction, {
  message: getScheduleListStep.outputs.today_schedule_list_message,
});

export default NoticeScheduleJobWorkflow;
