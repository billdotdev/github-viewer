import type { FileViewedState, PatchStatus } from "../generated/graphql";
import { FileItem } from "./FileItem";

export interface FileData {
	path: string;
	additions: number;
	deletions: number;
	changeType: PatchStatus;
	viewerViewedState: FileViewedState;
}

interface FileListProps {
	files: FileData[];
	owner: string;
	repo: string;
	prNumber: number;
	onViewedToggle: (path: string, currentState: FileViewedState) => void;
	activeFileIndex: number;
	onFileSelect: (index: number) => void;
	viewType: "unified" | "split";
	renderer: "react-diff-view" | "react-syntax-highlighter";
	onFileViewedChange?: (fileIndex: number) => void;
}

export function FileList({
	files,
	owner,
	repo,
	prNumber,
	onViewedToggle,
	activeFileIndex,
	onFileSelect,
	viewType,
	renderer,
	onFileViewedChange,
}: FileListProps) {
	if (files.length === 0) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<p className="text-muted-foreground">No files changed</p>
			</div>
		);
	}

	return (
		<div className="space-y-4 p-4">
			{files.map((file, index) => (
				<FileItem
					key={file.path}
					path={file.path}
					additions={file.additions}
					deletions={file.deletions}
					changeType={file.changeType}
					viewerViewedState={file.viewerViewedState}
					owner={owner}
					repo={repo}
					prNumber={prNumber}
					onViewedToggle={onViewedToggle}
					isActive={index === activeFileIndex}
					onFocus={() => onFileSelect(index)}
					viewType={viewType}
					renderer={renderer}
					onViewedChange={() => onFileViewedChange?.(index)}
				/>
			))}
		</div>
	);
}
