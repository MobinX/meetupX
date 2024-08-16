import Pusher from "pusher";

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_APP_KEY!,
    secret: process.env.PUSHER_APP_SECRET!,
    cluster: process.env.PUSHER_APP_CLUSTER!,
    useTLS: true,
});

export async function POST(req:any) {
    
    const { socket_id, channel_name } = req.body;

        // In a real application, you should verify the user's identity before authorizing
        // For example, you might check the user's session or a JWT token
        const user = { id: 'unique_user_id', name: 'User Name' };

        // Authenticate the request
        const auth = pusher.authenticateUser(socket_id, {
            id: user.id,
            user_info: {
                name: user.name,
            },
        });

        
    
    return Response.json(auth)
  }