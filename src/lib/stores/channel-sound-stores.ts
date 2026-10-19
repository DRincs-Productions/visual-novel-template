import { sound } from "@drincs/pixi-vn";
import { Store } from "@tanstack/store";

export type ChannelSoundState = {
    volume: number;
    muted: boolean;
};

export namespace ChannelSound {
    const storeCache = new Map<string, Store<ChannelSoundState>>();

    /**
     * Initialize the channel sound storage, syncing the sound library with stored values
     */
    export function init() {
        sound.channels.values.forEach((c) => {
            const store = getStore(c.alias);
            const muted = store.state.muted;
            setVolume(c.alias, store.state.volume);
            setMuted(c.alias, muted);
        });
    }

    export function getStore(alias: string): Store<ChannelSoundState> {
        let store = storeCache.get(alias);
        if (store) {
            return store;
        }
        const storedMuted = localStorage.getItem(`${alias}_muted`);
        store = new Store<ChannelSoundState>({
            volume: Number(
                localStorage.getItem(`${alias}_volume`) ?? sound.channels.find(alias).volume * 100,
            ),
            muted: storedMuted !== null ? storedMuted === "true" : sound.channels.find(alias).muted,
        });
        storeCache.set(alias, store);
        return store;
    }

    export function setVolume(alias: string, volume: number) {
        const store = getStore(alias);
        if (store.state.muted) {
            setMuted(alias, false);
        }
        sound.channels.find(alias).volume = volume / 100;
        localStorage.setItem(`${alias}_volume`, volume.toString());
        store.setState((state) => ({ ...state, volume: Math.round(volume) }));

        if (Math.round(volume) === 0 && !store.state.muted) {
            setMuted(alias, true);
        }
    }

    export function setMuted(alias: string, muted: boolean) {
        sound.channels.find(alias).muted = muted;
        localStorage.setItem(`${alias}_muted`, muted.toString());
        getStore(alias).setState((state) => ({ ...state, muted }));
    }

    export function toggleMuted(alias: string) {
        const curr = sound.channels.find(alias).toggleMuteAll();
        setMuted(alias, curr);
    }
}
