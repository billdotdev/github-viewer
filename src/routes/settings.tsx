import { createFileRoute } from "@tanstack/react-router";
import { TokenPrompt } from "@/components/TokenPrompt";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	return (
		<div
			className={cn(
				"flex flex-1 flex-col h-screen justify-center items-center overflow-auto",
			)}
		>
			<div className={cn("container mx-auto max-w-4xl py-6")}>
				<TokenPrompt />
			</div>
		</div>
	);
}
