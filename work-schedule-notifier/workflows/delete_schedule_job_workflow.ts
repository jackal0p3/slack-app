import { DefineWorkflow } from "deno-slack-sdk/mod.ts";
import { DeleteScheduleJobFunction } from "../functions/delete_schedule_job_function.ts";

/**
 * 勤怠予定を定期削除するワークフロー
 */
const DeleteScheduleJobWorkflow = DefineWorkflow({
  callback_id: "delete_schedule_job_workflow",
  title: "勤怠予定の削除(job)",
  description: "",
  input_parameters: {
    properties: {},
    required: [],
  },
});

/**
 * Step1：
 * 過去日付の勤怠予定を Datastore から削除する
 */
DeleteScheduleJobWorkflow.addStep(
    DeleteScheduleJobFunction,
    {},
  );

export default DeleteScheduleJobWorkflow;
