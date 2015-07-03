$(document).ready(function() {

    var soundSketch = function () {
        DrawMode = {
            PEN:0,
            FILTER:1,
            NONE:2
        };

        var audioContext;
        var audioSource;
        var soundbuffer;
        var analyser;

        var paused = false;
        var pausetime;
        var freqDomain;
        var timeDomain;
        var $canvas;
        var ctxt;
        var SAMPLE_MAX = 256;
        var WIDTH = window.innerWidth;
        var HEIGHT = window.innerHeight * 0.95;
        var BACKGROUND_CANVAS_WIDTH = 800;
        var BACKGROUND_CANVAS_HEIGHT = 600;
        var lastAmps;
        var frame = 0;
        var drawmode = 2;
        var interp = 0;
        var filterShapes = []; 
        var filters = [];

        var oscillator;

        var convolvers = [];
        var currconvolve = -1;
        var convolver = null;


        var mousedownx;
        var mousedowny;
        var clicktime;
        var mousedownID = -1;
        
        var sceneDisplayed = false;            
        var drawing = false;
        var drawingFilter = false;
        var noiseLines = [];    

        var cwheel;

        /* number between 0.1 and 2 proportional to the change in playback speed */
        var spacing = 1;

        /* rate at which the frames are updated*/
        var framespeed = 1;

       /**
        * Reset the canvas size on window resize
        */
        window.onresize = function() {
            WIDTH = window.innerWidth;
            HEIGHT = window.innerHeight * 0.95;
            $canvas.attr('width', WIDTH);
            $canvas.attr('height', HEIGHT);
        }

       /**
        * Load a convolver audio node with mp3 from the given url 
        */
        function loadConvolver(url) {
            // Load asynchronously
            var convolvernode = audioContext.createConvolver();
            var request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';

            request.onload = function() {
                var data = request.response;
                audioContext.decodeAudioData(data, function(buffer) {
                    convolvernode.buffer = buffer;
                    convolvers.push(convolvernode);
                });
            };

            request.send();
        }


       /**
        * Draw a circle on the html canvas
        */
        function drawCircle(context, x, y, r, fill) {
            context.beginPath();
            context.fillStyle = fill; 
            context.arc(x, y, r, 0, Math.PI * 2);
            context.fill();
        }

       /**
        * Initialize the page 
        */
        var init = function() {
            cwheel = new ColorWheel(100);
            cwheel.init();

            var canvas = document.getElementById('canvas'); 
            ctxt = canvas.getContext('2d');    
            
            $canvas = $('#canvas');
            $canvas.attr('width', WIDTH);
            $canvas.attr('height', HEIGHT);
            addCanvasMouseListeners();

            initBackgroundCanvas();
            $canvas.hide();

            $('#wavedistortion').slider({max: 4, min: 0, slide: wavedistortionChange, step: 0.2});
            $('#playbackspeed').slider({min: 0, max: 2, slide: playbackspeedChange, step: 0.1, value: 1});

             try {
                 // Fix up for prefixing
                 window.AudioContext = window.AudioContext || window.webkitAudioContext;
                 audioContext = new AudioContext();
             } catch(e) {
                 alert('Web Audio API is not supported in this browser');
             }

            initWaveShaper();
            loadConvolver('impulses/parrallel.wav');
            loadConvolver('impulses/sequence.wav');
            loadConvolver('impulses/gaspistol.wav');
            loadConvolver('impulses/concrete.wav');
        };

       /**
        * Draw the floating circles in the background of the page
        */
        function drawFloatingCircles(canvas, floatingCircles) {
            var context = canvas.getContext('2d');
            context.clearRect(0,0, canvas.width, canvas.height);

            for (var i = 0; i < floatingCircles.length; i++) {
                $(this).trigger('change');
                var nextCircle = floatingCircles[i];
            
                if (nextCircle.reachedDest()) {
                    nextCircle.selectNewDest();
                }

                nextCircle.step(); 
                drawCircle(context, nextCircle.x, nextCircle.y,
                           nextCircle.r, nextCircle.color);
            }

            var redraw = function () {
                drawFloatingCircles(canvas, floatingCircles);
            };

            if (!sceneDisplayed)  {
                requestAnimationFrame(redraw);
            }
        }

       /**
        * Helper for drawing floater background circles
        */
        var BackgroundCircle = function(backWidth, backHeight, r, color) {
            var getRandomPositionInCanvas = function(r) {
                var randx = r + Math.random() * (backWidth - 2 * r);
                var randy = r + Math.random() * (backHeight - 2 * r);

                return {x: randx, y: randy}; 
            };

            var startPosition = getRandomPositionInCanvas(r); 
            var destPosition = getRandomPositionInCanvas(r); 

            this.r = r;
            this.color = color;
            this.x = startPosition.x;
            this.y = startPosition.y;
            
            this.destx = destPosition.x;
            this.desty = destPosition.y;

            this.step = function() { 
                var dx = (this.destx - this.x)/(10 * Math.abs(this.destx - this.x));
                var dy = (this.desty - this.y)/(10 * Math.abs(this.desty - this.y));

                this.x += dx;
                this.y += dy;
            };

            this.reachedDest = function() {
                return (Math.abs(this.x - this.destx) < 0.0001 &&
                        Math.abs(this.y - this.desty) < 0.0001);
            };

            this.selectNewDest = function() {
                var newPos = getRandomPositionInCanvas(this.r);
                this.destx = newPos.x;
                this.desty = newPos.y;
            };

            return this;
        };

       /**
        * Draw some random floating circles in the background of the welcome page
        */
        function initBackgroundCanvas() {
            var backCanvas = document.getElementById('backgroundcanvas');
            $('#backgroundcanvas').attr('width', BACKGROUND_CANVAS_WIDTH + 'px');
            $('#backgroundcanvas').attr('height', BACKGROUND_CANVAS_HEIGHT + 'px');
 
            var backWidth = 0.8 * BACKGROUND_CANVAS_WIDTH;
            var backHeight = 0.5 * BACKGROUND_CANVAS_HEIGHT;
 
            var backColors = [getRGBAColorString([127, 241, 227], 0.34),
                              getRGBAColorString([255, 255, 0], 0.56),
                              getRGBAColorString([255, 0, 254], 0.37)];
            var floatingCircles = [];

            // initialize some randomly floating circles with radius >=10 and radius < 50 
            for (var i = 0; i < 15; i++) {
                var r = 10 + Math.random() * 40;
                var color = backColors[(i % 3)]; 

                floatingCircles.push(new BackgroundCircle(backWidth, backHeight, r, color));
            }
            drawFloatingCircles(backCanvas, floatingCircles);
        }
        
       /**
        * Load a sound from an input mp3 file
        */
        function loadSound(file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                soundbuffer = e.target.result;
                playSound(soundbuffer, 0);
            }                
            
            reader.readAsArrayBuffer(file);
        }
 
       /**
        * Create a wave shaper node to distort the sound
        */
        function initWaveShaper() {
            audioContext.createWaveShaper();
        }

       /**
        * Return a string in the form of 'rgba(r, g, b, a)' for the given color
        */
        function getRGBAColorString(colorArray, opacity) {
            return 'rgba(' + colorArray[0] + ',' + colorArray[1] + ',' 
                           + colorArray[2] + ',' + opacity + ')';
        }
 
        function drawSound(freqDomain, scale, opacity) {
            if (!paused) {
                for (var freq = 0; freq < freqDomain.length; freq++) {
                    var x, y, r;
                    var amp = freqDomain[freq];
 
                    // interpolate between spiral and reverse spiral
                    r = Math.abs(Math.pow(amp/SAMPLE_MAX, 2)) * 50 * scale; 
 
                    if (interp <= 1) {    
                        var sx = 0.2 * freq * Math.cos(freq); 
                        var sy = 0.2 * freq * Math.sin(freq); 
                        
                        var rev = 1024 - freq;
                        var rx =  0.3 * rev * Math.cos(rev);
                        var ry =  0.3 * rev * Math.sin(rev);
 
                        x = (1 - interp) * sx + interp * rx;
                        y = (1 - interp) * sy + interp * ry;
                    } else if (interp <= 2) { // rev spiral and epicycloid
                        var rev = 1024 - freq;
                        var rx =  0.3 * rev * Math.cos(rev);
                        var ry =  0.3 * rev * Math.sin(rev);
 
                        var a = freq/1024 * 200;
                        var b = a / 7;
                        var ex = (a + b) * Math.cos(freq) - b * Math.cos((a / b + 1)*freq); 
                        var ey = (a + b) * Math.sin(freq) - b * Math.sin((a / b + 1)*freq);
 
                        var i = interp - 1;
                        x = (1 - i) * rx + i * ex;
                        y = (1 - i) * ry + i * ey;
                    } else if (interp <= 3) { // epicycloid and reverse epi
                        var rev = 1024 - freq;
                        var a = freq/1024 * 200;
                        var b = a / 7;
                        var ex = (a + b) * Math.cos(freq) - b * Math.cos((a / b + 1)*freq); 
                        var ey = (a + b) * Math.sin(freq) - b * Math.sin((a / b + 1)*freq);
 
                        var rex = (a + b) * Math.cos(rev) - b * Math.cos((a / b + 1)*rev); 
                        var rey = (a + b) * Math.sin(rev) - b * Math.sin((a / b + 1)*rev);
 
                        var i = interp - 2;
                        x = (1 - i) * ex + i * rex;
                        y = (1 - i) * ey + i * rey;
                    } else { // rev epi and hyp
                        var a = freq/1024 * 200;
                        var b = a / 7;
                        var rev = 1024 -freq;
                        var rex = (a + b) * Math.cos(rev) - b * Math.cos((a / b + 1)*rev); 
                        var rey = (a + b) * Math.sin(rev) - b * Math.sin((a / b + 1)*rev);
 
                        var c = 150;
                        var hx = (a - b) * Math.cos(freq) - c * Math.cos((a / b - 1)*freq);
                        var hy = (a - b) * Math.sin(freq) - c * Math.sin((a / b - 1)*freq);
 
                        var i = interp - 3;
                        x = (1 - i) * rex + i * hx;
                        y = (1 - i) * rey + i * hy;
                    }
 
                    x = x * spacing * scale + WIDTH/2;
                    y = y * spacing * scale + HEIGHT/2;
                    
                    var lastamp = lastAmps[freq];
                    var delta = (lastamp - amp);
                    
                    // determine colors
                    var colors = cwheel.getColors();
                    var fill;
                    var adjustedOpacity = r/30 * 0.9 * opacity;
                    if (delta > 1) {
                        fill = getRGBAColorString(colors[0], adjustedOpacity); 
                    } else if (delta < -1) {
                        fill = getRGBAColorString(colors[1], adjustedOpacity); 
                    } else {
                        fill = getRGBAColorString(colors[2], adjustedOpacity); 
                    }
                    drawCircle(ctxt, x, y, r, fill); 
                }
            }
        }
 
        function drawAndAnalyzeSound() {
            requestAnimationFrame(drawAndAnalyzeSound);
            if (frame % 10 != 0) {
                frame ++;
                return;
            }
 
            if (frame % framespeed != 0) {
                frame++;
                return;
            }
        
            var freqDomain = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(freqDomain);
            drawConvolver();
            drawSound(freqDomain, 1, 1);
            drawLines();
            drawFilters();            
 
            lastAmps = freqDomain;
            frame++;
        }
 
        function drawLines() {
            ctxt.beginPath();
            ctxt.strokeStyle = '#000000';
            for (var i = 0; i < noiseLines.length; i++) {
 
                if (noiseLines[i].length > 0 ) { 
                    var start = noiseLines[i][0];
                    ctxt.moveTo(start.x, start.y);    
                    
                    for (var j = 1; j < noiseLines[i].length; j++) {
                        var next = noiseLines[i][j];
                        ctxt.lineTo(next.x, next.y);
                    }    
                
                    ctxt.stroke();
                }
 
            }
 
            ctxt.strokeStyle = '#FFFFFF';
        }
 
       /**
        * Draw the frequence filters
        */
        function drawFilters() {
            var fill = getRGBAColorString([255, 255, 255], 0.7);
            for (var i = 0; i < filterShapes.length; i++) {
                filter = filterShapes[i];
                drawCircle(ctxt, filter.x, filter.y, filter.r, fill);
            }
        }
 
       /**
        * Play sound from a buffer at a given start time 
        */
        function playSound(buffer, starttime) {
            // disconnect if there is already a song uploaded
            if (audioSource) {
                audioSource.disconnect(0);
            }
            
            audioSource = audioContext.createBufferSource();
            audioContext.decodeAudioData(buffer, function(buffer_data) {
                audioSource.buffer = buffer_data; 
 
                // set up the AudioAnalserNode
                analyser = audioContext.createAnalyser();
                lastAmps = new Float32Array(analyser.frequencyBinCount);
                audioSource.connect(analyser);
                audioSource.start(0, starttime);

                drawAndAnalyzeSound();
                applyAudioEffects();
 
                $('#welcome-container').hide();
                $('#info').hide();
                $('#scene-container').show().children().show();
                sceneDisplayed = true;
            });
        }        
        
        function allowDrop(ev) {
            ev.preventDefault();
        }
        
        function drop(ev) {
            ev.preventDefault();
            var data = ev.dataTransfer.files[0];    
            if (data) {
                loadSound(data);
            }
        }
 
       /**
        * Draw the convolver representation lightly at 5x scale in the background
        */
        function drawConvolver() {
            if (!paused) {
                ctxt.clearRect(0, 0, WIDTH, HEIGHT);
                if (currconvolve > -1) {
                    var timeDomain = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteTimeDomainData(timeDomain);
                    drawSound(timeDomain, 5, 0.1);
                }    
            }
        }
 
       /**
        * Apply all of the selected effects to the audio source
        */
        function applyAudioEffects() {
            audioSource.disconnect(0);
            audioSource.playbackRate.value = 1 / spacing;
            var source = audioSource; // save state

            // apply the selected convolver
            if (currconvolve >=0) {
                audioSource.connect(convolvers[currconvolve]);
                convolvers[currconvolve].connect(audioContext.destination);
            }
                
            // apply filters
            for (var i = 0; i < filters.length; i++) {
                var filter = filters[i];
                audioSource.connect(filter);
                audioSource = filter;    
            }
 
            analyser.connect(audioContext.destination);
            audioSource.connect(analyser);
            audioSource = source; // restore state
        }
 
       /**
        * Add an oscillator noise for pen draw mode
        */
        function initOscillator() {
            var osc = audioContext.createOscillator();
            osc.type = 'sine';
            osc.connect(audioContext.destination);
            return osc;
        }
 
       /**
        * Calculate a frequency based on an (x,y) position on the canvas
        * using the inverse of the parametric spiral function scaled to
        * the current scale of the scene
        */
        function getFrequencyForPos(x, y) {
            var freq;
            var a = (x - WIDTH/2)/(0.2 * spacing); // freq * cos(freq)
            var b = (y - HEIGHT/2)/(0.2 * spacing); // freq * sin(freq)
            var f = Math.atan(b/a);
            
            if (a < 0 && Math.cos(f) > 0) {
                f += Math.PI;
            }

            freq = Math.min(1024, a / Math.cos(f));    
            return freq;
        }
 
        function addFilter(newfilter) {
            if (newfilter.r > 0) {    
                var filter = audioContext.createBiquadFilter();
                filter.type = filter.LOWPASS;
                filter.frequency.value = getFrequencyForPos(newfilter.x, newfilter.y); 
                filter.Q.value = 1 / newfilter.r;
                filters.push(filter);
                applyAudioEffects();
            }
        }
 
       /**
        * Update which convolver is applied based on the wave distortion slider value
        * and update the interp value, which is used in determining the drawing pattern
        */
        function wavedistortionChange(event, ui) {
            interp = ui.value;
            currconvolve = Math.floor(interp - 1);
            applyAudioEffects();
        }
 

       /**
        * Update the spacing of the circles and the frame speed based off of the play
        * back speed slider value
        */
        function playbackspeedChange(event, ui) { 
            spacing = Math.max(0.1, ui.value);
            if (spacing > 1) {
                framespeed = Math.floor((spacing - 1)/0.1);
            }            
            applyAudioEffects();
        }
 
        $('#menucontainer').mouseover(function (event){
            if (sceneDisplayed && !drawing && !drawingFilter) {
                $('#menu').show();
            }    
        });
 
        $('#menucontainer').mouseout(function (event) {
            $('#menu').hide();
        });
 
        $('#wheelcanvas').change(function(){
            applyAudioEffects();
        });
 
        $('#uploadimage').click(function() {
            $('#filepicker').click();
        });
 
        $('#uploadimage').mouseover(function() {
            var im = document.getElementById('uploadimage');
            im.src='images/upload_hover.png';
        });
 
        $('#uploadimage').mouseout(function() {
            var im = document.getElementById('uploadimage');
            im.src='images/upload.png';
        });
 
        $('#preloadimage').click(function() {
            var request = new XMLHttpRequest();
            request.open('GET', 'music/suchgreatheights.mp3', true);
            request.responseType = 'arraybuffer';
 
            request.onload = function() {
                soundbuffer = request.response; 
                playSound(request.response, 0);    
            };
 
            request.send();
        });
 
        $('#preloadimage').mouseover(function() {
            var im = document.getElementById('preloadimage');
            im.src='images/preload-selected.png';
        });
 
        $('#preloadimage').mouseout(function() {
            var im = document.getElementById('preloadimage');
            im.src='images/preload.png';
        });
 
        $('#info').mouseover(function(){
            var im = document.getElementById('info');
            im.src = 'images/info_hover.png';
        });
 
        $('#info').mouseout(function(){
            if ($('#overlay').is(':visible') == false) {
                var im = document.getElementById('info');
                im.src = 'images/info.png';
            }
        });
 
        $('#info').click(function() {
            if ($('#overlay').is(':visible')) {
                $('#information').effect('drop',{direction:'right'}, 400);
                $('#overlay').effect('fade');
                var im = document.getElementById('info');
                im.src = 'images/info.png';
            }
            else {
                $('#overlay').show();
                $('#information').effect('slide',{direction:'right'},400);
                var im = document.getElementById('info');
                im.src = 'images/info_hover.png';
            }
        });
 
        $('#convolve').change(function(evt) {
            convolver = audioContext.createConvolver();
            var reader = new FileReader();
            var file = evt.target.files[0];
            reader.onload = function (e) {
                audioContext.decodeAudioData(e.target.result, function(buffer) {
                    convolver.buffer = buffer;
                    applyAudioEffects();
                });
            }
            reader.readAsArrayBuffer(file);
        });
 
        $('#filepicker').change(function(evt) {
            var file = evt.target.files[0];
            loadSound(file);    
        });
 
        $('#pause').click(function(){
            if (paused) {
                playSound(soundbuffer, pausetime);
                paused = false;
                this.src = 'images/pauseBtn.png';
                $('#home').hide();
            }
            else {
                audioSource.stop();    
                paused = true;
                pausetime = audioContext.currentTime;
                this.src = 'images/pauseBtn_selected.png';
                $('#home').show();
            }
        });
 
        $('#penimage').click(function(){
            switch(drawmode){
                case DrawMode.PEN:
                    this.src = 'images/pencilBtn.png'
                    drawmode = DrawMode.NONE;
                break;
                case DrawMode.NONE:
                    this.src = 'images/pencilBtn_selected.png'
                    drawmode = DrawMode.PEN;
                break;
                case DrawMode.FILTER:
                    var $filt = $('#filterimage');
                    $filt.attr('src', 'images/filterBtn.png');
 
                    this.src = 'images/pencilBtn_selected.png'
                    drawmode = DrawMode.PEN;
                default:
            }
        });
 
        $('#filterimage').click(function(){
            switch(drawmode){
                case DrawMode.FILTER:
                    this.src = 'images/filterBtn.png'
                    drawmode = DrawMode.NONE;
                break;
                case DrawMode.NONE:
                    this.src = 'images/filterBtn_selected.png'
                    drawmode = DrawMode.FILTER;
                break;
                case DrawMode.PEN:
                    var pen = $($('#penimage'))[0];
                    pen.src = 'images/pencilBtn.png';
                    this.src = 'images/filterBtn_selected.png'
                    drawmode = DrawMode.FILTER;
                default:
            }
        });
 
        $('#home').click(function() {
            window.location.reload();
        });
 
       /**
        * Add mouse event listener functions to the canvas
        */
        function addCanvasMouseListeners() {
            $canvas.mousedown(function (event) {
                mousedownx = event.pageX;
                mousedowny = event.pageY;

                var d = new Date();
                clicktime = d.getTime();

                if (drawmode == DrawMode.PEN) {
                    drawing = true;
                    var nextline = [];
                    noiseLines.push(nextline);                    
         
                    oscillator = initOscillator();
                    oscillator.start(0);
                } else if (drawmode == DrawMode.FILTER){
                    drawingFilter = true;
                    var filter = {r:0};
         
                    var offsetX = $(this).offset().left;
                    var offsetY = $(this).offset().top;

                    filter.x = event.pageX - offsetX;
                    filter.y = event.pageY - offsetY;    
                    filterShapes.push(filter);

                    if (mousedownID == -1) {
                        mousedownID = setInterval(whilemousedown, 100);
                    }
                }
            });

            $canvas.mousemove(function (event) {
                var offsetX = $(this).offset().left;
                var offsetY = $(this).offset().top;
                if (drawing && drawmode == DrawMode.PEN) {
                    var line = noiseLines[noiseLines.length - 1];
                    
                    var px = event.pageX - offsetX;
                    var py = event.pageY - offsetY
                    var nextpt = {x: px, y:py};
                    line.push(nextpt);
                    oscillator.frequency.value = getFrequencyForPos(px, py);
                }
         
                else if (drawingFilter && drawmode == DrawMode.FILTER) {
                    var filter = filterShapes[filterShapes.length - 1];
                    var d = new Date();
                    var deltaT = d.getTime() - clicktime;     
                    var r = Math.max(0, deltaT/10);
                    filter.r = r;        
                }
            });    
         
            $canvas.mouseup(function (event) {
                var dist = Math.sqrt(Math.pow(event.pageX - mousedownx, 2) + 
                           Math.pow(event.pageY - mousedowny, 2));
         
                if (drawmode == DrawMode.FILTER) {
                    drawingFilter = false;
                    // clear mousedown
                    if (mousedownID != -1) {
                        clearInterval(mousedownID);
                        mousedownID = -1;
                    }
                    // add a sound filter
                    if (filterShapes.length > 0) {
                        var newfilter = filterShapes[filterShapes.length - 1];
                        if (newfilter.r < 1) {
                            filterShapes.splice(filterShapes.length - 1, 1);
                        }
         
                        addFilter(newfilter);
                    }
         
                    var d = new Date();
                    var deltaT = d.getTime() - clicktime;
         
                    if (deltaT < 100) {
                        var offsetX = $(this).offset().left;
                        var offsetY = $(this).offset().top;
         
                        // check to see if we need to remove a filter
                        for (var i = 0; i < filterShapes.length; i++) {
                            var nextfilter = filterShapes[i];
                            var xc = nextfilter.x;
                            var yc = nextfilter.y;
                            var x = event.pageX - offsetX;
                            var y = event.pageY - offsetY;
         
                            if (Math.sqrt(Math.pow(xc - x, 2) + Math.pow(yc - y, 2)) 
                                < nextfilter.r) {
                                filterShapes.splice(i, 1); // remove this filter
                                filters.splice(i, 1);
                                applyAudioEffects();
                                break;
                            }
                        }
                    }
                } else if (drawmode == DrawMode.PEN) {
                    drawing = false;
         
                    if (noiseLines.length > 0) {
                        var newline = noiseLines[noiseLines.length - 1];
                        noiseLines.splice(noiseLines.length -1, 1);
                        oscillator.stop();
                    }
                }
            });
        }
 
        function whilemousedown() {
            var d = new Date();
            var deltaT = d.getTime() - clicktime;     
            var r = Math.max(0, deltaT/10);
            var newfilter = filterShapes[filterShapes.length -1];
            newfilter.r = r;
        }
 

        $('#backBtn').click(function() {
            window.location.reload();
        });

        return {init: init};
    }();
    
    soundSketch.init();
});


