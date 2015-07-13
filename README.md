# soundsketch
#### Interactive audio visualization and manipulation

This is an application for visualizing and manipulating sound, written using the Web Audio API and html5 canvas. 
It is currently only supported in Google Chrome.
Click here for a [demo](https://youtu.be/oDw39MN-DgA) or visit the [site](http://soundsketch.parseapp.com).

#### Visualization
* each circle in the initial visualization represents a frequency value from the currently playing audio
* the position of each circle is based off of a spiral equation
* the top slider on the left convolves the audio with preloaded samples
* the bottom slider on the left adjusts the playback speed
* the pencil tool is a synthesizer
* the white circles that can be added and removed are lowpass filters, and the frequencies they filter are based off of their position and radius

#### Color Wheel
The color wheel is a custom control made with html5 canvas. 
The source is located in [public/scripts/colorwheel.js](https://github.com/lshap/soundsketch/blob/master/public/scripts/colorwheel.js).
