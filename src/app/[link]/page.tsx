import Image from "next/image";
import dynamic from "next/dynamic";
export const runtime = "edge";


const Meet = dynamic(() => import("../Meet"), { ssr: false });


export default async function Home() {
  const response = await fetch("https://virsys.metered.live/api/v1/turn/credentials?apiKey=9fb58d67a3a41d96bbc3f2450196d0e7125d");
  const iceServers = await response.json();
  console.log(iceServers);
  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center ">
      <Meet iceServers={iceServers} />
     
    </div>
  );
}
