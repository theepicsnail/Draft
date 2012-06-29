
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
    draft.tools['point'] = function (){//{{{
        this.selected=null;
        this.click = null;
        this.up=function(e){
            this.selected = null;
            if(this.click){
                var npoint = {'x':draft.x,'y':draft.y}
                draft.objects.points.push(npoint);
                draft.message = 
                {
                    'type':'push', 
                    'object':'points', 
                    'val':npoint
                };
            }
            this.click = false;
        }
        this.down=function(e){
            this.selected = select(draft);
            this.click = true;
        }
        this.move=function(e){
            this.click = false;
        }
        this.drag = function(e){
            this.click = false;
            if(this.selected!=null){
                draft.objects.points[this.selected].x=draft.x;
                draft.objects.points[this.selected].y=draft.y;
                draft.message = 
                    {
                        'type':'update', 
                        'object':'points', 
                        'id':this.selected, 
                        'val':draft.objects.points[this.selected]
                    };
            }
        }


    }//}}}
    draft.tools['line'] = function(){//{{{
        this.selected= [];
        this.move=function(e){
            var pt = select(draft);// see if we're above a point
            console.log(this.selected);
            if(pt!=null) this.selected[0] = pt;
            else this.selected=[];
        }
        this.up=function(e){
            var p = select(draft);
            if(p == null) return;
            if(this.selected.length==0)
            {
                this.selected.push(p);
                return;
            }
            if(this.selected[0]==p){
                this.selected.length = 0;
                return;
            }

            var nline = {'p1':this.selected[0], 'p2':p}
            draft.objects.lines.push(nline);
            draft.message = {
                'type':'push',
                'object':'lines',
                'val':nline
            }
            this.selected[0]=p;
        }       
    }//}}}
    draft.activeTool = Tool('point');
}


