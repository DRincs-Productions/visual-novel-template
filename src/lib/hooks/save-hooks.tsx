import { SaveNameInput } from "@/components/menus/save-menu/save-forms";
import { useAlertDialog } from "@/components/providers/alert-dialog-provider";
import { useSetSearchParamState } from "@/lib/hooks/navigation-hooks";
import { useGameProps } from "@/lib/hooks/props-hooks";
import { LAST_SAVE_USE_QUERY_KEY, SAVES_USE_QUERY_KEY } from "@/lib/query/save-query";
import { autoExit, save } from "@/lib/utils/save-utility";
import type GameSaveData from "@/models/GameSaveData";
import type { FileRouteTypes } from "@/routeTree.gen";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function useSaveActions() {
    const setSettingsOpen = useSetSearchParamState<boolean>("settings");
    const setSettingsTab = useSetSearchParamState<string>("settings_tab");
    const { t } = useTranslation(["ui"]);
    const gameProps = useGameProps();
    const queryClient = useQueryClient();
    const { openAlertDialog } = useAlertDialog();
    const tempSaveNameRef = useRef<string>("");

    const handleLoad = useCallback(
        (data: GameSaveData & { id: number }) => {
            openAlertDialog({
                head: t("load"),
                content: t("you_sure_to_load_save", {
                    name: data.name || save.getSlotLabel(data.id, t),
                }),
                onConfirm: () =>
                    save
                        .restore(data)
                        .then(() => {
                            gameProps.invalidateInterfaceData();
                            toast.success(t("success_load"));
                            setSettingsTab(undefined);
                            setSettingsOpen(undefined);
                            return true;
                        })
                        .catch((e) => {
                            toast.error(t("fail_load"));
                            console.error(e);
                            return false;
                        }),
            });
        },
        [openAlertDialog, t, gameProps, setSettingsOpen, setSettingsTab],
    );

    const handleDelete = useCallback(
        (id: number) => {
            openAlertDialog({
                head: t("delete"),
                content: t("you_sure_to_delete_save", {
                    name: save.getSlotLabel(id, t),
                }),
                onConfirm: () =>
                    save
                        .remove(id)
                        .then(() => {
                            queryClient.setQueryData([SAVES_USE_QUERY_KEY, id], null);
                            queryClient.invalidateQueries({ queryKey: [LAST_SAVE_USE_QUERY_KEY] });
                            toast.success(t("success_delete"));
                            return true;
                        })
                        .catch((e) => {
                            toast.error(t("fail_delete"));
                            console.error(e);
                            return false;
                        }),
            });
        },
        [openAlertDialog, t, queryClient],
    );

    const handleSave = useCallback(
        (id: number) => {
            tempSaveNameRef.current = "";
            openAlertDialog({
                head: t("save"),
                content: (
                    <SaveNameInput
                        initialValue=""
                        onValueChange={(v) => {
                            tempSaveNameRef.current = v;
                        }}
                    />
                ),
                onConfirm: () => {
                    const savePromise = save({
                        id,
                        name: tempSaveNameRef.current,
                    }).then((save) => {
                        queryClient.setQueryData([SAVES_USE_QUERY_KEY, save.id], save);
                        queryClient.setQueryData([LAST_SAVE_USE_QUERY_KEY], save);
                    });
                    toast.promise(savePromise, {
                        loading: t("saving"),
                        success: t("success_save"),
                        error: t("fail_save"),
                    });
                    return savePromise
                        .then(() => true)
                        .catch((e) => {
                            console.error(e);
                            return false;
                        });
                },
            });
        },
        [openAlertDialog, t, queryClient],
    );

    const handleOverwriteSave = useCallback(
        (id: number, existingName: string) => {
            tempSaveNameRef.current = existingName;
            openAlertDialog({
                head: t("overwrite_save"),
                content: (
                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-destructive">
                            {t("you_sure_to_overwrite_save")}
                        </p>
                        <SaveNameInput
                            initialValue={existingName}
                            onValueChange={(v) => {
                                tempSaveNameRef.current = v;
                            }}
                        />
                    </div>
                ),
                onConfirm: () => {
                    const savePromise = save({
                        id,
                        name: tempSaveNameRef.current,
                    }).then((save) => {
                        queryClient.setQueryData([SAVES_USE_QUERY_KEY, save.id], save);
                        queryClient.setQueryData([LAST_SAVE_USE_QUERY_KEY], save);
                    });
                    toast.promise(savePromise, {
                        loading: t("saving"),
                        success: t("success_save"),
                        error: t("fail_save"),
                    });
                    return savePromise
                        .then(() => true)
                        .catch((e) => {
                            console.error(e);
                            return false;
                        });
                },
            });
        },
        [openAlertDialog, t, queryClient],
    );

    return {
        handleLoad,
        handleDelete,
        handleSave,
        handleOverwriteSave,
    };
}

/**
 * useAutoSaveOnPageClose
 *
 * Trigger a refresh/save when the user is about to leave the page or when the
 * document becomes hidden. Skips the root path (`/`).
 *
 * This hook does not return a value.
 */
export function useAutoSaveOnPageClose(): void {
    const location = useLocation();

    const callback = useCallback(() => {
        if ((location.pathname as FileRouteTypes["fullPaths"]) === "/") {
            return;
        }
        autoExit.add();
    }, [location.pathname]);

    useEffect(() => {
        const onBeforeUnload = () => callback();
        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                callback();
            }
        };

        window.addEventListener("beforeunload", onBeforeUnload);
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [callback]);
}
