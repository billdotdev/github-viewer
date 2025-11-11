import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface ResizableSidebarProps {
	children: ReactNode;
	defaultWidth?: number;
	minWidth?: number;
	maxWidth?: number;
	storageKey?: string;
}

export function ResizableSidebar({
	children,
	defaultWidth = 300,
	minWidth = 200,
	maxWidth = 600,
	storageKey = "sidebar-width",
}: ResizableSidebarProps) {
	const [width, setWidth] = useState(() => {
		const stored = localStorage.getItem(storageKey);
		return stored ? Number.parseInt(stored, 10) : defaultWidth;
	});

	const [isCollapsed, setIsCollapsed] = useState(() => {
		const stored = localStorage.getItem(`${storageKey}-collapsed`);
		return stored === "true";
	});

	const [isResizing, setIsResizing] = useState(false);
	const sidebarRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		localStorage.setItem(storageKey, width.toString());
	}, [width, storageKey]);

	useEffect(() => {
		localStorage.setItem(`${storageKey}-collapsed`, isCollapsed.toString());
	}, [isCollapsed, storageKey]);

	useEffect(() => {
		if (!isResizing) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (!sidebarRef.current) return;

			const newWidth = e.clientX;
			if (newWidth >= minWidth && newWidth <= maxWidth) {
				setWidth(newWidth);
			}
		};

		const handleMouseUp = () => {
			setIsResizing(false);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isResizing, minWidth, maxWidth]);

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsResizing(true);
	};

	const toggleCollapse = () => {
		setIsCollapsed(!isCollapsed);
	};

	if (isCollapsed) {
		return (
			<div className={cn("relative flex h-full flex-col border-r bg-card")}>
				<div className={cn("flex items-center justify-center border-b p-2")}>
					<Button
						variant="ghost"
						size="sm"
						onClick={toggleCollapse}
						className={cn("h-8 w-8 p-0")}
					>
						<ChevronRight className={cn("h-4 w-4")} />
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={sidebarRef}
			className={cn("relative flex h-full flex-col border-r bg-card")}
			style={{ width: `${width}px`, minWidth: `${width}px` }}
		>
			<div className={cn("flex items-center justify-between border-b p-2")}>
				<span className={cn("px-2 text-sm font-semibold")}>Files</span>
				<Button
					variant="ghost"
					size="sm"
					onClick={toggleCollapse}
					className={cn("h-8 w-8 p-0")}
				>
					<ChevronLeft className={cn("h-4 w-4")} />
				</Button>
			</div>

			<div className={cn("flex-1 overflow-y-auto")}>{children}</div>

			<button
				type="button"
				onMouseDown={handleMouseDown}
				className={cn(
					"absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary",
					isResizing ? "bg-primary" : "",
				)}
				style={{ touchAction: "none" }}
				aria-label="Resize sidebar"
			/>
		</div>
	);
}
