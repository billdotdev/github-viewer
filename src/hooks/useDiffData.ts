import { useQuery } from "@tanstack/react-query";
import { type ParsedDiffFile, parseDiff } from "../lib/diffParser";
import { githubRestClient } from "../lib/githubRestClient";

export interface DiffData {
	file: ParsedDiffFile;
	diffText: string;
}

export function useDiffData(
	owner: string,
	repo: string,
	prNumber: number,
	filename: string,
	enabled = true,
) {
	return useQuery({
		queryKey: ["fileDiff", owner, repo, prNumber, filename],
		queryFn: async (): Promise<DiffData | null> => {
			try {
				const diffText = await githubRestClient.getFileDiff(
					owner,
					repo,
					prNumber,
					filename,
				);
				const parsed = parseDiff(diffText);
				const file = parsed[0];
				if (!file) {
					return null;
				}
				return { file, diffText };
			} catch (error) {
				console.error("Failed to fetch diff:", error);
				return null;
			}
		},
		enabled,
	});
}

export function useFullPRDiff(
	owner: string,
	repo: string,
	prNumber: number,
	enabled = true,
) {
	return useQuery({
		queryKey: ["prDiff", owner, repo, prNumber],
		queryFn: async (): Promise<ParsedDiffFile[]> => {
			try {
				const diffText = await githubRestClient.getPullRequestDiff(
					owner,
					repo,
					prNumber,
				);
				return parseDiff(diffText);
			} catch (error) {
				console.error("Failed to fetch PR diff:", error);
				return [];
			}
		},
		enabled,
	});
}
