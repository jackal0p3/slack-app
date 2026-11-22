import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import type WorkScheduleDatastore from "../datastores/work_schedule.ts";

/** bulkDelete で 1 回に削除できる最大件数（Slack API の上限） */
const BULK_DELETE_MAX_COUNT = 25;

/**
 * 勤怠予定を定期削除する関数
 */
export const DeleteScheduleJobFunction = DefineFunction({
  callback_id: "delete_schedule_job_function",
  title: "勤怠予定の定期削除(Func)",
  description: "",
  source_file: "functions/delete_schedule_job_function.ts",
  input_parameters: {
    properties: {},
    required: [],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

/**
 * ジョブ実行日 (JST) 以前の勤怠予定を、ユーザーを問わず Datastore から全件削除する
 *
 * NOTE: ジョブ実行を想定しているため、削除完了メッセージの投稿は行わない。
 *
 * @param {Object} client Slack APIクライアント
 *
 * @returns {Promise<{outputs: {}} | {error: string}>}
 */
export default SlackFunction(
  DeleteScheduleJobFunction,
  async ({ client }) => {
    // 実行日 (JST) を YYYY-MM-DD 形式で取得する（スウェーデン形式だと1回で取得できる）
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
    }).format(new Date());

    // 実行日を含む過去の勤怠予定の ID を全件取得する
    // NOTE: query は 1 回の呼び出しで返す件数に上限があるため、next_cursor が空になるまで繰り返し読み込む。
    //       読み込み途中で削除するとページングがずれる可能性があるため、先に全件の ID を集めてから削除する。
    const targetIds: string[] = [];
    let cursor: string | undefined;
    do {
      const queryResponse = await client.apps.datastore.query<
        typeof WorkScheduleDatastore.definition
      >({
        datastore: "work_schedule",
        expression: "#date <= :today",
        expression_attributes: { "#date": "date" },
        expression_values: { ":today": today },
        cursor,
      });

      if (!queryResponse.ok) {
        return {
          error:
            `削除対象の勤怠予定の取得に失敗しました。: ${queryResponse.error}`,
        };
      }

      targetIds.push(...(queryResponse.items ?? []).map((item) => item.id));
      cursor = queryResponse.response_metadata?.next_cursor || undefined;
    } while (cursor);

    // 削除対象の勤怠予定を、上限件数ずつまとめて Datastore から削除する
    for (let i = 0; i < targetIds.length; i += BULK_DELETE_MAX_COUNT) {
      const ids = targetIds.slice(i, i + BULK_DELETE_MAX_COUNT);

      const deleteResponse = await client.apps.datastore.bulkDelete<
        typeof WorkScheduleDatastore.definition
      >({
        datastore: "work_schedule",
        ids,
      });

      // NOTE: 一部のみ削除に失敗した場合の ok の値はドキュメントに明記されていないため、
      //       ok に加えて、削除に失敗した ID（SDK の型定義上は ids に入る）の有無でも失敗を判定する。
      const failedIds: string[] = deleteResponse.ids ?? [];
      if (!deleteResponse.ok || failedIds.length > 0) {
        return {
          error: `勤怠予定の削除に失敗しました。: ${
            deleteResponse.error ?? "partial_failure"
          }${
            failedIds.length > 0 ? ` (failed ids: ${failedIds.join(", ")})` : ""
          }`,
        };
      }
    }

    // ジョブ実行のため、slack activity で実行結果を確認できるようにしておく
    console.log(
      `過去の勤怠予定を削除しました。（基準日: ${today}、件数: ${targetIds.length}）`,
    );

    return { outputs: {} };
  },
);
