import {useEffect, useState} from "react";
import initFirebase from "../initFirebase";
import firebase from "firebase/app";
import "firebase/firestore";
import {Answer, Room} from "./room";

initFirebase();

const configuration = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ],
    iceCandidatePoolSize: 10,
};

export const useWebRTC = () => {
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();
    const [localStream, setLocalStream] = useState<MediaStream>();
    const [remoteStream, setRemoteStream] = useState<MediaStream>();
    const [alias, setAlias] = useState<string>();
    const [roomId, setRoomId] = useState<string>();
    const [isCaller, setCaller] = useState<boolean>();

    const handleTrack = async (event) => {
        console.log('Got remote track:', event.streams[0]);
        event.streams[0].getTracks().forEach(track => {
            console.log('Add a track to the remoteStream:', track);
            remoteStream.addTrack(track);
        });
    };

    const createConnection = (): Promise<void> => {
        const peerConnection = new RTCPeerConnection(configuration);
        setPeerConnection(peerConnection);
        const remoteStream: MediaStream = new MediaStream();
        return navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then((stream: MediaStream) => {
                // The following could also performed later first (on create or join)
                stream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, stream);
                });
                setLocalStream(stream);
                setRemoteStream(remoteStream);
                peerConnection.addEventListener('track', handleTrack);
            });
    };

    useEffect(() => {
        // Cleanup
        return () => {
            if (peerConnection) {
                // Remote myself from firebase
                if (roomId) {
                    const roomRef = firebase.firestore().collection("room").doc(roomId);
                    if (isCaller) {
                        roomRef.delete();   //TODO: Maybe just remove the offer and keep the room alive and let the offer be replaced by the next caller?
                    } else {
                        roomRef.collection("answer").doc("")
                    }
                }
                peerConnection.removeEventListener('track', handleTrack);
                peerConnection.close();
            }
        }
    }, []);


    const createRoom = (roomId: string, alias: string): Promise<boolean> => {
        const roomRef = firebase.firestore().collection("rooms").doc(roomId);
        return roomRef.get()
            .then((doc: firebase.firestore.DocumentSnapshot) => {
                if (doc.exists) {
                    console.error("Room already exists: ", doc.data());
                    return false;
                } else {
                    //TODO: Create offer
                    return createConnection().then(
                        async () => {
                            // Listen for offering people
                            const callerCandidatesCollection = roomRef.collection('callerCandidates');
                            peerConnection.addEventListener('icecandidate', event => {
                                if (!event.candidate) {
                                    console.log('Got final candidate!');
                                    return;
                                }
                                console.log('Got candidate: ', event.candidate);
                                callerCandidatesCollection.add(event.candidate.toJSON());
                            });
                            const offer: RTCSessionDescriptionInit = await peerConnection.createOffer();
                            await peerConnection.setLocalDescription(offer);
                            const room: Room = {
                                offer: {
                                    type: offer.type,
                                    sdp: offer.sdp
                                },
                                click: {
                                    playing: false,
                                    startTime: 0,
                                    bpm: 120,
                                    timeSignature: {
                                        beats: 4,
                                        measure: 4
                                    }
                                }
                            };
                            // Create room
                            await roomRef.set(room);

                            // Listen inside room
                            roomRef.onSnapshot(async (snapshot: firebase.firestore.DocumentSnapshot) => {
                                console.log('Got updated room:', snapshot.data());
                                const data = snapshot.data();
                                if (!peerConnection.currentRemoteDescription && data.answer) {
                                    console.log('Set remote description: ', data.answer);
                                    const answer = new RTCSessionDescription(data.answer);
                                    await peerConnection.setRemoteDescription(answer);
                                }
                            });
                            // Listen for joining people
                            roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
                                snapshot.docChanges().forEach(async change => {
                                    if (change.type === 'added') {
                                        let data = change.doc.data();
                                        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                                        await peerConnection.addIceCandidate(new RTCIceCandidate(data));
                                    }
                                });
                            });

                            setCaller(true);
                            setRoomId(roomId);
                            setAlias(alias);
                            return true;
                        }
                    ).catch(
                        (error) => {
                            console.error("No permission given:", error);
                            return false;
                        }
                    );
                }
            }).catch(function (error) {
                console.error("Error getting document:", error);
                return false;
            });
    };

    const joinRoom = (roomId: string, alias: string): Promise<boolean> => {
        const roomRef = firebase.firestore().collection("rooms").doc(roomId);
        return roomRef.get()
            .then(
                (snapshot: firebase.firestore.DocumentSnapshot) => {
                    return createConnection().then(
                        () => {
                            const answer: Answer = {};
                            const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
                            peerConnection.addEventListener('icecandidate', event => {
                                if (!event.candidate) {
                                    console.log('Got final candidate!');
                                    return;
                                }
                                console.log('Got candidate: ', event.candidate);
                                calleeCandidatesCollection.add(event.candidate.toJSON());
                            });

                            // Listening for remote ICE candidates
                            roomRef.collection('callerCandidates').onSnapshot(snapshot => {
                                snapshot.docChanges().forEach(async change => {
                                    if (change.type === 'added') {
                                        let data = change.doc.data();
                                        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                                        await peerConnection.addIceCandidate(new RTCIceCandidate(data));
                                    }
                                });
                            });

                            setCaller(false);
                            setRoomId(roomId);
                            setAlias(alias);
                            return true;
                        }
                    )
                }
            )
            .catch(
                (error) => {
                    console.error("Error getting document:", error);
                    return false;
                }
            );
    };

    return {
        localStream,
        remoteStream,
        roomId,
        peerConnection,
        createRoom,
        joinRoom
    }
};
