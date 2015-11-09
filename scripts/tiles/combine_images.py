from subprocess import call
import os

pngs = []

for file in os.listdir("."):
    if file.endswith(".jpg"):
        pngs.append(file)

xs = set()
ys = set()

for png in pngs:
    fileNameParts = png.split('.')
    #print fileNameParts[1]
    zoom = fileNameParts[0]
    xs = xs.union([fileNameParts[1]])
    ys = ys.union([fileNameParts[2]])

xs = sorted(xs)
ys = sorted(ys)

fileNames = ""

for y in ys:
    params = '';
    for x in xs:
        fileNames += zoom + '.' + x + '.' + y + '.jpg' + ' ';
        
    #print fileNames.strip()

params += fileNames.strip() + ' -tile ' + str(len(xs)) + 'x' + str(len(ys)) + ' -geometry 256x256+0+0 ' + zoom + '.jpg'

print params
call("montage " + params, shell=True)

#print xs
#print ys
