import { useNarrationFunctions } from "@/lib/hooks/narration-hooks";
import { useGameProps } from "@/lib/hooks/props-hooks";
import { Game } from "@drincs/pixi-vn";
import { useEffect } from "react";

/**
 * Connects the app's real UI to Pixi'VN's `Game.testing` API, so the game can be driven and
 * inspected from outside through `window.pixiVN` (see the `pixi-vn-testing` skill).
 *
 * It registers the live `StepLabelProps` and the app's own narration functions (continue, back,
 * select choice, start, jump, call, navigate), so every test action goes through the same
 * loading/blocking/refresh logic as a real player action.
 *
 * AI agents can use it like an MCP: through a browser-automation tool they play-test the game
 * end-to-end, advancing the story, picking choices, answering inputs, navigating screens and
 * reading/writing storage. The `window` bridge itself is turned on by the Vite plugin during
 * `vite dev` only, so this hook has no effect in production builds.
 */
export function useTestingBridge() {
    const gameProps = useGameProps();
    const { goNext, goBack, selectChoice, startNewGame, jump, call } = useNarrationFunctions();

    useEffect(() => {
        Game.testing.setProps(gameProps);
        Game.testing.setActions({
            continue: goNext,
            back: goBack,
            selectChoice,
            start: async (label, props) => {
                await gameProps.navigate({ to: "/game/narration" });
                return await startNewGame(label, props);
            },
            navigate: async (screen) => {
                await gameProps.navigate({ to: screen as never });
                await gameProps.invalidateInterfaceData();
            },
            jump,
            call,
        });
    }, [gameProps, goNext, goBack, selectChoice, startNewGame, jump, call]);
}
