import json
import requests

meta = None
intersections = None
devices = None

def getTampereMeta():
    r = requests.get('http://data.itsfactory.fi/trafficlights/meta/tampere')
    meta = r.json()
    print meta

def getTrafficSignalDevices():
    r = requests.get('http://opendata.navici.com/tampere/opendata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=opendata:WFS_LIIKENNEVALO_LAITE&outputFormat=json')
    devices = r.json()
    print devices

def getIntersections():
    r = requests.get('http://opendata.navici.com/tampere/opendata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=opendata:WFS_LIIKENNEVALO_LIITTYMA&outputFormat=json')
    intersections = r.json()
    print intersections

#        getVenues(result_json['response_meta']['next'])
#        with open('teosto_venues.json', 'w') as outfile:
#            json.dump(all_venues, outfile)
#    all_venues.append(data['venue'])

if __name__ == "__main__":
    getTampereMeta();
    getTrafficSignalDevices();
    getIntersections();
