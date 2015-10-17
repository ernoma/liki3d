#!/bin/bash

shopt -s globstar
for file in ./*.png; do
  mv "$file" "${file%.png}.jpg"
done
