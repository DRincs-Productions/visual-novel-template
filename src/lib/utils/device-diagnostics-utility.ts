import packageJson from "@/../package.json";
import type { NativeDiagnostics } from "@/lib/system-info";
import { canvas, PIXIVN_VERSION } from "@drincs/pixi-vn";
import motionPackageJson from "motion/package.json";
import { VERSION as PIXIJS_VERSION } from "pixi.js";
import tonePackageJson from "tone/package.json";

export interface WebglExtensionCheck {
    name: string;
    supported: boolean;
}

export interface WebglDiagnostics {
    webgl1Supported: boolean;
    webgl2Supported: boolean;
    vendor: string | null;
    renderer: string | null;
    unmaskedVendor: string | null;
    unmaskedRenderer: string | null;
    /** null when it cannot be determined (e.g. WEBGL_debug_renderer_info is blocked). */
    hardwareAccelerated: boolean | null;
    /** Coarse GPU brand bucket (NVIDIA/AMD/Intel/Apple/Qualcomm/ARM/Imagination/Software/Unknown), including mobile GPU families. */
    gpuVendorBrand: string;
    /** Mesa version parsed out of the renderer string, when running on a Linux Mesa driver stack. */
    mesaVersion: string | null;
    maxTextureSize: number | null;
    floatTexturesSupported: boolean;
    msaaSupported: boolean;
    shadersCompile: boolean;
    keyExtensions: WebglExtensionCheck[];
    allExtensions: string[];
}

export interface MobileDiagnostics {
    touchSupported: boolean;
    maxTouchPoints: number;
    /** Approximate device RAM in GB. Chromium-only; null elsewhere. */
    deviceMemoryGb: number | null;
    /** Coarse connection quality bucket (e.g. "4g", "3g"). Chromium-only; null elsewhere. */
    networkEffectiveType: string | null;
    /** e.g. "portrait-primary" / "landscape-primary". */
    screenOrientation: string | null;
}

export interface BrowserCapabilities {
    audio: boolean;
    gamepad: boolean;
    clipboard: boolean;
    fullscreen: boolean;
    localStorage: boolean;
    indexedDb: boolean;
    /** Best-effort heuristic only: Steam's overlay is compositor-level and generally invisible to page JS. */
    steamOverlayDetected: boolean;
}

export interface ResolutionInfo {
    innerWidth: number;
    innerHeight: number;
    screenWidth: number;
    screenHeight: number;
    devicePixelRatio: number;
}

export interface JsMemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}

const KEY_WEBGL_EXTENSIONS = [
    "WEBGL_debug_renderer_info",
    "WEBGL_lose_context",
    "WEBGL_compressed_texture_s3tc",
    "WEBGL_compressed_texture_astc",
    "WEBGL_compressed_texture_etc",
    "OES_texture_float",
    "OES_texture_float_linear",
    "OES_texture_half_float",
    "OES_element_index_uint",
    "OES_standard_derivatives",
    "ANGLE_instanced_arrays",
    "EXT_texture_filter_anisotropic",
    "EXT_color_buffer_float",
];

const SOFTWARE_RENDERER_PATTERN =
    /swiftshader|llvmpipe|software|microsoft basic render|d3d11 warp|apple software renderer/i;

/**
 * Coarse GPU brand bucket from the (unmasked) vendor/renderer strings.
 * Covers mobile GPU families (Adreno/Qualcomm, Mali/ARM, PowerVR/Imagination) too.
 */
function classifyGpuVendorBrand(vendorAndRenderer: string): string {
    if (SOFTWARE_RENDERER_PATTERN.test(vendorAndRenderer)) return "Software (no GPU)";
    if (/nvidia|geforce|quadro|rtx\s?\d|gtx\s?\d/i.test(vendorAndRenderer)) return "NVIDIA";
    if (/amd|ati\b|radeon/i.test(vendorAndRenderer)) return "AMD";
    if (/intel/i.test(vendorAndRenderer)) return "Intel";
    if (/apple/i.test(vendorAndRenderer)) return "Apple";
    if (/qualcomm|adreno/i.test(vendorAndRenderer)) return "Qualcomm (Adreno)";
    if (/arm\b|mali/i.test(vendorAndRenderer)) return "ARM (Mali)";
    if (/imagination|powervr/i.test(vendorAndRenderer)) return "Imagination (PowerVR)";
    return "Unknown";
}

/** Extracts the Mesa driver version from a Linux OpenGL/ANGLE renderer string, when present. */
function extractMesaVersion(rendererString: string): string | null {
    return /Mesa\s+([\d.]+)/i.exec(rendererString)?.[1] ?? null;
}

function testShaderCompilation(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
    try {
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader) {
            return false;
        }

        gl.shaderSource(
            vertexShader,
            "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }",
        );
        gl.compileShader(vertexShader);
        gl.shaderSource(
            fragmentShader,
            "precision mediump float; void main() { gl_FragColor = vec4(1.0); }",
        );
        gl.compileShader(fragmentShader);
        if (
            !gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) ||
            !gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)
        ) {
            return false;
        }

        const program = gl.createProgram();
        if (!program) {
            return false;
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        return !!gl.getProgramParameter(program, gl.LINK_STATUS);
    } catch {
        return false;
    }
}

/**
 * Probes a throwaway canvas instead of the live Pixi-VN canvas so this works
 * regardless of which renderer Pixi actually picked (or before Pixi has initialized).
 */
export function getWebglDiagnostics(): WebglDiagnostics {
    const probeCanvas = document.createElement("canvas");
    const gl2 = probeCanvas.getContext("webgl2") as WebGL2RenderingContext | null;
    const gl1 = (probeCanvas.getContext("webgl") ??
        probeCanvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    const gl = gl2 ?? gl1;

    if (!gl) {
        return {
            webgl1Supported: false,
            webgl2Supported: false,
            vendor: null,
            renderer: null,
            unmaskedVendor: null,
            unmaskedRenderer: null,
            hardwareAccelerated: null,
            gpuVendorBrand: "Unknown",
            mesaVersion: null,
            maxTextureSize: null,
            floatTexturesSupported: false,
            msaaSupported: false,
            shadersCompile: false,
            keyExtensions: KEY_WEBGL_EXTENSIONS.map((name) => ({ name, supported: false })),
            allExtensions: [],
        };
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const vendor = (gl.getParameter(gl.VENDOR) as string) ?? null;
    const renderer = (gl.getParameter(gl.RENDERER) as string) ?? null;
    const unmaskedVendor = debugInfo
        ? ((gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string) ?? null)
        : null;
    const unmaskedRenderer = debugInfo
        ? ((gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string) ?? null)
        : null;
    const rendererForHeuristic = unmaskedRenderer ?? renderer;
    const hardwareAccelerated = rendererForHeuristic
        ? !SOFTWARE_RENDERER_PATTERN.test(rendererForHeuristic)
        : null;
    const gpuVendorBrand = classifyGpuVendorBrand(
        `${unmaskedVendor ?? vendor ?? ""} ${rendererForHeuristic ?? ""}`,
    );
    const mesaVersion = rendererForHeuristic ? extractMesaVersion(rendererForHeuristic) : null;

    const allExtensions = gl.getSupportedExtensions() ?? [];
    const keyExtensions = KEY_WEBGL_EXTENSIONS.map((name) => ({
        name,
        supported: allExtensions.includes(name),
    }));

    const maxTextureSize = (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) ?? null;
    const floatTexturesSupported = gl2 ? true : allExtensions.includes("OES_texture_float");
    const msaaSupported = gl2
        ? ((gl2.getParameter(gl2.MAX_SAMPLES) as number) ?? 0) > 1
        : (gl.getContextAttributes()?.antialias ?? false);
    const shadersCompile = testShaderCompilation(gl);

    // This is a throwaway probe context; release it instead of leaving it around.
    gl.getExtension("WEBGL_lose_context")?.loseContext();

    return {
        webgl1Supported: !!gl1 || !!gl2,
        webgl2Supported: !!gl2,
        vendor,
        renderer,
        unmaskedVendor,
        unmaskedRenderer,
        hardwareAccelerated,
        gpuVendorBrand,
        mesaVersion,
        maxTextureSize,
        floatTexturesSupported,
        msaaSupported,
        shadersCompile,
        keyExtensions,
        allExtensions,
    };
}

interface UserAgentDataBrand {
    brand: string;
    version: string;
}

interface NavigatorUAData {
    platform?: string;
    brands?: UserAgentDataBrand[];
}

function getUserAgentData(): NavigatorUAData | undefined {
    return (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData;
}

export function detectPlatform(): string {
    const ua = navigator.userAgent;
    const platformHint = getUserAgentData()?.platform ?? navigator.platform ?? "";

    if (/android/i.test(ua)) return "Android";
    if (/iphone|ipod/i.test(ua)) return "iOS";
    // iPadOS reports as "MacIntel" but exposes multi-touch, unlike a real Mac.
    if (/ipad/i.test(ua) || (/mac/i.test(platformHint) && navigator.maxTouchPoints > 1))
        return "iOS";
    if (/mac/i.test(platformHint)) return "macOS";
    if (/win/i.test(platformHint)) return "Windows";
    if (/linux/i.test(platformHint)) return "Linux";
    return "Unknown";
}

export function detectBrowserEngine(): string {
    const ua = navigator.userAgent;
    const brands = getUserAgentData()?.brands ?? [];

    // User-Agent Client Hints: WebView2 (Windows) reliably advertises this brand.
    if (brands.some((brand) => /webview2/i.test(brand.brand))) return "WebView2 (Chromium)";
    // Chromium's Android WebView appends a distinct "; wv)" token to the UA string.
    if (/; wv\)/i.test(ua)) return "Android WebView (Chromium)";

    if (/edg\//i.test(ua)) return "Chromium (Edge)";
    if (/firefox|fxios/i.test(ua)) return "Gecko (Firefox)";
    if (/crios/i.test(ua)) return "Chromium (Chrome iOS)";
    if (/chrome|chromium/i.test(ua)) return "Chromium";
    if (/safari/i.test(ua)) {
        // Real desktop/mobile Safari doesn't exist on Linux, so a WebKit UA there is
        // almost certainly a WebKitGTK-based webview (e.g. Tauri's Linux WebView).
        return detectPlatform() === "Linux" ? "WebKitGTK (Linux WebView)" : "WebKit (Safari)";
    }
    return "Unknown";
}

/** Numeric engine/browser version parsed from the UA string (Chromium/Firefox build, or Safari/WebKit version). */
export function getEngineVersion(): string | null {
    const ua = navigator.userAgent;
    const firefoxMatch = /Firefox\/([\d.]+)/.exec(ua);
    if (firefoxMatch) return firefoxMatch[1];
    const chromeMatch = /Chrome\/([\d.]+)/.exec(ua);
    if (chromeMatch) return chromeMatch[1];
    // Safari's real version lives in "Version/", not the AppleWebKit build number.
    const safariVersionMatch = /Version\/([\d.]+)/.exec(ua);
    if (safariVersionMatch) return safariVersionMatch[1];
    const webkitMatch = /AppleWebKit\/([\d.]+)/.exec(ua);
    if (webkitMatch) return webkitMatch[1];
    return null;
}

export function getBrowserCapabilities(): BrowserCapabilities {
    const win = window as Window & {
        webkitAudioContext?: typeof AudioContext;
        cefQuery?: unknown;
    };

    let localStorageAvailable = false;
    try {
        const testKey = "__diagnostics_test__";
        window.localStorage.setItem(testKey, "1");
        window.localStorage.removeItem(testKey);
        localStorageAvailable = true;
    } catch {
        localStorageAvailable = false;
    }

    return {
        audio: typeof AudioContext !== "undefined" || typeof win.webkitAudioContext !== "undefined",
        gamepad: typeof navigator.getGamepads === "function",
        clipboard: typeof navigator.clipboard?.writeText === "function",
        fullscreen: document.fullscreenEnabled === true,
        localStorage: localStorageAvailable,
        indexedDb: typeof window.indexedDB !== "undefined",
        steamOverlayDetected:
            typeof win.cefQuery === "function" ||
            /Valve Steam|SteamOverlay/i.test(navigator.userAgent),
    };
}

export function getMobileDiagnostics(): MobileDiagnostics {
    const nav = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { effectiveType?: string };
    };

    return {
        touchSupported: navigator.maxTouchPoints > 0,
        maxTouchPoints: navigator.maxTouchPoints,
        deviceMemoryGb: nav.deviceMemory ?? null,
        networkEffectiveType: nav.connection?.effectiveType ?? null,
        screenOrientation: window.screen?.orientation?.type ?? null,
    };
}

export function getResolutionInfo(): ResolutionInfo {
    return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        screenWidth: window.screen?.width ?? 0,
        screenHeight: window.screen?.height ?? 0,
        devicePixelRatio: window.devicePixelRatio || 1,
    };
}

export function getJsMemoryInfo(): JsMemoryInfo | null {
    const memory = (performance as Performance & { memory?: JsMemoryInfo }).memory;
    if (!memory) {
        return null;
    }
    return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
}

export function getCurrentFps(): number | null {
    try {
        return Math.round(canvas.app.ticker.FPS);
    } catch {
        return null;
    }
}

export function getGameVersion(): string {
    return packageJson.version;
}

export function getPixiJsVersion(): string {
    return PIXIJS_VERSION;
}

export function getPixiVnVersion(): string {
    return PIXIVN_VERSION;
}

export function getToneJsVersion(): string {
    return tonePackageJson.version;
}

export function getMotionVersion(): string {
    return motionPackageJson.version;
}

function formatBytes(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface DeviceDiagnosticsSnapshot {
    webgl: WebglDiagnostics;
    capabilities: BrowserCapabilities;
    mobile: MobileDiagnostics;
    native: NativeDiagnostics | null;
    resolution: ResolutionInfo;
    memory: JsMemoryInfo | null;
    fps: number | null;
    userAgent: string;
    platform: string;
    browserEngine: string;
    engineVersion: string | null;
    gameVersion: string;
    pixiJsVersion: string;
    pixiVnVersion: string;
    toneJsVersion: string;
    motionVersion: string;
}

export function buildDiagnosticsReportText(snapshot: DeviceDiagnosticsSnapshot): string {
    const { webgl, capabilities, mobile, native, resolution, memory, fps } = snapshot;
    const yn = (value: boolean | null) => (value === null ? "Unknown" : value ? "Yes" : "No");

    const lines = [
        "=== Device Diagnostics Report ===",
        `Game version: ${snapshot.gameVersion}`,
        `PixiJS version: ${snapshot.pixiJsVersion}`,
        `Pixi'VN version: ${snapshot.pixiVnVersion}`,
        `Tone.js version: ${snapshot.toneJsVersion}`,
        `Motion version: ${snapshot.motionVersion}`,
        `User Agent: ${snapshot.userAgent}`,
        `Platform: ${snapshot.platform}`,
        `Browser/WebView: ${snapshot.browserEngine}`,
        `Engine version: ${snapshot.engineVersion ?? "Unknown"}`,
        "",
        "-- Native / OS --",
        native
            ? [
                  `OS: ${native.osType} ${native.osVersion} (${native.bitness}, ${native.architecture})`,
                  `Engine version: ${native.engineVersion}`,
              ].join("\n")
            : "Not available (running in a standard browser)",
        "",
        "-- Graphics --",
        `WebGL1 available: ${yn(webgl.webgl1Supported)}`,
        `WebGL2 available: ${yn(webgl.webgl2Supported)}`,
        `Hardware acceleration: ${yn(webgl.hardwareAccelerated)}`,
        `GPU vendor: ${webgl.unmaskedVendor ?? webgl.vendor ?? "Unknown"}`,
        `GPU renderer: ${webgl.unmaskedRenderer ?? webgl.renderer ?? "Unknown"}`,
        `GPU brand: ${webgl.gpuVendorBrand}`,
        `Mesa driver version: ${webgl.mesaVersion ?? "Not detected"}`,
        `Max texture size: ${webgl.maxTextureSize ?? "Unknown"}`,
        `Float textures: ${yn(webgl.floatTexturesSupported)}`,
        `MSAA: ${yn(webgl.msaaSupported)}`,
        `Shaders compile: ${yn(webgl.shadersCompile)}`,
        `WebGL extensions: ${webgl.keyExtensions
            .filter((extension) => extension.supported)
            .map((extension) => extension.name)
            .join(", ")}`,
        "",
        "-- Display --",
        `Resolution: ${resolution.innerWidth}x${resolution.innerHeight} (screen ${resolution.screenWidth}x${resolution.screenHeight})`,
        `Device pixel ratio: ${resolution.devicePixelRatio}`,
        `FPS: ${fps ?? "Unknown"}`,
        "",
        "-- Memory --",
        memory
            ? `JS heap: ${formatBytes(memory.usedJSHeapSize)} / ${formatBytes(memory.totalJSHeapSize)} (limit ${formatBytes(memory.jsHeapSizeLimit)})`
            : "JS heap: Not available in this browser",
        "",
        "-- Mobile & sensors --",
        `Touch support: ${yn(mobile.touchSupported)} (${mobile.maxTouchPoints} points)`,
        `Device memory: ${mobile.deviceMemoryGb !== null ? `${mobile.deviceMemoryGb} GB` : "Not available"}`,
        `Network type: ${mobile.networkEffectiveType ?? "Not available"}`,
        `Screen orientation: ${mobile.screenOrientation ?? "Unknown"}`,
        "",
        "-- Browser capabilities --",
        `Audio (Web Audio API): ${yn(capabilities.audio)}`,
        `Gamepad API: ${yn(capabilities.gamepad)}`,
        `Clipboard API: ${yn(capabilities.clipboard)}`,
        `Fullscreen API: ${yn(capabilities.fullscreen)}`,
        `LocalStorage: ${yn(capabilities.localStorage)}`,
        `IndexedDB: ${yn(capabilities.indexedDb)}`,
        `Steam Overlay detected (best-effort): ${yn(capabilities.steamOverlayDetected)}`,
    ];

    return lines.join("\n");
}

export function buildDiagnosticsReportJson(snapshot: DeviceDiagnosticsSnapshot): object {
    return {
        generatedAt: new Date().toISOString(),
        ...snapshot,
    };
}

export function downloadDiagnosticsReportJson(snapshot: DeviceDiagnosticsSnapshot) {
    const jsonString = JSON.stringify(buildDiagnosticsReportJson(snapshot), null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${__APP_NAME__}-${__APP_VERSION__}-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
