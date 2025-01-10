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
 - And for those who are *really* enthusiatic it would be possible to use WebGL to create an interactive spectator client...

And I'm sure with some creative thinking that there could be many more applications 😁



Getting Started
---------------

The purpose of this repository is mostly to document the available data sent from the Super Video Golf client, along with some rudiemtary demonstrations for its use. It also includes some boilerplate javascript functions which can be used to interpret the incoming data into javascript objects that can, in turn, be used to build your own applications. And, with any luck, the documentation will be useful enough for those using other languages such as C# to build their own interface adapters. The Super Video Golf data API (if that's what it can be called) is likely to evolve over time, however I will do my best to maintain backwards compatibility as more data is added.

Boiler plate functions written in javascript and information on how they work is included in `example/supervideo.js` - if you're creating a web interface usually it is enough to just include the script file in your project and work from there.

For other languages below is a list of the raw packets sent by Super Video Golf and how they would be represented as a C style struct. From there I hope it should be relatively easy to extrapolate to other programming languages.

Make sure all websocket clients are set to use "bytearray" as the binary type. For the colour palette used by Super Video Golf, see [colordome-32](https://lospec.com/palette-list/colordome-32) at lospec.



Available Data
--------------
Data packets broadcast by Super Video Golf (details below):

 - Player info: Sent from game lobby and when connecting mid-round
 - Client Disconnect: Sent when remote clients have disconnected from the game or lobby
 - Score Updates: Sent on connection, and when the current player or hole changes.
 - Map Info: Sent on round start and when connecting mid-round
 - Hole data: Sent on round start, when first connecting
 - Active Player: Sent on connection and when current player is changed
 - Rich presence strings: Rather than a struct these are sent as a single utf-8 encoded byte array
 - Position Updates <NA>    


The websocket server can be queried from the Super Video Golf console (press F1), with the command `show_websock` which displays some rudimentary information such as host address if the server is running.


Packet Data
-----------

Note PacketIDs are non-contiguous and should never be assumed to be so! Multi-byte data types (eg float or int32) are little-endian.

    //each websocket packet is ID'd with one of the below,
    //taking up exactly 1 byte, and the very beginning of the packet.
    enum PacketID
    {
        Null               = -1;
        PlayerInfo         = 50;
        ClientDisconnected = 2;        
        ScoreUpdate        = 12;
        MapInfo            = 63;
        HoleInfo           = 10;
        ActivePlayer       = 9;
        PlayerPosition     = 22;
        RichPresence       = 127;
    }

After the ID byte, each packet is then followed by one of these structs, packed as an array, depending on which ID the packet has.


    //note that final packet size received from the websocket
    //includes the entire name string in utf-8, appended to this struct
    struct PlayerInfo
    {
        byte clientID;
        byte playerID;
        byte isCPU;
        byte* nameStr;
    };


    //ClientDisconnect - contains a single byte with a
    //client ID. All players on this client should be removed.
    byte clientID;


    //not all fields are populated, based on the current game mode.
    struct ScoreUpdate
    {
        float strokeDistance;
        float distanceScore;
        byte clientID;
        byte playerID;
        byte stroke; //score for current hole
        byte hole;
        byte score; //total score
        byte matchScore;
        byte skinsScore;
        byte padding;
    };


    struct MapInfo
    {
        byte courseIndex;
        byte holeCount;
        byte reverseOrder;
        byte gameMode;
        byte weatherType;
        byte nightMode;
        byte currentHole;
    };


    //OpenGL coordinates, eg Y-up
    struct HoleInfo
    {
        byte index;
        byte par;
        float teeX;
        float teeY;
        float teeZ;
        float pinX;
        float pinY;
        float pinZ
    };


    //again, OpenGL coords, Y-up
    struct ActivePlayer
    {
        float posX;
        float posY;
        float posZ;
        byte clientID;
        byte playerID;
        byte terrainID;
    }


License
-------
All code and documents in this repository (found at https://github.com/fallahn/svs) is released in to the public domain with the hopes that it is merely useful - WITH NO PROMISES OF ACCURACY AND NO WARRANTY WHATSOEVER.