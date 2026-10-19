/**
 * Steam bridge, backed by Tauri `steam_*` IPC commands called via `invoke()`.
 * All functions are safe to call even when:
 *   - the app is running outside Tauri (plain web mode)
 *   - Steam is not running
 *   - the `steam` feature was not compiled into the native binary
 * In all those cases the functions return sensible defaults (null / false / 0)
 * without throwing.
 *
 * Enable Steam in Rust:
 *   src-tauri/Cargo.toml → pass --features steam to cargo / tauri build
 *
 * Typical usage:
 *   import { steam } from "@/lib/steam";
 *
 *   const name = await steam.getPlayerName();          // "Alice" | null
 *   await steam.unlockAchievement("ACH_COMPLETE_CH1"); // fire & forget
 *   await steam.openOverlay("achievements");
 */

import { invoke } from "@tauri-apps/api/core";

export const steam = {
    async isAvailable() {
        return invoke<boolean>("steam_is_available").catch(() => false);
    },

    async getPlayerName() {
        return invoke<string | null>("steam_get_player_name").catch(() => null);
    },

    async getAppId() {
        return invoke<number | null>("steam_get_app_id").catch(() => null);
    },

    async unlockAchievement(achievementId: string) {
        return invoke("steam_unlock_achievement", { achievementId })
            .then(() => true)
            .catch(() => false);
    },

    async isAchievementUnlocked(achievementId: string) {
        return invoke<boolean>("steam_is_achievement_unlocked", { achievementId }).catch(
            () => false,
        );
    },

    async clearAchievement(achievementId: string) {
        return invoke("steam_clear_achievement", { achievementId })
            .then(() => true)
            .catch(() => false);
    },

    async setStatInt(name: string, value: number) {
        return invoke("steam_set_stat_int", { name, value: Math.trunc(value) })
            .then(() => true)
            .catch(() => false);
    },

    async getStatInt(name: string) {
        return invoke<number>("steam_get_stat_int", { name }).catch(() => 0);
    },

    async setStatFloat(name: string, value: number) {
        return invoke("steam_set_stat_float", { name, value })
            .then(() => true)
            .catch(() => false);
    },

    async getStatFloat(name: string) {
        return invoke<number>("steam_get_stat_float", { name }).catch(() => 0);
    },

    async storeStats() {
        return invoke("steam_store_stats")
            .then(() => true)
            .catch(() => false);
    },

    async isDlcInstalled(appId: number) {
        return invoke<boolean>("steam_is_dlc_installed", { appId }).catch(() => false);
    },

    async openOverlay(dialog: string) {
        return invoke<boolean>("steam_open_overlay", { dialog }).catch(() => false);
    },

    async openStore(appId?: number | null) {
        return invoke<boolean>("steam_open_store", { appId: appId ?? null }).catch(() => false);
    },
};
