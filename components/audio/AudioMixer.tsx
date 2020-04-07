import React, {useEffect, useState} from "react";
import {Slider} from "baseui/slider";
import {Checkbox} from "baseui/checkbox";

interface AudioTrack {
    id: string;
    mediaStreamTrack: MediaStreamTrack;
    gainNode: GainNode;
    volume: number;
    muted: boolean;
}

export default (props: {
    mediaStreamTracks: MediaStreamTrack[];
    onStreamAvailable?: (stream: MediaStream) => void;
    audioContext: AudioContext;
    targets: AudioNode[];
}) => {
    const [audioContext, setAudioContext] = useState<AudioContext>(props.audioContext);
    const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);

    useEffect(() => {
        if (!audioContext) {
            const audioContext = new AudioContext();
            setAudioContext(audioContext);
        }
    }, []);

    useEffect(() => {
        const currentAudioTrack: AudioTrack[] = audioTracks.filter((audioTrack: AudioTrack) => props.mediaStreamTracks.find((mediaStreamTrack: MediaStreamTrack) => mediaStreamTrack.id === audioTrack.id));
        props.mediaStreamTracks.forEach(
            (mediaStreamTrack: MediaStreamTrack) => {
                let audioTrack: AudioTrack | undefined = currentAudioTrack.find((audioTrack: AudioTrack) => audioTrack.id === mediaStreamTrack.id);
                if (!audioTrack) {
                    const gainNode: GainNode = props.audioContext.createGain();
                    const stream = props.audioContext.createMediaStreamTrackSource(mediaStreamTrack);
                    stream.connect(gainNode);
                    props.targets.forEach(
                        (target: AudioNode) => gainNode.connect(target)
                    );
                    currentAudioTrack.push({
                        id: mediaStreamTrack.id,
                        mediaStreamTrack: mediaStreamTrack,
                        gainNode: gainNode,
                        volume: gainNode.gain.value,
                        muted: true
                    });
                }
            }
        );
        setAudioTracks(currentAudioTrack);
    }, [props.mediaStreamTracks]);

    const muteAudioTrack = (id: string, muted: boolean) => {
        setAudioTracks(
            prev => prev.map((audioTrack: AudioTrack) => {
                if (audioTrack.id === id) {
                    audioTrack.muted = muted;
                    if (audioTrack.muted) {
                        audioTrack.gainNode.gain.setValueAtTime(0, props.audioContext.currentTime);
                    } else {
                        audioTrack.gainNode.gain.setValueAtTime(audioTrack.volume, props.audioContext.currentTime);
                    }
                }
                return audioTrack;
            })
        )
    };

    const changeAudioTrackVolume = (id: string, volume: number) => {
        setAudioTracks(
            prev => prev.map((audioTrack: AudioTrack) => {
                if (audioTrack.id === id) {
                    audioTrack.volume = volume;
                    if (audioTrack.muted) {
                        audioTrack.gainNode.gain.setValueAtTime(0, props.audioContext.currentTime);
                    } else {
                        audioTrack.gainNode.gain.setValueAtTime(volume, props.audioContext.currentTime);
                    }
                }
                return audioTrack;
            })
        )
    };

    return (
        <div>
            {audioTracks.map((audioTrack: AudioTrack) => (
                <div>
                    <Checkbox checked={audioTrack.muted}
                              onChange={(e) => muteAudioTrack(audioTrack.id, e.currentTarget.checked)}/>
                    {audioTrack.id}
                    <Slider value={[audioTrack.volume]}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(s) => changeAudioTrackVolume(audioTrack.id, s.value[0])}/>
                </div>
            ))}
        </div>
    )
};
