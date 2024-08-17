"use client";
import { getXirsysTokenAndHost } from '@/lib/getServerlist';
import { useEffectOnce } from '@/lib/useEffectOnce';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SocketContextProps {
    sendMsg: (message: any, toPeer?: string) => void;
    lastMsg: any;
    peers: string[];
    onJoin: (callback: (peerId: string) => void) => void;
    onLeave: (callback: (peerId: string) => void) => void;
}

const SocketCTX = createContext<SocketContextProps | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketCTX);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [lastMsg, setLastMsg] = useState<any>(null);
    const [peers, setPeers] = useState<string[]>([]);
    const [channelPath, setChannelPath] = useState<string | null>(null); // Store the channel path
    const [userName, setUserName] = useState<string>('MyClientId'); // Set your user name

    useEffectOnce(() => {
        const getXirsysInfo = async () => {
            try {
                const { token, host, name } = await getXirsysTokenAndHost();
                setUserName(name || "");
                console.log(name)
                const signalPath = `${host}/v2/${token}`;
                setChannelPath(token); // Set the channel path
                const ws = new WebSocket(signalPath);

                ws.onopen = () => {
                    console.log("[Socket] Connected to Xirsys signaling server");
                    setSocket(ws);
                    keepAlive(ws); // Start keep-alive
                };

                ws.onmessage = (event) => {
                    const pkt = JSON.parse(event.data);
                    if (pkt === 'pong') return; // Ignore pong responses

                    const payload = pkt.p;
                    const meta = pkt.m;
                    const msgEvent = meta.o;
                    const toPeer = meta.t;
                    const fromPeer = (meta.f).replace("sigflow/", "");

                    switch (msgEvent) {
                        case 'peers':
                            console.log("[Socket] Peers:", payload);
                            setPeers(payload);
                            break;
                        case 'peer_connected':
                            console.log("[Socket] Peer Connected:", fromPeer);
                            setPeers(peers.concat([fromPeer]));
                            handleOnJoin(fromPeer,name);
                            break;
                        case 'peer_removed':
                            console.log("[Socket] Peer Removed:", fromPeer);
                            setPeers(peers.filter(peerId => peerId !== fromPeer));
                            handleOnLeave(fromPeer);
                            break;
                        case 'message':
                            console.log("[Socket] Message Received:", payload);
                            if (toPeer && toPeer === userName) setLastMsg({ from: fromPeer, message: payload });
                            break;
                    }
                };

                ws.onerror = (error) => {
                    console.error("[Socket] Error:", error);
                };

                ws.onclose = () => {
                    console.log("[Socket] Connection closed");
                };

                setSocket(ws);
            } catch (error) {
                console.error("Error connecting to Xirsys:", error);
            }
        };

        getXirsysInfo();

        return () => {
            if (socket) {
                socket.close();
            }
        };
    });

    const handleOnJoin = (peerId: string,name:any) => {
        if (peerId !== name) {
            console.log("[Socket] Peer Joined Callback:", peerId);
            onJoinCallbacks.forEach(callback => callback(peerId));
        }
    };

    const handleOnLeave = (peerId: string) => {
        onLeaveCallbacks.forEach(callback => callback(peerId));
    };

    const onJoinCallbacks: ((peerId: string) => void)[] = [];
    const onLeaveCallbacks: ((peerId: string) => void)[] = [];

    const sendMsg = (message: any, toPeer?: string) => {
        if (socket && channelPath) {
            const pkt = {
                t: "u",
                m: {
                    f: `${"sigflow"}/${userName}`,
                    t: toPeer, // Optional: Send to a specific peer
                    o: "message"
                },
                p: message
            };
            socket.send(JSON.stringify(pkt));
        }
    };

    const onJoin = (callback: (peerId: string) => void) => {
        onJoinCallbacks.push(callback);
    };

    const onLeave = (callback: (peerId: string) => void) => {
        onLeaveCallbacks.push(callback);
    };

    // Keep-alive function
    const keepAlive = (ws: WebSocket) => {
        setInterval(() => {
            ws.send('ping');
        }, 800);
    };

    // ... (getXirsysTokenAndHost function from previous response)

    return (
        <SocketCTX.Provider value={{ sendMsg, lastMsg, peers, onJoin, onLeave }}>
            {children}
        </SocketCTX.Provider>
    );
};