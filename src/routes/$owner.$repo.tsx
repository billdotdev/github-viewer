import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { gql } from "graphql-request";
import {
	Code,
	GitFork,
	GitPullRequest,
	Lock,
	MessageSquareText,
	Star,
} from "lucide-react";
import {
	type BreadcrumbItemData,
	RepositoryBreadcrumbs,
} from "@/components/RepositoryBreadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getGraphQLClient } from "@/lib/graphqlClient";
import { cn } from "@/lib/utils";

interface RepositoryData {
	repository: {
		id: string;
		name: string;
		owner: {
			login: string;
		};
		description: string | null;
		stargazerCount: number;
		forkCount: number;
		visibility: string;
		primaryLanguage: {
			name: string;
			color: string;
		} | null;
		repositoryTopics: {
			nodes: Array<{
				topic: {
					name: string;
				};
			}>;
		};
		defaultBranchRef: {
			name: string;
		} | null;
		pullRequests: {
			totalCount: number;
		};
		openIssues: {
			totalCount: number;
		};
	};
}

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
			return graphQLClient.request<RepositoryData>(GET_REPOSITORY, {
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
	const isPRPage = pathname.includes("/pr/");

	const { data } = useQuery(getRepositoryQueryOptions(owner, repo));

	const repository = data?.repository;

	if (!repository) {
		return null;
	}

	const topics = repository.repositoryTopics.nodes.map((n) => n.topic.name);

	const breadcrumbItems: BreadcrumbItemData[] = [
		{ label: "Home", to: "/", className: cn("flex items-center gap-1") },
		{
			label: `${owner}/${repo}`,
			to: isCodeActive ? undefined : "/$owner/$repo",
			params: { owner, repo },
			className: cn("max-w-[200px] truncate font-mono text-xs"),
		},
	];

	if (isPullsActive && !isPRPage) {
		breadcrumbItems.push({
			label: "Pull Requests",
			className: cn("text-xs"),
		});
	} else if (isIssuesActive) {
		breadcrumbItems.push({
			label: "Issues",
			className: cn("text-xs"),
		});
	}

	return (
		<>
			{!isPRPage && <RepositoryBreadcrumbs items={breadcrumbItems} />}
			<div className={cn("flex flex-1 flex-col overflow-hidden")}>
				<div className={cn("flex flex-1 flex-col overflow-hidden")}>
					<div
						className={cn(
							"shrink-0 flex items-center max-w-6xl w-full mx-auto px-4 border-b",
						)}
					>
						<div className={cn("flex gap-1")}>
							<Button
								asChild
								variant="ghost"
								size="sm"
								className={cn(
									"gap-2 rounded-b-none border-b-2",
									isCodeActive ? "border-primary" : "border-transparent",
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
									"gap-2 rounded-b-none border-b-2",
									isPullsActive ? "border-primary" : "border-transparent",
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
							<Button
								asChild
								variant="ghost"
								size="sm"
								className={cn(
									"gap-2 rounded-b-none border-b-2",
									isIssuesActive ? "border-primary" : "border-transparent",
								)}
							>
								<Link to="/$owner/$repo/issues" params={{ owner, repo }}>
									<MessageSquareText className={cn("h-4 w-4")} />
									<span>Issues</span>
									<Badge variant="secondary" className={cn("text-xs")}>
										{repository.openIssues.totalCount}
									</Badge>
								</Link>
							</Button>
						</div>
					</div>

					{isCodeActive && (
						<div className={cn("bg-card shrink-0 w-full border-b")}>
							<div className={cn("max-w-6xl mx-auto px-4 py-4")}>
								<div className={cn("flex items-start justify-between gap-4")}>
									<div className={cn("flex-1 min-w-0")}>
										<div
											className={cn("mb-2 flex items-center gap-2 flex-wrap")}
										>
											<h1 className={cn("text-2xl font-bold tracking-tight")}>
												{owner}/{repo}
											</h1>
											{repository.visibility === "PRIVATE" && (
												<Badge variant="secondary" className={cn("gap-1")}>
													<Lock className={cn("h-3 w-3")} />
													<span>Private</span>
												</Badge>
											)}
										</div>

										{repository.description && (
											<p className={cn("text-muted-foreground mb-3")}>
												{repository.description}
											</p>
										)}

										{topics.length > 0 && (
											<div className={cn("flex flex-wrap gap-1.5 mb-3")}>
												{topics.map((topic) => (
													<Badge
														key={topic}
														variant="secondary"
														className={cn("text-xs font-normal")}
													>
														{topic}
													</Badge>
												))}
											</div>
										)}

										<div
											className={cn(
												"flex flex-wrap items-center gap-4 text-sm",
											)}
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
												<span>
													{repository.forkCount.toLocaleString()} forks
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					<Outlet />
				</div>
			</div>
		</>
	);
}
