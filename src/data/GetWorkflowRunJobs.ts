import type { UseQueryOptions } from "@tanstack/react-query";
import { getOctokitClient } from "@/lib/octokitClient";

export function getWorkflowRunJobsQueryOptions(
	owner: string,
	repo: string,
	runId: string,
) {
	return {
		queryKey: ["workflowRunJobs", owner, repo, runId],
		queryFn: async () => {
			const octokit = await getOctokitClient();
			return octokit.request(
				"GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
				{
					owner,
					repo,
					run_id: Number(runId),
					_: Date.now(),
				},
			);
		},
		refetchInterval: 3000,
	} satisfies UseQueryOptions;
}
