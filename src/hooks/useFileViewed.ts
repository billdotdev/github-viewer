import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { toast } from "sonner";
import type {
	FileViewedState,
	MarkFileAsViewedMutation,
	MarkFileAsViewedMutationVariables,
	UnmarkFileAsViewedMutation,
	UnmarkFileAsViewedMutationVariables,
} from "../generated/graphql";
import { getGraphQLClient } from "../lib/graphqlClient";

const MARK_FILE_AS_VIEWED = gql`
	mutation MarkFileAsViewed($pullRequestId: ID!, $path: String!) {
		markFileAsViewed(input: { pullRequestId: $pullRequestId, path: $path }) {
			clientMutationId
		}
	}
`;

const UNMARK_FILE_AS_VIEWED = gql`
	mutation UnmarkFileAsViewed($pullRequestId: ID!, $path: String!) {
		unmarkFileAsViewed(input: { pullRequestId: $pullRequestId, path: $path }) {
			clientMutationId
		}
	}
`;

interface FileViewedMutationContext {
	previousData: unknown;
}

export function useFileViewed(
	owner: string,
	repo: string,
	prNumber: number,
	pullRequestId: string,
) {
	const queryClient = useQueryClient();
	const graphQLClient = getGraphQLClient();
	const queryKey = ["pullRequestFiles", owner, repo, prNumber];

	const markAsViewed = useMutation<
		MarkFileAsViewedMutation,
		Error,
		string,
		FileViewedMutationContext
	>({
		mutationFn: async (path: string) => {
			return graphQLClient.request<
				MarkFileAsViewedMutation,
				MarkFileAsViewedMutationVariables
			>(MARK_FILE_AS_VIEWED, {
				pullRequestId,
				path,
			});
		},
		onMutate: async (path: string) => {
			await queryClient.cancelQueries({ queryKey });

			const previousData = queryClient.getQueryData(queryKey);

			queryClient.setQueryData(queryKey, (old: unknown) => {
				if (
					!old ||
					typeof old !== "object" ||
					!("repository" in old) ||
					!old.repository ||
					typeof old.repository !== "object" ||
					!("pullRequest" in old.repository)
				)
					return old;

				const repo = old.repository as Record<string, unknown>;
				const pr = repo.pullRequest as Record<string, unknown>;
				const files = pr.files as Record<string, unknown>;
				const nodes = files.nodes as Array<Record<string, unknown>>;

				return {
					...old,
					repository: {
						...repo,
						pullRequest: {
							...pr,
							files: {
								...files,
								nodes: nodes.map((file) => {
									if (file?.path === path) {
										return {
											...file,
											viewerViewedState: "VIEWED" as FileViewedState,
										};
									}
									return file;
								}),
							},
						},
					},
				};
			});

			return { previousData };
		},
		onError: (error, _path, context) => {
			if (context?.previousData) {
				queryClient.setQueryData(queryKey, context.previousData);
			}
			toast.error("Failed to update viewed state", {
				description: error.message || "Please try again",
			});
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});

	const unmarkAsViewed = useMutation<
		UnmarkFileAsViewedMutation,
		Error,
		string,
		FileViewedMutationContext
	>({
		mutationFn: async (path: string) => {
			return graphQLClient.request<
				UnmarkFileAsViewedMutation,
				UnmarkFileAsViewedMutationVariables
			>(UNMARK_FILE_AS_VIEWED, {
				pullRequestId,
				path,
			});
		},
		onMutate: async (path: string) => {
			await queryClient.cancelQueries({ queryKey });

			const previousData = queryClient.getQueryData(queryKey);

			queryClient.setQueryData(queryKey, (old: unknown) => {
				if (
					!old ||
					typeof old !== "object" ||
					!("repository" in old) ||
					!old.repository ||
					typeof old.repository !== "object" ||
					!("pullRequest" in old.repository)
				)
					return old;

				const repo = old.repository as Record<string, unknown>;
				const pr = repo.pullRequest as Record<string, unknown>;
				const files = pr.files as Record<string, unknown>;
				const nodes = files.nodes as Array<Record<string, unknown>>;

				return {
					...old,
					repository: {
						...repo,
						pullRequest: {
							...pr,
							files: {
								...files,
								nodes: nodes.map((file) => {
									if (file?.path === path) {
										return {
											...file,
											viewerViewedState: "UNVIEWED" as FileViewedState,
										};
									}
									return file;
								}),
							},
						},
					},
				};
			});

			return { previousData };
		},
		onError: (error, _path, context) => {
			if (context?.previousData) {
				queryClient.setQueryData(queryKey, context.previousData);
			}
			toast.error("Failed to update viewed state", {
				description: error.message || "Please try again",
			});
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});

	const toggleViewed = (path: string, currentState: FileViewedState) => {
		if (currentState === "VIEWED") {
			unmarkAsViewed.mutate(path);
		} else {
			markAsViewed.mutate(path);
		}
	};

	const markAllAsViewed = async (paths: string[]) => {
		for (const path of paths) {
			try {
				await graphQLClient.request<
					MarkFileAsViewedMutation,
					MarkFileAsViewedMutationVariables
				>(MARK_FILE_AS_VIEWED, {
					pullRequestId,
					path,
				});
			} catch (error) {
				console.error(`Failed to mark ${path} as viewed:`, error);
			}
		}
		queryClient.invalidateQueries({ queryKey });
		toast.success("All files marked as viewed");
	};

	const markAllAsUnviewed = async (paths: string[]) => {
		for (const path of paths) {
			try {
				await graphQLClient.request<
					UnmarkFileAsViewedMutation,
					UnmarkFileAsViewedMutationVariables
				>(UNMARK_FILE_AS_VIEWED, {
					pullRequestId,
					path,
				});
			} catch (error) {
				console.error(`Failed to mark ${path} as unviewed:`, error);
			}
		}
		queryClient.invalidateQueries({ queryKey });
		toast.success("All files marked as unviewed");
	};

	return {
		markAsViewed: markAsViewed.mutate,
		unmarkAsViewed: unmarkAsViewed.mutate,
		toggleViewed,
		markAllAsViewed,
		markAllAsUnviewed,
		isLoading: markAsViewed.isPending || unmarkAsViewed.isPending,
	};
}
