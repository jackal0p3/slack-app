import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import ViewScheduleListWorkflow from "../workflows/view_schedule_list_workflow.ts";

/**
 * 登録済みの勤怠予定一覧を取得・表示するためのトリガー
 */
const viewScheduleListTrigger: Trigger<
  typeof ViewScheduleListWorkflow.definition
> = {
  type: TriggerTypes.Shortcut,
  name: "勤怠予定一覧の表示",
  description: "勤怠予定一覧を表示します。",
  workflow: `#/workflows/${ViewScheduleListWorkflow.definition.callback_id}`,
  inputs: {
    user: {
      value: TriggerContextData.Shortcut.user_id,
    },
  },
};

export default viewScheduleListTrigger;
