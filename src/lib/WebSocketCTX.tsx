import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Pusher from 'pusher-js';

interface SocketContextProps {
    sendMsg: (message: any) => void;
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
    const [pusher, setPusher] = useState<Pusher | null>(null);
    const [lastMsg, setLastMsg] = useState<any>(null);
    const [peers, setPeers] = useState<string[]>([]);

    useEffect(() => {
        const pusherClient = new Pusher('c3c0ae57003faff2932c', {
            cluster: 'mt1'
          });

        setPusher(pusherClient);

        const channel = pusherClient.subscribe('webrtc-channel');

        channel.bind('pusher:subscription_succeeded', (members: any) => {
            const peerIds = Object.keys(members.members);
            setPeers(peerIds);
        });

        channel.bind('pusher:member_added', (member: any) => {
            setPeers(prev => [...prev, member.id]);
            handleOnJoin(member.id);
        });

        channel.bind('pusher:member_removed', (member: any) => {
            setPeers(prev => prev.filter(peerId => peerId !== member.id));
            handleOnLeave(member.id);
        });

        channel.bind('client-webrtc-message', (message: any) => {
            setLastMsg(message);
        });

        return () => {
            pusherClient.disconnect();
        };
    }, []);

    const handleOnJoin = (peerId: string) => {
        onJoinCallbacks.forEach(callback => callback(peerId));
    };

    const handleOnLeave = (peerId: string) => {
        onLeaveCallbacks.forEach(callback => callback(peerId));
    };

    const onJoinCallbacks: ((peerId: string) => void)[] = [];
    const onLeaveCallbacks: ((peerId: string) => void)[] = [];

    const sendMsg = (message: any) => {
        if (pusher) {
            pusher.send_event('client-webrtc-message', message, 'webrtc-channel');
        }
    };

    const onJoin = (callback: (peerId: string) => void) => {
        onJoinCallbacks.push(callback);
    };

    const onLeave = (callback: (peerId: string) => void) => {
        onLeaveCallbacks.push(callback);
    };

    return (
        <SocketCTX.Provider value={{ sendMsg, lastMsg, peers, onJoin, onLeave }}>
            {children}
        </SocketCTX.Provider>
    );
};
