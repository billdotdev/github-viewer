import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { gql } from "graphql-request";
import {
	CheckCircle2,
	Circle,
	FileDiff,
	GitBranch,
	GitCommit,
	GitMerge,
	MessageSquare,
	XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import type {
	GetPullRequestQuery,
	GetPullRequestQueryVariables,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";
import { cn } from "@/lib/utils";

const getPullRequestQueryOptions = (
	owner: string,
	repo: string,
	prNumber: number,
) => {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["pullRequest", owner, repo, prNumber],
		queryFn: async () => {
			return graphQLClient.request<
				GetPullRequestQuery,
				GetPullRequestQueryVariables
			>(GET_PULL_REQUEST, {
				owner,
				name: repo,
				number: prNumber,
			});
		},
	};
};

export const Route = createFileRoute("/$owner/$repo/$number")({
	component: PullRequestLayout,
	loader: async ({ params, context: { queryClient } }) => {
		const prNumber = Number.parseInt(params.number, 10);

		await queryClient.ensureQueryData(
			getPullRequestQueryOptions(params.owner, params.repo, prNumber),
		);
	},
});

const GET_PULL_REQUEST = gql`
	query GetPullRequest($owner: String!, $name: String!, $number: Int!) {
		repository(owner: $owner, name: $name) {
			pullRequest(number: $number) {
				id
				number
				title
				state
				headRefName
				baseRefName
				author {
					login
					avatarUrl
				}
				additions
				deletions
				changedFiles
				comments(first: 1) {
					totalCount
				}
				reviews(first: 1) {
					totalCount
				}
				commits(first: 1) {
					totalCount
				}
			}
		}
	}
`;

function PullRequestLayout() {
	const { owner, repo, number } = Route.useParams();
	const prNumber = Number.parseInt(number, 10);

	const pathname = useRouterState({
		select: (s) => s.location.pathname,
	});
	const isCommitsActive = pathname.endsWith("/commits");
	const isFilesActive = pathname.endsWith("/files");
	const isConversationActive = !isCommitsActive && !isFilesActive;

	const { data: prData } = useQuery(
		getPullRequestQueryOptions(owner, repo, prNumber),
	);

	const pr = prData?.repository?.pullRequest;

	if (!pr) {
		return null;
	}

	const getStateIcon = () => {
		if (pr.state === "MERGED") {
			return <GitMerge className={cn("w-5 h-5")} />;
		}
		if (pr.state === "CLOSED") {
			return <XCircle className={cn("w-5 h-5")} />;
		}
		return <Circle className={cn("w-5 h-5")} />;
	};

	const getStateText = () => {
		if (pr.state === "MERGED") {
			return "Merged";
		}
		if (pr.state === "CLOSED") {
			return "Closed";
		}
		return "Open";
	};

	const filesCount = pr.changedFiles;
	const commentsCount =
		(pr.comments.totalCount || 0) + (pr.reviews?.totalCount || 0);

	return (
		<>
			<header
				className={cn(
					"sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4",
				)}
			>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/" className={cn("flex items-center gap-1")}>
									<span>Home</span>
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage
								className={cn("max-w-[200px] truncate font-mono text-xs")}
							>
								{owner}/{repo}
							</BreadcrumbPage>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							{isConversationActive ? (
								<BreadcrumbPage className={cn("font-mono text-xs")}>
									{pr.title}
								</BreadcrumbPage>
							) : (
								<BreadcrumbLink asChild>
									<Link
										to="/$owner/$repo/$number"
										params={{ owner, repo, number }}
										className={cn("font-mono text-xs")}
									>
										{pr.title}
									</Link>
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
						{(isCommitsActive || isFilesActive) && (
							<>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage className={cn("flex items-center gap-1")}>
										{isCommitsActive ? (
											<>
												<GitCommit className={cn("h-3.5 w-3.5")} />
												<span>Commits</span>
											</>
										) : (
											<>
												<FileDiff className={cn("h-3.5 w-3.5")} />
												<span>Files</span>
											</>
										)}
									</BreadcrumbPage>
								</BreadcrumbItem>
							</>
						)}
					</BreadcrumbList>
				</Breadcrumb>
			</header>
			<div className={cn("flex flex-1 flex-col overflow-hidden")}>
				<div className={cn("bg-card shrink-0 w-full")}>
					<div className={cn("max-w-5xl mx-auto px-4 py-3")}>
						<div className={cn("flex items-start gap-4")}>
							<div className={cn("flex-1 min-w-0")}>
								<div className={cn("mb-2 flex items-center gap-2")}>
									<h1 className={cn("text-xl font-bold tracking-tight")}>
										{pr.title}
									</h1>
									<Badge variant="outline">#{pr.number}</Badge>
								</div>

								<div
									className={cn("flex flex-wrap items-center gap-3 text-sm")}
								>
									<Badge
										variant={
											pr.state === "MERGED"
												? "default"
												: pr.state === "CLOSED"
													? "destructive"
													: "default"
										}
										className={cn(
											"gap-1",
											pr.state === "MERGED"
												? "bg-purple-600"
												: pr.state === "OPEN"
													? "bg-green-600"
													: "",
										)}
									>
										{getStateIcon()}
										<span>{getStateText()}</span>
									</Badge>

									<div
										className={cn(
											"flex items-center gap-2 text-muted-foreground",
										)}
									>
										{pr.author?.avatarUrl && (
											<img
												src={pr.author.avatarUrl}
												alt={pr.author.login}
												className={cn("h-4 w-4 rounded-full")}
											/>
										)}
										<span>
											<span className={cn("font-medium")}>
												{pr.author?.login}
											</span>{" "}
											wants to merge
										</span>
									</div>

									<div className={cn("flex items-center gap-2")}>
										<GitBranch
											className={cn("h-4 w-4 text-muted-foreground")}
										/>
										<Badge
											variant="secondary"
											className={cn("font-mono text-xs")}
										>
											{pr.baseRefName}
										</Badge>
										<span className={cn("text-muted-foreground")}>←</span>
										<Badge
											variant="secondary"
											className={cn("font-mono text-xs")}
										>
											{pr.headRefName}
										</Badge>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className={cn("flex flex-1 flex-col overflow-hidden")}>
					<div
						className={cn(
							"shrink-0 flex items-center justify-between max-w-5xl w-full mx-auto px-4",
						)}
					>
						<div className={cn("flex gap-1")}>
							<Button
								asChild
								variant="ghost"
								size="sm"
								className={cn(
									"gap-2 rounded-b-none border-b-2",
									isConversationActive
										? "border-primary"
										: "border-transparent",
								)}
							>
								<Link
									to="/$owner/$repo/$number"
									params={{ owner, repo, number }}
								>
									<MessageSquare className={cn("h-4 w-4")} />
									<span>Conversation</span>
									<Badge variant="secondary" className={cn("text-xs")}>
										{commentsCount}
									</Badge>
								</Link>
							</Button>
							<Button
								asChild
								variant="ghost"
								size="sm"
								className={cn(
									"gap-2 rounded-b-none border-b-2",
									isCommitsActive ? "border-primary" : "border-transparent",
								)}
							>
								<Link
									to="/$owner/$repo/$number/commits"
									params={{ owner, repo, number }}
								>
									<GitCommit className={cn("h-4 w-4")} />
									<span>Commits</span>
									<Badge variant="secondary" className={cn("text-xs")}>
										{pr.commits.totalCount}
									</Badge>
								</Link>
							</Button>
							<Button
								asChild
								variant="ghost"
								size="sm"
								className={cn(
									"gap-2 rounded-b-none border-b-2",
									isFilesActive ? "border-primary" : "border-transparent",
								)}
							>
								<Link
									to="/$owner/$repo/$number/files"
									params={{ owner, repo, number }}
								>
									<FileDiff className={cn("h-4 w-4")} />
									<span>Files Changed</span>
									<Badge variant="secondary" className={cn("text-xs")}>
										{filesCount}
									</Badge>
								</Link>
							</Button>
						</div>

						<div className={cn("flex flex-wrap items-center gap-4 text-sm")}>
							<div className={cn("flex items-center gap-2")}>
								<CheckCircle2 className={cn("h-4 w-4 text-green-600")} />
								<span className={cn("text-muted-foreground")}>
									<span className={cn("font-medium text-green-600")}>
										+{pr.additions}
									</span>{" "}
									additions
								</span>
							</div>
							<div className={cn("flex items-center gap-2")}>
								<XCircle className={cn("h-4 w-4 text-red-600")} />
								<span className={cn("text-muted-foreground")}>
									<span className={cn("font-medium text-red-600")}>
										-{pr.deletions}
									</span>{" "}
									deletions
								</span>
							</div>
							<div
								className={cn("flex items-center gap-2 text-muted-foreground")}
							>
								<span>
									<span className={cn("font-medium")}>{pr.changedFiles}</span>{" "}
									files changed
								</span>
							</div>
						</div>
					</div>

					<Outlet />
				</div>
			</div>
		</>
	);
}
