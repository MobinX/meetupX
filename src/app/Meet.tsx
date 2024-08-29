"use client"
import Ably from "ably";
import { useEasyMeet } from "@mobinx/easymeet/react"
import { Fragment, useEffect, useRef, useState } from "react";
import { FileState } from "@mobinx/easymeet";
import { Camera, CameraOff, DownloadCloudIcon, MessageSquareShare, Mic, MicOff, PlusCircle, ScreenShare, ScreenShareOff, Send, X } from "lucide-react";
import { Avatar, ProfileCard } from "@/components/ProfileCard";

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

interface MsgType {
    from: string
    msg?: string|null
    file?: FileState|null
    type: "text" | "image" | "file" | "video" | "audio" | "progress",
    url?: string|null
    idx?: number
    myId?: string
}



interface Props {
  text: string;
}

const LinkTagger = ({ text }: { text: string }) => {
  const links = text.match(/((https?:\/\/|www\.)[^\s]+)/g);

  return (
    <div>
      {text.split(' ').map((word, index) => {
        if (links?.some((link) => link === word)) {
          return (
            <Fragment key={index}>
              <a href={word} className="text-blue-500">{word}</a>
              <span> </span>
            </Fragment>
          );
        } else {
          return (
            <Fragment key={index}>
              <span>{word}</span>
              <span> </span>
            </Fragment>
          );
        }
      })}
    </div>
  );
};




const Msg = ({ from, msg, file, type, url = "",myId }: MsgType) => {
    return (
        <div className={`flex gap-2 w-full ${myId === from ? "flex-row-reverse" : "flex-row"}`} >
            <Avatar name={from} />
            {type === "text" && <p className="text-sm bg-gray-700 rounded-lg p-2 text-white w-full"><LinkTagger text={msg || ""} /></p>}
            {type === "image" &&  url &&<div className="flex flex-col justify-between items-center gap-2 p-3 rounded-lg shadow-2xl bg-gray-400 w-full">
                <img src={url} className="w-40 h-40" />
                <div className="flex justify-between items-center w-full">
                    <p className="text-white">{file?.fileName}</p>
                    <a href={url} download={file?.fileName} className="text-white"><DownloadCloudIcon className="w-4 h-4" /></a>
                </div>
            </div>}
            {type === "video" && url && <div className="flex flex-col justify-between items-center gap-2 p-3 rounded-lg shadow-2xl bg-gray-400 w-full">
                <video src={url} className="w-40 h-40" controls></video>
                <div className="flex justify-between items-center w-full">
                    <p className="text-white">{file?.fileName}</p>
                    <a href={url} download={file?.fileName} className="text-white"><DownloadCloudIcon className="w-4 h-4" /></a>
                </div>
            </div>}
            {type === "audio" && url && <audio src={url} className="w-full" controls></audio>}
            {type === "file" && url && <div className="flex  justify-between items-center gap-2 p-3 rounded-lg shadow-2xl bg-gray-400 w-full">
                <p className="text-white">{file?.fileName}</p>
                <a href={url} download={file?.fileName} className="text-white"><DownloadCloudIcon className="w-4 h-4" /></a>
            </div>}
            {type === "progress" && <div className="flex flex-col justify-between items-center gap-2 p-3 rounded-lg shadow-2xl bg-gray-400 w-full">
                <div className="flex justify-center items-center w-full">
                    <p className="text-white">{file?.fileName}</p>
                    <p className="text-white">{file?.completedSize}bytes</p>
                </div>
                <div className="flex justify-end items-center w-full">
                    <p className="text-white">{file?.progress}%</p>
                </div>
                <progress value={file?.progress} max="100" className="w-full"></progress>
            </div>}
        </div>
    )
}

export default function Meet({ iceServers }: { iceServers: any }) {
    const isInit = useRef<boolean | null>(null);
    const { isSystemReady, joinExistingPeer, joinNewPeer, leavePeer, sendFile, fileSharingCompleted, fileSharingState, onSocketMessage, sendDataChannelMsg, newDataChannelMsg, toggleAudio, toggleCamera, toggleScreenShare, isAudioOn, isVideoOn, isScreenShareOn, audioStream, videoStream, screenShareStream, peers } = useEasyMeet(ably.auth.clientId, iceServers, sendmsg);
    const [myMsg, setMyMsg] = useState<string>("")
    const [allMsg, setAllMsg] = useState<MsgType[]>([])
    const [fileProgress, setFileProgress] = useState<{ id: string, progress: number, url?: string | null, fileState?: FileState }[]>([])
    const [pinId, setPinId] = useState<{ Id: string, type: string } | null>(null)
    const [ischatBoxOpen, setIschatBoxOpen] = useState<boolean>(false)
    const sendMs = (msg:any) => {
        sendDataChannelMsg(msg,"all")
        setAllMsg(prev => prev.concat([{ from: ably.auth.clientId, msg , type: "text" }]))

    }
    useEffect(() => {
        console.log("j", pinId?.Id)
    }, [pinId])
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
            setAllMsg(prev => prev.concat([{
                from: newDataChannelMsg.from,
                msg: JSON.parse(newDataChannelMsg.msg),
                type: "text"
            }]))
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


    return <div className="relative w-full h-screen flex  items-center justify-center">

        <div className="w-full h-full flex flex-col lg:flex-row justify-center items-center px-4 py-6 gap-4">
            {pinId && <div className="lg:w-2/3 w-full h-full flex justify-center items-center flex-1 px-2" >
                {pinId.Id == ably.auth.clientId && pinId.type === "sc" &&
                    <ProfileCard className="h-full" name={ably.auth.clientId + " (YOU)"} isAudioOn={false} isVideoOn={isScreenShareOn} audioStream={audioStream} videoStream={screenShareStream} onClick={() => setPinId(null)} />
                }
                {pinId.Id == ably.auth.clientId && pinId.type === "normal" &&
                    <ProfileCard className="h-full" name={ably.auth.clientId + " (YOU)"} self={true} isAudioOn={false} isVideoOn={isVideoOn} audioStream={audioStream} videoStream={videoStream} onClick={() => setPinId(null)} />
                }
                {peers.find(peer => peer.socketId == pinId.Id) && pinId.type === "sc" &&
                    <ProfileCard className="h-full" name={peers.find(peer => peer.socketId == pinId.Id)?.socketId + " (SCREENSHARE)" + (peers.find(peer => peer.socketId == pinId.Id)?.isScreenShareOn)} isAudioOn={false} isVideoOn={peers.find(peer => peer.socketId == pinId.Id)!.isScreenShareOn} audioStream={peers.find(peer => peer.socketId == pinId.Id)!.audioStream} videoStream={peers.find(peer => peer.socketId == pinId.Id)!.screenShareStream} onClick={() => setPinId(null)} />
                }
                {peers.find(peer => peer.socketId == pinId.Id) && pinId.type === "normal" &&
                    peers.find(peer => peer.socketId == pinId.Id) && <ProfileCard className="h-full" name={peers.find(peer => peer.socketId == pinId.Id)!.socketId} isAudioOn={peers.find(peer => peer.socketId == pinId.Id)!.isAudioOn} isVideoOn={peers.find(peer => peer.socketId == pinId.Id)!.isVideoOn} audioStream={peers.find(peer => peer.socketId == pinId.Id)!.audioStream} videoStream={peers.find(peer => peer.socketId == pinId.Id)!.videoStream} onClick={() => setPinId(null)} />

                }
            </div>}
            <div className={`   ${pinId == null ? "h-full w-full grid overflow-auto lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 justify-center items-center" : "lg:w-1/3 w-full  flex lg:flex-col overflow-y-auto gap-4 items-center justify-center lg:justify-start lg:h-full h-auto"}  `}>
                {!(pinId?.Id === ably.auth.clientId && pinId?.type === "normal") && <ProfileCard name={ably.auth.clientId + " (YOU)"} isAudioOn={false} isVideoOn={isVideoOn} self={true} audioStream={audioStream} videoStream={videoStream} onClick={() => setPinId({ Id: ably.auth.clientId, type: "normal" })} className={`${pinId == null ? "" : "lg:min-h-48 w-full min-h-[8rem] min-w-[14rem]   lg:min-w-72"}`} />
                }
                {!(pinId?.Id === ably.auth.clientId && pinId?.type === "sc") && isScreenShareOn && <ProfileCard name={ably.auth.clientId + " (YOU)"} isAudioOn={false} isVideoOn={isScreenShareOn} audioStream={audioStream} videoStream={screenShareStream} onClick={() => setPinId({ Id: ably.auth.clientId, type: "sc" })} className={`${pinId == null ? "" : "lg:min-h-48 w-full min-h-[8rem] min-w-[14rem]   lg:min-w-72"}`} />
                }
                {peers.map((peer, key) =>
                    <Fragment key={key}>
                        {!(pinId?.Id === peer.socketId && pinId?.type === "normal") && <ProfileCard name={peer.socketId} isAudioOn={peer.isAudioOn} isVideoOn={peer.isVideoOn} audioStream={peer.audioStream} videoStream={peer.videoStream} onClick={() => setPinId({ Id: peer.socketId, type: "normal" })} className={`${pinId == null ? "" : "lg:min-h-48 w-full min-h-[8rem] min-w-[14rem]   lg:min-w-72"}`} />}
                        {!(pinId?.Id === peer.socketId && pinId?.type === "sc") && peer.isScreenShareOn && <ProfileCard name={peer.socketId + " (SCREENSHARE)" + (peer.isScreenShareOn)} isAudioOn={false} isVideoOn={peer.isScreenShareOn} audioStream={peer.audioStream} videoStream={peer.screenShareStream} onClick={() => setPinId({ Id: peer.socketId, type: "sc" })} className={`${pinId == null ? "" : "lg:min-h-48 w-full min-h-[8rem] min-w-[14rem]   lg:min-w-72"}`} />}
                    </Fragment>
                )}
            </div>
        </div>
        <div className="absolute lg:bottom-8 bottom-[0.6rem] z-[99] left-1/2 transform -translate-x-1/2   rounded-3xl bg-gray-900">
            <button className="btn bg-transparent text-white rounded-3xl rounded-tr-none rounded-br-none" onClick={async () => await toggleCamera()}>{isVideoOn ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}</button>
            <button className="btn bg-transparent text-white rounded-none" onClick={async () => await toggleAudio()}>{isAudioOn ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}</button>
            <button className="btn bg-transparent text-white rounded-3xl rounded-tl-none rounded-bl-none" onClick={async () => await toggleScreenShare()}>{isScreenShareOn ? <ScreenShareOff className="w-6 h-6" /> : <ScreenShare className="w-6 h-6" />}</button>
        </div>
        <div className="absolute lg:bottom-8 bottom-[0.6rem] z-[99] right-3   rounded-3xl bg-gray-900">
            <button className="btn bg-transparent text-white rounded-3xl " onClick={async () => setIschatBoxOpen(true)}> <MessageSquareShare className="w-6 h-6" /></button>
        </div>


        {ischatBoxOpen && <div className="absolute flex flex-col justify-center items-center  lg:right-5 top-6 z-[100] min-w-[350px] w-[95%] lg:w-[350px] h-[90%]  bg-white rounded-3xl text-black">
            <div className="flex w-full justify-between items-center p-3">
                <p className="text-lg font-bold">Messages</p>
                <button className="btn btn-circle btn-ghost btn-sm bg-transparent text-red-500" onClick={() => setIschatBoxOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="flex flex-col w-full h-full justify-start items-center flex-1 overflow-y-auto gap-2 px-3">
                {allMsg.map((msg,key)=> <Msg key={key} type={msg.type} msg={msg ? msg.msg : null} from={msg.from} url={msg.url? msg.url : null} file={msg.file? msg.file : null} myId={ably.auth.clientId}/>)}
            </div>

            <div className="flex justify-between items-center p-3 w-full">
                <input type="text" className="input input-bordered input-sm bg-gray-600 text-white placeholder:text-white w-full max-w-xs" value={myMsg} onChange={(e) => setMyMsg(e.target.value)} />
                <div className="flex gap-3">
                <button className="btn btn-circle btn-ghost btn-sm bg-transparent " onClick={() => setIschatBoxOpen(false)}><PlusCircle className="w-6 h-6" /></button>
                <button className="btn btn-circle btn-ghost btn-sm bg-transparent " onClick={() => sendMs(myMsg)}><Send className="w-6 h-6" /></button>
                </div>
            </div>

        </div>
        }

    </div>;
}

