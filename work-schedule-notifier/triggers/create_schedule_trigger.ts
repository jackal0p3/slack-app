import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import CreateScheduleWorkflow from "../workflows/create_schedule_workflow.ts";

/**
 * 勤怠予定を登録するトリガー
 */
const createScheduleTrigger: Trigger<
  typeof CreateScheduleWorkflow.definition
> = {
  type: TriggerTypes.Shortcut, // ショートカット型（ユーザーがリンクをクリックして起動）
  name: "勤怠予定の登録",
  description: "勤怠予定を登録します。",
  workflow: `#/workflows/${CreateScheduleWorkflow.definition.callback_id}`, // 起動するワークフローへの参照
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity, // フォーム表示に必要なインタラクティビティトークン
    },
    channel: {
      value: TriggerContextData.Shortcut.channel_id, // トリガーを実行したチャンネルの ID
    },
    user: {
      value: TriggerContextData.Shortcut.user_id, // トリガーを実行したユーザーの ID
    },
  },
};

export default createScheduleTrigger;
