import json
import requests
from threading import Timer

all_venues = []

def getVenues(URL):
    r = requests.get(URL)
    result_json = r.json()
    i = 0
    getVenuesData(result_json, i)

def getVenuesData(result_json, i):
    #print "in getVenuesData()"
    if i < len(result_json['venues']):
        #print "set timer"
        timer = Timer(0.1, getVenueData, (result_json, i))
        timer.start()
    elif result_json['response_meta']['next']:
        #print "getting more"
        getVenues(result_json['response_meta']['next'])
    else:
        with open('teosto_venues.json', 'w') as outfile:
            json.dump(all_venues, outfile)

def getVenueData(result_json, i):
    #print "in getVenueData()"
    r = requests.get(result_json['venues'][i]['url'])
    data = r.json()
    print data['venue']['name']
    all_venues.append(data['venue'])
    getVenuesData(result_json, i+1)

if __name__ == "__main__":
    getVenues('http://api.teosto.fi/2014/municipality?name=TAMPERE&method=venues')
