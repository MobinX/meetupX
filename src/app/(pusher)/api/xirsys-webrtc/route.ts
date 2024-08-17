import Pusher from "pusher";

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_APP_KEY!,
    secret: process.env.PUSHER_APP_SECRET!,
    cluster: process.env.PUSHER_APP_CLUSTER!,
    useTLS: true,
});

const generateCustomUniqueId = (length = 12) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-=@,.';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
};

export async function GET(req:any) {
    console.log(req)
   
        try {
          // Get Token
          const tokenResponse = await fetch("https://global.xirsys.net/_token/sigflow?expire=120", {
            method: "PUT",
            headers: {
              "Authorization": "Basic " + Buffer.from("mobin:e2d2ad94-0e2b-11eb-85a4-0242ac150006").toString("base64")
            }
          });
          const token = await tokenResponse.text();
          console.log("Token Response:", token);
      
          // Get Host
          const hostResponse = await fetch("https://global.xirsys.net/_host?type=signal", {
            method: "GET",
            headers: {
              "Authorization": "Basic " + Buffer.from("mobin:e2d2ad94-0e2b-11eb-85a4-0242ac150006").toString("base64")
            }
          });
          const host = await hostResponse.text();
          console.log("Host Response:", host);
      
          return Response.json({ token, host })
        } catch (error) {
          console.error("Error fetching Xirsys data:", error);
          throw error; // Re-throw the error for handling elsewhere if needed
        }
      
      
      // Example usage
    
        
    
    
  }