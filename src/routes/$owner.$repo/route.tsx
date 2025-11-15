import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CircleDot, Code, GitPullRequest } from "lucide-react";
import { createCrumb } from "@/components/Breadcrumbs";

export const Route = createFileRoute("/$owner/$repo")({
	component: RepositoryLayout,
	loader: async ({ params, location }) => {
		return {
			crumbs: [
				createCrumb({
					label: `${params.owner}/${params.repo}`,
					to: "/$owner/$repo",
					params,
					className: "max-w-[200px] truncate font-mono",
					buttons: [
						{
							label: "Code",
							to: "/$owner/$repo",
							icon: Code,
						},
						{
							label: "Issues",
							to: "/$owner/$repo/issues",
							icon: CircleDot,
						},
						{
							label: "Pull Requests",
							to: "/$owner/$repo/pulls",
							icon: GitPullRequest,
							active: location.pathname.includes("/pull"),
						},
					],
				}),
			],
		};
	},
});

function RepositoryLayout() {
	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<Outlet />
		</div>
	);
}
