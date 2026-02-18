import { reactive } from "vue";

export const gameState = reactive({
	currentPhase: "crew" as "crew" | "parrot",
	currentAction: null as string | null,
	showActionPanel: false,
	showVideoOverlay: false,
	turnCount: 0,
	crewHP: 3,
});
