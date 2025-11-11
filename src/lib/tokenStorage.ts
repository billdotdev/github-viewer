const STORAGE_KEY = "github_token_encrypted";
const SALT_KEY = "github_token_salt";

async function deriveKey(
	password: string,
	salt: Uint8Array,
): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		{ name: "PBKDF2" },
		false,
		["deriveBits", "deriveKey"],
	);

	return crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt as BufferSource,
			iterations: 100000,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);
}

function getDeviceFingerprint(): string {
	const components = [
		navigator.userAgent,
		navigator.language,
		new Date()
			.getTimezoneOffset()
			.toString(),
		// screen.colorDepth.toString(),
		// screen.width.toString() + screen.height.toString(),
	];
	return components.join("|");
}

export async function saveToken(token: string): Promise<void> {
	try {
		const encoder = new TextEncoder();
		const data = encoder.encode(token);

		const salt = crypto.getRandomValues(new Uint8Array(16));
		const iv = crypto.getRandomValues(new Uint8Array(12));

		const fingerprint = getDeviceFingerprint();
		const key = await deriveKey(fingerprint, salt);

		const encryptedData = await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv: iv },
			key,
			data,
		);

		const encryptedArray = new Uint8Array(encryptedData);
		const combined = new Uint8Array(iv.length + encryptedArray.length);
		combined.set(iv);
		combined.set(encryptedArray, iv.length);

		const base64Encrypted = btoa(String.fromCharCode(...combined));
		const base64Salt = btoa(String.fromCharCode(...salt));

		localStorage.setItem(STORAGE_KEY, base64Encrypted);
		localStorage.setItem(SALT_KEY, base64Salt);
	} catch (error) {
		console.error("Failed to save token:", error);
		throw new Error("Failed to securely save token");
	}
}

export async function getToken(): Promise<string | null> {
	try {
		const encryptedBase64 = localStorage.getItem(STORAGE_KEY);
		const saltBase64 = localStorage.getItem(SALT_KEY);

		if (!encryptedBase64 || !saltBase64) {
			return null;
		}

		const encryptedData = Uint8Array.from(atob(encryptedBase64), (c) =>
			c.charCodeAt(0),
		);
		const salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));

		const iv = encryptedData.slice(0, 12);
		const data = encryptedData.slice(12);

		const fingerprint = getDeviceFingerprint();
		const key = await deriveKey(fingerprint, salt);

		const decryptedData = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: iv },
			key,
			data,
		);

		const decoder = new TextDecoder();
		return decoder.decode(decryptedData);
	} catch (error) {
		console.error("Failed to retrieve token:", error);
		clearToken();
		return null;
	}
}

export function clearToken(): void {
	localStorage.removeItem(STORAGE_KEY);
	localStorage.removeItem(SALT_KEY);
}

export async function validateToken(token: string): Promise<boolean> {
	try {
		const response = await fetch("https://api.github.com/graphql", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: "query { viewer { login } }",
			}),
		});

		const data = await response.json();
		return !data.errors && data.data?.viewer?.login;
	} catch (error) {
		console.error("Token validation failed:", error);
		return false;
	}
}
