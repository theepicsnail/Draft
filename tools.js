
function Tool(type){
    if(type in draft.tools)
        return new draft.tools[type]();
    return null;
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
            var p1 = draft.objects.points[this.selected.points[0]]
            var p2 = this.selected.points[1];
            
            with(ctx){
            if(p2==null){
                p2=draft; 
                strokeStyle = "rgb(255,255,255)";
            }else{
                p2=draft.objects.points[p2]
                strokeStyle = "rgb(64,128,64)";
            }
                lineWidth=3; 
                beginPath();
                moveTo(p1.x,p1.y);
                lineTo(p2.x,p2.y);
                stroke();
            }
        }
    }//}}}

    draft.tools['circle'] = function(){//{{{
        this.selected={"points":[null]};//[0] will be the point under the mouse, [1...] will be the actually selected points.
        this.modes={
            '2':'Center + Point on the circumference.',
            '3':'3 Points on the circumference.'
        }
        this.mode = null;
        this.setMode=function(newMode){
            this.mode = newMode;
            this.selected.points=[null];
        }
        this.move=function(e){
            var start = this.selected.points[0]
            this.selected.points[0] = select(draft);
            return true;
//            return start != this.selected.points[0];
        }
        this.down=function(e){
            var mousePoint = this.selected.points[0]

            if(mousePoint){
                var selPos = this.selected.points.indexOf(mousePoint,1)
                if(selPos == -1){
                    this.selected.points.push(mousePoint)
                }else{
                    this.selected.points.splice(selPos,1)
                }
            }else{
                this.selected.points.push(createPoint());
            }
            if(this.selected.points.length-1==this.mode)
                this.finish()
            return true;
        }
        this.draw=function(ctx){
            if(this.selected.points.length!=this.mode)
                return
            var center,r;
            switch(this.mode){
                case '2':
                    center = draft.objects.points[this.selected.points[1]];
                    var p2 = draft;
                    if(this.selected.points[0])
                        p2 = draft.objects.points[this.selected.points[0]]
                    r = dist(center,p2);
                break;

                case '3':
                    var p3 = draft;
                    if(this.selected.points[0])
                        p3 = draft.objects.points[this.selected.points[0]];
                    var p1 = draft.objects.points[this.selected.points[1]];
                    var p2 = draft.objects.points[this.selected.points[2]];
                    center = Center3PtCircle(p1,p2,p3);
                    r = dist(p1,center)
                break;
            }
            with(ctx){
                if(this.selected.points[0]==null)
                    strokeStyle = "rgb(255,255,255)";
                else
                    strokeStyle = "rgb(64,128,64)";
                lineWidth=3; 
                beginPath();
                ctx.arc(center.x,center.y,r,0,Math.PI*2,true);
                ctx.closePath()
                ctx.stroke()
            }

        } 
        this.finish=function(){
            console.log("finish");
            this.selected.points = [null];
        }
    }//}}}
}


