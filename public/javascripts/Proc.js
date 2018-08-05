

//function Proc (){  

    function processImageCV(frame,scale) {

        var gray=new cv.Mat();  
        var size = new cv.Size(3, 5);
        if(frame.cols>frame.rows)size = new cv.Size(5, 3);
        let color = new cv.Scalar(255, 0, 0, 255);
        cv.GaussianBlur(frame, gray, size, 0);
        //  cv.threshold(gray, gray, 80, 255, cv.THRESH_BINARY);
        cv.Canny(gray, gray, 80, 250, 3);
        let cvm = new cvMath();
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(gray, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

       
        const maxArea = frame.cols * frame.rows * 3 / 4;
        const minArea = frame.cols * frame.rows * 1 / 36;
        var recArray = [];
        for (let i = 0; i < contours.size(); ++i) {

            const contour = contours.get(i);
            //objectsToDelete.push(contour);
            const area = cv.contourArea(contour);
            if (area < maxArea && area > minArea) {
                let perimeter = cv.arcLength(contour, true);
                // approx = cv2.approxPolyDP(cnt, 0.03 * perimeter, True)
                let tmp = new cv.Mat();
                cv.approxPolyDP(contour, tmp, perimeter * 0.1, true);
                let polyLen = tmp.rows;
                if (polyLen == 4) {
                    var rect = tmp;
                    var len1 = cvm.norm(cvm.diff(new cv.Point(rect.data32S[0], rect.data32S[1]), new cv.Point(rect.data32S[2], rect.data32S[3])));
                    var len2 = cvm.norm(cvm.diff(new cv.Point(rect.data32S[2], rect.data32S[3]), new cv.Point(rect.data32S[4], rect.data32S[5])));
                    var len3 = cvm.norm(cvm.diff(new cv.Point(rect.data32S[4], rect.data32S[5]), new cv.Point(rect.data32S[6], rect.data32S[7])));
                    var len4 = cvm.norm(cvm.diff(new cv.Point(rect.data32S[6], rect.data32S[7]), new cv.Point(rect.data32S[0], rect.data32S[1])));
                    var dif1 = Math.abs(len1 - len3);
                    var dif2 = Math.abs(len2 - len4);

                    var averLen1 = (len1 + len3) / 2;
                    var averLen2 = (len2 + len4) / 2;
                    if (dif1 / averLen1 < 0.1 && dif2 / averLen2 < 0.1) {

                        var rect = new pRect(tmp);
                        rect.area = area;
                        rect.size = new cv.Size((len1 + len3) / 2, (len2 + len4) / 2);
                        recArray.push(rect);
                    } else
                        tmp.delete();

                }
                //  
                else
                    tmp.delete();
            }

            contour.delete();
        }
           
        for (let i = 0; i < recArray.length; ++i) {
            let recti = recArray[i];
            var p1 = cvm.getCenter(recti.pts);
            recArray[i].center=p1;

            let j=i+1;
            while(j< recArray.length){
                let rectj = recArray[j];
                var p2;

                if(recArray[j].center==undefined){
                    p2 = cvm.getCenter(rectj.pts);
                    recArray[j].center=p2;
                }else{
                    p2=recArray[j].center;
                } 
             
                var dCen = cvm.norm(cvm.diff(p1, p2));
                var areaDiff = Math.abs(recti.area - rectj.area);
                if (dCen <  recti.size.width/2){  
                    if(recti.area<rectj.area){
                       var rp=recArray[i];
                       recArray[i]=recArray[j];
                       recArray[j]=rp
                    }        
                    recArray.splice(j, 1);
                }else{
                    j++;
                }
            }          
          //  rect.center = p1;
          //  rectArray.push(rect);

        }
        var targetImageArray = [];
        for (let i = 0; i < recArray.length; ++i) {
           
            let recti = recArray[i];
            this.fixOrderPoints(recti);

                for (let k = 0; k < recti.pts.length; k++) {
                    var xx = recti.pts[k].x / gray.cols;
                    var yy = recti.pts[k].y / gray.rows;
                    recti.pts[k].x = -1 + 2 * xx;
                    recti.pts[k].y = 1 - 2 * yy;
                }
                var xx = recti.center.x / gray.cols;
                var yy = recti.center.y / gray.rows;
                var width = recti.size.width / gray.cols;
                var height = recti.size.height / gray.rows;
                recti.size.width = width;
                recti.size.height = height;
                recti.center.x = -1 + 2 * xx;
                recti.center.y = 1 - 2 * yy;
                targetImageArray.push(recti);
                // that.drawRect(dst,rectArray[mj]);
        }
       
      //  frame.delete();
        recArray = null;
        hierarchy.delete();
        contours.delete();
        gray.delete();
        //   frm=gray;
        return targetImageArray;
    }
    function rectInRect(iRect, oRect) {
        var m_rate = 0;
        var flg = true;
        let cvm = new cvMath();
        var ds = cvm.norm(cvm.diff(iRect.center, oRect.center));
        let dist = (oRect.size.width + oRect.size.height) / 2;

        if (ds >= dist) {
            for (let i = 0; i < oRect.pts.length; i++) {
                var startPoint = oRect.pts[i % 4];
                var endPoint = oRect.pts[(i + 1) % 4];

                var oLen = cvm.norm(cvm.diff(startPoint, endPoint));
                startPoint = iRect.pts[i % 4];
                endPoint = iRect.pts[(i + 1) % 4];
                var iLen = cvm.norm(cvm.diff(startPoint, endPoint));
                var rate = iLen / oLen;
                if (i == 0) m_rate = rate;
                if (Math.abs(rate - m_rate) > 0.02 || rate > 1) {
                    flg = false;
                    break;
                }
                m_rate = rate;
            }

        }
        return flg;
    }

    function fixOrderPoints(rect) {
        var cx = rect.center.x;
        var cy = rect.center.y;
        
        var srect =[];
        var o = {
            'pt': 3, 'alpa': 4};
        srect.push(rect.pts[0]) ;
        srect.push(rect.pts[1]) ;
        srect.push(rect.pts[2]) ;
        srect.push(rect.pts[3]) ;
        var objs = [ 
            { first_nom: rect.pts[0], last_nom: 0 },
            { first_nom: rect.pts[1], last_nom: 0 },
            { first_nom: rect.pts[2], last_nom: 0 },
            { first_nom: rect.pts[3], last_nom: 0 },
        ];

        var m_alpa = 0;
        var mi = 0;
        var alpas=[];
        for (let i = 0; i < 4; i++) {
            var delx = rect.pts[i].x - cx;
            var dely = rect.pts[i].y - cy;     
            var alpa = this.myatan(dely, delx);
            objs[i].last_nom=alpa;          
        }

        objs.sort(function(a, b){return a.last_nom - b.last_nom});
        for (let i = 0; i < 4; i++) {
          //  rect.pts[i] = objs[i].first_nom;
            var lp=(i+mi)%4;
            var rp=(i+mi+3)%4;
           // rect.pts[rp] = objs[lp].first_nom;
            rect.pts[i] = objs[i].first_nom;
        }


    }
    function getSortFunction(fieldName) {
        return function(employee1, employee2) {

            return employee1> employee2 ;
        }
    }
    function myatan(y, x) {
   
        var v = 0;
        v = Math.atan2(y , x);
        if(v<0){
           v= 2*Math.PI+v;
        }
   
        return v;
    }
    function calculatingFPS() {
        var fps;
        if (!this.lastCalledTime) {
            this.lastCalledTime = Date.now();
            fps = 30;
            return fps;
        }
        let delta = (Date.now() - this.lastCalledTime) / 1000;
        this.lastCalledTime = Date.now();
        return fps = 1 / delta;
    }


//}
self.onmessage = function(e) {
    var cmd=e.data.cmd;
    var n1 = cmd.localeCompare('import');
    var n2 = cmd.localeCompare('process');
    var n3 = cmd.localeCompare('test');
    if(n1==0){
        self.importScripts('/javascripts/opencv.js');
        self.importScripts('/javascripts/pRect.js');
        self.importScripts('/javascripts/cvMath.js');
        self.postMessage({'data':'ok'});
    } else if(n2==0) {
       
        var width=e.data.width;
        var height=e.data.height;
        var data=e.data.data;
        var scale=e.data.scale;
        var src = cv.matFromArray(height,width,cv.CV_8UC1,data); 
        var res=processImageCV(src,scale);
        self.postMessage({'data':res});
        src.delete();
       
    }  else if(n3==0){
        self.postMessage({'data':0});
    } 
    
    
 
 }