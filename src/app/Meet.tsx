"use client"
import Ably from "ably";
import { useEasyMeet } from "@mobinx/easymeet/react"
import { Fragment, useEffect, useRef, useState } from "react";
import { FileState } from "@mobinx/easymeet";
import { Camera, CameraOff, Mic, MicOff, ScreenShare, ScreenShareOff } from "lucide-react";
import { ProfileCard } from "@/components/ProfileCard";

const ably = new Ably.Realtime({ key: 'YSXfdw.ksCpsA:Bf6jKYu4LPPpMfiFkSMJrZ4q4ArLDkuBf7bJCPxKQUo', clientId: Math.random().toString(36).substring(7) })
ably.connection.once('connected').then(() => {
    console.log('Connected to Ably!');
})
const channel = ably.channels.get('quickstart');
channel.presence.enter("mobin");



async function sendmsg(msg: any, to: any) {
    await channel.publish('greeting', { data: msg, clientId: ably.auth.clientId, to: to });
    console.log('message sent: ', msg);
}

const VIdeo = ({ stream }: { stream: MediaStream }) => {
    let viref = useRef<HTMLVideoElement | null>(null)
    let [isPlay, setIsPlay] = useState(false)
    useEffect(() => {
        if (viref.current) {
            viref.current.srcObject = stream
            viref.current?.play()
            viref.current.onplaying = () => {
                console.log("playing")
                setIsPlay(true)
            }
            viref.current.onpause = () => {
                console.log("pause")
                setIsPlay(false)
                viref.current?.play()
            }

            if (viref.current.paused) {
                viref.current.play()
            }
        }
    })

    return (
        <video ref={viref} playsInline autoPlay muted style={{ width: "100%" }} controls={true}></video>
    )
}

const AUdeo = ({ stream }: { stream: MediaStream }) => {
    let viref = useRef<HTMLAudioElement | null>(null)
    let [isPlay, setIsPlay] = useState(false)
    useEffect(() => {
        if (viref.current) {
            viref.current.srcObject = stream
            viref.current?.play()
            viref.current.onplaying = () => {
                console.log("playing")
                setIsPlay(true)
            }
            viref.current.onpause = () => {
                console.log("pause")
                setIsPlay(false)
                viref.current?.play()
            }

            if (viref.current.paused) {
                viref.current.play()
            }
        }
    })

    return (
        <audio ref={viref} playsInline autoPlay style={{ width: "100%" }} controls={true}></audio>
    )
}

export default function Meet({ iceServers }: { iceServers: any }) {
    const isInit = useRef<boolean | null>(null);
    const { isSystemReady, joinExistingPeer, joinNewPeer, leavePeer, sendFile, fileSharingCompleted, fileSharingState, onSocketMessage, sendDataChannelMsg, newDataChannelMsg, toggleAudio, toggleCamera, toggleScreenShare, isAudioOn, isVideoOn, isScreenShareOn, audioStream, videoStream, screenShareStream, peers } = useEasyMeet(ably.auth.clientId, iceServers, sendmsg);
    const [myMsg, setMyMsg] = useState<string>("")
    const [allMsg, setAllMsg] = useState<{ from: string, msg: string }[]>([])
    const [fileProgress, setFileProgress] = useState<{ id: string, progress: number, url?: string | null, fileState?: FileState }[]>([])
    useEffect(() => {
        console.log(peers)
    }, [peers])
    useEffect(() => {
        if (fileSharingState) {
            setFileProgress(prev => {
                let tempArray = [];
                prev.map(item => {
                    if (item.id != fileSharingState.fileId) {
                        tempArray.push(item)
                    }
                })
                tempArray.push({ id: fileSharingState.fileId, progress: fileSharingState.progress, fileState: fileSharingState })
                return tempArray
            })
        }

    }, [fileSharingState])
    useEffect(() => {
        console.log(fileSharingCompleted)
        if (fileSharingCompleted) {
            setFileProgress(prev => {
                let tempArray = [];
                prev.map(item => {
                    if (item.id != fileSharingCompleted.file.fileId) {
                        tempArray.push(item)
                    }
                })
                tempArray.push({ id: fileSharingCompleted.file.fileId, progress: 100, url: fileSharingCompleted.objectUrl, fileState: fileSharingCompleted.file })
                return tempArray

            })
        }
    }, [fileSharingCompleted])
    useEffect(() => {
        if (newDataChannelMsg) {
            setAllMsg(prev => prev.concat([newDataChannelMsg]))
        }
    }, [newDataChannelMsg,])
    useEffect(() => {
        async function init() {
            if (!isInit.current) {
                if (isSystemReady) {
                    console.log("isSystemReady");
                    await channel.subscribe('greeting', async (message) => {
                        if (message.clientId === ably.auth.clientId) {
                            return;
                        }
                        if (message.data.to === ably.auth.clientId) {
                            console.log('message received from: ' + message.clientId);
                            await onSocketMessage(message.data.data, message.clientId!, null);
                        }
                    })
                    channel.presence.subscribe('enter', async function (member) {
                        if (member.clientId === ably.auth.clientId) {
                            return;
                        }
                        console.log("informAboutNewConnection", member);
                        joinNewPeer(member.clientId);
                    });

                    channel.presence.subscribe('leave', async function (member) {
                        if (member.clientId === ably.auth.clientId) {
                            return;
                        }
                        console.log("leave", member);
                        leavePeer(member.clientId);
                    });
                    channel.presence.get().then((other_users: any) => {
                        console.log("userconnected", other_users);
                        if (other_users) {
                            for (var i = 0; i < other_users.length; i++) {
                                if (other_users[i].clientId !== ably.auth.clientId) joinExistingPeer(other_users[i].clientId, false);
                            }
                        }
                    });

                    isInit.current = true;
                }
            }
        }

        init();
    }, [isSystemReady, joinExistingPeer, joinNewPeer, leavePeer, onSocketMessage]);


    return <div className="relative w-full h-screen flex items-center justify-center">
        <div className="w-full h-full flex justify-center items-center px-4 py-6">
            <div className="w-full h-full grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 justify-center items-center">
                <ProfileCard name={ably.auth.clientId+" (YOU)"} isAudioOn={isAudioOn} isVideoOn={isVideoOn}  audioStream={audioStream} videoStream={videoStream}  />
            {isScreenShareOn && <ProfileCard name={ably.auth.clientId+" (YOU)"} isAudioOn={false} isVideoOn={isScreenShareOn}  audioStream={audioStream} videoStream={screenShareStream}  />}

                {peers.map((peer,key) => <Fragment key={key}>
                    <ProfileCard  name={peer.socketId} isAudioOn={peer.isAudioOn} isVideoOn={peer.isVideoOn}  audioStream={peer.audioStream} videoStream={peer.videoStream}  />
                    {peer.isScreenShareOn && <ProfileCard name={peer.socketId+ " (SCREENSHARE)" +(peer.isScreenShareOn)} isAudioOn={false} isVideoOn={peer.isScreenShareOn} audioStream={peer.audioStream} videoStream={peer.screenShareStream}  />}
                </Fragment>)}
                    

            </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2  z-10 rounded-3xl bg-gray-900">
            <button className="btn bg-transparent text-white rounded-3xl rounded-tr-none rounded-br-none" onClick={async () => await toggleCamera()}>{isVideoOn ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}</button>
            <button className="btn bg-transparent text-white rounded-none" onClick={async () => await toggleAudio()}>{isAudioOn ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}</button>
            <button className="btn bg-transparent text-white rounded-3xl rounded-tl-none rounded-bl-none" onClick={async () => await toggleScreenShare()}>{isScreenShareOn ? <ScreenShareOff className="w-6 h-6" /> : <ScreenShare className="w-6 h-6" />}</button>
        </div>

    </div>;
}

