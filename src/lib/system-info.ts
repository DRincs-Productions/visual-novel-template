import { invoke } from "@tauri-apps/api/core";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

/**
 * OS/distro and rendering-engine details.
 * `null` when running in a plain browser (browsers deliberately don't expose this).
 */
export interface NativeDiagnostics {
    /** Specific OS/distro name (e.g. "Ubuntu", "Windows", "Mac OS"), not just the generic platform. */
    osType: string;
    osVersion: string;
    bitness: string;
    architecture: string;
    engineVersion?: string;
}

interface RawSystemInfo {
    os_type: string;
    os_version: string;
    bitness: string;
    architecture: string;
}

async function call<T>(cmd: string): Promise<T | null> {
    if (!isTauri) return null;
    try {
        return await invoke<T>(cmd);
    } catch {
        return null;
    }
}

export async function getWebviewVersion(): Promise<string | null> {
    return call<string>("get_webview_version");
}

export async function getSystemInfo(): Promise<NativeDiagnostics | null> {
    const raw = await call<RawSystemInfo>("get_system_info");
    if (!raw) return null;
    return {
        osType: raw.os_type,
        osVersion: raw.os_version,
        bitness: raw.bitness,
        architecture: raw.architecture,
    };
}
