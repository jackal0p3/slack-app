import { Manifest } from "deno-slack-sdk/mod.ts";
import CreateScheduleWorkflow from "./workflows/create_schedule_workflow.ts";
import DeleteScheduleManualWorkflow from "./workflows/delete_schedule_manual_workflow.ts";
import ShowScheduleListWorkflow from "./workflows/view_schedule_list_workflow.ts";
import NoticeScheduleJobWorkflow from "./workflows/notice_schedule_job_workflow.ts";
import DeleteScheduleJobWorkflow from "./workflows/delete_schedule_job_workflow.ts";
import WorkScheduleDatastore from "./datastores/work_schedule.ts";

/**
 * マニフェスト
 */
export default Manifest({
  // NOTE: Deno Slack SDK 2.15.1 では、SDK の Manifest の `name` が Slack App Manifest の `display_information.name`（アプリ名）に設定される。
  //       一方、`displayName` は Bot User の `features.bot_user.display_name` に使用されるため、
  //       Slack の username に変換可能な文字列（半角英数字、-、_）を指定する必要がある。
  //       日本語など username に使用できない文字を `displayName` に指定すると、`slack run` 実行時に `bad_username` エラーになる。
  //       公式リファレンス：https://docs.slack.dev/reference/app-manifest/
  name: "勤怠連絡",
  displayName: "work-schedule-notifier",
  description: "登録された勤怠予定を Slack チャンネルでお知らせします。",
  longDescription: `本アプリでは、以下の機能を利用できます。
・勤怠予定の登録・削除
・登録された勤怠予定の確認（一覧表示）
・登録された勤怠予定の Slack チャンネルへの通知（平日毎日）
・過去の勤怠予定の自動削除（平日毎日）
　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　`,
  icon: "assets/app_icon.png",
  backgroundColor: "#8b9afc",
  workflows: [
    CreateScheduleWorkflow,
    DeleteScheduleManualWorkflow,
    ShowScheduleListWorkflow,
    //NoticeScheduleJobWorkflow,
    //DeleteScheduleJobWorkflow,
  ],
  outgoingDomains: [],
  features: {
    appHome: {
      // アプリへ移動した時に「メッセージ」タブは非表示にする
      messagesTabEnabled: false,
      messagesTabReadOnlyEnabled: false,
    },
  },
  datastores: [WorkScheduleDatastore],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
  ],
});
