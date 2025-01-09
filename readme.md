Super Video Sockets
-------------------

Welcome to Super Video Sockets (or a better name here)! Since version 1.20.0, Super Video Golf has supported connecting to external clients via websockets. Once a websocket client has connected to the Super Video Golf game client (which also acts as a websocket server) Super Video Golf will start to broadcast game information such as player info, scores and even the position of player balls. To enable the server in Super Video Golf, make sure you go to the Options menu and check the `websocket server` box. You may also choose a port for the connection here (which defaults to 8080).

The websocket server *does not* support `wss://` (that is, secure connections) - only `ws://` so when using a web browser (and likely other clients) you'll only be able to connect from devices on your local network. The reason for this is mostly down to preferring not to support all the dependencies required for TLS, but also preventing stray internet connections to your golf game is probably a good thing! If you want to connect to a golf game across the internet you'll need some sort of virtual LAN set up, or perhaps create your own websocket relay server. Whichever you use the onus of the security implications is on you 😉

With that said, just what is the websocket server useful for? Mostly, with it being a relatively accessible protocol, it means anyone with some (usually web-based) knowhow can further customise their golf experience - in particular this project is born of multiple requests for custom scoring types which can easily be implemented in a web interface, for example, without needing to modify the core game. It also lends itself to other possible applications:

 - Creating overlays for streaming. Custom score outputs or even map overlays (using the ball position updates) can be conjoured in a web page with relative ease.
 - More local player interaction. Multple connections can be made to a single golf client, meaning that perhaps players can each connect with their smart phones, and use those as additional inputs, such as voting for a new map, or player of the game.
 - Team play matches. By default Super Video Golf doesn't support golf teams, however with the current round's scores continually updated a web application can group players into teams and calculate the final score accordingly.
 - Real world leagues, where player scores are entered into a database such as SQLite that automatically calculates (and perpetuates) league standing.
 - Mirroring the scoreboard or other information on a secondary display. For multiplayer hotseat games having a permanent scoreboard up on another TV or monitor would be more convenient than relying on the in-game UI

And I'm sure with some creative thinking that there could be many more applications 😁



Getting Started
---------------

The purpose of this repository is mostly to document the available data sent from the Super Video Golf client, along with some rudiemtary demonstrations for its use. It also includes some boilerplate javascript functions which can be used to interpret the incoming data into javascript objects that can, in turn, be used to build your own applications. And, with any luck, the documentation will be useful enough for those using other languages such as C# to build their own interface adapters. The Super Video Golf data API (if that's what it can be called) is likely to evolve over time, however I will do my best to maintain backwards compatibility as more data is added.

Boiler plate functions written in javascript and information on how they work is included in `example/supervideo.js` - if you're creating a web interface usually it is enough to just include the script file in your project and work from there.

For other languages below is a list of the raw packets sent by Super Video Golf and how they would be represented as a C style struct. From there I hope it should be relatively easy to extrapolate to other programming languages.

Make sure all websocket clients are set to use "bytearray" as the binary type.



Available Data
--------------
Data packets broadcast by Super Video Golf (details below):

 - Player info: Sent from game lobby and when connecting mid-round
 - Score Updates <NA>
 - Hole data (number, par, pin and tee position) <NA>
 - Game Info (course name, hole count, rules in use) <NA>
 - Rich presence strings <NA>
 - Position Updates <NA>    



Packet Data
-----------

Note PacketIDs are non-contiguous and should never be assumed to be so!

    //each websocket packet is ID'd with one of the below, taking up exactly 1 byte, and the very beginning of the packet.
    enum PacketID
    {
        Null               = -1;
        PlayerInfo         = 50;
        ScoreUpdate        = 12;
        ClientDisconnected = 2;
        PlayerPosition     = 22;
    }

After the ID byte, each packet is then followed by one of these structs, packed as an array, depending on which ID the packet has.


    //note that final packet size received from the websocket includes the entire name string in utf-8, appended to this struct
    struct PlayerInfo
    {
        byte clientID;
        byte playerID;
        byte isCPU;
        byte* nameStr;
    };



License
-------
All code and documents in this repository (found at https://github.com/fallahn/svs) is released in to the public domain with the hopes that it is merely useful - WITH NO PROMISES OF ACCURACY AND NO WARRANTY WHATSOEVER.