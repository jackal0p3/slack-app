import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

/**
 * 当日お知らせ用の勤怠予定一覧を取得する関数
 */
export const GetTodayScheduleFunction = DefineFunction({
  callback_id: "get_today_schedule_list_function",
  title: "当日の勤怠予定一覧の取得(Func)",
  description: "",
  source_file: "functions/get_today_schedule_function.ts",
  input_parameters: {
    properties: {},
    required: [],
  },
  output_parameters: {
    properties: {
      today_schedule_list_message: {
        type: Schema.types.string,
      },
    },
    required: ["today_schedule_list_message"],
  },
});

/**
 * 未実装
 * Datastore から当日の勤怠予定一覧を取得し、お知らせ用のメッセージを返却する
 *
 * @param {Object} client Slack API クライアント
 *
 * @returns {Promise<{outputs: {today_schedule_list_message: string}} | {error: string}>}
 */
export default SlackFunction(
  GetTodayScheduleFunction,
  async ({ client }) => {
    return { outputs: { today_schedule_list_message: "未実装" } };
  },
);
