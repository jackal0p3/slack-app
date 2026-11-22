import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { getWorkTypesLabel } from "../types/work_type.ts";
import { formatDateWithWeekday } from "../utils/date_format.ts";
import type WorkScheduleDatastore from "../datastores/work_schedule.ts";
import {
  getNoticeChannelId,
  NOTICE_CHANNEL_NOT_SET_ERROR,
} from "../utils/notice_channel.ts";

/**
 * 勤怠予定を削除する関数
 */
export const DeleteScheduleManualFunction = DefineFunction({
  callback_id: "delete_schedule_manual_function",
  title: "勤怠予定の削除(Func)",
  description: "",
  source_file: "functions/delete_schedule_manual_function.ts",
  input_parameters: {
    properties: {
      /** ワークフロー実行ユーザー */
      user: {
        type: Schema.slack.types.user_id,
      },
      /** 削除対象の勤怠予定 ID（キャンセル操作時または勤怠予定が未登録の場合は null） */
      schedule_id: {
        type: Schema.types.string,
      },
    },
    required: ["user"],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

/**
 * 対象の勤怠予定を Datastore から削除し、削除完了メッセージを通知先チャンネル（環境変数 NOTICE_CHANNEL_ID）に投稿する
 *
 * NOTE: ワークフローには条件分岐がなく、後続ステップをスキップできないため、
 *       メッセージの投稿は SendMessage ステップではなくこの関数の中で行う。
 *
 * @param {Object} inputs input_parameters
 * @param {Object} client Slack API クライアント
 * @param {Object} env 環境変数
 *
 * @returns {Promise<{outputs: {schedule_id?: string}} | {error: string}>}
 */
export default SlackFunction(
  DeleteScheduleManualFunction,
  async ({ inputs, client, env }) => {
    // 前ステップで操作キャンセルまたは勤怠予定が未登録だった場合は、何も処理せずに終了する。
    if (!inputs.schedule_id) {
      return { outputs: {} };
    }

    // 削除完了メッセージの投稿先を取得する
    // NOTE: 削除後に投稿先が無いことに気づくのを防ぐため、Datastore の操作より前にチェックする。
    const noticeChannelId = getNoticeChannelId(env);
    if (!noticeChannelId) {
      return { error: NOTICE_CHANNEL_NOT_SET_ERROR };
    }

    // 削除対象の勤怠予定を Datastore から取得する（削除完了メッセージの生成、および本人確認のため）
    const getResponse = await client.apps.datastore.get<
      typeof WorkScheduleDatastore.definition
    >({
      datastore: "work_schedule",
      id: inputs.schedule_id,
    });

    // 削除対象の勤怠予定が見つからない場合
    if (!getResponse.ok || !getResponse.item) {
      return {
        error: `削除対象の勤怠予定が見つかりませんでした。: ${
          getResponse.error ?? ""
        }`,
      };
    }

    // 削除対象の勤怠予定
    const targetSchedule = getResponse.item;

    // NOTE: 勤怠予定の削除モーダルで選択できる予定は実行ユーザー自身の勤怠予定のみに絞っているため、通常はここに到達しないはず。
    //       他人の勤怠予定を誤って（または不正に）削除してしまわないための防御コードとして残す。
    if (targetSchedule.user_id !== inputs.user) {
      return { error: "自分が登録した勤怠予定のみ削除できます。" };
    }

    // 勤怠予定情報を Datastore から削除する
    const deleteResponse = await client.apps.datastore.delete<
      typeof WorkScheduleDatastore.definition
    >({
      datastore: "work_schedule",
      id: inputs.schedule_id,
    });

    if (!deleteResponse.ok) {
      return {
        error: `勤怠予定の削除に失敗しました。: ${deleteResponse.error}`,
      };
    }

    // 勤怠区分の表示名を取得する
    const workTypeLabel = getWorkTypesLabel(targetSchedule.work_type);

    // 勤怠予定削除完了メッセージを生成する
    const messageLines = [
      `:negative_squared_cross_mark: <@${inputs.user}> さんが勤怠予定を削除しました。\n`,
      `>日付： ${formatDateWithWeekday(targetSchedule.date)}`,
      `>勤怠： ${workTypeLabel}`,
    ];

    if (targetSchedule.detail) {
      messageLines.push(`>詳細： ${targetSchedule.detail}`);
    }

    // 削除完了メッセージを投稿する
    const postResponse = await client.chat.postMessage({
      channel: noticeChannelId,
      text: messageLines.join("\n"),
    });

    if (!postResponse.ok) {
      return {
        error:
          `削除完了メッセージの投稿に失敗しました。: ${postResponse.error}`,
      };
    }

    return { outputs: {} };
  },
);
