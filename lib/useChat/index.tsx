import firebase from "firebase/app";
import "firebase/firestore";
import {useCallback, useEffect, useState} from "react";
import initFirebase from "../initFirebase";

initFirebase();

const configuration: RTCConfiguration = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ]
        },
        {
            urls: ['turn:numb.viagenie.ca'],
            username: ' tobias.hegemann@googlemail.com',
            credential: 'SE6q6nA5kSiKk4Z'
        }
    ],
    iceCandidatePoolSize: 10,
};

interface Offer {
    offer: RTCSessionDescriptionInit;
    fromUserId: string;
    toUserId: string;
}

interface Answer {
    answer: RTCSessionDescriptionInit;
    fromUserId: string;
    toUserId: string;
}

export interface UserModel {
    uid: string;
    name: string;
}

export interface RemoteConnection {
    connection: RTCPeerConnection;
    remoteStream: MediaStream;
    user: UserModel;
}

export const useChat = (props: { user: firebase.User }) => {
    const [remoteConnections, setRemoteConnections] = useState<RemoteConnection[]>([]);

    const [localStream, setLocalStream] = useState<MediaStream>();
    const [roomRef, setRoomRef] = useState<firebase.firestore.DocumentReference>();
    const [userRef, setUserRef] = useState<firebase.firestore.DocumentReference>();

    useEffect(() => {
        //import("webtrc-adapter");
        return () => {
            disconnect();
        }
    }, []);

    const disconnect = useCallback(() => {
        remoteConnections.forEach(
            (rc) => rc.connection.close()
        );
        setRemoteConnections([]);
        setLocalStream(undefined);
        if (userRef)
            userRef.delete().then(
                () => {
                    setUserRef(undefined);
                    setRoomRef(undefined);
                }
            );
    }, [remoteConnections, userRef, roomRef]);

    const createLocalStream = (): Promise<void> => {
        return navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then((localStream: MediaStream) => {
                setLocalStream(localStream);
                return;
            });
    };

    const onTrack = (connection: RemoteConnection, event: RTCTrackEvent) => {
        console.log('Got remote track for ' + connection.user.name + ' :', event.streams[0]);
        event.streams.forEach(
            stream => stream.getTracks().forEach(
                track => {
                    console.log('Add a track to the remoteStream:', track);
                    connection.remoteStream.addTrack(track);
                }
            )
        );
    };

    const addUser = useCallback((): Promise<firebase.firestore.DocumentReference> => {
        const userRef = roomRef.collection("users").doc(props.user.uid);
        return userRef.delete().then(
            () => {
                return userRef.set({
                    name: props.user.displayName,
                    uid: props.user.uid
                } as UserModel).then(
                    () => {
                        setUserRef(userRef);
                        return userRef;
                    }
                );
            }
        )
    }, [roomRef, props.user]);

    const onIceCandidate = (connection: RemoteConnection, event: RTCPeerConnectionIceEvent) => {
        if (!event.candidate) {
            console.log('Got final candidate!');
            //localStream.getTracks().forEach((t) => connection.connection.addTrack(t));
            return;
        }
        connection.connection.addIceCandidate(event.candidate);
    };

    const createRemoteConnection = useCallback((user: UserModel): RemoteConnection => {
        const connection: RTCPeerConnection = new RTCPeerConnection(configuration);
        const remoteConnection: RemoteConnection = {
            connection: connection,
            remoteStream: new MediaStream(),
            user: user
        };
        localStream.getTracks().forEach(track => {
            connection.addTrack(track, localStream);
        });
        connection.addEventListener('icecandidate', (event: RTCPeerConnectionIceEvent) => onIceCandidate(remoteConnection, event));
        connection.addEventListener('track', (event: RTCTrackEvent) => onTrack(remoteConnection, event));
        return remoteConnection;
    }, [localStream]);

    const handleUserRemoved = useCallback((user: UserModel) => {
        setRemoteConnections((prevState) => prevState.filter((rc) => rc.user.uid !== user.uid));
    }, [roomRef]);

    const handleOffer = useCallback((offer: Offer) => {
        if (offer.toUserId !== props.user.uid) {
            // I'm not the recipient
            return;
        }
        const remoteConnection: RemoteConnection = remoteConnections.find((rc) => rc.user.uid === offer.fromUserId);
        if (remoteConnection) {
            remoteConnection.connection.setRemoteDescription(new RTCSessionDescription(offer.offer)).then(
                () => {
                    console.log("Got offer from " + remoteConnection.user.name + " and will answer now");
                    createAnswer(remoteConnection);
                }
            );
        } else {
            getUser(offer.fromUserId).then(
                (user: UserModel | null) => {
                    if (user)
                        return createRemoteConnection(user);
                    console.error("Could not find user " + offer.fromUserId);
                }
            );
        }
    }, [props.user]);
    const handleAnswer = useCallback((answer: Answer) => {
        if (answer.toUserId !== props.user.uid) {
            // Not the recipient
            return;
        }
        const remoteConnection: RemoteConnection = remoteConnections.find((rc) => rc.user.uid === answer.fromUserId);
        if (remoteConnection) {
            remoteConnection.connection.setRemoteDescription(new RTCSessionDescription(answer.answer)).then(
                () => {
                    console.log("Got answer from " + remoteConnection.user.name)
                }
            );
        } else {
            console.error("Unknown remote connection for answer:", answer);
        }
    }, [props.user]);

    const createOffer = useCallback((target: RemoteConnection) => {
        console.log("Make offer to " + target.user.name);
        target.connection.createOffer().then((offer: RTCSessionDescriptionInit) => {
            target.connection.setLocalDescription(new RTCSessionDescription(offer)).then(() => {
                roomRef.collection("users").doc(target.user.uid).collection("offers").add({
                    offer: {
                        type: offer.type,
                        sdp: offer.sdp
                    },
                    fromUserId: props.user.uid,
                    toUserId: target.user.uid
                });
            })
        });
    }, []);
    const createAnswer = useCallback((target: RemoteConnection) => {
        console.log("Answer " + target.user.name);
        target.connection.createAnswer().then((answer: RTCSessionDescriptionInit) => {
            target.connection.setLocalDescription(new RTCSessionDescription(answer)).then(() => {
                roomRef.collection("users").doc(target.user.uid).collection("answers").add({
                    answer: {
                        type: answer.type,
                        sdp: answer.sdp
                    },
                    fromUserId: props.user.uid,
                    toUserId: target.user.uid
                } as Answer);
            })
        });
    }, []);

    const handleUserAdded = useCallback((user: UserModel) => {
        if (user.uid === props.user.uid)
            return;
        // Create new connection to this user
        const remoteConnection: RemoteConnection = createRemoteConnection(user);
        setRemoteConnections((prevState) => [remoteConnection, ...prevState]);
        // And send offer to user
        createOffer(remoteConnection);
    }, [roomRef]);

    const getUser = useCallback((userId: string): Promise<UserModel | null> => {
        return roomRef.collection("users").doc(userId).get().then((document: firebase.firestore.DocumentSnapshot) => {
            if (document.exists)
                return document.data() as UserModel;
            return null;
        });
    }, [roomRef]);

    useEffect(() => {
        if (roomRef) {
            if (userRef) {

                // Listen for users removal
                roomRef.collection("users").onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
                    snapshot.docChanges().forEach((change: firebase.firestore.DocumentChange) => {
                        const user: UserModel = change.doc.data() as UserModel;
                        if (change.type === "added") {
                            //handleUserAdded(user);
                        } else if (change.type === "removed") {
                            handleUserRemoved(user);
                        }
                    })
                });
                // Listen to offers
                userRef.collection("offers").onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
                    snapshot.docChanges().forEach((change: firebase.firestore.DocumentChange) => {
                        if (change.type === "added") {
                            const offer: Offer = change.doc.data() as Offer;
                            handleOffer(offer);
                        }
                    })
                });
                // Listen to answers
                userRef.collection("answers").onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
                    snapshot.docChanges().forEach((change: firebase.firestore.DocumentChange) => {
                        if (change.type === "added") {
                            const answer: Answer = change.doc.data() as Answer;
                            handleAnswer(answer);
                        }
                    })
                });
                // Now send offer to all existing users
                roomRef.collection("users").get().then(
                    (snapshot: firebase.firestore.QuerySnapshot) => {
                        snapshot.docs.forEach(
                            (document: firebase.firestore.QueryDocumentSnapshot) => {
                                const user: UserModel = document.data() as UserModel;
                                handleUserAdded(user);
                            }
                        )
                    }
                );
            } else {
                addUser();
            }
        }
    }, [roomRef, userRef]);

    const joinRoom = useCallback((id: string) => {
        if (!props.user) {
            console.error("No user");
            return;
        }

        const roomRef: firebase.firestore.DocumentReference = firebase.firestore().collection("rooms").doc(id);
        return roomRef.get()
            .then(
                async (snapshot: firebase.firestore.DocumentSnapshot) => {
                    if (!snapshot.exists) {
                        // Create room
                        await roomRef.set({});
                    }
                    await createLocalStream();
                    setRoomRef(roomRef);
                }
            ).catch(
                (error) => {
                    disconnect();
                    console.error(error);
                }
            );
    }, [props.user]);

    const deleteUserRef = async (userRef: firebase.firestore.DocumentReference) => {
        await userRef.collection("answers").get().then(
            (s: firebase.firestore.QuerySnapshot) => {
                s.forEach((d) => userRef.collection("answers").doc(d.id).delete());
            }
        );
        await userRef.collection("offers").get().then(
            (s: firebase.firestore.QuerySnapshot) => {
                s.forEach((d) => userRef.collection("offers").doc(d.id).delete());
            }
        );
        await userRef.delete();
    };
    const deleteRoomRef = useCallback(async (roomRef: firebase.firestore.DocumentReference) => {
        await roomRef.collection("users").get().then(
            (s: firebase.firestore.QuerySnapshot) => {
                s.forEach((d) => deleteUserRef(roomRef.collection("users").doc(d.id)));
            }
        );
        await roomRef.delete();
    }, [props.user]);

    const createRoom = useCallback((id: string) => {
        if (!props.user) {
            console.error("No user");
            return;
        }

        const roomRef: firebase.firestore.DocumentReference = firebase.firestore().collection("rooms").doc(id);
        // First delete room
        return deleteRoomRef(roomRef).then(
            () => {
                createLocalStream().then(
                    () => setRoomRef(roomRef)
                );
            }
        );
    }, [props.user]);

    return {
        localStream,
        remoteConnections,
        joinRoom,
        createRoom
    }
};
