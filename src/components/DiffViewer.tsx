import { useEffect, useState } from "react";
import {
	Diff,
	Hunk,
	type HunkTokens,
	parseDiff,
	tokenize,
} from "react-diff-view";
import "react-diff-view/style/index.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
	oneDark,
	oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import refractor from "refractor/core";
import bash from "refractor/lang/bash";
// import c from "refractor/lang/c";
// import cpp from "refractor/lang/cpp";
// import csharp from "refractor/lang/csharp";
import css from "refractor/lang/css";
// import go from "refractor/lang/go";
// import graphql from "refractor/lang/graphql";
// import java from "refractor/lang/java";
import javascript from "refractor/lang/javascript";
import json from "refractor/lang/json";
import jsx from "refractor/lang/jsx";
import markdown from "refractor/lang/markdown";
// import python from "refractor/lang/python";
// import rust from "refractor/lang/rust";
// import scss from "refractor/lang/scss";
import sql from "refractor/lang/sql";
import tsx from "refractor/lang/tsx";
import typescript from "refractor/lang/typescript";
import yaml from "refractor/lang/yaml";
import type { ParsedDiffFile } from "../lib/diffParser";
import { getFileExtension, getLanguageFromExtension } from "../lib/diffParser";
import { cn } from "../lib/utils";

refractor.register(typescript);
refractor.register(javascript);
refractor.register(jsx);
refractor.register(tsx);
refractor.register(css);
// refractor.register(scss);
refractor.register(json);
refractor.register(markdown);
refractor.register(yaml);
refractor.register(bash);
// refractor.register(python);
// refractor.register(java);
// refractor.register(c);
// refractor.register(cpp);
// refractor.register(csharp);
// refractor.register(go);
// refractor.register(rust);
refractor.register(sql);
// refractor.register(graphql);

interface DiffViewerProps {
	file: ParsedDiffFile;
	diffText: string;
	viewType: "unified" | "split";
	renderer: "react-diff-view" | "react-syntax-highlighter";
}

export function DiffViewer({
	file,
	diffText,
	viewType,
	renderer,
}: DiffViewerProps) {
	if (file.isBinary) {
		return (
			<div className={cn("border-t bg-muted/30 px-4 py-8 text-center")}>
				<p className={cn("text-sm text-muted-foreground")}>
					Binary file not shown
				</p>
			</div>
		);
	}

	const extension = getFileExtension(file.newPath || file.oldPath || "");
	const language = getLanguageFromExtension(extension);

	return (
		<div>
			{renderer === "react-diff-view" ? (
				<ReactDiffViewRenderer
					diffText={diffText}
					viewType={viewType}
					language={language}
				/>
			) : (
				<ReactSyntaxHighlighterRenderer
					file={file}
					language={language}
					viewType={viewType}
				/>
			)}
		</div>
	);
}

function ReactDiffViewRenderer({
	diffText,
	viewType,
	language,
}: {
	diffText: string;
	viewType: "unified" | "split";
	language: string;
}) {
	const [tokens, setTokens] = useState<HunkTokens | undefined>(undefined);

	useEffect(() => {
		const loadTokens = async () => {
			try {
				const files = parseDiff(diffText);
				const file = files[0];

				if (!file || !file.hunks) {
					return;
				}

				const refractorLanguage = mapLanguageToRefractor(language);
				if (!refractorLanguage || !refractor.languages[refractorLanguage]) {
					return;
				}

				const options = {
					highlight: true,
					refractor,
					language: refractorLanguage,
				};

				const tokenizedHunks = tokenize(file.hunks, options);
				setTokens(tokenizedHunks);
			} catch (error) {
				console.error("Tokenization error:", error);
			}
		};

		loadTokens();
	}, [diffText, language]);

	try {
		const files = parseDiff(diffText);
		const file = files[0];

		if (!file) {
			return (
				<div className={cn("px-4 py-8 text-center")}>
					<p className={cn("text-sm text-muted-foreground")}>
						No diff content available
					</p>
				</div>
			);
		}

		return (
			<div className={cn("overflow-x-auto bg-background -mt-6")}>
				<style>
					{`
						.diff-view {
							font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
							font-size: 12px;
							line-height: 20px;
						}
						.diff-view .diff-gutter {
							font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
							font-size: 12px;
							line-height: 20px;
						}
						.diff-view .diff-code {
							font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
							font-size: 12px;
							line-height: 20px;
						}
					`}
				</style>
				<div className={cn("diff-view")}>
					<Diff
						viewType={viewType}
						diffType={file.type}
						hunks={file.hunks || []}
						tokens={tokens}
					>
						{(hunks) =>
							hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
						}
					</Diff>
				</div>
			</div>
		);
	} catch (error) {
		console.error("Diff parsing error:", error);
		return (
			<div className={cn("px-4 py-8 text-center")}>
				<p className={cn("text-sm text-destructive")}>Failed to parse diff</p>
			</div>
		);
	}
}

function mapLanguageToRefractor(language: string): string {
	const languageMap: Record<string, string> = {
		js: "javascript",
		jsx: "jsx",
		ts: "typescript",
		tsx: "tsx",
		// py: "python",
		// rb: "ruby",
		// java: "java",
		// c: "c",
		// cpp: "cpp",
		// cs: "csharp",
		go: "go",
		rs: "rust",
		php: "php",
		// swift: "swift",
		// kt: "kotlin",
		// scala: "scala",
		css: "css",
		// scss: "scss",
		// sass: "sass",
		// less: "less",
		html: "html",
		xml: "xml",
		json: "json",
		yaml: "yaml",
		yml: "yaml",
		md: "markdown",
		sql: "sql",
		sh: "bash",
		bash: "bash",
		// graphql: "graphql",
		// gql: "graphql",
	};

	return languageMap[language.toLowerCase()] || language.toLowerCase();
}

function ReactSyntaxHighlighterRenderer({
	file,
	language,
	viewType,
}: {
	file: ParsedDiffFile;
	language: string;
	viewType: "unified" | "split";
}) {
	const [isDark, setIsDark] = useState(
		document.documentElement.classList.contains("dark"),
	);

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setIsDark(document.documentElement.classList.contains("dark"));
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	}, []);

	const style = isDark ? oneDark : oneLight;
	const bgColor = isDark ? "#1e1e1e" : "#ffffff";
	const borderColor = isDark ? "border-gray-800" : "border-gray-200";
	const lineNumberColor = isDark ? "text-gray-500" : "text-gray-400";

	if (viewType === "split") {
		return (
			<div className={cn("overflow-x-auto max-w-full")}>
				<div
					className={cn("flex min-w-full")}
					style={{ backgroundColor: bgColor }}
				>
					<div className={cn("w-1/2 border-r")}>
						{file.hunks.map((hunk, hunkIdx) =>
							hunk.lines.map((line, lineIdx) => {
								const lineKey = `old-${hunkIdx}-${lineIdx}`;
								const showLine =
									line.type === "delete" || line.type === "normal";

								if (!showLine) {
									return (
										<div
											key={lineKey}
											className={`flex items-start border-b ${borderColor}`}
											style={{
												backgroundColor: "transparent",
												minHeight: "28px",
											}}
										>
											<div
												className={`min-w-[60px] select-none px-2 py-1 text-right text-xs ${lineNumberColor}`}
											/>
											<div className={cn("flex-1")} />
										</div>
									);
								}

								const lineBgColor =
									line.type === "delete"
										? isDark
											? "rgba(255, 0, 0, 0.1)"
											: "rgba(255, 0, 0, 0.15)"
										: "transparent";

								const prefix = line.type === "delete" ? "- " : "  ";

								return (
									<div
										key={lineKey}
										className={`flex items-start border-b ${borderColor}`}
										style={{ backgroundColor: lineBgColor }}
									>
										<div
											className={`min-w-[60px] select-none px-2 py-1 text-right text-xs ${lineNumberColor}`}
										>
											{line.oldLineNumber}
										</div>
										<div className={cn("flex-1 min-w-0 overflow-x-auto")}>
											<SyntaxHighlighter
												language={language}
												style={style}
												PreTag="div"
												customStyle={{
													margin: 0,
													padding: "0.25rem 0.5rem",
													background: "transparent",
													fontSize: "0.875rem",
													whiteSpace: "pre",
													overflowWrap: "normal",
													wordBreak: "normal",
													display: "inline-block",
												}}
												codeTagProps={{
													style: {
														background: "transparent",
														whiteSpace: "pre",
													},
												}}
											>
												{prefix + line.content}
											</SyntaxHighlighter>
										</div>
									</div>
								);
							}),
						)}
					</div>

					<div className={cn("w-1/2")}>
						{file.hunks.map((hunk, hunkIdx) =>
							hunk.lines.map((line, lineIdx) => {
								const lineKey = `new-${hunkIdx}-${lineIdx}`;
								const showLine = line.type === "add" || line.type === "normal";

								if (!showLine) {
									return (
										<div
											key={lineKey}
											className={`flex items-start border-b ${borderColor}`}
											style={{
												backgroundColor: "transparent",
												minHeight: "28px",
											}}
										>
											<div
												className={`min-w-[60px] select-none px-2 py-1 text-right text-xs ${lineNumberColor}`}
											/>
											<div className={cn("flex-1")} />
										</div>
									);
								}

								const lineBgColor =
									line.type === "add"
										? isDark
											? "rgba(0, 255, 0, 0.1)"
											: "rgba(0, 200, 0, 0.15)"
										: "transparent";

								const prefix = line.type === "add" ? "+ " : "  ";

								return (
									<div
										key={lineKey}
										className={`flex items-start border-b ${borderColor}`}
										style={{ backgroundColor: lineBgColor }}
									>
										<div
											className={`min-w-[60px] select-none px-2 py-1 text-right text-xs ${lineNumberColor}`}
										>
											{line.newLineNumber}
										</div>
										<div className={cn("flex-1 min-w-0 overflow-x-auto")}>
											<SyntaxHighlighter
												language={language}
												style={style}
												PreTag="div"
												customStyle={{
													margin: 0,
													padding: "0.25rem 0.5rem",
													background: "transparent",
													fontSize: "0.875rem",
													whiteSpace: "pre",
													overflowWrap: "normal",
													wordBreak: "normal",
													display: "inline-block",
												}}
												codeTagProps={{
													style: {
														background: "transparent",
														whiteSpace: "pre",
													},
												}}
											>
												{prefix + line.content}
											</SyntaxHighlighter>
										</div>
									</div>
								);
							}),
						)}
					</div>
				</div>
			</div>
		);
	}

	const lines = file.hunks.flatMap((hunk) =>
		hunk.lines.map((line) => ({
			type: line.type,
			content: line.content,
			lineNumber: line.newLineNumber || line.oldLineNumber,
		})),
	);

	return (
		<div className={cn("overflow-x-auto max-w-full")}>
			<div className={cn("min-w-full")} style={{ backgroundColor: bgColor }}>
				{lines.map((line, idx) => {
					const lineBgColor = isDark
						? line.type === "add"
							? "rgba(0, 255, 0, 0.1)"
							: line.type === "delete"
								? "rgba(255, 0, 0, 0.1)"
								: "transparent"
						: line.type === "add"
							? "rgba(0, 200, 0, 0.15)"
							: line.type === "delete"
								? "rgba(255, 0, 0, 0.15)"
								: "transparent";

					const prefix =
						line.type === "add" ? "+ " : line.type === "delete" ? "- " : "  ";

					const lineKey = `${line.lineNumber}-${line.type}-${idx}`;

					return (
						<div
							key={lineKey}
							className={`flex items-start border-b ${borderColor}`}
							style={{ backgroundColor: lineBgColor }}
						>
							<div
								className={`min-w-[60px] select-none px-2 py-1 text-right text-xs ${lineNumberColor}`}
							>
								{line.lineNumber}
							</div>
							<div className={cn("flex-1 min-w-0 overflow-x-auto")}>
								<SyntaxHighlighter
									language={language}
									style={style}
									PreTag="div"
									customStyle={{
										margin: 0,
										padding: "0.25rem 0.5rem",
										background: "transparent",
										fontSize: "0.875rem",
										whiteSpace: "pre",
										overflowWrap: "normal",
										wordBreak: "normal",
										display: "inline-block",
									}}
									codeTagProps={{
										style: {
											background: "transparent",
											whiteSpace: "pre",
										},
									}}
								>
									{prefix + line.content}
								</SyntaxHighlighter>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
