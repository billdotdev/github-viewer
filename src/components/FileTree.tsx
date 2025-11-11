import {
	ChevronDown,
	ChevronRight,
	FileIcon,
	FilePlus,
	FileX,
	FolderIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { FileViewedState, PatchStatus } from "../generated/graphql";
import { Checkbox } from "./ui/checkbox";

interface FileNode {
	name: string;
	path: string;
	type: "file";
	additions: number;
	deletions: number;
	changeType: PatchStatus;
	viewerViewedState: FileViewedState;
}

interface FolderNode {
	name: string;
	path: string;
	type: "folder";
	children: TreeNode[];
}

type TreeNode = FileNode | FolderNode;

interface FileTreeProps {
	files: Array<{
		path: string;
		additions: number;
		deletions: number;
		changeType: PatchStatus;
		viewerViewedState: FileViewedState;
	}>;
	activeFilePath?: string;
	onFileSelect: (path: string) => void;
	onViewedToggle: (path: string, currentState: FileViewedState) => void;
}

export function FileTree({
	files,
	activeFilePath,
	onFileSelect,
	onViewedToggle,
}: FileTreeProps) {
	const tree = buildFileTree(files);

	return (
		<div className={cn("space-y-1 py-2")}>
			{tree.map((node) => (
				<TreeNodeComponent
					key={node.path}
					node={node}
					activeFilePath={activeFilePath}
					onFileSelect={onFileSelect}
					onViewedToggle={onViewedToggle}
					depth={0}
				/>
			))}
		</div>
	);
}

function buildFileTree(
	files: Array<{
		path: string;
		additions: number;
		deletions: number;
		changeType: PatchStatus;
		viewerViewedState: FileViewedState;
	}>,
): TreeNode[] {
	const root: FolderNode = {
		name: "",
		path: "",
		type: "folder",
		children: [],
	};

	for (const file of files) {
		const parts = file.path.split("/");
		let currentFolder = root;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			const isLastPart = i === parts.length - 1;
			const currentPath = parts.slice(0, i + 1).join("/");

			if (isLastPart) {
				currentFolder.children.push({
					name: part,
					path: file.path,
					type: "file",
					additions: file.additions,
					deletions: file.deletions,
					changeType: file.changeType,
					viewerViewedState: file.viewerViewedState,
				});
			} else {
				let folder = currentFolder.children.find(
					(child) => child.type === "folder" && child.name === part,
				) as FolderNode | undefined;

				if (!folder) {
					folder = {
						name: part,
						path: currentPath,
						type: "folder",
						children: [],
					};
					currentFolder.children.push(folder);
				}

				currentFolder = folder;
			}
		}
	}

	const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
		nodes.sort((a, b) => {
			if (a.type === "folder" && b.type === "file") return -1;
			if (a.type === "file" && b.type === "folder") return 1;
			return a.name.localeCompare(b.name);
		});

		for (const node of nodes) {
			if (node.type === "folder") {
				sortNodes(node.children);
			}
		}

		return nodes;
	};

	return sortNodes(root.children);
}

interface TreeNodeComponentProps {
	node: TreeNode;
	activeFilePath?: string;
	onFileSelect: (path: string) => void;
	onViewedToggle: (path: string, currentState: FileViewedState) => void;
	depth: number;
}

function TreeNodeComponent({
	node,
	activeFilePath,
	onFileSelect,
	onViewedToggle,
	depth,
}: TreeNodeComponentProps) {
	const [isExpanded, setIsExpanded] = useState(true);

	if (node.type === "folder") {
		return (
			<div>
				<button
					type="button"
					onClick={() => setIsExpanded(!isExpanded)}
					className={cn(
						"flex w-full items-center gap-1 rounded px-2 py-1 text-sm hover:bg-muted",
					)}
					style={{ paddingLeft: `${depth * 12 + 8}px` }}
				>
					{isExpanded ? (
						<ChevronDown className={cn("h-3 w-3 shrink-0")} />
					) : (
						<ChevronRight className={cn("h-3 w-3 shrink-0")} />
					)}
					<FolderIcon
						className={cn("h-4 w-4 shrink-0 text-muted-foreground")}
					/>
					<span className={cn("truncate")}>{node.name}</span>
				</button>
				{isExpanded && (
					<div>
						{node.children.map((child) => (
							<TreeNodeComponent
								key={child.path}
								node={child}
								activeFilePath={activeFilePath}
								onFileSelect={onFileSelect}
								onViewedToggle={onViewedToggle}
								depth={depth + 1}
							/>
						))}
					</div>
				)}
			</div>
		);
	}

	const isActive = node.path === activeFilePath;
	const isViewed = node.viewerViewedState === "VIEWED";

	const getStatusIcon = () => {
		switch (node.changeType) {
			case "ADDED":
				return <FilePlus className={cn("h-4 w-4 shrink-0 text-green-600")} />;
			case "DELETED":
				return <FileX className={cn("h-4 w-4 shrink-0 text-red-600")} />;
			case "RENAMED":
				return <FileIcon className={cn("h-4 w-4 shrink-0 text-blue-600")} />;
			default:
				return (
					<FileIcon className={cn("h-4 w-4 shrink-0 text-muted-foreground")} />
				);
		}
	};

	return (
		<div
			className={cn(
				"flex w-full items-center gap-1 rounded px-2 py-1 text-sm",
				isActive ? "bg-muted/50" : "hover:bg-muted",
				isViewed ? "opacity-60" : "",
			)}
			style={{ paddingLeft: `${depth * 12 + 20}px` }}
		>
			<div className={cn("shrink-0")}>
				<Checkbox
					checked={isViewed}
					onCheckedChange={() =>
						onViewedToggle(node.path, node.viewerViewedState)
					}
					onClick={(e) => e.stopPropagation()}
					className={cn("h-3 w-3")}
					aria-label={`Mark ${node.name} as viewed`}
				/>
			</div>
			<button
				type="button"
				onClick={() => onFileSelect(node.path)}
				className={cn(
					"flex flex-1 items-center gap-1 bg-transparent border-0 p-0 cursor-pointer text-left min-w-0",
				)}
			>
				{getStatusIcon()}
				<span className={cn("flex-1 truncate text-left")}>{node.name}</span>
				<div className={cn("flex shrink-0 items-center gap-1 text-xs")}>
					{node.additions > 0 && (
						<span className={cn("text-green-600")}>+{node.additions}</span>
					)}
					{node.deletions > 0 && (
						<span className={cn("text-red-600")}>-{node.deletions}</span>
					)}
				</div>
			</button>
		</div>
	);
}
