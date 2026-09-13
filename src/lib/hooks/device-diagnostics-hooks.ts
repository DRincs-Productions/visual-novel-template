import { getSystemInfo, type NativeDiagnostics } from "@/lib/system-info";
import {
    detectBrowserEngine,
    detectPlatform,
    getBrowserCapabilities,
    getCurrentFps,
    getEngineVersion,
    getGameVersion,
    getJsMemoryInfo,
    getMobileDiagnostics,
    getMotionVersion,
    getPixiJsVersion,
    getPixiVnVersion,
    getResolutionInfo,
    getToneJsVersion,
    getWebglDiagnostics,
    type DeviceDiagnosticsSnapshot,
} from "@/lib/utils/device-diagnostics-utility";
import { useEffect, useMemo, useState } from "react";

const LIVE_REFRESH_INTERVAL_MS = 1000;

/**
 * WebGL support, browser capabilities, UA, platform and engine don't change during a session,
 * so they're probed once. FPS, resolution and JS memory are polled since they change live.
 */
export function useDeviceDiagnostics(): DeviceDiagnosticsSnapshot {
    const webgl = useMemo(() => getWebglDiagnostics(), []);
    const capabilities = useMemo(() => getBrowserCapabilities(), []);
    const platform = useMemo(() => detectPlatform(), []);
    const browserEngine = useMemo(() => detectBrowserEngine(), []);
    const engineVersion = useMemo(() => getEngineVersion(), []);
    const gameVersion = useMemo(() => getGameVersion(), []);
    const pixiJsVersion = useMemo(() => getPixiJsVersion(), []);
    const pixiVnVersion = useMemo(() => getPixiVnVersion(), []);
    const toneJsVersion = useMemo(() => getToneJsVersion(), []);
    const motionVersion = useMemo(() => getMotionVersion(), []);

    const [resolution, setResolution] = useState(() => getResolutionInfo());
    const [mobile, setMobile] = useState(() => getMobileDiagnostics());
    const [memory, setMemory] = useState(() => getJsMemoryInfo());
    const [fps, setFps] = useState<number | null>(() => getCurrentFps());
    // Only ever populated inside — stays null in the browser build.
    const [native, setNative] = useState<NativeDiagnostics | null>(null);

    useEffect(() => {
        let cancelled = false;
        getSystemInfo().then((info) => {
            if (cancelled || !info) return;
            setNative(info);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        // A resize also fires on orientation changes, so refresh both together.
        const onResize = () => {
            setResolution(getResolutionInfo());
            setMobile(getMobileDiagnostics());
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setFps(getCurrentFps());
            setMemory(getJsMemoryInfo());
        }, LIVE_REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    return {
        webgl,
        capabilities,
        mobile,
        native,
        resolution,
        memory,
        fps,
        userAgent: navigator.userAgent,
        platform,
        browserEngine,
        engineVersion,
        gameVersion,
        pixiJsVersion,
        pixiVnVersion,
        toneJsVersion,
        motionVersion,
    };
}
