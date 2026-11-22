import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { getWorkTypesLabel } from "../types/work_type.ts";
import { formatDateWithWeekday } from "../utils/date_format.ts";
import type WorkScheduleDatastore from "../datastores/work_schedule.ts";

/**
 * 勤怠予定を登録する関数
 */
export const CreateScheduleFunction = DefineFunction({
  callback_id: "create_schedule_function",
  title: "勤怠予定の登録(Func)",
  description: "",
  source_file: "functions/create_schedule_function.ts",
  input_parameters: {
    properties: {
      /** ワークフロー実行ユーザー */
      user: {
        type: Schema.slack.types.user_id,
      },
      /** 予定日 */
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
    },
    required: ["user", "date", "work_type"],
  },
  output_parameters: {
    properties: {
      created_schedule_message: {
        type: Schema.types.string,
      },
    },
    required: ["created_schedule_message"],
  },
});

/**
 * 勤怠予定を Datastore に保存し、登録完了メッセージを返却する
 *
 * @param {Object} inputs input_parameters
 * @param {Object} client Slack API クライアント
 * @returns {Promise<{outputs: {created_schedule_message: string}} | {error: string}>}
 */
export default SlackFunction(
  CreateScheduleFunction,
  async ({ inputs, client }) => {

    // 勤怠予定情報を Datastore に保存する
    const putResponse = await client.apps.datastore.put<
      typeof WorkScheduleDatastore.definition
    >({
      datastore: "work_schedule",
      item: {
        id: crypto.randomUUID(),
        user_id: inputs.user,
        date: inputs.date,
        work_type: inputs.work_type,
        detail: inputs.detail,
        // 登録日時として、関数の実行日時を UTC の ISO 8601 形式で保存する
        created_at: new Date().toISOString(),
      },
    });

    if (!putResponse.ok) {
      return {
        error: `勤怠予定の登録に失敗しました。: ${putResponse.error}`,
      };
    }

    // 勤怠予定登録完了メッセージを生成する
    const messageLines = [
      `:white_check_mark: <@${inputs.user}> さんが勤怠予定を登録しました。\n`,
      `>日付： ${formatDateWithWeekday(inputs.date)}`,
      `>勤怠： ${getWorkTypesLabel(inputs.work_type)}`,
    ];

    // 詳細は入力された時のみメッセージに出力する
    if (inputs.detail != null) {
      messageLines.push(`>詳細： ${inputs.detail}`);
    }

    const createdScheduleMessage = messageLines.join("\n");

    return { outputs: { created_schedule_message: createdScheduleMessage } };
  },
);
