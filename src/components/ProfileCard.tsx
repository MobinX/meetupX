"use client"
import { Volume2, VolumeX } from "lucide-react"
import { useRef, useState, useEffect } from "react"

const Avatar = ({ name, className }: { name: string, className?: string }) => {

    return (
      <div className={`bg-purple-700 w-6 h-6 rounded-full z-30  ${className}`}>
        <p className="text-white text-center">{name}</p>
      </div>
    )
  }
  
  
  const VIdeo = ({ stream, className }: { stream: MediaStream ,className?: string}) => {
    let viref = useRef<HTMLVideoElement|null>(null)
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
  
            if(viref.current.paused){
                viref.current.play()
            }
        }
    })
  
    return (
        <video ref={viref} playsInline autoPlay muted  style={{ width: "100%" }} className={className} ></video>
    )
  }
  
  const AUdeo = ({ stream }: { stream: MediaStream }) => {
    let viref = useRef<HTMLAudioElement|null>(null)
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
  
            if(viref.current.paused){
                viref.current.play()
            }
        }
    })
  
    return (
        <audio ref={viref} playsInline autoPlay  style={{ width: "100%" }} className="hidden" controls={true}></audio>
    )
  }
  
 export const ProfileCard = ({ audioStream, videoStream,  isVideoOn, isAudioOn, name,onClick,className="" }: { name: string, isVideoOn: boolean, isAudioOn: boolean, videoStream: MediaStream | null, audioStream: MediaStream | null, onClick: () => void ,className?: string}) => {
  
    return (
      <div className={`relative min-h-48 w-full  min-w-72 bg-black rounded-2xl ${className}`} onClick={onClick}>
        <Avatar className="absolute bottom-3 left-2" name={name} />
        <div className="absolute top-2 right-2 flex justify-center items-center w-6 h-6 text-white">
          {isAudioOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </div>
  
        {!isVideoOn  &&
          <div className="absolute inset-0 w-full h-full flex justify-center items-center text-white">
            {name}
          </div>
        }
  
        {isVideoOn && videoStream  && <VIdeo stream={videoStream!} className="absolute inset-0 w-full h-full" />}
  
       
  
        {isAudioOn && audioStream && <AUdeo stream={audioStream} />}
  
      </div>
    )
  }