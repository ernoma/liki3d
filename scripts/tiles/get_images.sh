#!/bin/bash

while read p; do
    zoom=${p:38:2} # 2 chars at columns 38-39
    x=${p:41:5}
    y=${p:47:5}
    dot="."
    url=${p:0} # chars on the line
    wget $url -O $zoom$dot$x$dot$y.png  #get url and output to new filename
done < tilenames_junction.txt
