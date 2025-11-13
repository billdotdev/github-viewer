import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { gql } from "graphql-request";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type {
	GetRepositoryCodeQuery,
	GetRepositoryCodeQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";
import { cn } from "@/lib/utils";

const GET_REPOSITORY_CODE = gql`
	query GetRepositoryCode($owner: String!, $name: String!) {
		repository(owner: $owner, name: $name) {
			defaultBranchRef {
				name
				target {
					... on Commit {
						history(first: 20) {
							totalCount
							nodes {
								oid
								messageHeadline
								message
								committedDate
								author {
									name
									email
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
		await queryClient.ensureQueryData(
			getRepositoryCodeQueryOptions(params.owner, params.repo),
		);
	},
});

function RepositoryCodeTab() {
	const { owner, repo } = Route.useParams();

	const { data } = useQuery(getRepositoryCodeQueryOptions(owner, repo));

	const branch = data?.repository?.defaultBranchRef;
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
		<div className="flex-1 overflow-auto">
			<div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
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
												alt={commit.author?.name || ""}
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
													<span>
														{commit.author?.user?.login || commit.author?.name}
													</span>
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
		</div>
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
