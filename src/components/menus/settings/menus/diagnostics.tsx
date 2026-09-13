import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeviceDiagnostics } from "@/lib/hooks/device-diagnostics-hooks";
import {
    buildDiagnosticsReportText,
    downloadDiagnosticsReportJson,
} from "@/lib/utils/device-diagnostics-utility";
import { AlertTriangleIcon, CheckIcon, ClipboardCopyIcon, DownloadIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

function DiagnosticsSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {title}
            </h3>
            <div className="flex flex-col gap-1 rounded-lg border bg-card/80 p-3">{children}</div>
        </div>
    );
}

function DiagnosticRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium break-all">{value}</span>
        </div>
    );
}

function CapabilityRow({
    label,
    supported,
    hint,
}: {
    label: string;
    supported: boolean | null;
    hint?: string;
}) {
    const { t } = useTranslation(["ui"]);
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <div>
                <p className="font-medium">{label}</p>
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
            {supported === null ? (
                <span className="shrink-0 text-xs text-muted-foreground">
                    {t("diagnostics_unknown")}
                </span>
            ) : supported ? (
                <CheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-400" />
            ) : (
                <XIcon className="size-4 shrink-0 text-red-600 dark:text-red-400" />
            )}
        </div>
    );
}

export function DiagnosticsSettingsPage() {
    const diagnostics = useDeviceDiagnostics();
    const { t } = useTranslation(["ui"]);
    const { webgl, capabilities, mobile, native, resolution, memory, fps } = diagnostics;
    const yesNo = (value: boolean | null) =>
        value === null
            ? t("diagnostics_unknown")
            : value
              ? t("diagnostics_yes")
              : t("diagnostics_no");

    const handleCopyReport = async () => {
        try {
            await navigator.clipboard.writeText(buildDiagnosticsReportText(diagnostics));
            toast.success(t("diagnostics_report_copied"));
        } catch {
            toast.error(t("diagnostics_report_copy_failed"));
        }
    };

    const handleDownloadReport = () => {
        downloadDiagnosticsReportJson(diagnostics);
        toast.success(t("diagnostics_report_downloaded"));
    };

    return (
        <ScrollArea className="flex-1 min-h-0">
            <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleDownloadReport}>
                        <DownloadIcon />
                        {t("diagnostics_download_report")}
                    </Button>
                    <Button onClick={handleCopyReport}>
                        <ClipboardCopyIcon />
                        {t("diagnostics_copy_report")}
                    </Button>
                </div>

                {!webgl.webgl2Supported && (
                    <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertTriangleIcon className="mt-0.5 size-5 shrink-0" />
                        <p>{t("diagnostics_webgl2_missing_message")}</p>
                    </div>
                )}

                <DiagnosticsSection title={t("diagnostics_section_engine")}>
                    <DiagnosticRow
                        label={t("diagnostics_game_version")}
                        value={diagnostics.gameVersion}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_pixijs_version")}
                        value={diagnostics.pixiJsVersion}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_pixivn_version")}
                        value={diagnostics.pixiVnVersion}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_tonejs_version")}
                        value={diagnostics.toneJsVersion}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_motion_version")}
                        value={diagnostics.motionVersion}
                    />
                </DiagnosticsSection>

                <DiagnosticsSection title={t("diagnostics_section_device")}>
                    <DiagnosticRow label={t("diagnostics_platform")} value={diagnostics.platform} />
                    <DiagnosticRow
                        label={t("diagnostics_browser_engine")}
                        value={diagnostics.browserEngine}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_engine_version")}
                        value={diagnostics.engineVersion ?? t("diagnostics_unknown")}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_user_agent")}
                        value={diagnostics.userAgent}
                    />
                </DiagnosticsSection>

                <DiagnosticsSection title={t("diagnostics_section_native")}>
                    {native ? (
                        <>
                            <DiagnosticRow
                                label={t("diagnostics_os")}
                                value={`${native.osType} ${native.osVersion}`}
                            />
                            <DiagnosticRow
                                label={t("diagnostics_os_bitness")}
                                value={native.bitness}
                            />
                            <DiagnosticRow
                                label={t("diagnostics_os_architecture")}
                                value={native.architecture}
                            />
                            <DiagnosticRow
                                label={t("diagnostics_webview_version")}
                                value={native.engineVersion ?? t("diagnostics_unknown")}
                            />
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {t("diagnostics_native_unavailable")}
                        </p>
                    )}
                </DiagnosticsSection>

                <DiagnosticsSection title={t("diagnostics_section_graphics")}>
                    <DiagnosticRow
                        label={t("diagnostics_webgl1")}
                        value={yesNo(webgl.webgl1Supported)}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_webgl2")}
                        value={yesNo(webgl.webgl2Supported)}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_hardware_acceleration")}
                        value={yesNo(webgl.hardwareAccelerated)}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_gpu_vendor")}
                        value={webgl.unmaskedVendor ?? webgl.vendor ?? t("diagnostics_unknown")}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_gpu_renderer")}
                        value={webgl.unmaskedRenderer ?? webgl.renderer ?? t("diagnostics_unknown")}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_gpu_vendor_brand")}
                        value={webgl.gpuVendorBrand}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_mesa_driver")}
                        value={webgl.mesaVersion ?? t("diagnostics_not_detected")}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_max_texture_size")}
                        value={webgl.maxTextureSize ?? t("diagnostics_unknown")}
                    />
                </DiagnosticsSection>

                <DiagnosticsSection title={t("diagnostics_section_display")}>
                    <DiagnosticRow
                        label={t("diagnostics_resolution")}
                        value={`${resolution.innerWidth}x${resolution.innerHeight}`}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_device_pixel_ratio")}
                        value={resolution.devicePixelRatio}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_fps")}
                        value={fps ?? t("diagnostics_unknown")}
                    />
                </DiagnosticsSection>

                <DiagnosticsSection title={t("diagnostics_section_mobile")}>
                    <DiagnosticRow
                        label={t("diagnostics_touch_support")}
                        value={
                            mobile.touchSupported
                                ? `${t("diagnostics_yes")} (${mobile.maxTouchPoints})`
                                : t("diagnostics_no")
                        }
                    />
                    <DiagnosticRow
                        label={t("diagnostics_device_memory")}
                        value={
                            mobile.deviceMemoryGb !== null
                                ? `${mobile.deviceMemoryGb} GB`
                                : t("diagnostics_not_available")
                        }
                    />
                    <DiagnosticRow
                        label={t("diagnostics_network_type")}
                        value={mobile.networkEffectiveType ?? t("diagnostics_not_available")}
                    />
                    <DiagnosticRow
                        label={t("diagnostics_screen_orientation")}
                        value={mobile.screenOrientation ?? t("diagnostics_unknown")}
                    />
                </DiagnosticsSection>

                <DiagnosticsSection title={t("diagnostics_section_memory")}>
                    {memory ? (
                        <DiagnosticRow
                            label={t("diagnostics_js_heap")}
                            value={`${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} / ${(
                                memory.totalJSHeapSize / 1024 / 1024
                            ).toFixed(1)} MB`}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {t("diagnostics_js_heap_unavailable")}
                        </p>
                    )}
                </DiagnosticsSection>

                <DiagnosticsSection title={t("diagnostics_section_capabilities")}>
                    <CapabilityRow
                        label={t("diagnostics_webgl2")}
                        supported={webgl.webgl2Supported}
                    />
                    <CapabilityRow
                        label={t("diagnostics_hardware_acceleration")}
                        supported={webgl.hardwareAccelerated}
                    />
                    <CapabilityRow
                        label={t("diagnostics_gpu_supported")}
                        supported={webgl.webgl1Supported || webgl.webgl2Supported}
                    />
                    <CapabilityRow
                        label={t("diagnostics_max_texture_size_check")}
                        supported={(webgl.maxTextureSize ?? 0) >= 8192}
                    />
                    <CapabilityRow
                        label={t("diagnostics_float_textures")}
                        supported={webgl.floatTexturesSupported}
                    />
                    <CapabilityRow label={t("diagnostics_msaa")} supported={webgl.msaaSupported} />
                    <CapabilityRow
                        label={t("diagnostics_shaders_compile")}
                        supported={webgl.shadersCompile}
                    />
                    <CapabilityRow label={t("diagnostics_audio")} supported={capabilities.audio} />
                    <CapabilityRow
                        label={t("diagnostics_gamepad")}
                        supported={capabilities.gamepad}
                    />
                    <CapabilityRow
                        label={t("diagnostics_clipboard")}
                        supported={capabilities.clipboard}
                    />
                    <CapabilityRow
                        label={t("diagnostics_fullscreen")}
                        supported={capabilities.fullscreen}
                    />
                    <CapabilityRow
                        label={t("diagnostics_local_storage")}
                        supported={capabilities.localStorage}
                    />
                    <CapabilityRow
                        label={t("diagnostics_indexed_db")}
                        supported={capabilities.indexedDb}
                    />
                    <CapabilityRow
                        label={t("diagnostics_steam_overlay")}
                        supported={capabilities.steamOverlayDetected}
                        hint={t("diagnostics_steam_overlay_hint")}
                    />
                </DiagnosticsSection>

                <DiagnosticsSection title={t("diagnostics_section_extensions")}>
                    {webgl.keyExtensions.map((extension) => (
                        <CapabilityRow
                            key={extension.name}
                            label={extension.name}
                            supported={extension.supported}
                        />
                    ))}
                </DiagnosticsSection>
            </div>
        </ScrollArea>
    );
}
