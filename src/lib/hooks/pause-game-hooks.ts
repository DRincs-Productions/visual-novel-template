import { SearchParams } from "@/lib/stores/search-param-store";
import { canvas, sound } from "@drincs/pixi-vn";
import { useSelector } from "@tanstack/react-store";
import { useEffect, useMemo, useRef } from "react";

function pauseGameFromMenuOpen() {
    sound.unsaved.pauseAll();
    canvas.pause();
}

function resumeGameFromMenuClose() {
    sound.unsaved.resumeAll();
    canvas.resume();
}

/**
 * Pauses the game when at least one search param is active.
 * Resumes the game once all menu-related search params are closed.
 *
 * Must be called from a component that is only rendered on the `/game` route
 * so that pause/resume is automatically scoped to the game screen.
 */
export function usePauseGameWhenMenuIsOpen() {
    const searchParams = useSelector(SearchParams.store, (state) => state);
    const pausedByMenuRef = useRef(false);

    const hasOpenMenu = useMemo(
        () => Object.values(searchParams).some((value) => value !== undefined),
        [searchParams],
    );

    useEffect(() => {
        if (hasOpenMenu && !pausedByMenuRef.current) {
            pauseGameFromMenuOpen();
            pausedByMenuRef.current = true;
            return;
        }

        if (!hasOpenMenu && pausedByMenuRef.current) {
            resumeGameFromMenuClose();
            pausedByMenuRef.current = false;
        }
    }, [hasOpenMenu]);

    useEffect(() => {
        return () => {
            if (pausedByMenuRef.current) {
                resumeGameFromMenuClose();
                pausedByMenuRef.current = false;
            }
        };
    }, []);
}
