import { WebRTCProvider } from "@/components/WebRTCContext";
import WebRTCComponent from "@/components/WebRTCRenderer";
import { SocketProvider } from "@/components/WebSocketCTX";
import { getServerlist } from "@/lib/getServerlist";
import Image from "next/image";



export default async function Home() {
  const serverList = await getServerlist();
  return (
    <SocketProvider>
      <WebRTCProvider serverList={serverList}>
        <WebRTCComponent />
      </WebRTCProvider>
    </SocketProvider>
  );
}
