import {
    systemInfo as getRovesSystemInfo,
    isAvailable as isRovesAvailable,
} from "@drincs/roves-api/core";

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

export async function getSystemInfo(): Promise<NativeDiagnostics | null> {
    if (isRovesAvailable()) {
        const rovesRaw = await getRovesSystemInfo();
        if (!rovesRaw) return null;
        return {
            osType: rovesRaw.os_type,
            osVersion: rovesRaw.os_version ?? "Unknown",
            bitness: rovesRaw.bitness,
            architecture: rovesRaw.architecture,
            engineVersion: rovesRaw.engine_version,
        };
    }
    return null;
}
