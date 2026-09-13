import { gameDB, INDEXED_DB_SAVE_TABLE } from "@/lib/utils/db-utility";
import { roves } from "@/lib/utils/roves-utility";
import type GameSaveData from "@/models/GameSaveData";
import { canvas, Game } from "@drincs/pixi-vn";
import { isAvailable as isRoves } from "@drincs/roves-api/core";
import { saves as rovesSaves } from "@drincs/roves-api/saves";

const SAVE_FILE_EXTENSION = "json";

/** Snapshots the current game state into a {@link GameSaveData}, ready to pass to {@link save}. */
async function create(options?: { image?: string; name?: string }): Promise<GameSaveData> {
    const { image, name = "" } = options || {};
    return {
        saveData: await Game.exportGameState(),
        gameVersion: __APP_VERSION__,
        date: new Date(),
        name: name,
        image: image,
    };
}

/** Persists a save under `info.id`, to whichever backend (Roves or IndexedDB) is active. */
export async function save(
    info: Partial<GameSaveData> & { id: number },
    data?: GameSaveData,
): Promise<GameSaveData & { id: number }> {
    const saveData = data ?? (await create());
    const { image = await canvas.extractImage(), ...rest } = info;
    const item = {
        ...saveData,
        image: image,
        ...rest,
    };
    const usingRoves = isRoves();
    if (usingRoves) {
        await rovesSaves.writeText(item.id, item);
        return item as GameSaveData & { id: number };
    }

    await gameDB.putRow(INDEXED_DB_SAVE_TABLE, item);
    if (item.id) {
        return item as GameSaveData & { id: number };
    }
    return (await save.getLast()) as GameSaveData & { id: number };
}

export namespace save {
    /** Reads the save at `id`, or `null` if there isn't one. */
    export async function get(id: number): Promise<(GameSaveData & { id: number }) | null> {
        if (isRoves()) {
            return roves.getSave(id);
        }
        return await gameDB.getRow(INDEXED_DB_SAVE_TABLE, id);
    }

    /** The most recent save overall, including the auto-exit save if it's newer (see {@link autoExit}). */
    export async function getLast(): Promise<(GameSaveData & { id: number }) | null> {
        const backendSave = isRoves()
            ? await roves.getMostRecentSave()
            : ((
                  await gameDB.getList<GameSaveData & { id: number }>(INDEXED_DB_SAVE_TABLE, {
                      pagination: { limit: 1, offset: 0 },
                      order: { field: "date", direction: "prev" },
                  })
              )[0] ?? null);

        const autoExitSave = autoExit.peek();
        if (
            autoExitSave &&
            (!backendSave || new Date(autoExitSave.date) > new Date(backendSave.date))
        ) {
            return autoExitSave;
        }

        return backendSave;
    }

    /** Deletes the save at `id`. */
    export async function remove(id: number): Promise<unknown> {
        if (isRoves()) {
            return await rovesSaves.delete(id);
        }
        return await gameDB.deleteRow(INDEXED_DB_SAVE_TABLE, id);
    }

    /** Downloads `data` (or a fresh snapshot of the current game) as a `.json` file. */
    export async function download(data?: GameSaveData) {
        data ??= await create();
        const jsonString = JSON.stringify(data);
        // download the save data as a JSON file
        const blob = new Blob([jsonString], { type: "application/json" });
        // download the file
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${__APP_NAME__}-${__APP_VERSION__}-${data.name} ${data.date.toISOString()}.${SAVE_FILE_EXTENSION}`;
        a.click();
    }

    /** Prompts the player for a `.json` save file and restores game state from it. */
    export function loadFromFile(afterLoad?: (error?: Error) => void) {
        // load the save data from a JSON file
        const input = document.createElement("input");
        input.type = "file";
        input.accept = `application/${SAVE_FILE_EXTENSION}`;
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const jsonString = e.target?.result as string;
                    const data: GameSaveData = JSON.parse(jsonString);
                    // load the save data from the JSON string
                    restore(data)
                        .then(() => {
                            afterLoad?.();
                        })
                        .catch((err) => {
                            afterLoad?.(err);
                        });
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    /** Restores game state from previously-created {@link GameSaveData}. */
    export async function restore(saveData: GameSaveData) {
        await Game.restoreGameState(saveData.saveData);
    }

    /** Human-readable label for a save slot, e.g. "File 01" or "Quick Save 2". */
    export function getSlotLabel(id: number, t: (key: string) => string): string {
        if (quickSave.isId(id)) {
            return `${t("quick_save")} ${quickSave.getSlotNumber(id)}`;
        }
        return `${t("save_slot")} ${String(id + 1).padStart(2, "0")}`;
    }
}

/**
 * Quick saves live in a fixed, reserved range of negative ids (`-2`, `-3`, ...) so they never
 * collide with the auto-incrementing ids used by manual saves (`0`, `1`, ...) or with the `-1`
 * id reserved for the auto-exit save (see {@link autoExit}).
 */
export async function quickSave(): Promise<GameSaveData & { id: number }> {
    const ids = quickSave.getIds();
    const slots = await Promise.all(ids.map((id) => save.get(id)));

    let targetIndex = slots.findIndex((slot) => !slot);
    if (targetIndex === -1) {
        targetIndex = 0;
        for (let index = 1; index < slots.length; index++) {
            const slot = slots[index];
            const oldest = slots[targetIndex];
            if (slot && oldest && new Date(slot.date) < new Date(oldest.date)) {
                targetIndex = index;
            }
        }
    }

    return save({ id: ids[targetIndex] });
}

export namespace quickSave {
    const QUICK_SAVE_ID_START = -2;
    /** Number of quick-save slots. */
    const QUICK_SAVE_SLOTS = 6;

    function idForSlot(slotIndex: number): number {
        return QUICK_SAVE_ID_START - slotIndex;
    }

    /** Every quick-save slot id, in slot order. */
    export function getIds(): number[] {
        return Array.from({ length: QUICK_SAVE_SLOTS }, (_, index) => idForSlot(index));
    }

    /** Whether `id` falls in the quick-save id range. */
    export function isId(id: number): boolean {
        return id <= QUICK_SAVE_ID_START;
    }

    /** 1-based slot number for a quick-save id, for display purposes. */
    export function getSlotNumber(id: number): number {
        return QUICK_SAVE_ID_START - id + 1;
    }
}

/**
 * The auto-exit save intentionally always stays in localStorage, regardless of the save
 * storage backend used by {@link save}, since it's a same-page fast path read on every
 * route load.
 */
export namespace autoExit {
    const AUTO_EXIT_SAVE_LOCAL_STORAGE_KEY = "auto_exit_save";

    /** Snapshots the current game state into localStorage, e.g. before the tab closes/hides. */
    export async function add() {
        const data = await create();
        const jsonString = JSON.stringify(data);
        if (jsonString) {
            localStorage.setItem(AUTO_EXIT_SAVE_LOCAL_STORAGE_KEY, jsonString);
        }
    }

    /** Restores the auto-exit save, if any, and clears it on success. */
    export async function load(): Promise<boolean> {
        const jsonString = localStorage.getItem(AUTO_EXIT_SAVE_LOCAL_STORAGE_KEY);
        if (jsonString) {
            const data: GameSaveData = JSON.parse(jsonString);

            return save
                .restore(data)
                .then(() => {
                    localStorage.removeItem(AUTO_EXIT_SAVE_LOCAL_STORAGE_KEY);
                    return true;
                })
                .catch(() => {
                    Game.clear();
                    return false;
                });
        } else {
            return false;
        }
    }

    /** The auto-exit save, if any, without consuming it — used by {@link save.getLast}. */
    export function peek(): (GameSaveData & { id: number }) | null {
        const jsonString = localStorage.getItem(AUTO_EXIT_SAVE_LOCAL_STORAGE_KEY);
        if (!jsonString) {
            return null;
        }
        return { ...(JSON.parse(jsonString) as GameSaveData), id: -1 };
    }
}
