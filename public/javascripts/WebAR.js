
class WebAR {
    constructor(w, h, vpList,worker) {
        this.cameraProvider = new Camera(w, h);
        // this.proc = new Proc();
        this.vpList = vpList;
        this.glViewRenderable = true;
       this.worker=worker;

    }
    run(view) {


        if (this.cameraProvider.isMobile) {
            view.width = document.body.clientWidth * 0.9;
            view.height = view.width * this.cameraProvider.height / this.cameraProvider.width;

            // var height = document.body.clientHeight;
            //  var width = document.body.clientWidth;
        } else {
            view.height = document.body.clientHeight * 0.9;
            view.width = view.height * this.cameraProvider.width / this.cameraProvider.height;

        }


        if (this.glViewRenderable == true) this.renderer = new glScene(view);


        this.cameraProvider.run();

        var isRunning = false;
        var FPS = 30;  // Target number of frames processed per second.
        // var cap = new cv.VideoCapture(this.camera);
        // var frame = new cv.Mat(this.camera.height, this.camera.width, cv.CV_8UC4);
        // let dst = new cv.Mat(this.camera.height, this.camera.width, cv.CV_8UC4);

        var that = this;
        var getReceive = true;
    //    var targets = [];

        for (let i = 0; i < 4; i++) {
            var tg = new TargetVideo();
            targets.push(tg);
        }
        var isSendable=true;
        var arrayTarget=[];
        var btime = Date.now();
        that.worker.onmessage = function (e) {
            arrayTarget = e.data.data;
            isSendable=true;
            var endTime= Date.now()-btime;

        };
        function captureFrame() {
  
            var begin = Date.now();

            var frame = that.cameraProvider.getFrame();
       
            //  let arrayTarget = that.proc.processImageCV(view, frame);
           
            if(isSendable==true){

                btime = Date.now();
                isSendable=false;
                var data_copy=new cv.Mat();         
                frame.copyTo(data_copy);
              
                    var scale = 1.0;
                    let dsize = new cv.Size(data_copy.cols * scale, data_copy.rows * scale);
                    let gray = new cv.Mat();
                    cv.resize(data_copy, data_copy, dsize, 0, 0, cv.INTER_AREA);
            
                    cv.cvtColor(data_copy, data_copy, cv.COLOR_RGBA2GRAY, 0);                
    
                    that.worker.postMessage({ 'cmd': 'process', 'width': data_copy.cols, 'height': data_copy.rows, 'data': data_copy.data ,'scale':scale});
                 //   that.worker.postMessage({ 'cmd': 'test', 'width':0});
    
                 // that.worker.postMessage({ 'cmd': 'test', 'width':0});
                    data_copy.delete();
          
             
            }
           
           
                if (that.glViewRenderable == true) {
                    for (let i = 0; i < targets.length; i++) {
                        if (targets[i].involveRect == true) {
                            var mmi = targets[i].trackingTarget(arrayTarget);
                            if (mmi != -1)
                                arrayTarget[mmi].flg = true;
                        }
                    }
                    let kk = 0;
                    for (let i = 0; i < Math.min(4, arrayTarget.length); i++) {
                        if (arrayTarget[i].flg == false) {

                            while (kk < 4) {
                                if (targets[kk].involveRect == false) break
                                kk++;
                            };
                            if (kk < 4)
                                targets[kk].reset(arrayTarget[i], frame, that.vpList);
                            kk++;
                        }

                    }

                    if (arrayTarget.length > 0) {
                        that.renderer.updateScene(targets);
                    }

                    that.renderer.renderScene(frame);
                } else {
                    if (arrayTarget.length > 0)
                        for (let i = 0; i < arrayTarget.length; ++i) {
                            that.drawRect(frame, arrayTarget[i]);
                        }
                    cv.imshow(view, frame);
                }

       
           

            frame.delete();
            if (isRunning) {
                var delay =  (Date.now() - begin);
                document.getElementById('errorlbl').innerHTML = delay;
                setTimeout(captureFrame, 1);
          
              //  window.requestAnimationFrame(captureFrame);
               // captureFrame();
            }
           

        };

        isRunning = true;
        captureFrame();
       // window.requestAnimationFrame(captureFrame);

    }

    drawRect(drw, rect) {
        let color = new cv.Scalar(255, 0, 0, 255);
        var top = new cv.Point(drw.cols * (rect.pts[0].x + 1) / 2, drw.rows * (1 - rect.pts[0].y) / 2);
        let color2 = new cv.Scalar(0, 255, 0, 255);
        cv.circle(drw, top, 5, color2, -1)
        for (let i = 0; i < rect.pts.length; i++) {

            var startPoint = new cv.Point(drw.cols * (rect.pts[i % 4].x + 1) / 2, drw.rows * (1 - rect.pts[i % 4].y) / 2);
            var endPoint = new cv.Point(drw.cols * (rect.pts[(i + 1) % 4].x + 1) / 2, drw.rows * (1 - rect.pts[(i + 1) % 4].y) / 2);

            cv.line(drw, startPoint, endPoint, color);
        }

    }

}