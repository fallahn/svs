/*
supervideo.js Public Domain

Super Video Golf is an arcade style golf game available on [itch.io](https://fallahn.itch.io/super-video-golf)
and [Steam](https://store.steampowered.com/app/2173760/Super_Video_Golf/).
It provides a websocket server to which clients can connect and receive realtime updates.
More info about how this works and what can be done with it is available in the readme.md
file provided in the repository at https://github.com/fallahn/svs.

*/


//const values - these are here so they can be accessed via the relevant IDs
//received in the data packets from Super Video Golf.

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

const TerrainStrings = 
[
    "Rough",
    "Fairway",
    "Green",
    "Bunker",
    "Water",
    "Scrub",
    "Stone",
    "Hole"
];

const TeamColours = 
[
    rgb(255,0,0),
    rgb(0,255,0),
    rgb(0,0,255),
    rgb(255,255,0),
    rgb(255,127,0),
    rgb(127,0,255),
    rgb(0,0,0),
    rgb(255,255,255)
];

//map units are metres
const MapSize = [560, 320];

//packet IDs are used to identify what has been collected from the incoming socket
//Don't change these! They're set by the game server.
const PacketIDNull               = -1;
const PacketIDPlayerInfo         = 50;
const PacketIDClientDisconnected = 2;
const PacketIDScoreUpdate        = 12;
const PacketIDMapInfo            = 63;
const PacketIDHoleInfo           = 10;
const PacketIDActivePlayer       = 9;
const PacketIDPlayerPosition     = 22;
const PacketIDTeamModeToggle     = 91;
const PacketIDTeamData           = 92;
const PacketIDDisplayList        = 93;
const PacketIDRuleMod            = 94;
const PacketIDSnekUpdate         = 95;
const PacketIDBigBallUpdate      = 96;
const PacketIDRichPresence       = 127;


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
            view.getUint8(6),
            view.getUint8(7));

    case PacketIDHoleInfo:
        return new HoleInfo(
            view.getUint8(1),
            view.getUint8(2),
            view.getFloat32(5, true),
            view.getFloat32(9, true),
            view.getFloat32(13, true),
            view.getFloat32(17, true),
            view.getFloat32(21, true),
            view.getFloat32(25, true));

    case PacketIDActivePlayer:
        return new ActivePlayer(
            view.getUint8(13),
            view.getUint8(14),            
            view.getFloat32(1, true),
            view.getFloat32(5, true),
            view.getFloat32(9, true),
            view.getUint8(15));

    case PacketIDPlayerPosition:
        return new ActorUpdate(
            view.getUint8(13),
            view.getUint8(14),            
            view.getFloat32(1, true),
            view.getFloat32(5, true),
            view.getFloat32(9, true),
            view.getUint8(15),
            view.getInt32(17, true));

    case PacketIDTeamModeToggle:
        return view.getInt32(1, true);

    case PacketIDTeamData:
        return new TeamData(
            view.getUint16(5, true),
            view.getUint16(7, true),
            view.getInt32(1, true));

    case PacketIDDisplayList:
        const size = view.getInt32(1, true);
        var list = new DisplayList(size);
        
        //hmm how does js assert things?
        //size MUST be <= 16
        for(var i = 0; i < size; ++i)
        {
            const client = view.getUint8(5 + (i*2));
            const player = view.getUint8(5 + ((i*2) + 1));
            list.list.push(new TeamMember(client, player));
        }
        return list;

    case PacketIDRuleMod:
        return new RuleMod(
            view.getUint8(1),
            view.getUint8(2));

    case PacketIDSnekUpdate:
        return new SnekUpdate(
            view.getUint8(1),
            view.getUint8(2));

    case PacketIDBigBallUpdate:
        return new BigBallUpdate(
            view.getUint8(1),
            view.getUint8(2),
            view.getUint16(3, true));

    case PacketIDRichPresence:
        var decoder = new TextDecoder();
        const str = decoder.decode(new Uint8Array(packet.data, 1));
        return new RichPresence(str);
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
function MapInfo(courseIndex, holeCount, reverseOrder, gameMode, weatherType, nightMode, currentHole)
{
    this.courseIndex = courseIndex;
    this.holeCount = holeCount;
    this.reverseOrder = reverseOrder;
    this.gameMode = gameMode;
    this.weatherType = weatherType;
    this.nightMode = nightMode;
    this.currentHole = currentHole;
}
MapInfo.prototype.type = PacketIDMapInfo;


//information about a hole on the course
//coords are OpenGL, Y-up
function HoleInfo(holeIndex, par, teeX, teeY, teeZ, pinX, pinY, pinZ)
{
    this.index = holeIndex;
    this.par = par;
    this.teePosition = [teeX, teeY, teeZ];
    this.pinPosition = [pinX, pinY, pinZ];
}
HoleInfo.prototype.type = PacketIDHoleInfo;


//currently active player
function ActivePlayer(clientID, playerID, posX, posY, posZ, terrainID)
{
    this.position = [posX, posY, posZ];
    this.clientID = clientID;
    this.playerID = playerID;
    this.terrainID = terrainID;
}
ActivePlayer.prototype.type = PacketIDActivePlayer;

//actor update, in this case ball position
function ActorUpdate(clientID, playerID, posX, posY, posZ, terrainID, timestamp)
{
    this.clientID = clientID;
    this.playerID = playerID;
    this.position = [posX, posY, posZ];
    this.terrainID = terrainID;
    this.timestamp = timestamp;
}
ActorUpdate.prototype.type = PacketIDPlayerPosition;


//-----since version 1.21------//

//team member mapping
function TeamData(clientID, playerID, teamIndex)
{
    this.clientID = clientID;
    this.playerID = playerID;
    this.teamIndex = teamIndex;
}
TeamData.prototype.type = PacketIDTeamData;

function TeamMember(clientID, playerID)
{
    this.clientID = clientID;
    this.playerID = playerID;
}

function DisplayList(size)
{
    this.size = size;
    this.list = [];
}
DisplayLisy.prototype.type = PacketIDDisplayList;

//rule modifier has been toggled.
function RuleMod(rule, status)
{
    this.rule = rule; //0 for Snek, 1 for BigBall
    this.status = status; //0 for disable, 1 for enable
}
RuleMod.prototype.type = PacketIDRuleMod;

//snek update - this player was handed the snek
function SnekUpdate(clientID, playerID)
{
    this.clientID = clientID;
    this.playerID = playerID;
}
SnekUpdate.prototype.type = PacketIDSnekUpdate;

function BigBallUpdate(clientID, playerID, scale)
{
    this.clientID = clientID;
    this.playerID = playerID;

    //scale arrives as a value 0-11 but the result
    //is actually rescaled to -5 through 0 and
    //doubled for positive values 0 - 15

    //this is then multiplied by 0.1 for a final
    //scale value which should be *added* to the
    //current scale of the ball, bringing the total
    //range to 0.5 - 3.0

    this.scale = scale - 6;
    this.scale *= (1 + ((scale < 1  ? 0 : 1) * 2));
    this.scale *= 0.1;
}
BigBallUpdate.prototype.type = PacketIDBigBallUpdate;


function RichPresence(string)
{
    this.string = string;
}
RichPresence.prototype.type = PacketIDRichPresence;