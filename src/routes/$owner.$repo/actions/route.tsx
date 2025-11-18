import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
	CircleCheck,
	CircleSlash,
	CircleX,
	Loader2,
	LoaderCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { WorkflowRunsFilter } from "@/components/WorkflowRunsFilter";
import {
	getWorkflowRunsQueryOptions,
	type WorkflowRunFilters,
} from "@/data/GetWorkflowRuns";
import { getWorkflowsQueryOptions } from "@/data/GetWorkflows";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$owner/$repo/actions")({
	component: RouteComponent,
	loader: async ({ params, context: { queryClient } }) => {
		await Promise.all([
			queryClient.prefetchInfiniteQuery(
				getWorkflowRunsQueryOptions(params.owner, params.repo),
			),
			queryClient.prefetchQuery(
				getWorkflowsQueryOptions(params.owner, params.repo),
			),
		]);
	},
});

function RouteComponent() {
	const { owner, repo } = Route.useParams();
	const [filters, setFilters] = useState<WorkflowRunFilters>({});

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery(getWorkflowRunsQueryOptions(owner, repo, filters));

	const { data: workflowsData } = useQuery(
		getWorkflowsQueryOptions(owner, repo),
	);

	const runs = data?.pages.flatMap((page) => page.data.workflow_runs) ?? [];
	const workflows = workflowsData?.data.workflows ?? [];
	const loadMoreRef = useRef<HTMLDivElement>(null);

	const availableActors = useMemo(() => {
		const actors = new Set<string>();
		runs.forEach((run) => {
			if (run?.actor?.login) {
				actors.add(run.actor.login);
			}
		});
		return Array.from(actors).sort();
	}, [runs]);

	const availableBranches = useMemo(() => {
		const branches = new Set<string>();
		runs.forEach((run) => {
			if (run?.head_branch) {
				branches.add(run.head_branch);
			}
		});
		return Array.from(branches).sort();
	}, [runs]);

	const availableEvents = useMemo(() => {
		const events = new Set<string>();
		runs.forEach((run) => {
			if (run?.event) {
				events.add(run.event);
			}
		});
		return Array.from(events).sort();
	}, [runs]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const first = entries[0];
				if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ threshold: 0.1 },
		);

		const currentRef = loadMoreRef.current;
		if (currentRef) {
			observer.observe(currentRef);
		}

		return () => {
			if (currentRef) {
				observer.unobserve(currentRef);
			}
		};
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	return (
		<div className="flex">
			<div className="flex flex-col h-[calc(100vh-2.5rem)] w-96 border-r">
				<WorkflowRunsFilter
					filters={filters}
					onFiltersChange={setFilters}
					workflows={workflows}
					availableActors={availableActors}
					availableBranches={availableBranches}
					availableEvents={availableEvents}
				/>
				<div className="overflow-y-auto flex-1">
					{runs.map((run, index) => {
						if (!run) return null;

						const statusColor =
							run.conclusion === "success"
								? "text-green-800"
								: run.conclusion === "failure"
									? "text-red-800"
									: run.conclusion === "cancelled" ||
											run.conclusion === "skipped"
										? "text-gray-800"
										: "text-yellow-800";
						const Icon =
							run.conclusion === "success"
								? CircleCheck
								: run.conclusion === "failure"
									? CircleX
									: run.status === "in_progress"
										? LoaderCircle
										: CircleSlash;
						return (
							<Link
								key={run.id}
								to="/$owner/$repo/actions/runs/$runId"
								preloadDelay={200}
								params={{ owner, repo, runId: run.id.toString() }}
								className="grid grid-cols-12 gap-2 hover:bg-accent px-4 py-2 border-b transition-all"
							>
								<div
									ref={index === runs.length - 20 ? loadMoreRef : undefined}
									className="gap-2 col-span-11 select-none"
								>
									<div className="font-medium truncate">
										{run.display_title}
									</div>
									<div
										className={cn(
											"text-sm text-muted-foreground truncate w-full",
										)}
									>
										<span className="font-medium">{run.name}</span> #
										{run.run_number}: {run.event}
										{run.pull_requests?.[0]?.number
											? ` #${run.pull_requests[0].number}`
											: ""}
									</div>
								</div>

								<div>
									{Icon && (
										<Icon
											className={cn(
												"w-5 h-5 shrink-0 rounded-full overflow-hidden",
												run.status === "in_progress" && "animate-spin",
												statusColor,
											)}
										/>
									)}
								</div>
							</Link>
						);
					})}
					<div className="mt-4 flex justify-center py-4">
						{isFetchingNextPage && (
							<div className="flex items-center gap-2 text-muted-foreground">
								<Loader2 className="h-5 w-5 animate-spin" />
								<span>Loading more...</span>
							</div>
						)}
						{!hasNextPage && runs.length > 0 && (
							<p className="text-sm text-muted-foreground">
								No more workflow runs to load
							</p>
						)}
					</div>
				</div>
			</div>
			<Outlet />
		</div>
	);
}
