Algerian map
=======================
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/Reddine/Algerian-map?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Map of Algeria for jVectorMap and JQVMap jQuery plugin.

How i got the data points :
- Get an SVG file of the Algerian political map : http://en.wikipedia.org/wiki/File:Algeria_Wilayas-blank.svg
- Remove the transform attributes from the svg file using : http://jsfiddle.net/ecmanaut/2Wez8/
- Parse that file with the converter to get a Javascript file contains Map Data Points.