import { NARRATION_DATA_USE_QUERY_KEY } from "@/constants";
import { TextDisplaySettings } from "@/lib/stores/text-display-settings-store";
import { type CharacterInterface, narration, stepHistory } from "@drincs/pixi-vn";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

const CAN_GO_BACK_USE_QUERY_KEY = "can_go_back_use_query_key";
export function useQueryCanGoBack() {
    return useQuery({
        queryKey: [NARRATION_DATA_USE_QUERY_KEY, CAN_GO_BACK_USE_QUERY_KEY],
        queryFn: async () => stepHistory.canGoBack,
    });
}

const CHOICE_MENU_OPTIONS_USE_QUERY_KEY = "choice_menu_options_use_query_key";
export function useQueryChoiceMenuOptions() {
    const { t } = useTranslation(["narration"]);
    return useQuery({
        queryKey: [NARRATION_DATA_USE_QUERY_KEY, CHOICE_MENU_OPTIONS_USE_QUERY_KEY],
        queryFn: async () =>
            narration.choices.list?.map((option) => ({
                ...option,
                text:
                    typeof option.text === "string"
                        ? t(option.text)
                        : option.text.map((text) => t(text)).join(" "),
            })) || [],
    });
}

const INPUT_VALUE_USE_QUERY_KEY = "input_value_use_query_key";
export function useQueryInputValue<T>() {
    return useQuery({
        queryKey: [NARRATION_DATA_USE_QUERY_KEY, INPUT_VALUE_USE_QUERY_KEY],
        queryFn: async () => ({
            isRequired: narration.input.isRequired,
            type: narration.input.type,
            currentValue: narration.input.value as T | undefined,
        }),
        placeholderData: keepPreviousData,
    });
}

type DialogueModel = {
    animatedText?: string;
    text?: string;
    character?: CharacterInterface;
    lastText?: string;
};
const DIALOGUE_USE_QUERY_KEY = "dialogue_use_query_key";
export function useQueryDialogue() {
    const { t } = useTranslation(["narration"]);
    const queryClient = useQueryClient();
    const forceComplete = useSelector(TextDisplaySettings.store, (state) => state.forceComplete);

    const finalizeDialogue = useCallback(() => {
        queryClient.setQueryData<DialogueModel>(
            [NARRATION_DATA_USE_QUERY_KEY, DIALOGUE_USE_QUERY_KEY],
            (prev) => {
                if (!prev) return prev;
                const fullText = (prev.text || "") + (prev.animatedText || "");
                return {
                    ...prev,
                    text: fullText || undefined,
                    animatedText: undefined,
                };
            },
        );
    }, [queryClient]);

    const query = useQuery<DialogueModel>({
        queryKey: [NARRATION_DATA_USE_QUERY_KEY, DIALOGUE_USE_QUERY_KEY],
        queryFn: async ({ queryKey }) => {
            const dialogue = narration.dialogue;
            let text = dialogue?.text;
            if (Array.isArray(text)) {
                text = text.map((text) => t(text)).join(" ");
            } else if (typeof text === "string") {
                text = t(text);
            }
            let character = dialogue?.character;
            if (typeof character === "string") {
                character = {
                    id: character,
                    name: t(character),
                } as CharacterInterface;
            }

            const prevData = queryClient.getQueryData<DialogueModel>(queryKey) || {};
            const oldText = (prevData.text || "") + (prevData.animatedText || "");
            if (text && character?.id === prevData?.character?.id && text.startsWith(oldText)) {
                const newText = text.slice(oldText.length);
                if (!newText && oldText && character === prevData?.character) {
                    return prevData;
                }
                return {
                    animatedText: newText,
                    lastText: newText,
                    text: oldText,
                    character: character,
                };
            }

            return {
                animatedText: text,
                lastText: text,
                character: character,
            };
        },
        placeholderData: keepPreviousData,
        select: forceComplete
            ? (data) => ({
                  ...data,
                  text: (data.text || "") + (data.animatedText || "") || undefined,
                  animatedText: undefined,
              })
            : undefined,
    });

    return { ...query, finalizeDialogue };
}

const CAN_GO_NEXT_USE_QUERY_KEY = "can_go_next_use_query_key";
export function useQueryCanGoNext() {
    return useQuery({
        queryKey: [NARRATION_DATA_USE_QUERY_KEY, CAN_GO_NEXT_USE_QUERY_KEY],
        queryFn: async () => narration.canContinue && !narration.isRequiredInput,
    });
}

const NARRATIVE_HISTORY_USE_QUERY_KEY = "narrative_history_use_query_key";
export function useQueryNarrativeHistory({ searchString }: { searchString?: string }) {
    const { t } = useTranslation(["narration"]);
    const normalizedSearch = searchString?.toLowerCase().trim();

    return useQuery({
        queryKey: [NARRATION_DATA_USE_QUERY_KEY, NARRATIVE_HISTORY_USE_QUERY_KEY],
        queryFn: async () => {
            const promises = stepHistory.narrativeHistory.map(async (step) => {
                const character = step.dialogue?.character;
                let icon: string | undefined;
                let characterName: string | undefined;
                if (typeof character === "string") {
                    characterName = t(character);
                } else {
                    characterName = character?.name
                        ? character.name + (character.surname ? ` ${character.surname}` : "")
                        : undefined;
                    icon = character?.icon;
                }
                let text = step.dialogue?.text;
                if (Array.isArray(text)) {
                    text = text.map((text) => t(text)).join(" ");
                } else if (typeof text === "string") {
                    text = t(text);
                }
                return {
                    character: characterName,
                    text: text || "",
                    icon: icon,
                    choices: step.choices,
                    inputValue: step.inputValue,
                };
            });
            return Promise.all(promises);
        },
        select: (data) => {
            if (!normalizedSearch) {
                return data;
            }
            return data.filter((item) => {
                return (
                    item.character?.toLowerCase().includes(normalizedSearch) ||
                    item.text?.toLowerCase().includes(normalizedSearch)
                );
            });
        },
        placeholderData: keepPreviousData,
    });
}
