from subprocess import call
#import os
from osgeo import gdal
#from apihelper import info
import math

base_path = '/mnt/linkstation/harrastus/maps/mml/korkeusmalli_2m_etrs89/etrs89/ascii_grid/'

vrt_command = 'gdalbuildvrt temp/tampere.vrt '
gdalwarp_command = 'gdalwarp -s_srs EPSG:3067 -t_srs '
gdal_translate_command = 'gdal_translate -scale '
gdal_translate_bin_command = 'gdal_translate -scale '

with open('filelist.txt', 'r') as f:
    for line in f:
        #print line
        #print line[:2]
        path = base_path + line[:2] + '/' + line[:3] + '/'
        #print path
        file_path = path + line[:6] + '.zip'
        #call('cp ' + file_path + ' temp/', shell=True)
        #call('unzip temp/'+ line[:6] + '.zip', shell=True)
        vrt_command += 'temp/' + line[:6] + '.asc '

call(vrt_command, shell=True)

with open('gdalwarp_params.txt', 'r') as f:
    lines = f.readlines()
    parts = lines[1].split(',')
    #print parts[2][:-1]
    gdalwarp_command += parts[0] + ' -te ' + parts[1] + ' -ts ' + parts[2][:-1] + ' temp/tampere.vrt temp/tampere_height.tif'
    #print gdalwarp_command
    #call(gdalwarp_command, shell=True)

datafile = gdal.Open("temp/tampere_height.tif")
band = datafile.GetRasterBand(1)
minmax = band.ComputeRasterMinMax()
gdal_translate_command += str(math.floor(minmax[0])) + ' ' + str(math.ceil(minmax[1])) + ' 0 65535 -outsize 50% 50% -ot UInt16 -of PNG temp/tampere_height.tif temp/tampere_height.png'
#print gdal_translate_command
#call(gdal_translate_command, shell=True) 

gdal_translate_bin_command += str(math.floor(minmax[0])) + ' ' + str(math.ceil(minmax[1])) + ' 0 65535 -outsize 300 300 -ot Uint16 -of ENVI temp/tampere_height.tif temp/tampere_height.bin'
#print gdal_translate_bin_command
call(gdal_translate_bin_command, shell=True)

#geoinformation = datafile.GetGeoTransform()
#print geoinformation
#print datafile.GetMetadata()
#print dir(geoinformation)
#print [method for method in dir(geoinformation) if callable(getattr(geoinformation, method))]
#print "[ RASTER BAND COUNT ]: ", datafile.RasterCount
#info(datafile.GetDriver())
#print datafile.__class__.__name__
#print len(geoinformation)
#print(geoinformation[1])
