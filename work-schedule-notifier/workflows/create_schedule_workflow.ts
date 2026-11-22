import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { CreateScheduleFunction } from "../functions/create_schedule_function.ts";
import { PostMessageFunction } from "../functions/post_message_function.ts";
import { WORK_TYPE_OPTIONS } from "../types/work_type.ts";

/**
 * 勤怠予定を登録するワークフロー
 */
const CreateScheduleWorkflow = DefineWorkflow({
  callback_id: "create_schedule_workflow",
  title: "勤怠予定の登録",
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
 * 勤怠予定を登録するための入力フォームを表示する
 */
const inputFormStep = CreateScheduleWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "勤怠予定の登録",
    interactivity: CreateScheduleWorkflow.inputs.interactivity,
    submit_label: "登録",
    fields: {
      elements: [{
        name: "date",
        title: "日付",
        type: Schema.slack.types.date,
      }, {
        name: "work_type",
        title: "勤怠予定",
        type: Schema.types.array,
        items: {
          type: Schema.types.string,
          enum: WORK_TYPE_OPTIONS.map((option) => option.value),
          choices: WORK_TYPE_OPTIONS,
        },
        maxItems: 3,
        description:
          "例）在宅勤務で時間休(16:00〜18:00)の場合：「在宅勤務」「時間休」を選択\n※時間休、時差出勤の時間は以下の詳細で入力します",
      }, {
        name: "detail",
        title: "詳細",
        type: Schema.types.string,
        long: false,
        description:
          "時間などの勤怠の詳細を入力します（自由に入力ください）\n例1）時間休の場合：「16:00〜18:00」\n例2）午前中に在宅勤務の場合：「午前在宅で午後出社」",
      }],
      required: ["date", "work_type"],
    },
  },
);

/**
 * Step2：
 * フォームで入力された勤怠予定を Datastore に保存する
 */
const createScheduleStep = CreateScheduleWorkflow.addStep(
  CreateScheduleFunction,
  {
    /** ワークフロー実行ユーザー */
    user: CreateScheduleWorkflow.inputs.user,
    /**  日付（入力値） */
    date: inputFormStep.outputs.fields.date,
    /**  勤怠予定（入力値） */
    work_type: inputFormStep.outputs.fields.work_type,
    /**  詳細（入力値） */
    detail: inputFormStep.outputs.fields.detail,
  },
);

/**
 * Step3：
 * 勤怠予定の登録完了メッセージをチャンネル（環境変数 NOTICE_CHANNEL_ID）に投稿する
 */
CreateScheduleWorkflow.addStep(PostMessageFunction, {
  message: createScheduleStep.outputs.created_schedule_message,
});

export default CreateScheduleWorkflow;
