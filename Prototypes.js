Array.prototype.removeItem=function (item, all){
    var found;
    var pos = 0;
    do
    {
        pos = this.indexOf(item,pos)
        found = (pos != -1);
        if(found)
            this.splice(pos,1);
    }
    while(found && all);
}
