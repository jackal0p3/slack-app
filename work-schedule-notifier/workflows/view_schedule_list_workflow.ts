import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { GetScheduleListFunction } from "../functions/get_schedule_list_function.ts";
import { PostEphemeralMessageFunction } from "../functions/post_ephemeral_message_function.ts";

/**
 * 登録済みの勤怠予定一覧を取得・表示するワークフロー
 */
const ViewScheduleListWorkflow = DefineWorkflow({
  callback_id: "view_schedule_list_workflow",
  title: "勤怠予定一覧の表示",
  description: "",
  input_parameters: {
    properties: {
      user: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["user"],
  },
});

/**
 * Step1：
 * 登録済みの勤怠予定を Datastore から取得し、勤怠予定一覧メッセージを生成する
 */
const getScheduleListStep = ViewScheduleListWorkflow.addStep(
  GetScheduleListFunction,
  {},
);

/**
 * Step2：
 * 勤怠予定一覧メッセージを通知先チャンネル（環境変数 NOTICE_CHANNEL_ID）にエフェメラルメッセージとして投稿する
 */
ViewScheduleListWorkflow.addStep(PostEphemeralMessageFunction, {
  user: ViewScheduleListWorkflow.inputs.user,
  message: getScheduleListStep.outputs.schedule_list_message,
});

export default ViewScheduleListWorkflow;
