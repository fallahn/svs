/*
supervideo.js Public Domain

Super Video Golf is an arcade style golf game available on [itch.io](https://fallahn.itch.io/super-video-golf)
and [Steam](https://store.steampowered.com/app/2173760/Super_Video_Golf/).
It provides a websocket server to which clients can connect and receive realtime updates.
More info about how this works and what can be done with it is available in the readme.md
file provided in this repository at https://github.com/fallahn/svs.

*/


const CourseNames = 
[
    "Westington Links, Isle of Pendale",
    "Grove Bank, Mont Torville",
    "Old Stemmer's Lane Pitch 'n' Putt",
    "Roving Sands, East Nerringham",
    "Sunny Cove, Weald & Hedgeways",
    "Terdiman Cliffs Putting Course",
    "Dackel's Run, Beneslavia",
    "Moulin Plage, Île du Coulée",
    "Purcitop Pitch 'n' Putt",
    "Fairland Rock, Kingsfield",
    "Nguyen Valley, Greyshale Province",
    "Hertog Regis, Kaalsmeer",

    "User Defined"
];

const HoleStrings = 
[
    "18 Holes",
    "Front 9",
    "Back 9"
];

const RuleStrings = 
[
    "Stroke Play", 
    "Stableford", 
    "Stableford Pro",
    "Match Play",
    "Skins",
    "Multi-target",
    "Short Round",
    "Elimination",
    "Clubset Shuffle",
    "Nearest the Pin",
    "Nearest the Pin+",
];

const WeatherType = 
[
    "Clear",
    "Rain",
    "Showers",
    "Mist",
    "Random"
];

//packet IDs are used to identify what has been collected from the incoming socket
//Don't change these! They're set by the game server.
const PacketIDNull = -1;
const PacketIDPlayerInfo = 50;
const PacketIDClientDisconnected = 2;
const PacketIDScoreUpdate = 12;
const PacketIDMapInfo = 63;
const PacketIDPlayerPosition = 22;





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
        return new NullPacket(id);

    case PacketIDPlayerInfo:
        const client = view.getUint8(1);
        const player = view.getUint8(2);
        const isCPU = view.getUint8(3);

        var decoder = new TextDecoder();
        const name = decoder.decode(new Uint8Array(packet.data, 4));

        return new PlayerInfo(client, player, name, isCPU != 0);

    case PacketIDClientDisconnected:
        return new ClientDisconnected(view.getUint8(1));

    case PacketIDScoreUpdate:
        return new ScoreUpdate(
            view.getFloat32(1, true),
            view.getFloat32(5, true),
            view.getUint8(9),
            view.getUint8(10),
            view.getUint8(11),
            view.getUint8(12),
            view.getUint8(13),
            view.getUint8(14),
            view.getUint8(15));

    case PacketIDMapInfo:
        return new MapInfo(
            view.getUint8(1),
            view.getUint8(2),
            view.getUint8(3),
            view.getUint8(4),
            view.getUint8(5),
            view.getUint8(6));
    }

    return new NullPacket(id);
}

/*
------------------Packet types-------------------
*/

//packet is not identified as supported
function NullPacket(id)
{
    console.log("Unhandled packet with ID " + id);
}
NullPacket.prototype.type = PacketIDNull;

//player name, client id and whether or not they are a bot
function PlayerInfo(clientID, playerID, name, isCPU)
{
    this.clientID = clientID;
    this.playerID = playerID;
    this.name = name;
    this.isCPU = isCPU;
}
PlayerInfo.prototype.type = PacketIDPlayerInfo;

//client disconnected message
function ClientDisconnected(clientID)
{
    this.clientID = clientID;
}
ClientDisconnected.prototype.type = PacketIDClientDisconnected;


//player score update
function ScoreUpdate(strokeDistance, distanceScore, clientID, playerID, stroke, hole, score, matchScore, skinsScore)
{
    this.strokeDistance = strokeDistance;
    this.distanceScore = distanceScore;
    this.clientID = clientID;
    this.playerID = playerID;
    this.stroke = stroke;
    this.hole = hole;
    this.score = score;
    this.matchScore = matchScore;
    this.skinsScore = skinsScore;
}
ScoreUpdate.prototype.type = PacketIDScoreUpdate;

//map/course information
function MapInfo(courseIndex, holeCount, gameMode, weatherType, nightMode, currentHole)
{
    this.courseIndex = courseIndex;
    this.holeCount = holeCount;
    this.gameMode = gameMode;
    this.weatherType = weatherType;
    this.nightMode = nightMode;
    this.currentHole = currentHole;
}
MapInfo.prototype.type = PacketIDMapInfo;