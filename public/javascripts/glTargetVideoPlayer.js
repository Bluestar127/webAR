class glTargetVideoPlayer {
    constructor(gl) {


        const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoord;
        uniform mat4 uNormalMatrix;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform highp vec3 removeColor;
        varying highp vec2 vTextureCoord;
        varying highp vec3 vLighting;
        varying highp vec3 removingColor;
        void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
        // Apply lighting effect
        highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
        highp vec3 directionalLightColor = vec3(1, 1, 1);
        removingColor=removeColor;
        highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
        vLighting = ambientLight + (directionalLightColor * directional);
        }
    `;
        // Fragment shader program
        let self = this;
        const fsSource = `
        varying highp vec2 vTextureCoord;
        varying highp vec3 vLighting;
        varying highp vec3 removingColor;
        uniform sampler2D uSampler;

        highp vec3 rgb2hsv(highp vec3 rgb)
        {
            highp float Cmax = max(rgb.r, max(rgb.g, rgb.b));
            highp float Cmin = min(rgb.r, min(rgb.g, rgb.b));
            highp float delta = Cmax - Cmin;

            highp vec3 hsv = vec3(0., 0., Cmax);
            
            if (Cmax > Cmin)
            {
                hsv.y = delta / Cmax;

                if (rgb.r == Cmax)
                    hsv.x = (rgb.g - rgb.b) / delta;
                else
                {
                    if (rgb.g == Cmax)
                        hsv.x = 2. + (rgb.b - rgb.r) / delta;
                    else
                        hsv.x = 4. + (rgb.r - rgb.g) / delta;
                }
                hsv.x = fract(hsv.x / 6.);
            }
            return hsv;
        }

        highp float chromaKey(highp vec3 color,highp vec3 bkColor)
        {
            highp vec3 backgroundColor =bkColor;// vec3(0.447, 0.992, 0.168);// vec3(0.157, 0.576, 0.129);
            highp vec3 weights = vec3(4., 1., 2.);

            highp vec3 hsv = rgb2hsv(color);
            highp vec3 target = rgb2hsv(backgroundColor);
            highp float dist = length(weights * (target - hsv));
            return 1. - clamp(3. * dist - 1.5, 0., 1.);
        }

        highp vec3 changeSaturation(highp vec3 color,highp float saturation)
        {
            highp float luma = dot(vec3(0.213, 0.715, 0.072) * color, vec3(1.));
            return mix(vec3(luma), color, saturation);
        }


        void main(void) {

         highp vec3 texelColor = texture2D(uSampler, vTextureCoord).rgb;

         highp float incrustation = chromaKey(texelColor,removingColor);	

        texelColor = changeSaturation(texelColor, 0.5);

        gl_FragColor = vec4(texelColor * vLighting, 1.0-incrustation)*(1.0-incrustation);

        }
    `;
        const shaderProgram = initShadersString(gl, vsSource, fsSource);
        // Collect all the info needed to use the shader program.
        // Look up which attributes our shader program is using
        // for aVertexPosition, aVertexNormal, aTextureCoord,
        // and look up uniform locations.
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
                textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
                uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
                bColor: gl.getUniformLocation(shaderProgram, 'removeColor'),
            },
        };

        // Here's where we call the routine that builds all the
        // objects we'll be drawing.
        this.buffers = this.initBuffers(gl);
        this.texture = this.initTexture(gl);
        this.gl = gl;
      //  this.copyVideo = true;
       /// this.video = this.setupVideo('/face_data/chicken.mp4');

        // function render(now) {
        //     now *= 0.001;  // convert to seconds
        //     const deltaTime = now - then;
        //     then = now;

        //     if (copyVideo) {
        //       this.updateTexture(gl, texture, video);
        //     }

        //     RenderCamera(video, this.projectionMatrix)


        //     requestAnimationFrame(render);
        //   }
        //   requestAnimationFrame(render);
    }
    setupVideo(url) {

        const video = document.createElement('video');
        var playing = false;
        var timeupdate = false;

        video.autoplay = true;
        video.muted = true;
        video.loop = true;

        // Waiting for these 2 events ensures
        // there is data in the video

        video.addEventListener('playing', function () {
            playing = true;
            checkReady();
        }, true);

        video.addEventListener('timeupdate', function () {
            timeupdate = true;
            checkReady();
        }, true);

        video.src = url;
        video.play();

        let that = this;
        function checkReady() {
            if (playing && timeupdate) {
                that.copyVideo = true;
            }
        }

        return video;
    }
    RenderVideo(projectionMatrix) {
        this.projectionMatrix = projectionMatrix;   
        this.drawScene(this.gl, this.programInfo, this.buffers, this.texture, 0);
    }
    initBuffers(gl) {
        // Create a buffer for the cube's vertex positions.

        const positionBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);       

          const positions = [
            // Front face
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0,
             1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0    
          ];
        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // Set up the normals for the vertices, so that we can compute lighting.

        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

        const vertexNormals = [
            // Front
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
            gl.STATIC_DRAW);

        // Now set up the texture coordinates for the faces.

        const textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

        const textureCoordinates = [
            // Front
            0.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0
          
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
            gl.STATIC_DRAW);

        // Build the element array buffer; this specifies the indices
        // into the vertex arrays for each face's vertices.

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // This array defines each face as two triangles, using the
        // indices into the vertex array to specify each triangle's
        // position.

        const indices = [
            0, 1, 2, 0, 2, 3    // front       
        ];

        // Now send the element array to GL

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices), gl.STATIC_DRAW);

        return {
            position: positionBuffer,
            normal: normalBuffer,
            textureCoord: textureCoordBuffer,
            indices: indexBuffer,
        };
    }
    //

    // Initialize a texture.
    //
    initTexture(gl) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Because video havs to be download over the internet
        // they might take a moment until it's ready so
        // put a single pixel in the texture so we can
        // use it immediately.
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            width, height, border, srcFormat, srcType,
            pixel);

        // Turn off mips and set  wrapping to clamp to edge so it
        // will work regardless of the dimensions of the video.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        return texture;
    }
    updateTexture(gl, texture,videoPlayer) {

        // if (videoPlayer.copyVideo) {
        //     const level = 0;
        //     const internalFormat = gl.RGBA;
        //     const srcFormat = gl.RGBA;
        //     const srcType = gl.UNSIGNED_BYTE;
        //     gl.bindTexture(gl.TEXTURE_2D, texture);
        //     gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, videoPlayer.video);
        // }
       
        var video= videoPlayer.getFrame();
        var data=video.data;

        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const width = video.cols;
        const height = video.rows;
        const border = 0;
        const srcType = gl.UNSIGNED_BYTE;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const pixel = new Uint8Array([0, 0, 255, 255]); 
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        width, height, border, srcFormat, srcType,
                        data);

       video.delete();
    }

    updateVertices(target){
        
        let pvtx=target.rect;
        this.updateTexture(this.gl, this.texture,target.videoPlayer);
        var  positionBuffer=this.buffers.position;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.bkColor=target.bkColor;
        const positions = [
            // Front face
            pvtx.pts[3].x,  pvtx.pts[3].y,  0.0,   
            pvtx.pts[0].x,  pvtx.pts[0].y,  0.0,
            pvtx.pts[1].x,  pvtx.pts[1].y,  0.0,
            pvtx.pts[2].x,  pvtx.pts[2].y,  0.0
         
          ];  
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);   

    }  
    drawScene(gl, programInfo, buffers, texture, deltaTime) {

        // Set the drawing position to the "identity" point, which is
        // the center of the scene.
        const modelViewMatrix = mat4.create();

        // Now move the drawing position a bit to where we want to
        // start drawing the square.

        mat4.translate(modelViewMatrix,     // destination matrix
            modelViewMatrix,     // matrix to translate
            [-0.0, 0.0, -5.45]);  // amount to translate
        mat4.rotate(modelViewMatrix,  // destination matrix
            modelViewMatrix,  // matrix to rotate
            0.0,     // amount to rotate in radians
            [0, 0, 1]);       // axis to rotate around (Z)
        mat4.rotate(modelViewMatrix,  // destination matrix
            modelViewMatrix,  // matrix to rotate
            0.0,// amount to rotate in radians
            [0, 1, 0]);       // axis to rotate around (X)

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexPosition);
        }

        // Tell WebGL how to pull out the texture coordinates from
        // the texture coordinate buffer into the textureCoord attribute.
        {
            const numComponents = 2;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
            gl.vertexAttribPointer(
                programInfo.attribLocations.textureCoord,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.textureCoord);
        }

        // Tell WebGL how to pull out the normals from
        // the normal buffer into the vertexNormal attribute.
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexNormal,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexNormal);
        }

        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

        // Tell WebGL to use our program when drawing

        gl.useProgram(programInfo.program);

        // Set the shader uniforms

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            this.projectionMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.normalMatrix,
            false,
            normalMatrix);

        if(testRemoveFlag==true)
         gl.uniform3f(programInfo.uniformLocations.bColor, this.bkColor[0],this.bkColor[1],this.bkColor[2]);
         else{
         gl.uniform3f(programInfo.uniformLocations.bColor, 1.0,0,0);
         }
        // Specify the texture to map onto the faces.

        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        {
            const vertexCount = 6;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }

    }
}