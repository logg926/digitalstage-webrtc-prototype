import {Button} from "baseui/button";
import Video from "../components/Video";
import {useChat} from "../lib/useChat";
import {useCallback, useEffect, useState} from "react";
import firebase from "firebase/app";
import "firebase/auth";
import initFirebase from "../lib/initFirebase";
import Link from "next/link";
import LoginForm from "../components/LoginForm";

initFirebase();

export default () => {
    const [user, setUser] = useState<firebase.User>();
    const {joinRoom, createRoom, localStream, remoteConnections} = useChat({user});

    useEffect(() => {
        firebase.auth().onAuthStateChanged((user: firebase.User | null) => {
            setUser(user);
        });
    }, []);

    const loginWithGoogle = useCallback(() => {
        if (!user)
            firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
                .then(
                    (result: firebase.auth.UserCredential) => {
                        setUser(result.user);
                    }
                );
    }, [user]);
    const logout = useCallback(() => {
        if (user)
            firebase.auth().signOut();
    }, [user]);

    return (
        <>
            {user ? (
                <>
                    <Button onClick={() => createRoom("test")}>
                        CREATE ROOM
                    </Button>
                    <Button onClick={() => joinRoom("test")}>
                        JOIN ROOM
                    </Button>
                    <Button onClick={logout}>Logout</Button>
                    <div>
                        <Video id="local" stream={localStream} muted={true}/>
                        <div>
                            {remoteConnections.map((rc) => (
                                <Video key={rc.user.uid} id={rc.user.uid} stream={rc.remoteStream}/>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <LoginForm/>
                    <Button onClick={loginWithGoogle}>Login using Google</Button>
                    <Link href="/register">
                        <Button>Sign up</Button>
                    </Link>
                </>
            )}
        </>
    )
}
