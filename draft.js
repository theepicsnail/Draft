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



function Tool(){} //this isn't actually used anywhere.. it's just the layout i'm basing tools off of.
Tool.prototype={
    'selected':[], //Points being used by the tool/points to highlight 
    'up'  :function(e){},
    'down':function(e){},
    'move':function(e){},
    'drag':function(e){},
    'reset':function(){}
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
    draft.message = null; // Message to be pushed out next time output is sent.
    draft.pushInterval = null;//interval handle


    function refresh(){
        // redraw all the objects on the canvas
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
                beginPath();
                var highlightPoint = false;
                if(draft.activeTool)
                {
                    if(draft.activeTool.selected!=null)
                    {
                        var sel = draft.activeTool.selected;
                        if(typeof(sel)=='number')
                            highlightPoint = (sel == idx)
                        else
                            highlightPoint = (sel.indexOf(idx)!=-1)
                    }
                }
                if(highlightPoint)
                    strokeStyle = "rgb(255,128,128)";
                moveTo(pt.x-.5,pt.y);
                lineTo(pt.x+.5,pt.y);
                stroke();
                if(highlightPoint)
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
        setXY(e);
        draft.down = false;

        draft.activeTool.up(e);
        
        refresh();
    }
    
    function move(e){
        setXY(e);
        if(draft.down)
            drag(e);
        else
            draft.activeTool.move(e);
    }

    function drag(e){
        draft.activeTool.drag(e);
        refresh(); 
    }
    // End UI events.






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
            var data = JSON.parse(msg.data);
            if (data.type == 'sync'){
                draft.objects = data.objects;
                var usercount = document.getElementById('users');
                usercount.innerHTML= data.usercount;
                refresh(); 
            }
            if (data.type == 'stats'){
            }
        };
        sock.onclose = function() {
            console.log('disconnected');
            setTimeout(function(){try{connect();}catch(e){}},1000);
            clearInterval(draft.pushInterval);
        };
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
            canvas.addEventListener('mousedown', down,false);
            canvas.addEventListener('touchstart', down,false);
            canvas.addEventListener('touchend', up,false);
            canvas.addEventListener('mouseup', up,false);
            canvas.addEventListener('mousemove', move,false);
            canvas.addEventListener('touchmove', move,false);
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
            getElementById('brushselect').addEventListener('change', function(e){
                console.log("tool changed:");
                console.log(e);
                
                draft.activeTool = draft.tools[e.target.value];
                draft.activeTool.reset();
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
    draft.tools['Point'] = {
        selected:null,
        click:false,
        up:function(e){
            console.log("--- mouse up ---");
            this.selected = null;
            console.log(this.click);
            if(this.click){
                console.log("Point added.");
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
        },
        down:function(e){
            this.selected = select(draft);
            console.log("Down");
            this.click = true;
        },
        move:function(e){
            console.log("Move");
            this.click = false;
        },
        drag:function(e){
            console.log("Drag");
            this.click = false;
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
        },    
        reset:function(){
            this.selected=null;
            this.click = false;
        }
    }
    draft.tools['Line'] = {
        selected:[],
        up:function(e){
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
        },
        down:function(e){
        },
        move:function(e){
        },
        drag:function(e){
        },   
        reset:function(e){
            this.selected.length=0;
        }
    }

    draft.activeTool = draft.tools['Point'];
})(this);

