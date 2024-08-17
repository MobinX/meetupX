export async function getServerlist() {
    const response =
        await fetch("https://virsys.metered.live/api/v1/turn/credentials?apiKey=ca9f4e60bf446fc29401ccb1fa904d110708");
    const iceServers = await response.json();

    return iceServers;
}

export async function getXirsysTokenAndHost() {
    try {
        // Get Token
        const name = prompt("Enter your name:");
        const tokenResponse = await fetch("https://global.xirsys.net/_token/sigflow?expire=120&k=" + name + "", {
          method: "PUT",
          headers: {
            "Authorization": "Basic " + Buffer.from("mobin:e2d2ad94-0e2b-11eb-85a4-0242ac150006").toString("base64")
          }
        });
        const token = await tokenResponse.text();
        console.log("Token Response:", token);
    
        // Get Host
        const hostResponse = await fetch("https://global.xirsys.net/_host?type=signal&k="+ name + "", {
          method: "GET",
          headers: {
            "Authorization": "Basic " + Buffer.from("mobin:e2d2ad94-0e2b-11eb-85a4-0242ac150006").toString("base64")
          }
        });
        const host = await hostResponse.text();
        console.log("Host Response:", host);
    
        return { token, host,name }
      } catch (error) {
        console.error("Error fetching Xirsys data:", error);
        throw error; // Re-throw the error for handling elsewhere if needed
      }
    
  }
  