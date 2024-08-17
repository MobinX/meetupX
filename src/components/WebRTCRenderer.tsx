"use client"
import React, { useEffect, useRef } from 'react';
import { useWebRTC } from './WebRTCContext';

const WebRTCComponent: React.FC = () => {
    const {
        localStream,
        remoteStreams,
        toggleCamera,
        toggleMicrophone,
        isCameraOn,
        isMicrophoneOn
    } = useWebRTC();
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    return (
        <div>
            <video ref={localVideoRef} autoPlay muted playsInline />
            <div>
                {remoteStreams.map(({ peerId, stream }) => (
                    <Video key={peerId} stream={stream} />
                ))}
            </div>
            <div>
                <button onClick={toggleCamera}>
                    {isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
                </button>
                <button onClick={toggleMicrophone}>
                    {isMicrophoneOn ? 'Turn Microphone Off' : 'Turn Microphone On'}
                </button>
            </div>
        </div>
    );
};

export default WebRTCComponent;

interface VideoProps {
    stream: MediaStream;
}

const Video: React.FC<VideoProps> = ({ stream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return <video ref={videoRef} autoPlay playsInline />;
};