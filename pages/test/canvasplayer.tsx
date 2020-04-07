import CanvasPlayer from "../../components/media/video/CanvasPlayer";
import React, {useCallback, useEffect, useState} from "react";
import {Button} from "baseui/button";
import AudioMixer from "../../components/media/audio/AudioMixer";
import { AudioContext } from 'standardized-audio-context';
import {IAudioContext} from "standardized-audio-context/build/es2019/interfaces";
import {fixWebRTC} from "../../lib/fixWebRTC";


export default () => {
    const [localStream, setLocalStream] = useState<MediaStream>();
    const [videoTracks, setVideoTracks] = useState<MediaStreamTrack[]>([]);
    const [audioTracks, setAudioTracks] = useState<MediaStreamTrack[]>([]);
    const [audioContext, setAudioContext] = useState<AudioContext>();


    useEffect(() => {
        fixWebRTC();
        navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then((stream: MediaStream) => {
                setLocalStream(stream);
            });
        const audioContext: IAudioContext = new AudioContext();
        // @ts-ignore
        /*const audioContext: AudioContext = new (window.AudioContext || window.webkitAudioContext)();
        webAudioTouchUnlock(audioContext)
            .then((unlocked: boolean) => {
                if (unlocked) {
                    // AudioContext was unlocked from an explicit user action, sound should start playing now
                } else {
                    // There was no need for unlocking, devices other than iOS
                }
            }, (reason: any) => {
                console.error(reason);
            });*/
        setAudioContext(audioContext);
    }, []);

    const addStream = useCallback(() => {
        if (localStream) {
            const videoTrack: MediaStreamTrack = localStream.getVideoTracks()[0];
            const audioTrack: MediaStreamTrack = localStream.getAudioTracks()[0];
            setVideoTracks(prev => ([videoTrack.clone(), ...prev]));
            setAudioTracks(prev => ([audioTrack.clone(), ...prev]));
        }
    }, [localStream]);

    return (
        <>
            <Button onClick={addStream}>
                Add track
            </Button>
            <CanvasPlayer width={1920} height={1080} videoTracks={videoTracks}/>
            <AudioMixer audioContext={audioContext}
                        targets={audioContext ? [audioContext.destination] : []}
                        mediaStreamTracks={audioTracks}/>
        </>
    )
}
