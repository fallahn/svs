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