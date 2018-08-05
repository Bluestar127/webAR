class Video {
    constructor(videoUrl, patterUrl, callback) {

        this.videoUrl = videoUrl;
        this.patternUrl = patterUrl;
     //   this.bkColor=[0.447, 0.992, 0.168];
        this.bkColor=[0.447, 0.843, 0.168];
        let that = this;
         
       getGrayPattern(patterUrl,'preview',(img,pattern)=>{
      //cv.imshow(glview,img);
        that.template = pattern;
        that.pattern = pattern.data;
        callback();
      });

    }

}
class VideoPlayer {
    constructor(videoUrl, id) {
        this.videoUrl = videoUrl;
        this.id = id;
        this.video = document.createElement('video');

        this.source = document.createElement('source');

        this.source.setAttribute('src', videoUrl);

        this.video.appendChild(this.source);




        var playing = false;
        var timeupdate = false;

        this.video.autoplay = true;
        this.video.muted = true;
        this.video.loop = true;
        // this.copyVideo = false;
        //document.
        this.video.setAttribute("width", 640);
        this.video.setAttribute("height", 480);
        // Waiting for these 2 events ensures
        // there is data in the video

        // this.video.addEventListener('playing', function () {
        //     playing = true;
        //     checkReady();
        // }, true);

        // this.video.addEventListener('timeupdate', function () {
        //     timeupdate = true;
        //     checkReady();
        // }, true);

        //  this.video.src = videoUrl;
        //  this.video.play();

        // let that = this;
        // function checkReady() {
        //     if (playing && timeupdate) {
        //         that.copyVideo = true;
        //     }
        // }         
        this.cap = new cv.VideoCapture(this.video);

    }

    getFrame() {
        var height = this.video.height;
        var width = this.video.width;
        var frame = new cv.Mat(this.video.height, this.video.width, cv.CV_8UC4);
        this.cap.read(frame);  // Read a frame from camera
        return frame;
    }
    reloadVideo(url) {

       // this.video.pause();
        this.source.setAttribute('src', url);
        this.video.load();
        this.video.play();
    }
}