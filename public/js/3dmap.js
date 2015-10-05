
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

var terrainWidth = 120;
var terrainHeight = 80;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 45, $('#webgl').innerWidth() / $('#webgl').innerHeight(), 0.1, 1000 );
camera.position.set(0, -50, 50);
//camera.position.set(0, 0, 80);
//camera.lookAt(0, 0, 0);
//camera.position.z = 5;

var renderer = new THREE.WebGLRenderer({ alpha: true });
//console.log($('#webgl').innerWidth());
//console.log($('#webgl').innerHeight());
renderer.setSize( window.innerWidth, window.innerHeight);
//renderer.setSize( window.innerWidth, window.innerHeight );
//renderer.setClearColorHex( 0xffffff, 1 )
document.getElementById('webgl').appendChild( renderer.domElement );

var controls = new THREE.TrackballControls(camera, renderer.domElement);


var origTerrainWidth = 400;
var origTerrainHeight = 268;

var heightMap = new Array(origTerrainHeight);
for (var i = 0; i < origTerrainHeight; i++) {
    heightMap[i] = new Array(origTerrainWidth);
}

//createChart();

var allObjects = [];

var clefGeometry = undefined;

var terrainLoader = new THREE.TerrainLoader();
terrainLoader.load('/data/tampere.bin', function(data) {
    //console.log(data);
    
    //var geom = new THREE.BoxGeometry(4,4,4);
    //var mater = new THREE.MeshBasicMaterial({color: 0x0000ff, wireframe: true});
    //var box = new THREE.Mesh(geom, mater);
    //scene.add(box);

    var geometry = new THREE.PlaneGeometry(120, Math.floor(120 * (267 / 399)), 399, 267); // Makes 120x80 size plane geometry with the amount of vertices that matches orig terrain width-1 and height-1
    
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
    
    //console.log("done modifying z");
    
    var material = new THREE.MeshPhongMaterial({
	map: THREE.ImageUtils.loadTexture('/images/tampere_terrain.jpg'),
	//color: 0xdddddd, 
	//wireframe: true
    });
    
    var plane = new THREE.Mesh(geometry, material);
    scene.add(plane);
    
    //scene.add(new THREE.AmbientLight(0xeeeeee));
        
    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(-0, 30, 500);
    spotLight.castShadow = true;
    spotLight.intensity = 1;
    scene.add(spotLight);

    /*for (var i = 0; i < places.features.length; i++) {
	var height = 0.5;
	
	var place = places.features[i];

	var boxGeometry = new THREE.BoxGeometry(0.5, 0.5, height);
	var mesh = createMesh(boxGeometry, textureNames[Math.floor((Math.random() * 3))]);

	var coord = projection([place.geometry.coordinates[0], place.geometry.coordinates[1]]); x, y
	var x = Math.round(coord[0] / terrainWidth * origTerrainWidth);
	var y = Math.round(coord[1] / terrainHeight * origTerrainHeight);
    
	if (x >= 0 && y >= 0 && x < origTerrainWidth && y < origTerrainHeight) {
	    var tcoord = translate(coord);
	    mesh.position.set(tcoord[0], tcoord[1], height / 2 + heightMap[y][x]);
	    scene.add(mesh);
	}
    }*/
    
    var $loading = $('#loading').hide();
    
    var loader = new THREE.STLLoader();

    loader.load("/3d/clef.stl", function (geometry) {
        //console.log(geometry);
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation(88.28013229370117, -107.79578018188477, -0.15874999761581415) );
	clefGeometry = geometry;
        //var mat = new THREE.MeshLambertMaterial({color: 0x7777ff});
        //group = new THREE.Mesh(geometry, mat);

	showTeostoVenues('http://api.teosto.fi/2014/municipality?name=TAMPERE&method=venues');
    });
}, function(event) {
    //console.log(event);
}, function (event) {
    console.log(event);
});

var projection = d3.geo.mercator()
    .translate([terrainWidth / 2, terrainHeight / 2])
    .scale((terrainHeight + terrainWidth) / 2 * 180)
    .rotate([-26, 0, 0])
    .center([23.75189 - 26, 61.48865]); // mercator: 8738897, 2644048;
    
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

			var height = 3.7648086547851562;
		    
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

    console.log(event);

    if (event.which == 1) {

	var mouse = new THREE.Vector2((event.clientX / renderer.domElement.width ) * 2 - 1, -( (event.clientY - 50) / renderer.domElement.height ) * 2 + 1);
	
	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects(allObjects);

	for (var i = 0; i < intersects.length; i++) {
            console.log(intersects[0]);
	    console.log(intersects[0].object.venue.name);

            intersects[i].object.material.transparent = true;
            intersects[i].object.material.opacity = 0.1;
	}
    }
}

$( window ).click(onClick);

var tube = undefined;

function onDocumentMouseMove(event) {
        var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( (event.clientY - 50) / (window.innerHeight)) * 2 + 1);
        vector = vector.unproject(camera);
	
        var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        var intersects = raycaster.intersectObjects(allObjects);
	
        if (intersects.length > 0) {
	    
            var points = [];
            points.push(new THREE.Vector3(-30, 39.8, 30));
            points.push(intersects[0].point);
	    
            var mat = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: false, opacity: 0.6});
            var tubeGeometry = new THREE.TubeGeometry(new THREE.SplineCurve3(points), 60, 0.001);
	    
            if (tube) scene.remove(tube);
	    
            tube = new THREE.Mesh(tubeGeometry, mat);
            scene.add(tube);
        }
}

//$( window ).mousemove(onDocumentMouseMove);
