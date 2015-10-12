
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
  top: '0%', // Top position relative to parent
  left: '50%' // Left position relative to parent
};
var target = document.getElementById('spinner');
var spinner = new Spinner(opts).spin(target);

var stats = initStats();

//console.log(places);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 45, $('#webgl').innerWidth() / $('#webgl').innerHeight(), 0.1, 10000 );
camera.position.set(0, -500, 300);
//camera.position.set(0, 0, 80);
camera.lookAt(0, 0, 0);
//camera.position.z = 5;

var renderer = new THREE.WebGLRenderer({ alpha: true });
//console.log($('#webgl').innerWidth());
//console.log($('#webgl').innerHeight());
renderer.setSize( window.innerWidth, window.innerHeight);
//renderer.setSize( window.innerWidth, window.innerHeight );
//renderer.setClearColorHex( 0xffffff, 1 )
renderer.setClearColor(new THREE.Color(0xaaaaff, 1.0));
document.getElementById('webgl').appendChild( renderer.domElement );

var controls = new THREE.TrackballControls(camera, renderer.domElement);

//var terrainWidth = 120;
//var terrainHeight = 80;
var terrainWidth = 120;
var terrainHeight = 120;

//var origTerrainWidth = 400;
//var origTerrainHeight = 268;

var origTerrainWidth = 256;
var origTerrainHeight = 256;

var heightMap = new Array(origTerrainHeight);
for (var i = 0; i < origTerrainHeight; i++) {
    heightMap[i] = new Array(origTerrainWidth);
}

//createChart();

var allObjects = [];
var clefs = [];
var vehicles = [];

var clefGeometry = undefined;
var busGeometry = undefined;

var terrainLoader = new THREE.TerrainLoader();
terrainLoader.load('/data/tampere.bin', function(data) {
    //console.log(data);
    
    //var geom = new THREE.BoxGeometry(4,4,4);
    //var mater = new THREE.MeshBasicMaterial({color: 0x0000ff, wireframe: true});
    //var box = new THREE.Mesh(geom, mater);
    //scene.add(box);

    //var axes = new THREE.AxisHelper(200);
    //scene.add(axes);

    var oWidth = origTerrainWidth - 1;
    var oHeight = origTerrainHeight - 1;

    var zoom = 12;
    var minLat = 61.2740;
    var minLng = 23.3317;
    var maxLat = 61.701;
    var maxLng = 24.253;

    var tileNumbers = calculateTileNumbers(zoom, minLat, minLng, maxLat, maxLng);
    console.log(tileNumbers);

    THREE.ImageUtils.crossOrigin = '';

    var xCount = tileNumbers.maxXY.x - tileNumbers.minXY.x + 1;
    var yCount = tileNumbers.minXY.y - tileNumbers.maxXY.y + 1;

    for (var x = tileNumbers.minXY.x; x <= tileNumbers.maxXY.x; x++) {
	for (var y = tileNumbers.maxXY.y; y <= tileNumbers.minXY.y; y++) {
	    var geometry = new THREE.PlaneGeometry(terrainWidth, Math.floor(terrainWidth * (oHeight / oWidth)), oWidth, oHeight); // Makes 120x80 size plane geometry with the amount of vertices that matches orig terrain width-1 and height-1
	    
	    var URL = 'http://tile.openstreetmap.org/' + zoom + '/' + x + '/' + y + '.png';
	    console.log(URL);

	    //var xCoord = x;
	    //var yCoord = y;

	    (function(URL, x, y) {
	    THREE.ImageUtils.loadTexture(URL, undefined, function (texture) {
		//console.log(x, y);

		var material = new THREE.MeshPhongMaterial({
                    map: texture
		});

		var plane = new THREE.Mesh(geometry, material);
		var xPos = (x - tileNumbers.maxXY.x + xCount / 2 - 0.5) * terrainWidth;
		var yPos = terrainHeight * yCount -(y - tileNumbers.maxXY.y + yCount / 2 + 0.5) * terrainHeight
		//console.log(xPos, yPos);
		plane.position.set(xPos, yPos, 0);
		scene.add(plane);
	    })})(URL, x, y);

	    /*var material = new THREE.MeshPhongMaterial({
		map: THREE.ImageUtils.loadTexture('http://tile.openstreetmap.org/' + zoom + '/' + x + '/' + y + '.png'),
	    });

	    var plane = new THREE.Mesh(geometry, material);
	    plane.position.set((x - tileNumbers.maxXY.x + xCount / 2) / 2 * terrainWidth, (y - tileNumbers.maxXY.y + yCount / 2) / 2 * terrainHeight, 0);
	    scene.add(plane);
	    break;*/
	}
	//break;
    }
    
    /*var geometry = new THREE.PlaneGeometry(terrainWidth, Math.floor(terrainWidth * (oHeight / oWidth)), oWidth, oHeight); // Makes 120x80 size plane geometry with the amount of vertices that matches orig terrain width-1 and height-1

    var x = 2321;
    var y = 1153;
    var material = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture('http://tile.openstreetmap.org/' + zoom + '/' + x + '/' + y + '.png'),
    });

    var plane = new THREE.Mesh(geometry, material);
    //plane.position.set((x - tileNumbers.maxXY.x + xCount / 2) / 2 * terrainWidth, (y - tileNumbers.maxXY.y + yCount / 2) / 2 * terrainHeight, 0);
    scene.add(plane);*/

    
    console.log("done modifying z");
    
    //var material = new THREE.MeshPhongMaterial({
//	map: THREE.ImageUtils.loadTexture('/images/tampere_terrain.jpg'),
	//color: 0xdddddd, 
	//wireframe: true
    //});
    
    //modifyPlaneGeometryHeight(geometry, data);    

    scene.add(new THREE.AmbientLight(0xaaaaaa));
        
    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, 10, 300);
    spotLight.castShadow = true;
    spotLight.intensity = 0.5;
    scene.add(spotLight);

    var spotLightFlare = new THREE.SpotLight(0xffffff);
    spotLightFlare.position.set(120, 610, -50);
    spotLightFlare.castShadow = false;
    spotLightFlare.intensity = 1;
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

    var $loading = $('#loading').hide();

    var loader = new THREE.STLLoader();

    showLandmarks();

    showRoads();

    loader.load("/3d/clef.stl", function (geometry) {
        //console.log(geometry);
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation(88.28013229370117, -107.79578018188477, -0.15874999761581415) );
	clefGeometry = geometry;

	//showTeostoVenues('http://api.teosto.fi/2014/municipality?name=TAMPERE&method=venues');
    });

    loader.load("/3d/bus.stl", function (geometry) {
        console.log(geometry);
	busGeometry = geometry;

	//setInterval(showBusses, 1000);
    });


}, function(event) {
    //console.log(event);
}, function (event) {
    console.log(event);
});

function showLandmarks() {
    coord = translate(projection([23.743183, 61.504961]));// Näsinneula 61.504961, 23.743183
    console.log(coord);

    var material = new THREE.MeshBasicMaterial({
        color: 0x00ffff
    });
    var radius = 1;
    var segments = 32;
    var circleGeometry = new THREE.CircleGeometry( radius, segments );
    console.log(circleGeometry.vertices.length);
    var circle = new THREE.Mesh( circleGeometry, material );
    //circle.position.set(60, 40, 6); // top left corner above map
    //scene.add( circle );

    circle.position.set(coord[0], coord[1], 3.3);
    scene.add( circle );
}

function showRoads() {
    $.getJSON("/data/tampere_roads.json", function(data) {
        console.log(data);

        var material = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 50
        });

        for (var i = 0; i < data.features.length; i++) {
            if (data.features[i].geometry.type == 'LineString') {
                var geometry = new THREE.Geometry();
                var coordinates = data.features[i].geometry.coordinates;
                for (var j = 0; j < coordinates.length; j++) {
                    coord = projection([coordinates[j][0], coordinates[j][1]]);
                    //var x = coord[0];
                    //x = Math.round(x / terrainWidth * origTerrainWidth);
                    //var y = coord[1];
                    //y = Math.round(y / terrainHeight * origTerrainHeight);
                    //if (x >= 0 && y >= 0 && x < origTerrainWidth && y < origTerrainHeight) {
                        var tcoord = translate(coord);
                        var vector = new THREE.Vector3(tcoord[0], tcoord[1], 0.5 /*heightMap[y][x] + 0.5 * heightMap[y][x]*/);
                        geometry.vertices.push(vector);
                        //road_point_locations.push(vector);
                    //}
                }
                var line = new THREE.Line(geometry, material);
                scene.add(line);
            }
        }
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

function toRad(degrees){
    return degrees * Math.PI / 180;
}

function modifyPlaneGeometryHeight(geometry, data) {    
    //console.log(geometry.vertices.length);
    
    var j = 0;
    var k = 0;

    for (var i = 0, l = geometry.vertices.length; i < l; i++) {
	var height = data[i] / 65535 * 5;
	geometry.vertices[i].z = height;
	heightMap[j][k] = height;
	k++;
	if (k == origTerrainWidth) {
	    j++;
	    k = 0;
	}
    }
}


var projection = d3.geo.mercator()
    .translate([(terrainWidth+3) / 2, (terrainHeight-5) / 2])
    .scale((terrainHeight + terrainWidth) / 2 * 650)
    .rotate([-27, 0, 0])
    .center([23.77570164 - 27, 61.47114807]); // mercator: 8734817,5 - x, 2646699;
    

function showBusses() {
    var URL = 'http://data.itsfactory.fi/siriaccess/vm/json';
    
    $.getJSON(URL, function (data) {
        //console.log(data);

	var journeys = data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity;
	//console.log(journeys);

	// TODO remove journeys that do not exist anymore

	for (var i = 0; i < journeys.length; i++) {
	    var found = false;
	    for (var j = 0; j < vehicles.length; j++) {
		if (journeys[i].MonitoredVehicleJourney.VehicleRef.value == vehicles[j].journey.MonitoredVehicleJourney.VehicleRef.value) {
		    found = true;
		    // update mesh position
		    coord = projection([journeys[i].MonitoredVehicleJourney.VehicleLocation.Longitude, journeys[i].MonitoredVehicleJourney.VehicleLocation.Latitude]);
                    var x = Math.round(coord[0] / terrainWidth * origTerrainWidth);
                    var y = Math.round(coord[1] / terrainHeight * origTerrainHeight);
		    if (x >= 0 && y >= 0 && x < origTerrainWidth && y < origTerrainHeight) {
			var tcoord = translate(coord);
			vehicles[j].position.set(tcoord[0], tcoord[1], heightMap[y][x] + height / 2);
			vehicles[j].rotation.y = journeys[i].MonitoredVehicleJourney.Bearing * (Math.PI/180);
		    }
		    break;
		}
	    }
	    if (!found) {
		// new vehicle, add to scene
		var mat = new THREE.MeshPhongMaterial({color: 0x294f9a, specular: 0xffffff, shininess: 160, metal: true});
		var mesh = new THREE.Mesh(busGeometry, mat);
		//console.log(mesh);
		mesh.scale.set(0.0001, 0.0001, 0.0001);
		//console.log(mesh);
		//var box = new THREE.Box3().setFromObject( mesh );
		//console.log( box.min, box.max, box.size() );
		mesh.rotation.x = 0.5 * Math.PI;
		//console.log(mesh);
		var height = 0.25967699344000716;
		coord = projection([journeys[i].MonitoredVehicleJourney.VehicleLocation.Longitude, journeys[i].MonitoredVehicleJourney.VehicleLocation.Latitude]);
		var x = Math.round(coord[0] / terrainWidth * origTerrainWidth);
		var y = Math.round(coord[1] / terrainHeight * origTerrainHeight);
		//console.log(x, y);
		if (x >= 0 && y >= 0 && x < origTerrainWidth && y < origTerrainHeight) {
		    var tcoord = translate(coord);
		    mesh.position.set(tcoord[0], tcoord[1], heightMap[y][x] + height / 2);
		    mesh.rotation.y = journeys[i].MonitoredVehicleJourney.Bearing * (Math.PI/180);
		    mesh.journey = journeys[i];
		    vehicles.push(mesh);
		    scene.add(mesh);
		    allObjects.push(mesh);
		}
	    }
	}
    });
}

var textureNames = ["Love_Is_All_Bright_Logo_1024x1024.jpg", "treregionab_visittampere_posa_1024x1024.jpg", "verkosto_1024x1024.png"];

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
			
		    /*for (var j = 0; j < allObjects.length; j++) {
			if (allObjects[j].venue.name == result.venue.name &&
			    allObjects[j].venue.place.address.streetAddress == result.venue.place.address.streetAddress) {
			    console.log("found");
			    found = true;
			    break;
			}
		    }*/
		    if (!found) {

			var height = 3.7648086547851562 * 0.4;
		    
			/*var textGeomOptions = {
			  size: 0.5,
			  height: 0.5,
			  font: 'symbola',
			  curveSegments: 12,
			  steps: 1
			  }
			  var mesh = new THREE.Mesh(new THREE.TextGeometry("\u1D11E", textGeomOptions), new THREE.MeshPhongMaterial());*/

			//var boxGeometry = new THREE.BoxGeometry(0.5, 0.5, height);
			//var mesh = createMesh(boxGeometry, textureNames[Math.floor((Math.random() * 3))]);

			var mat = new THREE.MeshPhongMaterial({color: 0xffd700, specular: 0xffffff, shininess: 160, metal: true});
			var mesh = new THREE.Mesh(clefGeometry, mat);
			mesh.venue = result.venue;
			//var box = new THREE.Box3().setFromObject( mesh );
			//console.log( box.min, box.max, box.size() );
			mesh.scale.set(0.4, 0.4, 0.4);
			mesh.rotation.x = 0.5 * Math.PI;

			//console.log(mesh);

			var coord = projection([result.venue.place.geoCoordinates.longitude, result.venue.place.geoCoordinates.latitude]);
			var x = Math.round(coord[0] / terrainWidth * origTerrainWidth);
			var y = Math.round(coord[1] / terrainHeight * origTerrainHeight);
	    
			//console.log("x: " + x + ", y: " + y);

			if (x >= 0 && y >= 0 && x < origTerrainWidth && y < origTerrainHeight) {
			    var tcoord = translate(coord);
			    mesh.position.set(tcoord[0], tcoord[1], height / 2 + heightMap[y][x]);
			    
			    scene.add(mesh);
			    clefs.push(mesh);
			    allObjects.push(mesh);
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
	clefs[i].rotation.y += 0.01;
    }

    controls.update();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

render();


function translate(point) {
  return [point[0] - (terrainWidth / 2), (terrainHeight / 2) - point[1]];
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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

var projector = new THREE.Projector();

function onClick(event) {

    //console.log(event);

    if (event.which == 1) {

	var mouse = new THREE.Vector2((event.clientX / renderer.domElement.width ) * 2 - 1, -( (event.clientY - 50) / renderer.domElement.height ) * 2 + 1);
	
	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects(allObjects);

	for (var i = 0; i < intersects.length; i++) {
            //console.log(intersects[0]);
	    //console.log(intersects[0].object.venue.name);

            intersects[i].object.material.transparent = true;
            intersects[i].object.material.opacity = 0.1;
	}
    }
}

$( window ).click(onClick);

