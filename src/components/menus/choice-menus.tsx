import { Button } from "@/components/ui/button";
import { CHOICE_INPUT_REVEAL_DELAY_MS } from "@/constants";
import { useChoiceMenuHotkeys } from "@/lib/hooks/hotkeys-hooks";
import { useNarrationFunctions } from "@/lib/hooks/narration-hooks";
import { useQueryChoiceMenuOptions } from "@/lib/query/narration-query";
import { GameStatus } from "@/lib/stores/game-status-store";
import { TextDisplaySettings } from "@/lib/stores/text-display-settings-store";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useSelector } from "@tanstack/react-store";
import { CornerDownLeft } from "lucide-react";

export function ChoiceMenu() {
    const loading = useSelector(GameStatus.store, (state) => state.loading);
    const { data: menu = [] } = useQueryChoiceMenuOptions();
    const isTyping = useSelector(TextDisplaySettings.store, (state) => state.inProgress);
    const { selectChoice } = useNarrationFunctions();
    const [sustainedNotTyping] = useDebouncedValue(!isTyping, {
        wait: CHOICE_INPUT_REVEAL_DELAY_MS,
    });
    const debouncedMenu = !isTyping && sustainedNotTyping && !loading ? menu : [];
    const { menuRef } = useChoiceMenuHotkeys(debouncedMenu.length);

    return (
        <div
            ref={menuRef}
            className="flex flex-col items-center justify-center gap-2 w-full h-full overflow-auto"
            role="menu"
        >
            {debouncedMenu.map((item, index) => (
                <div
                    key={`choice-${item.choiceIndex}`}
                    className={
                        "animate-in fade-in-0 slide-in-from-bottom-[10%] fill-mode-backwards"
                    }
                    style={{ animationDelay: `${index * 150}ms` }}
                >
                    <Button
                        role="menuitem"
                        disabled={loading}
                        onClick={() => selectChoice(item)}
                        size="sm"
                        variant="secondary"
                    >
                        {item.type === "close" && <CornerDownLeft />}
                        {item.text}
                    </Button>
                </div>
            ))}
        </div>
    );
}
