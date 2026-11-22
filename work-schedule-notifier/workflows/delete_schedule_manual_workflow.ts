import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { OpenDeleteScheduleModalFunction } from "../functions/open_delete_schedule_modal_function.ts";
import { DeleteScheduleManualFunction } from "../functions/delete_schedule_manual_function.ts";

/**
 * 登録された勤怠予定を削除するワークフロー
 */
const DeleteScheduleManualWorkflow = DefineWorkflow({
  callback_id: "delete_schedule_manual_workflow",
  title: "勤怠予定の削除",
  description: "",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
      user: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["interactivity", "channel", "user"],
  },
});

/**
 * Step1：
 * 削除する勤怠予定を選択するためのモーダルを表示する
 *
 * OpenForm は選択肢を動的に設定できないため、カスタム関数から Block Kit のモーダルを開く。
 * 操作がキャンセルまたは勤怠予定が未登録の場合は、後続ステップでは削除と投稿を行わない。
 */
const inputFormStep = DeleteScheduleManualWorkflow.addStep(
  OpenDeleteScheduleModalFunction,
  {
    user: DeleteScheduleManualWorkflow.inputs.user,
    interactivity: DeleteScheduleManualWorkflow.inputs.interactivity,
  },
);

/**
 * Step2：
 * モーダルで選択された勤怠予定を Datastore から削除し、削除完了メッセージを Slack チャンネルに投稿する
 *
 * 勤怠予定が選択されなかった場合（キャンセル、または未登録）は何もしない。
 * 
 * 本来は「削除処理」と「削除完了メッセージの投稿」を別ステップに分けたいが、
 * キャンセルや未登録の場合に後続ステップをスキップする制御が必要になり、処理が複雑になる。
 * これを避けるため、両方を同じステップで実行している。
 */
DeleteScheduleManualWorkflow.addStep(
  DeleteScheduleManualFunction,
  {
    user: DeleteScheduleManualWorkflow.inputs.user,
    schedule_id: inputFormStep.outputs.selected_schedule_id,
  },
);

export default DeleteScheduleManualWorkflow;
