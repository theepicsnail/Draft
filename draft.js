(function(root){

    //set up namespace
    var draft = typeof exports != 'undefined' ? exports : root.draft = {}

    // set stored x/y position to current touch/cursor location
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

    // draw line from last x/y to current x/y and add coords to path buffer
    function draw(e){
        with(draft.context){
            if (draft.down){
                setXY(e);
                if (e.button === 2) {
                    draft.c = 'rgb(0,0,0)';
                }
                var line = {
                    'x':draft.x,
                    'y':draft.y,
                    'c':draft.c,
                    'w':draft.w,
                    'b':draft.b
                };
                draft.path.push(line);
                if (draft.path.length > 1){
                    draft.brushes[draft.b].draw(line)
                }
            }
        }
    }

    function refresh(){
        console.log("Refresh:");
        console.log(draft.objects);
        with(draft.context){
            with(draft.canvas){
                clearRect(0,0,width,height);
            }

            strokeStyle = "rgb(255,255,255)";
            lineCap = 'round';
   
            lineWidth=5;
            //Draw circles first, they might eventually fill with colors?
            draft.objects.circles.forEach(function(c,idx,array){
                var p1 = draft.objects.points[c.p1];
                var p2 = draft.objects.points[c.p2];
                var dx = p1.x-p2.x;
                var dy = p1.y-p2.y;
                var r = Math.sqrt(dx*dx+dy*dy);
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
            beginPath();
            draft.objects.points.forEach(function(pt,idx,array){
                moveTo(pt.x-.5,pt.y);
                lineTo(pt.x+.5,pt.y);
                stroke();
            });
        }
    }


    // start a new path buffer
    function down(e){
        draft.down = true;
        setXY(e);
        draft.objects.points[0].x=draft.x;
        draft.objects.points[0].y=draft.y;
//        select();
        refresh();
    }

    // send current path buffer to server
    function up(e){
        draft.down = false;
    }
    
//sock.send(JSON.stringify({'type':'path','path':draft.path}))
    function move(e){
        if(draft.down){
            drag(e);
            return;
        }

    }

    function drag(e){
        if(draft.selected!=null)
        {
            draft.objects.points[selected].x=draft.x;
            draft.objects.points[selected].y=draft.y;
        }
        setXY(e);
        draft.objects.points[1].x=draft.x;
        draft.objects.points[1].y=draft.y;
        refresh(); 
    }




    // connect to server, and re-connect if disconnected
    function connect(){
        sock = new SockJS('http://'+document.domain+':'+location.port+'/sjs');
        sock.onopen = function() {
            console.log('connected');
        };
        sock.onmessage = function(msg) {
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
        Object.keys(draft.brushes).forEach(function(brush){
            var option = new Option(brush,brush);
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
            getElementsByTagName('select')[0].addEventListener('change', function(e){
                draft.b = e.target.value;
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

    // global exports

    draft.init = init;
    draft.w = 1;
    draft.c = 'rgb(255,255,255)';
    draft.b = 'point';
    draft.color1 = 'rgb(180,0,0)';
    draft.color2 = 'rgb(0,180,0)';
    draft.color3 = 'rgb(0,0,180)';
    draft.colora = draft.color1;
    draft.init = init;
    draft.brushes = {};
    
    // brush modules
    draft.brushes['point'] = {
        draw : function(line){
            with(draft.context){
                sock.send(JSON.stringify({'type':'path','path':draft.path}))
                strokeStyle = line.c;
                lineWidth = line.w / 100 * 5;
                for (var i=1;i<draft.path.length;i++){
                    var e = -Math.random()
                    var b = draft.path[draft.path.length -1].x - draft.path[draft.path.length -i].x
                    var a = draft.path[draft.path.length -1].y - draft.path[draft.path.length -i].y
                    var h = b * b + a * a;
                    if (h < (2000*line.w) && Math.random() > h / (2000*line.w)) {
                        beginPath();
                        moveTo(
                            draft.path[draft.path.length -2].x + (b * e),
                            draft.path[draft.path.length -2].y + (a * e)
                        );
                        lineTo(
                            draft.path[draft.path.length -1].x - (b * e) + e * 2,
                            draft.path[draft.path.length -1].y - (a * e) + e * 2
                        );
                        stroke();
                    }
                }
            }
        }
    }

})(this);
