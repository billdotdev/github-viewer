export interface ParsedDiffFile {
	oldPath: string | null;
	newPath: string | null;
	oldRevision: string;
	newRevision: string;
	type: "add" | "delete" | "modify" | "rename" | "copy";
	hunks: DiffHunk[];
	isBinary: boolean;
}

export interface DiffHunk {
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
	lines: DiffLine[];
	header: string;
}

export interface DiffLine {
	type: "add" | "delete" | "normal" | "context";
	content: string;
	oldLineNumber: number | null;
	newLineNumber: number | null;
}

export function parseDiff(diffText: string): ParsedDiffFile[] {
	const files: ParsedDiffFile[] = [];
	const lines = diffText.split("\n");
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		if (line.startsWith("diff --git")) {
			const file = parseFile(lines, i);
			files.push(file.file);
			i = file.nextIndex;
		} else {
			i++;
		}
	}

	return files;
}

function parseFile(
	lines: string[],
	startIndex: number,
): { file: ParsedDiffFile; nextIndex: number } {
	let i = startIndex;
	const diffLine = lines[i];

	const match = diffLine.match(/^diff --git a\/(.+) b\/(.+)$/);
	if (!match) {
		throw new Error(`Invalid diff header: ${diffLine}`);
	}

	const oldPath = match[1];
	const newPath = match[2];

	const file: ParsedDiffFile = {
		oldPath,
		newPath,
		oldRevision: "",
		newRevision: "",
		type: "modify",
		hunks: [],
		isBinary: false,
	};

	i++;

	while (i < lines.length && !lines[i].startsWith("diff --git")) {
		const line = lines[i];

		if (line.startsWith("new file mode")) {
			file.type = "add";
			file.oldPath = null;
		} else if (line.startsWith("deleted file mode")) {
			file.type = "delete";
			file.newPath = null;
		} else if (line.startsWith("rename from")) {
			file.type = "rename";
			file.oldPath = line.substring("rename from ".length);
		} else if (line.startsWith("rename to")) {
			file.newPath = line.substring("rename to ".length);
		} else if (line.startsWith("copy from")) {
			file.type = "copy";
			file.oldPath = line.substring("copy from ".length);
		} else if (line.startsWith("copy to")) {
			file.newPath = line.substring("copy to ".length);
		} else if (line.startsWith("index")) {
			const indexMatch = line.match(/^index ([a-f0-9]+)\.\.([a-f0-9]+)/);
			if (indexMatch) {
				file.oldRevision = indexMatch[1];
				file.newRevision = indexMatch[2];
			}
		} else if (line.startsWith("Binary files")) {
			file.isBinary = true;
		} else if (line.startsWith("@@")) {
			const hunk = parseHunk(lines, i);
			file.hunks.push(hunk.hunk);
			i = hunk.nextIndex - 1;
		}

		i++;
	}

	return { file, nextIndex: i };
}

function parseHunk(
	lines: string[],
	startIndex: number,
): { hunk: DiffHunk; nextIndex: number } {
	const headerLine = lines[startIndex];
	const match = headerLine.match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)$/);

	if (!match) {
		throw new Error(`Invalid hunk header: ${headerLine}`);
	}

	const oldStart = Number.parseInt(match[1], 10);
	const oldLines = match[2] ? Number.parseInt(match[2], 10) : 1;
	const newStart = Number.parseInt(match[3], 10);
	const newLines = match[4] ? Number.parseInt(match[4], 10) : 1;
	const header = match[5].trim();

	const hunk: DiffHunk = {
		oldStart,
		oldLines,
		newStart,
		newLines,
		lines: [],
		header,
	};

	let i = startIndex + 1;
	let oldLineNumber = oldStart;
	let newLineNumber = newStart;

	while (i < lines.length) {
		const line = lines[i];

		if (line.startsWith("@@") || line.startsWith("diff --git")) {
			break;
		}

		const firstChar = line[0];
		let type: DiffLine["type"];
		let content: string;
		let oldNum: number | null = oldLineNumber;
		let newNum: number | null = newLineNumber;

		if (firstChar === "+") {
			type = "add";
			content = line.substring(1);
			oldNum = null;
			newLineNumber++;
		} else if (firstChar === "-") {
			type = "delete";
			content = line.substring(1);
			newNum = null;
			oldLineNumber++;
		} else if (firstChar === " ") {
			type = "normal";
			content = line.substring(1);
			oldLineNumber++;
			newLineNumber++;
		} else if (firstChar === "\\") {
			type = "context";
			content = line;
			oldNum = null;
			newNum = null;
		} else {
			type = "normal";
			content = line;
			oldLineNumber++;
			newLineNumber++;
		}

		hunk.lines.push({
			type,
			content,
			oldLineNumber: oldNum,
			newLineNumber: newNum,
		});

		i++;
	}

	return { hunk, nextIndex: i };
}

export function getFileExtension(filename: string): string {
	const parts = filename.split(".");
	return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function getLanguageFromExtension(extension: string): string {
	const languageMap: Record<string, string> = {
		js: "javascript",
		jsx: "jsx",
		ts: "typescript",
		tsx: "tsx",
		py: "python",
		rb: "ruby",
		java: "java",
		c: "c",
		cpp: "cpp",
		cs: "csharp",
		php: "php",
		go: "go",
		rs: "rust",
		swift: "swift",
		kt: "kotlin",
		scala: "scala",
		sh: "bash",
		bash: "bash",
		zsh: "bash",
		json: "json",
		xml: "xml",
		html: "html",
		css: "css",
		scss: "scss",
		sass: "sass",
		md: "markdown",
		yaml: "yaml",
		yml: "yaml",
		sql: "sql",
		graphql: "graphql",
		vue: "vue",
		svelte: "svelte",
	};

	return languageMap[extension.toLowerCase()] || "text";
}
