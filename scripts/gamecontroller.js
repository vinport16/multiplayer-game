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

function joinGame(name){
	socket.emit("joinGame", name);
	refreshPlayers();
}

function resetGame(name){
	if(confirm("This will kick all players and restart the game.")){
		socket.emit("resetGame", name);
		socket.emit("joinGame", false);
	}
}

socket.on("game", function(info){
	addGame(info);
});

socket.on("newplayer", function(player){
	addPlayer(player);
});

socket.on("clearList", function(){
	clearList();
});

socket.on("clearCookie", function(){
	setCookie("playername","",-60);
});

socket.on("message", function(msg){
	if(msg.to == playername){
		name = msg.from;
	}else{
		name = msg.to;
	}
	if(getPlayer(name)){
		getPlayer(name).messages.push(msg);
		if(name != currentchat){
			getPlayer(name).unread = true;
			refreshPlayers();
		}else{
			showMessages(currentchat);
		}
	}else if(name === "game"){ //this is for when instructions are sent before a game is joined
		messviewer.innerHTML = ""; //clear any previous messages
		showMessage(msg);
	}

});

socket.on("newscore", function(newscore){
	scorebox.innerHTML = newscore.score;
	str = "round #"+newscore.round;
	str += " / rank "+newscore.rank;
	str += " / score per opponent: "+(newscore.score/players.length);
	info.innerHTML = str;

	confirm_send.innerHTML = "confirm actions";
})

socket.emit("login", playername);

var currentchat;
