import { useEffect, useState } from "react";

export function useSystemTheme() {
	const [theme, setTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const updateTheme = (e: MediaQueryList | MediaQueryListEvent) => {
			if (e.matches) {
				document.documentElement.classList.add("dark");
				setTheme("dark");
			} else {
				document.documentElement.classList.remove("dark");
				setTheme("light");
			}
		};

		updateTheme(mediaQuery);

		mediaQuery.addEventListener("change", updateTheme);

		return () => {
			mediaQuery.removeEventListener("change", updateTheme);
		};
	}, []);

	return { theme };
}
