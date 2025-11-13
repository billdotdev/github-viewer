import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { RepositoryCard } from "@/components/RepositoryCard";
import { RepositorySearch } from "@/components/RepositorySearch";
import { TokenPrompt } from "@/components/TokenPrompt";
import { getPinnedRepos } from "@/lib/repositoryStorage";
import { getToken } from "@/lib/tokenStorage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const [hasToken, setHasToken] = useState<boolean | null>(null);
	const [pinnedRepos, setPinnedRepos] = useState(getPinnedRepos());

	useEffect(() => {
		getToken().then((token) => {
			setHasToken(!!token);
		});
	}, []);

	const handleRepositoryChange = () => {
		setPinnedRepos(getPinnedRepos());
	};

	if (hasToken === null) {
		return null;
	}

	if (!hasToken) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<TokenPrompt />
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col overflow-auto">
			<div className="container mx-auto max-w-6xl py-8 px-4">
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">Repositories</h1>
					<p className="text-muted-foreground">
						Search and pin repositories to keep track of your work
					</p>
				</div>

				<div className="mb-8">
					<RepositorySearch onRepositoryPinned={handleRepositoryChange} />
				</div>

				{pinnedRepos.length === 0 ? (
					<div
						className={cn(
							"flex flex-col items-center justify-center py-16 text-center",
						)}
					>
						<div className="mb-4 rounded-full bg-muted p-4">
							<BookOpen className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-semibold mb-2">
							No pinned repositories
						</h3>
						<p className="text-muted-foreground max-w-md">
							Search for repositories above and pin them to quickly access them
							here
						</p>
					</div>
				) : (
					<div>
						<h2 className="text-xl font-semibold mb-4">Pinned Repositories</h2>
						<div className="grid gap-4 md:grid-cols-2">
							{pinnedRepos.map((repo) => (
								<RepositoryCard
									key={`${repo.owner}/${repo.name}`}
									repository={repo}
									onUnpin={handleRepositoryChange}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
