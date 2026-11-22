import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { formatDateWithWeekday } from "../utils/date_format.ts";
import { getWorkTypesLabel } from "../types/work_type.ts";
import type WorkScheduleDatastore from "../datastores/work_schedule.ts";

/**
 * 登録された勤怠予定を一覧から選択するモーダルに表示する関数
 *
 * OpenForm のフィールドの選択肢はマニフェストに静的に定義する必要があり、前ステップの出力などから動的に設定できない。
 * そのため、カスタム関数から Block Kit のモーダルを開き、datastore から取得した勤怠予定を選択肢として表示する。
 */
export const OpenDeleteScheduleModalFunction = DefineFunction({
  callback_id: "open_delete_schedule_modal_function",
  title: "勤怠予定の削除モーダル表示(Func)",
  description: "",
  source_file: "functions/open_delete_schedule_modal_function.ts",
  input_parameters: {
    properties: {
      user: {
        type: Schema.slack.types.user_id,
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
    },
    required: ["user", "interactivity"],
  },
  output_parameters: {
    properties: {
      /** 削除対象の勤怠予定 ID（キャンセル操作時または勤怠予定が未登録の場合は null） */
      selected_schedule_id: {
        type: Schema.types.string,
      },
    },
    required: [],
  },
});

/** 勤怠予定選択モーダルの callback_id */
const DELETE_SCHEDULE_MODAL_CALLBACK_ID = "delete_schedule_modal";

/**
 * 勤怠予定の削除用のモーダルを表示する
 *
 * 削除可能な勤怠予定は自身が登録した予定のみで、予定日を過ぎた過去の予定も削除可能とする
 *
 * @param {Object} args.inputs 関数の入力値
 * @param {Object} args.client Slack APIクライアント
 *
 * @returns {Promise<{completed: false} | {error: string}>}
 */
export default SlackFunction(
  OpenDeleteScheduleModalFunction,
  async ({ inputs, client }) => {
    // datastore からユーザー自身が登録した勤怠予定を全件取得する（過去分も含む）
    // NOTE: query は、1 回の呼び出しで返す件数に上限があり、絞り込みはデータを取得した後にかかるため、続きのデータが残っている可能性がある。
    //       そのため、全データを読み込むためには next_cursor が空になるまで繰り返し読み込む。
    const own_schedules = [];
    let cursor: string | undefined;

    do {
      const queryResponse = await client.apps.datastore.query<
        typeof WorkScheduleDatastore.definition
      >({
        datastore: "work_schedule",
        expression: "#user = :user", // DynamoDB のフィルタ式
        expression_attributes: { "#user": "user_id" },
        expression_values: { ":user": inputs.user },
        cursor,
      });

      if (!queryResponse.ok) {
        return {
          error: `勤怠予定の取得に失敗しました。: ${queryResponse.error}`,
        };
      }

      own_schedules.push(...(queryResponse.items ?? []));
      cursor = queryResponse.response_metadata?.next_cursor || undefined;
    } while (cursor);

    // 勤怠予定の登録有無によって表示するモーダルの内容を切り替える
    let modalView;

    if (own_schedules.length >= 1) {
      // 勤怠予定が登録されている場合
      // 日付の降順に並べる（直近の予定を選びやすくするため、新しい日付を先頭に）
      own_schedules.sort((a, b) => b.date.localeCompare(a.date));

      // モーダル表示用の選択肢一覧を作成する
      // 選択肢は最大 50 件、表示テキストは最大 75 文字までとする（Slack の static_select の上限のため）
      const schedulesOptions = own_schedules.slice(0, 50).map((schedule) => {
        const workType = getWorkTypesLabel(schedule.work_type);
        const detail = schedule.detail ? ` / ${schedule.detail}` : "";
        const optionLabel = `${
          formatDateWithWeekday(schedule.date)
        } ${workType}${detail}`;

        return {
          text: { type: "plain_text", text: optionLabel.slice(0, 75) },
          value: schedule.id,
        };
      });

      modalView = {
        interactivity_pointer: inputs.interactivity.interactivity_pointer,
        view: {
          type: "modal",
          callback_id: DELETE_SCHEDULE_MODAL_CALLBACK_ID,
          // キャンセル時にも関数を完了させるため、モーダルが閉じられたことを通知させる
          notify_on_close: true,
          title: { type: "plain_text", text: "勤怠予定の削除" },
          submit: { type: "plain_text", text: "削除" },
          close: { type: "plain_text", text: "キャンセル" },
          blocks: [{
            type: "input",
            block_id: "work_schedules_block",
            label: { type: "plain_text", text: "削除する勤怠予定" },
            element: {
              type: "static_select",
              action_id: "schedules",
              options: schedulesOptions,
            },
          }],
        },
      };
    } else {
      // 勤怠予定が未登録の場合
      modalView = {
        interactivity_pointer: inputs.interactivity.interactivity_pointer,
        view: {
          type: "modal",
          callback_id: DELETE_SCHEDULE_MODAL_CALLBACK_ID,
          // キャンセル時にも関数を完了させるため、モーダルが閉じられたことを通知させる
          notify_on_close: true,
          title: { type: "plain_text", text: "勤怠予定の削除" },
          close: { type: "plain_text", text: "OK" },
          blocks: [{
            type: "section",
            text: { type: "mrkdwn", text: "登録された勤怠予定はありません。" },
          }],
        },
      };
    }

    // モーダルを表示する
    const response = await client.views.open(modalView);

    if (!response.ok) {
      return { error: `モーダルの表示に失敗しました。: ${response.error}` };
    }

    // モーダルが送信（またはキャンセル）されるまで関数を完了させない
    return { completed: false };
  },
).addViewSubmissionHandler(
  DELETE_SCHEDULE_MODAL_CALLBACK_ID,
  async ({ view, body, client }) => {
    const selectedScheduleId =
      view.state.values.work_schedules_block.schedules.selected_option.value;

    const response = await client.functions.completeSuccess({
      function_execution_id: body.function_data.execution_id,
      outputs: { selected_schedule_id: selectedScheduleId },
    });

    if (!response.ok) {
      console.error(
        `削除対象の勤怠予定の取得に失敗しました。: ${response.error}`,
      );
    }
  },
).addViewClosedHandler(
  DELETE_SCHEDULE_MODAL_CALLBACK_ID,
  async ({ body, client }) => {
    const response = await client.functions.completeSuccess({
      function_execution_id: body.function_data.execution_id,
      outputs: {},
    });

    if (!response.ok) {
      console.error(`削除のキャンセル処理に失敗しました。: ${response.error}`);
    }
  },
);
