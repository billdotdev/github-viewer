import {
	ChevronDown,
	ChevronRight,
	Copy,
	Expand,
	FileIcon,
	FilePlus,
	FileX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
	oneDark,
	oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import type { FileViewedState, PatchStatus } from "../generated/graphql";
import { useDiffData } from "../hooks/useDiffData";
import { useSystemTheme } from "../hooks/useSystemTheme";
import { getFileExtension, getLanguageFromExtension } from "../lib/diffParser";
import { githubRestClient } from "../lib/githubRestClient";
import { cn } from "../lib/utils";
import { DiffViewer } from "./DiffViewer";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface FileItemProps {
	path: string;
	additions: number;
	deletions: number;
	changeType: PatchStatus;
	viewerViewedState: FileViewedState;
	owner: string;
	repo: string;
	prNumber: number;
	onViewedToggle: (path: string, currentState: FileViewedState) => void;
	isActive?: boolean;
	onFocus?: () => void;
	viewType: "unified" | "split";
	renderer: "react-diff-view" | "react-syntax-highlighter";
	onViewedChange?: (wasViewed: boolean) => void;
}

export function FileItem({
	path,
	additions,
	deletions,
	changeType,
	viewerViewedState,
	owner,
	repo,
	prNumber,
	onViewedToggle,
	isActive = false,
	onFocus,
	viewType,
	renderer,
	onViewedChange,
}: FileItemProps) {
	const isViewed = viewerViewedState === "VIEWED";
	const [isExpanded, setIsExpanded] = useState(!isViewed);
	const [shouldFlash, setShouldFlash] = useState(false);
	const [showFullFile, setShowFullFile] = useState(false);
	const [fullFileContent, setFullFileContent] = useState<string | null>(null);
	const [isLoadingFullFile, setIsLoadingFullFile] = useState(false);
	const fileRef = useRef<HTMLDivElement>(null);
	const prevActiveRef = useRef(isActive);
	const prevViewedRef = useRef(isViewed);
	const { theme } = useSystemTheme();

	const { data: diffData, isLoading: isDiffLoading } = useDiffData(
		owner,
		repo,
		prNumber,
		path,
		isExpanded,
	);

	useEffect(() => {
		if (isActive && fileRef.current) {
			fileRef.current.scrollIntoView({ behavior: "smooth", block: "start" });

			if (!prevActiveRef.current && isActive) {
				setShouldFlash(true);
				const timer = setTimeout(() => setShouldFlash(false), 600);
				return () => clearTimeout(timer);
			}
		}
		prevActiveRef.current = isActive;
	}, [isActive]);

	useEffect(() => {
		const hash = window.location.hash.slice(1);
		if (hash && decodeURIComponent(hash) === path) {
			setIsExpanded(true);
			setTimeout(() => {
				fileRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
			}, 100);
		}
	}, [path]);

	useEffect(() => {
		if (!prevViewedRef.current && isViewed) {
			setIsExpanded(false);
			onViewedChange?.(true);
		}
		prevViewedRef.current = isViewed;
	}, [isViewed, onViewedChange]);

	const handleCopyPath = async () => {
		try {
			await navigator.clipboard.writeText(path);
			toast.success("Path copied to clipboard");
		} catch {
			const textArea = document.createElement("textarea");
			textArea.value = path;
			textArea.style.position = "fixed";
			textArea.style.left = "-999999px";
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand("copy");
				toast.success("Path copied to clipboard");
			} catch {
				toast.error("Failed to copy path");
			}
			document.body.removeChild(textArea);
		}
	};

	const handleToggleExpand = () => {
		const newExpanded = !isExpanded;
		setIsExpanded(newExpanded);
		if (newExpanded) {
			window.location.hash = encodeURIComponent(path);
		} else {
			if (window.location.hash.slice(1) === encodeURIComponent(path)) {
				history.replaceState(null, "", window.location.pathname);
			}
		}
	};

	const handleShowFullFile = async () => {
		if (fullFileContent) {
			setShowFullFile(true);
			return;
		}

		setIsLoadingFullFile(true);
		try {
			const content = await githubRestClient.getFileContent(
				owner,
				repo,
				"HEAD",
				path,
			);
			setFullFileContent(content);
			setShowFullFile(true);
		} catch (error) {
			toast.error("Failed to load full file", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsLoadingFullFile(false);
		}
	};

	const getStatusIcon = () => {
		switch (changeType) {
			case "ADDED":
				return <FilePlus className="h-4 w-4 text-green-600" />;
			case "DELETED":
				return <FileX className="h-4 w-4 text-red-600" />;
			case "RENAMED":
				return <FileIcon className="h-4 w-4 text-blue-600" />;
			default:
				return <FileIcon className="h-4 w-4 text-muted-foreground" />;
		}
	};

	const getStatusBadge = () => {
		switch (changeType) {
			case "ADDED":
				return (
					<Badge variant="outline" className="border-green-600 text-green-600">
						Added
					</Badge>
				);
			case "DELETED":
				return (
					<Badge variant="outline" className="border-red-600 text-red-600">
						Deleted
					</Badge>
				);
			case "RENAMED":
				return (
					<Badge variant="outline" className="border-blue-600 text-blue-600">
						Renamed
					</Badge>
				);
			case "MODIFIED":
				return (
					<Badge variant="outline" className="text-muted-foreground">
						Modified
					</Badge>
				);
			default:
				return null;
		}
	};

	const isBinary = diffData?.file.isBinary || false;
	const isRenamed = changeType === "RENAMED";
	const oldPath =
		isRenamed && diffData?.file.oldPath ? diffData.file.oldPath : null;
	const fileExtension = getFileExtension(path);
	const language = getLanguageFromExtension(fileExtension);
	const isDark = theme === "dark";

	return (
		<Card
			ref={fileRef}
			id={`file-${path}`}
			className={`overflow-hidden transition-all py-0 scroll-mt-16 ${
				isActive ? "ring-1 ring-primary/40" : ""
			} ${shouldFlash ? "animate-flash" : ""}`}
		>
			<div
				className={`sticky top-0 z-10 border-b bg-card px-4 py-3 ${
					isActive ? "bg-accent" : ""
				}`}
			>
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							handleToggleExpand();
						}}
						className="h-6 w-6 p-0 shrink-0"
					>
						{isExpanded ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
					</Button>

					<div className="shrink-0">
						<Checkbox
							checked={isViewed}
							onCheckedChange={() => {
								onViewedToggle(path, viewerViewedState);
							}}
							onClick={(e) => e.stopPropagation()}
							className="h-4 w-4"
							aria-label={`Mark ${path} as viewed`}
						/>
					</div>

					<button
						type="button"
						className={cn(
							"flex flex-1 items-center gap-2 cursor-pointer bg-transparent border-0 p-0 text-left min-w-0 hover:opacity-80 transition-opacity",
						)}
						onClick={onFocus}
					>
						{getStatusIcon()}
						<div className="flex-1 flex items-center min-w-0">
							{isRenamed && oldPath ? (
								<div className="text-sm">
									<span className="text-muted-foreground line-through">
										{oldPath}
									</span>
									<span className="mx-2">→</span>
									<span className="font-mono">{path}</span>
								</div>
							) : (
								<span className="font-mono text-xs">{path}</span>
							)}
						</div>
					</button>

					{getStatusBadge()}

					<div className="flex items-center gap-3 text-xs shrink-0">
						{additions > 0 && (
							<span className="text-green-600">+{additions}</span>
						)}
						{deletions > 0 && (
							<span className="text-red-600">-{deletions}</span>
						)}
					</div>

					<Button
						variant="ghost"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							handleShowFullFile();
						}}
						className="h-6 w-6 p-0 shrink-0"
						disabled={isLoadingFullFile || changeType === "DELETED"}
						title="View full file"
					>
						<Expand className="h-3 w-3" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							handleCopyPath();
						}}
						className="h-6 w-6 p-0 shrink-0"
					>
						<Copy className="h-3 w-3" />
					</Button>
				</div>
			</div>

			{isExpanded && (
				<div className="bg-background">
					{isDiffLoading ? (
						<div className="flex items-center justify-center py-8">
							<div className="text-center">
								<div
									className={cn(
										"mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary",
									)}
								/>
								<p className="text-sm text-muted-foreground">Loading diff...</p>
							</div>
						</div>
					) : diffData ? (
						<>
							{isBinary && (
								<div className="border-t bg-muted/30 px-4 py-8 text-center">
									<p className="text-sm text-muted-foreground">
										Binary file not shown
									</p>
								</div>
							)}
							{!isBinary && diffData.file.hunks.length === 0 && (
								<div className="border-t bg-muted/30 px-4 py-8 text-center">
									<p className="text-sm text-muted-foreground">
										Empty file or no changes to display
									</p>
								</div>
							)}
							{!isBinary && diffData.file.hunks.length > 0 && (
								<DiffViewer
									file={diffData.file}
									diffText={diffData.diffText}
									viewType={viewType}
									renderer={renderer}
								/>
							)}
						</>
					) : (
						<div className="border-t px-4 py-8 text-center">
							<p className="text-sm text-destructive">Failed to load diff</p>
						</div>
					)}
				</div>
			)}

			<Dialog open={showFullFile} onOpenChange={setShowFullFile}>
				<DialogContent
					className={cn(
						"max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col",
					)}
				>
					<DialogHeader>
						<DialogTitle className="font-mono text-sm">{path}</DialogTitle>
					</DialogHeader>
					<div className="flex-1 overflow-auto">
						{fullFileContent && (
							<SyntaxHighlighter
								language={language}
								style={isDark ? oneDark : oneLight}
								showLineNumbers
								customStyle={{
									margin: 0,
									borderRadius: "0.375rem",
									fontSize: "0.875rem",
								}}
							>
								{fullFileContent}
							</SyntaxHighlighter>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
