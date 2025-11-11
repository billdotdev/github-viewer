const PINNED_REPOS_KEY = "github_viewer_pinned_repos";

export interface PinnedRepository {
	owner: string;
	name: string;
	description: string | null;
	language: string | null;
	languageColor: string | null;
	stargazerCount: number;
	forkCount: number;
	visibility: string;
	topics: string[];
	updatedAt: string;
	url: string;
}

export function getPinnedRepos(): PinnedRepository[] {
	try {
		const stored = localStorage.getItem(PINNED_REPOS_KEY);
		if (!stored) {
			return [];
		}
		return JSON.parse(stored);
	} catch (error) {
		console.error("Failed to load pinned repositories:", error);
		return [];
	}
}

export function pinRepository(repo: PinnedRepository): void {
	try {
		const pinned = getPinnedRepos();
		const exists = pinned.find(
			(r) => r.owner === repo.owner && r.name === repo.name,
		);
		if (exists) {
			return;
		}
		pinned.push(repo);
		localStorage.setItem(PINNED_REPOS_KEY, JSON.stringify(pinned));
	} catch (error) {
		console.error("Failed to pin repository:", error);
		throw new Error("Failed to pin repository");
	}
}

export function unpinRepository(owner: string, name: string): void {
	try {
		const pinned = getPinnedRepos();
		const filtered = pinned.filter(
			(r) => !(r.owner === owner && r.name === name),
		);
		localStorage.setItem(PINNED_REPOS_KEY, JSON.stringify(filtered));
	} catch (error) {
		console.error("Failed to unpin repository:", error);
		throw new Error("Failed to unpin repository");
	}
}

export function isPinned(owner: string, name: string): boolean {
	const pinned = getPinnedRepos();
	return pinned.some((r) => r.owner === owner && r.name === name);
}
