console.log("Constructing toolbox")
Toolbox = (function(){
   
    // Listeners {{{ 
    var toolListeners = [];
    var modeListeners = [];
    var gridListeners = [];

    function alertListeners(listeners, message){
        listeners.forEach(function(listener){
            listener(message);
        });
    }//}}}

    function updateHelp(id){ //{{{
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
    }//}}}

    function updateModes(tool){//{{{

        var select = $("#toolModes");
        select[0].innerHTML="";
        
        modes = (tool && tool.modes) || {}
        for(var key in modes){
            $('<div class="toolMode button" id="'+key+'">'+modes[key]+'</div>')
            .appendTo($("#toolModes"));
        }
    
        if(select[0].innerHTML){
            select.height("auto");
            $(".toolMode").click(function(){
                if($(this).is('.selected')) return;
                $(this).addClass('selected').siblings().removeClass('selected');
                alertListeners(modeListeners, $(this).attr('id'));
            });
            var id = $(".toolMode:first-child").addClass('selected').attr('id');
            alertListeners(modeListeners, id)
        }else{
            select.height("0px");
        }
        
    }//}}}

    function init(){//{{{
        $('.button')
        .click(function(){
            $(this).toggleClass('selected')
            if($(this).is('.tool')){
                $(this).siblings().removeClass('selected');
        
                var id = null;
                if($(this).is('.selected')){
                    id = $(this).attr('id');
                }
                alertListeners(toolListeners, id);    
            }
            if($(this).is('.gridoption')){
                var id = $(this).attr('id')
                var value = $(this).is('.selected')
                alertListeners(gridListeners, {'id':id, 'value':value})
            }
        });
            
        $('#toolbox')
        .bind('dragstart',function( event ){
            return true
        })
        .bind('drag',function( event ){
            var canvas = $('canvas')
            var toolbox= $('#toolbox')

            event.offsetY = Math.min(Math.max(0,event.offsetY),canvas.height()-toolbox.height()-20)
            event.offsetX = Math.min(Math.max(0,event.offsetX),canvas.width()-toolbox.width()-20)

            $(this)
            .css({
                top: event.offsetY,
                left: event.offsetX
            });
        });
    }//}}}

    return {'addToolListener'   :function(l){toolListeners.push(l);}
           ,'removeToolListener':function(l){toolListeners.removeItem(l);}
           ,'addModeListener'   :function(l){modeListeners.push (l);}
           ,'removeModeListener':function(l){modeListeners.removeItem(l);}
           ,'addGridListener'   :function(l){gridListeners.push (l);}
           ,'removeGridListener':function(l){gridListeners.removeItem(l);}
           ,'updateModes'       :updateModes
           ,'init'              :init
           }
})();
console.log("Finised.")
