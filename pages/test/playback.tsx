import PlaybackController, {PlaybackFile} from "../../components/media/playback/PlaybackController";
import React, {useCallback, useEffect, useState} from "react";
import FileUploader from "../../components/media/playback/FileUploader";
import {Input} from "baseui/input";
import {Button} from "baseui/button";
import {styled} from "baseui";
import firebase from "firebase/app";
import "firebase/storage";
import "firebase/firestore";
import initFirebase from "../../lib/initFirebase";
import useTimesync from "../../lib/useTimesync";
import {AudioContext, IAudioContext} from "standardized-audio-context";

initFirebase();

const Row = styled('div', {
    display: 'flex',
    flexDirection: 'row',
    width: '100%'
});

export default () => {
    const [files, setFiles] = useState<PlaybackFile[]>();
    const [audioContext, setAudioContext] = useState<AudioContext>();
    const [room, setRoom] = useState<string>("");
    const [storageRef, setStorageRef] = useState<firebase.storage.Reference>();
    const {offset} = useTimesync();

    useEffect(() => {
        // @ts-ignore
        const audioContext: IAudioContext = new AudioContext();
        /*webAudioTouchUnlock(audioContext)
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

    const join = useCallback(() => {
        if (room) {
            const storageRef = firebase.storage().ref("playbacks/" + room);
            setStorageRef(storageRef);
            firebase.firestore().collection("playbacks").doc(room).collection("files").onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
                setFiles(
                    snapshot.docs.map(doc => doc.data() as PlaybackFile)
                );
            });
        }
    }, [room]);

    return (
        <div>
            {!storageRef && (
                <Row>
                    <Input value={room} onChange={(e) => setRoom(e.currentTarget.value)} type="text"/>
                    <Button disabled={!room || room.length < 3} onClick={() => {
                        join()
                    }}>JOIN</Button>
                </Row>
            )}
            <FileUploader onUploaded={(file: File, url: string) => {
                firebase.firestore().collection("playbacks").doc(room).collection("files").add({
                    label: file.name,
                    url: url
                });
            }} storageRef={storageRef}/>
            <PlaybackController offset={offset} files={files} context={audioContext}/>
        </div>
    )
};
