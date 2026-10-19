/**
 * Steam bridge — same `SteamApi` shape regardless of which native shell is
 * actually running this page:
 *   - Tauri: a real `steam_*` IPC command, called via `invoke()`.
 *   - Roves (the Servo-based "embedded" shell): `@drincs/roves-api/steam`'s
 *     own bridge, talking to a `steam:` custom protocol via `fetch()` — see
 *     servo/ports/servoshell/desktop/protocols/steam.rs.
 * All functions are safe to call even when:
 *   - the app is running outside both of those (plain web mode)
 *   - Steam is not running
 *   - the `steam` feature was not compiled into the native binary answering
 *     these calls
 * In all those cases the functions return sensible defaults (null / false / 0)
 * without throwing — `@drincs/roves-api/steam` already guarantees that for
 * the Roves path, and `steamViaTauri` below matches it call-for-call.
 *
 * Enable Steam in Rust:
 *   src-tauri/Cargo.toml → pass --features steam to cargo / tauri build
 *   servo/ports/servoshell/Cargo.toml → pass --features steam to `./mach build`
 *
 * Typical usage:
 *   import { steam } from "@/lib/steam";
 *
 *   const name = await steam.getPlayerName();          // "Alice" | null
 *   await steam.unlockAchievement("ACH_COMPLETE_CH1"); // fire & forget
 *   await steam.openOverlay("achievements");
 */

import { steam as steamViaRoves, type SteamApi } from "@drincs/roves-api/steam";
import { invoke } from "@tauri-apps/api/core";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

const steamViaTauri: SteamApi = {
    async isAvailable() {
        return invoke<boolean>("steam_is_available").catch(() => false);
    },

    async getPlayerName() {
        return invoke<string | null>("steam_get_player_name").catch(() => null);
    },

    async getAppId() {
        return invoke<number | null>("steam_get_app_id").catch(() => null);
    },

    async unlockAchievement(achievementId) {
        return invoke("steam_unlock_achievement", { achievementId })
            .then(() => true)
            .catch(() => false);
    },

    async isAchievementUnlocked(achievementId) {
        return invoke<boolean>("steam_is_achievement_unlocked", { achievementId }).catch(
            () => false,
        );
    },

    async clearAchievement(achievementId) {
        return invoke("steam_clear_achievement", { achievementId })
            .then(() => true)
            .catch(() => false);
    },

    async setStatInt(name, value) {
        return invoke("steam_set_stat_int", { name, value: Math.trunc(value) })
            .then(() => true)
            .catch(() => false);
    },

    async getStatInt(name) {
        return invoke<number>("steam_get_stat_int", { name }).catch(() => 0);
    },

    async setStatFloat(name, value) {
        return invoke("steam_set_stat_float", { name, value })
            .then(() => true)
            .catch(() => false);
    },

    async getStatFloat(name) {
        return invoke<number>("steam_get_stat_float", { name }).catch(() => 0);
    },

    async storeStats() {
        return invoke("steam_store_stats")
            .then(() => true)
            .catch(() => false);
    },

    async isDlcInstalled(appId) {
        return invoke<boolean>("steam_is_dlc_installed", { appId }).catch(() => false);
    },

    async openOverlay(dialog) {
        return invoke<boolean>("steam_open_overlay", { dialog }).catch(() => false);
    },

    async openStore(appId) {
        return invoke<boolean>("steam_open_store", { appId: appId ?? null }).catch(() => false);
    },
};

/**
 * Picked once, at module load: Tauri's real IPC when running under Tauri,
 * `@drincs/roves-api`'s `fetch()`-based bridge otherwise — which safely
 * no-ops (never throws, resolves to false/null/0) on Roves without Steam,
 * and on plain web too, since there `fetch('steam:...')` just rejects like
 * any other unknown scheme, and every function below already catches that.
 */
export const steam: SteamApi = isTauri ? steamViaTauri : steamViaRoves;
