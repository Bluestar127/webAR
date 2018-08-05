class glScene {

    constructor(view) {

        // Create a perspective matrix, a special matrix that is
        // used to simulate the distortion of perspective in a camera.
        // Our field of view is 45 degrees, with a width/height
        // ratio that matches the display size of the canvas
        // and we only want to see objects between 0.1 units
        // and 100 units away from the camera.

        this.projectionMatrix = mat4.create();
        var fovy = 20, aspect = 1.0, near = 0.5, far = 100.0;

        var viewVol = [glMatrix.toRadian(fovy), aspect, near, far];
        mat4.perspective(this.projectionMatrix, viewVol[0], viewVol[1], viewVol[2], viewVol[3]);


        var gl = getWebGLContext(view);

        if (!gl) {
            console.log('Failed to find context');
        }

        this.camera = new glCameraPlayer(gl);
        this.video = new glTargetVideoPlayer(gl);
        this.gl = gl;
    }

    updateScene(pvtx) {
           this.pvtx=pvtx;

    }
    renderScene(img) {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        this.gl.clearDepth(1.0);                 // Clear everything
        this.gl.enable(this.gl.DEPTH_TEST);           // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL);            // Near things obscure far things
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA);            // Near things obscure far things
      
        // Clear the canvas before we start drawing on it.
      
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.camera.RenderCamera(img, this.projectionMatrix);
        if(this.pvtx!=undefined)
        for (let i=0;i<this.pvtx.length;i++){
           if(this.pvtx[i].involveRect==true && this.pvtx[i].isTracked==true){
            this.video.updateVertices(this.pvtx[i]);
            this.video.RenderVideo(this.projectionMatrix);
           } 
          
        }

       
      
    }

}