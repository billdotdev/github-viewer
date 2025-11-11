import { getToken } from "./tokenStorage";

const GITHUB_API_URL = "https://api.github.com";

export interface DiffResponse {
	diff: string;
	patch: string;
}

export class GitHubRestClient {
	private token: string | null = null;

	private async getToken(): Promise<string> {
		if (!this.token) {
			this.token = await getToken();
		}
		if (!this.token) {
			throw new Error("No token available");
		}
		return this.token;
	}

	async getPullRequestDiff(
		owner: string,
		repo: string,
		prNumber: number,
	): Promise<string> {
		const token = await this.getToken();
		const response = await fetch(
			`${GITHUB_API_URL}/repos/${owner}/${repo}/pulls/${prNumber}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github.v3.diff",
				},
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch diff: ${response.statusText}`);
		}

		return response.text();
	}

	async getFileDiff(
		owner: string,
		repo: string,
		prNumber: number,
		filename: string,
	): Promise<string> {
		const fullDiff = await this.getPullRequestDiff(owner, repo, prNumber);
		return this.extractFileDiff(fullDiff, filename);
	}

	private extractFileDiff(fullDiff: string, filename: string): string {
		const lines = fullDiff.split("\n");
		const fileDiffLines: string[] = [];
		let inTargetFile = false;
		let foundFile = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			if (line.startsWith("diff --git")) {
				if (inTargetFile) {
					break;
				}

				if (line.includes(`b/${filename}`)) {
					inTargetFile = true;
					foundFile = true;
					fileDiffLines.push(line);
				}
			} else if (inTargetFile) {
				fileDiffLines.push(line);
			}
		}

		if (!foundFile) {
			throw new Error(`File ${filename} not found in diff`);
		}

		return fileDiffLines.join("\n");
	}

	async getFileContent(
		owner: string,
		repo: string,
		ref: string,
		path: string,
	): Promise<string> {
		const token = await this.getToken();
		const response = await fetch(
			`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github.v3.raw",
				},
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch file content: ${response.statusText}`);
		}

		return response.text();
	}
}

export const githubRestClient = new GitHubRestClient();
