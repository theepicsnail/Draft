
function Tool(type){
    return new draft.tools[type]();
}

function select(loc){//{{{
    //select the point at loc
    var selected = null;
    draft.objects.points.forEach(function(p,idx){
        if(selected != null) return; //once we found a point, ignore the rest.
                                     //I don't know how to exit a forEach :(
        if(dist(p,loc)<5)
            selected = idx;
    });
    return selected;
}//}}}

function setupTools(){

    function createPoint(){
        var npoint = {'x':draft.x,'y':draft.y}
        draft.objects.points.push(npoint);
        draft.sendMessage( 
        {
            'type':'push', 
            'object':'points', 
            'val':npoint
        });
        var i = select(draft);
        return i;
    }


    draft.tools['point'] = function (){//{{{
        this.selected={"points":[null]};
        this.click = null;
        this.up=function(e){
            this.selected.points[0] = null;
            return true;
        }
        this.down=function(e){
            if(this.selected.points[0] == null)
                this.selected.points[0]=createPoint();
            return true;
        }
        this.move=function(e){
            this.selected.points[0] = select(draft);
            return true;
        }
        this.drag = function(e){
            if(this.selected.points[0]!=null){
                draft.objects.points[this.selected.points[0]].x=draft.x;
                draft.objects.points[this.selected.points[0]].y=draft.y;
                draft.message = 
                    {
                        'type':'update', 
                        'object':'points', 
                        'id':this.selected.points[0], 
                        'val':draft.objects.points[this.selected.points[0]]
                    };
            }
            return true;
        }
    }//}}}

    draft.tools['line'] = function(){//{{{
        this.selected={"points":[null,null]};
        this.move=function(e){
            this.selected.points[0] = select(draft);// see if we're above a point
            return true;
        }
        this.down=function(e){
            if(this.selected.points[0] == null)
                this.selected.points[0] = createPoint();
            return true;
        }
        this.up=function(e){
            var p = this.selected.points[1];
            this.dragTarget = null;
            if(p == null){
               p = createPoint(); 
            }
            if(this.selected.points[0]==p){
                this.selected.points=[null,null]
                return;
            }

            var nline = {'p1':this.selected.points[0], 'p2':p}
            draft.objects.lines.push(nline);
            draft.sendMessage({
                'type':'push',
                'object':'lines',
                'val':nline
            })
            this.selected.points=[null,null];

            return true;
        }       
        this.drag = function(e){
            var p = select(draft);
            this.selected.points[1]=p;
            return true; 
        }
        this.draw = function(ctx){
            if(this.selected.points[0]==null) return false;
            if(this.dragTarget==null)return false;
            var p1 = draft.objects.points[this.selected.points[0]]
            var p2 = draft;
            with(ctx){
                moveTo(p1.x,p1.y);
                lineTo(p2.x,p2.y);
                stroke();
            }
            return true;
        }
    }//}}}
    draft.activeTool = Tool('point');
}


