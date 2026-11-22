import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import {
  getNoticeChannelId,
  NOTICE_CHANNEL_NOT_SET_ERROR,
} from "../utils/notice_channel.ts";

/**
 * チャンネルにエフェメラルメッセージを投稿する関数
 */
export const PostEphemeralMessageFunction = DefineFunction({
  callback_id: "post_ephemeral_message_function",
  title: "チャンネルへのEph投稿(Func)",
  description: "",
  source_file: "functions/post_ephemeral_message_function.ts",
  input_parameters: {
    properties: {
      /** メッセージを表示するユーザー */
      user: {
        type: Schema.slack.types.user_id,
      },
      /** 投稿するメッセージ（mrkdwn 形式） */
      message: {
        type: Schema.types.string,
      },
    },
    required: ["user", "message"],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

/**
 * 環境変数 NOTICE_CHANNEL_ID のチャンネルに、指定ユーザーにのみ表示されるエフェメラルメッセージを投稿する
 *
 * @param {Object} inputs input_parameters
 * @param {Object} client Slack API クライアント
 * @param {Object} env 環境変数
 *
 * @returns {Promise<{outputs: {}} | {error: string}>}
 */
export default SlackFunction(
  PostEphemeralMessageFunction,
  async ({ inputs, client, env }) => {

    // 投稿先のチャンネルを取得する
    const channel = getNoticeChannelId(env);
    if (!channel) {
      return { error: NOTICE_CHANNEL_NOT_SET_ERROR };
    }

    // チャンネルにエフェメラルメッセージを投稿する
    const postResponse = await client.chat.postEphemeral({
      channel,
      user: inputs.user,
      text: inputs.message,
    });

    if (!postResponse.ok) {
      return {
        error:
          `エフェメラルメッセージの投稿に失敗しました。: ${postResponse.error}`,
      };
    }

    return { outputs: {} };
  },
);
