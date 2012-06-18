
function updateHelp(id){
    var helpMsg = "";
    if(id == null)
    {
        helpMsg = "Select a tool!";
    }
    else
    {
        helpMsg = "This would display the '"+id+"' tools help message.";
    }
    $("#helpMsg")[0].innerHTML=helpMsg;
}

function updateModes(id){
    function addMode(opt,name){
        $('<div class="toolMode button" name="'+opt+'" id="'+opt+'">'+name+'</div>')
        .appendTo($("#toolModes"));
    }
    var select = $("#toolModes");
    select[0].innerHTML="";
    switch(id){
        case "circle":
            addMode("2pt","Radius then circumference");
            addMode("3pt","3 points on the circumference");
        break;
        case "draw":
            addMode("free","Use a pen");
            addMode("text","Write text");
        break;
    }

    if(select[0].innerHTML){
        select.height("auto");
        $(".toolMode").click(function(){
            $(this).addClass('selected').siblings().removeClass('selected');
        });
        $(".toolMode:first-child").addClass('selected');
    }else{
        select.height("0px");
    }
    
}

function init(){
    $('.button').click(function(){
        $(this).toggleClass('selected')

        if($(this).is('.tool')){
            $(this).siblings().removeClass('selected');
    
            var id = null;
            if($(this).is('.selected')){
                id = $(this).attr('id');
            }
            updateHelp(id);
            updateModes(id);
        }
        
    });

    function setupDragging(){
        $('#toolbox')
             .bind('dragstart',function( event ){
                return true
                return $(event.target).is('.handle');
                })
            .bind('drag',function( event ){
                $( this ).css({
                        top: event.offsetY,
                        left: event.offsetX
                        });
                });
    }

    updateHelp(null);
    updateModes(null);
    draft.init();
    setupDragging();
}
