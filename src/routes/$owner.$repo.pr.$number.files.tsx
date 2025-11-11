import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { gql } from "graphql-request";
import { FileDiff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileFilter, type FileFilters } from "@/components/FileFilter";
import { FileList } from "@/components/FileList";
import { FileTree } from "@/components/FileTree";
import { ResizableSidebar } from "@/components/ResizableSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { ViewedProgress } from "@/components/ViewedProgress";
import type {
	GetPullRequestFilesQuery,
	GetPullRequestFilesQueryVariables,
	PatchStatus,
} from "@/generated/graphql";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFileViewed } from "@/hooks/useFileViewed";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getFileExtension } from "@/lib/diffParser";
import { getGraphQLClient } from "@/lib/graphqlClient";
import { cn } from "@/lib/utils";

const getPullRequestFilesQueryOptions = (
	owner: string,
	repo: string,
	prNumber: number,
) => {
	const graphQLClient = getGraphQLClient();
	return {
		queryKey: ["pullRequestFiles", owner, repo, prNumber],
		queryFn: async ({ pageParam }: { pageParam?: string }) => {
			return graphQLClient.request<
				GetPullRequestFilesQuery,
				GetPullRequestFilesQueryVariables
			>(GET_PULL_REQUEST_FILES, {
				owner,
				name: repo,
				number: prNumber,
				after: pageParam,
			});
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage: GetPullRequestFilesQuery) => {
			const pageInfo = lastPage.repository?.pullRequest?.files?.pageInfo;
			return pageInfo?.hasNextPage ? pageInfo.endCursor : undefined;
		},
	};
};

export const Route = createFileRoute("/$owner/$repo/pr/$number/files")({
	component: PullRequestFiles,
	loader: async ({ params, context: { queryClient } }) => {
		const prNumber = Number.parseInt(params.number, 10);

		await queryClient.ensureInfiniteQueryData(
			getPullRequestFilesQueryOptions(params.owner, params.repo, prNumber),
		);
	},
});

const GET_PULL_REQUEST_FILES = gql`
	query GetPullRequestFiles($owner: String!, $name: String!, $number: Int!, $after: String) {
		repository(owner: $owner, name: $name) {
			pullRequest(number: $number) {
				id
				files(first: 100, after: $after) {
					totalCount
					pageInfo {
						hasNextPage
						endCursor
					}
					nodes {
						path
						additions
						deletions
						changeType
						viewerViewedState
					}
				}
			}
		}
	}
`;

function PullRequestFiles() {
	const { owner, repo, number } = Route.useParams();
	const prNumber = Number.parseInt(number, 10);
	const isMobile = useIsMobile();
	const [activeFileIndex, setActiveFileIndex] = useState(0);
	const [viewType, setViewType] = useState<"unified" | "split">("split");
	const [renderer, setRenderer] = useState<
		"react-diff-view" | "react-syntax-highlighter"
	>("react-diff-view");
	const [filters, setFilters] = useState<FileFilters>({
		searchText: "",
		changeTypes: new Set(),
		extensions: new Set(),
	});
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const {
		data: filesData,
		isLoading: isFilesLoading,
		error: filesError,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(getPullRequestFilesQueryOptions(owner, repo, prNumber));

	const allFiles = useMemo(() => {
		if (!filesData?.pages) return [];
		return filesData.pages.flatMap(
			(page) =>
				page.repository?.pullRequest?.files?.nodes?.filter((f) => f !== null) ||
				[],
		);
	}, [filesData]);

	const filteredFiles = useMemo(() => {
		return allFiles.filter((file) => {
			if (
				filters.searchText &&
				!file.path.toLowerCase().includes(filters.searchText.toLowerCase())
			) {
				return false;
			}

			if (
				filters.changeTypes.size > 0 &&
				!filters.changeTypes.has(file.changeType)
			) {
				return false;
			}

			if (filters.extensions.size > 0) {
				const ext = getFileExtension(file.path);
				if (!filters.extensions.has(ext)) {
					return false;
				}
			}

			return true;
		});
	}, [allFiles, filters]);

	const availableExtensions = useMemo(() => {
		const extensions = new Set<string>();
		for (const file of allFiles) {
			const ext = getFileExtension(file.path);
			if (ext) {
				extensions.add(ext);
			}
		}
		return Array.from(extensions).sort();
	}, [allFiles]);

	const changeTypeCounts = useMemo(() => {
		const counts = new Map<PatchStatus, number>();
		for (const file of allFiles) {
			counts.set(file.changeType, (counts.get(file.changeType) || 0) + 1);
		}
		return counts;
	}, [allFiles]);

	const extensionCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const file of allFiles) {
			const ext = getFileExtension(file.path);
			if (ext) {
				counts.set(ext, (counts.get(ext) || 0) + 1);
			}
		}
		return counts;
	}, [allFiles]);

	const pullRequestId =
		filesData?.pages?.[0]?.repository?.pullRequest?.id || "";
	const totalCount =
		filesData?.pages?.[0]?.repository?.pullRequest?.files?.totalCount || 0;

	const {
		toggleViewed,
		markAllAsViewed,
		markAllAsUnviewed,
		isLoading: isMutationLoading,
	} = useFileViewed(owner, repo, prNumber, pullRequestId);

	const viewedCount = useMemo(() => {
		if (!filesData?.pages) return 0;
		return filesData.pages.reduce((count, page) => {
			const pageFiles =
				page.repository?.pullRequest?.files?.nodes?.filter(
					(f) => f !== null && f.viewerViewedState === "VIEWED",
				) || [];
			return count + pageFiles.length;
		}, 0);
	}, [filesData]);

	const findNextUnviewedFile = (startIndex: number): number => {
		for (let i = startIndex + 1; i < filteredFiles.length; i++) {
			if (filteredFiles[i].viewerViewedState !== "VIEWED") {
				return i;
			}
		}
		return startIndex < filteredFiles.length - 1 ? startIndex + 1 : startIndex;
	};

	const findPreviousUnviewedFile = (startIndex: number): number => {
		for (let i = startIndex - 1; i >= 0; i--) {
			if (filteredFiles[i].viewerViewedState !== "VIEWED") {
				return i;
			}
		}
		return startIndex > 0 ? startIndex - 1 : startIndex;
	};

	const handleNext = () => {
		if (activeFileIndex < filteredFiles.length - 1) {
			const nextIndex = findNextUnviewedFile(activeFileIndex);
			setActiveFileIndex(nextIndex);
		}
	};

	const handlePrevious = () => {
		if (activeFileIndex > 0) {
			const prevIndex = findPreviousUnviewedFile(activeFileIndex);
			setActiveFileIndex(prevIndex);
		}
	};

	const handleFileViewedChange = (fileIndex: number) => {
		if (fileIndex === activeFileIndex) {
			const nextIndex = findNextUnviewedFile(fileIndex);
			if (nextIndex !== fileIndex) {
				setActiveFileIndex(nextIndex);
			}
		}
	};

	const handleToggleViewed = () => {
		const currentFile = filteredFiles[activeFileIndex];
		if (currentFile) {
			toggleViewed(currentFile.path, currentFile.viewerViewedState);
		}
	};

	const handleToggleExpand = () => {
		const fileElement = document.getElementById(
			`file-${filteredFiles[activeFileIndex]?.path}`,
		);
		if (fileElement) {
			const button = fileElement.querySelector("button");
			button?.click();
		}
	};

	const handleFileSelectFromTree = (path: string) => {
		const index = filteredFiles.findIndex((f) => f.path === path);
		if (index !== -1) {
			setActiveFileIndex(index);
			const fileElement = document.getElementById(`file-${path}`);
			if (fileElement) {
				fileElement.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}
	};

	useKeyboardShortcuts({
		onNext: handleNext,
		onPrevious: handlePrevious,
		onToggleViewed: handleToggleViewed,
		onToggleExpand: handleToggleExpand,
	});

	useEffect(() => {
		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return;

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
			const scrollThreshold = 200;

			if (
				scrollHeight - scrollTop - clientHeight < scrollThreshold &&
				hasNextPage &&
				!isFetchingNextPage
			) {
				fetchNextPage();
			}
		};

		scrollContainer.addEventListener("scroll", handleScroll);
		return () => scrollContainer.removeEventListener("scroll", handleScroll);
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const handleMarkAllAsViewed = () => {
		const unviewedPaths = allFiles
			.filter((f) => f.viewerViewedState !== "VIEWED")
			.map((f) => f.path);
		markAllAsViewed(unviewedPaths);
	};

	const handleMarkAllAsUnviewed = () => {
		const viewedPaths = allFiles
			.filter((f) => f.viewerViewedState === "VIEWED")
			.map((f) => f.path);
		markAllAsUnviewed(viewedPaths);
	};

	if (isFilesLoading) {
		return (
			<Card>
				<CardContent
					className={cn("flex min-h-[400px] items-center justify-center")}
				>
					<div className={cn("text-center")}>
						<div
							className={cn(
								"mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary",
							)}
						/>
						<p className={cn("text-sm text-muted-foreground")}>
							Loading files...
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (filesError) {
		return (
			<Card className={cn("border-destructive")}>
				<CardContent className={cn("pt-6")}>
					<p className={cn("text-sm text-destructive")}>Failed to load files</p>
				</CardContent>
			</Card>
		);
	}

	if (allFiles.length === 0) {
		return (
			<Card>
				<CardContent
					className={cn(
						"flex min-h-[400px] flex-col items-center justify-center",
					)}
				>
					<FileDiff className={cn("mb-3 h-12 w-12 text-muted-foreground")} />
					<p className={cn("text-muted-foreground")}>No files changed</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className={cn("flex flex-1 mx-auto w-[calc(100%-300px)]")}>
			{!isMobile && (
				<ResizableSidebar defaultWidth={300} minWidth={200} maxWidth={600}>
					<FileFilter
						totalCount={allFiles.length}
						filteredCount={filteredFiles.length}
						onFilterChange={setFilters}
						availableExtensions={availableExtensions}
						changeTypeCounts={changeTypeCounts}
						extensionCounts={extensionCounts}
					/>
					<FileTree
						files={filteredFiles}
						activeFilePath={filteredFiles[activeFileIndex]?.path}
						onFileSelect={handleFileSelectFromTree}
						onViewedToggle={toggleViewed}
					/>
				</ResizableSidebar>
			)}

			<div className={cn("flex flex-1 flex-col overflow-hidden")}>
				<ViewedProgress
					viewedCount={viewedCount}
					totalCount={totalCount}
					onMarkAllAsViewed={handleMarkAllAsViewed}
					onMarkAllAsUnviewed={handleMarkAllAsUnviewed}
					isLoading={isMutationLoading}
					viewType={viewType}
					onViewTypeChange={setViewType}
					renderer={renderer}
					onRendererToggle={() =>
						setRenderer((prev) =>
							prev === "react-diff-view"
								? "react-syntax-highlighter"
								: "react-diff-view",
						)
					}
				/>

				<div ref={scrollContainerRef} className={cn("flex-1")}>
					{filteredFiles.length === 0 ? (
						<div
							className={cn("flex min-h-[400px] items-center justify-center")}
						>
							<p className={cn("text-muted-foreground")}>
								No files match the current filters
							</p>
						</div>
					) : (
						<>
							<FileList
								files={filteredFiles}
								owner={owner}
								repo={repo}
								prNumber={prNumber}
								onViewedToggle={toggleViewed}
								activeFileIndex={activeFileIndex}
								onFileSelect={setActiveFileIndex}
								viewType={viewType}
								renderer={renderer}
								onFileViewedChange={handleFileViewedChange}
							/>
							{isFetchingNextPage && (
								<div className={cn("flex items-center justify-center py-8")}>
									<div className={cn("text-center")}>
										<div
											className={cn(
												"mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-b-2 border-primary",
											)}
										/>
										<p className={cn("text-xs text-muted-foreground")}>
											Loading more files...
										</p>
									</div>
								</div>
							)}
							{!hasNextPage && allFiles.length > 0 && (
								<div className={cn("flex items-center justify-center py-8")}>
									<p className={cn("text-xs text-muted-foreground")}>
										All {totalCount} files loaded
									</p>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
