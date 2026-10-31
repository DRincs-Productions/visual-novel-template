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
