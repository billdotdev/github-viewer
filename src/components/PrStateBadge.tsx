import {
	GitMerge,
	GitPullRequest,
	GitPullRequestClosed,
	GitPullRequestDraft,
} from "lucide-react";
import type { PullRequest } from "@/generated/graphql";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

const bgColorClassNames = {
	MERGED: "bg-purple-600 hover:bg-purple-700",
	CLOSED: "bg-red-600 hover:bg-red-700",
	DRAFT: "bg-gray-600 hover:bg-gray-700",
	OPEN: "bg-green-600 hover:bg-green-700",
};

export const prStateTextColorClassNames = {
	MERGED: "text-purple-600 hover:text-purple-700",
	CLOSED: "text-red-600 hover:text-red-700",
	DRAFT: "text-gray-600 hover:text-gray-700",
	OPEN: "text-green-600 hover:text-green-700",
};

const icon = {
	MERGED: GitMerge,
	CLOSED: GitPullRequestClosed,
	DRAFT: GitPullRequestDraft,
	OPEN: GitPullRequest,
};

export function PrStateBadge({
	pr,
}: {
	pr: Pick<PullRequest, "state" | "isDraft">;
}) {
	const state = pr.isDraft ? "DRAFT" : pr.state;

	const Icon = icon[state];

	return (
		<Badge variant="default" className={cn(bgColorClassNames[state])}>
			<Icon className={cn("w-4 h-4", prStateTextColorClassNames[state])} />{" "}
			{state}
		</Badge>
	);
}
