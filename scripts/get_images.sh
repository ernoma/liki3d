#!/bin/bash

while read p; do
    zoom=${p:45:2} # 2 chars at columns 45-46
    x=${p:48:4}
    y=${p:53:4}
    dot="."
    url=${p:0} # chars on the line
    wget $url -O $zoom$dot$x$dot$y.png  #get url and output to new filename
done < tilenames_mapbox.txt
