import type GameSaveData from "@/models/GameSaveData";
import { saves as rovesSaves } from "@drincs/roves-api/saves";

export namespace roves {
    export async function getSave(id: number): Promise<(GameSaveData & { id: number }) | null> {
        const item = await rovesSaves.readJSON<GameSaveData & { id: number }>(id);
        if (item) {
            return { ...item, date: new Date(item.date), id };
        } else {
            return null;
        }
    }

    /**
     * The roves-backed save with the most recent date, across every save key — including,
     * when Steam Cloud sync is active, a save made on another machine and never pulled down
     * locally (see `@drincs/roves-api/saves`'s `getMostRecent()`). Only the winning save's
     * content is actually read, instead of every save just to compare dates.
     */
    export async function getMostRecentSave(): Promise<(GameSaveData & { id: number }) | null> {
        const mostRecent = await rovesSaves.getMostRecent();
        return mostRecent ? getSave(Number(mostRecent.key)) : null;
    }
}
