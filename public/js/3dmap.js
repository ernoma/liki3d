
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

Physijs.scripts.worker = '/vendor/threejs/physijs/physijs_worker.js'
Physijs.scripts.ammo = '/vendor/threejs/physijs/ammo.js';

var stats = initStats();

//console.log(places);

var scene = new Physijs.Scene;
scene.setGravity(new THREE.Vector3(0, -1000, 0));

var camera = new THREE.PerspectiveCamera( 45, $('#webgl').innerWidth() / $('#webgl').innerHeight(), 0.1, 10000 );
camera.position.set(0, 1000, 3000);
//camera.position.set(0, 0, 80);
camera.lookAt(scene.position);
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
var terrainWidth = 2048;
var terrainHeight = 2048;

//var origTerrainWidth = 400;
//var origTerrainHeight = 268;

var origTerrainWidth = 2048;
var origTerrainHeight = 2048;

var projection = d3.geo.mercator()
    .translate([(terrainWidth + 5) / 2, (terrainHeight + 272) / 2])
    .scale(121500)
    .rotate([-27, 0, 0])
    .center([23.77570164 - 27, 61.47114807]); // mercator: 8734817,5 - x, 2646699;


var heightMap = new Array(origTerrainHeight);
for (var i = 0; i < origTerrainHeight; i++) {
    heightMap[i] = new Array(origTerrainWidth);
}

//createChart();

var gameBoard = undefined;

var allObjects = [];
var clefs = [];
var vehicles = [];

var clefGeometry = undefined;
var busGeometry = undefined;

var terrainLoader = new THREE.TerrainLoader();
terrainLoader.load('/data/tampere.bin', function(data) {
    //console.log(data);
    
    var axes = new THREE.AxisHelper(200);
    scene.add(axes);

    loadPlane();
    
    console.log("done modifying z");

    addLights();

    var $loading = $('#loading').hide();

    showLandmarks();

    showRoads();

    var loader = new THREE.STLLoader();

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

function loadPlane() {
    var URL = '/images/osm_tampere_large.png';

    THREE.ImageUtils.loadTexture(URL, undefined, function (texture) {
	console.log(texture);
	//var geometry = new THREE.PlaneGeometry(2048, 2048, 120, 120);
	var geometry = new THREE.BoxGeometry(2048, 1, 2048);
	var material = Physijs.createMaterial(new THREE.MeshPhongMaterial({
            map: texture
        }), 0.9, 0.3);
	var ground = new Physijs.BoxMesh(geometry, material, 0);

	ground_material = Physijs.createMaterial(
            new THREE.MeshLambertMaterial({ color: 0x00aaaa }),
                .9, // high friction
                .6 // low restitution
        );
	ground_material.transparent = true;
	ground_material.opacity = 0.5;

	var borderHeight = 200;

	var borderLeft = new Physijs.BoxMesh(
                    new THREE.BoxGeometry(2, borderHeight, 2048),
                    ground_material,
                    0 // mass
            );

            borderLeft.position.x = -1025;
            borderLeft.position.y = 2;


            ground.add(borderLeft);

            var borderRight = new Physijs.BoxMesh(new THREE.BoxGeometry(2, borderHeight, 2048),
                    ground_material,
                    0 // mass
            );
            borderRight.position.x = 1025;
            borderRight.position.y = 2;

            ground.add(borderRight);


            var borderBottom = new Physijs.BoxMesh(
                    new THREE.BoxGeometry(2052, borderHeight, 2),
                    ground_material,
                    0 // mass
            );

            borderBottom.position.z = 1024;
            borderBottom.position.y = 2;
            ground.add(borderBottom);

            var borderTop = new Physijs.BoxMesh(
                    new THREE.BoxGeometry(2052, borderHeight, 2),
                    ground_material,
                    0 // mass
            );

            borderTop.position.z = -1024;
            borderTop.position.y = 2;
            ground.add(borderTop);

	//plane.rotation.x = Math.PI * -0.5;
	//plane.position.set(0, 0, 0);
	scene.add(ground);
	gameBoard = ground;
	//addBalls();
    });

    /*var oWidth = origTerrainWidth - 1;
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
	    
	    var URL = 'http://a.tiles.mapbox.com/v3/ernoma.i04d787e/' + zoom + '/' + x + '/' + y + '.png';
	    //var URL = 'http://tiles.kartat.kapsi.fi/ortokuva/' + zoom + '/' + x + '/' + y + '.jpg';
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
		var yPos = terrainHeight * yCount -(y - tileNumbers.maxXY.y + yCount / 2 + 0.5) * terrainHeight;
		//console.log(xPos, yPos);
		plane.position.set(xPos, yPos, 0);
		scene.add(plane);
	    })})(URL, x, y);
	}
	//break;
    }*/
    
    /*var geometry = new THREE.PlaneGeometry(terrainWidth, Math.floor(terrainWidth * (oHeight / oWidth)), oWidth, oHeight); // Makes 120x80 size plane geometry with the amount of vertices that matches orig terrain width-1 and height-1

    var x = 2321;
    var y = 1153;
    var material = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture('http://tile.openstreetmap.org/' + zoom + '/' + x + '/' + y + '.png'),
    });

    var plane = new THREE.Mesh(geometry, material);
    //plane.position.set((x - tileNumbers.maxXY.x + xCount / 2) / 2 * terrainWidth, (y - tileNumbers.maxXY.y + yCount / 2) / 2 * terrainHeight, 0);
    scene.add(plane);*/

    //var material = new THREE.MeshPhongMaterial({
    //	map: THREE.ImageUtils.loadTexture('/images/tampere_terrain.jpg'),
    //color: 0xdddddd, 
    //wireframe: true
    //});
    
    //modifyPlaneGeometryHeight(geometry, data);
}

function addBalls() {
    var friction = 0.1;
    var restitution = 1;
    var textures = [];
    var texture = THREE.ImageUtils.loadTexture("/images/Love_Is_All_Bright_Logo_1024x1024.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    textures.push(texture);
    texture = THREE.ImageUtils.loadTexture("/images/verkosto_1024x1024.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    textures.push(texture);
    for (var i = 0; i < 5; i++) {
	var geom = new THREE.SphereGeometry(50, 24, 24);
	var material = new THREE.MeshPhongMaterial();
	material.map = textures[Math.floor(Math.random()*2)];
	var sphere = new Physijs.SphereMesh(geom, Physijs.createMaterial(material, friction, restitution));
	sphere.material.map.repeat.set(2, 2);
	sphere.position.set(Math.random() * terrainWidth - terrainWidth / 2, 500 + Math.random() * 5, Math.random() * terrainHeight - terrainHeight / 2);
	sphere.rotation.z = Math.PI * Math.random() * 2;
	sphere.rotation.x = Math.PI * Math.random() * 0.5;
	sphere.rotation.y = Math.PI * Math.random();
	scene.add(sphere);
    }
}

function addLights() {
    scene.add(new THREE.AmbientLight(0xaaaaaa));
        
    /*var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, 300, 10);
    spotLight.castShadow = true;
    spotLight.intensity = 0.5;
    scene.add(spotLight);*/

    var spotLightFlare = new THREE.SpotLight(0xffffff);
    spotLightFlare.position.set(120, 610, 3000);
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
}

function showLandmarks() {

    var material = new THREE.MeshLambertMaterial({
        color: 0x00ffff
    });
    //var radius = 1;
    //var segments = 32;
    //var circleGeometry = new THREE.CircleGeometry( radius, segments );
    //console.log(circleGeometry.vertices.length);
    //var circle = new THREE.Mesh( circleGeometry, material );
    //circle.position.set(60, 40, 6); // top left corner above map
    //circle.position.set(coord[0], coord[1], 3.3);
    //scene.add( circle );

    var loader = new THREE.OBJMTLLoader();
    loader.load("/3d/neula.obj", "/3d/neula.mtl", function(loadedMesh) {
	console.log(loadedMesh);
	/*loadedMesh.children.forEach(function (child) {
	    child.material = material;
	    child.geometry.computeFaceNormals();
	    child.geometry.computeVertexNormals();
	});*/
	//var base = loadedMesh.children[0].children[2];
	var base = loadedMesh.children[0].children[1];
	var outsideVista = loadedMesh.children[0].children[6];
	var hat = loadedMesh.children[0].children[4];
	//loadedMesh.children[0].children[0].material.opacity = 1;
	//loadedMesh.children[0].children[0].material.transparent = false;
	hat.material.shininess = 30;
	outsideVista.material.shininess = 10;
	base.material.shininess = 1;
	//loadedMesh.rotation.x = Math.PI / 2;
	loadedMesh.scale.set(10, 10, 10);
	//loadedMesh.position.set(0, 0, 0);
	coord = projection([23.743183, 61.504961]);// Näsinneula 61.504961, 23.743183
	console.log(coord);
	coord = translate(coord);
	console.log(coord);
	loadedMesh.position.set(coord[0], 0, coord[1]);
	scene.add(loadedMesh);
    });

    loader.load("/3d/torni.obj", "/3d/torni.mtl", function(loadedMesh) {
        console.log(loadedMesh);
	
	//loadedMesh.rotation.x = Math.PI / 2;
	loadedMesh.scale.set(10, 10, 10);
	loadedMesh.position.set(0, 0, 0);
	scene.add(loadedMesh);
    });
}

function showRoads() {
    $.getJSON("/data/tampere_roads.json", function(data) {
        console.log(data);

        var material = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 1
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
                        var vector = new THREE.Vector3(tcoord[0], 0.5 /*heightMap[y][x] + 0.5 * heightMap[y][x]*/, tcoord[1]);
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

var direction = 1;

function render() {
    stats.update();

    for (var i = 0; i < clefs.length; i++) {
	clefs[i].rotation.y += 0.01;
    }

    controls.update();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    /*gameBoard.rotation.x += 0.002 * direction;
    gameBoard.rotation.z += 0.002 * direction;
    if (gameBoard.rotation.x < -0.4) direction = 1;
    if (gameBoard.rotation.x > 0.4) direction = -1;
    gameBoard.__dirtyRotation = true;*/
    scene.simulate();
}

render();


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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

//var projector = new THREE.Projector();

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

