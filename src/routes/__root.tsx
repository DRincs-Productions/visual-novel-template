import { PendingComponent } from "@/components/loading";
import { SettingsDialogue } from "@/components/menus/settings";
import { OfflineAllert } from "@/components/modals/error-allerts";
import { RootProvider } from "@/components/providers/root-provider";
import { useConfirmBackNavigation } from "@/lib/hooks/navigation-hooks";
import { useAutoSaveOnPageClose } from "@/lib/hooks/save-hooks";
import { useI18n } from "@/lib/i18n";
import { SearchParams } from "@/lib/stores/search-param-store";
import { defineAssets } from "@/lib/utils/assets-utility";
import { gameDB } from "@/lib/utils/db-utility";
import { autoExit } from "@/lib/utils/save-utility";
import type { RouterContext } from "@/router";
import { narration } from "@drincs/pixi-vn";
import { setupPixivnViteData } from "@drincs/pixi-vn/vite-listener";
import { createRootRouteWithContext, ErrorComponent, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const DevDevtools = import.meta.env.DEV ? lazy(() => import("@/components/dev-devtools")) : null;

export const Route = createRootRouteWithContext<RouterContext>()({
    validateSearch: (search) => SearchParams.setMany(search),
    component: RootComponent,
    pendingComponent: PendingComponent,
    loader: async ({ context, location }) => {
        // Game.onNavigate(async (to) => redirect({ to }));
        await Promise.all([import("@/content"), gameDB.init(), defineAssets(), useI18n()]);
        await setupPixivnViteData();
        if (location.pathname !== "/" && narration.stepCounter === 0) {
            const isAutoExitSaveExist = await autoExit.load();
            if (isAutoExitSaveExist) {
                await context.queryClient.invalidateQueries();
            }
        }
    },
    errorComponent: (props) => (
        <div className="bg-background pointer-events-auto hover:text-foreground">
            <ErrorComponent {...props} />
        </div>
    ),
});

function RootComponent() {
    useAutoSaveOnPageClose();
    useConfirmBackNavigation();

    return (
        <>
            <RootProvider>
                <SettingsDialogue />
                <OfflineAllert />
                <Outlet />
            </RootProvider>

            {DevDevtools && (
                <Suspense>
                    <DevDevtools />
                </Suspense>
            )}
        </>
    );
}
