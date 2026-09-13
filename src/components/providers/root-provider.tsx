import { AlertDialogProvider } from "@/components/providers/alert-dialog-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSaveHotkeys, useSettingsHotkeys } from "@/lib/hooks/hotkeys-hooks";
import { useTestingBridge } from "@/lib/hooks/testing-hooks";
import { Game } from "@drincs/pixi-vn";
import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { useNavigate } from "@tanstack/react-router";

export function RootProvider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    Game.onNavigate((to) => navigate({ to }));

    return (
        <ThemeProvider>
            <HotkeysProvider
                defaultOptions={{
                    hotkey: { preventDefault: true },
                }}
            >
                <AlertDialogProvider>
                    <TooltipProvider>
                        <Hotkeys />
                        {import.meta.env.DEV && <TestingBridge />}
                        {children}
                    </TooltipProvider>
                </AlertDialogProvider>
                <Toaster position="top-center" />
            </HotkeysProvider>
        </ThemeProvider>
    );
}

function Hotkeys() {
    useSaveHotkeys();
    useSettingsHotkeys();
    return null;
}

function TestingBridge() {
    useTestingBridge();
    return null;
}
