import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Skeleton } from "@/components/ui/skeleton";
import { overlayTextShadowClass } from "@/constants";
import { useSaveActions } from "@/lib/hooks/save-hooks";
import { useQuerySaves } from "@/lib/query/save-query";
import { cn } from "@/lib/utils";
import { save } from "@/lib/utils/save-utility";
import type { FileRouteTypes } from "@/routeTree.gen";
import { useLocation } from "@tanstack/react-router";
import { Download, Save, SquarePen, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SaveSlot({ saveId }: { saveId: number }) {
    const { t } = useTranslation(["ui"]);
    const { isLoading, data: saveData, isError } = useQuerySaves({ id: saveId });
    const location = useLocation();
    const { handleLoad, handleDelete, handleSave, handleOverwriteSave } = useSaveActions();

    const isHome = (location.pathname as FileRouteTypes["fullPaths"]) === "/";

    if (isLoading) {
        return (
            <AspectRatio ratio={16 / 9} className="m-2 sm:m-4 md:m-2 lg:m-4 rounded">
                <Skeleton className="absolute inset-0" />
            </AspectRatio>
        );
    }

    if (!saveData || isError) {
        return (
            <AspectRatio ratio={16 / 9} className="m-2 sm:m-4 md:m-2 lg:m-4 rounded">
                <Button
                    variant="ghost"
                    className="absolute inset-0 h-full w-full ring-1 ring-border"
                    onClick={() => handleSave(saveId)}
                    disabled={isHome}
                    aria-label={t("save")}
                >
                    <Save className="size-12 opacity-20" />
                </Button>
            </AspectRatio>
        );
    }

    return (
        <AspectRatio
            ratio={16 / 9}
            className="m-2 overflow-hidden sm:m-4 md:m-2 lg:m-4 rounded cursor-pointer"
            onClick={() => handleLoad({ ...saveData, id: saveId })}
        >
            <Image
                src={saveData.image}
                layout="fullWidth"
                alt={saveData.name}
                className="absolute inset-0 size-full object-contain pointer-events-none select-none rounded-md"
            />
            {/* top-left metadata */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-0.5 pointer-events-none">
                <span
                    className={cn(
                        "text-base font-semibold text-neutral-300",
                        overlayTextShadowClass,
                    )}
                >
                    {saveData.name}
                </span>
                <span className={cn("text-sm text-neutral-300", overlayTextShadowClass)}>
                    {saveData.date.toLocaleDateString()}
                </span>
                <span className={cn("text-sm text-neutral-300", overlayTextShadowClass)}>
                    {saveData.date.toLocaleTimeString()}
                </span>
                <span className={cn("text-sm text-neutral-300", overlayTextShadowClass)}>
                    {save.getSlotLabel(saveId, t)}
                </span>
            </div>
            {/* top-right delete */}
            <div className="absolute top-2.5 right-2.5">
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(saveId);
                    }}
                    aria-label={t("delete")}
                >
                    <Trash2 className={overlayTextShadowClass} />
                </Button>
            </div>
            {/* bottom-right actions */}
            <div className="absolute bottom-2.5 right-2.5 flex flex-row gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        save.download(saveData);
                    }}
                    aria-label={t("save_to_file")}
                >
                    <Download className={overlayTextShadowClass} />
                </Button>
                {!isHome && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOverwriteSave(saveId, saveData.name);
                        }}
                        aria-label={t("save")}
                    >
                        <SquarePen className={overlayTextShadowClass} />
                    </Button>
                )}
            </div>
        </AspectRatio>
    );
}
