import { getOctokitClient } from "@/lib/octokitClient";

export interface WorkflowRunFilters {
	actor?: string;
	branch?: string;
	event?: string;
	status?: "completed" | "in_progress" | "queued";
	created?: string;
	workflow_id?: number;
}

export function getWorkflowRunsQueryOptions(
	owner: string,
	repo: string,
	filters?: WorkflowRunFilters,
) {
	return {
		queryKey: ["workflowRunsInfinite", owner, repo, filters],
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			const octokit = await getOctokitClient();

			if (filters?.workflow_id) {
				return octokit.request(
					"GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
					{
						owner,
						repo,
						per_page: 25,
						page: pageParam ? Number(pageParam) : 1,
						exclude_pull_requests: true,
						_: Date.now(),
						workflow_id: filters.workflow_id,
						...filters,
					},
				);
			}
			return octokit.request("GET /repos/{owner}/{repo}/actions/runs", {
				owner,
				repo,
				per_page: 25,
				page: pageParam ? Number(pageParam) : 1,
				exclude_pull_requests: true,
				_: Date.now(),
				...filters,
			});
		},
		getNextPageParam: (lastPage: { headers: { link?: string | null } }) => {
			return getNextPageFromLink(lastPage.headers.link);
		},
		initialPageParam: undefined,
	};
}

function getNextPageFromLink(link?: string | null): string | undefined {
	if (!link) return undefined;
	const match = link.match(/<([^>]+)>\s*;\s*rel="next"/);
	if (!match) return undefined;
	try {
		const url = new URL(match[1]);
		return url.searchParams.get("page") ?? undefined;
	} catch {
		return undefined;
	}
}
