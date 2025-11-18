import { getOctokitClient } from "@/lib/octokitClient";

export function getWorkflowRunQueryOptions(
	owner: string,
	repo: string,
	runId: string,
) {
	return {
		queryKey: ["workflowRun", owner, repo, runId],
		queryFn: async () => {
			const octokit = await getOctokitClient();
			return octokit.request(
				"GET /repos/{owner}/{repo}/actions/runs/{run_id}",
				{
					owner,
					repo,
					run_id: Number(runId),
					_: Date.now(),
				},
			);
		},
	};
}
