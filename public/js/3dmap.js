
var scene = undefined;
var camera = undefined;
var renderer = undefined;
var backgroundScene = undefined;
var backgroundCamera = undefined;

var stats = undefined;

var controls = undefined;

var terrainWidth = 2048;
var terrainHeight = 2048;

var origTerrainWidth = 300;
var origTerrainHeight = 300;

var projection = undefined;
var heightMap = undefined;

var gameBoard = undefined;
var pivotPoint = undefined;

var allObjects = [];
var tampereObjects = [];
var visit_tre_objects = [];
var pharmacies = [];
var cafees = [];
var shops = [];
var libraries = [];
var banks = [];
var mail_boxes = [];
var post_offices = [];
var swimming_halls = [];
var clefs = [];
var busses = [];
var landmarks = [];

var clefGeometry = undefined;
var busMesh = undefined;

var busUpdateIntervalID = undefined;

var textureNames = ["Love_Is_All_Bright_Logo_1024x1024.jpg", "treregionab_visittampere_posa_1024x1024.jpg", "verkosto_1024x1024.png"];

$(document).ready( function() {

    createLegend();

    var opts = {
	lines: 13, // The number of lines to draw
	length: 10, // The length of each line
	width: 5, // The line thickness
	radius: 15, // The radius of the inner circle
	corners: 1, // Corner roundness (0..1)
	rotate: 0, // The rotation offset
	direction: 1, // 1: clockwise, -1: counterclockwise
	color: '#000', // #rgb or #rrggbb or array of colors
	speed: 1, // Rounds per second
	trail: 60, // Afterglow percentage
	shadow: false, // Whether to render a shadow
	hwaccel: false, // Whether to use hardware acceleration
	className: 'spinner', // The CSS class to assign to the spinner
	zIndex: 2e9, // The z-index (defaults to 2000000000)
	top: '50%', // Top position relative to parent
	left: '50%' // Left position relative to parent
    };
    var target = document.getElementById('spinner');
    var spinner = new Spinner(opts).spin(target);
    $("#loading_text").append("<span>Tervetuloa, hetkinen...</span>");

    Physijs.scripts.worker = '/vendor/threejs/physijs/physijs_worker.js'
    Physijs.scripts.ammo = '/vendor/threejs/physijs/ammo.js';

    stats = initStats();

    //console.log(places);

    scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3(0, -1000, 0));

    camera = new THREE.PerspectiveCamera( 45, $('#webgl').innerWidth() / $('#webgl').innerHeight(), 0.1, 10000 );
    camera.position.set(0, 300, 600);
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({ alpha: true });
    //console.log($('#webgl').innerWidth());
    //console.log($('#webgl').innerHeight());
    renderer.setSize( $('#webgl').innerWidth(), $('#webgl').innerHeight());
    renderer.setClearColor(new THREE.Color(0xaaaaff, 1.0));
    document.getElementById('webgl').appendChild( renderer.domElement );

    controls = new THREE.TrackballControls(camera, renderer.domElement);

    projection = d3.geo.mercator()
	.translate([(terrainWidth + 5) / 2, (terrainHeight + 272) / 2])
	.scale(121500)
	.rotate([-27, 0, 0])
	.center([23.77570164 - 27, 61.47114807]); // mercator: 8734817,5 - x, 2646699;

    heightMap = new Array(origTerrainHeight);
    for (var i = 0; i < origTerrainHeight; i++) {
	heightMap[i] = new Array(origTerrainWidth);
    }

    pivotPoint = new THREE.Object3D();
    scene.add(pivotPoint);

    //var axes = new THREE.AxisHelper(200);
    //scene.add(axes);

    $("#loading_text").append('<br><span id="light_info">Laitetaan valot päälle</span>');
    addLights();
    
    $("#loading_text").append('<br><span id="bg_info">Ladataan taustakuvaa...</span>');
    setupBackground();

    $("#loading_text").append('<br><span id="terrain_info">Ladataan karttaa...</span>');
    showTerrain();
});

function setupBackground() {
    var texture = THREE.ImageUtils.loadTexture( '/images/backgrounds/2.jpg', undefined, function() {
	$("#bg_info").text('Ladataan taustakuva... valmista.');
    });
    texture.minFilter = THREE.LinearFilter;
    var backgroundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2, 0),
        new THREE.MeshBasicMaterial({
	    map: texture
        }));

    backgroundMesh.material.depthTest = false;
    backgroundMesh.material.depthWrite = false;

    backgroundScene = new THREE.Scene();
    backgroundCamera = new THREE.Camera();
    backgroundScene.add(backgroundCamera);
    backgroundScene.add(backgroundMesh);
}

function showTerrain() {
    setupTerrainHeight();
}

function setupTerrainHeight() {
    var terrainLoader = new THREE.TerrainLoader();
    $("#loading_text").append('<br><span id="height_info">Ladataan kartan korkeustietoja...</span>');
    terrainLoader.load('/data/tampere_height.bin', function(data) {
	//console.log(data);

    /*var data = [];
    for (var i = 0; i < origTerrainHeight; i++) {
	for (var j = 0; j < origTerrainWidth; j++) {
	    heightMap[i][j] = 0;
	}
    }*/
	modifyPlaneGeometryHeight(data);
        
	$("#loading_text").append('<br><span id="landmark_info">Ladataan maamerkkejä...</span>');
	showLandmarks();

	$("#loading_text").append('<br><span id="external_data_info">Ladataan paikkoja ja busseja...</span>');
	showExternalData();

	$("#height_info").text('Ladataan kartan korkeustietoja... valmista.');

	var $loading = $('#loading').hide();

    }, function(event) {
	console.log(event);
    }, function (event) {
	console.log(event);
    });
}

function addLights() {
    scene.add(new THREE.AmbientLight(0xbbbbbb));
        
    var spotLightFlare = new THREE.SpotLight(0xffffff);
    spotLightFlare.position.set(120, 610, -3000);
    spotLightFlare.castShadow = false;
    spotLightFlare.intensity = 0.5;
    scene.add(spotLightFlare);

    var textureFlare0 = THREE.ImageUtils.loadTexture("/images/lensflare/lensflare0.png");
    var textureFlare3 = THREE.ImageUtils.loadTexture("/images/lensflare/lensflare3.png");

    var flareColor = new THREE.Color(0xffaacc);
    var lensFlare = new THREE.LensFlare(textureFlare0, 200, 0.0, THREE.AdditiveBlending, flareColor);

    lensFlare.add(textureFlare3, 60, 0.6, THREE.AdditiveBlending);
    lensFlare.add(textureFlare3, 70, 0.7, THREE.AdditiveBlending);
    lensFlare.add(textureFlare3, 120, 0.9, THREE.AdditiveBlending);
    lensFlare.add(textureFlare3, 70, 1.0, THREE.AdditiveBlending);
    
    lensFlare.position.copy(spotLightFlare.position);
    scene.add(lensFlare);

    $("#light_info").text('Laitetaan valot päälle... valmista.');
}

function showLandmarks() {
    d3.csv("data/landmarks.csv", function(data) {
        //console.log(data);

	var loader = new THREE.OBJMTLLoader();

        for (var i = 0; i < data.length; i++) {
        
	    (function(data, i)
	     { loader.load("/3d/" + data[i].object_name + ".obj", "/3d/" + data[i].object_name + ".mtl", function(loadedMesh) {
		 //console.log(loadedMesh);
		 loadedMesh.scale.set(0.12, 0.12, 0.12);
		 coord = projection([data[i].lng, data[i].lat]);
		 //console.log(coord);
		 makeInitialTransformations(loadedMesh, coord);
		 if (data[i].object_name == "haulitorni") {
		     loadedMesh.position.z -= 1.4;
		 }
		 else if (data[i].object_name == "finlayson") {
                     loadedMesh.position.z += 0.35;
                 }
		 landmarks.push(loadedMesh);
		 pivotPoint.add(loadedMesh);
		 allObjects.push(loadedMesh);

		 if (landmarks.length == data.length) {
		     $("#landmark_info").text('Ladataan maamerkkejä... valmista.');
		 }
		 //scene.add(loadedMesh);
	     });
	     })(data, i);
	}
    });
}

function showExternalData() {
    var material = new THREE.MeshLambertMaterial({
        color: 0x00ffff
    });

    showTampereOpenData();

    //showOSMData();

    var loader = new THREE.STLLoader();

    loader.load("/3d/clef.stl", function (geometry) {
        //console.log(geometry);
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation(88.28013229370117, -107.79578018188477, -0.15874999761581415) );
	clefGeometry = geometry;

	//showTeostoVenues('http://api.teosto.fi/2014/municipality?name=TAMPERE&method=venues');
    });

    //showVisitTampereLocations('http://visittampere.fi/api/search', 0);

    var loader = new THREE.OBJMTLLoader();

    loader.load("/3d/bussi.obj", "/3d/bussi.mtl", function(loadedMesh) {
	busMesh = loadedMesh;

        busUpdateIntervalID = setInterval(showBusses, 1000);
    });

}

function makeInitialTransformations(mesh, coord) {

    var x = coord[0];
    x = Math.round(x / terrainWidth * origTerrainWidth);
    var y = coord[1];
    y = Math.round(y / terrainHeight * origTerrainHeight);
    coord = translate(coord);

    //console.log(coord);

    mesh.position.set(coord[0], -coord[1], heightMap[y][x]);
    mesh.rotation.x = Math.PI / 2;
}

function showOSMData() {
    
    var loader = new THREE.OBJMTLLoader();
    loader.load("/3d/icons/icon_pharmacy.obj", "/3d/icons/icon_pharmacy.mtl", function(loadedMesh) {
	$.getJSON("http://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%3Bnode(61.2740%2C23.3317%2C61.701%2C24.253)%5Bamenity%3Dpharmacy%5D%3B%0Aout%3B", function(data) {
	    //console.log("osm:", data);
	    for (var i = 0; i < data.elements.length; i++) {
		var mesh = loadedMesh.clone();
                mesh.scale.set(2, 2, 2);
                coord = projection([data.elements[i].lon, data.elements[i].lat]);
                //console.log(coord);
		makeInitialTransformations(mesh, coord);
		tampereObjects.push(mesh);
		pharmacies.push(mesh);
		allObjects.push(mesh);
                pivotPoint.add(mesh);
		//scene.add(mesh);
	    }
	});
    });

    loader.load("/3d/icons/icon_bank.obj", "/3d/icons/icon_bank.mtl", function(loadedMesh) {
        $.getJSON("http://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%3Bnode(61.2740%2C23.3317%2C61.701%2C24.253)%5Bamenity%3Dbank%5D%3B%0Aout%3B", function(data) {
            //console.log("osm:", data);
            for (var i = 0; i < data.elements.length; i++) {
                var mesh = loadedMesh.clone();
                mesh.scale.set(2, 2, 2);
                coord = projection([data.elements[i].lon, data.elements[i].lat]);
                //console.log(coord);
		makeInitialTransformations(mesh, coord);
                tampereObjects.push(mesh);
		banks.push(mesh);
		allObjects.push(mesh);
                pivotPoint.add(mesh);
		//scene.add(mesh);
            }
        });
    });

    loader.load("/3d/icons/icon_cafe.obj", "/3d/icons/icon_cafe.mtl", function(loadedMesh) {
        $.getJSON("http://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%3Bnode(61.2740%2C23.3317%2C61.701%2C24.253)%5Bamenity%3Dcafe%5D%3B%0Aout%3B", function(data) {
            //console.log("osm:", data);
            for (var i = 0; i < data.elements.length; i++) {
                var mesh = loadedMesh.clone();
                mesh.scale.set(2, 2, 2);
                coord = projection([data.elements[i].lon, data.elements[i].lat]);
                //console.log(coord);
		makeInitialTransformations(mesh, coord);
                tampereObjects.push(mesh);
		cafees.push(mesh);
		allObjects.push(mesh);
                pivotPoint.add(mesh);
		//scene.add(mesh);
            }
        });
    });

    loader.load("/3d/icons/icon_shop.obj", "/3d/icons/icon_shop.mtl", function(loadedMesh) {
        $.getJSON("http://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%3Bnode(61.2740%2C23.3317%2C61.701%2C24.253)%5Bshop%3Dsupermarket%5D%3B%0Aout%3B", function(data) {
            //console.log("osm:", data);
            for (var i = 0; i < data.elements.length; i++) {
                var mesh = loadedMesh.clone();
                mesh.scale.set(2, 2, 2);
                coord = projection([data.elements[i].lon, data.elements[i].lat]);
                //console.log(coord);
		makeInitialTransformations(mesh, coord);
                tampereObjects.push(mesh);
		shops.push(mesh);
		allObjects.push(mesh);
                pivotPoint.add(mesh);
		//scene.add(mesh);
            }
        });
    });

    loader.load("/3d/icons/icon_letter.obj", "/3d/icons/icon_letter.mtl", function(loadedMesh) {
        $.getJSON("http://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%3Bnode(61.2740%2C23.3317%2C61.701%2C24.253)%5Bamenity%3Dpost_box%5D%3B%0Aout%3B", function(data) {
            //console.log("osm:", data);
            for (var i = 0; i < data.elements.length; i++) {
                var mesh = loadedMesh.clone();
                mesh.scale.set(2, 2, 2);
                coord = projection([data.elements[i].lon, data.elements[i].lat]);
                //console.log(coord);
		makeInitialTransformations(mesh, coord);
                tampereObjects.push(mesh);
		mail_boxes.push(mesh);
		allObjects.push(mesh);
                pivotPoint.add(mesh);
		//scene.add(mesh);
            }
        });
    });

    loader.load("/3d/icons/icon_post_office.obj", "/3d/icons/icon_post_office.mtl", function(loadedMesh) {
        $.getJSON("http://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%3Bnode(61.2740%2C23.3317%2C61.701%2C24.253)%5Bamenity%3Dpost_office%5D%3B%0Aout%3B", function(data) {
            //console.log("osm:", data);
            for (var i = 0; i < data.elements.length; i++) {
                var mesh = loadedMesh.clone();
                mesh.scale.set(2, 2, 2);
                coord = projection([data.elements[i].lon, data.elements[i].lat]);
                //console.log(coord);
		makeInitialTransformations(mesh, coord);
                tampereObjects.push(mesh);
		post_offices.push(mesh);
		allObjects.push(mesh);
                pivotPoint.add(mesh);
		//scene.add(mesh);
            }
        });
    });
}

function showTampereOpenData() {
   
    var loader = new THREE.OBJMTLLoader();
    loader.load("/3d/icons/icon_swimming.obj", "/3d/icons/icon_swimming.mtl", function(loadedMesh) {
	$.getJSON("http://opendata.navici.com/tampere/opendata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=opendata:UIMAHALLIT&outputFormat=json&srsName=EPSG:4326", function(data) {
	    //console.log(data);
	    //console.log(loadedMesh);
	    for (var i = 0; i < data.features.length; i++) {
		var mesh = loadedMesh.clone();
                mesh.scale.set(2, 2, 2);
                coord = projection([data.features[i].geometry.coordinates[0], data.features[i].geometry.coordinates[1]]);
                //console.log(coord);
		makeInitialTransformations(mesh, coord);
                tampereObjects.push(mesh);
		swimming_halls.push(mesh);
		allObjects.push(mesh);
                pivotPoint.add(mesh);
		//scene.add(mesh);
	    }
	});
    });

    loader.load("/3d/icons/icon_library.obj", "/3d/icons/icon_library.mtl", function(loadedMesh) {
        $.getJSON("http://opendata.navici.com/tampere/opendata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=opendata:KIRJASTOT&outputFormat=json&srsName=EPSG:4326", function(data) {
            //console.log(data);
            //console.log(loadedMesh);
            for (var i = 0; i < data.features.length; i++) {
                var mesh = loadedMesh.clone();
                mesh.scale.set(2, 2, 2);
                if (data.features[i].geometry != null) {
                    coord = projection([data.features[i].geometry.coordinates[0], data.features[i].geometry.coordinates[1]]);
		    makeInitialTransformations(mesh, coord);
                    tampereObjects.push(mesh);
		    libraries.push(mesh);
		    allObjects.push(mesh);
                    pivotPoint.add(mesh);
		    //scene.add(mesh);
                }
            }
        });
    });
}

function calculateTileNumbers(zoom, minLat, minLng, maxLat, maxLng) {
    var xy = {
	minXY: calculateTileNumber(zoom, minLat, minLng),
	maxXY: calculateTileNumber(zoom, maxLat, maxLng)
    };

    return xy;
}

function calculateTileNumber(zoom, lat, lon) {

    var xy = {
        x: undefined,
        y: undefined,
    };

    var xtile = Math.floor((lon + 180) / 360 * (1<<zoom)) ;
    var ytile = Math.floor((1 - Math.log(Math.tan(toRad(lat)) + 1 / Math.cos(toRad(lat))) / Math.PI) / 2 * (1<<zoom));
    if (xtile < 0)
	xtile = 0;
    if (xtile >= (1<<zoom))
	xtile = ((1<<zoom)-1);
    if (ytile < 0)
	ytile = 0;
    if (ytile >= (1<<zoom))
	ytile = ((1<<zoom)-1);
    
    xy.x = xtile;
    xy.y = ytile;

    return xy;
}


function calculateTilesBounds(tileNumbers, zoomLevel) {
    var minX = tileNumbers.minXY.x < tileNumbers.maxXY.x ? tileNumbers.minXY.x : tileNumbers.maxXY.x;
    var maxX = tileNumbers.minXY.x > tileNumbers.maxXY.x ? tileNumbers.minXY.x : tileNumbers.maxXY.x;
    var minY = tileNumbers.minXY.y < tileNumbers.maxXY.y ? tileNumbers.minXY.y : tileNumbers.maxXY.y;
    var maxY = tileNumbers.minXY.y > tileNumbers.maxXY.y ? tileNumbers.minXY.y : tileNumbers.maxXY.y;

    console.log("minX, maxX, minY, maxY:", minX, maxX, minY, maxY);

    var unit = 1.0 / (1 << zoomLevel);

    //
    // calculate sw
    //
    var sw_bounds = calculateTileBounds(minX, maxY, zoomLevel);    
    //
    // calculate ne
    //
    var ne_bounds = calculateTileBounds(maxX, minY, zoomLevel);

    var bounds = {
	sw: {
	    lat: sw_bounds.minY,
	    lng: sw_bounds.minX
	},
	ne: {
	    lat: ne_bounds.maxY,
	    lng: ne_bounds.maxX
	}
    }
    return bounds;
}

function calculateTileBounds(tileX, tileY, zoom) {
    var bounds = {
        minY: tile2lat(tileY + 1, zoom),
        maxY: tile2lat(tileY, zoom),
        minX: tile2lon(tileX, zoom),
        maxX: tile2lon(tileX + 1, zoom)
    }

    return bounds;
}

function tile2lon(x, zoom) {
    return x / Math.pow(2.0, zoom) * 360.0 - 180;
}
 
function tile2lat(y, zoom) {
    var n = Math.PI - (2.0 * Math.PI * y) / Math.pow(2.0, zoom);
    return toDeg(Math.atan(sinh(n)));
}

function toDeg(rad) {
    return rad / (Math.PI / 180);
}

function toRad(degrees){
    return degrees * Math.PI / 180;
}

function sinh (arg) {
  return (Math.exp(arg) - Math.exp(-arg)) / 2;
}

function modifyPlaneGeometryHeight(data) {

    var URL = '/images/osm_tampere_large.jpg';
    //var URL = '/images/Rock_rauta_rakkaus_1024x1024.png';

    var texture = THREE.ImageUtils.loadTexture(URL, undefined, function () {
	$("#terrain_info").text('Ladataan karttaa... valmista.');
    });
    //console.log(texture);
    //var geometry = new THREE.PlaneGeometry(2048, 2048, 20, 20);
    var geometry = new THREE.PlaneGeometry(2048, 2048, origTerrainWidth - 1, origTerrainHeight - 1);
    var material = new THREE.MeshPhongMaterial({
	map: texture
    });
    
    //console.log(geometry.vertices.length);
    
    var j = 0;
    var k = 0;

    for (var i = 0, l = geometry.vertices.length; i < l; i++) {
	//var height = data[i] / 255 * 21;
	var height = data[i] / 65535 * 21;
	geometry.vertices[i].z = height;
	heightMap[j][k] = height;
	k++;
	if (k == origTerrainWidth) {
	    j++;
	    k = 0;
	}
    }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    //console.log(geometry);

    var ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;

    gameBoard = ground;
    scene.add(gameBoard);

    render();

    console.log("done modifying z");
}    

function showBusses() {
    var URL = 'http://data.itsfactory.fi/siriaccess/vm/json';
    
    $.getJSON(URL, function (data) {
        //console.log(data);

	var journeys = data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity;
	//console.log(journeys);

	// TODO remove journeys that do not exist anymore

	for (var i = 0; i < journeys.length; i++) {
	    var found = false;
	    for (var j = 0; j < busses.length; j++) {
		if (journeys[i].MonitoredVehicleJourney.VehicleRef.value == busses[j].journey.MonitoredVehicleJourney.VehicleRef.value) {
		    found = true;
		    // update mesh position
		    coord = projection([journeys[i].MonitoredVehicleJourney.VehicleLocation.Longitude, journeys[i].MonitoredVehicleJourney.VehicleLocation.Latitude]);
                    var x = Math.round(coord[0] / terrainWidth * origTerrainWidth);
                    var y = Math.round(coord[1] / terrainHeight * origTerrainHeight);
		    if (x >= 0 && y >= 0 && x < origTerrainWidth && y < origTerrainHeight) {
			makeInitialTransformations(busses[j], coord);
			busses[j].rotation.y = journeys[i].MonitoredVehicleJourney.Bearing * (Math.PI/180);
		    }
		    break;
		}
	    }
	    if (!found) {
		// new vehicle, add to scene
		var mesh = busMesh.clone();//new THREE.Mesh(busGeometry, mat);
		//console.log(mesh);
		//var box = new THREE.Box3().setFromObject( mesh );
		//console.log( box.min, box.max, box.size() );
		//mesh.rotation.x = 0.5 * Math.PI;
		//console.log(mesh);
		var height = 0.25967699344000716;
		coord = projection([journeys[i].MonitoredVehicleJourney.VehicleLocation.Longitude, journeys[i].MonitoredVehicleJourney.VehicleLocation.Latitude]);
		var x = Math.round(coord[0] / terrainWidth * origTerrainWidth);
		var y = Math.round(coord[1] / terrainHeight * origTerrainHeight);
		//console.log(x, y);
		if (x >= 0 && y >= 0 && x < origTerrainWidth && y < origTerrainHeight) {
		    makeInitialTransformations(mesh, coord);
		    mesh.rotation.y = journeys[i].MonitoredVehicleJourney.Bearing * (Math.PI/180);
		    mesh.journey = journeys[i];
		    busses.push(mesh);
		    pivotPoint.add(mesh);
		    allObjects.push(mesh);
		    //scene.add(mesh);
		}
	    }
	}
    });

    //clearInterval(busUpdateIntervalID);
}

function showVisitTampereLocations(URL, offset) {

    var params = {
	type: 'location',
	limit: 50,
	offset: offset,
	lang: 'fi'
    }

    $.getJSON(URL, params, function (data) {
	//console.log(data);
	
	for (var i = 0; i < data.length; i++) {
	    var postcode = null;
	    if (data[i].contact_info.postcode != null && $.isNumeric(data[i].contact_info.postcode)) {
		postcode = data[i].contact_info.postcode;
	    }
	    var address = data[i].contact_info.address;
	    var city = data[i].contact_info.city;

	    var full_address = "";

	    if (address != null) {
		full_address += address + ", ";
	    }
	    if (postcode != null) {
                full_address += postcode + ", ";
            }
	    if (city != null) {
                full_address += city;
            }
	    
	    if (full_address != null) {
	
		var addr = full_address.replace(/, /g, '%2C').replace(/ /g, '+');
		//console.log(addr);
		
		$.getJSON('http://api.okf.fi/gis/1/geocode.json?address=' + addr + '&lat=&lng=&language=fin', function(data) {
		    //console.log(data);

		    var textureNames = ["Rock_rauta_rakkaus_1024x1024.png", "treregionab_visittampere_posa_1024x1024.jpg", "verkosto_1024x1024.png"];

		    if (data.status == "OK") {
                        for (var j = 0; j < data.results.length; j++) {
                            for (var k = 0; k < data.results[j].address_components.length; k++) {
                                if (data.results[j].address_components[k].types[0] == 'administrative_area_level_3') {
                                    if (data.results[j].address_components[k].long_name == 'Tampere') { // <--- TODO!!!!
					var coord = projection([data.results[j].geometry.location.lng, data.results[j].geometry.location.lat]);
					    //console.log(coord);
					var x = Math.round(coord[0] / terrainWidth * origTerrainWidth);
					var y = Math.round(coord[1] / terrainHeight * origTerrainHeight);
					
					if (x >= 0 && y >= 0 && x < origTerrainWidth && y < origTerrainHeight) {
              				    // show cube
					    var dim = 5;
					    var boxGeometry = new THREE.BoxGeometry(dim, dim, dim);
					    var mesh = createMesh(boxGeometry, textureNames[Math.floor((Math.random() * 3))]);
					
					    makeInitialTransformations(mesh, coord);
					    mesh.position.z += dim / 2 * 1.2;
					    visit_tre_objects.push(mesh);
					    allObjects.push(mesh);
					    pivotPoint.add(mesh);
					    //scene.add(mesh);
					}
                                    }
                                    //break;
                                }
                            }
                        }
		    }
		});
	    }
	}

	if (data.length >= 50) {
	    showVisitTampereLocations(URL, offset + 50);
	}
    });
}

function showTeostoVenues(URL) {
    
    $.getJSON(URL, function (data) {
	console.log(data);

	var i = 0;
	getVenuesData(data, i);
    });
}

function getVenuesData(data, i) {

    if (i < data.venues.length - 1) {
	setTimeout(
	    function() { 
		$.getJSON(data.venues[i].url, function (result) {
		    //console.log(result.venue);

		    var found = false;
			
		    if (!found) {

			var height = 3.7648086547851562 * 0.4;
		    
			var mat = new THREE.MeshPhongMaterial({color: 0xffd700, specular: 0xffffff, shininess: 160, metal: true});
			var mesh = new THREE.Mesh(clefGeometry, mat);
			mesh.venue = result.venue;
			mesh.scale.set(2, 2, 2);

			var coord = projection([result.venue.place.geoCoordinates.longitude, result.venue.place.geoCoordinates.latitude]);
			var x = Math.round(coord[0] / terrainWidth * origTerrainWidth);
			var y = Math.round(coord[1] / terrainHeight * origTerrainHeight);
	    
			//console.log("x: " + x + ", y: " + y);

			if (x >= 0 && y >= 0 && x < origTerrainWidth && y < origTerrainHeight) {
			    makeInitialTransformations(mesh, coord);
			    mesh.position.z += height * 3;
			    
			    pivotPoint.add(mesh);
			    clefs.push(mesh);
			    allObjects.push(mesh);
			    //scene.add(mesh);
			}
		    }
		}).done(function(data, i) {
		    return function(result) {
			//console.log("in done, data: " + data + ", i: ", + i);
			getVenuesData(data, i+1);
		    };
		}(data, i)) // getJSON
	    }, 500); // setTimeout
    }
    else if (data.response_meta.next != "undefined") {
	showTeostoVenues(data.response_meta.next);
    }
}

function createMesh(geom, imageFileName) {
    var texture = THREE.ImageUtils.loadTexture("/images/" + imageFileName);
    var mat = new THREE.MeshPhongMaterial();
    mat.map = texture;
    
    var mesh = new THREE.Mesh(geom, mat);
    return mesh;
}

function render() {
    stats.update();

    for (var i = 0; i < clefs.length; i++) {
	clefs[i].rotation.y += 0.02;
    }

    for (var i = 0; i < tampereObjects.length; i++) {
	tampereObjects[i].rotation.y += 0.01;
    }

    for (var i = 0; i < visit_tre_objects.length; i++) {
	visit_tre_objects[i].rotation.y += 0.02;
    }

    controls.update();
    requestAnimationFrame(render);
    
    pivotPoint.rotation.x = gameBoard.rotation.x;
    pivotPoint.rotation.z = gameBoard.rotation.z;

    renderer.autoClear = false;
    renderer.clear();
    renderer.render(backgroundScene , backgroundCamera );
    renderer.render(scene, camera);
}


function translate(point) {
  return [point[0] - (terrainWidth / 2), point[1] - (terrainHeight / 2)];
}

function initStats() {
    var stats = new Stats();
    
    stats.setMode(0);  // 0: fps, 1: ms
    
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    
    document.getElementById("Stats-output").appendChild(stats.domElement);
    
    return stats;
}

$( window ).resize(function() {
    camera.aspect = $('#webgl').innerWidth() / $('#webgl').innerHeight();
    camera.updateProjectionMatrix();
    renderer.setSize($('#webgl').innerWidth(), $('#webgl').innerHeight());
});

//var projector = new THREE.Projector();

function onClick(event) {

    //console.log(event);

    if (event.which == 1) {

	var mouse = new THREE.Vector2((event.clientX / renderer.domElement.width ) * 2 - 1, -( (event.clientY) / renderer.domElement.height ) * 2 + 1);
	
	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects(allObjects, true);

	for (var i = 0; i < intersects.length; i++) {
            //console.log(intersects[0]);
	    //console.log(intersects[0].object.venue.name);

            intersects[i].object.material.transparent = true;
            intersects[i].object.material.opacity = 0.1;
	}
    }
}

$( window ).click(onClick);


function loadTexture(path) {
    var deferred = Q.defer();

    THREE.ImageUtils.loadTexture(path, null, function (loaded) {
	deferred.resolve(loaded);
    }, function (error) {
	deferred.reject(error);
    });

    return deferred.promise;
}

function loadSTLModel(path) {

    var deferred = Q.defer();
    
    var loader = new THREE.STLLoader();

    loader.load(path, function (loaded) {
	deferred.resolve(loaded);
    }, function (error) {
        deferred.reject(error);
    });

    return deferred.promise;
}

function loadOBJMTLModel(objPath, mtlPath) {

    var deferred = Q.defer();

    var loader = new THREE.OBJMTLLoader();

    loader.load(objPath, mtlPath, function (loaded) {
	deferred.resolve(loaded);
    }, function (error) {
        deferred.reject(error);
    });

    return deferred.promise;
}

function createLegend() {
    
    d3.csv("data/legend.csv", function(data) {
        //console.log(data);

	for (var i = 0; i < data.length; i++) {

	    item = '<div class="legend_list_item">';
	    item += '<div class="legend_name_column">' + data[i].legend + '</div>';
	    item += '<div class="legend_item_column"><input type="checkbox" name="' +  data[i].plural_name + '" checked data-on-text="Näytä" data-off-text="Piilota" id="cb_legend_' + data[i].icon_name + '"></div>';
	    item += '</div>';

	    $("#legend").append(item);

	    $('input[name="' + data[i].plural_name + '"]').on('switchChange.bootstrapSwitch', function(event, state) {
		//console.log(this); // DOM element
		//console.log(event); // jQuery event
		console.log(state); // true | false

		if (state == true) {
		    console.log("showing: " + this.name);
		    var objects = window[this.name];
		    for (var j = 0; j < objects.length; j++) {
			objects[j].traverse(function(child){child.visible = true;});
		    }
		}
		else {
		    console.log("hiding: " + this.name);
		    var objects = window[this.name];
                    for (var j = 0; j < objects.length; j++) {
			objects[j].traverse(function(child){child.visible = false;});
		    }
		}
	    });
	    
	    $('[name="' +  data[i].plural_name + '"]').bootstrapSwitch({size: 'mini'});
	}
    });
}
