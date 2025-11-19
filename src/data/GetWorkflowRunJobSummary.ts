import type { UseQueryOptions } from "@tanstack/react-query";
import { getOctokitClient } from "@/lib/octokitClient";

export function getWorkflowRunJobSummaryQueryOptions(
	owner: string,
	repo: string,
	jobId: number,
) {
	return {
		queryKey: ["workflowRunJobSummary", owner, repo, jobId],
		queryFn: async () => {
			const octokit = await getOctokitClient();

			const { data } = await octokit.request(
				"GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs",
				{
					owner,
					repo,
					job_id: jobId,
				},
			);

			if (typeof data !== "string") {
				return null;
			}

			const lines = data
				.split(/\r?\n/)
				.filter(
					(l) => l.includes("$GITHUB_STEP_SUMMARY") && !l.includes("##[group]"),
				);

			const pieces = lines.map((line) => {
				const match = line.match(/echo\s+['"](.+?)['"]/);
				return match ? match[1] : "";
			});

			return pieces.join("\n").trim();
		},
		staleTime: 60000,
	} satisfies UseQueryOptions;
}
