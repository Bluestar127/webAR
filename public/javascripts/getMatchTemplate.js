function getGrayPattern(url, canvas,callback) {
    var myCanvas = document.getElementById(canvas);
    var ctx = myCanvas.getContext('2d');
    var img = new Image;
    myCanvas.width=64;
    myCanvas.height=64;


    img.onload = function(){

    ctx.drawImage(img,0,0,64,64); // Or at whatever offset you like
    
    var rawdata = ctx.getImageData(0,0,64, 64);   
    var array = new Uint8Array(rawdata.data.buffer); 
    var src = cv.matFromArray(64,64,cv.CV_8UC4,array); // 24 for rgba
    var res= new cv.Mat();
    cv.cvtColor(src, res, cv.COLOR_RGB2GRAY, 0); 
   // let dsize = new cv.Size(64, 64); 
    callback(src,res);
    }
    img.src=url;
}
function getcalculate(img1,img2){
    let dst = new cv.Mat();
    cv.absdiff(img1,img2,dst);
    let kk=cv.mean(dst);
    let mat = new cv.Mat(img1.rows, img1.cols, img1.type(), new cv.Scalar(kk[0],kk[0],kk[0],kk[0]));
    cv.absdiff(dst,mat , dst);
    let res=cv.mean(dst);
  //  cv.imshow('glview',dst);
    return res[0];

}
function getPatternFromMat(src) {
    var res= new cv.Mat();
    cv.cvtColor(src, res, cv.COLOR_RGBA2GRAY, 0); 
    let dsize = new cv.Size(64, 64); 
    cv.resize(res, res, dsize, 0, 0, cv.INTER_AREA);

    return res;
}
function getMatFromData(data){
    var src = cv.matFromArray(64,64,cv.CV_8UC1,data); // 24 for rgba
    return src;  
}