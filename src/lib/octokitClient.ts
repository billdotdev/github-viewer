import { Octokit } from "@octokit/rest";
import { getToken } from "./tokenStorage";

let sharedClient: Octokit | undefined;
let token: string | null = null;

export async function getOctokitClient() {
	if (sharedClient) {
		return sharedClient;
	}
	if (!token) {
		token = await getToken();
	}
	if (!token) {
		throw new Error("No token available");
	}
	sharedClient = new Octokit({ auth: token });
	return sharedClient;
}
