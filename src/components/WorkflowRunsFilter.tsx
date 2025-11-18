import { ChevronRight, ListFilter, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { WorkflowRunFilters } from "@/data/GetWorkflowRuns";
import { Button } from "./ui/button";

interface WorkflowRunsFilterProps {
	filters: WorkflowRunFilters;
	onFiltersChange: (filters: WorkflowRunFilters) => void;
	workflows: Array<{ id: number; name: string; path: string }>;
	availableActors: string[];
	availableBranches: string[];
	availableEvents: string[];
}

type FilterType =
	| "status"
	| "actor"
	| "branch"
	| "event"
	| "workflow_id"
	| "created";

const statusOptions = [
	{ value: "completed" as const, label: "Completed" },
	{ value: "in_progress" as const, label: "In Progress" },
	{ value: "queued" as const, label: "Queued" },
];

const eventOptions = [
	"push",
	"pull_request",
	"workflow_dispatch",
	"schedule",
	"release",
	"workflow_call",
	"merge_group",
];

export function WorkflowRunsFilter({
	filters,
	onFiltersChange,
	workflows,
	availableActors,
	availableBranches,
	availableEvents,
}: WorkflowRunsFilterProps) {
	const [showFilterMenu, setShowFilterMenu] = useState(false);
	const [showWorkflowMenu, setShowWorkflowMenu] = useState(false);
	const [activeFilterType, setActiveFilterType] = useState<FilterType | null>(
		null,
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [workflowSearchQuery, setWorkflowSearchQuery] = useState("");
	const filterMenuRef = useRef<HTMLDivElement>(null);
	const workflowMenuRef = useRef<HTMLDivElement>(null);
	const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				filterMenuRef.current &&
				!filterMenuRef.current.contains(event.target as Node)
			) {
				setShowFilterMenu(false);
				setActiveFilterType(null);
			}
			if (
				workflowMenuRef.current &&
				!workflowMenuRef.current.contains(event.target as Node)
			) {
				setShowWorkflowMenu(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const removeFilter = (filterType: keyof WorkflowRunFilters) => {
		const newFilters = { ...filters };
		delete newFilters[filterType];
		onFiltersChange(newFilters);
	};

	const addFilter = (filterType: FilterType, value: string | number) => {
		onFiltersChange({
			...filters,
			[filterType]: value,
		});
		setActiveFilterType(null);
		setShowFilterMenu(false);
		setSearchQuery("");
	};

	const clearAllFilters = () => {
		onFiltersChange({});
	};

	const getFilterLabel = (
		key: keyof WorkflowRunFilters,
		value: string | number,
	): string => {
		switch (key) {
			case "status":
				return `Status: ${statusOptions.find((s) => s.value === value)?.label || value}`;
			case "actor":
				return `Actor: ${value}`;
			case "branch":
				return `Branch: ${value}`;
			case "event":
				return `Event: ${value}`;
			case "workflow_id": {
				const workflow = workflows.find((w) => w.id === value);
				return `Workflow: ${workflow?.name || value}`;
			}
			case "created":
				return `Created: ${value}`;
			default:
				return `${key}: ${value}`;
		}
	};

	const activeFilters = Object.entries(filters).filter(
		([_, value]) => value !== undefined,
	) as Array<[keyof WorkflowRunFilters, string | number]>;

	const availableFilterTypes: Array<{ type: FilterType; label: string }> = [
		{ type: "status", label: "Status" },
		{ type: "actor", label: "Actor" },
		{ type: "branch", label: "Branch" },
		{ type: "event", label: "Event" },
	];

	const filteredWorkflows = workflows.filter((w) =>
		w.name.toLowerCase().includes(workflowSearchQuery.toLowerCase()),
	);

	const handleFilterTypeHover = (type: FilterType) => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
		}
		hoverTimeoutRef.current = setTimeout(() => {
			setActiveFilterType(type);
			setSearchQuery("");
		}, 150);
	};

	const handleFilterTypeLeave = () => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
		}
	};

	const getFilteredOptions = (type: FilterType) => {
		const query = searchQuery.toLowerCase();

		switch (type) {
			case "workflow_id":
				return workflows.filter((w) => w.name.toLowerCase().includes(query));
			case "actor":
				return availableActors.filter((a) => a.toLowerCase().includes(query));
			case "branch":
				return availableBranches.filter((b) => b.toLowerCase().includes(query));
			case "event": {
				const events =
					availableEvents.length > 0 ? availableEvents : eventOptions;
				return events.filter((e) => e.toLowerCase().includes(query));
			}
			case "status":
				return statusOptions.filter((s) =>
					s.label.toLowerCase().includes(query),
				);
			default:
				return [];
		}
	};

	const getFilterCount = (type: FilterType) => {
		switch (type) {
			case "workflow_id":
				return workflows.length;
			case "actor":
				return availableActors.length;
			case "branch":
				return availableBranches.length;
			case "event":
				return availableEvents.length || eventOptions.length;
			case "status":
				return statusOptions.length;
			default:
				return 0;
		}
	};

	return (
		<div className="border-b px-2 py-2 space-y-2">
			<div className="flex items-center gap-2 flex-wrap justify-between">
				<div className="relative" ref={workflowMenuRef}>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowWorkflowMenu(!showWorkflowMenu)}
					>
						Workflow
					</Button>

					{showWorkflowMenu && (
						<div className="absolute left-0 top-full z-20 mt-1 w-80 rounded-md border bg-popover shadow-lg">
							<div className="p-2">
								<div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
									{filteredWorkflows.length > 0 ? (
										filteredWorkflows.map((workflow) => (
											<button
												key={workflow.id}
												type="button"
												onClick={() => {
													addFilter("workflow_id", workflow.id);
													setShowWorkflowMenu(false);
													setWorkflowSearchQuery("");
												}}
												className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded transition-colors"
											>
												{workflow.name}
											</button>
										))
									) : (
										<div className="px-3 py-8 text-sm text-muted-foreground text-center">
											{workflows.length === 0
												? "No workflows found"
												: `${workflows.length} options not matching any workflows`}
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="relative" ref={filterMenuRef}>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setShowFilterMenu(!showFilterMenu)}
						className="h-7 w-7"
					>
						<ListFilter />
					</Button>

					{showFilterMenu && (
						<div className="absolute left-0 top-full z-20 mt-1 rounded-md border bg-popover shadow-lg flex">
							<div className="w-56 p-1">
								{availableFilterTypes.map(({ type, label }) => (
									<button
										key={type}
										type="button"
										onMouseEnter={() => handleFilterTypeHover(type)}
										onMouseLeave={handleFilterTypeLeave}
										className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted rounded transition-colors"
									>
										<span className="flex items-center gap-2">{label}</span>
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									</button>
								))}
							</div>

							{activeFilterType && (
								<div
									className="w-64 border-l bg-popover p-1"
									onMouseEnter={() => {
										if (hoverTimeoutRef.current) {
											clearTimeout(hoverTimeoutRef.current);
										}
									}}
								>
									<div className="max-h-96 overflow-y-auto">
										{activeFilterType === "status" && (
											<>
												{getFilteredOptions("status").length > 0 ? (
													(
														getFilteredOptions("status") as typeof statusOptions
													).map((option) => (
														<button
															key={option.value}
															type="button"
															onClick={() => addFilter("status", option.value)}
															className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded transition-colors"
														>
															{option.label}
														</button>
													))
												) : (
													<div className="px-3 py-8 text-sm text-muted-foreground text-center">
														{getFilterCount("status")} options not matching any
														notifications
													</div>
												)}
											</>
										)}

										{activeFilterType === "actor" && (
											<>
												{getFilteredOptions("actor").length > 0 ? (
													(getFilteredOptions("actor") as string[]).map(
														(actor) => (
															<button
																key={actor}
																type="button"
																onClick={() => addFilter("actor", actor)}
																className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded transition-colors"
															>
																{actor}
															</button>
														),
													)
												) : (
													<div className="px-3 py-8 text-sm text-muted-foreground text-center">
														{availableActors.length === 0
															? "No actors found"
															: `${getFilterCount("actor")} options not matching any notifications`}
													</div>
												)}
											</>
										)}

										{activeFilterType === "branch" && (
											<>
												{getFilteredOptions("branch").length > 0 ? (
													(getFilteredOptions("branch") as string[]).map(
														(branch) => (
															<button
																key={branch}
																type="button"
																onClick={() => addFilter("branch", branch)}
																className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded transition-colors font-mono"
															>
																{branch}
															</button>
														),
													)
												) : (
													<div className="px-3 py-8 text-sm text-muted-foreground text-center">
														{availableBranches.length === 0
															? "No branches found"
															: `${getFilterCount("branch")} options not matching any notifications`}
													</div>
												)}
											</>
										)}

										{activeFilterType === "event" && (
											<>
												{getFilteredOptions("event").length > 0 ? (
													(getFilteredOptions("event") as string[]).map(
														(event) => (
															<button
																key={event}
																type="button"
																onClick={() => addFilter("event", event)}
																className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded transition-colors"
															>
																{event}
															</button>
														),
													)
												) : (
													<div className="px-3 py-8 text-sm text-muted-foreground text-center">
														{getFilterCount("event")} options not matching any
														notifications
													</div>
												)}
											</>
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{activeFilters.length > 0 && (
				<div className="flex items-center gap-2">
					{activeFilters.map(([key, value]) => (
						<div
							key={key}
							className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
						>
							<span>{getFilterLabel(key, value)}</span>
							<button
								type="button"
								onClick={() => removeFilter(key)}
								className="hover:bg-primary/20 rounded p-0.5 transition-colors"
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					))}

					<Button
						variant="ghost"
						size="sm"
						onClick={clearAllFilters}
						className="h-7 text-xs"
					>
						<X className="h-3 w-3 mr-1" />
						Clear all
					</Button>
				</div>
			)}
		</div>
	);
}
