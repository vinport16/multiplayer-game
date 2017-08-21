var express = require('express');
var sio = require('socket.io');
var app = express();
var http = require('http').createServer(app);
var io = sio(http);
var port = process.env.PORT || 3030; //runs on heroku or localhost:3300

function sendMessage(message, player){
	if(player.socket.connected){
		player.socket.emit("message", message);
	}
}

function getPlayer(name, game){
	players = game.players;
	for(i = 0; i < players.length; i++){
		if(players[i].name == name){
			return players[i];
		}
	}
	return false;
}

function addPlayer(player, game){
	players = game.players;
	for(i = 0; i < players.length; i++){
		if(players[i].socket.connected){
			console.log("sending player("+player.name+") to "+players[i].name);
			players[i].socket.emit("newplayer", player.name);

			console.log("sending player("+players[i].name+") to "+player.name);
			player.socket.emit("newplayer", players[i].name);
		}
	}
	console.log("added "+player.name);
	game.players.push(player);

	if(game.players.length >= game.size){
		game.open = false;
		console.log("GAME ("+game.name+") CLOSED")
	}
}

function sendInfo(player, game){
	// send players
	players = game.players;
	for(i = 0; i < players.length; i++){
		if(players[i].name != player.name){
			if(players[i].socket.connected){
				console.log("sending player("+players[i].name+") to "+player.name);
				player.socket.emit("newplayer", players[i].name);
			}
		}
	}
	// send messages
	messages = game.messages;
	for(i = 0; i < messages.length; i++){
		mess = messages[i];
		if(mess.to === player.name || mess.from === player.name){
			sendMessage(mess, player);
		}
	}


}

function determineRanks(players){

	players.sort(function(a,b){return b.score-a.score;});

	lastrank = 1;
	for(i = 0; i < players.length; i++){
		if(i > 0 && players[i].score == players[i-1].score){
			//tied for lastrank
			players[i].rank = "#"+lastrank+" (tie)";
		}else{
			if(i+1 < players.length && players[i+1].score == players[i].score){
				//tied for i+1=
				players[i].rank = "#"+(i+1)+" (tie)";
				lastrank = i+1;
				
			}else{
				// = i+1
				players[i].rank = "#"+(i+1);
				lastrank = i+1;
			}
		}
	}
}

function sendScoreInfo(player, game){
	newscore = {score:player.score,
				rank:player.rank,
				round:game.currentround};
	if(player.socket.connected){
		player.socket.emit("newscore", newscore);
	}
}

var help_message = "Scoring:<br>you - opponent : points to you<br>c - c : 2<br>c - b : -1<br>c - i : 1<br>b - c : 3<br>b - b : -2<br>b - i : 0<br>i - c : 0<br>i - b : 0<br>i - i : 0";

function doGame(game){
	everyone_confirmed = !game.open;
	for(i = 0; i < game.players.length; i++){
		everyone_confirmed = everyone_confirmed && game.players[i].confirmed;
	}
	if(everyone_confirmed){
		console.log("gameplay commencing: round "+game.currentround);
		// player - opponent : points to player
		// c - c : 2
		// c - b : -1
		// c - i : 1
		// b - c : 3
		// b - b : -2
		// b - i : 0
		// i - c : 0
		// i - b : 0
		// i - i : 0

		players = game.players;
		for(i = 0; i < players.length; i++){
			for(a = 0; a < players.length; a++){
				if(i!=a){

					p1 = players[i]
					p2 = players[a]

					message = {to:p2.name, from:p1.name, content:(p1.name+": "+p1.actions[p2.name]), official:true};
					game.messages.push(message);

					sendMessage(message, p1);
					sendMessage(message, p2);

					c1 = p1.actions[p2.name] == "cooperate";
					c2 = p2.actions[p1.name] == "cooperate";
					b1 = p1.actions[p2.name] == "betray";
					b2 = p2.actions[p1.name] == "betray";
					i1 = !(c1 || b1);
					i2 = !(c2 || b2);

					if(c1 && c2){
						p1.score += 2;
					}else if(c1 && b2){
						p1.score -= 1;
					}else if(c1 && i2){
						p1.score += 1;
					}else if(b1 && c2){
						p1.score += 3;
					}else if(b1 && b2){
						p1.score -= 2;
					}else if(b1 && i2){
						// nothing
					}
				}
			}
		}

		game.currentround += 1;

		determineRanks(game.players);

		for(i = 0; i < players.length; i++){
			players[i].confirmed = false;
			sendScoreInfo(players[i], game);
		}

		console.log(game.currentround+" > "+game.maxrounds+" = "+(game.currentround > game.maxrounds));
		if(game.currentround > game.maxrounds){

			end_message = "The final scores are:<br>";

			players.sort(function(a,b){return b.score-a.score;});

			for(i = 0; i < players.length; i++){
				end_message += players[i].name+": "+players[i].score+"<br>";
			}
			end_message += "Reload this page to play again.";

			for(i = 0; i < players.length; i++){
				for(j = 0; j < players.length; j++){
					if(i != j){
						message = {to:players[j].name, from:players[i].name, content:end_message, official:true};
						game.messages.push(message);
						sendMessage(message, players[i]);
						console.log("sending end message to "+players[i].name);
					}
				}
			}

			game = {name:"1st Game",
					size:4,
					players:[],
					currentround:1,
					maxrounds:5,
					messages:[],
					open:true};

		}


	}
	return game;
}

http.listen(port);

// make sure people can get the client side code

app.get('/socket.io/socket.io.js', function(req, res){
	res.sendFile(__dirname + '/node_modules/socket.io/socket.io.js');
});

app.get('/scripts/preload.js', function(req, res){
	res.sendFile(__dirname + '/scripts/preload.js');
});

app.get('/scripts/gamecontroller.js', function(req, res){
	res.sendFile(__dirname + '/scripts/gamecontroller.js');
});

app.get('/scripts/pagecontroller.js', function(req, res){
	res.sendFile(__dirname + '/scripts/pagecontroller.js');
});

app.get('/style.css', function(req, res){
	res.sendFile(__dirname + '/style.css');
});

app.get('/game', function(req, res){
	res.sendFile(__dirname + '/game.html');
});

// actual game stuff
/*

game object:
 - name string
 - size int
 - players array
 - currentround int
 - maxrounds int
 - messages array
 - open boolean

player object:
 - name string
 - score int
 - actions object
 - confirmed boolean
 - socket socket
 - rank

message object:
 - to string
 - from string
 - content string
 - official boolean

 */

var games = [];  // let's make a new game

game = {name:"1st Game",
		size:4,
		players:[],
		currentround:1,
		maxrounds:5,
		messages:[],
		open:true};

games.push(game);

// when people connect, add them to the game

app.get('/', function(req, res){
	res.sendFile(__dirname + '/game.html');
});

io.on("connection", function(socket){
	var player = false;
	var game = games[0];
	socket.on("login", function(username){
		if(username != null){
			if(getPlayer(username, game) && getPlayer(username, game).socket.connected){
				//they're already logged in
			}else if(getPlayer(username, game)){
				player = getPlayer(username, game);
				player.socket = socket;
				console.log(player.name+" changed sockets");

				sendInfo(player, game);
			} else if(game.open){
				player = {};
				player.name = username;
				player.score = 0;
				player.actions = {};
				player.confirmed = false;
				player.socket = socket;
				player.rank = 0;
				
				addPlayer(player, game);
			}else{
				//game is not open
			}
		}

	});

	socket.on("confirm", function(actions){
		if(player){
			player.actions = actions;
			player.confirmed = true;

			game = doGame(game);
			games[0] = game;
		}
	});

	socket.on("sendScore",function(toName){
		text  = player.name;
		text += "<br>score: "+player.score;
		text += "<br>rank: "+player.rank;
		message = {to:toName, from:player.name, content:text, official:true};
		game.messages.push(message);

		sendMessage(message, getPlayer(message.to, game));
		sendMessage(message, getPlayer(message.from, game));
	});

	socket.on("message", function(msg){
		newmessage = {};
		newmessage.to = msg.to;
		newmessage.from = player.name;
		newmessage.content = msg.content;
		newmessage.official = false;

		if(msg.content == "help"){
			message = {};
			message.to = player.name;
			message.from = msg.to;
			message.content = help_message;
			message.official = true;
			sendMessage(message, player);
		}else if(getPlayer(player.name, game)){  // make sure they're in the game before sending anything
			game.messages.push(newmessage);

			sendMessage(newmessage, getPlayer(newmessage.to, game));
			sendMessage(newmessage, getPlayer(newmessage.from, game));
		}
	});

	socket.on("disconnect", function(){
		console.log(player.name+" logged off");
	})
});









