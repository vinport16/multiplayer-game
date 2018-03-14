var list = document.getElementById("list");
var messviewer = document.getElementById("messviewer");
var chatwith = document.getElementById("chatwith");
var newmessage = document.getElementById("textbox");
var confirm_send = document.getElementById("confirm");
var scorebox = document.getElementById("scorebox");
var info = document.getElementById("info");
var chat_shell = document.getElementById("chat_shell");

function addListItem(player){
	string = "<li><div class='namebox' onclick='showMessages(\""+player.name+"\");'>"+player.name;
	if(player.unread){
		string += "<div class='signal'>new message</div>";
	}
	if(player.action === "cooperate"){
		string += "</div><br><button class='coopselect' onclick='changeAction(\""+player.name+"\", \"cooperate\")'>cooperate</button><button class='betray' onclick='changeAction(\""+player.name+"\", \"betray\")'>betray</button><button class='ignore' onclick='changeAction(\""+player.name+"\", \"ignore\")'>ignore</button>";
	}else if(player.action == "betray"){
		string += "</div><br><button class='coop' onclick='changeAction(\""+player.name+"\", \"cooperate\")'>cooperate</button><button class='betrayselect' onclick='changeAction(\""+player.name+"\", \"betray\")'>betray</button><button class='ignore' onclick='changeAction(\""+player.name+"\", \"ignore\")'>ignore</button>";
	}else{
		string += "</div><br><button class='coop' onclick='changeAction(\""+player.name+"\", \"cooperate\")'>cooperate</button><button class='betray' onclick='changeAction(\""+player.name+"\", \"betray\")'>betray</button><button class='ignoreselect' onclick='changeAction(\""+player.name+"\", \"ignore\")'>ignore</button>";
	}
	list.innerHTML += string + "<br><div class='lastround'>"+player.lastround+"</div></li>";
}

function addGame(info){
	string = "<li><div  onclick='joinGame(\""+info.name+"\");'><div class='namebox'>"+info.name+"</div>";
	string += "rounds: "+info.rounds+"</br>";
	string += "occupancy: "+info.players+"/"+info.size+"</br>";
	if(info.open){
		string += "<font color='green'><strong>open</strong></font></br>";
	}else{
		string += "<font color='red'><strong>closed</strong></font></br>";
	}
	string += "</div><button onclick='resetGame(\""+info.name+"\");'>Reset Game</button></li>";

	list.innerHTML += string;
}

function refreshPlayers(){
	clearList();
	for(i in players){
		addListItem(players[i]);
	}
}

function clearList(){
	list.innerHTML = "";
}

function showMessage(message){
	if(message.official){
		messviewer.innerHTML += "<div class=\"messagebox\"><div class=\"info_message\">"+message.content+"</div></div>";
	}else if(message.from == playername){
		messviewer.innerHTML += "<div class=\"messagebox\"><div class=\"you\">"+message.content+"</div></div>";
	}else{
		messviewer.innerHTML += "<div class=\"messagebox\"><div class=\"them\">"+message.content+"</div></div>";
	}

	chat_shell.scrollTop = chat_shell.scrollHeight;
}

function showMessages(name){
	player = getPlayer(name);
	player.unread = false;
	refreshPlayers();
	messviewer.innerHTML = "";
	for(var i = 0; i < player.messages.length; i++){
		showMessage(player.messages[i]);
	}
	currentchat = player.name;
	chatwith.innerHTML = "Chatting with: "+currentchat;
}

function sendMessage(e){
	if(e.keyCode == 13){
		message = {};
		message.content = newmessage.value;
		message.to = currentchat;
		message.from = playername;

		newmessage.value = "";

		//send the message to the server (if the player is real)
		if(getPlayer(message.to)){
			socket.emit("message",message);
		}
	}
}

function clearEnter(e){
	if(e.keyCode == 13){
		newmessage.value = "";
	}
}

function confirmActions(){
	actions = {};
	for(i = 0; i < players.length; i++){
		actions[players[i].name] = players[i].action;
	}

	socket.emit("confirm", actions);
	confirm_send.innerHTML = "resend actions";
}

list.innerHTML = "";
messviewer.innerHTML = "";
