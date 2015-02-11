from flask import Flask, url_for, abort
from crossdomain import crossdomain
from xml.dom.minidom import parseString
from random import randint
import urllib
import urllib2
import json
import math

GOOGLE_API_KEY = ''

def find_path(start, points):
	def recur(last_point, remaining_points):
		if len(remaining_points) == 0: return ([last_point], 0)
		paths = []
		for point in remaining_points:
			new_points = [p for p in remaining_points if not p == point]
			path = recur(point, new_points)
			distance = math.sqrt((point['lat'] - last_point['lat']) ** 2 + (point['lng'] - last_point['lng']) ** 2)
			paths.append(([last_point] + path[0], distance + path[1]))
		minimum = paths[0]
		for path in paths:
			if path[1] < minimum[1]: minimum = path
		return minimum
	return recur(start, points)

app = Flask(__name__)

@app.route('/<k>/<origin>')
@crossdomain(origin='*')
def api_route(k, origin):
	k = int(k)
	url = 'https://maps.googleapis.com/maps/api/geocode/json?key=' + GOOGLE_API_KEY + '&address=' + urllib.quote(origin)
	response = urllib2.urlopen(url)
	data = json.loads(response.read())
	results = data['results']
	if len(results) == 0:
		abort(500, {})
	location = results[0]['geometry']['location']
	lat = location['lat']
	lng = location['lng']
	url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + str(lat) + ',' + str(lng) + '&key=' + GOOGLE_API_KEY
	response = urllib2.urlopen(url)
	data = json.loads(response.read())
	startName = lat + ',' + lng
	if(len(data['results']) > 0):
		startName = data['results'][0]['formatted_address']
	lowerlat = lat - 2
	lowerlng = lng - 2
	higherlat = lat + 2
	higherlng = lng + 2
	url = 'http://overpass-api.de/api/interpreter?data=' + urllib.quote('node[tourism=attraction](' + str(lowerlat) + ',' + str(lowerlng) + ',' + str(higherlat) + ',' + str(higherlng) + ');out;')
	response = urllib2.urlopen(url)
	data = response.read();
	dom = parseString(data);
	nodes = dom.getElementsByTagName('node');
	poi = []
	for node in nodes:
		nodeLat = float(node.attributes['lat'].value)
		nodeLng = float(node.attributes['lon'].value)
		name = ''
		for subnode in node.getElementsByTagName('tag'):
			if subnode.attributes['k'].value == 'name':
				name = str(subnode.attributes['v'].value)
				break
		if not name == '': poi.append({'name':name, 'lat':nodeLat, 'lng':nodeLng})
	average_lat = sum([point['lat'] for point in poi])/len(poi)
	average_lng = sum([point['lng'] for point in poi])/len(poi)
	mean_distance = sum([math.sqrt((point['lat'] - average_lat)**2 + (point['lng'] - average_lng)**2) for point in poi])/len(poi)
	factor = 2
	filtered = []
	while len(filtered) < k:
		filtered = [point for point in poi if math.sqrt((point['lat'] - average_lat)**2 + (point['lng'] - average_lng)**2) < mean_distance * factor]
		factor += 0.1
		if len(poi) < k: break
	i = 0
	while len(filtered) > k:
		if i + 1 < len(filtered):
			filtered.pop(randint(i, i + 1))
			i += 1
		else:
			i = 0
	path = find_path({'name':origin.title(), 'lat':lat, 'lng':lng}, filtered)
	return json.dumps(path)

if __name__ == '__main__':
	app.run(host='0.0.0.0')
