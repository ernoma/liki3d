var INITIAL_LAT = 61.5;
var INITIAL_LON = 23.766667;
var zoom_level = 13;

var meta = undefined;
var intersections = undefined;
var devices = undefined;

var vehicle_signal_types = ["04", "06"];
var pedestrian_signal_types = ["10"];

var device_types = [];

var meta_names = [];
var signal_markers = [];
var signal_devices = [];

var osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 19
});
var mmlOrtoLayer = L.tileLayer('http://tiles.kartat.kapsi.fi/ortokuva/{z}/{x}/{y}.jpg', {
    attribution: 'Sisältää Maanmittauslaitoksen ortoilmakuva-aineistoa, <a href="http://www.maanmittauslaitos.fi/avoindata_lisenssi_versio1_20120501">lisenssi</a>, TMS: <a href="http://kartat.kapsi.fi/">kartat.kapsi.fi</a>',
    maxZoom: 19,
    minZoom: 13
});
var baseMaps = {
    "OpenStreetMap": osmLayer,
    "Ilmakuva, Maanmittauslaitos": mmlOrtoLayer
};

var map = undefined;

$(document).ready(function () {
    //$("#data_view")

    var junction_name = "306";

    map = L.map('junctions_map').setView([INITIAL_LAT, INITIAL_LON], zoom_level);
    mmlOrtoLayer.addTo(map);
    L.control.layers(baseMaps).addTo(map);
    map.on('baselayerchange', function(event) {
        if (event.layer == mmlOrtoLayer) {
            if (map.getZoom() < 13) {
                map.setZoom(13);
            }
        }
    });

    getTampereMeta()
	.then(getTrafficSignalDevices)
	.then(getIntersections)
	.then(function (data) { createIntersectionView('TRE', junction_name) })
	.then(function () { collectDeviceStatistics([junction_name]); })
	.done();
});

function clearIntersectionView() {
    $("#data_view span").remove();
    $("#data_view select").remove();
    $("#data_view h1").remove();
    $("#data_view table").remove();
    //$("#junctions_map div").remove();

    for (var i = 0; i < signal_markers.length; i++) {
	map.removeLayer(signal_markers[i]);
    }

    meta_names = [];
    signal_markers = [];
    signal_devices = [];
}

function createIntersectionView(city, junction_name) {

    $("#data_view").prepend('<h1>Liittymä ' + city + junction_name + '</h1>');
    
    var junctions_select = '<span>Valitse liittymä:</span><select id="junction_select" class="form-control">';
    for (var i = 0; i < meta.length; i++) {
	var selected = meta[i].location == (city + junction_name) ? ' selected' : '';
	if (meta[i].location == city + junction_name) {
	    console.log(meta[i].location);
	}
	junctions_select += '<option' + selected + '>' + meta[i].location + '</option>';
    }
    junctions_select += '</select>';
    $("#data_view").prepend(junctions_select);

    $("#junction_select").on('change', function (event) {
	
    	var name = $("#junction_select option:selected").text();
	clearIntersectionView();
	name = name.substring(3, name.length);
	//console.log(name);
	createIntersectionView('TRE', name);
    });

    //
    // add meta data for the intersection
    //
    for (var i = 0; i < meta.length; i++) {
	if (meta[i].location == city + junction_name) {
	    var all_contents = '<table class="table table-condensed table-bordered">';
	    var header = '<tr><th>index</th>';
	    var content = '<tr><td>name</td>';
	    for (var j = 0; j < meta[i].signals.length; j++) {
		header += '<th>' + meta[i].signals[j].index + '</th>';
		content += '<td>' + meta[i].signals[j].name + '</td>';
		meta_names.push(meta[i].signals[j].name);
	    }
	    header += '</tr>';
	    content += '</tr>';
	    all_contents += header + content + '</table>';
	    $("#signals_meta").append(all_contents);
	    break;
	}
    }

    //
    // add basic data for the intersection
    //
    for (var i = 0; i < intersections.features.length; i++) {
	if (intersections.features[i].properties.NUMERO == junction_name) {
	    //console.log(intersections.features[i]);
	    var intersection = intersections.features[i];
	    var contents = '<table class="table table-condensed table-bordered">';
	    
	    contents += '<tr>';
	    contents += '<th>id</th>';
	    var contents2 = '<tr>';
	    contents2 += '<td>' + intersection.id.toLowerCase() + '</td>';
	    for (var property in intersection.properties) {
		if (intersection.properties.hasOwnProperty(property)) {
		    //console.log(property);
		    contents += '<th>';
		    contents += property.toLowerCase();
		    contents += '</th>';
		    contents2 += '<td>';
		    var val = intersection.properties[property];
                    contents2 += val != null ? String(val).toLowerCase() : val;
                    contents2 += '</td>';
		}
	    }
	    contents += '</tr>';
	    contents2 += '</tr>';
	    contents += contents2;
	    contents += '</table>';
	    $("#basic_info").append(contents);
	    break;
	}
    }
    
    //console.log(devices);

    //
    // add device data for the intersection
    //
    var all_contents = '<table class="table table-condensed table-bordered">';
    var first = true;
    for (var i = 0; i < devices.features.length; i++) {

	if (devices.features[i].properties.LIITTYMAN_NIMI == junction_name) {
	    //console.log(devices.features[i]);
	    var device = devices.features[i];

	    if (first) {
		var contents = '<tr>';
		contents += '<th>id</th>';
		for (var property in device.properties) {
                    if (device.properties.hasOwnProperty(property)) {
			//console.log(property);
			contents += '<th>';
			contents += property.toLowerCase();
			contents += '</th>';
		    }
		}
		contents += '</tr>';
		all_contents += contents;
		first = false;
	    }
	    var contents = '<tr>';
            contents += '<td>' + device.id.toLowerCase() + '</td>';
	    for (var property in device.properties) {
                if (device.properties.hasOwnProperty(property)) {
                    //console.log(property);
                    contents += '<td>';
                    var val = device.properties[property];
                    contents += val != null ? String(val).toLowerCase() : val;
                    contents += '</td>';
                }
            }
            contents += '</tr>';
	    all_contents += contents;
	}
    }
    //console.log(all_contents);
    all_contents += '</table>';
    $("#devices").append(all_contents);

    showSignals(city, junction_name);
}

function showSignals(city, junction_name) {
    //var vehicle_signal_types = ["3 X 200", "1 X 200"];
    //var pedestrian_signal_types = ["2 X 200 JALANKULKIJA"];

    var latlngs = [];

    var all_contents = '<table class="table .table-striped">';
    all_contents += '<tr><th>vehicle / pedestrian</th><th>laite_id</th><th>meta name</th><th>angle</th></tr>';

    for (var i = 0; i < devices.features.length; i++) {
        if (devices.features[i].properties.LIITTYMAN_NIMI == junction_name) {
	    if (inVehicleSignalTypes(devices.features[i].properties.TYYPPI_KOODI)) {
		//console.log(devices.features[i]);
		var device = devices.features[i];
		signal_devices.push(device);
		var latlng = [device.geometry.coordinates[1], device.geometry.coordinates[0]];
		var icon = new L.Icon({iconUrl: '/images/vehicle_signal.png', iconSize: [20, 20], iconAnchor: [10, 20]});
		var marker = new L.Marker(latlng, {icon: icon, iconAngle: 0, title: device.properties.LAITE_ID });
		map.addLayer(marker);
		signal_markers.push(marker);
		latlngs.push(latlng);
		
		row_content = '<tr><td>v</td><td>' + device.properties.LAITE_ID + '</td><td>';
		// TODO add name select
		row_content += '<select class="form-control" id="signal_meta_name_' + device.properties.LAITE_ID + '">';
		for (var j = 0; j < meta_names.length; j++) {
		    if (meta_names[j].charAt(0) != '_') {
                        row_content += '<option>' + meta_names[j] + '</option>';
                    }
		}
		row_content += '</select></td><td>'
		// add range slider
		row_content += '<span>0</span> <input class="signal_angle_slider" id="signal_angle_slider_' + device.properties.LAITE_ID + '" type="text" data-slider-min="0" data-slider-max="360" data-slider-step="1" data-slider-value="0"> <span>360</span>';
		row_content += '</td></tr>';
		all_contents += row_content;
	    }
	    else if(inPedestrianSignalTypes(devices.features[i].properties.TYYPPI_KOODI)) {
		//console.log(devices.features[i]);
                var device = devices.features[i];
		signal_devices.push(device);
		var latlng = [device.geometry.coordinates[1], device.geometry.coordinates[0]];
		var icon = new L.Icon({iconUrl: '/images/pedestrian_signal.png', iconSize: [20, 20], iconAnchor: [10, 20]})
                var marker = new L.Marker(latlng, {icon: icon, iconAngle: 90, title: device.properties.LAITE_ID });
		map.addLayer(marker);
		signal_markers.push(marker);
                latlngs.push(latlng);

		row_content = '<tr><td>p</td><td>' + device.properties.LAITE_ID + '</td><td>';
		// TODO add name select
		row_content += '<select class="form-control" id="signal_meta_name_' + device.properties.LAITE_ID + '">';
		for (var j = 0; j < meta_names.length; j++) {
		    if (meta_names[j].charAt(0) == '_') {
			row_content += '<option>' + meta_names[j] + '</option>';
		    }
		}
		row_content += '</select></td><td>'
		// add range slider
		row_content += '<span>0</span> <input class="signal_angle_slider" id="signal_angle_slider_' + device.properties.LAITE_ID + '" type="text" data-slider-min="0" data-slider-max="360" data-slider-step="1" data-slider-value="90"> <span>360</span>';
		row_content += '</td></tr>';
		all_contents += row_content;

	    }
	}
	// TODO: add laite_id for each marker, add row for each laite_id with place for meta_name and slider to adjust angle, save button 
	
    }

    var bounds = new L.LatLngBounds(latlngs);
    map.fitBounds(bounds);

    all_contents += '</table>';
    $("#signals").append(all_contents);

    $('.signal_angle_slider').slider();
    $('.signal_angle_slider').on('slide', function (event) {
	//console.log(event);
	var parts = this.id.split('_');
	var id = parts[parts.length-1];
	//console.log(id);
	for (var i = 0; i < signal_markers.length; i++) {
	    //console.log(signal_markers[i]);
	    if (signal_markers[i].options.title == id) {
		//console.log("found");
		signal_markers[i].setIconAngle(event.value);
		break;
	    } 
	}
	//$('#signal_angle_input_' + device.properties.LAITE_ID).text(event.value);
    });
    $("#signals_save_button").on('click', function() {
	// TODO send signal data to the server where it is stored to the csv file
	signals = [];
	for (var i = 0; i < signal_devices.length; i++) {
	    //console.log($("#signal_meta_name_" + signal_devices[i].properties.LAITE_ID + " option:selected").text());
	    var meta_name = $("#signal_meta_name_" + signal_devices[i].properties.LAITE_ID + " option:selected").text();
	    var angle = $("#signal_angle_slider_" + signal_devices[i].properties.LAITE_ID).attr('value');
	    console.log(signal_devices[i].properties.LAITE_ID + "," + meta_name + "," + angle);
	    signals.push({
		id: signal_devices[i].properties.LAITE_ID,
		meta_name: meta_name,
		angle: angle
	    });
	}
	var data = {
	    city: city,
	    junction: junction_name,
	    signals: signals
	};
	$.ajax("junction", {
	    data: JSON.stringify(data),
	    contentType : 'application/json',
	    type : 'POST'
	});
    });
}

function inVehicleSignalTypes(device_type) {
    for (var i = 0; i < vehicle_signal_types.length; i++) {
	if (vehicle_signal_types[i] == device_type) {
	    return true;
	}
    }
}

function inPedestrianSignalTypes(device_type) {
    for (var i = 0; i < pedestrian_signal_types.length; i++) {
        if (pedestrian_signal_types[i] == device_type) {
	    //console.log("found");
            return true;
        }
    }
}

function collectDeviceStatistics(junctions) {
    for (var i = 0; i < devices.features.length; i++) {
	for (var j = 0; j < junctions.length; j++) {
	    if (devices.features[i].properties.LIITTYMAN_NIMI == junctions[j]) {

    		var found = false;	
		for (var k = 0; k < device_types.length; k++) {
		    if (devices.features[i].properties.TYYPPI_KOODI == device_types[k].type_code) {
			device_types[k].count++;
			found = true;
			break;
		    }
		}
		if (!found) {
		    if (devices.features[i].properties.TYYPPI_KOODI == null) {
			console.log(devices.features[i]);
		    }
		    device_types.push({
			type: devices.features[i].properties.TYYPPI,
			type_code: devices.features[i].properties.TYYPPI_KOODI,
			count: 1
		    });
		}
	    }
	}
    }
    //for (var j = 0; j < device_types.length; j++) {
	//console.log(device_types[j].type_code + " " + device_types[j].type + " " + device_types[j].count);
    //}
}

function getTampereMeta() {
    var deferred = Q.defer();

    $.getJSON('http://data.itsfactory.fi/trafficlights/meta/tampere', function(data) {
	//console.log(data);
	meta = data.Meta;

	deferred.resolve(data);
    });

    return deferred.promise;
}

function getIntersections() {
    var deferred = Q.defer();

    $.getJSON('http://opendata.navici.com/tampere/opendata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=opendata:WFS_LIIKENNEVALO_LIITTYMA&outputFormat=json&srsName=EPSG:4326', function(data) {
	//console.log(data);
	intersections = data;
	deferred.resolve(data);
    });

    return deferred.promise;
}

function getTrafficSignalDevices() {
    var deferred = Q.defer();

    $.getJSON('http://opendata.navici.com/tampere/opendata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=opendata:WFS_LIIKENNEVALO_LAITE&outputFormat=json&srsName=EPSG:4326', function(data) {
	//console.log(data);
	devices = data;

	deferred.resolve(data);
    });

    return deferred.promise;
}


//
// Traffic lights meta information contains necessary index information for each traffic light that is used when receiving the real time traffic light data
//
function updateTrafficLightsMeta() {
    var URL = 'http://data.itsfactory.fi/trafficlights/meta/tampere';

    $.getJSON(URL, function (data) {
        //console.log(data);

        traffic_light_meta = data.Meta[0].signals;

        if (trafficLightIntervalID == undefined) {
            trafficLightIntervalID = setInterval(updateTrafficLights, 1000); // Update traffic lights states once per second
            setInterval(updateTrafficLightsMeta, 604800000); // Update meta information once per week
        }
    });
}

