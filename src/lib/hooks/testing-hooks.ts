import { useNarrationFunctions } from "@/lib/hooks/narration-hooks";
import { useGameProps } from "@/lib/hooks/props-hooks";
import { Game } from "@drincs/pixi-vn";
import { useEffect } from "react";

export function useTestingBridge() {
    const gameProps = useGameProps();
    const { goNext, goBack, selectChoice, startNewGame, jump, call } = useNarrationFunctions();

    useEffect(() => {
        Game.testing.setProps(gameProps);
        Game.testing.setActions({
            continue: goNext,
            back: goBack,
            selectChoice,
            start: async () => {
                await gameProps.navigate({ to: "/game/narration" });
                return await startNewGame("start");
            },
            jump,
            call,
        });
    }, [gameProps, goNext, goBack, selectChoice, startNewGame, jump, call]);
}
