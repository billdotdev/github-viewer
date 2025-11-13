import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { gql } from "graphql-request";
import {
	Circle,
	GitMerge,
	GitPullRequest,
	GitPullRequestClosed,
	GitPullRequestDraft,
	Loader2,
	Search,
	X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createCrumb } from "@/components/Breadcrumbs";
import { prStateTextColorClassNames } from "@/components/PrStateBadge";
import { PrStateIcon } from "@/components/PrStateIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type GetPrStateCountsQuery,
	type GetPrStateCountsQueryVariables,
	type GetPullRequestsQuery,
	type GetPullRequestsQueryVariables,
	PullRequestState,
} from "@/generated/graphql";
import { getGraphQLClient } from "@/lib/graphqlClient";
import { cn } from "@/lib/utils";

const GET_PULL_REQUESTS = gql`
	query GetPullRequests(
		$owner: String!
		$name: String!
		$states: [PullRequestState!]
		$first: Int!
		$after: String
		$before: String
		$last: Int
	) {
		repository(owner: $owner, name: $name) {
			pullRequests(
				states: $states
				first: $first
				after: $after
				before: $before
				last: $last
				orderBy: { field: CREATED_AT, direction: DESC }
			) {
				totalCount
				pageInfo {
					hasNextPage
					hasPreviousPage
					endCursor
					startCursor
				}
				nodes {
					number
					title
					state
					isDraft
					createdAt
					author {
						login
					}
					comments {
						totalCount
					}
					labels(first: 10) {
						nodes {
							id
							name
							color
						}
					}
				}
			}
		}
	}
`;

const GET_PR_STATE_COUNTS = gql`
	query GetPRStateCounts($owner: String!, $name: String!) {
		repository(owner: $owner, name: $name) {
			open: pullRequests(states: [OPEN]) {
				totalCount
			}
			openPRsForDraftCount: pullRequests(states: [OPEN], first: 100) {
				nodes {
					isDraft
				}
			}
			closed: pullRequests(states: [CLOSED]) {
				totalCount
			}
			merged: pullRequests(states: [MERGED]) {
				totalCount
			}
		}
	}
`;

type PRStateFilter = "open" | "draft" | "closed" | "merged";

interface PRSearchParams {
	state?: PRStateFilter;
	author?: string;
	search?: string;
	label?: string;
}

const getInfinitePullRequestsQueryOptions = (
	owner: string,
	repo: string,
	filters: PRSearchParams,
) => {
	const graphQLClient = getGraphQLClient();

	let states: PullRequestState[] = [PullRequestState.Open];
	if (filters.state === "closed") {
		states = [PullRequestState.Closed];
	} else if (filters.state === "merged") {
		states = [PullRequestState.Merged];
	} else if (filters.state === "open" || filters.state === "draft") {
		states = [PullRequestState.Open];
	}

	return {
		queryKey: [
			"repositoryPullRequestsInfinite",
			owner,
			repo,
			filters.state,
			filters.author,
			filters.search,
			filters.label,
		],
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			return graphQLClient.request<
				GetPullRequestsQuery,
				GetPullRequestsQueryVariables
			>(GET_PULL_REQUESTS, {
				owner,
				name: repo,
				states,
				first: 30,
				after: pageParam,
				before: undefined,
				last: undefined,
			});
		},
		getNextPageParam: (lastPage: GetPullRequestsQuery) => {
			const pageInfo = lastPage?.repository?.pullRequests?.pageInfo;
			if (pageInfo?.hasNextPage && pageInfo?.endCursor) {
				return pageInfo.endCursor;
			}
			return undefined;
		},
		initialPageParam: undefined,
	};
};

const getPRStateCountsQueryOptions = (owner: string, repo: string) => {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["prStateCounts", owner, repo],
		queryFn: async () => {
			return graphQLClient.request<
				GetPrStateCountsQuery,
				GetPrStateCountsQueryVariables
			>(GET_PR_STATE_COUNTS, {
				owner,
				name: repo,
			});
		},
	};
};

export const Route = createFileRoute("/$owner/$repo/pulls")({
	component: RepositoryPullRequestsTab,
	validateSearch: (
		search: Record<string, string | undefined>,
	): PRSearchParams => ({
		state: search.state as PRStateFilter | undefined,
		author: search.author,
		search: search.search,
		label: search.label,
	}),
	loaderDeps: ({ search }) => search,
	loader: async ({ params, context: { queryClient }, deps }) => {
		const { owner, repo } = params;

		const [_, countsData] = await Promise.all([
			queryClient.ensureInfiniteQueryData(
				getInfinitePullRequestsQueryOptions(owner, repo, deps),
			),
			queryClient.ensureQueryData(
				getPRStateCountsQueryOptions(params.owner, params.repo),
			),
		]);

		const draftCount =
			countsData.repository?.openPRsForDraftCount?.nodes?.filter(
				(pr) => pr?.isDraft,
			).length || 0;

		return {
			crumbs: [
				createCrumb({
					label: "Pull Requests",
					to: "/$owner/$repo/pulls",
					params,
					icon: GitPullRequest,
					buttons: [
						{
							label: `${(countsData.repository?.open.totalCount || 0) - draftCount} Open`,
							to: "/$owner/$repo/pulls",
							icon: GitPullRequest,
							iconClassName: prStateTextColorClassNames.OPEN,
						},
						{
							label: `${draftCount} Draft`,
							to: "/$owner/$repo/pulls?state=draft",
							icon: GitPullRequestDraft,
							iconClassName: prStateTextColorClassNames.DRAFT,
						},
						{
							label: `${countsData.repository?.closed.totalCount} Closed`,
							to: "/$owner/$repo/pulls?state=closed",
							icon: GitPullRequestClosed,
							iconClassName: prStateTextColorClassNames.CLOSED,
						},
						{
							label: `${countsData.repository?.merged.totalCount} Merged`,
							to: "/$owner/$repo/pulls?state=merged",
							icon: GitMerge,
							iconClassName: prStateTextColorClassNames.MERGED,
						},
					],
				}),
			],
		};
	},
});

function RepositoryPullRequestsTab() {
	const { owner, repo } = Route.useParams();
	const navigate = useNavigate({ from: "/$owner/$repo/pulls" });
	const searchParams = Route.useSearch();

	const [localSearch, setLocalSearch] = useState(searchParams.search || "");
	const [debouncedSearch, setDebouncedSearch] = useState(
		searchParams.search || "",
	);

	const loadMoreRef = useRef<HTMLDivElement>(null);

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useInfiniteQuery(
			getInfinitePullRequestsQueryOptions(owner, repo, searchParams),
		);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(localSearch);
		}, 300);
		return () => clearTimeout(timer);
	}, [localSearch]);

	useEffect(() => {
		if (debouncedSearch !== searchParams.search) {
			navigate({
				search: {
					...searchParams,
					search: debouncedSearch || undefined,
				},
			});
		}
	}, [debouncedSearch, searchParams, navigate]);

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

	const pullRequests = useMemo(() => {
		if (!data?.pages) return [];
		return data.pages.flatMap(
			(page) => page?.repository?.pullRequests?.nodes || [],
		);
	}, [data]);

	const filteredPullRequests = useMemo(() => {
		let filtered = [...pullRequests];

		if (searchParams.state === "draft") {
			filtered = filtered.filter((pr) => pr?.isDraft);
		} else if (searchParams.state === "open") {
			filtered = filtered.filter((pr) => !pr?.isDraft);
		} else if (searchParams.state === "merged") {
			filtered = filtered.filter((pr) => pr?.state === "MERGED");
		} else if (searchParams.state === "closed") {
			filtered = filtered.filter((pr) => pr?.state === "CLOSED");
		}

		if (searchParams.author) {
			filtered = filtered.filter(
				(pr) => pr?.author?.login === searchParams.author,
			);
		}

		if (searchParams.label) {
			filtered = filtered.filter((pr) =>
				pr?.labels?.nodes?.some((label) => label?.name === searchParams.label),
			);
		}

		if (searchParams.search) {
			const searchLower = searchParams.search.toLowerCase();
			filtered = filtered.filter((pr) =>
				pr?.title?.toLowerCase().includes(searchLower),
			);
		}

		return filtered;
	}, [pullRequests, searchParams]);

	const uniqueAuthors = useMemo(() => {
		const authors = new Set<string>();
		pullRequests.forEach((pr) => {
			if (pr?.author?.login) {
				authors.add(pr.author.login);
			}
		});
		return Array.from(authors).sort();
	}, [pullRequests]);

	const updateFilter = (updates: Partial<PRSearchParams>) => {
		navigate({ search: { ...searchParams, ...updates } });
	};

	const clearFilters = () => {
		setLocalSearch("");
		navigate({ search: undefined });
	};

	const hasActiveFilters =
		searchParams.author ||
		searchParams.search ||
		searchParams.label ||
		searchParams.state;

	return (
		<div className="max-w-6xl mx-auto w-full pt-4">
			<div className="mb-4 flex flex-wrap items-center gap-3">
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search pull requests"
						value={localSearch}
						onChange={(e) => setLocalSearch(e.target.value)}
						className="pl-9"
					/>
				</div>

				<Select
					value={searchParams.author || "all"}
					onValueChange={(value) =>
						updateFilter({ author: value === "all" ? undefined : value })
					}
				>
					<SelectTrigger className={cn("w-[180px]")}>
						<SelectValue placeholder="Filter by author" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All authors</SelectItem>
						{uniqueAuthors.map((author) => (
							<SelectItem key={author} value={author}>
								{author}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{hasActiveFilters && (
					<Button
						variant="outline"
						size="sm"
						onClick={clearFilters}
						className={cn("gap-1")}
					>
						<X className={cn("h-3 w-3")} />
						Clear filters
					</Button>
				)}
			</div>

			{filteredPullRequests.length === 0 ? (
				<div className={cn("flex flex-1 items-center justify-center p-8")}>
					{isLoading ? (
						<div className={cn("text-center")}>
							<Loader2
								className={cn(
									"h-12 w-12 mx-auto mb-4 animate-spin text-muted-foreground",
								)}
							/>
							<p className={cn("text-muted-foreground")}>
								Loading pull requests...
							</p>
						</div>
					) : (
						<div className={cn("text-center")}>
							<Circle
								className={cn("h-12 w-12 mx-auto mb-4 text-muted-foreground")}
							/>
							<h3 className={cn("text-lg font-semibold mb-2")}>
								{hasActiveFilters
									? "No pull requests match your filters"
									: `No ${searchParams.state || "open"} pull requests`}
							</h3>
							<p className={cn("text-muted-foreground mb-4")}>
								{hasActiveFilters
									? "Try adjusting your search or filters"
									: `There are no ${searchParams.state || "open"} pull requests for this repository`}
							</p>
							{hasActiveFilters && (
								<Button onClick={clearFilters} variant="outline">
									Clear filters
								</Button>
							)}
						</div>
					)}
				</div>
			) : (
				<>
					<div className={cn("rounded-md border bg-card")}>
						<ul className={cn("divide-y")}>
							{filteredPullRequests.map((pr, index) => {
								if (!pr) return null;
								return (
									<li key={pr.number}>
										<Link
											to="/$owner/$repo/pr/$number"
											preload={index < 5 ? "viewport" : "intent"}
											params={{
												owner,
												repo,
												number: pr.number.toString(),
											}}
											className={cn(
												"block transition-colors hover:bg-accent/50 focus:bg-accent/50",
											)}
										>
											<div className={cn("px-4 py-2")}>
												<div className={cn("flex items-start gap-3")}>
													<div className={cn("pt-0.5")}>
														<PrStateIcon
															state={
																pr.isDraft && pr.state === "OPEN"
																	? "DRAFT"
																	: pr.state
															}
														/>
													</div>
													<div className="min-w-0 flex-1">
														<div className="items-start gap-2 mb-1 flex flex-col sm:flex-row sm:items-center">
															<div className="font-semibold leading-tight">
																{pr.title}
															</div>

															{pr.labels?.nodes &&
																pr.labels.nodes.length > 0 && (
																	<div className="flex flex-wrap gap-1">
																		{pr.labels.nodes
																			.slice(0, 5)
																			.map((label) => {
																				if (!label) return null;
																				return (
																					<button
																						key={label.id}
																						type="button"
																						onClick={(e) => {
																							e.preventDefault();
																							e.stopPropagation();
																							updateFilter({
																								label: label.name,
																							});
																						}}
																						className={cn(
																							"px-2 py-0.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80 cursor-pointer",
																						)}
																						style={{
																							backgroundColor: `#${label.color}`,
																							color: getLabelTextColor(
																								label.color,
																							),
																						}}
																					>
																						{label.name}
																					</button>
																				);
																			})}
																		{pr.labels.nodes.length > 5 && (
																			<span
																				className={cn(
																					"px-2 py-0.5 text-xs text-muted-foreground",
																				)}
																			>
																				+{pr.labels.nodes.length - 5} more
																			</span>
																		)}
																	</div>
																)}
														</div>
														<div
															className={cn(
																"flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground",
															)}
														>
															<span>#{pr.number}</span>
															<span>•</span>
															<span>opened {formatDate(pr.createdAt)}</span>
															{pr.author && (
																<>
																	<span>•</span>
																	<span>by {pr.author.login}</span>
																</>
															)}
															{pr.comments.totalCount > 0 && (
																<>
																	<span>•</span>
																	<span>{pr.comments.totalCount} comments</span>
																</>
															)}
														</div>
													</div>
												</div>
											</div>
										</Link>
									</li>
								);
							})}
						</ul>
					</div>

					<div
						ref={loadMoreRef}
						className={cn("mt-4 flex justify-center py-4")}
					>
						{isFetchingNextPage && (
							<div
								className={cn("flex items-center gap-2 text-muted-foreground")}
							>
								<Loader2 className={cn("h-5 w-5 animate-spin")} />
								<span>Loading more...</span>
							</div>
						)}
						{!hasNextPage && filteredPullRequests.length > 0 && (
							<p className={cn("text-sm text-muted-foreground")}>
								No more pull requests to load
							</p>
						)}
					</div>
				</>
			)}
		</div>
	);
}

function getLabelTextColor(hexColor: string) {
	const r = Number.parseInt(hexColor.substring(0, 2), 16);
	const g = Number.parseInt(hexColor.substring(2, 4), 16);
	const b = Number.parseInt(hexColor.substring(4, 6), 16);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.5 ? "#000000" : "#FFFFFF";
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
	return date.toLocaleDateString();
}
