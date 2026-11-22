import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { getWorkTypesLabel } from "../types/work_type.ts";
import { formatDateWithWeekday } from "../utils/date_format.ts";
import type WorkScheduleDatastore from "../datastores/work_schedule.ts";

/** 一覧に表示する最大件数 */
const MAX_DISPLAY_COUNT = 50;

/**
 * 登録済みの勤怠予定一覧を取得する関数
 */
export const GetScheduleListFunction = DefineFunction({
  callback_id: "get_schedule_list_function",
  title: "勤怠予定一覧の取得(Func)",
  description: "",
  source_file: "functions/get_schedule_list_function.ts",
  input_parameters: {
    properties: {},
    required: [],
  },
  output_parameters: {
    properties: {
      /** 勤怠予定一覧メッセージ（mrkdwn 形式） */
      schedule_list_message: {
        type: Schema.types.string,
      },
    },
    required: ["schedule_list_message"],
  },
});

/**
 * Datastore から登録済みの勤怠予定一覧を取得し、一覧表示用のメッセージを返却する
 *
 * @param {Object} client Slack API クライアント
 *
 * @returns {Promise<{outputs: {schedule_list_message: string}} | {error: string}>}
 */
export default SlackFunction(
  GetScheduleListFunction,
  async ({ client }) => {

    // 実行日 (JST) を YYYY-MM-DD 形式で取得する（スウェーデン形式だと一回で取得できる）
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
    }).format(new Date());

    // datastore から実行日以降の勤怠予定を全件取得する
    // NOTE: query は、1 回の呼び出しで返す件数に上限があり、絞り込みはデータを取得した後にかかるため、続きのデータが残っている可能性がある。
    //       そのため、全データを読み込むためには next_cursor が空になるまで繰り返し読み込む。
    const workSchedules = [];
    let cursor: string | undefined;
    do {
      const queryResponse = await client.apps.datastore.query<
        typeof WorkScheduleDatastore.definition
      >({
        datastore: "work_schedule",
        expression: "#date >= :today",
        expression_attributes: { "#date": "date" },
        expression_values: { ":today": today },
        cursor,
      });

      if (!queryResponse.ok) {
        return {
          error: `勤怠予定一覧の取得に失敗しました。: ${queryResponse.error}`,
        };
      }

      workSchedules.push(...(queryResponse.items ?? []));
      cursor = queryResponse.response_metadata?.next_cursor || undefined;
    } while (cursor);

    // 勤怠予定が未登録の場合
    if (workSchedules.length === 0) {
      return {
        outputs: {
          schedule_list_message:
            ":clipboard: 登録されている勤怠予定はありません。",
        },
      };
    }

    // 日付の昇順に並べる
    workSchedules.sort((a, b) => a.date.localeCompare(b.date));

    // 表示件数は最大 50 件までとする（メッセージが長くなりすぎないようにするため）
    const displayItems = workSchedules.slice(0, MAX_DISPLAY_COUNT);

    // 勤怠予定一覧メッセージを生成する
    const itemLines = displayItems.map((item) => {
      const date = formatDateWithWeekday(item.date);
      const workType = getWorkTypesLabel(item.work_type);
      const detail = item.detail || "";

      return `${date}, <@${item.user_id}>, ${workType}, ${detail}`;
    });

    const scheduleListMessage = [
      `:clipboard: 勤怠予定一覧（${MAX_DISPLAY_COUNT}件まで）\n`,
      "日付, ユーザー, 勤怠予定, 詳細",
      "--------------------------------------",
      ...itemLines,
    ].join("\n");

    return { outputs: { schedule_list_message: scheduleListMessage } };
  },
);
