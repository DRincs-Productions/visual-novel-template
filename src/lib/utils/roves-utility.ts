import type GameSaveData from "@/models/GameSaveData";
import { saves as rovesSaves } from "@drincs/roves-api/saves";

/**
 * Quick-save ids are negative (see `save-utility.ts`'s `quickSave` namespace) purely so they
 * never collide with the auto-incrementing manual-save ids (`0`, `1`, ...) -- but a raw
 * negative number makes an ugly on-disk file name (`-2.save`, `-3.save`, ...). Maps a
 * quick-save id to a `quicksave-<N>.save` key instead; every other id keeps its plain numeric
 * key unchanged, so existing manual-save files stay readable with no migration. The auto-exit
 * save's id (`-1`) never reaches this function -- it's only ever read/written via
 * `localStorage` in `save-utility.ts`'s own `autoExit` namespace, not through the roves saves
 * backend at all.
 */
function toRovesKey(id: number): string {
    return id < 0 ? `quicksave-${-id - 2}` : String(id);
}

function fromRovesKey(key: string): number {
    return key.startsWith("quicksave-") ? -(Number(key.slice("quicksave-".length)) + 2) : Number(key);
}

export namespace roves {
    export async function getSave(id: number): Promise<(GameSaveData & { id: number }) | null> {
        const item = await rovesSaves.readJSON<GameSaveData & { id: number }>(toRovesKey(id));
        if (item) {
            return { ...item, date: new Date(item.date), id };
        } else {
            return null;
        }
    }

    /** Writes `data` under `id`'s roves-backed key (see {@link toRovesKey}). */
    export async function writeSave(id: number, data: unknown): Promise<boolean> {
        return rovesSaves.writeText(toRovesKey(id), data);
    }

    /** Deletes the roves-backed save at `id` (see {@link toRovesKey}). */
    export async function deleteSave(id: number): Promise<boolean> {
        return rovesSaves.delete(toRovesKey(id));
    }

    /**
     * The roves-backed save with the most recent date, across every save key — including,
     * when Steam Cloud sync is active, a save made on another machine and never pulled down
     * locally (see `@drincs/roves-api/saves`'s `getMostRecent()`). Only the winning save's
     * content is actually read, instead of every save just to compare dates.
     */
    export async function getMostRecentSave(): Promise<(GameSaveData & { id: number }) | null> {
        const mostRecent = await rovesSaves.getMostRecent();
        return mostRecent ? getSave(fromRovesKey(mostRecent.key)) : null;
    }
}
