import { AssetPack } from "@assetpack/core";
import type { AssetsManifest } from "@drincs/pixi-vn/pixi.js";
import { vitePluginPixivn } from "@drincs/pixi-vn/vite";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin, type ResolvedConfig } from "vite";
import { checker } from "vite-plugin-checker";
import { VitePWA } from "vite-plugin-pwa";
import vitePackageJson from "vite/package.json";
import assetPackConfig from "./.assetpack.ts";

/**
 * List of external hostnames whose responses should be cached by the service worker.
 * Add any CDN or remote asset host here to enable offline caching for it.
 * Examples:
 *   "cdn.jsdelivr.net"
 *   "your.cdn.domain.com"
 */
const CACHED_EXTERNAL_HOSTNAMES: string[] = ["raw.githubusercontent.com"];

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [
        assetpackPlugin(),
        checker({
            typescript: {
                tsconfigPath: "tsconfig.app.json",
            },
        }),
        mode !== "production" && devtools(),
        tanstackRouter({ target: "react", autoCodeSplitting: true }),
        react(),
        tailwindcss(),
        vitePluginPixivn({
            workerFilePath: "./src/pixi-vn.worker.gen.ts",
            content: "./src/content/index.ts",
            characters: "./src/content/characters.ts",
            labels: "./src/content/labels/*.label.ts",
            typeFilePath: "./src/pixi-vn.keys.gen.ts",
            assetsManifest: async (ssrLoadModule) => {
                const mod = (await ssrLoadModule("/src/assets/index.ts")) as {
                    manifest: AssetsManifest;
                };
                if (!mod.manifest)
                    throw new Error("Assets manifest not found in /src/assets/index.ts");
                return mod.manifest;
            },
        }),
        VitePWA({
            // generate icons with: npm run icon
            includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png"],
            manifest: {
                name: "my-app-project-name",
                short_name: "my-app-package-name",
                description: "my-app-description",
                theme_color: "#ffffff",
                start_url: "/",
                display: "fullscreen",
                orientation: "landscape",
                icons: [
                    {
                        src: "pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "maskable-icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
            },
            workbox: {
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) => CACHED_EXTERNAL_HOSTNAMES.includes(url.hostname),
                        handler: "CacheFirst",
                        options: {
                            cacheName: "external-assets-v1",
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                            expiration: {
                                maxAgeSeconds: 7 * 24 * 60 * 60,
                            },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        tsconfigPaths: true,
        preserveSymlinks: true,
    },
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        __APP_NAME__: JSON.stringify(process.env.npm_package_name),
        __VITE_VERSION__: JSON.stringify(vitePackageJson.version),
        // Set by whoever builds specifically for Roves (e.g. `ROVES_BUILD=true npm run
        // build`, or a CI step that only runs for the Roves target) -- lets the app's own
        // code branch on "am I being built for Roves" at build time, alongside (not instead
        // of) `@drincs/roves-api/core`'s `isAvailable()` runtime check, which only answers
        // "am I *currently running* inside Roves" and can't be used at build time.
        "process.env.ROVES_BUILD": JSON.stringify(process.env.ROVES_BUILD ?? ""),
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (
                        id.includes("react-markdown") ||
                        id.includes("rehype-raw") ||
                        id.includes("remark-gfm")
                    )
                        return "markdown";
                    if (id.includes("tone")) return "tone";
                    if (id.includes("@drincs/pixi-vn-spine")) return "spine";
                    if (id.includes("pixi.js")) return "pixi.js";
                    if (id.includes("motion")) return "motion";
                    if (id.includes("@drincs/pixi-vn")) return "pixi-vn";
                },
            },
        },
    },
}));

function assetpackPlugin(): Plugin {
    let mode: ResolvedConfig["command"];
    let ap: AssetPack | undefined;

    return {
        name: "vite-plugin-assetpack",
        configResolved(resolvedConfig) {
            mode = resolvedConfig.command;
            if (!resolvedConfig.publicDir) return;
            if (assetPackConfig.output) return;
            const publicDir = resolvedConfig.publicDir.replace(process.cwd(), "");
            assetPackConfig.output = `.${publicDir}/assets/`;
        },
        buildStart: async () => {
            if (mode === "serve") {
                if (ap) return;
                ap = new AssetPack(assetPackConfig);
                void ap.watch();
            } else {
                await new AssetPack(assetPackConfig).run();
            }
        },
        buildEnd: async () => {
            if (ap) {
                await ap.stop();
                ap = undefined;
            }
        },
    };
}
