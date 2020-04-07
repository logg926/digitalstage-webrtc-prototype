import CanvasPlayer from "../../components/video/CanvasPlayer";
import React, {useCallback, useEffect, useState} from "react";
import {Button} from "baseui/button";
import AudioMixer from "../../components/audio/AudioMixer";

export default () => {
    const [localStream, setLocalStream] = useState<MediaStream>();
    const [videoTracks, setVideoTracks] = useState<MediaStreamTrack[]>([]);
    const [audioTracks, setAudioTracks] = useState<MediaStreamTrack[]>([]);
    const [audioContext, setAudioContext] = useState<AudioContext>();


    useEffect(() => {
        navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then((stream: MediaStream) => {
                setLocalStream(stream);
            });
        setAudioContext(new AudioContext());
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
