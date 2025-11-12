import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { gql } from "graphql-request";
import { CircleDot, MessageSquare } from "lucide-react";
import { createCrumb } from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import type {
	GetIssuesQuery,
	GetIssuesQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";
import { cn } from "@/lib/utils";

const GET_ISSUES = gql`
	query GetIssues($owner: String!, $name: String!) {
		repository(owner: $owner, name: $name) {
			issues(
				first: 50
				states: OPEN
				orderBy: { field: CREATED_AT, direction: DESC }
			) {
				totalCount
				nodes {
					number
					title
					state
					createdAt
					author {
						login
						avatarUrl
					}
					comments {
						totalCount
					}
					labels(first: 5) {
						nodes {
							name
							color
						}
					}
				}
			}
		}
	}
`;

const getIssuesQueryOptions = (owner: string, repo: string) => {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["repositoryIssues", owner, repo],
		queryFn: async () => {
			return graphQLClient.request<GetIssuesQuery, GetIssuesQueryVariables>(
				GET_ISSUES,
				{
					owner,
					name: repo,
				},
			);
		},
	};
};

export const Route = createFileRoute("/$owner/$repo/issues")({
	component: RepositoryIssuesTab,
	loader: async ({ params, context: { queryClient } }) => {
		await queryClient.ensureQueryData(
			getIssuesQueryOptions(params.owner, params.repo),
		);

		return {
			crumbs: [
				createCrumb({
					label: "Issues",
					icon: CircleDot,
				}),
			],
		};
	},
});

function RepositoryIssuesTab() {
	const { owner, repo } = Route.useParams();

	const { data } = useQuery(getIssuesQueryOptions(owner, repo));

	const issues = data?.repository?.issues.nodes || [];

	const formatDate = (dateString: string) => {
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
		return date.toLocaleDateString();
	};

	const hexToRgb = (hex: string) => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16),
				}
			: { r: 128, g: 128, b: 128 };
	};

	const getContrastColor = (hexColor: string) => {
		const rgb = hexToRgb(hexColor);
		const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
		return luminance > 0.5 ? "#000000" : "#ffffff";
	};

	if (issues.length === 0) {
		return (
			<div className={cn("flex flex-1 items-center justify-center p-8")}>
				<div className={cn("text-center")}>
					<CircleDot
						className={cn("h-12 w-12 mx-auto mb-4 text-muted-foreground")}
					/>
					<h3 className={cn("text-lg font-semibold mb-2")}>No open issues</h3>
					<p className={cn("text-muted-foreground")}>
						There are no open issues for this repository
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("flex-1 overflow-auto")}>
			<div className={cn("max-w-6xl mx-auto px-4 py-6")}>
				<div className={cn("rounded-md border bg-card")}>
					<ul className={cn("divide-y")}>
						{issues.map((issue) => {
							if (!issue) return null;
							return (
								<li key={issue.number}>
									<a
										href={`https://github.com/${owner}/${repo}/issues/${issue.number}`}
										target="_blank"
										rel="noopener noreferrer"
										className={cn(
											"block transition-colors hover:bg-accent/50 focus:bg-accent/50",
										)}
									>
										<div className={cn("px-4 py-4")}>
											<div className={cn("flex items-start gap-3")}>
												<div className={cn("pt-0.5")}>
													<CircleDot className={cn("w-5 h-5 text-green-600")} />
												</div>
												{issue.author && (
													<img
														src={issue.author.avatarUrl}
														alt={issue.author.login}
														className={cn("h-10 w-10 rounded-full")}
													/>
												)}
												<div className={cn("min-w-0 flex-1")}>
													<div
														className={cn("font-semibold leading-tight mb-1")}
													>
														{issue.title}
													</div>
													<div
														className={cn(
															"flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mb-2",
														)}
													>
														<span>#{issue.number}</span>
														<span>•</span>
														<span>opened {formatDate(issue.createdAt)}</span>
														{issue.author && (
															<>
																<span>•</span>
																<span>by {issue.author.login}</span>
															</>
														)}
														{issue.comments.totalCount > 0 && (
															<>
																<span>•</span>
																<span className={cn("flex items-center gap-1")}>
																	<MessageSquare className={cn("h-3 w-3")} />
																	{issue.comments.totalCount}
																</span>
															</>
														)}
													</div>
													{issue.labels?.nodes &&
														issue.labels.nodes.length > 0 && (
															<div className={cn("flex flex-wrap gap-1.5")}>
																{issue.labels.nodes.map((label) => {
																	if (!label) return null;
																	return (
																		<Badge
																			key={label.name}
																			style={{
																				backgroundColor: `#${label.color}`,
																				color: getContrastColor(
																					`#${label.color}`,
																				),
																			}}
																			className={cn("text-xs font-normal")}
																		>
																			{label?.name}
																		</Badge>
																	);
																})}
															</div>
														)}
												</div>
											</div>
										</div>
									</a>
								</li>
							);
						})}
					</ul>
				</div>
			</div>
		</div>
	);
}
