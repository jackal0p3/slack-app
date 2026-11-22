import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import {
  getNoticeChannelId,
  NOTICE_CHANNEL_NOT_SET_ERROR,
} from "../utils/notice_channel.ts";

/**
 * チャンネルにメッセージを投稿する関数
 */
export const PostMessageFunction = DefineFunction({
  callback_id: "post_message_function",
  title: "チャンネルへの投稿(Func)",
  description: "",
  source_file: "functions/post_message_function.ts",
  input_parameters: {
    properties: {
      /** 投稿するメッセージ（mrkdwn 形式） */
      message: {
        type: Schema.types.string,
      },
    },
    required: ["message"],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

/**
 * 環境変数 NOTICE_CHANNEL_ID のチャンネルにメッセージを投稿する
 *
 * @param {Object} inputs input_parameters
 * @param {Object} client Slack API クライアント
 * @param {Object} env 環境変数
 *
 * @returns {Promise<{outputs: {}} | {error: string}>}
 */
export default SlackFunction(
  PostMessageFunction,
  async ({ inputs, client, env }) => {

    // 投稿先のチャンネルを取得する
    const channel = getNoticeChannelId(env);
    if (!channel) {
      return { error: NOTICE_CHANNEL_NOT_SET_ERROR };
    }

    // チャンネルにメッセージを投稿する
    const postResponse = await client.chat.postMessage({
      channel,
      text: inputs.message,
    });

    if (!postResponse.ok) {
      return {
        error: `メッセージの投稿に失敗しました。: ${postResponse.error}`,
      };
    }

    return { outputs: {} };
  },
);
