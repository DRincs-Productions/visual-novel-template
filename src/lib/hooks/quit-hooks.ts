import { useAlertDialog } from "@/components/providers/alert-dialog-provider";
import { isAvailable as isRovesAvailable } from "@drincs/roves-api/core";
import { exit as exitRoves } from "@drincs/roves-api/process";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useQuit() {
    const { openAlertDialog } = useAlertDialog();
    const { t } = useTranslation(["ui"]);

    const canQuit = isRovesAvailable();

    const quit = useCallback(() => {
        openAlertDialog({
            head: t("quit"),
            content: t("quit_confirm"),
            onConfirm: async () => {
                await exitRoves();
                return true;
            },
        });
    }, [openAlertDialog, t]);

    return { quit, canQuit };
}
