"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useSocket } from './WebSocketCTX';
import { useEffectOnce } from '@/lib/useEffectOnce';

interface WebRTCContextProps {
    localStream: MediaStream | null;
    remoteStreams: RemoteStreamData[];
    toggleCamera: () => void;
    toggleMicrophone: () => void;
    isCameraOn: boolean;
    isMicrophoneOn: boolean;
}

interface RemoteStreamData {
    peerId: string;
    stream: MediaStream;
}

const WebRTCContext = createContext<WebRTCContextProps | undefined>(undefined);

export const useWebRTC = () => {
    const context = useContext(WebRTCContext);
    if (!context) {
        throw new Error('useWebRTC must be used within a WebRTCProvider');
    }
    return context;
};

export const WebRTCProvider: React.FC<{ children: ReactNode, serverList: any }> = ({ children , serverList}) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<RemoteStreamData[]>([]);
    const [peerConnections, setPeerConnections] = useState<{ [peerId: string]: RTCPeerConnection }>({});
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
    const { sendMsg, lastMsg, peers, onLeave, onJoin } = useSocket()

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => setLocalStream(stream))
            .catch(error => console.error('Error accessing media devices.', error));
    }, []);

    const createPeerConnection = (peerId: string, polite: boolean): RTCPeerConnection => {
        const peerConnection = new RTCPeerConnection({
            iceServers: serverList
        });
        let makingOffer = false;

        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
        }

        peerConnection.ontrack = event => {
            setRemoteStreams(prev => {
                const existingStream = prev.find(rs => rs.peerId === peerId);
                if (existingStream) {
                    existingStream.stream = event.streams[0];
                    return [...prev];
                } else {
                    return [...prev, { peerId, stream: event.streams[0] }];
                }
            });
        };

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                sendMsg({ type: 'candidate', peerId, candidate: event.candidate },peerId);
            }
        };

        peerConnection.onnegotiationneeded = async () => {
            try {
                makingOffer = true;
                await peerConnection.setLocalDescription();
                sendMsg({ type: 'offer', peerId, sdp: peerConnection.localDescription }, peerId);
            } catch (err) {
                console.error('Error during negotiation:', err);
            } finally {
                makingOffer = false;
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            if (peerConnection.iceConnectionState === 'failed') {
                peerConnection.restartIce();
            }
        };

        peerConnection.onconnectionstatechange = () => {
            if (peerConnection.connectionState === 'failed') {
                peerConnection.restartIce();
            }
        };

        setPeerConnections(prev => ({ ...prev, [peerId]: peerConnection }));

        return peerConnection;
    };

    const handleRemoteMessage = async (msg: any) => {
        const { peerId, sdp, candidate, type } = msg;
        const peerConnection = peerConnections[peerId] || createPeerConnection(peerId, false);
        const polite = peers.some(peer => peer === peerId);

        try {
            if (type === 'offer' || type === 'answer') {
                const offerCollision = type === 'offer' && (peerConnection.signalingState !== 'stable');
                const ignoreOffer = !polite && offerCollision;
                if (ignoreOffer) return;

                await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));

                if (type === 'offer') {
                    await peerConnection.setLocalDescription();
                    sendMsg({ type: 'answer', peerId, sdp: peerConnection.localDescription }, peerId);
                }
            } else if (type === 'candidate') {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    if (!peerConnection.remoteDescription) throw err;
                }
            }
        } catch (err) {
            console.error('Error handling remote message:', err);
        }
    };

    useEffect(() => {
        if (lastMsg) {
            handleRemoteMessage(lastMsg.message);
        }
    }, [lastMsg]);

    useEffectOnce(()=>{
        // peers.forEach(peerId => {
        //     const peerConnection = createPeerConnection(peerId, true); // Polite peer
        //     // peerConnection.createOffer().then(offer => {
        //     //     peerConnection.setLocalDescription(offer);
        //     //     sendMsg({ type: 'offer', peerId, sdp: offer },peerId);
        //     // });
        // });

    })

    useEffect(() => {
        onJoin(peerId => { console.log("[WebRTC] Peer Joined",peerId);  createPeerConnection(peerId, true)});
       
        onLeave(peerId => {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                setPeerConnections(prev => {
                    const updatedPeers = { ...prev };
                    delete updatedPeers[peerId];
                    return updatedPeers;
                });
            }
        });
    }, [ onJoin, onLeave]);

    const toggleCamera = async () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                if (isCameraOn) {
                    videoTrack.stop();
                } else {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    const newVideoTrack = stream.getVideoTracks()[0];
                    localStream.addTrack(newVideoTrack);

                    Object.values(peerConnections).forEach(peerConnection => {
                        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(newVideoTrack);
                        }
                    });
                }
                setIsCameraOn(!isCameraOn);
            }
        }
    };

    const toggleMicrophone = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicrophoneOn(audioTrack.enabled);
            }
        }
    };

    return (
        <WebRTCContext.Provider value={{
            localStream,
            remoteStreams,
            toggleCamera,
            toggleMicrophone,
            isCameraOn,
            isMicrophoneOn,
        }}>
            {children}
        </WebRTCContext.Provider>
    );
};
