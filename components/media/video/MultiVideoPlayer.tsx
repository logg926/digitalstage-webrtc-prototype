import React, {useEffect, useRef} from "react";
import {styled} from "baseui";
import {Slider} from "baseui/slider";
import {Connection} from "../../../pages/test/join";

const Wrapper = styled("div", {
    position: 'relative',
    border: '1px solid white',
});
const OverlayControls = styled("div", {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 'auto',
    zIndex: 10
});
const OverlayText = styled("div", {
    position: 'absolute',
    background: 'rgba(255, 255, 255, 0.4)',
    top: 0,
    left: 0,
    zIndex: 10
});

export default (props: {
    connection?: Connection;
    debug?: boolean;
    stream: MediaStream,
    gainNode?: GainNode,
    muted?: boolean,
    className?: string,
    id: string
}) => {
    const [value, setValue] = React.useState([props.gainNode ? props.gainNode.gain.value : 1]);
    const videoRef = useRef<HTMLVideoElement>();
    const [audioRTT, setAudioRTT] = React.useState<number>(0);
    const [videoRTT, setVideoRTT] = React.useState<number>(0);

    useEffect(() => {
        if (props.stream) {
            videoRef.current.srcObject = props.stream;
        }
        return () => {
            videoRef.current.srcObject = null;
        };
    }, [props.stream]);

    useEffect(() => {
        if (props.connection) {
            if (props.debug)
                setInterval(() => {
                    if (props.connection && props.connection.connection)
                        props.connection.connection.getStats().then(
                            (rtcStatsReport: RTCStatsReport) => {
                                rtcStatsReport.forEach((rtcStats: any) => {
                                    if (rtcStats.type === "remote-inbound-rtp") {
                                        if (rtcStats.kind === "video") {
                                            setVideoRTT(rtcStats.roundTripTime);
                                        } else if (rtcStats.kind === "audio") {
                                            setAudioRTT(rtcStats.roundTripTime);
                                        }
                                    }
                                })
                            }
                        )
                }, 2000);
        }
    }, [props.connection, props.debug]);

    useEffect(() => {
        if (props.gainNode)
            props.gainNode.gain.setValueAtTime(value[0], props.gainNode.context.currentTime)
    }, [value]);

    return (
        <Wrapper>
            <video className={props.className} id={props.id} ref={videoRef} muted={props.muted} autoPlay={true}
                   playsInline={true}/>
            {props.debug && (
                <OverlayText>
                    <p>
                        Video: {videoRTT * 1000}ms
                    </p>
                    <p>
                        Audio: {audioRTT * 1000}ms
                    </p>
                </OverlayText>
            )}
            {props.gainNode && (
                <OverlayControls>
                    <Slider
                        value={value}
                        onChange={({value}) => value && setValue(value)}
                        max={1}
                        step={0.01}
                    />
                </OverlayControls>
            )}
        </Wrapper>
    );
}
