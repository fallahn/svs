/*
example.js PUBLIC DOMAIN

Found in the repository at https://github.com/fallahn/svs
*/


/*
Print connection info to connection box div
*/
function printOutput(str)
{
    document.getElementById("output").innerHTML = str;
}

function printSocketData(str)
{
    document.getElementById("socket_data").innerHTML = str;
}


/*
Create the connection using the info from input boxes. Note the socket
binaryType property should be set to "arraybuffer"
*/
var socket = null;

function onConnectClick()
{
    if (socket != null)
    {
        socket.close();
    }
    printSocketData("");

    var address = document.getElementById("connect_box").value;
    if (!address)
    {
        address = document.getElementById("connect_box").placeholder;
    }


    var port = document.getElementById("port_box").value;
    if (!port)
    {
        port = document.getElementById("port_box").placeholder;
    }

    socket = new WebSocket("ws://" + address + ":" + port);
    socket.binaryType = "arraybuffer";

    socket.onopen = function(evt)
    {
        printSocketData("Socket opened");
    };

    socket.onmessage = function(evt)
    {
        //decode the packet using supervideo.js
        var data = getPacketData(evt);
        
        //check the returned type so we know which packet data we received
        switch (data.type)
        {
        default:
            printOutput("Data type was " + data.type);
            break;
        case PacketIDPlayerInfo:
            playerNames[data.clientID][data.playerID] = new PlayerEntry(data.name, data.isCPU);

            refreshPlayerList();
            break;
        case PacketIDClientDisconnected:
            var names = "";

            for (var i = 0; i < MaxPlayers; ++i)
            {
                if (playerNames[data.clientID][i].name)
                {
                    names += playerNames[data.clientID][i].name + ", ";
                }

                playerNames[data.clientID][i] = new PlayerEntry("", false);
            }

            if (names)
            {
                printOutput(names + " left the game");
            }

            refreshPlayerList();
            break;
        case PacketIDScoreUpdate:
            GameScores[data.clientID][data.playerID].scores[data.hole] = data.stroke;
            refreshScoreboard();
            break;
        case PacketIDMapInfo:
            CourseName = CourseNames[data.courseIndex];
            HoleCount = data.holeCount;
            ReverseOrder = data.reverseOrder != 0;
            GameMode = RuleStrings[data.gameMode];
            Weather = WeatherType[data.weatherType];
            NightMode = data.nightMode != 0;
            CurrentHole = data.currentHole;
            refreshScoreboard();
            break;
        case PacketIDHoleInfo:
            HoleData[data.index] = data;
            CurrentHole = data.index; //hmm this is only true when switching holes, not on initial connection, where the MapInfo should take precedence
            refreshScoreboard();
            break;
        case PacketIDActivePlayer:
            CurrentPlayer = data;
            refreshScoreboard();
            break;
        }
    }

    socket.onclose = function(evt)
    {
        printSocketData("Socket closed: " + evt.code);
    }
}

function onSendClick()
{
    if (socket != null)
    {
        socket.send(document.getElementById("message_box").value);
    }
}


/*
Updates the player name list display in div_namelist_inner
*/

const MaxClients = 8;
const MaxPlayers = 8; //per client

function PlayerEntry(name, isCPU)
{
    this.name = name;
    this.isCPU = isCPU;
}

var playerNames = 
[
    [new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false),
     new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false)],

    [new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false),
     new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false)],

    [new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false),
     new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false)],

    [new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false),
     new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false)],

    [new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false),
     new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false)],

    [new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false),
     new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false)],

    [new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false),
     new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false)],

    [new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false),
     new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false), new PlayerEntry("", false)],
];

function refreshPlayerList()
{
    var outDiv = document.getElementById("div_namelist_inner");
    outDiv.innerHTML = "";

    for (var i = 0; i < MaxClients; ++i)
    {
        for (var j = 0; j < MaxPlayers; ++j)
        {
            if (playerNames[i][j].name)
            {
                var cpu = playerNames[i][j].isCPU ? "🤖" : "🧍";
                outDiv.innerHTML += "Client: " + i + ", Player: " + j + ", " + cpu + " - " + playerNames[i][j].name + "<br>";
            }
        }
    }
}


/*
Updates the scoreboard in div_scoreboard_inner
*/
var CourseName = "";
var HoleCount = 0; //0 All holes, 1 front nine, 2 back nine
var ReverseOrder = false; //if we're playing the selected holes in reverse
var GameMode = ";"
var Weather = "";
var NightMode = false;
var CurrentHole = 0;

var CurrentPlayer = new ActivePlayer(0,0,0,0,0,0);

function HoleScores()
{
    this.scores = new Array(18);
    this.scores.fill(0);
}

var GameScores = 
[
    [new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(),],
    [new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(),],
    [new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(),],
    [new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(),],
    [new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(),],
    [new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(),],
    [new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(),],
    [new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(), new HoleScores(),],
];

function refreshScoreboard()
{
    /*
    How the game is scored is usually based on which game
    mode is being played - so you would probably check that
    first to decide how to lay out the display.
    You can of course also create your own scoring rules here
    such as team play scores, or wagering on skins.
    For this example we'll only cover stroke play.
    */

    var outDiv = document.getElementById("div_scoreboard_inner");
    outDiv.innerHTML = "";

    var outString = "";


    if (GameMode == RuleStrings[0])
    {
        //total up the current scores then sort by lowest total
        var sortArray = new Array();

        for (var i = 0; i < MaxClients; ++i)
        {
            for (var j = 0; j < MaxPlayers; ++j)
            {
                if (playerNames[i][j].name)
                {

                    var item = new Object();
                    item.name = playerNames[i][j].name;
                    item.isCPU = playerNames[i][j].isCPU;
                    item.scores = new HoleScores();
                    item.total = 0;

                    for (var k = 0; k < 18; ++k)
                    {
                        item.scores.scores[k] = GameScores[i][j].scores[k];
                        item.total += item.scores.scores[k];
                    }
                    sortArray.push(item);
                }
            }
        }


        function sortFunc(a,b)
        {
            return a.total - b.total;
        }

        sortArray.sort(sortFunc);


        //grab the par for each hole
        for (var i = 0; i < 18; ++i)
        {
            outString += HoleData[i].par + " - ";
        }
        outString += "-- Par<br>";


        //and output the results to HTML
        for (var i = 0; i < sortArray.length; ++i)
        {
            for (var k = 0; k < 18; ++k)
            {
                outString += sortArray[i].scores.scores[k] + " - ";
            }

            outString += " -- Total: " + sortArray[i].total;

            if (sortArray[i].isCPU)
            {
                outString += " 🤖 ";
            }
            else
            {
                outString += " 🧍 ";
            }

            outString += sortArray[i].name;
            outString += "<br>";
        }

    }

    else
    {
        outString += GameMode + ": Example not implemented, see example.js refreshScoreboard()";
    }

    
    //CurrentHole is an index into the data array
    //so we need to correct for reverse course or
    //back nine before displaying it
    var hole = CurrentHole;
    if (ReverseOrder)
    {
        switch (HoleCount)
        {
        case 0:
            hole = 18 - hole;
            break;
        case 1:
            hole = 9 - hole;
            break;
        case 2:
            hole = 9 - hole;
            hole += 9;
            break;
        }
    }
    else
    {
        if (HoleCount == 2)
        {
            hole += 9;
        }
        hole += 1;
    }


    outString += "<br>Current Hole: " + hole + ", Current Player: " + playerNames[CurrentPlayer.clientID][CurrentPlayer.playerID].name + ", Terrain: " + TerrainStrings[CurrentPlayer.terrainID];

    var nightStr = NightMode ? " - Night" : " - Day";
    outString += "<br>" + CourseName + " - " + HoleStrings[HoleCount] + " - " + GameMode + " - Weather: " + Weather + nightStr;

    outDiv.innerHTML = outString;
}

/* list of holes which make up the course, as HoleInfo objects */
var HoleData = new Array(18);
HoleData.fill(new HoleInfo(0,0,0,0,0,0,0,1));