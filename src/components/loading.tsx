import { Spinner } from "@/components/ui/spinner";
import { useQueryDialogue } from "@/lib/query/narration-query";
import { GameStatus } from "@/lib/stores/game-status-store";
import { TextDisplaySettings } from "@/lib/stores/text-display-settings-store";
import { useSelector } from "@tanstack/react-store";
import { useEffect, useState } from "react";

export function PendingComponent() {
    return (
        <div className="h-screen w-screen">
            <div className="absolute bottom-0 right-0 p-2 animate-in zoom-in-95 fade-in-0">
                <Spinner className="size-10 text-white" />
            </div>
        </div>
    );
}

export function AnimatedDots() {
    return (
        <span className="inline-flex pointer-events-none select-none">
            <span className="animate-bounce [animation-delay:0s]">.</span>
            <span className="animate-bounce [animation-delay:0.2s]">.</span>
            <span className="animate-bounce [animation-delay:0.4s]">.</span>
        </span>
    );
}

export function DelayedAnimatedDots({ delay = 300 }: { delay?: number }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const id = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(id);
    }, [delay]);
    return visible ? <AnimatedDots /> : null;
}

export function NextStepLoadingDots() {
    const nextStepLoading = useSelector(GameStatus.store, (state) => state.loading);
    const typewriterInProgress = useSelector(
        TextDisplaySettings.store,
        (state) => state.inProgress,
    );
    const { isLoading } = useQueryDialogue();

    if (typewriterInProgress || (!nextStepLoading && !isLoading)) {
        return null;
    }

    return (
        <span className="ml-1 inline-flex">
            <DelayedAnimatedDots />
        </span>
    );
}
