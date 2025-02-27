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

    resetDisplay();

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

    //main packet handling
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
            //all the players on this client will have been removed
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
            refreshScoreboard();
            break;

        case PacketIDScoreUpdate:
            //this example only tracks stroke play - data also contains fields
            //for skins/match play etc. See the readme or supervideo.js
            //for more information about the score data available.
            gameScores[data.clientID][data.playerID].scores[data.hole] = data.stroke;
            refreshScoreboard();
            break;

        case PacketIDMapInfo:
            courseName = CourseNames[data.courseIndex];
            holeCount = data.holeCount;
            reverseOrder = data.reverseOrder != 0;
            gameMode = RuleStrings[data.gameMode];
            weather = WeatherType[data.weatherType];
            nightMode = data.nightMode != 0;
            currentHole = data.currentHole;
            refreshScoreboard();
            break;

        case PacketIDHoleInfo:
            holeData[data.index] = data;
            currentHole = data.index;
            refreshScoreboard();
            redrawCanvas();
            break;

        case PacketIDActivePlayer:
            currentPlayer = data;
            refreshScoreboard();
            break;

        case PacketIDPlayerPosition:
            playerPositions[data.clientID][data.playerID] = data.position;
            redrawCanvas();
            break;

        case PacketIDRichPresence:
            document.getElementById("rich_presence").innerHTML = data.string;
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
Clears any output in the HTML file
*/
function resetDisplay()
{
    for (var i = 0; i < MaxClients; ++i)
    {
        for (var j = 0; j < MaxPlayers; ++j)
        {
            playerNames[i][j] = new PlayerEntry("", false);
            gameScores[i][j] = new HoleScores();
            playerPositions[i][j] = [0,0,0];
        }
    }


    courseName = "";
    holeCount = 0;
    reverseOrder = false;
    gameMode = "";
    weather = "";
    nightMode = false;
    currentHole = 0;

    currentPlayer = new ActivePlayer(0,0,0,0,0,1);
    holeData.fill(new HoleInfo(0,0,0,0,0,0,0,0));

    document.getElementById("rich_presence").innerHTML = "";
    document.getElementById("div_namelist_inner").innerHTML = "";
    document.getElementById("div_scoreboard_inner").innerHTML = "";

    var ctx = document.getElementById("game_canvas").getContext("2d");
    ctx.clearRect(0, 0, MapSize[0], MapSize[1]);
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
var courseName = "";
var holeCount = 0; //0 All holes, 1 front nine, 2 back nine
var reverseOrder = false; //if we're playing the selected holes in reverse
var gameMode = ";"
var weather = "";
var nightMode = false;
var currentHole = 0;

var currentPlayer = new ActivePlayer(0,0,0,0,0,1);

function HoleScores()
{
    this.scores = new Array(18);
    this.scores.fill(0);
}

var gameScores = 
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


    if (gameMode == RuleStrings[0])
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
                        item.scores.scores[k] = gameScores[i][j].scores[k];
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
            outString += holeData[i].par + " - ";
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

            //use emojis to signal if player is a bot or not
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
        outString += gameMode + ": Example not implemented, see example.js refreshScoreboard()";
    }

    
    //currentHole is an index into the data array
    //so we need to correct for reverse course or
    //back nine before displaying it
    var hole = currentHole;
    if (reverseOrder)
    {
        switch (holeCount)
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
        if (holeCount == 2)
        {
            hole += 9;
        }
        hole += 1;
    }


    outString += "<br>Current Hole: " + hole + ", Current Player: " + playerNames[currentPlayer.clientID][currentPlayer.playerID].name + ", Terrain: " + TerrainStrings[currentPlayer.terrainID];

    var nightStr = nightMode ? " - Night" : " - Day";
    outString += "<br>" + courseName + " - " + HoleStrings[holeCount] + " - " + gameMode + " - weather: " + weather + nightStr;

    outDiv.innerHTML = outString;
}



/*
list of holes which make up the course, as HoleInfo objects 
This is where we store all the par values and pin/tee positions
*/
var holeData = new Array(18);
holeData.fill(new HoleInfo(0,0,0,0,0,0,0,0));


/*
This redraws the canvas when a player position update is received.
For brevity this is done on each update, however for smooth animation
you would want to use the timestamp in the position updates to remove
out of order packets and interpolate positions of buffered events,
using requestAnimationFrame to update at a smooth framerate.

Position updates are broadcast at ~20fps, but there are no gaurantees
on arrival time over a web socket.
*/
var playerPositions = 
[
    [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
    [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
    [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
    [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
    [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
    [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
    [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
    [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
];


const BallSize = [2, 2];
const TeeSize = [3, 3];
const FlagSize = [1, 6];

function redrawCanvas()
{
    var ctx = document.getElementById("game_canvas").getContext("2d");
    ctx.font = "16px serif";
  
    //background
    ctx.clearRect(0, 0, MapSize[0], MapSize[1]);
    ctx.fillStyle = "rgb(0 200 0)";
    ctx.fillRect(0, 0, MapSize[0], MapSize[1]);

    //when mapping world coords to the canvas X==X and Y==-Z (negative Z)
    //the canvas is also flipped vertically relative to the game world

    //tee pos
    var x = holeData[currentHole].teePosition[0];
    var y = MapSize[1] + holeData[currentHole].teePosition[2];
    ctx.fillStyle = "rgb(200 0 0)";
    ctx.fillRect(x - TeeSize[0], y - TeeSize[1], TeeSize[0] * 2, TeeSize[1] * 2);
    ctx.fillStyle = "rgb(0 0 0)";
    ctx.fillText("T", x + 4, y + 16);


    //pin pos
    x = holeData[currentHole].pinPosition[0];
    y = MapSize[1] + holeData[currentHole].pinPosition[2];
    ctx.fillStyle = "rgb(255 255 255)";
    ctx.fillRect(x - FlagSize[0], y - FlagSize[1], FlagSize[0] * 2, FlagSize[1] * 2);

    ctx.fillStyle = "rgb(0 0 0)";
    ctx.fillText("P", x + 4, y + 16);


    //each player's ball pos
    for (var i = 0; i < MaxClients; ++i)
    {
        for (var j = 0; j < MaxPlayers; ++j)
        {
            if (playerNames[i][j].name)
            {
                x = playerPositions[i][j][0];
                y = MapSize[1] + playerPositions[i][j][2];

                ctx.fillStyle = "rgb(255 240 120)";
                ctx.fillRect(x - BallSize[0], y - BallSize[1], BallSize[0] * 2, BallSize[1] * 2);

                ctx.fillStyle = "rgb(0 0 0)";
                ctx.fillText(playerNames[i][j].name, x + 4, y + 16);
            }
        }
    }
}