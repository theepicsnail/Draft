//Global stuff, put in another file?
function setXY(e){
    if (e.targetTouches){
        draft.x = e.targetTouches[0].pageX;
        draft.y = e.targetTouches[0].pageY;
    } else {
        draft.x = e.pageX;
        draft.y = e.pageY;
   }
}

function dist(p1, p2){
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    return Math.sqrt(dx*dx+dy*dy);
}


function selected(type, idx){
    var rt = false;
    try{
        var selection = draft.activeTool.selected[type];
        if(typeof(selection)=='number') 
            rt = (selection==idx)
        else
            rt = selection.indexOf(idx)!=-1;
    }catch(err){}
    return rt;
}


