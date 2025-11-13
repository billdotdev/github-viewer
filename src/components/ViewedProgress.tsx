import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

interface ViewedProgressProps {
	viewedCount: number;
	totalCount: number;
	onMarkAllAsViewed: () => void;
	onMarkAllAsUnviewed: () => void;
	isLoading?: boolean;
	viewType: "unified" | "split";
	onViewTypeChange: (type: "unified" | "split") => void;
	renderer: "react-diff-view" | "react-syntax-highlighter";
	onRendererToggle: () => void;
}

export function ViewedProgress({
	viewedCount,
	totalCount,
	onMarkAllAsViewed,
	onMarkAllAsUnviewed,
	isLoading = false,
	viewType,
	onViewTypeChange,
	renderer,
	onRendererToggle,
}: ViewedProgressProps) {
	const percentage = totalCount > 0 ? (viewedCount / totalCount) * 100 : 0;
	const allViewed = viewedCount === totalCount && totalCount > 0;

	return (
		<div className="sticky top-0 z-10 border-b bg-card">
			<div className="flex items-center justify-between gap-4 px-4 py-2.5">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium whitespace-nowrap">
								{viewedCount} / {totalCount}
							</span>
							{allViewed && (
								<CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
							)}
						</div>
						<Progress value={percentage} className="h-1 w-24 opacity-60" />
					</div>

					<div className="flex items-center gap-2">
						{!allViewed && totalCount > 0 && (
							<Button
								variant="outline"
								size="sm"
								onClick={onMarkAllAsViewed}
								disabled={isLoading}
								className="h-7 text-xs"
							>
								Mark all viewed
							</Button>
						)}
						{viewedCount > 0 && (
							<Button
								variant="outline"
								size="sm"
								onClick={onMarkAllAsUnviewed}
								disabled={isLoading}
								className="h-7 text-xs"
							>
								Mark all unviewed
							</Button>
						)}
					</div>

					<div className="flex items-center gap-3 border-l pl-4">
						<div className="flex gap-1">
							<Button
								variant={viewType === "unified" ? "default" : "outline"}
								size="sm"
								onClick={() => onViewTypeChange("unified")}
								className="h-7 text-xs"
							>
								Unified
							</Button>
							<Button
								variant={viewType === "split" ? "default" : "outline"}
								size="sm"
								onClick={() => onViewTypeChange("split")}
								className="h-7 text-xs"
							>
								Split
							</Button>
						</div>

						<button
							type="button"
							onClick={onRendererToggle}
							className={cn(
								"text-xs text-muted-foreground underline hover:text-foreground whitespace-nowrap",
							)}
						>
							{renderer === "react-diff-view"
								? "Diff View"
								: "Syntax Highlighter"}
						</button>
					</div>
				</div>

				<p className="text-xs text-muted-foreground whitespace-nowrap">
					<kbd className="rounded bg-muted px-1.5 py-0.5">j</kbd> /{" "}
					<kbd className="rounded bg-muted px-1.5 py-0.5">k</kbd> navigate,{" "}
					<kbd className="rounded bg-muted px-1.5 py-0.5">v</kbd> viewed,{" "}
					<kbd className="rounded bg-muted px-1.5 py-0.5">x</kbd> expand
				</p>
			</div>
		</div>
	);
}
