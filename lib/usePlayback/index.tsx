import {useCallback, useEffect, useState} from "react";
import {BufferLoader} from "../useClick/BufferLoader";
import {fixAudioContextAPI} from "../useClick/AudioContextMokeyPatch";
import useCountDown from 'react-countdown-hook';

fixAudioContextAPI();

const calculateNextStartTime = (startTime: number, offset: number = 0, trackLength: number): number => {
    const now = Date.now() + offset;
    if (startTime < now) {
        // Start time is in past
        return (trackLength - ((now - startTime) % trackLength)) / 1000;
    }
    // Start time is in future
    return (startTime - now) / 1000;
};

export default (props: {
    startTime: number,
    context?: AudioContext,
    offset?: number,
    target?: AudioNode,
    filePath?: string
}) => {
    const [playing, setPlaying] = useState<boolean>(false);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
    const [bufferNode, setBufferNode] = useState<AudioBufferSourceNode>();
    const [timeLeft, start] = useCountDown(0, 1000);

    useEffect(() => {
        if (props.context) {
            // Create buffer
            if (props.filePath) {
                setAudioBuffer(undefined);
                new BufferLoader(props.context).loadBuffer(props.filePath).then(
                    (audioBuffer: AudioBuffer) => {
                        setAudioBuffer(audioBuffer);
                    }
                )
            }
        }
    }, [props.context, props.filePath]);

    const play = useCallback(() => {
        if (!bufferNode) {
            if (props.context) {
                if (audioBuffer) {
                    const bufferNode: AudioBufferSourceNode = props.context.createBufferSource();
                    if (props.target) {
                        bufferNode.connect(props.target);
                    } else {
                        bufferNode.connect(props.context.destination);
                    }
                    bufferNode.buffer = audioBuffer;
                    const nextStartTime: number = calculateNextStartTime(props.startTime, props.offset ? props.offset : 0, audioBuffer.duration * 1000);
                    bufferNode.loop = true;
                    bufferNode.start(props.context.currentTime + nextStartTime);
                    setBufferNode(bufferNode);
                    start(nextStartTime * 1000);
                } else {
                    console.error("No audio buffer available");
                }
            } else {
                console.error("No context available");
            }
        } else {
            console.error("No buffer node available");
        }
    }, [bufferNode, audioBuffer, props.target, props.context, props.startTime, props.offset, start]);

    const stop = useCallback(() => {
        if (bufferNode) {
            bufferNode.stop();
            setBufferNode(undefined);
        }
    }, [bufferNode]);

    useEffect(() => {
        if (playing) {
            play();
        } else {
            stop();
        }
    }, [playing]);

    return {
        playing,
        setPlaying,
        ready: audioBuffer !== undefined,
        countdown: timeLeft
    };
}
