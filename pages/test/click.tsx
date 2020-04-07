import {useCallback, useEffect, useState} from "react";
import useTimesync from "../../lib/useTimesync";
import {Button} from "baseui/button";
import firebase from "firebase/app";
import "firebase/firestore";
import initFirebase from "../../lib/initFirebase";
import useClick from "../../lib/useClick";
import {Checkbox, LABEL_PLACEMENT} from "baseui/checkbox";

initFirebase();

export default () => {
    const [offsetTime, setOffsetTime] = useState<number>(0);
    const [useOffset, setUseOffset] = useState<boolean>(true);

    // Audio specific
    const [startTime, setStartTime] = useState<number>(0);
    const {enabled, enableClick, playing, setPlaying} = useClick({
        bpm: 120,
        startTime: startTime,
        offset: useOffset ? offsetTime : 0,
        timeSignature: {
            beats: 4,
            measure: 4
        }
    });


    // Timesync specific
    const {timesync, offset} = useTimesync();
    const [timeText, setTimeText] = useState<string>("");


    // We prepare the text output of time and offset
    useEffect(() => {
        if (timesync) {
            const id = setInterval(() => {
                const now = new Date(timesync.now());
                setTimeText(now.toISOString());
            });
            return () => {
                clearInterval(id);
            }
        }
    }, [timesync]);

    useEffect(() => {
        setOffsetTime(offset);
    }, [offset]);


    // Now we prepare the playback handling of the click
    useEffect(() => {
        // Listen to changes in firebase
        firebase.firestore().collection('rooms').doc('test').onSnapshot(
            (doc) => {
                const data = doc.data();
                console.log(data);
                if (data) {
                    if (data.playing) {
                        console.log("Start playing at " + data.startTime);
                        setStartTime(data.startTime);
                        setPlaying(true);
                    } else {
                        console.log("Stop playing");
                        setPlaying(false);
                    }
                }
            }
        );
    }, []);
    const toggleClick = useCallback(() => {
        if (playing) {
            console.log("Emit to stop playing");
            firebase.firestore().collection('rooms').doc('test').set({
                playing: false
            }).catch(err => console.error(err));
        } else {
            if (timesync) {
                console.log("Emit to start playing");
                const startTime = (new Date(timesync.now())).getTime() + 1000;
                console.log("Playing at " + startTime);
                firebase.firestore().collection('rooms').doc('test').set({
                    startTime: startTime,
                    playing: true
                }).catch(err => console.error(err));
            } else {
                console.error("Timesync not ready");
            }
        }
    }, [timesync, playing]);

    return (
        <div>
            <h1>Time is {timeText}</h1>
            {offsetTime && (
                <h2>Offset is {offsetTime}</h2>
            )}
            {enabled ? (
                <>
                    <Button onClick={toggleClick}>
                        {playing ? "Stop" : "Start"} click
                    </Button>

                    <Checkbox
                        checked={useOffset}
                        onChange={e => setUseOffset(e.currentTarget.checked)}
                        labelPlacement={LABEL_PLACEMENT.right}
                    >
                        Offset kompensieren (Please restart click afterwards)
                    </Checkbox>
                </>
            ) : (
                <Button onClick={enableClick}>
                    Enable click
                </Button>
            )}

        </div>
    );
};


