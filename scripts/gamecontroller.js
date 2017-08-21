/*

player object has:
 - name string
 - messages array
 - action string (cooperate/betray/ignore)
 - unread boolean (if there are unread messages)
 - lastround string (describes what you/they did last round)

message object has:
 - to string
 - from string
 - content string
 - official boolean

*/
var socket = io();

//var playername = "Vincent";
var players = [];

function addPlayer(name){
	player = 
	{name:name,
	messages:[],
	action:"ignore",
	unread:false,
	lastround:"first round"};

	players.push(player);
	addListItem(player);

	if(players.length == 1){
		currentchat = player.name;
		showMessages(currentchat);
	}
}

function getPlayer(name){
	for(var i = 0; i < players.length; i++){
		if(players[i].name == name){
			return players[i];
		}
	}
	return false;
}

function changeAction(name, action){
	getPlayer(name).action = action;
	refreshPlayers();
}

function sendScore(){
	socket.emit("sendScore",currentchat);
}

socket.on("newplayer", function(player){
	addPlayer(player);
});

socket.on("message", function(msg){
	if(msg.to == playername){
		name = msg.from;
	}else{
		name = msg.to;
	}
	getPlayer(name).messages.push(msg);
	if(name != currentchat){
		getPlayer(name).unread = true;
		refreshPlayers();
	}else{
		showMessages(currentchat);
	}
});

socket.on("newscore", function(newscore){
	scorebox.innerHTML = newscore.score;
	str = "round #"+newscore.round;
	str += " / rank "+newscore.rank;
	str += " / score per opponent: "+(newscore.score/players.length);
	info.innerHTML = str;

	confirm.innerHTML = "confirm actions";
})

socket.emit("login", playername);

var currentchat;