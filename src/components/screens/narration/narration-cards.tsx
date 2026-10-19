import { NextStepLoadingDots } from "@/components/loading";
import { QuickTools } from "@/components/quick-tools";
import { Card, CardContent } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNarrationPointerHandlers } from "@/lib/hooks/narration-hooks";
import { useQueryDialogue } from "@/lib/query/narration-query";
import { TextDisplaySettings } from "@/lib/stores/text-display-settings-store";
import { useSelector } from "@tanstack/react-store";
import { type RefObject, memo, useCallback, useMemo, useRef } from "react";
import { MarkdownTypewriter } from "markdown-typewriter/react";

export function NarrationCards() {
    const { data: { character } = {} } = useQueryDialogue();
    const paragraphRef = useRef<HTMLDivElement>(null);
    const characterName = `${character?.name || ""} ${character?.surname || ""}`.trim();
    const { handlePointerDown, handlePointerCancel, handlePointerUp } =
        useNarrationPointerHandlers();

    return (
        <div className="flex h-full flex-col">
            <Card className="pointer-events-none min-h-0 flex-1 gap-1 px-1.5 pb-1.5 py-4">
                <div className="min-h-0 flex-1">
                    <ResizablePanelGroup orientation="horizontal">
                        {character?.icon && (
                            <ResizablePanel defaultSize={"16%"}>
                                <CharacterIcon icon={character.icon} alt={characterName} />
                            </ResizablePanel>
                        )}
                        {character?.icon && <ResizableHandle />}
                        <ResizablePanel>
                            <div className="flex h-full flex-col">
                                <CardContent className="min-h-0 flex-1 px-3">
                                    <ScrollArea
                                        ref={paragraphRef}
                                        className="h-full"
                                        onPointerDown={handlePointerDown}
                                        onPointerCancel={handlePointerCancel}
                                        onPointerUp={handlePointerUp}
                                    >
                                        {character && (
                                            <p
                                                className="text-xl font-bold"
                                                style={{ color: character?.color }}
                                            >
                                                {characterName}
                                            </p>
                                        )}
                                        <Text paragraphRef={paragraphRef} />
                                    </ScrollArea>
                                </CardContent>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
                <QuickTools />
            </Card>
        </div>
    );
}

export const Text = memo(function Text({
    paragraphRef,
}: {
    paragraphRef: RefObject<HTMLDivElement | null>;
}) {
    const typewriterDelay = useSelector(TextDisplaySettings.store, (state) => state.delay);
    const { data: { animatedText, text } = {}, finalizeDialogue } = useQueryDialogue();

    const handleCharacterAnimationComplete = useCallback(
        (ref: { current: HTMLSpanElement | null }) => {
            const container = paragraphRef.current?.querySelector<HTMLElement>(
                '[data-slot="scroll-area-viewport"]',
            );
            const char = ref.current;
            if (container && char) {
                const containerRect = container.getBoundingClientRect();
                const charRect = char.getBoundingClientRect();
                const charOffsetInContainer =
                    charRect.top - containerRect.top + container.scrollTop;
                const scrollTop = charOffsetInContainer - container.clientHeight / 2;
                container.scrollTo({
                    top: scrollTop,
                    behavior: "smooth",
                });
            }
        },
        [paragraphRef],
    );

    const markdownComponents = useMemo(() => ({ p: (props: object) => <span {...props} /> }), []);

    const motionProps = useMemo(
        () => ({
            onAnimationStart: TextDisplaySettings.start,
            onAnimationComplete: (definition: "visible" | "hidden") => {
                if (definition === "visible") {
                    finalizeDialogue();
                    TextDisplaySettings.end();
                }
            },
            onCharacterAnimationComplete: handleCharacterAnimationComplete,
        }),
        [finalizeDialogue, handleCharacterAnimationComplete],
    );

    const specialCharacters = useMemo(
        () => ({
            ".": { delayAfter: typewriterDelay + 300 },
            "!": { delayAfter: typewriterDelay + 300 },
            "?": { delayAfter: typewriterDelay + 300 },
            ",": { delayAfter: typewriterDelay + 75 },
            ":": { delay: typewriterDelay + 50, delayAfter: typewriterDelay + 150 },
        }),
        [typewriterDelay],
    );

    return (
        <p className="prose dark:prose-invert m-0 max-w-full p-0">
            <span>
                {/* Already typed out: rendered like the animated text, without the animation. */}
                <MarkdownTypewriter allowHtml animated={false} components={markdownComponents}>
                    {text}
                </MarkdownTypewriter>
            </span>
            <span>
                <span> </span>
                <MarkdownTypewriter
                    allowHtml
                    delay={typewriterDelay}
                    motionProps={motionProps}
                    specialCharacters={specialCharacters}
                >
                    {animatedText}
                </MarkdownTypewriter>
            </span>
            <NextStepLoadingDots />
        </p>
    );
});

export function CharacterIcon({ alt, icon }: { icon: string; alt: string }) {
    return (
        <div className="h-full w-full">
            <Image src={icon} layout="fullWidth" alt={alt} className="h-full w-full object-cover" />
        </div>
    );
}
