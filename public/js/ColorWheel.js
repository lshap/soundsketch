var ColorWheel = function(rad) {
    this.rad = rad;
};

ColorWheel.prototype = function() {
    var markers = [],
        colors = [],
        startX = 5,
        startY = 5,
        selectedmark = -1,
        wheelcanvas,
        wheelctxt,
        markerRad,
        width;

   /**
    * Returns the index of the selected marker, or -1 if
    * no marker has been selected
    */
    var markerIndex = function(x, y) {
        var index = -1;
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            var px = marker.x;
            var py = marker.y;  

            var check = Math.pow(x - px, 2) + Math.pow(y - py, 2);
            if (check < Math.pow(markerRad, 2)) {
                index = i;
                break;
            }
        }
        return index;
    };

   /**
    * Draw the background of the color wheel
    */
    var drawBackground = function() {
        wheelctxt.clearRect(0, 0, width, width); 
        wheelctxt.fillStyle = '#FFFFFF';
        wheelctxt.arc(startX  + width/2, startY  + width/2, 5 + width/2, 0, Math.PI * 2);
        wheelctxt.fill();
        wheelctxt.drawImage(colorwheel,startX, startY, width, width);        
    };

   /**
    * Draw the given marker based on if it is selected and the color
    * that it hovers over 
    */
    var drawMarker = function(marker, selected, colorData) {
        wheelctxt.beginPath();
        wheelctxt.lineWidth = (selected) ? 5 : 3;
        wheelctxt.strokeStyle = '#FFFFFF';

        var px = marker.x;
        var py = marker.y;

        // draw the marker background
        wheelctxt.fillStyle = 'rgba(255, 255, 255, 0.5)';
        wheelctxt.beginPath();

        var offsetx = startX + width/2; 
        var offsety = startY + width/2;
        var r = Math.sqrt(Math.pow(px - offsetx, 2) + Math.pow(py - offsety, 2));
        var angle = Math.atan2(py - offsety, px - offsetx);
        var thet = (markerRad + 1)/r;

        var leftx = offsetx + r * Math.cos(angle - thet);
        var lefty = offsety + r * Math.sin(angle - thet);

        var rightx = offsetx + r * Math.cos(angle + thet);
        var righty = offsety + r * Math.sin(angle + thet);
            
        wheelctxt.moveTo(offsetx, offsety);
        wheelctxt.lineTo(leftx, lefty);
        wheelctxt.lineTo(rightx, righty);
        wheelctxt.closePath();
        wheelctxt.fill();

        // draw the marker based on the wheel color
        var rgbColor = 'rgba(' + colorData[0] + ',' + colorData[1] + ',' 
                               + colorData[2] + ',' + colorData[3] + ')'; 

        wheelctxt.fillStyle = rgbColor;
        wheelctxt.beginPath();
        wheelctxt.arc(px, py, markerRad, 0, Math.PI * 2);   
        wheelctxt.stroke();
        wheelctxt.fill();
    };

   /**
    * Draw the color wheel
    */
    var draw = function() { 
        drawBackground();
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            var imgData = wheelctxt.getImageData(marker.x, marker.y, 1, 1).data;
            colors[i] = [imgData[0], imgData[1], imgData[2]];
            drawMarker(marker, (selectedmark == i), imgData);
        }
    };

   /**
    * Initializes and returns a new marker object 
    */
    var getNewMarker = function(startangle, index) {
        var x = startX + width/2 + (width/2 - markerRad) * Math.cos(-Math.PI/6 * index + startangle);
        var y = startX + width/2 + (width/2 - markerRad) * Math.sin(-Math.PI/6 * index + startangle);
        return {x:x, y:y};
    };

   /**
    * Initialize the canvas context to draw the wheel on
    */
    var initContext = function() {
        wheelcanvas = document.getElementById('wheelcanvas');
        var widthPx = (this.width * 1.1) + 'px';

        $('#wheelcanvas').attr('width', widthPx);
        $('#wheelcanvas').attr('height', widthPx);
        wheelctxt = wheelcanvas.getContext('2d');
    };


   /**
    * Add mouse listeners to the color wheel
    */
    var addMouseListeners = function() {
        $('#wheelcanvas').mousedown(function(ev) {
            var x = ev.offsetX;
            var y = ev.offsetY;
            selectedmark = markerIndex(x, y);
        });

        $('#wheelcanvas').mouseup(function(ev) {
            selectedmark = -1;
            draw();
        });
    
        $('#wheelcanvas').mousemove(function(ev) {
            if (selectedmark != -1) {
                $(this).trigger('change');
                var marker = markers[selectedmark];
                var left = $(this).offset().left;
                var top = $(this).offset().top; 
 
                var ux = ev.pageX - left;
                var uy = ev.pageY - top;
 
                var oldx = marker.x;
                var oldy = marker.y;
 
                var offsetx = startX + width/2;
                var offsety = startY + width/2;
 
                var radius = width/2 - markerRad;
                var ax = ux - offsetx;
                var ay = uy - offsety;
 
                var currRadius = Math.sqrt(Math.pow(ax, 2) + Math.pow(ay, 2));
                var boundscheck = Math.pow(ux - offsetx, 2) + Math.pow(uy - offsety,2);
 
                if (boundscheck < Math.pow(width/2 - markerRad, 2)) {
                    marker.x = ux;
                    marker.y = uy;
                }
                else {
                    marker.x = offsetx + radius * ax/currRadius;
                    marker.y = offsety + radius * ay/currRadius; 
                }
 
                switch(selectedmark) {
                    case -1:
                    return;
                    break;
 
                    // complementary color
                    case 0:
                        var complement = markers[2];
 
                        var da = Math.atan2(oldy - offsety, oldx - offsetx) -
                             Math.atan2(marker.y - offsety, marker.x - offsetx); 
 
                        var cx = complement.x - offsetx;
                        var cy = complement.y - offsety;
                        var r = Math.sqrt(Math.pow(cx, 2) + Math.pow(cy, 2));
 
                        var angle = Math.atan2(cy, cx);
                        angle += da;    
 
                        complement.x = offsetx + r * Math.cos(angle);
                        complement.y = offsety + r * Math.sin(angle);
                        break;
                
                    // base color
                    case 1:
                        var oldR = Math.sqrt(Math.pow(oldx - (startX + width/2), 2) + 
                               Math.pow(oldy-(startY + width/2), 2));
                        var dr = Math.min(width/2, currRadius) - oldR;  
 
                        var da = Math.atan2(oldy - offsety, oldx - offsetx) -
                             Math.atan2(marker.y - offsety, marker.x - offsetx); 
 
                        var c1 = markers[0];
                        var c2 = markers[2];
 
                        var c1x = c1.x - (startX + width/2);
                        var c1y = c1.y - (startY + width/2);
                        var ang1 = Math.atan2(c1y, c1x);
                        ang1 -= da;
 
                        var c2x = c2.x - (startX + width/2);
                        var c2y = c2.y - (startY + width/2);
                        var ang2 = Math.atan2(c2y, c2x);
                        ang2 -= da;
 
                        var r1 = Math.sqrt(Math.pow(c1x, 2) + Math.pow(c1y, 2));
                        var r2 = Math.sqrt(Math.pow(c2x, 2) + Math.pow(c2y, 2));
 
                        if (r1 + dr < (width/2 - markerRad)) {
                            r1 += dr;
                        }
 
                        if (r2 + dr < (width/2 - markerRad)) {
                            r2 += dr;
                        }
 
                        c1.x = offsetx + r1 * Math.cos(ang1);
                        c1.y = offsety + r1 * Math.sin(ang1);
 
                        c2.x = offsetx + r2 * Math.cos(ang2);
                        c2.y = offsety + r2 * Math.sin(ang2);
                        break;
                    
                    /* complementary color */
                    case 2:
                        var complement = markers[0];
 
                        var da = Math.atan2(oldy - offsety, oldx - offsetx) -
                             Math.atan2(marker.y - offsety, marker.x - offsetx); 
 
                        var cx = complement.x - offsetx;
                        var cy = complement.y - offsety;
                        var r = Math.sqrt(Math.pow(cx, 2) + Math.pow(cy, 2));
 
                        var angle = Math.atan2(cy, cx);
                        angle += da;    
 
                        complement.x = offsetx + r * Math.cos(angle);
                        complement.y = offsety + r * Math.sin(angle);
                        break;  
                    default:
                        break;
                }
            }

            draw();
        });   
    };

   /**
    * Initialize the color wheel
    */
    var init = function() {
        markerRad = this.rad/15;
        width = this.rad;

        var startangle = (Math.random() * Math.PI);
        for (var i = 0; i < 3; i++) {
            markers[i] = getNewMarker(startangle, i); 
            var nextcolor = new Float32Array(3);
            colors[i] = nextcolor;
        }

        initContext();
        $('#colorwheel').load(function() {
            draw();
        });

        addMouseListeners();
    };

   /**
    * Return the colors currently selected in the color wheel
    */
    var getColors = function() {
        return colors;
    };

   /**
    * Return the width of the color wheel 
    */
    var getWidth = function() {
        return width;
    };

   /**
    * Return the radius of the color wheel 
    */
    var getRadius = function() {
        var offsetx = startX + width/2; 
        var offsety = startY + width/2;
        var px = markers[1].x;
        var py = markers[1].y;
        var r = Math.sqrt(Math.pow(px - offsetx, 2) + Math.pow(py - offsety, 2));
        return r;
    };

    return {
        init: init,
        getColors: getColors,
        getWidth: getWidth,
        getRadius: getRadius
    };
}();
