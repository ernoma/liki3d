#!/bin/bash

while read p; do
    zoom=${p:30:2} # 2 chars at columns 30-31
    x=${p:33:4}
    y=${p:38:4}
    dot="."
    url=${p:0} # chars on the line
    wget $url -O $zoom$dot$x$dot$y.png  #get url and output to new filename
done < tilenames.txt
