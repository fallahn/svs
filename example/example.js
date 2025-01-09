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
        var data = getPacketData(evt);
        
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
            GameScores[data.clientID][data.playerID].scores[data.hole] = data.score;
            
            refreshScoreboard();
            break;
        case PacketIDMapInfo:
            CourseName = CourseNames[data.courseIndex];
            HoleCount = HoleStrings[data.holeCount];
            GameMode = RuleStrings[data.gameMode];
            Weather = WeatherType[data.weatherType];
            NightMode = data.nightMode != 0;
            CurrentHole = data.currentHole;
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
                var cpu = playerNames[i][j].isCPU ? "T" : "F";
                outDiv.innerHTML += "Client: " + i + ", Player: " + j + ", Is CPU: " + cpu + " - " + playerNames[i][j].name + "<br>";
            }
        }
    }
}


/*
Updates the scoreboard in div_scoreboard_inner
*/
var CourseName = "";
var HoleCount = ""; //0 All holes, 1 front nine, 2 back nine
var GameMode = ";"
var Weather = "";
var NighMode = false;
var CurrentHole = 0;

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
    var outDiv = document.getElementById("div_scoreboard_inner");
    outDiv.innerHTML = "";

    var outString = "";

    //TODO we need to sort these by score before setting the HTML
    for (var i = 0; i < MaxClients; ++i)
    {
        for (var j = 0; j < MaxPlayers; ++j)
        {
            if (playerNames[i][j].name)
            {
                outString += playerNames[i][j].name + " - ";
                for (var k = 0; k < 18; ++k)
                {
                    outString += GameScores[i][j].scores[k] + " ";
                }
                outString += "<br>";
            }
        }
    }

    var nightStr = NightMode ? " - Night" : " - Day";
    outString += "<br>" + CourseName + " - " + HoleCount + " - " + GameMode + " - Weather: " + Weather + nightStr;

    outDiv.innerHTML = outString;
}