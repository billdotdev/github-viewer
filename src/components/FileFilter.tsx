import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PatchStatus } from "../generated/graphql";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

interface FileFilterProps {
	totalCount: number;
	filteredCount: number;
	onFilterChange: (filters: FileFilters) => void;
	availableExtensions: string[];
	changeTypeCounts: Map<PatchStatus, number>;
	extensionCounts: Map<string, number>;
}

export interface FileFilters {
	searchText: string;
	changeTypes: Set<PatchStatus>;
	extensions: Set<string>;
}

export function FileFilter({
	totalCount,
	filteredCount,
	onFilterChange,
	availableExtensions,
	changeTypeCounts,
	extensionCounts,
}: FileFilterProps) {
	const [searchText, setSearchText] = useState("");
	const [changeTypes, setChangeTypes] = useState<Set<PatchStatus>>(new Set());
	const [extensions, setExtensions] = useState<Set<string>>(new Set());
	const [showChangeTypes, setShowChangeTypes] = useState(false);
	const [showExtensions, setShowExtensions] = useState(false);
	const changeTypesRef = useRef<HTMLDivElement>(null);
	const extensionsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				changeTypesRef.current &&
				!changeTypesRef.current.contains(event.target as Node)
			) {
				setShowChangeTypes(false);
			}
			if (
				extensionsRef.current &&
				!extensionsRef.current.contains(event.target as Node)
			) {
				setShowExtensions(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const updateFilters = (
		newSearchText: string,
		newChangeTypes: Set<PatchStatus>,
		newExtensions: Set<string>,
	) => {
		setSearchText(newSearchText);
		setChangeTypes(newChangeTypes);
		setExtensions(newExtensions);
		onFilterChange({
			searchText: newSearchText,
			changeTypes: newChangeTypes,
			extensions: newExtensions,
		});
	};

	const handleSearchChange = (value: string) => {
		updateFilters(value, changeTypes, extensions);
	};

	const toggleChangeType = (type: PatchStatus) => {
		const newTypes = new Set(changeTypes);
		if (newTypes.has(type)) {
			newTypes.delete(type);
		} else {
			newTypes.add(type);
		}
		updateFilters(searchText, newTypes, extensions);
	};

	const toggleExtension = (ext: string) => {
		const newExts = new Set(extensions);
		if (newExts.has(ext)) {
			newExts.delete(ext);
		} else {
			newExts.add(ext);
		}
		updateFilters(searchText, changeTypes, newExts);
	};

	const clearFilters = () => {
		updateFilters("", new Set(), new Set());
	};

	const hasActiveFilters =
		searchText !== "" || changeTypes.size > 0 || extensions.size > 0;

	const changeTypeOptions: Array<{ value: PatchStatus; label: string }> = [
		{ value: "ADDED" as PatchStatus, label: "Added" },
		{ value: "MODIFIED" as PatchStatus, label: "Modified" },
		{ value: "DELETED" as PatchStatus, label: "Deleted" },
		{ value: "RENAMED" as PatchStatus, label: "Renamed" },
	];

	return (
		<div className={cn("space-y-2 border-b p-3")}>
			<div className={cn("relative")}>
				<Search
					className={cn(
						"absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
					)}
				/>
				<input
					type="text"
					placeholder="Filter files..."
					value={searchText}
					onChange={(e) => handleSearchChange(e.target.value)}
					className={cn(
						"w-full rounded-md border bg-background px-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary",
					)}
				/>
				{searchText && (
					<button
						type="button"
						onClick={() => handleSearchChange("")}
						className={cn(
							"absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
						)}
					>
						<X className={cn("h-4 w-4")} />
					</button>
				)}
			</div>

			<div className={cn("flex flex-wrap gap-2")}>
				<div className={cn("relative")} ref={changeTypesRef}>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowChangeTypes(!showChangeTypes)}
						className={cn("h-7 text-xs")}
					>
						Change Type
						{changeTypes.size > 0 && (
							<span
								className={cn(
									"ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground",
								)}
							>
								{changeTypes.size}
							</span>
						)}
					</Button>
					{showChangeTypes && (
						<div
							className={cn(
								"absolute left-0 top-full z-10 mt-1 w-48 rounded-md border bg-popover p-2 shadow-lg",
							)}
						>
							<div className={cn("space-y-2")}>
								{changeTypeOptions.map((option) => {
									const count = changeTypeCounts.get(option.value) || 0;
									return (
										<div
											key={option.value}
											className={cn(
												"flex items-center gap-2 text-sm hover:bg-muted rounded px-2 py-1",
											)}
										>
											<Checkbox
												checked={changeTypes.has(option.value)}
												onCheckedChange={() => toggleChangeType(option.value)}
												id={`change-type-${option.value}`}
											/>
											<label
												htmlFor={`change-type-${option.value}`}
												className={cn("flex-1 cursor-pointer")}
											>
												{option.label} ({count})
											</label>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>

				<div className={cn("relative")} ref={extensionsRef}>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowExtensions(!showExtensions)}
						className={cn("h-7 text-xs")}
					>
						File Type
						{extensions.size > 0 && (
							<span
								className={cn(
									"ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground",
								)}
							>
								{extensions.size}
							</span>
						)}
					</Button>
					{showExtensions && availableExtensions.length > 0 && (
						<div
							className={cn(
								"absolute left-0 top-full z-10 mt-1 max-h-64 w-48 overflow-y-auto rounded-md border bg-popover p-2 shadow-lg",
							)}
						>
							<div className={cn("space-y-2")}>
								{availableExtensions.map((ext) => {
									const count = extensionCounts.get(ext) || 0;
									return (
										<div
											key={ext}
											className={cn(
												"flex items-center gap-2 text-sm hover:bg-muted rounded px-2 py-1",
											)}
										>
											<Checkbox
												checked={extensions.has(ext)}
												onCheckedChange={() => toggleExtension(ext)}
												id={`ext-${ext}`}
											/>
											<label
												htmlFor={`ext-${ext}`}
												className={cn("flex-1 cursor-pointer font-mono")}
											>
												.{ext} ({count})
											</label>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>

				{hasActiveFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearFilters}
						className={cn("h-7 text-xs")}
					>
						<X className={cn("mr-1 h-3 w-3")} />
						Clear
					</Button>
				)}
			</div>

			<div className={cn("text-xs text-muted-foreground")}>
				{filteredCount === totalCount ? (
					<span>{totalCount} files</span>
				) : (
					<span>
						{filteredCount} of {totalCount} files
					</span>
				)}
			</div>
		</div>
	);
}
