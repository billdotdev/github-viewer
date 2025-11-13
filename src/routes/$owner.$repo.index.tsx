import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { gql } from "graphql-request";
import { GitFork, Lock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type {
	GetRepositoryCodeQuery,
	GetRepositoryCodeQueryVariables,
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
		}
	}
`;

const GET_REPOSITORY_CODE = gql`
	query GetRepositoryCode($owner: String!, $name: String!) {
		repository(owner: $owner, name: $name) {
			defaultBranchRef {
				target {
					... on Commit {
						history(first: 20) {
							totalCount
							nodes {
								oid
								messageHeadline
								committedDate
								author {
									avatarUrl
									user {
										login
									}
								}
							}
						}
					}
				}
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

const getRepositoryCodeQueryOptions = (owner: string, repo: string) => {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["repositoryCode", owner, repo],
		queryFn: async () => {
			return graphQLClient.request<
				GetRepositoryCodeQuery,
				GetRepositoryCodeQueryVariables
			>(GET_REPOSITORY_CODE, {
				owner,
				name: repo,
			});
		},
	};
};

export const Route = createFileRoute("/$owner/$repo/")({
	component: RepositoryCodeTab,
	loader: async ({ params, context: { queryClient } }) => {
		await Promise.all([
			queryClient.fetchQuery(
				getRepositoryQueryOptions(params.owner, params.repo),
			),

			queryClient.fetchQuery(
				getRepositoryCodeQueryOptions(params.owner, params.repo),
			),
		]);
	},
});

function RepositoryCodeTab() {
	const { owner, repo } = Route.useParams();

	const { data } = useQuery(getRepositoryQueryOptions(owner, repo));
	const { data: codeData } = useQuery(
		getRepositoryCodeQueryOptions(owner, repo),
	);

	const repository = data?.repository;

	if (!repository) {
		return null;
	}

	const branch = codeData?.repository?.defaultBranchRef;
	const commits =
		branch?.target && "history" in branch.target
			? branch?.target?.history?.nodes || []
			: [];
	const totalCommits =
		branch?.target && "history" in branch.target
			? branch?.target?.history?.totalCount || 0
			: 0;

	if (!branch) {
		return (
			<div className="flex flex-1 items-center justify-center p-8">
				<p className="text-muted-foreground">
					No default branch found for this repository
				</p>
			</div>
		);
	}

	return (
		<>
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
								<span>{repository.stargazerCount.toLocaleString()} stars</span>
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

			<div className="max-w-6xl mx-auto w-full px-4 py-3 space-y-3">
				<Card className="gap-2 py-0">
					<CardContent className="p-0">
						<ul className="divide-y">
							{commits.map((commit) => {
								if (!commit) return null;
								return (
									<li
										key={commit.oid}
										className={cn(
											"px-6 py-2 hover:bg-accent/50 transition-colors",
										)}
									>
										<div className="flex items-start gap-3">
											<img
												src={commit.author?.avatarUrl}
												alt={commit.author?.user?.login || ""}
												className="h-8 w-8 rounded-full"
											/>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium">
													{commit.messageHeadline}
												</p>
												<div
													className={cn(
														"mt-1 flex items-center gap-3 text-xs text-muted-foreground",
													)}
												>
													<span>{commit.author?.user?.login}</span>
													<span>•</span>
													<span>{formatDate(commit.committedDate)}</span>
													<span>•</span>
													<Badge
														variant="outline"
														className="font-mono text-xs"
													>
														{commit.oid.substring(0, 7)}
													</Badge>
												</div>
											</div>
										</div>
									</li>
								);
							})}
						</ul>
					</CardContent>
				</Card>

				{commits.length > 0 && (
					<div className="text-center">
						<p className="text-sm text-muted-foreground">
							Showing {commits.length} of {totalCommits.toLocaleString()}{" "}
							commits
						</p>
					</div>
				)}
			</div>
		</>
	);
}

function formatDate(dateString: string) {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) {
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		if (diffHours === 0) {
			const diffMinutes = Math.floor(diffMs / (1000 * 60));
			return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
		}
		return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
	}
	if (diffDays < 7) {
		return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
	}
	if (diffDays < 30) {
		const weeks = Math.floor(diffDays / 7);
		return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
	}
	if (diffDays < 365) {
		const months = Math.floor(diffDays / 30);
		return `${months} month${months !== 1 ? "s" : ""} ago`;
	}
	const years = Math.floor(diffDays / 365);
	return `${years} year${years !== 1 ? "s" : ""} ago`;
}
