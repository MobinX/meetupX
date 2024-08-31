"use client"
import Ably from "ably";
import { useEasyMeet } from "@mobinx/easymeet/react"
import { Fragment, useEffect, useRef, useState } from "react";
import { FileState } from "@mobinx/easymeet";
import { Camera, CameraOff, DownloadCloudIcon, MessageSquareShare, Mic, MicOff, PlusCircle, ScreenShare, ScreenShareOff, Send, X } from "lucide-react";
import { Avatar, ProfileCard } from "@/components/ProfileCard";
import { usePathname } from "next/navigation";
import { curvedFont } from "@/components/fonts";
import Image from "next/image";

const ably = new Ably.Realtime({ key: 'YSXfdw.ksCpsA:Bf6jKYu4LPPpMfiFkSMJrZ4q4ArLDkuBf7bJCPxKQUo', clientId: Math.random().toString(36).substring(7) })
ably.connection.once('connected').then(() => {
    console.log('Connected to Ably!');
})
let channel: Ably.RealtimeChannel;


async function sendmsg(msg: any, to: any) {
    console.log("sendmsg", msg, to);
    try {
        await channel.publish('greeting', { data: msg, clientId: ably.auth.clientId, to: to });
        console.log('message sent: ', msg);
    }
    catch (err) {
        console.log(err)
        alert("something went wrong pls , try again or refresh")
    }
}


interface MsgType {
    from: string
    msg?: string | null
    file?: FileState | null
    type: "text" | "image" | "file" | "video" | "audio" | "progress",
    url?: string | null
    idx?: number
    myId?: string
    name?: string
}



interface Props {
    text: string;
}

const LinkTagger = ({ text }: { text: string }) => {
    const links = text.match(/((https?:\/\/|www\.)[^\s]+)/g);

    return (
        <>
            {text.split(' ').map((word, index) => {
                if (links?.some((link) => link === word)) {
                    return (
                        <Fragment key={index}>
                            <a href={word} className="text-blue-500" target="_blank">{word}</a>
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
        </>
    );
};




const Msg = ({ from, msg, file, type, url = "", myId, name = "" }: MsgType) => {
    console.log("msgtype", type)
    return (
        <div className={`flex gap-2 w-full ${myId === from ? "flex-row-reverse" : "flex-row"}`} >
            <Avatar name={name} />
            {type === "text" && <p className="text-sm bg-gray-700 rounded-lg p-2 text-white w-full"><LinkTagger text={msg || ""} /></p>}
            {type === "image" && url && <div className="flex flex-col justify-between items-center gap-2 p-3 rounded-lg shadow-2xl bg-gray-400 w-full">
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
                    <p className="text-white">{Math.round(file?.progress || 0)}%</p>
                </div>
                <progress value={file?.progress} max="100" className="w-full progress  progress-accent "></progress>
            </div>}
        </div>
    )
}

function generateRandomCode() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const code = Array(3).fill(" ").map(() => {
        return Array(3).fill(" ").map(() => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
    }).join('-');
    return code;
}



export default function Meet({ iceServers }: { iceServers: any }) {
    const isInit = useRef<boolean | null>(null);
    const pathname = usePathname()

    const meetingUrl = pathname == "/" ? null : pathname.split("/")[1]
    console.log(meetingUrl, pathname)
    const [myName, setMyName] = useState<string>("")
    const [frame, setFrame] = useState<number>(0)
    const [channelName, setChannelName] = useState<string | null>(meetingUrl)
    const [inpLink, setInpLink] = useState<string | null>(meetingUrl)
    const [taostMsg, setToastMsg] = useState<string | null>(null)
    const { isSystemReady, joinExistingPeer, joinNewPeer, leavePeer, sendFile, fileSharingCompleted, fileSharingState, onSocketMessage, sendDataChannelMsg, newDataChannelMsg, toggleAudio, toggleCamera, toggleScreenShare, isAudioOn, isVideoOn, isScreenShareOn, audioStream, videoStream, screenShareStream, peers } = useEasyMeet(ably.auth.clientId, iceServers, sendmsg);
    const [myMsg, setMyMsg] = useState<string>("")
    const [allMsg, setAllMsg] = useState<MsgType[]>([])
    const [fileProgress, setFileProgress] = useState<{ id: string, progress: number, url?: string | null, fileState?: FileState }[]>([])
    const [pinId, setPinId] = useState<{ Id: string, type: string } | null>(null)
    const [ischatBoxOpen, setIschatBoxOpen] = useState<boolean>(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [startMeeting, setStartMeeting] = useState<boolean>(false)
    const sendUIMsg = (msg: any) => {
        try {
            if (msg == "") return
            sendDataChannelMsg(msg, "all")
            setAllMsg(prev => prev.concat([{ from: ably.auth.clientId, msg, type: "text", idx: prev.length, name: myName }]))
            setMyMsg("")
        }
        catch (err) {
            console.log(err)
            alert("something went wrong pls , try again or refresh")
        }
    }

    const showToast = (msg: string) => {
        setToastMsg(msg)
        setTimeout(() => {
            setToastMsg(null)
        }, 3000)
    }
    const sendUIFile = (file: File) => {
        try {
            console.log(file)
            peers.forEach(peer => {
                sendFile(peer.socketId, file)
            })
            showToast("All streams are tamporary disable for faster transfer")
        }
        catch (err) {
            console.log(err)
        }


    }
    const createMeeting = () => {
        if (myName) {
            let meetingCode = generateRandomCode()
            setChannelName(meetingCode)
            setInpLink(meetingCode)
            window.history.replaceState(null, "", `/${meetingCode}`)

            setStartMeeting(true)
            setFrame(1)
        }
        else {
            alert("enter your name")
        }
    }

    const joinMeeting = () => {
        if (inpLink && myName) {

            setChannelName(inpLink)
            setInpLink("")
            window.history.replaceState(null, "", `/${inpLink}`)

            setStartMeeting(true)
            setFrame(1)
        }
        else {
            alert("enter your name and code accuretly")
        }
    }

    const getCompletedFile = (file: FileState) => {
        if (file?.completedSize == file?.totalSize) {
            let contentArrayblob = new Blob(
                file.receivedArrayBuffer
            );
            let objectURL = URL.createObjectURL(contentArrayblob);

            return objectURL;
        }
        return null
    }

    useEffect(() => {
        console.log("j", pinId?.Id)
    }, [pinId])
    useEffect(() => {
        console.log("p", peers)
    }, [peers])
    useEffect(() => {
        console.log(fileSharingState)
        if (fileSharingState) {
            console.log(fileSharingState)
            let name = peers.find(peer => peer.socketId == fileSharingState.peerId)?.info?.name
            setAllMsg(prev => {
                let temp: MsgType[] = []
                for (let item of prev) {
                    if (item?.file?.fileId !== fileSharingState.fileId) {
                        temp.push(item)
                    }
                }
                temp.push({ from: fileSharingState.peerId, file: fileSharingState, type: "progress", idx: prev.length, name: name ? name : fileSharingState.peerId })
                return temp
            }
            )
            console.log("allmsg*******************", allMsg)
        }
    }, [fileSharingState, peers])
    useEffect(() => {
        console.log(fileSharingCompleted)
        if (fileSharingCompleted) {
            let name = peers.find(peer => peer.socketId == fileSharingCompleted.file.peerId)?.info?.name
            setAllMsg(prev => {
                let fileMsgIndx = prev.findIndex(item => item?.file?.fileId == fileSharingCompleted.file.fileId)
                let fileExt = fileSharingCompleted.file.fileName.split(".").pop();
                let ftype: "text" | "image" | "file" | "video" | "audio" | "progress" = fileExt ? ([
                    "mp4", "webm", "ogg", "mov", "avi", "flv", "wmv", "mkv"
                ].includes(fileExt) ? "video" :
                    [
                        "mp3", "wav", "ogg", "aac", "flac", "m4a"
                    ].includes(fileExt) ? "audio" :
                        [
                            "jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"
                        ].includes(fileExt) ? "image" : "file") : "file";
                let temp: MsgType[] = []
                for (let item of prev) {
                    if (item?.file?.fileId != fileSharingCompleted.file.fileId) {
                        temp.push(item)
                    }
                }
                temp.push({ from: fileSharingCompleted.file.peerId, file: fileSharingCompleted.file, type: ftype, idx: prev.length, name: name ? name : fileSharingCompleted.file.peerId, url: fileSharingCompleted.objectUrl })
                return temp;
            })

            setAllMsg(prev => prev)
            setAllMsg(prev => prev)
            setAllMsg(prev => prev)

        }
    }, [fileSharingCompleted, peers])


    useEffect(() => {
        setPinId(prev => {
            for (let peer of peers) {
                if (peer.socketId == prev?.Id && prev?.type === "sc" && peer?.isScreenShareOn == false) return null
            }
            return prev
        })
    }, [peers])


    useEffect(() => {
        if (newDataChannelMsg) {
            let name = peers.find(peer => peer.socketId == newDataChannelMsg.from)?.info?.name
            setAllMsg(prev => prev.concat([{
                from: newDataChannelMsg.from,
                msg: JSON.parse(newDataChannelMsg.msg),
                type: "text",
                idx: prev.length,
                name: name ? name : newDataChannelMsg.from
            }]))
        }
    }, [newDataChannelMsg, peers])
    useEffect(() => {
        async function init() {
            if (!isInit.current && startMeeting && channelName && myName) {
                if (isSystemReady) {
                    channel = ably.channels.get(channelName);
                    console.log("isSystemReady");
                    channel.presence.enter({ name: myName });

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
                        joinNewPeer(member.clientId, { name: member.data.name });
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
                                if (other_users[i].clientId !== ably.auth.clientId) joinExistingPeer(other_users[i].clientId, { name: other_users[i].data.name });
                            }
                        }
                    });

                    isInit.current = true;
                }
            }
        }

        init();
    }, [isSystemReady, joinExistingPeer, joinNewPeer, leavePeer, onSocketMessage, startMeeting, channelName, myName,]);


    return (
        frame == 0 ?
            <div className="w-full h-screen flex  justify-center items-center " data-theme="dark">
                <div className="hidden lg:flex w-2/3 h-full  flex-col justify-start py-20 items-center gap-6 bg-[url('/bgHome.jpeg')] bg-no-repeat bg-center bg-cover rounded-tr-3xl rounded-br-3xl" >
                    <h1 className={`text-7xl my-4 font-semibold text-white ${curvedFont.className} `}>
                        Disposable Meeting
                    </h1>
                    <p className={`text-xl text-white ml-8 ${curvedFont.className} `}>
                        Have Meeting in One Click
                    </p>
                </div>
                <div className={`relative flex flex-col justify-start ${meetingUrl ? "py-36" : "py-[2.8rem]"} items-center gap-6 w-full lg:w-1/3 h-full`}>
                    <div className="flex justify-center items-center gap-2 w-full my-3">
                        <Image src="/logo.png" alt="logo" width={100} height={100} className="w-16 h-16" />
                        <h1 className="text-2xl font-bold text-white">MeetUp</h1>
                    </div>
                    <div className="flex flex-col justify-center items-center gap-6">
                        <input className="input rounded2xl input-primary" placeholder="Username" value={myName} onChange={(e) => setMyName(e.target.value)} />
                        {!meetingUrl && (<button className="btn btn-wide  btn-primary" onClick={() => createMeeting()} onKeyDown={(e) => e.key === "Enter" && createMeeting()}>Create Meeting</button>)}
                    </div>

                    {!meetingUrl && <div className="divider my-3">OR</div>}
                    
                    <div className="flex flex-col justify-center items-center gap-6">
                        {!meetingUrl && <input className="input rounded2xl input-primary" placeholder="code" value={inpLink || ""} onChange={(e) => setInpLink(e.target.value)} onKeyDown={(e) => e.key === "Enter" && joinMeeting()} />}
                        <button className="btn btn-wide  btn-primary" onClick={() => joinMeeting()}>Join Meeting</button>
                    </div>
                    <a href="https://github.com/mobinx" target="_blank" className="flex justify-center items-center gap-3 px-4 py-2 rounded-3xl absolute bottom-5 right-2">
                        <p className="text-white">Developed by</p>
                        <button type="button" className="p-px rounded-full rotation-animation transition-all shadow-[0_0_20px_0_rgba(245,48,107,0.1)] hover:shadow-[0_0_20px_3px_rgba(245,49,108,.2)] hover:bg-[#fff176] cursor-pointer conic-gradient dark:invert-0 invert hue-rotate-[190deg] dark:hue-rotate-0 transform-gpu "
                        style={{ background: "conic-gradient(from calc(var(--r2) - 80deg) at var(--x) 20px, transparent 0, #ffc22d 20%, transparent 25%), #452324", }} >
                        <span className="flex flex-nowrap items-center h-7 px-2 pr-4 font-medium tracking-tighter rounded-full pointer-events-none gap-3 py-4 text-sm bg-base-200 " >
                        
                            <Image src="https://github.com/mobinx.png" alt="logo" width={40} height={40} className="w-6 h-6 rounded-full" />
                            <p className="text-white">MobinX</p>
                            
                        </span>
                    </button>
                    </a>
                </div>
            </div>

            :
            (
                <div className="relative w-full h-screen flex  items-center justify-center">

                    <div className="w-full h-full flex flex-col lg:flex-row justify-center items-center px-4 py-6 gap-4">
                        {pinId && <div className="lg:w-2/3 w-full h-full flex justify-center items-center flex-1 px-2" >
                            {pinId.Id == ably.auth.clientId && pinId.type === "sc" &&
                                <ProfileCard className="h-full" name={myName + " (YOU)"} isAudioOn={false} isVideoOn={isScreenShareOn} audioStream={audioStream} videoStream={screenShareStream} onClick={() => setPinId(null)} />
                            }
                            {pinId.Id == ably.auth.clientId && pinId.type === "normal" &&
                                <ProfileCard className="h-full" name={myName + " (YOU)"} self={true} isAudioOn={false} isVideoOn={isVideoOn} audioStream={audioStream} videoStream={videoStream} onClick={() => setPinId(null)} />
                            }
                            {peers.find(peer => peer.socketId == pinId.Id) && pinId.type === "sc" && peers.find(peer => peer.socketId == pinId.Id)?.isScreenShareOn &&
                                <ProfileCard className="h-full" name={peers.find(peer => peer.socketId == pinId.Id)?.info.name + " (SCREENSHARE)" + (peers.find(peer => peer.socketId == pinId.Id)?.isScreenShareOn)} isAudioOn={false} isVideoOn={peers.find(peer => peer.socketId == pinId.Id)!.isScreenShareOn} audioStream={peers.find(peer => peer.socketId == pinId.Id)!.audioStream} videoStream={peers.find(peer => peer.socketId == pinId.Id)!.screenShareStream} onClick={() => setPinId(null)} />
                            }
                            {peers.find(peer => peer.socketId == pinId.Id) && pinId.type === "normal" &&
                                peers.find(peer => peer.socketId == pinId.Id) && <ProfileCard className="h-full" name={peers.find(peer => peer.socketId == pinId.Id)?.info.name} isAudioOn={peers.find(peer => peer.socketId == pinId.Id)!.isAudioOn} isVideoOn={peers.find(peer => peer.socketId == pinId.Id)!.isVideoOn} audioStream={peers.find(peer => peer.socketId == pinId.Id)!.audioStream} videoStream={peers.find(peer => peer.socketId == pinId.Id)!.videoStream} onClick={() => setPinId(null)} />

                            }
                        </div>}
                        <div className={`   ${pinId == null ? "h-full w-full grid overflow-auto lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 justify-center items-center" : "lg:w-1/3 w-full  flex lg:flex-col overflow-y-auto gap-4 items-center justify-center lg:justify-start lg:h-full h-auto"}  `}>
                            {!(pinId?.Id === ably.auth.clientId && pinId?.type === "normal") && <ProfileCard name={myName + " (YOU)"} isAudioOn={false} isVideoOn={isVideoOn} self={true} audioStream={audioStream} videoStream={videoStream} onClick={() => setPinId({ Id: ably.auth.clientId, type: "normal" })} className={`${pinId == null ? "" : "lg:min-h-48 w-full min-h-[8rem] min-w-[14rem]   lg:min-w-72"}`} />
                            }
                            {!(pinId?.Id === ably.auth.clientId && pinId?.type === "sc") && isScreenShareOn && <ProfileCard name={myName + " (YOU)"} isAudioOn={false} isVideoOn={isScreenShareOn} audioStream={audioStream} videoStream={screenShareStream} onClick={() => setPinId({ Id: ably.auth.clientId, type: "sc" })} className={`${pinId == null ? "" : "lg:min-h-48 w-full min-h-[8rem] min-w-[14rem]   lg:min-w-72"}`} />
                            }
                            {peers.map((peer, key) =>
                                <Fragment key={key}>
                                    {!(pinId?.Id === peer.socketId && pinId?.type === "normal") && <ProfileCard name={peer?.info.name} isAudioOn={peer.isAudioOn} isVideoOn={peer.isVideoOn} audioStream={peer.audioStream} videoStream={peer.videoStream} onClick={() => setPinId({ Id: peer.socketId, type: "normal" })} className={`${pinId == null ? "" : "lg:min-h-48 w-full min-h-[8rem] min-w-[14rem]   lg:min-w-72"}`} />}
                                    {!(pinId?.Id === peer.socketId && pinId?.type === "sc") && peer.isScreenShareOn && <ProfileCard name={peer?.info.name} isAudioOn={false} isVideoOn={peer.isScreenShareOn} audioStream={peer.audioStream} videoStream={peer.screenShareStream} onClick={() => setPinId({ Id: peer.socketId, type: "sc" })} className={`${pinId == null ? "" : "lg:min-h-48 w-full min-h-[8rem] min-w-[14rem]   lg:min-w-72"}`} />}
                                </Fragment>
                            )}
                        </div>
                    </div>
                    <div className="absolute lg:bottom-8 bottom-[0.6rem] z-[99] left-1/2 transform -translate-x-1/2   rounded-3xl bg-gray-900">
                        <button className="btn bg-transparent text-white rounded-3xl rounded-tr-none rounded-br-none" onClick={async () => await toggleCamera()}>{isVideoOn ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}</button>
                        <button className="btn bg-transparent text-white rounded-none" onClick={async () => await toggleAudio()}>{isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}</button>
                        <button className="btn bg-transparent text-white rounded-3xl rounded-tl-none rounded-bl-none" onClick={async () => await toggleScreenShare()}>{isScreenShareOn ? <ScreenShare className="w-6 h-6" /> : <ScreenShareOff className="w-6 h-6" />}</button>
                    </div>
                    <div className="absolute lg:bottom-8 bottom-[0.6rem] z-[99] right-3   rounded-3xl bg-gray-900">
                        <button className="btn bg-transparent text-white rounded-3xl " onClick={async () => setIschatBoxOpen(true)}> <MessageSquareShare className="w-6 h-6" /></button>
                    </div>

                    {taostMsg && <div className="toast bottom-[0.9rem] lg:bottom-10 toast-start z-[199]">
                        <div className="alert alert-info">
                            <span>{taostMsg}</span>
                        </div>
                    </div>
                    }


                    {ischatBoxOpen && <div className="absolute flex flex-col justify-center items-center  lg:right-5 top-6 z-[100] min-w-[350px] w-[95%] lg:w-[350px] h-[90%]  bg-white rounded-3xl text-black">
                        <div className="flex w-full justify-between items-center p-3">
                            <p className="text-lg font-bold">Messages</p>
                            <button className="btn btn-circle btn-ghost btn-sm bg-transparent text-red-500" onClick={() => setIschatBoxOpen(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex flex-col w-full h-full justify-start items-center flex-1 overflow-y-auto gap-2 px-3">
                            {/* {allMsg.map(({ type, msg, from, url, file, name }, key) => (
                                    <div className={`flex gap-2 w-full ${ably.auth.clientId === from ? "flex-row-reverse" : "flex-row"}`} key={key} >
                                    <Avatar name={name || from} />
                                    {type === "text" && <p className="text-sm bg-gray-700 rounded-lg p-2 text-white w-full"><LinkTagger text={msg || ""} /></p>}
                                    {type === "image" && url && <div className="flex flex-col justify-between items-center gap-2 p-3 rounded-lg shadow-2xl bg-gray-400 w-full">
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
                                            <p className="text-white">{Math.round(file?.progress || 0)}%</p>
                                        </div>
                                        <progress value={file?.progress} max="100" className="w-full"></progress>
                                    </div>}
                                </div>
                            ))} */}




                            {allMsg.map((msg, key) => <Msg key={key} type={msg.type} msg={msg ? msg.msg : null} from={msg.from} url={msg.url ? msg.url : null} file={msg.file ? msg.file : null} myId={ably.auth.clientId} name={msg.name ? msg.name : msg.from} />)}
                        </div>

                        <div className="flex justify-between items-center p-3 w-full">
                            <input type="text" className="input input-bordered input-sm bg-gray-600 text-white placeholder:text-white w-full max-w-xs" value={myMsg} onChange={(e) => setMyMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendUIMsg(myMsg)} />
                            <div className="flex gap-3">
                                <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => { if (e.target.files) sendUIFile(e.target.files[0]); }} />
                                <button className="btn btn-circle btn-ghost btn-sm bg-transparent " onClick={() => { if (fileInputRef.current) fileInputRef.current.click() }}><PlusCircle className="w-6 h-6" /></button>
                                <button className="btn btn-circle btn-ghost btn-sm bg-transparent " onClick={() => sendUIMsg(myMsg)}><Send className="w-6 h-6" /></button>
                            </div>
                        </div>

                    </div>
                    }

                </div>
            )
    )

}






