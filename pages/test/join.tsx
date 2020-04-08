import React from "react";
import {Button} from "baseui/button";
import socketIOClient from "socket.io-client";
import Video from "../../components/media/Video";
import {styled} from "baseui";
import {withDarkMode} from "../../lib/useDarkModeSwitch";
import PlaybackPlayer from "../../components/media/playback/PlaybackPlayer";
import {withTimesync} from "../../lib/useTimesync";
import VideoWithConnection from "../../components/media/VideoWithConnection";
import {SERVER_PORT, SERVER_URL} from "../../env";
import {fixWebRTC} from "../../lib/fixWebRTC";
import {
    AudioContext,
    IAudioContext,
    IGainNode,
    IMediaStreamAudioDestinationNode,
    IMediaStreamTrackAudioSourceNode
} from "standardized-audio-context";
import SettingsModal, {Settings} from "../../components/SettingsModal";
import webAudioTouchUnlock from "../../lib/webAudioTouchUnlock";

const configuration: RTCConfiguration = {
    iceServers: [
        {
            urls: ["stun:u3.xirsys.com"]
        }, {
            username: "A9V03PuTW8N9A3K8aEFra1taQjecR5LHlhW9DrjvZj1SvoGtMyhkj3XJLrYzAQpdAAAAAF6IzZ10b2JpYXM=",
            credential: "95ddd1a4-769f-11ea-a962-bea250b72c66",
            urls: [
                "turn:u3.xirsys.com:80?transport=udp",
                "turn:u3.xirsys.com:3478?transport=udp",
                "turn:u3.xirsys.com:80?transport=tcp",
                "turn:u3.xirsys.com:3478?transport=tcp",
                "turns:u3.xirsys.com:443?transport=tcp",
                "turns:u3.xirsys.com:5349?transport=tcp"
            ]
        }/*
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302'
            ]
        },/*
        {
            urls: 'turn:v22019048220387295.hotsrv.de:3478',
            username: ' digitalstage',
            credential: 'digitalstage'
        },
        {
            urls: 'turn:numb.viagenie.ca',
            username: ' tobias.hegemann@googlemail.com',
            credential: 'SE6q6nA5kSiKk4Z'
        }/*,
        {
            urls: 'turn:numb.viagenie.ca',
            username: ' tobias.hegemann@googlemail.com',
            credential: 'SE6q6nA5kSiKk4Z'
        }*/
    ],
    iceCandidatePoolSize: 10,
};

export interface Connection {
    connection: RTCPeerConnection,
    remoteStream: MediaStream,
    gainNode: IGainNode<IAudioContext>,
    established: boolean,
    remoteId: string
}

interface State {
    socket?: SocketIOClient.Socket
    remoteConnections: Connection[],
    localStream?: MediaStream,
    audioContext?: IAudioContext,
    target?: IMediaStreamAudioDestinationNode<IAudioContext>,
    debug: boolean,
    settings: Settings,
    settingsOpen: boolean
}

const NavBar = styled("div", {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    display: 'flex',
    flexDirection: 'row',
    height: '48px',
    alignItems: 'center',
    zIndex: 999,
    backgroundColor: 'grey'
});
const Container = styled("div", {
    paddingTop: '48px',
    backgroundColor: 'black',
    width: '100%'
});
const Wrapper = styled("div", {
    width: '100%',
    display: 'grid',
    gridAutoFlow: 'true',
    gridGap: '0',
    gridTemplateColumns: 'repeat(2, 1fr)',
    backgroundColor: 'black'
});
const RemoteVideo = styled(VideoWithConnection, {
    backgroundColor: 'black',
    width: '100%'
});

const CornerVideo = styled(Video, {
    position: 'fixed',
    bottom: '1vmin',
    right: '1vmin',
    maxWidth: '300px',
    maxHeight: '200px',
    height: '30vmin',
    width: '30vmin',
    objectPosition: 'bottom',
    zIndex: 999
});
const Background = styled('div', (props: {
    $darkMode: boolean
}) => ({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: props.$darkMode ? 'black' : 'white'
}));

class Join extends React.Component<{
    darkMode: boolean,
    setDarkMode: (enabled: boolean) => void,
    offset: number
}, State> {

    constructor(props: any) {
        super(props);
        this.state = {
            remoteConnections: [],
            debug: false,
            settingsOpen: false,
            settings: {
                audio: true,
                useHighBitrate: false
            }
        }
    }

    componentDidMount(): void {
        fixWebRTC();
        const audioContext: IAudioContext = new AudioContext();
        webAudioTouchUnlock(audioContext)
            .then((unlocked: boolean) => {
                if (unlocked) {
                    // AudioContext was unlocked from an explicit user action, sound should start playing now
                } else {
                    // There was no need for unlocking, devices other than iOS
                }
            }, (reason: any) => {
                console.error(reason);
            });
        this.setState({
            audioContext: audioContext,
            target: audioContext.createMediaStreamDestination()
        });
    }

    handleOfferMade = (data) => {
        console.log('offer-made from:' + data.socket);
        const connection: Connection = this.createRemoteConnection(data.socket);
        this.setState(prevState => ({remoteConnections: [...prevState.remoteConnections, connection]}));
        connection.connection.setRemoteDescription(new RTCSessionDescription(data.offer)).then(
            () => connection.connection.createAnswer().then(
                (answer: RTCSessionDescriptionInit) => {
                    if (this.state.settings.useHighBitrate)
                        answer.sdp = answer.sdp.replace('useinbandfec=1', 'useinbandfec=1; maxaveragebitrate=510000');
                    connection.connection.setLocalDescription(new RTCSessionDescription(answer)).then(
                        () => {
                            console.log("makeAnswer(" + data.socket + ")");
                            this.state.socket.emit('make-answer', {
                                answer: answer,
                                to: data.socket
                            })
                        }
                    )
                }
            )
        );
    };

    handleAnswerMade = (data) => {
        const remoteConnection: Connection | undefined = this.state.remoteConnections.find((rc: Connection) => rc.remoteId === data.socket);
        if (remoteConnection) {
            remoteConnection.connection.setRemoteDescription(new RTCSessionDescription(data.answer)).then(() => {
                console.log("Got answer");
            })
        }
    };

    handleCandidateSent = async (data) => {
        const remoteConnection: Connection | undefined = this.state.remoteConnections.find((rc: Connection) => rc.remoteId === data.socket);
        if (remoteConnection) {
            await remoteConnection.connection.addIceCandidate(data.candidate);
        }
    };


    createRemoteConnection = (remoteId: string): Connection => {
        const connection: Connection = {
            connection: new RTCPeerConnection(configuration),
            remoteStream: new MediaStream(),
            established: false,
            gainNode: this.state.audioContext.createGain(),
            remoteId: remoteId
        };
        connection.gainNode.connect(this.state.audioContext.destination);
        if (this.state.localStream) {
            this.state.localStream.getTracks().forEach(
                (track: MediaStreamTrack) => {
                    console.log("Adding local track (video/audio)");
                    connection.connection.addTrack(track, this.state.localStream)
                }
            );
        }
        // And add playback track
        if (this.state.target)
            this.state.target.stream.getTracks().forEach(
                (track: MediaStreamTrack) => {
                    console.log("Adding playback track");
                    connection.connection.addTrack(track, this.state.target.stream)
                }
            );
        connection.connection.onicecandidateerror = (error) => {
            console.log('failed to add ICE Candidate');
            console.log(error.errorText);
        };
        connection.connection.oniceconnectionstatechange = (event) => {
            console.log('ICE state change event: ', event);
        };
        connection.connection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
            console.log("ICE connected");
            if (ev.candidate && ev.candidate.candidate.length > 0)
                this.sendCandidate(remoteId, ev.candidate);
            else {
                console.log("Finished");
                connection.established = true;
                this.setState(this.state);
            }
        };
        connection.connection.ontrack = (ev: RTCTrackEvent) => {
            const tracks: MediaStreamTrack[] = connection.remoteStream ? connection.remoteStream.getTracks() : [];
            connection.remoteStream = ev.streams[0];
            tracks.forEach((track) => connection.remoteStream.addTrack(track));

            // Add remote audio tracks to gain controller
            if (connection.remoteStream)
                connection.remoteStream.getAudioTracks().forEach(
                    (audioTrack: MediaStreamTrack) => {
                        const audioNode: IMediaStreamTrackAudioSourceNode<IAudioContext> = this.state.audioContext.createMediaStreamTrackSource(audioTrack); //.createMediaStreamTrackSource(audioTrack);
                        audioNode.connect(connection.gainNode);
                    }
                );
        };
        return connection;
    };

    sendCandidate = (remoteId: string, candidate: RTCIceCandidate) => {
        this.state.socket.emit('send-candidate', {
            candidate: candidate,
            to: remoteId
        });
    };

    makeOffer = (remoteId: string) => {
        console.log("makeOffer(" + remoteId + ")");
        const connection: Connection = this.createRemoteConnection(remoteId);
        // Create new connection
        this.setState(prevState => ({remoteConnections: [...prevState.remoteConnections, connection]}));
        connection.connection.createOffer().then(
            (offer: RTCSessionDescriptionInit) => {
                if (this.state.settings.useHighBitrate)
                    offer.sdp = offer.sdp.replace('useinbandfec=1', 'useinbandfec=1; maxaveragebitrate=510000');
                connection.connection.setLocalDescription(new RTCSessionDescription(offer)).then(
                    () => this.state.socket.emit('make-offer', {
                        offer: offer,
                        to: remoteId
                    })
                )
            }
        )
    };

    disconnect = () => {
        this.state.remoteConnections.forEach((rc) => {
            rc.connection.close()
        });
        if (this.state.socket)
            this.state.socket.close();
        this.setState({
            socket: undefined,
            remoteConnections: []
        });
        this.props.setDarkMode(false);
    };

    join = () => {
        if (!this.state.socket) {
            this.props.setDarkMode(true);
            const socket = socketIOClient(SERVER_URL + ':' + SERVER_PORT);
            socket.on('remove-user', (remoteId: string) => {
                console.log("remove-user: " + remoteId);
                this.setState(prevState => ({
                    remoteConnections: prevState.remoteConnections.filter((c: Connection) => c.remoteId !== remoteId)
                }));
            });

            socket.on('answer-made', this.handleAnswerMade);

            socket.on('offer-made', this.handleOfferMade);

            socket.on('candidate-sent', this.handleCandidateSent);

            // Define listeners
            socket.on('add-users', (data) => {
                console.log("add-user");
                console.log(data);
                this.makeOffer(data.users[0]);
            });
            this.setState({
                socket: socket
            });
        }
    };

    activateCamera = (): Promise<boolean> => {
        return navigator.mediaDevices.getUserMedia({
            video: true,
            audio: this.state.settings.audio
        })
            .then((stream: MediaStream) => {
                this.setState({
                    localStream: stream
                });
                this.state.remoteConnections.forEach((rc) => {
                    stream.getTracks().forEach((track) => rc.connection.addTrack(track, stream))
                });
                return true;
            })
            .catch(
                (err) => {
                    console.error(err);
                    return false;
                }
            );
    };

    joinWithCamera = () => {
        this.activateCamera().then((value: boolean) => {
            if (!value) {
                alert("Using spectator mode")
            }
            this.join();
        });
    };

    render() {
        return (
            <>
                <Background $darkMode={this.props.darkMode}/>
                <NavBar>
                    {this.state.socket ? (
                        <Button onClick={this.disconnect}>
                            DISCONNECT
                        </Button>
                    ) : (
                        <Button onClick={() => {
                            this.joinWithCamera();
                        }}>
                            JOIN
                        </Button>
                    )}
                    <Button onClick={() => this.setState({settingsOpen: true})}>
                        SETTINGS
                    </Button>
                    <Button onClick={() => this.setState(prev => ({debug: !prev.debug}))}>
                        DEBUG
                    </Button>
                </NavBar>
                <CornerVideo stream={this.state.localStream} id="local" muted={true}/>
                <Container>
                    <PlaybackPlayer offset={this.props.offset} target={this.state.target}
                                    audioContext={this.state.audioContext}/>
                </Container>
                <Wrapper>
                    {this.state.remoteConnections.map((rc) => rc.established && (
                        <RemoteVideo debug={this.state.debug} connection={rc} key={rc.remoteId} stream={rc.remoteStream}
                                     gainNode={rc.gainNode}
                                     id={rc.remoteId}
                                     muted={true}/>
                    ))}
                </Wrapper>
                <SettingsModal
                    onChange={(settings: Settings) => {
                        this.setState({settings: settings}, () => {
                            this.disconnect();
                            this.joinWithCamera();
                        })
                    }}
                    open={this.state.settingsOpen}
                    onCloseRequested={() => this.setState({settingsOpen: false})}
                />
            </>
        )
    }
}

export default withDarkMode(withTimesync(Join));
