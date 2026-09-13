import { useAlertDialog } from "@/components/providers/alert-dialog-provider";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { useSetSearchParamState } from "@/lib/hooks/navigation-hooks";
import { useQuit } from "@/lib/hooks/quit-hooks";
import { Game } from "@drincs/pixi-vn";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
    Gamepad2Icon,
    HistoryIcon,
    LogOutIcon,
    PowerIcon,
    SaveIcon,
    StethoscopeIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export function QuickMenus() {
    const location = useLocation();
    const isInGame = location.pathname.startsWith("/game");

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {isInGame && <OpenHistorySettingButton />}
                <SaveLoadMenuButton />
                <OpenControlsListSettingButton />
                <OpenDiagnosticsSettingButton />
            </div>
            {isInGame && <Separator />}
            {isInGame && <ReturnMainMenuButton />}
            <QuitButton />
        </div>
    );
}

export function OpenControlsListSettingButton() {
    const { t } = useTranslation(["ui"]);
    const setSettingsOpen = useSetSearchParamState<boolean>("settings");
    const setSettingsTab = useSetSearchParamState<string>("settings_tab");

    return (
        <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
                setSettingsOpen(true);
                setSettingsTab("menus/controls");
            }}
        >
            <Gamepad2Icon />
            {t("hotkeys_menu")}
            <KbdGroup className="ml-auto">
                <Kbd>Ctrl</Kbd>
                <Kbd>K</Kbd>
            </KbdGroup>
        </Button>
    );
}

export function OpenDiagnosticsSettingButton() {
    const { t } = useTranslation(["ui"]);
    const setSettingsOpen = useSetSearchParamState<boolean>("settings");
    const setSettingsTab = useSetSearchParamState<string>("settings_tab");

    return (
        <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
                setSettingsOpen(true);
                setSettingsTab("menus/diagnostics");
            }}
        >
            <StethoscopeIcon />
            {t("diagnostics")}
            <KbdGroup className="ml-auto">
                <Kbd>F8</Kbd>
            </KbdGroup>
        </Button>
    );
}

export function ReturnMainMenuButton() {
    const navigate = useNavigate();
    const { t } = useTranslation(["ui"]);
    const setOpenSettings = useSetSearchParamState<boolean>("settings");
    const { openAlertDialog } = useAlertDialog();

    return (
        <Button
            variant="destructive"
            onClick={() => {
                openAlertDialog({
                    head: t("attention"),
                    content: t("you_sure_to_return_main_menu"),
                    onConfirm: () => {
                        Game.clear();
                        navigate({ to: "/" });
                        setOpenSettings(false);
                        return true;
                    },
                });
            }}
        >
            <LogOutIcon />
            {t("return_main_menu")}
        </Button>
    );
}

export function OpenHistorySettingButton() {
    const { t } = useTranslation(["ui"]);
    const setSettings = useSetSearchParamState<boolean>("settings");
    const setSettingsTab = useSetSearchParamState<string>("settings_tab");

    return (
        <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
                setSettings(true);
                setSettingsTab("menus/history");
            }}
        >
            <HistoryIcon />
            {t("history")}
            <KbdGroup className="ml-auto">
                <Kbd>Ctrl</Kbd>
                <Kbd>H</Kbd>
            </KbdGroup>
        </Button>
    );
}

export function QuitButton() {
    const { t } = useTranslation(["ui"]);
    const { quit, canQuit } = useQuit();

    if (!canQuit) return null;

    return (
        <Button variant="destructive" onClick={quit}>
            <PowerIcon />
            {t("quit")}
        </Button>
    );
}

export function SaveLoadMenuButton() {
    const { t } = useTranslation(["ui"]);
    const setSettingsOpen = useSetSearchParamState<boolean>("settings");
    const setSettingsTab = useSetSearchParamState<string>("settings_tab");

    return (
        <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
                setSettingsOpen(true);
                setSettingsTab("menus/save-load");
            }}
        >
            <SaveIcon />
            {t(`${t("save")}/${t("load")}`)}
            <KbdGroup className="ml-auto">
                <Kbd>F5</Kbd>
                <Kbd>F9</Kbd>
            </KbdGroup>
        </Button>
    );
}
