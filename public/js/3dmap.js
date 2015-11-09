//
// Three.js basic objects
//
var scene = undefined;
var camera = undefined;
var renderer = undefined;

//
// For viewing nice photo behind the map
//
var backgroundScene = undefined;
var backgroundCamera = undefined;

//
// Show fps (or other) info to help application development 
//
var stats = undefined;

//
// For user to navigate around the scene
//
var controls = undefined;

//
// Size of the map plane
//
var terrainWidth = 2048;
var terrainHeight = 2048;
//
// Size of the terrain height map.
//
var origTerrainWidth = 300;
var origTerrainHeight = 300;

//
// For projecting lng,lat coordinates to the coordinates of the map plane shown on the screen
//
var projection = undefined;

//
// For modifying map plane height based on the National Land Survey Of Finland data
//
var heightMap = undefined;

//
// The map plane shown for the user
//
var areaMap = undefined;
//
// Pivot point is unnecessary in this case and Three.JS meshes could be added directly to scene
//
var pivotPoint = undefined;

//
// These arrays are used for storing meshes to help for iterating over them in various occasions
//
var allObjects = [];
var tampereObjects = [];
var visit_tre_objects = [];
var clefs = [];
var busses = [];
var landmarks = [];
var pharmacies = [];
var cafees = [];
var shops = [];
var libraries = [];
var banks = [];
var restaurants = [];
var mail_boxes = [];
var post_offices = [];
var swimming_halls = [];

//
// These arrays are used to avoid adding a mesh to the same location twice
//
var visit_tre_locations = [];
var teosto_locations = [];

//
// These are used to avoid having unnecessary geometry, material and mesh duplicates. Could do this also other way
//
var clefGeometry = undefined;
var clefMaterial = new THREE.MeshPhongMaterial({color: 0xffd700, specular: 0xffffff, shininess: 160, metal: true});
var visitTreMesh = undefined;
var busMesh = undefined;

//
// OpenStreetMap data is read from this server
//
var overpass_server = "http://overpass.osm.rambler.ru/cgi/interpreter"; // http://overpass-api.de/api/interpreter

//
// These are used for showing progress information for the user. Could instead read file sizes on disk.
//
var neula_size = 1347 + 274550;
var klingendahl_size = 896 + 39779;
var tampella_size = 391 + 11613;
var torni_size = 802 + 593244;
var trikoo_size = 536 + 90330;
var frenckell_size = 596 + 76587;
var haulitorni_size = 359 + 403808;
var tako_size = 380 + 71590;
var kehrasaari_size = 238 + 27806;
var attila_size = 590 + 168299;
var pyynikki_size = 407 + 360267;
var finlayson_size = 391 + 116086;
var hatanpaa_size = 534 + 15698;
var sarvis_size = 389 + 7403;
var total_landmarks_size = neula_size + klingendahl_size + tampella_size + torni_size + trikoo_size + frenckell_size + haulitorni_size + tako_size + kehrasaari_size + attila_size + pyynikki_size + finlayson_size + hatanpaa_size + sarvis_size;
var loaded_landmarks_size = 0;

//
// See the previous comment
//
var swimming_icon_size = 352 + 9162;
var library_icon_size = 207 + 11352;
var bus_icon_size = 1091 + 171356;
var clef_icon_size = 267784;
var pharmacy_icon_size = 498 + 11956;
var cafe_icon_size = 204 + 4346;
var shop_icon_size = 354 + 12840;
var restaurant_icon_size = 202 + 13687;
var letter_icon_size = 202 + 2453;
var post_office_icon_size = 657 + 4771;
var bank_icon_size = 662 + 47152;
var total_icons_size = swimming_icon_size + library_icon_size + bus_icon_size + clef_icon_size +
    pharmacy_icon_size + cafe_icon_size + shop_icon_size + restaurant_icon_size +
    letter_icon_size + post_office_icon_size + bank_icon_size;
var loaded_icons_size = 0;


$(document).ready( function() {

    //
    // Introduction shown for the user when opening the application 
    //
    $('#introduction_ok_button').on('click', function(event) {
	$('#introduction').hide();
    });

    //
    // Show legend panel for the user to show/hide data at the map  
    //
    createLegend();
    //
    // Minimize event handlers are used in the UI to show and hide various info windows
    //
    createMinimizeEventHandlers();

    //stats = initStats();

    scene = new THREE.Scene();

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

    //
    // For info see, for example blog from Bjørn Sandvik: http://blog.thematicmapping.org/2013/10/terrain-building-with-threejs-part-1.html
    // 
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

    addLights();
    
    $("#loading_text").append('<br><span id="bg_info">Ladataan taustakuvaa...</span>');
    setupBackground();
}); // $(document).ready

/*******************************************************************************
 * Setup functionality
 ******************************************************************************/

//
// Show a nice photo behind the map
//
function setupBackground() {
    var texture = THREE.ImageUtils.loadTexture( '/images/backgrounds/2.jpg', undefined, function() {
	$("#bg_info").text('Ladataan taustakuva... valmis.');
	$("#loading_text").append('<br><span id="terrain_info">Ladataan karttaa...</span>');
	showTerrain();
    }, function (event) {
        console.log(event);
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

//
// Construct the map UI, starting with the map plane
//
function showTerrain() {
    var terrainLoader = new THREE.TerrainLoader();
    $("#loading_text").append('<br><span id="height_info">Ladataan kartan korkeustietoja...</span>');
    terrainLoader.load('/data/tampere_height.bin', function(data) {
	//console.log(data);

	modifyPlaneGeometryHeight(data);
        
	$("#loading_text").append('<br><span id="landmark_info">Ladataan maamerkkejä...</span>');
	showLandmarks();

	$("#height_info").text('Ladataan kartan korkeustietoja... valmis.');

    }, function(event) {
	//console.log(event);
	if (event.total != null && event.loaded != null) {
	    var percentProgress = Math.round(event.loaded / event.total * 100);
	    //console.log(percentProgress);
	    $("#height_info").text('Ladataan kartan korkeustietoja... ' + percentProgress + '% ladattu');
	}
    }, function (event) {
	console.log(event);
    });
}

//
// Without lights nothing is shown in the scene
//
function addLights() {
    scene.add(new THREE.AmbientLight(0xbbbbbb));

    //
    // For nice introduction to Three.JS see the book "Learning Three.js: The JavaScript 3D Library for WebGL - Second Edition", https://www.packtpub.com/web-development/learning-threejs-javascript-3d-library-webgl-second-edition" by Jos Dirksen
    //
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

}

function showLandmarks() {
    d3.csv("data/landmarks.csv", function(data) {
        //console.log(data);

	var loader = new THREE.OBJMTLLoader();

        for (var i = 0; i < data.length; i++) {
        
	    //
	    // Since the objects are loaded asynchronously, the data and i need to be passed this way to the "onLoaded" function that is the third parameter of the loaded.load function.
	    //
	    (function(data, i)
	     { loader.load("/3d/" + data[i].object_name + ".obj", "/3d/" + data[i].object_name + ".mtl", function(loadedMesh) {
		 //console.log(loadedMesh);
		 loadedMesh.scale.set(0.12, 0.12, 0.12);
		 coord = projection([data[i].lng, data[i].lat]);
		 //console.log(coord);
		 makeCoordinateTransformation(loadedMesh, coord);
		 if (data[i].object_name == "haulitorni") {
		     loadedMesh.position.z -= 2.8;
		 }
		 else if (data[i].object_name == "finlayson") {
                     loadedMesh.position.z += 0.35;
                 }
		 else if (data[i].object_name == "pyynikki") {
                     loadedMesh.position.z += 4.3;
                 }
		 else if (data[i].object_name == "klingendahl") {
                     loadedMesh.position.z += 0.3;
                 }
		 loadedMesh.info = [];
                 loadedMesh.info.push("<p>Maamerkki - " + data[i].long_name + "</p><p>Korkeus: " + data[i].height + " metriä</p>");
		 landmarks.push(loadedMesh);
		 pivotPoint.add(loadedMesh);
		 allObjects.push(loadedMesh);

		 if (landmarks.length == data.length) {
		     $("#landmark_info").text('Ladataan maamerkkejä... valmis.');
		     showExternalData();
		 }
	     }, function(event) {
		 //console.log(event);
		 if (event.total != null && event.loaded != null && event.total == event.loaded) {

                     //var targetName = event.target.responseURL.split("/");
                     //targetName = targetName[targetName.length-1].split(".");
                     //targetName = targetName[0];
                     //console.log(targetName);

                     loaded_landmarks_size += event.total;
		     
                     var percentProgress = Math.round(loaded_landmarks_size / total_landmarks_size * 100);
                     //console.log(percentProgress);
		     
		     $("#landmark_info").text('Ladataan maamerkkejä... ' + percentProgress + '% ladattu');
		 }
	     }, function (event) {
		 console.log(event);
	     }
	     )})(data, i);
	}
    });
}


//
// Get and show the open data from the external servers via their APIs
//
function showExternalData() {
    
    $("#loading_text").append('<br><span id="external_data_info">Ladataan karttakohteita...</span>');

    //
    // The Q library (https://github.com/kriskowal/q) is used to avoid too deep nested function call hierarchies
    // when the data is loaded asynchronously. Also the "Three.js Cookbook" by Jos Dirksen has useful information
    // on this topic
    //
    showTampereOpenData()
	.then(function (result) { return loadOBJMTLModel("/3d/bussi")})
	.then(function (model) {
	    busMesh = model;
	    setInterval(showBusses, 1000); // update busses once per second
	    return loadSTLModel("clef");
	})
	.then(function (model) {
	    model.applyMatrix( new THREE.Matrix4().makeTranslation(88.28013229370117, -107.79578018188477, -0.15874999761581415) );
	    clefGeometry = model;
	    showTeostoVenues();
	    showVisitTampereLocations();
	})
    	.then(function (result) { return showOSMData();})
	.then(function () {
	    $('#loading').hide(); // All 3D models have been loaded, so the UI info panel can be closed
	})
	.catch(function(error) {
	    console.log("Error: ", error);
	}).progress(function(event) {
	    //console.log("progress: ", event);
	    
	    if (event.total != null && event.loaded != null && event.total == event.loaded) {

		//var targetName = event.target.responseURL.split("/");
		//targetName = targetName[targetName.length-1].split(".");
		//targetName = targetName[0];
		//console.log(targetName);
		
		loaded_icons_size += event.total;

		var percentProgress = Math.round(loaded_icons_size / total_icons_size * 100);
		//console.log(percentProgress);

		$("#external_data_info").text('Ladataan karttakohteita... ' + percentProgress + '% ladattu');
	    }
	})
	.done();
}

function showTampereOpenData() {
     var promise = loadOBJMTLModel("/3d/icons/icon_swimming")
	.then(function (model) { 
	    //console.log("model", model);
	    return getTampereOpenData(model, "UIMAHALLIT", swimming_halls);
	})
	.then(function (result) {
	    //console.log("going to read library");
	    return loadOBJMTLModel("/3d/icons/icon_library");
	})
	.then(function (model) {
	    //console.log("model", model);
	    return getTampereOpenData(model, "KIRJASTOT", libraries);
	});
    
    return promise;
}

function showOSMData() {
 
    return loadOBJMTLModel("/3d/icons/icon_pharmacy")
    .then(function (model) { return getOSMData(model, "amenity%3Dpharmacy", pharmacies, "Apteekki") })
    .then(function(result) { return loadOBJMTLModel("/3d/icons/icon_cafe") })
    .then(function (model) { return getOSMData(model, "amenity%3Dcafe", cafees, "Kahvila") })
    .then(function(result) { return loadOBJMTLModel("/3d/icons/icon_shop")})
    .then(function (model) {
	return getOSMDataForShops(model);
    })
    .then(function(result) { return loadOBJMTLModel("/3d/icons/icon_restaurant") })
    .then(function (model) { return getOSMData(model, "amenity%3Drestaurant", restaurants, "Ravintola") })
    .then(function(result) { return loadOBJMTLModel("/3d/icons/icon_letter") })
    .then(function (model) { return getOSMData(model, "amenity%3Dpost_box", mail_boxes, "Postilaatikko") })
    .then(function(result) { return loadOBJMTLModel("/3d/icons/icon_post_office") })
    .then(function (model) { return getOSMData(model, "amenity%3Dpost_office", post_offices, "Posti") })
    .then(function(result) { return loadOBJMTLModel("/3d/icons/icon_bank") })
    .then(function (model) { return getOSMData(model, "amenity%3Dbank", banks, "Pankki") });
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
			makeCoordinateTransformation(busses[j], coord);
			busses[j].rotation.y = Math.PI - journeys[i].MonitoredVehicleJourney.Bearing * (Math.PI/180);
		    }
		    break;
		}
	    }
	    if (!found) {
		// new vehicle, add to scene
		var mesh = busMesh.clone();
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
		    makeCoordinateTransformation(mesh, coord);
		    mesh.rotation.y = Math.PI - journeys[i].MonitoredVehicleJourney.Bearing * (Math.PI/180);
		    mesh.journey = journeys[i];
		    mesh.info = [];
                    mesh.info.push("<p>Bussi - Linja " + journeys[i].MonitoredVehicleJourney.LineRef.value + "</p><p>Suunta: " + journeys[i].MonitoredVehicleJourney.OriginName.value + " &#x21d2; " + journeys[i].MonitoredVehicleJourney.DestinationName.value) + "</p>";
		    busses.push(mesh);
		    pivotPoint.add(mesh);
		    allObjects.push(mesh);
		}
	    }
	}
    });
}

function showVisitTampereLocations() {
    var textureName = ["Rock_rauta_rakkaus_1024x1024.png"];
    var visitTreGeometry = new THREE.BoxGeometry(0.2, 5, 5);
    visitTreMesh = createMesh(visitTreGeometry, textureName);
    getVisitTampereLocations('http://visittampere.fi/api/search', 0);
}

function getVisitTampereLocations(URL, offset) {
   
    var params = {
	type: 'location',
	limit: 50, // max number of items to get
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
		
		//
		// Free to use geocoder is used to find out coordinates for the addresses
		//
		$.getJSON('http://api.okf.fi/gis/1/geocode.json?address=' + addr + '&lat=&lng=&language=fin',
			  (function(i) {
			      return function(result) {
				  //console.log(result);

				  if (result.status == "OK") {
				      for (var j = 0; j < result.results.length; j++) {
					  for (var k = 0; k < result.results[j].address_components.length; k++) {
					      if (result.results[j].address_components[k].types[0] == 'administrative_area_level_3') {
						  if (data[i].contact_info.city != null && result.results[j].address_components[k].long_name == data[i].contact_info.city) {
						      
						      var found = false;
						      
						      for (var m = 0; m < visit_tre_locations.length; m++) {
							  if (visit_tre_locations[m].lng == result.results[j].geometry.location.lng &&
							      visit_tre_locations[m].lat == result.results[j].geometry.location.lat)
							  {
							      var text = "<p>Visit Tampere -kohde - " + data[i].title + "</p>";
							      if (data[i].description != null) {
								  text += "<p>" + (data[i].description.length <= 200 ? data[i].description : data[i].description.substr(0, 197) + "...") + "</p>";
							      }
							      if (data[i].contact_info.phone != null) {
								  text += "<p>Puhelin: " + data[i].contact_info.phone + "</p>";
							      }
							      visit_tre_locations[m].mesh.info.push(text);
							      //console.log("found in locations");
							      found = true;
							      break;
							  }
						      }
					    
						      if (!found) {
							  var coord = projection([result.results[j].geometry.location.lng, result.results[j].geometry.location.lat]);
							  //console.log(coord);
							  
							  var x = Math.round(coord[0] / terrainWidth * origTerrainWidth);
							  var y = Math.round(coord[1] / terrainHeight * origTerrainHeight);
							  
							  if (x >= 0 && y >= 0 && x < origTerrainWidth && y < origTerrainHeight) {
							      var mesh = visitTreMesh.clone();
							      
							      makeCoordinateTransformation(mesh, coord);
							      mesh.position.z += 2.5 * 1.2;
							      mesh.info = [];
							      var text = "<p>Visit Tampere -kohde - " + data[i].title + "</p>";
                                                              if (data[i].description != null) {
								  text += "<p>" + (data[i].description.length <= 200 ? data[i].description : data[i].description.substr(0, 197) + "...") + "</p>";
                                                              }
                                                              if (data[i].contact_info.phone != null) {
                                                                  text += "<p>Puhelin: " + data[i].contact_info.phone + "</p>";
                                                              }
                                                              mesh.info.push(text);
							      visit_tre_objects.push(mesh);
							      allObjects.push(mesh);
							      pivotPoint.add(mesh);
							      visit_tre_locations.push({mesh: mesh, lng: result.results[j].geometry.location.lng, lat: result.results[j].geometry.location.lat});
							  }
						      } // if (!found)
						  }
						  //break;
					      }
					  }
				      }
				  }}
			  }(i)));
	    }
	}

	if (data.length >= 50) {
	    getVisitTampereLocations(URL, offset + 50);
	}
    });
}

function showTeostoVenues() {
    
    $.getJSON("/data/teosto_venues.json", function (data) {
	//console.log(data);

	for (var i = 0; i < data.length; i++) {
	    var venue = data[i];
	    //console.log(result.venue);
	    var found = false;
		    
            for (var m = 0; m < teosto_locations.length; m++) {
                if (teosto_locations[m].lng == venue.place.geoCoordinates.longitude &&
                    teosto_locations[m].lat == venue.place.geoCoordinates.latitude)
                {
		    var lower = venue.name.toLowerCase();
		    var parts = lower.split(" ");
		    var name = "";
		    for (var p = 0; p < parts.length; p++) {
			name += parts[p].charAt(0).toUpperCase();
			if (parts[p].length > 1) {
			    name += parts[p].slice(1);
			}
			name += " ";
		    }
		    name = name.substring(0, name.length - 1);
		    teosto_locations[m].mesh.info.push("<p>Teoston tapahtumapaikka - " + name + "</p>");
                    //console.log("teosto venue found in locations");
                    found = true;
                    break;
                }
            } 
	    if (!found) {
		var height = 3.7648086547851562 * 0.4;
		    
		var mesh = new THREE.Mesh(clefGeometry, clefMaterial);
		mesh.venue = venue;
		mesh.scale.set(2, 2, 2);

		var coord = projection([venue.place.geoCoordinates.longitude, venue.place.geoCoordinates.latitude]);
		var x = Math.round(coord[0] / terrainWidth * origTerrainWidth);
		var y = Math.round(coord[1] / terrainHeight * origTerrainHeight);
	    
		//console.log("x: " + x + ", y: " + y);

		if (x >= 0 && y >= 0 && x < origTerrainWidth && y < origTerrainHeight) {
		    makeCoordinateTransformation(mesh, coord);
		    mesh.position.z += height * 3;
		    mesh.info = [];
		    var lower = venue.name.toLowerCase();
		    var parts = lower.split(" ");
		    var name = "";
		    for (var p = 0; p < parts.length; p++) {
			name += parts[p].charAt(0).toUpperCase();
			if (parts[p].length > 1) {
			    name += parts[p].slice(1);
			}
			name += " ";
		    }
		    name = name.substring(0, name.length - 1);
		    mesh.info.push("<p>Teoston tapahtumapaikka - " + name + "</p>");
		    pivotPoint.add(mesh);
		    clefs.push(mesh);
		    allObjects.push(mesh);

		    teosto_locations.push({mesh: mesh, lng: venue.place.geoCoordinates.longitude, lat: venue.place.geoCoordinates.latitude});
		}

	    }
	}
    });	
}

/*******************************************************************************
 * Helper functionality
 ******************************************************************************/

function modifyPlaneGeometryHeight(terrainLoaderData) {

    var URL = '/images/osm_tampere_large.jpg';
    //var URL = '/images/Rock_rauta_rakkaus_1024x1024.png';

    var texture = THREE.ImageUtils.loadTexture(URL, undefined, function () {
	$("#terrain_info").text('Ladataan karttaa... valmis.');
    }, function (event) {
        console.log(event);
    });
    //console.log(texture);
    var geometry = new THREE.PlaneGeometry(2048, 2048, origTerrainWidth - 1, origTerrainHeight - 1);
    var material = new THREE.MeshPhongMaterial({
	map: texture,
	side: THREE.DoubleSide
    });
    
    //console.log(geometry.vertices.length);
    
    var j = 0;
    var k = 0;

    for (var i = 0, l = geometry.vertices.length; i < l; i++) {
	//var height = terrainLoaderData[i] / 255 * 21;
	var height = terrainLoaderData[i] / 65535 * 21;
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

    areaMap = ground;
    scene.add(areaMap);

    render();

    //console.log("done modifying z");
}    


function translate(point) {
  return [point[0] - (terrainWidth / 2), point[1] - (terrainHeight / 2)];
}

function makeCoordinateTransformation(mesh, coord) {

    var x = coord[0];
    x = Math.round(x / terrainWidth * origTerrainWidth);
    var y = coord[1];
    y = Math.round(y / terrainHeight * origTerrainHeight);
    coord = translate(coord);

    //console.log(coord);

    mesh.position.set(coord[0], -coord[1], heightMap[y][x]);
    mesh.rotation.x = Math.PI / 2;
}

function createMesh(geom, imageFileName) {
    var texture = THREE.ImageUtils.loadTexture("/images/" + imageFileName);
    var mat = new THREE.MeshPhongMaterial({color: 0xffffff, specular: 0xffffff, shininess: 160, metal: true});
    mat.map = texture;
    
    var mesh = new THREE.Mesh(geom, mat);
    return mesh;
}

//
// Necessary function for showing and updating the Three.js scene
//
function render() {
    //stats.update();

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
    
    pivotPoint.rotation.x = areaMap.rotation.x;
    pivotPoint.rotation.z = areaMap.rotation.z;

    renderer.autoClear = false;
    renderer.clear();
    renderer.render(backgroundScene , backgroundCamera );
    renderer.render(scene, camera);
}

//
// Useful info during the application development
//
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

//
// This event is also used just for debugging purposes, to show which object(s) user clicked on the scene
//
function onClick(event) {

    //console.log(event);

    if (event.which == 1) {

	var mouse = new THREE.Vector2((event.clientX / renderer.domElement.width ) * 2 - 1, -( (event.clientY) / renderer.domElement.height ) * 2 + 1);
	
	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects(allObjects, true);

	for (var i = 0; i < intersects.length; i++) {
            console.log(intersects[0]);
	    //console.log(intersects[0].object.venue.name);

            //intersects[i].object.material.transparent = true;
            //intersects[i].object.material.opacity = 0.1;
	}
    }
}

$( window ).click(onClick);

//
// Show information of the objects in the scene when user moves mouse cursor around the scene
//
$( window ).mousemove(function(event) {
     var mouse = new THREE.Vector2((event.clientX / renderer.domElement.width ) * 2 - 1, -( (event.clientY) / renderer.domElement.height ) * 2 + 1);

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera( mouse, camera );
    
    var intersects = raycaster.intersectObjects(allObjects, true);
    
    var allInfo = [];

    for (var i = 0; i < intersects.length; i++) {
	//console.log(intersects[i].object.info);
	
	var object = intersects[i].object;
	
	while (object.info == undefined && object.parent != null) {
	    object = object.parent;
	}
	var exists = false;
	for (var j = 0; j < allInfo.length; j++) {
	    if (allInfo[j] == object.info) {
		exists = true;
		break;
	    }
	}
	if (!exists) {
	    allInfo.push(object.info);
	}
    }
    
    showInfo(allInfo);
});

function showInfo(allInfo) {
    
    //console.log(allInfo);

    //
    // Show info of the object(s) to the user
    //

    if (allInfo.length == 0) {
	$("#object_info").css("visibility", "hidden");
    }
    else {
	var content = "";

	for (var i = 0; i < allInfo.length; i++) {
	    for (var j = 0; j < allInfo[i].length; j++) {
		content += '<div class="object_info_content">' + allInfo[i][j] + '</div>';
	    }
	}

	$("#object_info").empty();
	$("#object_info").append('<div id="object_info_contents">' + content + '</div>');
	$("#object_info").css("visibility", "visible");
	
    }
}

function getTampereOpenData(loadedMesh, name, objects) {
    var deferred = Q.defer();

    $.getJSON("http://opendata.navici.com/tampere/opendata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=opendata:" + name + "&outputFormat=json&srsName=EPSG:4326", function(data) {
	//console.log(data);
	for (var i = 0; i < data.features.length; i++) {
	    var mesh = loadedMesh.clone();
            mesh.scale.set(2, 2, 2);
            coord = projection([data.features[i].geometry.coordinates[0], data.features[i].geometry.coordinates[1]]);
            //console.log(coord);
	    makeCoordinateTransformation(mesh, coord);
	    mesh.info = [];
            mesh.info.push(data.features[i].properties.NIMI);
            tampereObjects.push(mesh);
	    objects.push(mesh);
	    allObjects.push(mesh);
            pivotPoint.add(mesh);
	    //scene.add(mesh);
	}

	deferred.resolve();
    });

    return deferred.promise;
}

//
// "Food" shops can be either nodes or ways and can have attribute shop=supermarket or shop=convenience
//
function getOSMDataForShops(loadedMesh) {
    return getOSMDataWithURLForNodes(loadedMesh, overpass_server + "?data=%5Bout%3Ajson%5D%3B%0A%28%0A%20%20node%2861.2740%2C%2023.3317%2C%2061.701%2C%2024.253%29%5B%22shop%22%3D%22convenience%22%5D%3B%0A%20%20node%2861.2740%2C%2023.3317%2C%2061.701%2C%2024.253%29%5B%22shop%22%3D%22supermarket%22%5D%3B%0A%29%3B%0Aout%3B%0A", shops, "Ruokakauppa").
	then(getOSMDataWithURLForWays(loadedMesh, overpass_server + "?data=%5Bout%3Ajson%5D%3B%0A%28%0A%20%20way%2861.2740%2C%2023.3317%2C%2061.701%2C%2024.253%29%5B%22shop%22%3D%22convenience%22%5D%3B%0A%20%20way%2861.2740%2C%2023.3317%2C%2061.701%2C%2024.253%29%5B%22shop%22%3D%22supermarket%22%5D%3B%0A%29%3B%0Aout%20center%20meta%3B%0A", shops, "Ruokakauppa"));
}

function getOSMDataWithURLForNodes(loadedMesh, api_url, objects, general_name) {
    var deferred = Q.defer();

    $.getJSON(api_url, function(data) {
        //console.log("osm:", data);
        for (var i = 0; i < data.elements.length; i++) {
            var mesh = loadedMesh.clone();
            mesh.scale.set(2, 2, 2);
            coord = projection([data.elements[i].lon, data.elements[i].lat]);
            //console.log(coord);
            makeCoordinateTransformation(mesh, coord);
            mesh.info = [];
	    title = "<p>" + general_name;
	    title += data.elements[i].tags.name != undefined ? " - " + data.elements[i].tags.name + "</p>" : "<p>Ei tarkempaa nimitietoa.</p>"; 
            mesh.info.push(title);
            tampereObjects.push(mesh);
            objects.push(mesh);
            allObjects.push(mesh);
            pivotPoint.add(mesh);
        }

        deferred.resolve();
    });

    return deferred.promise;
}

function getOSMDataWithURLForWays(loadedMesh, api_url, objects, general_name) {
    var deferred = Q.defer();

    $.getJSON(api_url, function(data) {
        //console.log("osm:", data);
        for (var i = 0; i < data.elements.length; i++) {
            var mesh = loadedMesh.clone();
            mesh.scale.set(2, 2, 2);
            coord = projection([data.elements[i].center.lon, data.elements[i].center.lat]);
            //console.log(coord);
            makeCoordinateTransformation(mesh, coord);
            mesh.info = [];
	    title = "<p>" + general_name;
            title += data.elements[i].tags.name != undefined ? " - " + data.elements[i].tags.name + "</p>" : "<p>Ei tarkempaa nimitietoa.</p>";
	    mesh.info.push(title);
            tampereObjects.push(mesh);
            objects.push(mesh);
            allObjects.push(mesh);
            pivotPoint.add(mesh);
        }

        deferred.resolve();
    });

    return deferred.promise;
}

function getOSMData(loadedMesh, filter, objects, general_name) {
    var deferred = Q.defer();

    $.getJSON(overpass_server + "?data=%5Bout%3Ajson%5D%3Bnode(61.2740%2C23.3317%2C61.701%2C24.253)%5B" + filter + "%5D%3B%0Aout%3B", function(data) {
	//console.log("osm:", data);
	for (var i = 0; i < data.elements.length; i++) {
	    var mesh = loadedMesh.clone();
            mesh.scale.set(2, 2, 2);
            coord = projection([data.elements[i].lon, data.elements[i].lat]);
            //console.log(coord);
	    makeCoordinateTransformation(mesh, coord);
	    mesh.info = [];
	    title = "<p>" + general_name;
            title += data.elements[i].tags.name != undefined ? " - " + data.elements[i].tags.name + "</p>" : "<p>Ei tarkempaa nimitietoa.</p>";
            mesh.info.push(title);
	    tampereObjects.push(mesh);
	    objects.push(mesh);
	    allObjects.push(mesh);
            pivotPoint.add(mesh);
	}

	deferred.resolve();
    });

    return deferred.promise;
}

//
// Functions for loading 3D models
//
function loadSTLModel(name) {

    var deferred = Q.defer();
    
    var loader = new THREE.STLLoader();

    loader.load("/3d/" + name + ".stl", function (loaded) {
	loaded.name = name;
	deferred.resolve(loaded);
    }, function (progress) {
        deferred.notify(progress);
    }, function (error) {
        deferred.reject(error);
    });

    return deferred.promise;
}

function loadOBJMTLModel(path) {

    var deferred = Q.defer();

    var loader = new THREE.OBJMTLLoader();

    loader.load(path + ".obj", path + ".mtl", function (loaded) {
	loaded.name = path;
	deferred.resolve(loaded);
    }, function (progress) {
	deferred.notify(progress);
    }, function (error) {
        deferred.reject(error);
    });

    return deferred.promise;
}

//
// Minimize event handlers are used in the UI to show and hide various info windows
//
function createMinimizeEventHandlers() {
    $('#legend_min_href').on('click', function(event) {
	event.preventDefault();
	if ($('#legend_min_img').attr('src') == "/images/arrow_carrot-down.png") {
	    $('#legend_items').hide();
	    $('#legend').css('height', 30);
	    $('#legend').css('width', 160);
	    $('#legend_min_img').attr('src', "/images/arrow_carrot-up.png");
	}
	else {
	    $('#legend_items').show();
            $('#legend').css('height', 500);
	    $('#legend').css('width', 300);
            $('#legend_min_img').attr('src', "/images/arrow_carrot-down.png");
	}
    });

    $('#loading_min_href').on('click', function(event) {
        event.preventDefault();
        if ($('#loading_min_img').attr('src') == "/images/arrow_carrot-down.png") {
            $('#loading_items').hide();
            $('#loading').css('height', 30);
             $('#loading_min_img').attr('src', "/images/arrow_carrot-up.png");
        }
        else {
            $('#loading_items').show();
            $('#loading').css('height', 'calc(50% - 50px)');
             $('#loading_min_img').attr('src', "/images/arrow_carrot-down.png");
        }
    });

    $('#loading_close_href').on('click', function(event) {
        event.preventDefault();
	$('#loading').hide();
    });
}


//
// Show legend panel for the user to show/hide data at the map  
//
function createLegend() {
    
    d3.csv("data/legend.csv", function(data) {
        //console.log(data);

	for (var i = 0; i < data.length; i++) {

	    item = '<div class="legend_list_item">';
	    item += '<div class="legend_name_column">' + data[i].legend + '</div>';
	    item += '<div class="legend_item_column">';
	    item += '<input type="checkbox" name="' +  data[i].plural_name + '" checked data-on-text="Näytä" data-off-text="Piilota" id="cb_legend_' + data[i].icon_name + '"></div>';
	    item += '</div>';

	    $("#legend_items").append(item);

	    $('input[name="' + data[i].plural_name + '"]').on('switchChange.bootstrapSwitch', function(event, state) {
		//console.log(this); // DOM element
		//console.log(event); // jQuery event
		//console.log(state); // true | false

		if (state == true) {
		    //console.log("showing: " + this.name);
		    var objects = window[this.name];
		    for (var j = 0; j < objects.length; j++) {
			objects[j].traverse(function(child){child.visible = true;});
		    }
		}
		else {
		    //console.log("hiding: " + this.name);
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
