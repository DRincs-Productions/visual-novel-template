import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CHOICE_INPUT_REVEAL_DELAY_MS } from "@/constants";
import { useNarrationFunctions } from "@/lib/hooks/narration-hooks";
import { useQueryDialogue, useQueryInputValue } from "@/lib/query/narration-query";
import { GameStatus } from "@/lib/stores/game-status-store";
import { TextDisplaySettings } from "@/lib/stores/text-display-settings-store";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useSelector } from "@tanstack/react-store";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

export function InputRequestDialog() {
    const { data: { lastText: text } = {} } = useQueryDialogue();
    const {
        data: { isRequired, type, currentValue } = { currentValue: undefined, isRequired: false },
    } = useQueryInputValue<string | number>();
    const isTyping = useSelector(TextDisplaySettings.store, (state) => state.inProgress);
    const loading = useSelector(GameStatus.store, (state) => state.loading);
    const readyToShow = !isTyping && isRequired && !loading;
    const [sustainedReady] = useDebouncedValue(readyToShow, {
        wait: CHOICE_INPUT_REVEAL_DELAY_MS,
    });
    const open = readyToShow && sustainedReady;
    const [tempValue, setTempValue] = useState<string | number>();
    const { submitInputValue: submitNarrationInputValue } = useNarrationFunctions();
    const { t } = useTranslation(["ui"]);

    useEffect(() => {
        setTempValue(currentValue);
    }, [currentValue]);

    const canConfirm = tempValue !== undefined && tempValue !== "";

    const submitInputValue = useCallback(() => {
        if (!canConfirm) {
            return;
        }
        submitNarrationInputValue(tempValue || currentValue);
        setTempValue(undefined);
    }, [canConfirm, currentValue, submitNarrationInputValue, tempValue]);

    return (
        <Dialog open={open}>
            <DialogContent showCloseButton={false}>
                {text && (
                    <Markdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            p: (props) => <span {...props} />,
                        }}
                    >
                        {text}
                    </Markdown>
                )}
                <Input
                    value={tempValue ?? ""}
                    type={type}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && canConfirm) {
                            submitInputValue();
                        }
                    }}
                    onChange={(e) => {
                        switch (e.target.type) {
                            case "number":
                                setTempValue(e.target.valueAsNumber);
                                break;
                            default:
                                setTempValue(e.target.value);
                        }
                    }}
                />
                <DialogFooter>
                    <Button disabled={!canConfirm} onClick={submitInputValue}>
                        {t("confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
