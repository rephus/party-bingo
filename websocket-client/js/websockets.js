var ws, connectionId;

//Keys
var LIST_PUBLIC_GAMES = "list-public-games";
var CREATE_BOARD = "create-board";
var LOAD_GAME = "load-game";
var JOIN_GAME = "join-game";
var LOAD_CHAT = "load-chat";
var MY_INFO = "my-info";
var CLICK_EVENT = "click-event";
var SEND_CHAT = "send-chat";
var LOAD_USER = "load-user";
var GET_KEY = "get-key"; 

function connect() {
   if ("WebSocket" in window) {
      append("Opening websocket!");
      ws = new WebSocket("ws://localhost:8001/");

      ws.onopen = function(){
         //ws.send("ping");
         append("Connection opened !!");
         //refresh screen
         connKey = localStorage.getItem("connKey");
        if (connKey)  sendJson({ key: LOAD_USER, connKey: connKey });
        else sendJson({ key: GET_KEY, connKey: connKey });

         switch(screen){
           case SCREEN_MENU:  sendJson({key: LIST_PUBLIC_GAMES});
           break;
         }
      };

      ws.onmessage = function (evt){
        //append("Message received: " + evt.data);
        var json = JSON.parse(evt.data);
        parseJson (json) ;
      };

      ws.onclose = function() {
         append("Connection is closed.");
         setTimeout(function(){
           append("Reconnecting websocket.");
           connect();
         }, 1000);
      };
   } else append("WebSocket NOT supported by your Browser!");

}

function append(text){
  console.log(text);
  $("#log").append(text+"\n");
}
function sendJson(json){
  json.connection = connectionId;
  //console.log("Sending",json);
  ws.send(JSON.stringify(json));
}

connect();

var parseJson = function (json) {
  switch(json.key){
    case LIST_PUBLIC_GAMES:   loadBoards(json.games);  break;
    case LOAD_GAME:   loadGame(json.board, json.gameId,json.connKey);  break;
    case LOAD_CHAT: loadChat(json.chat); break;
    case LOAD_USER: loadUser(json.name, json.avatar); break;
    case GET_KEY: saveKey(json.connKey); break;

    default: console.log("Unrecognized key "+ json.key, json);
  }
};
