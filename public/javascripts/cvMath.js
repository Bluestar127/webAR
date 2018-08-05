function cvMath(){
    let self=this;
    this.diff = function(v1, v2) {
        if (v1.x !== undefined) return { x: v1.x - v2.x, y: v1.y - v2.y };
        return v1.map((value, index) => value - v2[index]);
      }

      
     this.norm = function(vector) {
        if (vector.x !== undefined) return Math.sqrt(vector.x*vector.x+vector.y*vector.y);
        return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
      }
      this.getCenter=function(vector){
          var cx=0;
          var cy=0;
          for (let i=0 ;i<vector.length;i++){
            cx+=vector[i].x;
            cy+=vector[i].y;
          }
          return new cv.Point(cx/vector.length,cy/vector.length);
      }
}
