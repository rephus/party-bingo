var SCREEN_MENU = 1;
var SCREEN_CREATE = 2;
var SCREEN_GAME = 3;
var screen = SCREEN_MENU;
var gameId ; 
var connKey; 

$(document).ready(function () {

  $("#go-create-board").click(function () {
    changeScreen(SCREEN_CREATE);
  });

  $(".go-menu").click(function () {
    sendJson({ key: LIST_PUBLIC_GAMES });
    changeScreen(SCREEN_MENU);
  });

  //TODO do not update info on every character
  $(".my-alias").keyup(function () {
    updateMyInfo();
  });
  changeScreen(SCREEN_MENU);
});

var changeScreen = function (screenId) {
  //hide previous screen
  $(".screen").hide();
  //show new screen
  $(".screen-" + screenId).show();
  screen = screenId;
};

var myName = function () {
  return $(".my-alias").val();
};

function loadUser(name, avatar){
      $(".my-alias").val(name);
    $(".my-avatar").val(avatar);

}
var updateMyInfo = function () {
  var myInfo = {
    key: MY_INFO,
    name: $(".my-alias").val(),
    avatar: $(".my-avatar").val()
  };
  //console.log("Saving user ", myInfo);
  sendJson(myInfo);
};

var drawBoard = function (board) {
  var rowSize = 6;
  switch (board.rows) {
    case 2: rowSize = 6; break;
    case 3: rowSize = 4; break;
    case 4: rowSize = 3; break;
    case 5: rowSize = 2; break;
  }
  board.rowSize = rowSize;
  for (var i = 0; i < board.events.length; i++) {
    board.events[i].i = i;
  }
  var template = $('#board-template').html();
  Mustache.parse(template);
  return Mustache.render(template, board);
};

function clickEvent() {
  var i = $(this).attr('event');
  sendJson({ key: CLICK_EVENT, event: i, game: gameId });

  //TODO mark as clicked
  if ($(this).hasClass('checked-true')) {
    $(this).removeClass('checked-true');
    $(this).addClass('checked-false');

  } else {
    $(this).removeClass('checked-false');
    $(this).addClass('checked-true');
  }
}
function saveKey(_connKey) {
  connKey = _connKey;
  if (!localStorage.getItem("connKey") ){
    console.log("Saving new connKey "+ connKey);
    localStorage.setItem("connKey", connKey);
  }  
}
var loadGame = function (board, _gameId, connKey) {
    gameId = _gameId; 
  console.log("Loading connKey " , connKey);

  console.log("Loading gameID " , gameId);
  console.log("Loading board " ,board);
  var draw = drawBoard(board);
  //console.log("draw board ", draw);
  $(".my-board").html(draw);
  changeScreen(SCREEN_GAME);

  $(".event").click(clickEvent);

  $("#send-text").off().click(function () {
    sendJson({
      key: SEND_CHAT, chat: $("#chat-text").val(),
      game: gameId
    });

  });
};

var loadBoards = function (boards) {
  $("#list-boards-div").empty();
  for (var i = 0; i < boards.length; i++) {
    var board = drawBoard(boards[i]);
    $("#list-boards-div").append(board);
  }

  $(".board").click(function () {
    var gameId = $(this).attr('game-id');
    var gameTitle = $(this).attr('game-title');
    if (gameId) {
      console.log("Joining boardID " + gameId + ": " + gameTitle);
      sendJson({ key: JOIN_GAME, gameId: gameId });

    }
  });
};

var loadChat = function (chat) {
  var template = $('#chat-template').html();
  Mustache.parse(template);
  var html = Mustache.render(template, chat);
  $("#chat").html(html);
};
