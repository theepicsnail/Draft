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



function Slope(p1,p2){
    return (p2.y-p1.y)/(p2.x-p1.x);
}

function Center3PtCircle(p1, p2, p3){
    var mr = Slope(p1,p2);
    var mt = Slope(p2,p3);
    var x = (mr*mt*(p3.y-p1.y)+mr*(p2.x+p3.x)-mt*(p1.x+p2.x))/(2*(mr-mt))
    var y = ((p1.x+p2.x)/2-x)/mr+(p2.y+p1.y)/2
    return {'x':x, 'y':y}
}








