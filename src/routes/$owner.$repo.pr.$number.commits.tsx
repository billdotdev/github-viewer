import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { gql } from "graphql-request";
import { GitCommit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type {
	GetPullRequestCommitsQuery,
	GetPullRequestCommitsQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";
import { cn } from "@/lib/utils";

const getPullRequestCommitsQueryOptions = (
	owner: string,
	repo: string,
	prNumber: number,
) => {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["pullRequestCommits", owner, repo, prNumber],
		queryFn: async () => {
			return graphQLClient.request<
				GetPullRequestCommitsQuery,
				GetPullRequestCommitsQueryVariables
			>(GET_PULL_REQUEST_COMMITS, {
				owner,
				name: repo,
				number: prNumber,
			});
		},
	};
};

export const Route = createFileRoute("/$owner/$repo/pr/$number/commits")({
	component: PullRequestCommits,
	loader: async ({ params, context: { queryClient } }) => {
		const prNumber = Number.parseInt(params.number, 10);

		await queryClient.ensureQueryData(
			getPullRequestCommitsQueryOptions(params.owner, params.repo, prNumber),
		);
	},
});

const GET_PULL_REQUEST_COMMITS = gql`
	query GetPullRequestCommits($owner: String!, $name: String!, $number: Int!) {
		repository(owner: $owner, name: $name) {
			pullRequest(number: $number) {
				id
				commits(first: 100) {
					nodes {
						commit {
							id
							oid
							messageHeadline
							committedDate
							author {
								name
								user {
									login
									avatarUrl
								}
							}
							additions
							deletions
						}
					}
				}
			}
		}
	}
`;

function PullRequestCommits() {
	const { owner, repo, number } = Route.useParams();
	const prNumber = Number.parseInt(number, 10);

	const {
		data: commitsData,
		isLoading: isCommitsLoading,
		error: commitsError,
	} = useQuery(getPullRequestCommitsQueryOptions(owner, repo, prNumber));

	const commits =
		commitsData?.repository?.pullRequest?.commits.nodes?.filter(
			(c) => c !== null,
		) || [];

	return (
		<div className="space-y-3 mx-auto w-full max-w-5xl pt-3">
			{isCommitsLoading ? (
				<Card>
					<CardContent className="flex min-h-[200px] items-center justify-center">
						<div className="text-center">
							<div
								className={cn(
									"mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary",
								)}
							/>
							<p className="text-sm text-muted-foreground">
								Loading commits...
							</p>
						</div>
					</CardContent>
				</Card>
			) : commitsError ? (
				<Card className="border-destructive">
					<CardContent className="pt-6">
						<p className="text-sm text-destructive">Failed to load commits</p>
					</CardContent>
				</Card>
			) : commits.length === 0 ? (
				<Card>
					<CardContent
						className={cn(
							"flex min-h-[200px] flex-col items-center justify-center",
						)}
					>
						<GitCommit className="mb-3 h-12 w-12 text-muted-foreground" />
						<p className="text-muted-foreground">No commits yet</p>
					</CardContent>
				</Card>
			) : (
				commits.map((commitNode) => {
					const commit = commitNode.commit;
					return (
						<Card key={commit.id} className="transition-all hover:shadow-md">
							<CardContent>
								<div className="flex items-start gap-4">
									{commit.author?.user?.avatarUrl && (
										<img
											src={commit.author.user.avatarUrl}
											alt={commit.author.user.login}
											className="h-8 w-8 rounded-full"
										/>
									)}
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<p className="mb-1 font-medium">
													{commit.messageHeadline}
												</p>
												<div
													className={cn(
														"flex items-center gap-3 text-sm text-muted-foreground",
													)}
												>
													<span>
														{commit.author?.user?.login ||
															commit.author?.name ||
															"Unknown"}
													</span>
													<span>•</span>
													<span>
														{new Date(commit.committedDate).toLocaleDateString(
															"en-US",
															{
																month: "short",
																day: "numeric",
																year: "numeric",
															},
														)}
													</span>
												</div>
											</div>
											<div className="flex items-center gap-3 text-xs">
												<Badge variant="secondary" className="font-mono">
													{commit.oid.substring(0, 7)}
												</Badge>
												<div className="flex items-center gap-2">
													<span className="text-green-600">
														+{commit.additions}
													</span>
													<span className="text-red-600">
														-{commit.deletions}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})
			)}
		</div>
	);
}
