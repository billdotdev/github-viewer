import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Key, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { saveToken, validateToken } from "../lib/tokenStorage";

export function TokenPrompt() {
	const tokenInputId = useId();
	const [token, setToken] = useState("");
	const [isValidating, setIsValidating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showToken, setShowToken] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!token.trim()) {
			setError("Please enter a token");
			return;
		}

		if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
			setError(
				"Invalid token format. GitHub tokens start with 'ghp_' or 'github_pat_'",
			);
			return;
		}

		setIsValidating(true);

		try {
			const isValid = await validateToken(token);

			if (!isValid) {
				setError("Invalid token. Please check your token and try again.");
				setIsValidating(false);
				return;
			}

			await saveToken(token);
			navigate({ to: "/" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save token");
			setIsValidating(false);
		}
	};

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="space-y-1">
				<div className="flex items-center gap-2">
					<Key className="h-5 w-5" />
					<CardTitle>GitHub Token</CardTitle>
				</div>
				<CardDescription>
					Enter your GitHub Personal Access Token. It is stored securely in your
					browser.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-3">
					<div>
						<label
							htmlFor={tokenInputId}
							className={cn(
								"mb-1 block text-xs font-medium text-muted-foreground",
							)}
						>
							GitHub Token
						</label>
						<div className="relative">
							<input
								type={showToken ? "text" : "password"}
								id={tokenInputId}
								value={token}
								onChange={(e) => setToken(e.target.value)}
								placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
								className={cn(
									"h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
								)}
								disabled={isValidating}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setShowToken(!showToken)}
								disabled={isValidating}
								className="absolute right-1 top-1/2 -translate-y-1/2 px-2"
								aria-label={showToken ? "Hide token" : "Show token"}
							>
								{showToken ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>

					{error && (
						<div
							className={cn(
								"rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2",
							)}
						>
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}

					<Button
						type="submit"
						disabled={isValidating || !token.trim()}
						className="w-full"
					>
						{isValidating ? (
							<span className="inline-flex items-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin" />
								Validating...
							</span>
						) : (
							"Save Token"
						)}
					</Button>
				</form>

				<div className="mt-4 border-t pt-4">
					<h3 className="mb-1 text-xs font-semibold">How to create a token</h3>
					<ol
						className={cn(
							"list-decimal list-inside space-y-0.5 text-xs text-muted-foreground",
						)}
					>
						<li>GitHub Settings → Developer settings</li>
						<li>Personal access tokens → Tokens (classic)</li>
						<li>
							Generate with <code className="rounded bg-muted px-1">repo</code>{" "}
							scope
						</li>
						<li>Copy and paste the token above</li>
					</ol>
					<a
						href="https://github.com/settings/tokens"
						target="_blank"
						rel="noopener noreferrer"
						className={cn(
							"mt-2 inline-block text-xs text-primary underline-offset-4 hover:underline",
						)}
					>
						Create token on GitHub →
					</a>
				</div>
			</CardContent>
		</Card>
	);
}
