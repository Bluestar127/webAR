class pRect{
    constructor(vs){
        var ptts=[];
        if(vs==null){
            for (let i=0 ;i<4;i++){
                var cx=0;
                var cy=0;
                ptts.push(new cv.Point(cx,cy));
             }
        }else
        for (let i=0 ;i<vs.rows;i++){
            var cx=vs.data32S[2*i];
            var cy=vs.data32S[2*i+1];
            ptts.push(new cv.Point(cx,cy));
         }
        this.pts=ptts;  
        this.flg=false;   
        this.area=0;
        this.size=new cv.Size(0,0);
    }
  
}