import {
	GitMerge,
	GitPullRequest,
	GitPullRequestClosed,
	GitPullRequestDraft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const classNames = {
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

export function PrStateIcon(props: {
	state: "MERGED" | "CLOSED" | "DRAFT" | "OPEN";
}) {
	const Icon = icon[props.state];

	return <Icon className={cn("w-4 h-4", classNames[props.state])} />;
}
