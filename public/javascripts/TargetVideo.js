class TargetVideo {
    constructor() {
        this.involveRect = false;
        this.life = 0;
        this.cvm = new cvMath();
        this.isTracked=false;
        this.start_pattern_ready=0;
        this.bkColor=[1.0,1.0,1.0];
    }
    reset(rect, image, vpList) {
        this.rect = rect;
        this.life = 0;
        this.vpList=vpList;
        this.involveRect = true;

      //  this.start_pattern_ready++;
       // if(this.start_pattern_ready>4){
            this.extractPatternImage(rect, image, this.vpList);
            this.start_pattern_ready=0;
      //  }
       

    }
    trackingTarget(rects) {
        var mi = -1;
        this.isTracked=true;
        if (this.involveRect == true) {
          
            if (rects.length > 0){
                var maxV = (rects[0].size.width+rects[0].size.height)/8;
                for (let i = 0; i < rects.length; ++i) {
                    var distance = Math.abs(this.cvm.norm(this.cvm.diff(rects[i].center, this.rect.center)));
                    if (distance < maxV) {
                        mi = i;
                        maxV = distance;
                    }
                }

            }
                
            if (mi == -1) {
                this.life++;
                if (this.life > 15) {
                    this.involveRect = false;
                    this.life = 0;
                    this.videoPlayer.video.pause();
                }
                this.isTracked=false;

            } else {
                this.life = 0;
             //   this.fixOrderPoints(rects[mi]);
               
                var acRt = 0.7;
                for (let i = 0; i < 4; i++) {
                    this.rect.pts[i].x = this.rect.pts[i].x * (1 - acRt) + rects[mi].pts[i].x * acRt;
                    this.rect.pts[i].y = this.rect.pts[i].y * (1 - acRt) + rects[mi].pts[i].y * acRt;

                }
                this.rect.size.width = this.rect.size.width * (1 - acRt) + rects[mi].size.width * acRt;
                this.rect.size.height = this.rect.size.height * (1 - acRt) + rects[mi].size.height * acRt;
                this.rect.center.x = this.rect.center.x * (1 - acRt) + rects[mi].center.x * acRt;
                this.rect.center.y = this.rect.center.y * (1 - acRt) + rects[mi].center.y * acRt;
            }
        }
    
        return mi;

    }
   
    extractPatternImage(rect, src, vpList) {

        var vap=[rect.pts[0],rect.pts[1],rect.pts[2],rect.pts[3]];
        var vp=[rect.pts[0],rect.pts[1],rect.pts[2],rect.pts[3]];
        for (let i = 0; i < 4; i++) {
            //  rect.pts[i] = objs[i].first_nom;
              var lp=(i)%4;
              var rp=(i+1)%4;
             // rect.pts[rp] = objs[lp].first_nom;
             vp[lp] = vap[rp];
          }
        var p1 = new cv.Point(src.cols * (vp[0].x + 1) / 2, src.rows * (1 - vp[0].y) / 2);
        var p2 = new cv.Point(src.cols * (vp[1].x + 1) / 2, src.rows * (1 - vp[1].y) / 2);
        var p3 = new cv.Point(src.cols * (vp[2].x + 1) / 2, src.rows * (1 - vp[2].y) / 2);
        var p4 = new cv.Point(src.cols * (vp[3].x + 1) / 2, src.rows * (1 - vp[3].y) / 2);
        this.limitRange(p1, src);
        this.limitRange(p2, src);
        this.limitRange(p3, src);
        this.limitRange(p4, src);

        let dst = new cv.Mat();
        var maxL = Math.max(src.rows, src.cols);
        let dsize = new cv.Size(maxL, maxL);

        let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2,
            [p1.x, p1.y,
            p4.x, p4.y,
            p2.x, p2.y,
            p3.x, p3.y]);
        var br = cv.boundingRect(srcTri);

        var bb = [br.x, br.y,
                  br.x + br.width, br.y,
                  br.x, br.y + br.height,
                  br.x + br.width, br.y + br.height];

        let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, bb);

        let M = cv.getPerspectiveTransform(srcTri, dstTri);
       
      
        // You can try more different parameters
        cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT,new cv.Scalar() );

        var res = new cv.Mat();
        dst.roi(br).copyTo(res);
        cv.flip(res, res, 0);
        var test = getPatternFromMat(res);
       


        var compareCoeff = 0;
        var patternID = 0;
        for (let i = 0; i < vpList.length; i++) {
            var base = getMatFromData(vpList[i].pattern);
            var diff = getcalculate(test, base);
          //  base.delete();
            if (compareCoeff < diff) {
                compareCoeff = diff;
                patternID = i;
            }
        }
      
        var base = getMatFromData(vpList[3].pattern);
        let dstx = new cv.Mat();
        cv.absdiff(test,base,dstx);

        cv.imshow('preview', dstx);  
       // dstx.delete();
        test.delete();  dst.delete(); M.delete(); srcTri.delete(); dstTri.delete();

        var flg = false;
        if( this.videoPlayer == undefined){
     
             this.videoPlayer = new VideoPlayer(vpList[patternID].videoUrl,patternID);
             this.videoPlayer.video.play();   
             this.bkColor=vpList[patternID].bkColor;

         }else        
         {
            this.videoPlayer.reloadVideo(vpList[patternID].videoUrl);   
            this.bkColor=vpList[patternID].bkColor;
         }     

         res.delete();

        return flg;
    }
    limitRange(p, img) {
        p.x = Math.min(img.cols - 2, Math.max(1, p.x));
        p.y = Math.min(img.rows - 2, Math.max(1, p.y));
    }
}