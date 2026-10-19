import { DelayedAnimatedDots } from "@/components/loading";
import { useAlertDialog } from "@/components/providers/alert-dialog-provider";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { useNarrationFunctions } from "@/lib/hooks/narration-hooks";
import { useSetSearchParamState } from "@/lib/hooks/navigation-hooks";
import { useGameProps } from "@/lib/hooks/props-hooks";
import { useWheelActions } from "@/lib/hooks/quick-tools-hooks";
import { useQueryCanGoBack } from "@/lib/query/narration-query";
import {
    LAST_SAVE_USE_QUERY_KEY,
    SAVES_USE_QUERY_KEY,
    useQueryLastSave,
} from "@/lib/query/save-query";
import { AutoSettings } from "@/lib/stores/auto-settings-store";
import { GameStatus } from "@/lib/stores/game-status-store";
import { SkipSettings } from "@/lib/stores/skip-settings-store";
import { TextDisplaySettings } from "@/lib/stores/text-display-settings-store";
import { cn } from "@/lib/utils";
import { quickSave, save } from "@/lib/utils/save-utility";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function QuickTools() {
    const { t } = useTranslation(["ui"]);
    const skipEnabled = useSelector(SkipSettings.store, (state) => state.enabled);
    const autoEnabled = useSelector(AutoSettings.store, (state) => state.enabled);
    const queryClient = useQueryClient();
    const { data: lastSave = null } = useQueryLastSave();
    const { data: canGoBack = false } = useQueryCanGoBack();
    const nextStepLoading = useSelector(GameStatus.store, (state) => state.loading);
    // The typewriter shows its own dots while animating, so only show these when it isn't.
    const typewriterInProgress = useSelector(
        TextDisplaySettings.store,
        (state) => state.inProgress,
    );
    const { goBack } = useNarrationFunctions();
    const { openAlertDialog } = useAlertDialog();
    const gameProps = useGameProps();
    useWheelActions();
    const setHistory = useSetSearchParamState<boolean>("history");
    const setSaves = useSetSearchParamState<boolean>("saves");
    const setSettings = useSetSearchParamState<boolean>("settings");
    const setSettingsTab = useSetSearchParamState<string>("settings_tab");

    return (
        <div className={cn("flex flex-wrap items-center justify-end gap-0.5 sm:gap-1")}>
            {nextStepLoading && !typewriterInProgress && (
                <div className="mr-auto flex items-center pl-1">
                    <DelayedAnimatedDots />
                </div>
            )}
            <Button
                variant="ghost"
                size="xs"
                className="h-5 px-1 text-[10px] sm:h-6 sm:px-2 sm:text-xs"
                onClick={() => {
                    if (skipEnabled) {
                        SkipSettings.setEnabled(false);
                    }
                    goBack();
                }}
                disabled={!canGoBack || nextStepLoading}
            >
                {t("back")}
            </Button>
            <Button
                variant="ghost"
                size="xs"
                className="h-5 px-1 text-[10px] sm:h-6 sm:px-2 sm:text-xs"
                onClick={() => {
                    setHistory(undefined);
                    setSettings(true);
                    setSettingsTab("menus/history");
                }}
            >
                {t("history")}
            </Button>
            <Toggle
                size="sm"
                className="h-5 min-w-0 px-1 text-[10px] sm:h-7 sm:px-2.5 sm:text-[0.8rem]"
                pressed={skipEnabled}
                onPressedChange={(v) => SkipSettings.setEnabled(v)}
            >
                {t("skip")}
            </Toggle>
            <Toggle
                size="sm"
                className="h-5 min-w-0 px-1 text-[10px] sm:h-7 sm:px-2.5 sm:text-[0.8rem]"
                pressed={autoEnabled}
                onPressedChange={(v) => AutoSettings.setEnabled(v)}
                disabled={skipEnabled}
            >
                {t("auto_forward_time_restricted")}
            </Toggle>
            <Button
                variant="ghost"
                size="xs"
                className="h-5 px-1 text-[10px] sm:h-6 sm:px-2 sm:text-xs"
                onClick={() => {
                    setSaves(undefined);
                    setSettings(true);
                    setSettingsTab("menus/save-load");
                }}
            >
                {t(`${t("save")}/${t("load")}`)}
            </Button>
            <Button
                variant="ghost"
                size="xs"
                className="h-5 px-1 text-[10px] sm:h-6 sm:px-2 sm:text-xs"
                onClick={() => {
                    const savePromise = quickSave().then((save) => {
                        queryClient.setQueryData([SAVES_USE_QUERY_KEY, save.id], save);
                        queryClient.setQueryData([LAST_SAVE_USE_QUERY_KEY], save);
                    });
                    toast.promise(savePromise, {
                        loading: t("saving"),
                        success: t("success_save"),
                        error: t("fail_save"),
                    });
                }}
            >
                {t("quick_save_restricted")}
            </Button>
            <Button
                variant="ghost"
                size="xs"
                className="h-5 px-1 text-[10px] sm:h-6 sm:px-2 sm:text-xs"
                onClick={() => {
                    if (!lastSave) return;
                    openAlertDialog({
                        head: t("load"),
                        content: t("you_sure_to_load_save", {
                            name: lastSave.name || save.getSlotLabel(lastSave.id, t),
                        }),
                        onConfirm: () =>
                            save
                                .restore(lastSave)
                                .then(() => {
                                    gameProps.invalidateInterfaceData();
                                    toast.success(t("success_load"));
                                    return true;
                                })
                                .catch((e) => {
                                    toast.error(t("fail_load"));
                                    console.error(e);
                                    return false;
                                }),
                    });
                }}
                disabled={!lastSave}
            >
                {t("load_last_save_restricted")}
            </Button>
            <Button
                variant="ghost"
                size="xs"
                className="h-5 px-1 text-[10px] sm:h-6 sm:px-2 sm:text-xs"
                onClick={() => setSettings(true)}
            >
                {t("settings_restricted")}
            </Button>
        </div>
    );
}
