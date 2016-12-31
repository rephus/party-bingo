
var ws = require("nodejs-websocket");

//Keys
var LIST_PUBLIC_GAMES = "list-public-games";
var CREATE_BOARD = "create-board";
var LOAD_GAME = "load-game";
var LOAD_CHAT = "load-chat";
var JOIN_GAME = "join-game";
var MY_INFO = "my-info";
var CLICK_EVENT = "click-event";
var SEND_CHAT = "send-chat";

var clients = {};
var boards = {};
var games = {};

var server = ws.createServer(function (conn) {

  var connectionId = conn.key;

    console.log("New connection: " +connectionId);

     clients[connectionId] = {
       id: connectionId,
       created: new Date().getTime(),
       connection: conn
     };
    console.log("Total connections " + Object.keys(clients).length);

    conn.on("text", function (str) {
        console.log("Received from "+connectionId+ ": "+str);
        var json = JSON.parse(str);
        parseJson(conn, json);
    });

    conn.on("close", function (code, reason) {
        console.log("Connection closed ", connectionId);

        delete clients[connectionId];
        console.log("Total connections " + Object.keys(clients).length);
        //clearInterval(interval);
    });

}).listen(8001);

console.log("Websocket server started");

var sendJson = function(conn, json){
  conn.sendText(JSON.stringify(json));
};

var parseJson = function(connection, json){

  switch(json.key){
    case LIST_PUBLIC_GAMES: listPublicGames(connection); break;
    case CREATE_BOARD: createBoard(connection, json); break;
    case JOIN_GAME: joinGame(connection, json.gameId); break;
    case MY_INFO: myInfo(connection, json); break;
    case CLICK_EVENT: clickEvent(connection, json); break;
    case SEND_CHAT: sendChat(connection, json); break;

    default: console.log("Unrecognized key "+ json.key, json);
  }

};

var sendChat = function(conn, json){
    var gameId = parseInt(json.game);
    var msg = json.chat;
    var game = games[gameId];

    if (!game) {
      console.error("Invalid game " + gameId+ " in games " + Object.keys(games));
      return;
    }
    var player = clients[conn.key];
    game.chat.push({avatar: player.avatar,
      name: player.name,
      message: "<( "+ msg });

    refreshChat(gameId);

};

var clickEvent = function(conn, json) {
  var eventId = parseInt(json.event);
  var gameId = parseInt(json.game);
  console.log("Click event " + eventId + " on game " + gameId);

  var game = games[gameId];
  if (!game) {
    console.error("Invalid game " + gameId+ " in games " + Object.keys(games));
    return;
  }
  var bingo = game.players[conn.key].bingo;
  var event = bingo.events[eventId];
  event.checked = true;

  var player = clients[conn.key];
  game.chat.push({avatar: player.avatar,
    name: player.name,
    message: " checked "+ event.value  });

  refreshChat(gameId);

};

var myInfo = function(conn, json) {
  clients[conn.key].avatar = json.avatar;
  clients[conn.key].name = json.name;
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

var calculateBoard = function(events){
  if (events < 4) return "0x0";
  if ( events >= 4 && events < 6) return "2x2";
  if (events >= 6 && events < 9) return "2x3";
  if (events >= 9 && events < 12) return "3x3";
  if (events >= 12 && events < 16) return "3x4";
  if (events >= 16 && events < 20) return "4x4";
  if (events >= 20 && events < 25) return "4x5";
  else /*if (events > 25)*/ return "5x5";

};

var randomBingoFromEvents = function(events) {
  console.log("randomBingoFromEvents: "+events.length);
  randomSort(events);
  var boardSize = calculateBoard(events.length);
  //TODO rows or columns, or the other way around
  var rows = parseInt(boardSize.split("x")[0]);
  var columns = parseInt(boardSize.split("x")[1]);

  var boardEvents = [];
  for (var i =0 ; i < rows * columns; i++){
    boardEvents.push({
      value: events[i],
      checked: false
    });
  }

  var board =  {
    rows: rows ,
    colums:  columns,
    events: boardEvents
  };
  return board;
};
function randomSort(a) {
  a.sort(function() { return Math.random() - 0.5 ;});
}

var joinGame = function(conn, gameId) {
  console.log("joinGame: "+gameId);
  var game = games[gameId];

  if (game.players[conn.key]) {
    console.log("User already on game, restoring");
    sendJson(conn, {
      key: LOAD_GAME,
      board:  game.players[conn.key].bingo,
      gameId: gameId
    });
    return;
  }

  var board = games[gameId].board;

  var bingo = randomBingoFromEvents(board.events);
  game.players[conn.key] = {
    id: conn.key,
    bingo: bingo
  };
  var player = clients[conn.key];
  game.chat.push({avatar: player.avatar,
    name: player.name,
    message: " joined the game. " });
  sendJson(conn, {
    key: LOAD_GAME,
    board: bingo,
    gameId: gameId
  });

  refreshChat(gameId);
};

var refreshChat = function(gameId){
  var game = games[gameId];
  var players = Object.keys(game.players);
  for(var i=0; i < players.length; i++){
    var playerId = players[i];
    var client = clients[playerId];
    if (client && client.connection){
       sendJson(client.connection, {key:LOAD_CHAT, chat: game.chat});
    }
  }
};
var createBoard = function(conn, json){
  console.log("createBoard: "+json.title+ " with events "+ json.events.length);

   var events = json.events;
   var uuid = parseInt(Math.random() * 10000) + ""+ Object.keys(boards).length + 1;
   console.log("Creating board " + uuid);
   var board =  {
     id:uuid,
     title: json.title,
     events:events,
     author:conn.key,
     share: json.share,
     authorName: json.author
   };
   boards[uuid] = board;

  //Generate new game from board
   games[uuid] = {
     id: uuid,
     board: board,
     chat: [],
     players: {},
     private: json.private,
     sample: randomBingoFromEvents(events)
   };

   joinGame(conn, uuid);
};

var listPublicGames = function(conn){
  var gameKeys = Object.keys(games);
  var publicGames = [];
  for (var i=0; i< Math.min(5, gameKeys.length); i++){
    var game = games[gameKeys[i]];
    if (!game.private) {
      var sample = game.sample;
      sample.title = game.board.title;
      sample.id=game.id;
      publicGames.push(sample);
    }
  }

  sendJson(conn, {
    key: LIST_PUBLIC_GAMES,
    games: publicGames
  });
};
var randomBoard = function(){

  var rows = getRandomInt(2,5);
  var events = [];
  for (var i=0; i < rows; i++){
    for(var j=0; j < rows; j++){
      events.push({value: "cell "+i+"-"+j, checked: false});
    }
  }
  return {
    title: "Board " + rows+ "x"+ rows,
    rows: rows,
    colums: rows,
    events: events
  };
};
