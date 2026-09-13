import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguageSettings } from "@/lib/hooks/language-settings-hooks";
import { downloadResourceToTranslate } from "@/lib/i18n";
import {
    IS_FULL_SCREEN_MODE_USE_QUERY_KEY,
    useQueryIsFullModeScreen,
} from "@/lib/query/settings-query";
import { TextDisplaySettings } from "@/lib/stores/text-display-settings-store";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import {
    DownloadIcon,
    FullscreenIcon,
    Minimize2Icon,
    MonitorIcon,
    MoonIcon,
    SunIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function SystemControls() {
    return (
        <div className="flex flex-col gap-4">
            <FullScreenSettings />
            <ModeToggle />
            <LanguageSettings />
            <TextSizeSettings />
        </div>
    );
}

export function TextSizeSettings() {
    const { t } = useTranslation(["ui"]);
    const fontSize = useSelector(TextDisplaySettings.store, (state) => state.fontSize);

    return (
        <div className="flex flex-col gap-1.5">
            <div>
                <p className="text-sm font-medium leading-none">{t("text_size")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("text_size_description")}</p>
            </div>
            <div className="flex items-center gap-2">
                <Slider
                    min={50}
                    max={200}
                    step={10}
                    value={[fontSize]}
                    onValueChange={(v) =>
                        typeof v === "number" && TextDisplaySettings.setFontSize(v)
                    }
                    className="flex-1"
                />
                <span className="w-14 text-right text-xs tabular-nums">{fontSize}%</span>
            </div>
            <div className="flex justify-between px-1 text-xs text-muted-foreground">
                <span>50%</span>
                <span>200%</span>
            </div>
        </div>
    );
}

export function ModeToggle() {
    const { setTheme, theme } = useTheme();
    const { t } = useTranslation(["ui"]);

    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
                <p className="text-sm font-medium leading-none">{t("theme_mode")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("theme_mode_description")}</p>
            </div>
            <ButtonGroup className="shrink-0">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger render={<span />}>
                            <Toggle
                                size="sm"
                                pressed={theme === "light"}
                                onPressedChange={() => setTheme("light")}
                                aria-label="Light Mode"
                            >
                                <SunIcon />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>Light Mode</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger render={<span />}>
                            <Toggle
                                size="sm"
                                pressed={theme === "system"}
                                onPressedChange={() => setTheme("system")}
                                aria-label="System Mode"
                            >
                                <MonitorIcon />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>System Mode</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger render={<span />}>
                            <Toggle
                                size="sm"
                                pressed={theme === "dark"}
                                onPressedChange={() => setTheme("dark")}
                                aria-label="Dark Mode"
                            >
                                <MoonIcon />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>Dark Mode</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </ButtonGroup>
        </div>
    );
}

export function FullScreenSettings() {
    const { data: isFullScreenMode } = useQueryIsFullModeScreen();
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const { t } = useTranslation(["ui"]);

    if (document.fullscreenEnabled === false) {
        return null;
    }

    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
                <p className="text-sm font-medium leading-none">{t("fullscreen")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("fullscreen_description")}</p>
            </div>
            <Button
                variant="outline"
                size="sm"
                disabled={loading}
                className="shrink-0"
                onClick={() => {
                    setLoading(true);
                    const promise = isFullScreenMode
                        ? document.exitFullscreen()
                        : document.documentElement.requestFullscreen();
                    promise.finally(() => {
                        setLoading(false);
                        queryClient.invalidateQueries({
                            queryKey: [IS_FULL_SCREEN_MODE_USE_QUERY_KEY],
                        });
                    });
                }}
            >
                {isFullScreenMode ? <Minimize2Icon /> : <FullscreenIcon />}
                {isFullScreenMode ? t("exit_fullscreen") : t("enter_fullscreen")}
            </Button>
        </div>
    );
}

export function LanguageSettings() {
    const { t } = useTranslation(["ui"]);
    const { selectedLang, displayLabel, handleChange, languageOptions } = useLanguageSettings();

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                    <p className="text-sm font-medium leading-none">{t("language")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t("language_description")}
                    </p>
                </div>
                {!import.meta.env.PROD && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger render={<span />}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        downloadResourceToTranslate();
                                    }}
                                    aria-label={t("download_locale")}
                                >
                                    <DownloadIcon />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("download_locale")}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            <Select value={selectedLang} onValueChange={handleChange}>
                <SelectTrigger className="w-full">
                    {/* Render display name explicitly so the trigger always shows text, not the value code */}
                    <SelectValue>{displayLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {languageOptions.map(({ label, value }) => (
                        <SelectItem key={value} value={value}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
