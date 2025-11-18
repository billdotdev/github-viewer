import { getOctokitClient } from "@/lib/octokitClient";

export function getWorkflowsQueryOptions(owner: string, repo: string) {
	return {
		queryKey: ["workflows", owner, repo],
		queryFn: async () => {
			const octokit = await getOctokitClient();
			const { data } = await octokit.request(
				"GET /repos/{owner}/{repo}/actions/workflows",
				{
					owner,
					repo,
					per_page: 100,
					_: Date.now(),
				},
			);
			return {
				data: {
					workflows: data.workflows
						.filter((workflow) => workflow.state !== "disabled_manually")
						.sort((a, b) => a.name.localeCompare(b.name)),
				},
			};
		},
	};
}
