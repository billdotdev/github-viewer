import { useEffect } from "react";

export interface KeyboardShortcutHandlers {
	onNext?: () => void;
	onPrevious?: () => void;
	onToggleViewed?: () => void;
	onToggleExpand?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				event.target instanceof HTMLSelectElement
			) {
				return;
			}

			switch (event.key.toLowerCase()) {
				case "j":
					event.preventDefault();
					handlers.onNext?.();
					break;
				case "k":
					event.preventDefault();
					handlers.onPrevious?.();
					break;
				case "v":
					event.preventDefault();
					handlers.onToggleViewed?.();
					break;
				case "x":
					event.preventDefault();
					handlers.onToggleExpand?.();
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handlers]);
}
