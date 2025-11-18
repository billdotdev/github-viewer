import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	ChevronDown,
	ChevronRight,
	CircleCheck,
	CircleSlash,
	CircleX,
	LoaderCircle,
} from "lucide-react";
import { useState } from "react";
import { createCrumb } from "@/components/Breadcrumbs";
import { getWorkflowRunQueryOptions } from "@/data/GetWorkflowRun";
import { getWorkflowRunJobsQueryOptions } from "@/data/GetWorkflowRunJobs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$owner/$repo/actions/runs/$runId")({
	component: RouteComponent,
	loader: async ({ params, context: { queryClient } }) => {
		const { data } = await queryClient.fetchQuery(
			getWorkflowRunQueryOptions(params.owner, params.repo, params.runId),
		);
		queryClient.prefetchQuery(
			getWorkflowRunJobsQueryOptions(params.owner, params.repo, params.runId),
		);

		return {
			crumbs: [
				createCrumb({
					label: `#${data.run_number}`,
					to: "/$owner/$repo/actions/runs/$runId",
					params,
					className: "font-mono",
				}),
			],
		};
	},
});

function RouteComponent() {
	const { owner, repo, runId } = Route.useParams();
	const { data } = useQuery(getWorkflowRunQueryOptions(owner, repo, runId));
	const { data: jobsData } = useQuery({
		...getWorkflowRunJobsQueryOptions(owner, repo, runId),
		enabled: data?.data.status !== "completed",
	});
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

	if (!data || !jobsData) {
		return null;
	}
	const { data: run } = data;

	// Group jobs by their base name (removing matrix identifiers)
	const groupedJobs = jobsData.data.jobs.reduce(
		(acc, job) => {
			// Extract base name by removing matrix identifiers like " (0)", " (1)", " (4/5)", etc.
			// Match patterns like " (1/5)" or " (0)" at the end of the job name
			const match = job.name.match(/^(.+?)\s*\((.+?)\)$/);
			let baseName = match ? match[1].trim() : job.name;
			// Remove trailing " - " from the base name
			baseName = baseName.replace(/\s*-\s*$/, "");
			const matrixIndex = match ? match[2] : null;
			console.log(match, baseName, matrixIndex);

			if (!acc[baseName]) {
				acc[baseName] = [];
			}
			acc[baseName].push({ ...job, matrixIndex });
			return acc;
		},
		{} as Record<
			string,
			Array<(typeof jobsData.data.jobs)[0] & { matrixIndex: string | null }>
		>,
	);

	// Sort jobs within each group by matrix index (numerically)
	Object.keys(groupedJobs).forEach((groupName) => {
		groupedJobs[groupName].sort((a, b) => {
			const indexA = a.matrixIndex ? Number.parseInt(a.matrixIndex, 10) : 0;
			const indexB = b.matrixIndex ? Number.parseInt(b.matrixIndex, 10) : 0;
			return indexA - indexB;
		});
	});

	const toggleGroup = (groupName: string) => {
		setExpandedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(groupName)) {
				next.delete(groupName);
			} else {
				next.add(groupName);
			}
			return next;
		});
	};

	const getGroupStatus = (jobs: Array<(typeof jobsData.data.jobs)[0]>) => {
		if (jobs.some((j) => j.conclusion === "failure")) return "failure";
		if (jobs.some((j) => j.status === "in_progress")) return "in_progress";
		if (jobs.some((j) => j.status === "queued")) return "queued";
		if (jobs.every((j) => j.conclusion === "success")) return "success";
		if (jobs.some((j) => j.conclusion === "cancelled")) return "cancelled";
		if (jobs.some((j) => j.conclusion === "skipped")) return "skipped";
		return "unknown";
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "success":
				return "text-green-600";
			case "failure":
				return "text-red-600";
			case "cancelled":
			case "skipped":
				return "text-gray-500";
			case "in_progress":
			case "queued":
				return "text-yellow-600";
			default:
				return "text-gray-500";
		}
	};

	const getStatusIcon = (status: string, conclusion: string | null) => {
		if (conclusion === "success") {
			return <CircleCheck className="w-5 h-5" />;
		}
		if (conclusion === "failure") {
			return <CircleX className="w-5 h-5" />;
		}
		if (status === "in_progress") {
			return <LoaderCircle className="w-5 h-5 animate-spin" />;
		}
		return <CircleSlash className="w-5 h-5" />;
	};

	return (
		<div className="h-[calc(100vh-2.5rem)] overflow-y-auto flex-1">
			<div className="max-w-6xl mx-auto w-full px-4 pt-4">
				<div className="text-xl font-semibold">{run.display_title}</div>
				<div className="text-muted-foreground">
					<span className="font-medium">{run.name}</span> #{run.run_number}:{" "}
					{run.event}
					{run.pull_requests?.[0]?.number
						? ` #${run.pull_requests[0].number}`
						: ""}
				</div>
				{Object.entries(groupedJobs).map(([groupName, jobs]) => {
					const isGroup = jobs.length > 1;
					const isExpanded = expandedGroups.has(groupName);
					const groupStatus = getGroupStatus(jobs);

					if (!isGroup) {
						// Single job, render normally
						const job = jobs[0];
						const statusColor = getStatusColor(job.conclusion || job.status);
						const statusIcon = getStatusIcon(job.status, job.conclusion);

						return (
							<a
								key={job.id}
								href={job.html_url || undefined}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-start gap-3 py-3 px-2 border-b last:border-b-0 group hover:bg-muted transition cursor-pointer"
							>
								<div className={cn("mt-1", statusColor)}>{statusIcon}</div>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-primary">{job.name}</div>
									<div className="text-xs text-muted-foreground leading-tight">
										{job.status === "completed"
											? job.conclusion
												? job.conclusion.charAt(0).toUpperCase() +
													job.conclusion.slice(1)
												: "Completed"
											: job.status === "in_progress"
												? "In Progress"
												: job.status === "queued"
													? "Queued"
													: job.status}
										{job.started_at && (
											<>
												{` • `}
												{new Date(job.started_at).toLocaleString()}
											</>
										)}
										{job.completed_at && job.started_at && (
											<>
												{` • `}
												{(() => {
													const start = new Date(job.started_at).getTime();
													const end = new Date(job.completed_at).getTime();
													const duration = end - start;
													const seconds = Math.floor((duration / 1000) % 60);
													const minutes = Math.floor(
														(duration / (1000 * 60)) % 60,
													);
													const hours = Math.floor(duration / (1000 * 60 * 60));
													return (
														<span>
															Duration:&nbsp;
															{hours > 0 && `${hours}h `}
															{minutes > 0 && `${minutes}m `}
															{seconds}s
														</span>
													);
												})()}
											</>
										)}
									</div>
								</div>
							</a>
						);
					}

					// Matrix job group
					const statusColor = getStatusColor(groupStatus);
					const statusIcon = getStatusIcon(groupStatus, null);

					return (
						<div key={groupName} className="border-b last:border-b-0">
							<button
								type="button"
								className="flex items-start gap-3 py-3 px-2 group hover:bg-muted rounded transition cursor-pointer w-full text-left"
								onClick={() => toggleGroup(groupName)}
							>
								<div className="mt-1 flex items-center gap-1">
									{isExpanded ? (
										<ChevronDown className="w-4 h-4" />
									) : (
										<ChevronRight className="w-4 h-4" />
									)}
									<div className={statusColor}>{statusIcon}</div>
								</div>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-primary">{groupName}</div>
									<div className="text-xs text-muted-foreground leading-tight">
										{jobs.length} jobs
										{` • `}
										{jobs.filter((j) => j.conclusion === "success").length}{" "}
										successful
										{jobs.filter((j) => j.conclusion === "failure").length >
											0 && (
											<>
												{`, `}
												{jobs.filter((j) => j.conclusion === "failure").length}{" "}
												failed
											</>
										)}
										{jobs.filter((j) => j.status === "in_progress").length >
											0 && (
											<>
												{`, `}
												{jobs.filter((j) => j.status === "in_progress").length}{" "}
												in progress
											</>
										)}
									</div>
								</div>
							</button>
							{isExpanded && (
								<div className="ml-8 border-l-2 border-muted">
									{jobs.map((job) => {
										const jobStatusColor = getStatusColor(
											job.conclusion || job.status,
										);
										const jobStatusIcon = getStatusIcon(
											job.status,
											job.conclusion,
										);

										return (
											<a
												href={job.html_url || undefined}
												target="_blank"
												rel="noopener noreferrer"
												key={job.id}
												className="flex items-start gap-3 py-2 px-2 group hover:bg-muted/50 transition cursor-pointer"
											>
												<div className={`mt-1 ${jobStatusColor}`}>
													{jobStatusIcon}
												</div>
												<div className="flex-1 min-w-0">
													<div className="font-medium text-primary">
														{job.name}
													</div>
													<div className="text-xs text-muted-foreground leading-tight">
														{job.status === "completed"
															? job.conclusion
																? job.conclusion.charAt(0).toUpperCase() +
																	job.conclusion.slice(1)
																: "Completed"
															: job.status === "in_progress"
																? "In Progress"
																: job.status === "queued"
																	? "Queued"
																	: job.status}
														{job.started_at && (
															<>
																{` • `}
																{new Date(job.started_at).toLocaleString()}
															</>
														)}
														{job.completed_at && job.started_at && (
															<>
																{` • `}
																{(() => {
																	const start = new Date(
																		job.started_at,
																	).getTime();
																	const end = new Date(
																		job.completed_at,
																	).getTime();
																	const duration = end - start;
																	const seconds = Math.floor(
																		(duration / 1000) % 60,
																	);
																	const minutes = Math.floor(
																		(duration / (1000 * 60)) % 60,
																	);
																	const hours = Math.floor(
																		duration / (1000 * 60 * 60),
																	);
																	return (
																		<span>
																			Duration:&nbsp;
																			{hours > 0 && `${hours}h `}
																			{minutes > 0 && `${minutes}m `}
																			{seconds}s
																		</span>
																	);
																})()}
															</>
														)}
													</div>
												</div>
											</a>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
