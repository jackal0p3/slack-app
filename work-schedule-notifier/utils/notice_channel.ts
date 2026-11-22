/** 通知先チャンネル ID を保持する環境変数名 */
export const NOTICE_CHANNEL_ENV_KEY = "NOTICE_CHANNEL_ID";

/** 通知先チャンネル ID の環境変数が未設定の場合のエラーメッセージ */
export const NOTICE_CHANNEL_NOT_SET_ERROR =
  `環境変数 ${NOTICE_CHANNEL_ENV_KEY} が設定されていません。`;

/**
 * 環境変数から通知先チャンネル ID を取得する
 *
 * NOTE: ローカル実行（slack run）では .env ファイル、
 *       デプロイ済みアプリでは `slack env add` で登録した値が参照される。
 *
 * @param {Record<string, string>} env 関数の環境変数
 * @returns {string | undefined} 通知先チャンネル ID（未設定の場合は undefined）
 */
export const getNoticeChannelId = (
  env: Record<string, string>,
): string | undefined => env[NOTICE_CHANNEL_ENV_KEY] || undefined;
