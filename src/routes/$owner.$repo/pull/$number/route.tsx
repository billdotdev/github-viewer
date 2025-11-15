import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
	CheckCircle2,
	Circle,
	FileDiff,
	GitBranch,
	GitCommit,
	GitMerge,
	GitPullRequest,
	MessageSquare,
	XCircle,
} from "lucide-react";
import { createCrumb } from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { getPullRequestQueryOptions } from "@/data/GetPullRequest";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$owner/$repo/pull/$number")({
	component: PullRequestLayout,
	loader: async ({ params, context: { queryClient } }) => {
		const prNumber = Number.parseInt(params.number, 10);
		const data = await queryClient.fetchQuery(
			getPullRequestQueryOptions(params.owner, params.repo, prNumber),
		);
		return {
			crumbs: [
				createCrumb({
					label: "Pull Requests",
					to: "/$owner/$repo/pulls",
					params,
					icon: GitPullRequest,
				}),
				createCrumb({
					label: `#${params.number}`,
					to: "/$owner/$repo/pull/$number",
					params,
					className: "font-mono",
					buttons: [
						{
							label: "Conversation",
							to: "/$owner/$repo/pull/$number",
							icon: MessageSquare,
							badge: data.repository?.pullRequest?.comments.totalCount,
						},
						{
							label: "Commits",
							to: "/$owner/$repo/pull/$number/commits",
							icon: GitCommit,
							badge: data.repository?.pullRequest?.commits.totalCount,
						},
						{
							label: "Files",
							to: "/$owner/$repo/pull/$number/files",
							icon: FileDiff,
							badge: data.repository?.pullRequest?.changedFiles,
						},
					],
				}),
			],
		};
	},
});

function PullRequestLayout() {
	const { owner, repo, number } = Route.useParams();
	const prNumber = Number.parseInt(number, 10);
	const { data } = useQuery(getPullRequestQueryOptions(owner, repo, prNumber));

	const pr = data?.repository?.pullRequest;

	if (!pr) {
		return null;
	}

	const getStateIcon = () => {
		if (pr.state === "MERGED") {
			return <GitMerge className="w-5 h-5" />;
		}
		if (pr.state === "CLOSED") {
			return <XCircle className="w-5 h-5" />;
		}
		return <Circle className="w-5 h-5" />;
	};

	const getStateText = () => {
		if (pr.state === "MERGED") {
			return "Merged";
		}
		if (pr.isDraft) {
			return "Draft";
		}
		if (pr.state === "CLOSED") {
			return "Closed";
		}
		return "Open";
	};

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="bg-card shrink-0 w-full">
				<div className="max-w-4xl mx-auto pt-3">
					<div className="flex items-start gap-4">
						<div className="flex-1 min-w-0">
							<div className="mb-2 flex items-center gap-2">
								<h1 className="text-xl font-semibold tracking-tight">
									{pr.title}
								</h1>
								<Badge variant="outline">#{pr.number}</Badge>
							</div>

							<div className="flex items-center justify-between">
								<div className="flex flex-wrap items-center gap-3 text-sm">
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
											pr.state === "MERGED" && "bg-purple-600",
											pr.state === "OPEN" && "bg-green-600",
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
												className="h-5 w-5 rounded-full"
											/>
										)}
										<span>
											<span className="font-medium">{pr.author?.login}</span>{" "}
											wants to merge
										</span>
									</div>

									<div className="flex items-center gap-2">
										<GitBranch className="h-4 w-4 text-muted-foreground" />
										<Badge variant="secondary" className="font-mono text-xs">
											{pr.baseRefName}
										</Badge>
										<span className="text-muted-foreground">←</span>
										<Badge variant="secondary" className="font-mono text-xs">
											{pr.headRefName}
										</Badge>
									</div>
								</div>

								<div className="flex flex-wrap items-center justify-end gap-2 text-sm">
									<div className="flex items-center gap-1">
										<CheckCircle2 className="h-4 w-4 text-green-600" />
										<span className="text-muted-foreground">
											<span className="font-medium text-green-600">
												+{pr.additions}
											</span>{" "}
											additions
										</span>
									</div>
									<div className="flex items-center gap-1">
										<XCircle className="h-4 w-4 text-red-600" />
										<span className="text-muted-foreground">
											<span className="font-medium text-red-600">
												-{pr.deletions}
											</span>{" "}
											deletions
										</span>
									</div>
									<div className="flex items-center gap-1 text-muted-foreground">
										<span>
											<span className="font-medium">{pr.changedFiles}</span>{" "}
											files changed
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Outlet />
		</div>
	);
}
