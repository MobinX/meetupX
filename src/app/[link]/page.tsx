import Image from "next/image";
import dynamic from "next/dynamic";
export const runtime = "edge";


const Meet = dynamic(() => import("../Meet"), { ssr: false });


export default async function Home() {
  const response = await fetch("https://virsys.metered.live/api/v1/turn/credentials?apiKey=ca9f4e60bf446fc29401ccb1fa904d110708");
  const iceServers = await response.json();
  console.log(iceServers);
  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center ">
      <Meet iceServers={iceServers} />
     
    </div>
  );
}
