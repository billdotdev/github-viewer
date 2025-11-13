import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { gql } from "graphql-request";
import {
	CircleDot,
	Code,
	GitFork,
	GitPullRequest,
	Lock,
	Star,
} from "lucide-react";
import { createCrumb } from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import type {
	GetRepositoryQuery,
	GetRepositoryQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";
import { cn } from "@/lib/utils";

const GET_REPOSITORY = gql`
	query GetRepository($owner: String!, $name: String!) {
		repository(owner: $owner, name: $name) {
			id
			name
			stargazerCount
			forkCount
			visibility
			primaryLanguage {
				name
				color
			}
			pullRequests(states: OPEN) {
				totalCount
			}
			openIssues: issues(states: OPEN) {
				totalCount
			}
		}
	}
`;

const getRepositoryQueryOptions = (owner: string, repo: string) => {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["repository", owner, repo],
		queryFn: async () => {
			return graphQLClient.request<
				GetRepositoryQuery,
				GetRepositoryQueryVariables
			>(GET_REPOSITORY, {
				owner,
				name: repo,
			});
		},
	};
};

export const Route = createFileRoute("/$owner/$repo")({
	component: RepositoryLayout,
	loader: async ({ params, context: { queryClient } }) => {
		await queryClient.ensureQueryData(
			getRepositoryQueryOptions(params.owner, params.repo),
		);

		return {
			crumbs: [
				createCrumb({
					label: `${params.owner}/${params.repo}`,
					to: "/$owner/$repo",
					params,
					className: "max-w-[200px] truncate font-mono",
					buttons: [
						{
							label: "Code",
							to: "/$owner/$repo",
							icon: Code,
						},
						{
							label: "Issues",
							to: "/$owner/$repo/issues",
							icon: CircleDot,
						},
						{
							label: "Pull Requests",
							to: "/$owner/$repo/pulls",
							icon: GitPullRequest,
						},
					],
				}),
			],
		};
	},
});

function RepositoryLayout() {
	const { owner, repo } = Route.useParams();

	const pathname = useRouterState({
		select: (s) => s.location.pathname,
	});

	const isCodeActive = pathname === `/${owner}/${repo}`;

	const { data } = useQuery(getRepositoryQueryOptions(owner, repo));

	const repository = data?.repository;

	if (!repository) {
		return null;
	}

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{isCodeActive && (
				<div className="bg-card shrink-0 w-full">
					<div className="max-w-6xl mx-auto px-5 pt-4">
						<div className="flex items-start justify-between gap-4">
							<div className="mb-2 flex items-center gap-2 flex-wrap">
								<h1 className="text-xl font-semibold">
									{owner}/{repo}
								</h1>
								{repository.visibility === "PRIVATE" && (
									<Badge variant="secondary" className="gap-1">
										<Lock className="h-3 w-3" />
										<span>Private</span>
									</Badge>
								)}
							</div>

							<div className="flex flex-wrap items-center gap-3 text-sm">
								{repository.primaryLanguage && (
									<div className="flex items-center gap-1.5">
										<span
											className="h-3 w-3 rounded-full"
											style={{
												backgroundColor:
													repository.primaryLanguage.color || "#ccc",
											}}
										/>
										<span className="text-muted-foreground">
											{repository.primaryLanguage.name}
										</span>
									</div>
								)}
								<div
									className={cn(
										"flex items-center gap-1.5 text-muted-foreground",
									)}
								>
									<Star className="h-4 w-4" />
									<span>
										{repository.stargazerCount.toLocaleString()} stars
									</span>
								</div>
								<div
									className={cn(
										"flex items-center gap-1.5 text-muted-foreground",
									)}
								>
									<GitFork className="h-4 w-4" />
									<span>{repository.forkCount.toLocaleString()} forks</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			<Outlet />
		</div>
	);
}
