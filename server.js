#!/usr/bin/node

var http = require('http');
var fs = require('fs');
var sockjs = require('sockjs');
var node_static = require('node-static');

var static_dir = new node_static.Server(__dirname);

var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.2.min.js"};

var sockjs_server = sockjs.createServer(sockjs_opts);

var http_server = http.createServer();

var port = process.argv[2] || 12346;

var host = '0.0.0.0';

var startTime = (new Date()).getTime();

var sockets = {};

var objects ={}

var NEXT_SOCKET_ID = 1;

var NEXT_OBJECT_ID = 1;

function nextSocketID(){
    return NEXT_SOCKET_ID ++;
}
function nextObjectID(){
    return NEXT_OBJECT_ID ++;
}
function GeomObject(type, subtype, args){
    return {
        type:type,
        subtype:subtype,
        args: args,
        parents: [],
        children: [],
        id: nextObjectID(),
        held: false
    }
}
function Link(parID, childID){
    par = objects[parID]
    child = objects[childID]
    if(par===undefined || child===undefined)
    {
        console.log("Failed to link objects:")
        console.log(par)
        console.log(child)
        return
    }
    par.children.push(childID)
    child.parents.push(parID)
}
function remGeomObject(id){
    var object = objects[id];
    if(object == undefined)
        return;

    //Remove any reference to this object.
    for(var i in object.parents){
        var p = object.parents[i];
        p.children.splice(p.children.indexOf(id),1);
    }
        
    //Clear out any children objects linked.
    for(var i in object.children){
        var c = object.children[i];
        remGeomObject(c);
    }

    //Remove this object.
    delete objects[id];
}
function addGeomObject(obj){
    oldObj = objects[obj.id]
    if(oldObj !== undefined)
    {
        console.log("Attempting to replace object: "+obj.id)
        console.log("Old:")
        console.log(oldObj)
        console.log("New:")
        conosle.log(obj)
        return false
    } 

    objects[obj.id]=obj;
    return obj.id
}
function addPoint(subType, args){
    return addGeomObject(GeomObject(
        'point', subType, args
    ));
}
function addAbsolutePoint(x,y){
    return addPoint('absolute', {x:x, y:y})
}
function addMidpoint(lineID){
    return addPoint('midpoint', {line: lineID})
}
function addLine(subType, args){
    return addGeomObject(GeomObject(
        'line', subType, args
    ));
}
function add2PointLine(p1ID, p2ID){
    myID = addLine('2pt', {p1:p1ID, p2:p2ID})
    if(myID == false)
        return false

    Link(p1ID,myID)
    Link(p2ID,myID)
    return myID;
}
function addParallelLine(lineID, ptID){
    myID = addLine('par', {line: lineID, point:ptID})
    if(myID == false)
        return false
    Link(lineID,myID)
    Link(pointID,myID)
    return myID
}



sockjs_server.on('connection', function(socket) {
    var id = nextSocketID();
    sockets[id] = socket;
    sockets.count += 1;
    
    socket.on('data', function(message){
        handleMessage(id, message);
    });
    
    socket.on('end',function(){
        delete sockets[id];
        sockets.count -= 1;
    });
    
    socket.write(JSON.stringify({
        'type':'sync',
        'objects': objects,
        'users': sockets.count,
        'start': startTime
    }));
});

function handleMessage(id, message){
    var messageObject = JSON.parse(message);
    var messageType = messageObject.Type;
    var objectID = message.objectID;
    var object = objects[objectID];

    switch(messageType){
        case 'grab':
            if(object && object.held == false)
            {
                object.held = id;
                publish({'type':'held' 
                        ,'objectID':data.objectID
                        ,'ownerID':id
                        });
            }
        break;
        case 'release':
            if(object && object.held == id)
            {
                object.held = false;
                publish({'type':'held'
                        ,'objectID':data.objectID
                        ,'ownerID':false
                        });
            }
        break;
        case 'move':
            var pos = messageObject.pos;
            if(object 
            && object.held == id
            && object.type == 'point' 
            && object.subtype == 'absolute')
            {
                object.args.x = pos[0];
                object.args.y = pos[1];

                publish({'type':'pos'
                        ,'objectID': objectID
                        ,'pos': pos
                        });
            }
        break;
        case 'add':
            var objtype = messageObject.objtype;
            var subtype = messageObject.subtype;
            var args = messageObjext.args;

            var id = addGeomObject(GeomObject(
                        objtype, subtype, args
                     ));
            if(objects[id])
                publish({'type':'add'
                        ,'object':objects[id]
                        });
        break;
        case 'rem':
            if(object
            && object.held == id)
            {
                remGeomObject(objectID)
                publish({'type':'rem'
                        ,'objectID': objectID
                        });
            } 
        break;
    }
}

function publish(message){
    var msg = JSON.stringify(message);
    for(var id in sockets){
        sockets[id].write(msg);
    }
}

setInterval(function(){
    var message = JSON.stringify({'type':'stat','users':sockets.count});
    publish(message)
},10000)

http_server.addListener('request', function(req, res) {
     static_dir.serve(req, res);
});

http_server.addListener('upgrade', function(req, res) {
     res.end();
});

sockjs_server.installHandlers(http_server, {prefix:'/sjs'});

http_server.listen(port, host);

console.log('draft is listening on '+host+':'+port)

p1 = addAbsolutePoint(100,100)
p2 = addAbsolutePoint(200,150)
l1 = add2PointLine(p1,p2)
