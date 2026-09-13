import packageJson from "@/../package.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CANVAS_UI_LAYER_NAME, overlayTextShadowClass } from "@/constants";
import { useNarrationFunctions } from "@/lib/hooks/narration-hooks";
import { useSetSearchParamState } from "@/lib/hooks/navigation-hooks";
import { useGameProps } from "@/lib/hooks/props-hooks";
import { useQuit } from "@/lib/hooks/quit-hooks";
import { useQueryLastSave } from "@/lib/query/save-query";
import { GameStatus } from "@/lib/stores/game-status-store";
import { cn } from "@/lib/utils";
import { autoExit, save } from "@/lib/utils/save-utility";
import { canvas, ImageSprite } from "@drincs/pixi-vn";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { AlertCircle, CirclePlay, LogOut, Play, Save, Settings } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const menuButtonClass =
    "justify-start hover:scale-105 focus-visible:scale-105 transition-transform duration-150 ease-out";

export function MainMenu() {
    const gameProps = useGameProps();
    const { uiTransition: t, navigate } = gameProps;
    const setSettings = useSetSearchParamState<boolean>("settings");
    const setSettingsTab = useSetSearchParamState<string>("settings_tab");
    const { startNewGame } = useNarrationFunctions();
    const loading = useSelector(GameStatus.store, (state) => state.loading);
    const menuRef = useRef<HTMLDivElement>(null);
    const { quit, canQuit } = useQuit();

    /** Returns all enabled menuitem buttons inside the menu container. */
    function getMenuItems(): HTMLButtonElement[] {
        if (!menuRef.current) return [];
        return Array.from(
            menuRef.current.querySelectorAll<HTMLButtonElement>(
                "button[role='menuitem']:not(:disabled)",
            ),
        );
    }

    /** Arrow-key navigation between menu items. */
    function focusMenuItem(direction: "up" | "down" | "home" | "end") {
        const items = getMenuItems();
        if (!items.length) return;

        const active = document.activeElement as HTMLElement;
        const currentIndex = items.indexOf(active as HTMLButtonElement);

        let next = -1;
        if (direction === "down") {
            next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        } else if (direction === "up") {
            next = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        } else if (direction === "home") {
            next = 0;
        } else if (direction === "end") {
            next = items.length - 1;
        }
        if (next !== -1) {
            items[next].focus();
        }
    }

    useHotkeys([
        {
            hotkey: "ArrowDown",
            callback: () => focusMenuItem("down"),
            options: {
                preventDefault: true,
                meta: {
                    name: t("menu_navigation"),
                    description: t("menu_navigation_down_description"),
                },
            },
        },
        {
            hotkey: "ArrowUp",
            callback: () => focusMenuItem("up"),
            options: {
                preventDefault: true,
                meta: {
                    name: t("menu_navigation"),
                    description: t("menu_navigation_up_description"),
                },
            },
        },
        {
            hotkey: "Home",
            callback: () => focusMenuItem("home"),
            options: {
                preventDefault: true,
                meta: {
                    name: t("menu_navigation"),
                    description: t("menu_navigation_home_description"),
                },
            },
        },
        {
            hotkey: "End",
            callback: () => focusMenuItem("end"),
            options: {
                preventDefault: true,
                meta: {
                    name: t("menu_navigation"),
                    description: t("menu_navigation_end_description"),
                },
            },
        },
    ]);

    useEffect(() => {
        const bg = new ImageSprite({}, "images_main-menu");
        bg.load();
        const layer = canvas.getLayer(CANVAS_UI_LAYER_NAME);
        if (layer) {
            layer.addChild(bg);
        }

        // Auto-focus the first enabled button so arrow-key navigation works immediately.
        const firstItem = menuRef.current?.querySelector<HTMLButtonElement>(
            "button[role='menuitem']:not(:disabled)",
        );
        firstItem?.focus();

        return () => {
            canvas.getLayer(CANVAS_UI_LAYER_NAME)?.removeChildren();
        };
    }, []);

    return (
        <div className="relative h-full w-full flex items-center justify-start p-3 sm:p-6 md:p-10">
            {/* Buttons card – semi-transparent, fade-in from left on mount */}
            <Card className="relative z-10 w-full max-w-xs sm:max-w-sm bg-background/70 backdrop-blur-sm animate-in fade-in slide-in-from-left-10 duration-500 ease-out fill-mode-both">
                <CardContent ref={menuRef} role="menu" className="flex flex-col gap-2 pt-4">
                    <ContinueMenuButton
                        disabled={loading}
                        onLoadingChange={GameStatus.setLoading}
                    />

                    <Button
                        role="menuitem"
                        onClick={async () => {
                            GameStatus.setLoading(true);
                            await navigate({ to: "/game/narration" });
                            startNewGame("start");
                        }}
                        disabled={loading}
                        className={menuButtonClass}
                    >
                        <Play className="size-4" />
                        {t("start")}
                    </Button>

                    <Button
                        role="menuitem"
                        onClick={() => {
                            setSettings(true);
                            setSettingsTab("menus/save-load");
                        }}
                        disabled={loading}
                        variant="outline"
                        className={menuButtonClass}
                    >
                        <Save className="size-4" />
                        {t("load")}
                    </Button>

                    <Button
                        role="menuitem"
                        onClick={() => setSettings(true)}
                        disabled={loading}
                        variant="outline"
                        className={menuButtonClass}
                    >
                        <Settings className="size-4" />
                        {t("settings")}
                    </Button>

                    {canQuit && (
                        <Button
                            role="menuitem"
                            onClick={quit}
                            disabled={loading}
                            variant="outline"
                            className={menuButtonClass}
                        >
                            <LogOut className="size-4" />
                            {t("quit")}
                        </Button>
                    )}

                    {loading ? (
                        <div
                            className="flex items-center justify-end pt-1 text-muted-foreground"
                            aria-live="polite"
                        >
                            <Spinner />
                            <span className="sr-only">Loading</span>
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            {/* Game name + version – bottom right, outlined for readability on any bg */}
            <div className="absolute bottom-3 right-3 z-0 text-right pointer-events-none">
                <p className={cn("text-xs font-semibold text-white", overlayTextShadowClass)}>
                    {packageJson.name}
                </p>
                <p className={cn("text-[0.65rem] text-white/80", overlayTextShadowClass)}>
                    v{packageJson.version}
                </p>
            </div>
        </div>
    );
}

export function ContinueMenuButton({
    disabled = false,
    onLoadingChange,
}: {
    /** Disables the button when another action is in progress. */
    disabled?: boolean;
    /** Called when the continue action starts or finishes loading. */
    onLoadingChange?: (loading: boolean) => void;
}) {
    const { data: lastSave = null, isLoading } = useQueryLastSave();
    const { t } = useTranslation(["ui"]);
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const hasAutoExitSave = lastSave?.id === -1;

    const handleClick = useCallback(() => {
        if (!lastSave) return;
        setLoading(true);
        onLoadingChange?.(true);
        (hasAutoExitSave ? autoExit.load() : save.restore(lastSave))
            .then(() => queryClient.invalidateQueries())
            .catch((e) => {
                toast.error(t("fail_load"));
                console.error(e);
            })
            .finally(() => {
                setLoading(false);
                onLoadingChange?.(false);
            });
    }, [lastSave, hasAutoExitSave, queryClient, t, onLoadingChange]);

    const isDisabled = (!isLoading && !lastSave) || loading || disabled;

    const buttonContent = (
        <>
            {isLoading || loading ? (
                <Spinner className="size-4" />
            ) : (
                <CirclePlay className="size-4" />
            )}
            {t("continue")}
            {hasAutoExitSave ? (
                <AlertCircle aria-hidden="true" className="ml-1 size-4 text-orange-500" />
            ) : null}
        </>
    );

    if (hasAutoExitSave) {
        return (
            <Tooltip>
                <TooltipTrigger
                    render={
                        <Button
                            role="menuitem"
                            onClick={handleClick}
                            disabled={isDisabled}
                            className={menuButtonClass}
                        >
                            {buttonContent}
                        </Button>
                    }
                />
                <TooltipContent>{t("continue_auto_exit_save_tooltip")}</TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Button
            role="menuitem"
            onClick={handleClick}
            disabled={isDisabled}
            className={menuButtonClass}
        >
            {buttonContent}
        </Button>
    );
}
