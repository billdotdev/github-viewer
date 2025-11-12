import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
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
import { Button } from "@/components/ui/button";
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
			owner {
				login
			}
			description
			stargazerCount
			forkCount
			visibility
			primaryLanguage {
				name
				color
			}
			repositoryTopics(first: 10) {
				nodes {
					topic {
						name
					}
				}
			}
			defaultBranchRef {
				name
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
					className: cn("max-w-[200px] truncate font-mono text-xs"),
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
	const isPullsActive = pathname.includes("/pulls");
	const isIssuesActive = pathname.includes("/issues");

	const { data } = useQuery(getRepositoryQueryOptions(owner, repo));

	const repository = data?.repository;

	if (!repository) {
		return null;
	}

	return (
		<div className={cn("flex flex-1 flex-col overflow-hidden")}>
			<div className={cn("flex flex-1 flex-col overflow-hidden")}>
				<div
					className={cn(
						"shrink-0 flex items-center max-w-6xl w-full mx-auto px-4",
					)}
				>
					<div className={cn("flex")}>
						<Button
							asChild
							variant="ghost"
							size="sm"
							className={cn(
								"gap-2 rounded-none border-b-2",
								isCodeActive
									? "border-primary"
									: "border-transparent hover:bg-accent/75 hover:border-primary/30",
							)}
						>
							<Link to="/$owner/$repo" params={{ owner, repo }}>
								<Code className={cn("h-4 w-4")} />
								<span>Code</span>
							</Link>
						</Button>
						<Button
							asChild
							variant="ghost"
							size="sm"
							className={cn(
								"gap-2 rounded-none border-b-2",
								isIssuesActive
									? "border-primary"
									: "border-transparent hover:bg-accent/75 hover:border-primary/30",
							)}
						>
							<Link to="/$owner/$repo/issues" params={{ owner, repo }}>
								<CircleDot className={cn("h-4 w-4")} />
								<span>Issues</span>
								<Badge variant="secondary" className={cn("text-xs")}>
									{repository.openIssues.totalCount}
								</Badge>
							</Link>
						</Button>
						<Button
							asChild
							variant="ghost"
							size="sm"
							className={cn(
								"gap-2 rounded-none border-b-2",
								isPullsActive
									? "border-primary"
									: "border-transparent hover:bg-accent/75 hover:border-primary/30",
							)}
						>
							<Link to="/$owner/$repo/pulls" params={{ owner, repo }}>
								<GitPullRequest className={cn("h-4 w-4")} />
								<span>Pull Requests</span>
								<Badge variant="secondary" className={cn("text-xs")}>
									{repository.pullRequests.totalCount}
								</Badge>
							</Link>
						</Button>
					</div>
				</div>

				{isCodeActive && (
					<div className={cn("bg-card shrink-0 w-full")}>
						<div className={cn("max-w-6xl mx-auto px-5 pt-4")}>
							<div className={cn("flex items-start justify-between gap-4")}>
								<div className={cn("mb-2 flex items-center gap-2 flex-wrap")}>
									<h1 className={cn("text-xl font-semibold")}>
										{owner}/{repo}
									</h1>
									{repository.visibility === "PRIVATE" && (
										<Badge variant="secondary" className={cn("gap-1")}>
											<Lock className={cn("h-3 w-3")} />
											<span>Private</span>
										</Badge>
									)}
								</div>

								<div
									className={cn("flex flex-wrap items-center gap-4 text-sm")}
								>
									{repository.primaryLanguage && (
										<div className={cn("flex items-center gap-1.5")}>
											<span
												className={cn("h-3 w-3 rounded-full")}
												style={{
													backgroundColor:
														repository.primaryLanguage.color || "#ccc",
												}}
											/>
											<span className={cn("text-muted-foreground")}>
												{repository.primaryLanguage.name}
											</span>
										</div>
									)}
									<div
										className={cn(
											"flex items-center gap-1.5 text-muted-foreground",
										)}
									>
										<Star className={cn("h-4 w-4")} />
										<span>
											{repository.stargazerCount.toLocaleString()} stars
										</span>
									</div>
									<div
										className={cn(
											"flex items-center gap-1.5 text-muted-foreground",
										)}
									>
										<GitFork className={cn("h-4 w-4")} />
										<span>{repository.forkCount.toLocaleString()} forks</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				<Outlet />
			</div>
		</div>
	);
}
