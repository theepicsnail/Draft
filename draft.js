//Global stuff, put in another file?
function setXY(e){
    var headerheight = document.getElementsByTagName('header')[0].offsetHeight;
    if (e.targetTouches){
        draft.x = e.targetTouches[0].pageX;
        draft.y = e.targetTouches[0].pageY - headerheight;
    } else {
        draft.x = e.pageX;
        draft.y = e.pageY - headerheight;
    }
}

function dist(p1, p2){
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    return Math.sqrt(dx*dx+dy*dy);
}



function Tool(){}
Tool.prototype={
    'up'  :function(e){},
    'down':function(e){},
    'move':function(e){},
    'drag':function(e){}
};








(function(root){

    //set up namespace
    var draft = typeof exports != 'undefined' ? exports : root.draft = {}
    draft.tools = {};
    draft.activeTool = null;//null or the tools name/key 
    draft.x = 0;      //position of the current event relative to the canvas.
    draft.y = 0;
    draft.down=false; //mouse pressed
    draft.objects={}; 
    draft.init = null; //actual declaration is after the init function.
    draft.showGrid = false;


    function refresh(){
        // redraw all the objects on the canvas
        console.log("Refresh:");
        console.log(draft.objects);
        with(draft.context){
            with(draft.canvas){
                clearRect(0,0,width,height);
                if(draft.showGrid){ 
                    drawGrid = function (spacing){
                        beginPath();
                        for(var i=0; i< width; i+= spacing)
                        {
                            moveTo(i,0);
                            lineTo(i,height);
                        }
                        for(var i=0; i< height; i+= spacing)
                        {
                            moveTo(0,i);
                            lineTo(width,i);
                        }
                        stroke();
                    };
    
                    lineWidth=1;
                    strokeStyle = "rgb(100,100,100)";
                    drawGrid(40);
                    
                    lineWidth=2;
                    strokeStyle = "rgb(200,200,200)";
                    drawGrid(200);
                }
            }
            strokeStyle = "rgb(255,255,255)";
            lineCap = 'round';
   
            lineWidth=5;
            //Draw circles first, they might eventually fill with colors?
            draft.objects.circles.forEach(function(c,idx,array){
                var p1 = draft.objects.points[c.p1];
                var p2 = draft.objects.points[c.p2];
                var r = dist(p1,p2);
                console.log(p1+"\n"+p2+"\n"+r);
                beginPath();
                arc(p1.x,p1.y,r,0,Math.PI*2,true);
                stroke();
            });
            
            draft.objects.lines.forEach(function(ln,idx,array){
                p1 = draft.objects.points[ln.p1];
                p2 = draft.objects.points[ln.p2];
                moveTo(p1.x,p1.y);
                lineTo(p2.x,p2.y);
                stroke();
            });

            //Draw Points last, so that they are on top of everything.
            lineWidth = 10;
            strokeStyle = "rgb(128,128,255)";
            draft.objects.points.forEach(function(pt,idx,array){
                console.log(idx+" :"+draft.selected);
                beginPath();
                if(draft.selected==idx)
                    strokeStyle = "rgb(255,128,128)";
                moveTo(pt.x-.5,pt.y);
                lineTo(pt.x+.5,pt.y);
                stroke();
                if(draft.selected==idx)
                    strokeStyle = "rgb(128,128,255)";
            });
        }
    }



    function select(loc){
        //select the point at loc
        var selected = null;
        draft.objects.points.forEach(function(p,idx){
            if(selected != null) return; //once we found a point, ignore the rest.
                                         //I don't know how to exit a forEach :(
            if(dist(p,loc)<5)
                selected = idx;
        });
        return selected;
    }



    // UI events
    function down(e){
        draft.down = true;
        setXY(e);

        draft.activeTool.down(e);
        
        refresh();
    }

    function up(e){
        draft.down = false;
        draft.selected = null;

        draft.activeTool.up(e);
        
        refresh();
    }
    
    function move(e){
        setXY(e);
        if(draft.down){
            drag(e);
            return;
        }
        draft.activeTool.move(e);
    }

    function drag(e){
        setXY(e);
        if(draft.selected!=null)
        {
            draft.objects.points[draft.selected].x=draft.x;
            draft.objects.points[draft.selected].y=draft.y;
        }
        draft.activeTool.drag(e);
        refresh(); 
    }
    // End UI events.


//sock.send(JSON.stringify({'type':'path','path':draft.path}))

    draft.message = null; // Message to be pushed out next time output is sent.
    draft.pushInterval = null;//interval handle



    // connect to server, and re-connect if disconnected
    function connect(){
        sock = new SockJS('http://'+document.domain+':'+location.port+'/sjs');
        sock.onopen = function() {
            console.log('connected');
            draft.pushInterval = setInterval(
                function (){
                    if(draft.message)
                        sock.send(JSON.stringify(draft.message));
                    draft.message = null;
                }
            , 50);
        };
        sock.onmessage = function(msg) {
            console.log(msg);
            var data = JSON.parse(msg.data);
            if (data.type == 'sync'){
                draft.objects = data.objects;
                var usercount = document.getElementById('users');
                usercount.innerHTML= data.usercount;
                refresh(); 
            }
            if (data.type == 'path'){
                with(draft.context){
                    draft.path = []
                    while(data.path.length > 0){
                        var item = data.path.pop()
                        draft.path.push(item);
                        if (draft.path.length > 1){
                            draft.brushes[item.b].draw(item)
                        }
                    };
                    draft.path = []
                };
            }
            if (data.type == 'stats'){
            }
        };
        sock.onclose = function() {
            console.log('disconnected');
            setTimeout(function(){connect();},1000);
            clearInterval(draft.pushInterval);
        };
    }


    //toggle active tool in sidebar
    function swapClass(e,cl){
        var buttons = document.getElementsByClassName(cl);
        Array.prototype.slice.call(buttons, 0).forEach(function(el){
            el.className = 'color';
        })
        e.toElement.className += " "+cl;
    }

    //main initialization routine
    function init(){

        // set up brush select box

        var select = document.getElementsByTagName('select')[0];
        Object.keys(draft.tools).forEach(function(tool){
            var option = new Option(tool,tool);
            select.options[select.options.length] = option;
        })


        // build canvas and set up events
        draft.canvas = document.getElementsByTagName('canvas')[0];
        draft.context = draft.canvas.getContext('2d');
        with(draft.context){
            canvas.style.position = 'fixed';
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            window.onresize = function(){
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                refresh();
            }
            canvas.addEventListener('mousedown', down);
            canvas.addEventListener('touchstart', down);
            canvas.addEventListener('touchend', up);
            canvas.addEventListener('mouseup', up);
            canvas.addEventListener('mousemove', move);
            canvas.addEventListener('touchmove', move);
            canvas.addEventListener('contextmenu', function(e){
                if (e.button === 2){
                    e.preventDefault();
                    return false;
                }
            },0)
            
        }



        // set up toolbar events
        with(document){
            getElementById('color1').style.background = draft.color1;
            getElementById('color2').style.background = draft.color2;
            getElementById('color3').style.background = draft.color3;
//            addEventListener("fullscreenchange", toggleaside, false);
//            addEventListener("mozfullscreenchange", toggleaside, false);
//            addEventListener("webkitfullscreenchange", toggleaside, false);
            getElementById('brushselect')[0].addEventListener('change', function(e){
                draft.b = e.target.value;
            });
            getElementById('grid').addEventListener('change',function(e){
                
                switch(e.target.value){
                    case "off":
                        draft.showGrid = false;
                    break;
                    case "snap":
                    //snap logic here
                    //fall through to 'on' case.
                    case "on":
                        draft.showGrid = true;
                    break;
                }
                refresh();
            });
//            getElementById('save').addEventListener('click', function(e){
//                e.preventDefault();
//                save()
//                return false;
//            });
            getElementById('sizerange').addEventListener('change', function(e){
                draft.w = e.target.value;
            });
            getElementById('alpharange').addEventListener('change', function(e){
                draft.a = e.target.value;
                draft.context.globalAlpha = e.target.value / 100;
            });
            getElementById('color1').addEventListener('click', function(e){
                swapClass(e,'activecolor');
                draft.c = draft.color1;
                draft.colora = draft.color1;
            });
            getElementById('color2').addEventListener('click', function(e){
                swapClass(e,'activecolor');
                draft.c = draft.color2;
                draft.colora = draft.color2;
            });
            getElementById('color3').addEventListener('click', function(e){
                swapClass(e,'activecolor');
                draft.c = draft.color3;
                draft.colora = draft.color3;
            });
        }

        // hide address bar for Android
        if (window.navigator.userAgent.match('/Android/i')){
            setTimeout(function(){
                canvas.height = window.innerHeight + 60;
                window.scrollTo(0,1);
            }, 0);
        }

        // connect to server
        connect();
    }
    draft.init = init;

   
    // brush modules
    draft.tools['Move Point'] = {
        selected:null,

        up:function(e){
            this.selected = null;
        },
        down:function(e){
            this.selected = select(draft);
        },
        move:function(e){
        },
        drag:function(e){
            if(this.selected!=null){
                draft.objects.points[this.selected].x=draft.x;
                draft.objects.points[this.selected].y=draft.y;
                refresh();
                draft.message = 
                    {
                        'type':'update', 
                        'object':'points', 
                        'id':this.selected, 
                        'val':draft.objects.points[this.selected]
                    };
//sock.send(JSON.stringify({'type':'update','objects':draft.objects}))
            }
        }    
    }
    draft.activeTool = draft.tools['Move Point'];
})(this);

//sock.send(JSON.stringify({'type':'path','path':draft.path}))
