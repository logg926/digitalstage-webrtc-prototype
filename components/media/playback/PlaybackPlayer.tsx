import PlaybackController, {PlaybackFile} from "./PlaybackController";
import React, {useEffect, useState} from "react";
import firebase from "firebase/app";
import "firebase/firestore";
import initFirebase from "../../../lib/initFirebase";
import {IAudioContext, IAudioNode} from "standardized-audio-context";

initFirebase();

const localFiles: PlaybackFile[] = [
    {label: "Bass", url: "/song/bass.wav"},
    {label: "Drums", url: "/song/drums.wav"},
    {label: "Synth 1", url: "/song/synth.wav"},
    {label: "Synth 2", url: "/song/synth2.wav"}
];

export default (props: {
    audioContext?: IAudioContext,
    target?: IAudioNode<IAudioContext>,
    offset: number
}) => {
    const [files, setFiles] = useState<PlaybackFile[]>(localFiles);

    useEffect(() => {
        firebase.firestore().collection("playbacks").doc("test").collection("files").onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
            setFiles(
                snapshot.docs.map(doc => doc.data() as PlaybackFile)
            );
        });
    }, []);

    return (
        <PlaybackController offset={props.offset} target={props.target} files={files} context={props.audioContext}/>
    )
};
