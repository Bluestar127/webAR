function getHistogramPattern(url, canvas,callback) {


        var myCanvas = document.getElementById(canvas);
        var ctx = myCanvas.getContext('2d');
        var img = new Image;
        myCanvas.width=512;
        myCanvas.height=512;

        img.onload = function(){

        ctx.drawImage(img,0,0,512,512); // Or at whatever offset you like
        
        var rawdata = ctx.getImageData(0,0,512, 512);   
        var array = new Uint8Array(rawdata.data.buffer); 
        var src = cv.matFromArray(512,512,cv.CV_8UC4,array); // 24 for rgba
        cv.cvtColor(src, src, cv.COLOR_RGB2HSV, 0); 
        let srcVec = new cv.MatVector();
        srcVec.push_back(src);
        let accumulate = false;
        let channels = [0];
        let histSize = [256];
        let ranges = [0, 255];
        let hist = new cv.Mat();
        let mask = new cv.Mat();
        // You can try more different parameters
        cv.calcHist(srcVec, channels, mask, hist, histSize, ranges, accumulate);
        let none = new cv.Mat();
       // cv.normalize(hist, hist, 0, 256, cv.NORM_MINMAX, -1, none);
        src.delete(); 
        callback(hist.data32S);
        };
       
        img.src=url;
}
function getHistogramFromMat(src) {
    var hsv=new cv.Mat();
    cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV, 0); 
    let srcVec = new cv.MatVector();
    srcVec.push_back(hsv);
    let accumulate = false;
    let channels = [0];
    let histSize = [256];
    let ranges = [0, 255];
    let hist = new cv.Mat();
    let mask = new cv.Mat();
    // You can try more different parameters
    cv.calcHist(srcVec, channels, mask, hist, histSize, ranges, accumulate);
   // cv.normalize(hist, hist, 0, 256, cv.NORM_MINMAX, -1, none);
    srcVec.delete(); mask.delete();hsv.delete();
    return hist.data32S;
}
function getHistogramFromData(data){
    let none = new cv.Mat();
    var src = cv.matFromArray(256,1,cv.CV_32F,data); // 24 for rgba
    cv.normalize(src, src, 0, 256, cv.NORM_MINMAX, -1, none);
    none.delete();
    return src;  
}
function compareImage(base,test){
let res= cv.compareHist(base,test,cv.HISTCMP_CORREL);
return res;
}
function getInput() {
    const canvas = document.createElement('canvas');

    var ctx = canvas.getContext('2d');
    var imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
    return imgData;
}