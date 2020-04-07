import {useEffect, useState} from "react";
import firebase from "firebase/app";
import "firebase/firestore";
import Room from "./room";
import initFirebase from "../initFirebase";

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

function registerPeerConnectionListeners(peerConnection: RTCPeerConnection) {
    peerConnection.addEventListener('icegatheringstatechange', () => {
        console.log(
            `ICE gathering state changed: ${peerConnection.iceGatheringState}`);
    });

    peerConnection.addEventListener('connectionstatechange', () => {
        console.log(`Connection state change: ${peerConnection.connectionState}`);
    });

    peerConnection.addEventListener('signalingstatechange', () => {
        console.log(`Signaling state change: ${peerConnection.signalingState}`);
    });

    peerConnection.addEventListener('iceconnectionstatechange ', () => {
        console.log(
            `ICE connection state change: ${peerConnection.iceConnectionState}`);
    });
}

export const useWebRTC = () => {
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();
    const [localStream, setLocalStream] = useState<MediaStream>();
    const [remoteStream, setRemoteStream] = useState<MediaStream>();
    const [roomId, setRoomId] = useState<string>();

    useEffect(() => {
        console.log("TODO: Register listener");
        const peerConnection = new RTCPeerConnection(configuration);
        setPeerConnection(peerConnection);
        registerPeerConnectionListeners(peerConnection);

        const remoteStream: MediaStream = new MediaStream();

        const handleTrack = async (event) => {
            console.log('Got remote track:', event.streams[0]);
            event.streams[0].getTracks().forEach(track => {
                console.log('Add a track to the remoteStream:', track);
                remoteStream.addTrack(track);
            });
        };

        // Use local video and audio device
        navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then((stream: MediaStream) => {
                // The following could also performed later first (on create or join)
                stream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, stream);
                });
                setLocalStream(stream);
            });

        peerConnection.addEventListener('track', handleTrack);

        setRemoteStream(remoteStream);
        return () => {
            // Unregister listeners and handlers
            console.log("TODO: Unregister listener");
            peerConnection.removeEventListener('track', handleTrack);
            peerConnection.close();
            setPeerConnection(undefined);
            setRemoteStream(undefined);
            setLocalStream(undefined);
        }
    }, []);


    const createRoom = async (clickStart: number) => {
        console.log("createRoom");

        const roomRef = await firebase.firestore().collection('rooms').doc();
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
        const roomWithOffer: any = {
            offers: [{
                type: offer.type,
                sdp: offer.sdp
            }],
            click: {
                playing: false,
                startTime: 0,
                bpm: 60,
                timeSignature: {
                    beats: 4,
                    measure: 4
                }
            }
        };
        await roomRef.set(roomWithOffer);
        console.log("Room ID:");
        console.log(roomRef.id);
        setRoomId(roomRef.id);
        roomRef.onSnapshot(async (snapshot: firebase.firestore.DocumentSnapshot) => {
            console.log('Got updated room:', snapshot.data());
            const data = snapshot.data();
            if (!peerConnection.currentRemoteDescription && data.answer) {
                console.log('Set remote description: ', data.answer);
                const answer = new RTCSessionDescription(data.answer);
                await peerConnection.setRemoteDescription(answer);
            }
        });
        roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
            snapshot.docChanges().forEach(async change => {
                if (change.type === 'added') {
                    let data = change.doc.data();
                    console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                    await peerConnection.addIceCandidate(new RTCIceCandidate(data));
                }
            });
        });
    };

    const joinRoom = async (roomId: string) => {
        const roomRef = firebase.firestore().collection('rooms').doc(roomId);
        const roomSnapshot = await roomRef.get();
        console.log('Got room:', roomSnapshot.exists);
        if (roomSnapshot.exists) {
            console.log('Create PeerConnection with configuration: ', configuration);
            const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
            peerConnection.addEventListener('icecandidate', event => {
                if (!event.candidate) {
                    console.log('Got final candidate!');
                    return;
                }
                console.log('Got candidate: ', event.candidate);
                calleeCandidatesCollection.add(event.candidate.toJSON());
            });
            const offer = roomSnapshot.data().offer;
            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            const roomWithAnswer = {
                answer: {
                    type: answer.type,
                    sdp: answer.sdp
                }
            };
            await roomRef.update(roomWithAnswer);

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
        }
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
