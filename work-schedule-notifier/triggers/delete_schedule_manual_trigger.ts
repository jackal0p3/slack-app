import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import DeleteScheduleManualWorkflow from "../workflows/delete_schedule_manual_workflow.ts";

/**
 * 勤怠予定を手動削除するトリガー
 */
const deleteScheduleManualTrigger: Trigger<
  typeof DeleteScheduleManualWorkflow.definition
> = {
  type: TriggerTypes.Shortcut,
  name: "勤怠予定の削除",
  description: "一覧から選択した勤怠予定を削除します。",
  workflow:
    `#/workflows/${DeleteScheduleManualWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    channel: {
      value: TriggerContextData.Shortcut.channel_id,
    },
    user: {
      value: TriggerContextData.Shortcut.user_id,
    },
  },
};

export default deleteScheduleManualTrigger;
