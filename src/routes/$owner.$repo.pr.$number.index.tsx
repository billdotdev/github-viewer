import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import DOMPurify from "dompurify";
import { gql } from "graphql-request";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type {
	GetPullRequestBodyQuery,
	GetPullRequestBodyQueryVariables,
	GetPullRequestCommentsQuery,
	GetPullRequestCommentsQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";
import { cn } from "@/lib/utils";

const getPullRequestBodyQueryOptions = (
	owner: string,
	repo: string,
	prNumber: number,
) => {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["pullRequestBody", owner, repo, prNumber],
		queryFn: async () => {
			return graphQLClient.request<
				GetPullRequestBodyQuery,
				GetPullRequestBodyQueryVariables
			>(GET_PULL_REQUEST_BODY, {
				owner,
				name: repo,
				number: prNumber,
			});
		},
	};
};

const getPullRequestCommentsQueryOptions = (
	owner: string,
	repo: string,
	prNumber: number,
) => {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["pullRequestComments", owner, repo, prNumber],
		queryFn: async () => {
			return graphQLClient.request<
				GetPullRequestCommentsQuery,
				GetPullRequestCommentsQueryVariables
			>(GET_PULL_REQUEST_COMMENTS, {
				owner,
				name: repo,
				number: prNumber,
			});
		},
	};
};

export const Route = createFileRoute("/$owner/$repo/pr/$number/")({
	component: PullRequestConversation,
	loader: async ({ params, context: { queryClient } }) => {
		const prNumber = Number.parseInt(params.number, 10);

		await Promise.all([
			queryClient.ensureQueryData(
				getPullRequestBodyQueryOptions(params.owner, params.repo, prNumber),
			),
			queryClient.ensureQueryData(
				getPullRequestCommentsQueryOptions(params.owner, params.repo, prNumber),
			),
		]);
	},
});

const sanitizeHTML = (html: string) => {
	return DOMPurify.sanitize(html);
};

const GET_PULL_REQUEST_BODY = gql`
	query GetPullRequestBody($owner: String!, $name: String!, $number: Int!) {
		repository(owner: $owner, name: $name) {
			pullRequest(number: $number) {
				id
				bodyHTML
				createdAt
				author {
					login
					avatarUrl
				}
			}
		}
	}
`;

const GET_PULL_REQUEST_COMMENTS = gql`
	query GetPullRequestComments(
		$owner: String!
		$name: String!
		$number: Int!
	) {
		repository(owner: $owner, name: $name) {
			pullRequest(number: $number) {
				id
				comments(first: 100) {
					nodes {
						id
						bodyHTML
						createdAt
						author {
							login
							avatarUrl
						}
					}
				}
				reviews(first: 100) {
					nodes {
						id
						bodyHTML
						state
						createdAt
						author {
							login
							avatarUrl
						}
					}
				}
			}
		}
	}
`;

function PullRequestConversation() {
	const { owner, repo, number } = Route.useParams();
	const prNumber = Number.parseInt(number, 10);

	const { data: prData } = useQuery(
		getPullRequestBodyQueryOptions(owner, repo, prNumber),
	);

	const {
		data: commentsData,
		isLoading: isCommentsLoading,
		error: commentsError,
	} = useQuery(getPullRequestCommentsQueryOptions(owner, repo, prNumber));

	const pr = prData?.repository?.pullRequest;

	if (!pr) {
		return null;
	}

	const comments =
		commentsData?.repository?.pullRequest?.comments.nodes?.filter(
			(c) => c !== null,
		) || [];
	const reviews =
		commentsData?.repository?.pullRequest?.reviews?.nodes?.filter(
			(r) => r !== null,
		) || [];

	const allTimelineItems = [
		...comments.map((c) => ({ ...c, type: "comment" as const })),
		...reviews.map((r) => ({ ...r, type: "review" as const })),
	].sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
	);

	return (
		<div className={cn("space-y-3 mx-auto w-full max-w-5xl pt-3")}>
			{pr.bodyHTML && (
				<Card>
					<CardContent>
						<div className={cn("flex items-start gap-4")}>
							{pr.author?.avatarUrl && (
								<img
									src={pr.author.avatarUrl}
									alt={pr.author.login}
									className={cn("h-8 w-8 rounded-full")}
								/>
							)}
							<div className={cn("flex-1")}>
								<div className={cn("mb-2 flex items-center gap-2")}>
									<span className={cn("font-semibold")}>
										{pr.author?.login}
									</span>
									<span className={cn("text-sm text-muted-foreground")}>
										opened this pull request
									</span>
									<span className={cn("text-sm text-muted-foreground")}>
										{new Date(pr.createdAt).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}
									</span>
								</div>
								<div
									className={cn("prose prose-sm max-w-none text-sm")}
									// biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized with DOMPurify
									dangerouslySetInnerHTML={{
										__html: sanitizeHTML(pr.bodyHTML || ""),
									}}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{isCommentsLoading ? (
				<Card>
					<CardContent
						className={cn("flex min-h-[200px] items-center justify-center")}
					>
						<div className={cn("text-center")}>
							<div
								className={cn(
									"mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary",
								)}
							/>
							<p className={cn("text-sm text-muted-foreground")}>
								Loading comments...
							</p>
						</div>
					</CardContent>
				</Card>
			) : commentsError ? (
				<Card className={cn("border-destructive")}>
					<CardContent>
						<p className={cn("text-sm text-destructive")}>
							Failed to load comments
						</p>
					</CardContent>
				</Card>
			) : allTimelineItems.length === 0 ? (
				<Card>
					<CardContent
						className={cn(
							"flex min-h-[200px] flex-col items-center justify-center",
						)}
					>
						<MessageSquare
							className={cn("mb-3 h-12 w-12 text-muted-foreground")}
						/>
						<p className={cn("text-muted-foreground")}>No comments yet</p>
					</CardContent>
				</Card>
			) : (
				allTimelineItems.map((item) => (
					<Card key={item.id}>
						<CardContent>
							<div className={cn("flex items-start gap-4 overflow-y-auto")}>
								{item.author?.avatarUrl && (
									<img
										src={item.author.avatarUrl}
										alt={item.author.login}
										className={cn("h-8 w-8 rounded-full")}
									/>
								)}
								<div className={cn("flex-1")}>
									<div className={cn("mb-2 flex items-center gap-2")}>
										<span className={cn("font-semibold")}>
											{item.author?.login}
										</span>
										{item.type === "review" && (
											<Badge
												variant={
													item.state === "APPROVED"
														? "default"
														: item.state === "CHANGES_REQUESTED"
															? "destructive"
															: "secondary"
												}
												className={cn(
													item.state === "APPROVED" ? "bg-green-600" : "",
												)}
											>
												{item.state === "APPROVED"
													? "Approved"
													: item.state === "CHANGES_REQUESTED"
														? "Requested changes"
														: "Commented"}
											</Badge>
										)}
										<span className={cn("text-sm text-muted-foreground")}>
											{new Date(item.createdAt).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
												year: "numeric",
											})}
										</span>
									</div>
									{item.bodyHTML && (
										<div
											className={cn("prose prose-sm max-w-none text-sm")}
											// biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized with DOMPurify
											dangerouslySetInnerHTML={{
												__html: sanitizeHTML(item.bodyHTML),
											}}
										/>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				))
			)}
		</div>
	);
}
