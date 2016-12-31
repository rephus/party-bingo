$(document).ready(function(){

  var template = $('#event-template').html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, {});
  var $boardsEvents = $("#board-events");

  $boardsEvents.empty();
  for(var i=0; i < 4; i++) $boardsEvents.append(rendered);
  $(".remove-event").click(removeEvent);

  $("#add-event").click(function(){
    $boardsEvents.append(rendered);

    //Disable pervious handler and set them again
    $(".remove-event").off().click(removeEvent);
  });

  $("#create-board").click(function(){

    var events = [];
    $(".bingo-event").each(function(){
      events.push($(this).val());
    });

    if (events.length < 4) {
      alert("Need at least 4 events");
      return;
    }
    //TODO fields can't be empty
    //TODO Title cna't be empty

    sendJson({key: CREATE_BOARD,
      events: events,
      title: $("#title-board").val(),
      author: myName(),
      share: false,
      private: false
    });
  });
});

var removeEvent = function(){
  if ($(".bingo-event").length <= 4) {
    alert("Need at least 4 events");
    return;
  }

  $(this).parent('li').remove();
};
