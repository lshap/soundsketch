var ColorWheel = function(rad, divId) {
    this.rad = rad;
    this.divId = divId;
};

ColorWheel.prototype = function() {
    var markers = [],
        colors = [],
        startX = 5,
        startY = 5,
        selectedMark = -1,
        wheelCanvas,
        wheelCtxt,
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
    * Calcualte the length of an (x,y) coordinate
    */
    var getLength = function(x, y) {
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y,2));
    };

   /**
    * Calculate a point in the color wheel's coordinates relative to it's center
    */
    var relToCenter = function(x, y) {
        return {x: (x - offsetX), y: (y - offsetY)};
    };

   /**
    * Calculate position relative to colorwheel's position from radius and angle
    */
    var relToWheel = function(radius, angle) {
        return {x: (x - offsetY), y: (y - offsetY)};
    };

   /**
    * Draw the background of the color wheel
    */
    var drawBackground = function() {
        wheelCtxt.clearRect(0, 0, width, width); 
        wheelCtxt.fillStyle = '#FFFFFF';
        wheelCtxt.arc(startX + width/2, startY + width/2, 5 + width/2, 0, Math.PI * 2);
        wheelCtxt.fill();
        wheelCtxt.drawImage(colorwheel,startX, startY, width, width);        
    };

   /**
    * Draw the given marker based on if it is selected and the color
    * that it hovers over 
    */
    var drawMarker = function(marker, selected, colorData) {
        wheelCtxt.beginPath();
        wheelCtxt.lineWidth = (selected) ? 5 : 3;
        wheelCtxt.strokeStyle = '#FFFFFF';

        var px = marker.x;
        var py = marker.y;

        var prel = relToCenter(px, py);

        // draw the marker background
        wheelCtxt.fillStyle = 'rgba(255, 255, 255, 0.5)';
        wheelCtxt.beginPath();

        var r = getLength(prel.x, prel.y);
        var angle = Math.atan2(prel.y, prel.x);
        var thet = (markerRad + 1)/r;

        var leftx = offsetX + r * Math.cos(angle - thet);
        var lefty = offsetY + r * Math.sin(angle - thet);

        var rightx = offsetX + r * Math.cos(angle + thet);
        var righty = offsetY + r * Math.sin(angle + thet);
            
        wheelCtxt.moveTo(offsetX, offsetY);
        wheelCtxt.lineTo(leftx, lefty);
        wheelCtxt.lineTo(rightx, righty);
        wheelCtxt.closePath();
        wheelCtxt.fill();

        // draw the marker based on the wheel color
        var rgbColor = 'rgba(' + colorData[0] + ',' + colorData[1] + ',' 
                               + colorData[2] + ',' + colorData[3] + ')'; 

        wheelCtxt.fillStyle = rgbColor;
        wheelCtxt.beginPath();
        wheelCtxt.arc(px, py, markerRad, 0, Math.PI * 2);   
        wheelCtxt.stroke();
        wheelCtxt.fill();
    };

   /**
    * Draw the color wheel
    */
    var draw = function() { 
        drawBackground();
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            var imgData = wheelCtxt.getImageData(marker.x, marker.y, 1, 1).data;
            colors[i] = [imgData[0], imgData[1], imgData[2]];
            drawMarker(marker, (selectedMark == i), imgData);
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
    var initContext = function(className) {
        wheelCanvas = document.getElementById(className);
        var widthPx = (this.width * 1.1) + 'px';

        $('.' + className).attr('width', widthPx);
        $('.' + className).attr('height', widthPx);
        wheelCtxt = wheelCanvas.getContext('2d');
    };

   /**
    * Uses x and y positions relative to the color wheel to calculate
    * a new marker position and update the given marker
    */
    var updateMarkerPosition = function(mouseX, mouseY, marker) {
        var radius = width/2 - markerRad;

        // calculate position relative to the color wheel's center 
        var posRel = relToCenter(mouseX, mouseY);
 
        var currRadius = getLength(posRel.x, posRel.y);
        var boundscheck = Math.pow(posRel.x, 2) + Math.pow(posRel.y, 2);
 
        // make sure the marker position stays within the color wheel bounds
        if (boundscheck < Math.pow(width/2 - markerRad, 2)) {
            marker.x = mouseX;
            marker.y = mouseY;
        } else {
            marker.x = offsetX + radius * posRel.x/currRadius;
            marker.y = offsetY + radius * posRel.y/currRadius; 
        }
    };

   /**
    * Update complement marker position for when a non-center marker is moved 
    */
    var moveComplementMarker = function(oldx, oldy, marker, complement) {
        var angleDelta = Math.atan2(oldy - offsetY, oldx - offsetX) -
                         Math.atan2(marker.y - offsetY, marker.x - offsetX); 
 
        var cx = complement.x - offsetX;
        var cy = complement.y - offsetY;
        var r = getLength(marker.x - offsetX, marker.y - offsetY);
 
        var angle = Math.atan2(cy, cx);
        angle += angleDelta;    
 
        complement.x = offsetX + r * Math.cos(angle);
        complement.y = offsetY + r * Math.sin(angle);
    }

   /**
    * Update complement marker position when center marker is moved
    */
    var moveMarkerRelToCenter = function(oldx, oldy, currRadius, marker, complement) {
        var oldRadius = getLength(oldx - offsetX, oldy - offsetY);
        var radiusDelta = Math.min(width/2, currRadius) - oldRadius;
 
        var angleDelta = Math.atan2(oldy - offsetY, oldx - offsetX) -
                         Math.atan2(marker.y - offsetY, marker.x - offsetX);
 
        var relPos = relToCenter(complement.x, complement.y);
        var angle = Math.atan2(relPos.y, relPos.x);
        angle -= angleDelta;

        var radius = getLength(relPos.x, relPos.y);

        if (radius + radiusDelta < (width/2 - markerRad)) {
            radius += radiusDelta;
        }
 
        complement.x = offsetX + radius * Math.cos(angle);
        complement.y = offsetY + radius * Math.sin(angle);
    };

   /**
    * Add mouse listeners to the color wheel
    */
    var addMouseListeners = function(className) {
        var $wheelCanvas = $('#' + className);
        $wheelCanvas.mousedown(function(ev) {
            var x = ev.offsetX;
            var y = ev.offsetY;
            selectedMark = markerIndex(x, y);
        });

        $wheelCanvas.mouseup(function(ev) {
            selectedMark = -1;
            draw();
        });
    
        $wheelCanvas.mousemove(function(ev) {
            if (selectedMark != -1) {
                $(this).trigger('change');
                var marker = markers[selectedMark];
 
                var oldx = marker.x;
                var oldy = marker.y;

                var x = ev.pageX - $(this).offset().left;
                var y = ev.pageY - $(this).offset().top;
                updateMarkerPosition(x, y, marker);
 
                switch(selectedMark) {
                    case -1:
                        return;
                    case 0:
                        moveComplementMarker(oldx, oldy, marker, markers[2]);
                        break;
                    case 1:
                        var relPos = relToCenter(x, y);
                        var currRadius = getLength(relPos.x, relPos.y);
                        moveMarkerRelToCenter(oldx, oldy, currRadius, marker, markers[0]);
                        moveMarkerRelToCenter(oldx, oldy, currRadius, marker, markers[2]);
                        break;
                    case 2:
                        moveComplementMarker(oldx, oldy, marker, markers[0]);
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
        width = this.rad,
        offsetX = startX + width/2,
        offsetY = startY + width/2;

        var startangle = (Math.random() * Math.PI);
        for (var i = 0; i < 3; i++) {
            markers[i] = getNewMarker(startangle, i); 
            var nextcolor = new Float32Array(3);
            colors[i] = nextcolor;
        }

        initContext(this.divId);
        $('#colorwheel').load(function() {
            draw();
        });

        addMouseListeners(this.divId);
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
        var px = markers[1].x;
        var py = markers[1].y;
        var r = getLength(px - offsetX, py - offsetY);
        return r;
    };

    return {
        init: init,
        getColors: getColors,
        getWidth: getWidth,
        getRadius: getRadius
    };
}();
