function imageproc(view, url){
    var myCanvas = document.getElementById(view);
    var ctx = myCanvas.getContext('2d');
    var img = new Image;
    let that =this;

    img.onload = function(){
        ctx.drawImage(img,0,0); // Or at whatever offset you like
        
        var rawdata = ctx.getImageData(0,0,img.width, img.height);   
        var array = new Uint8Array(rawdata.data.buffer); 
        var src = cv.matFromArray(img.height,img.width,cv.CV_8UC4,array); // 24 for rgba

        var rect = new pRect(null);
        rect.pts[0]=new cv.Point(100,120);
        rect.pts[1]=new cv.Point(100,220);
        rect.pts[2]=new cv.Point(230,220);
        rect.pts[3]=new cv.Point(220,140);
        var res=that.cropImage(rect, src);
      //  cv.imshow(view,res);
    }
    img.src=url;
}
function cropImage(rect , src){

       let dst = new cv.Mat();
       let dsize = new cv.Size(src.rows, src.cols);

        let srcTri =cv.matFromArray(4, 1, cv.CV_32FC2, 
            [rect.pts[0].x, rect.pts[0].y,
             rect.pts[3].x, rect.pts[3].y,
             rect.pts[1].x, rect.pts[1].y,
             rect.pts[2].x, rect.pts[2].y]);
       var br=cv.boundingRect(srcTri);  
    
        var bb=[br.x,br.y, 
                     br.x+br.width,br.y,
                     br.x, br.y+br.height,
                     br.x+br.width, br.y+br.height];
        let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, bb);
        let M = cv.getPerspectiveTransform(srcTri, dstTri);
        // You can try more different parameters
        cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
        var res=dst.roi(br);
    return res;
}
function affineTriangle(scrTri,dstTri,dstImage,srcImage){
    let M = cv.getAffineTransform(srcTri, dstTri);
    let dsize = new cv.Size(srcImage.rows, srcImage.cols);
    cv.warpAffine(srcImage, dstTri, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
 //   src.delete(); dst.delete(); M.delete(); srcTri.delete(); dstTri.delete();
}
function boundingRect(pts){
    var right  = Math.max(pts[0].x, Math.max(pts[1].x,Math.max(pts[2].x,pts[3].x)));
    var bottom = Math.max(pts[0].y, Math.max(pts[1].y,Math.max(pts[2].y,pts[3].y)));
    var top    = Math.min(pts[0].y, Math.min(pts[1].y,Math.min(pts[2].y,pts[3].y)));
    var left   = Math.min(pts[0].x, Math.min(pts[1].x,Math.min(pts[2].x,pts[3].x)));
    return new cv.Rect(left,top ,right-left, bottom-top);

}