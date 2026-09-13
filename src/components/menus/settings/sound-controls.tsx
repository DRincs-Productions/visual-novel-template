import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChannelSound } from "@/lib/stores/channel-sound-stores";
import { MasterSound } from "@/lib/stores/master-sound-storage";
import { sound } from "@drincs/pixi-vn";
import { useSelector } from "@tanstack/react-store";
import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function SoundControls() {
    const { t } = useTranslation(["ui"]);

    const masterVolume = useSelector(MasterSound.store, (s) => s.volume);
    const masterMuted = useSelector(MasterSound.store, (s) => s.muted);

    return (
        <div className="flex flex-col gap-4">
            <SoundRow
                label={t("master_volume") || "Master"}
                helper={t("master_volume_description")}
                volume={masterVolume}
                muted={masterMuted}
                onMuteToggle={() => MasterSound.toggleMuted()}
                onVolumeChange={(v) => MasterSound.setVolume(v)}
            />

            {sound.channels.values.map((c) => (
                <SoundChannelControl
                    key={c.alias}
                    label={t(`${c.alias}_volume`)}
                    helper={t(`${c.alias}_volume_description`)}
                    alias={c.alias}
                    disabled={masterMuted}
                />
            ))}
        </div>
    );
}

function SoundRow({
    label,
    helper,
    volume,
    muted,
    disabled,
    onMuteToggle,
    onVolumeChange,
}: {
    label: string;
    helper?: string;
    volume: number;
    muted: boolean;
    disabled?: boolean;
    onMuteToggle: () => void;
    onVolumeChange: (v: number) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div>
                <p className="text-sm font-medium leading-none">{label}</p>
                {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    onClick={onMuteToggle}
                    aria-label={muted ? "Unmute" : "Mute"}
                >
                    {muted ? <VolumeXIcon /> : <Volume2Icon />}
                </Button>
                <Slider
                    min={0}
                    max={100}
                    value={[volume]}
                    onValueChange={(v) => typeof v === "number" && onVolumeChange(v)}
                    disabled={disabled}
                    className="flex-1"
                />
                <span className="w-9 text-right text-xs tabular-nums">{volume}%</span>
            </div>
        </div>
    );
}

export function SoundChannelControl({
    label,
    alias,
    disabled,
    helper,
}: {
    label: string;
    alias: string;
    disabled?: boolean;
    helper?: string;
}) {
    const store = useMemo(() => ChannelSound.getStore(alias), [alias]);
    const volume = useSelector(store, (s) => s.volume);
    const muted = useSelector(store, (s) => s.muted);

    return (
        <SoundRow
            label={label}
            helper={helper}
            volume={volume}
            muted={muted}
            disabled={disabled}
            onMuteToggle={() => ChannelSound.toggleMuted(alias)}
            onVolumeChange={(v) => ChannelSound.setVolume(alias, v)}
        />
    );
}
