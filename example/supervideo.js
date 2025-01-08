/*
supervideo.js Public Domain

Super Video Golf is an arcade style golf game available on [itch.io](https://fallahn.itch.io/super-video-golf)
and [Steam](https://store.steampowered.com/app/2173760/Super_Video_Golf/).
It provides a websocket server to which clients can connect and receive realtime updates.
More info about how this works and what can be done with it is available in the readme.md
file provided in this repository at https://github.com/fallahn/svs.

*/

//packet IDs are used to identify what has been collected from the incoming socket
//Don't change these! They're set by the game server.
const PacketIDNull = -1;
const PacketIDPlayerInfo = 50;
const PacketIDPlayerPosition = 22;
const PacketIDScoreUpdate = 12;




/*
This function returns a decoded packet directly from a websocket event. The return value promises
only a type field - which should always be checked to see which data arrived. The type
will be one of the PacketID values (above). If the type value is PacketIDNull then there are
no other valid fields available. You would usually set up your socket message handler something
like:

    var socket = new WebSocket("ws://127.0.0.1:8080");
    socket.binaryType = "arraybuffer";
    socket.onmessage = function(evt)
    {
        var packetData = getPacketData(evt);
        switch (packetData.type)
        {
            case PacketIDNull: break;
            case PacketIDPlayerInfo:
                players[packetData.clientID][packetData.playerID].name = packetData.name;
                //etc...
                break;
        }
    }
*/

function getPacketData(packet)
{
    //docs are infuriatingly hard to navigate - how do we know this isn't
    //text? (other than the fact SVG should never send text)

    const view = new DataView(packet.data);
    const id = view.getUint8(0);

    switch(id)
    {
    default:
        console.log("Packet ID is " + id);
        return new NullPacket();

    case PacketIDPlayerInfo:
        const client = view.getUint8(1);
        const player = view.getUint8(2);

        var decoder = new TextDecoder();
        const name = decoder.decode(new Uint8Array(packet.data, 3));

        return new PlayerInfo(client, player, name);
    }

    return new NullPacket();
}

/*
Packet types
*/

function NullPacket()
{

}
NullPacket.prototype.type = PacketIDNull;

function PlayerInfo(clientID, playerID, name)
{
    this.clientID = clientID;
    this.playerID = playerID;
    this.name = name;
}
PlayerInfo.prototype.type = PacketIDPlayerInfo;