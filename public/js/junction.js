var scene = undefined;
var camera = undefined;
var renderer = undefined;
var backgroundScene = undefined;
var backgroundCamera = undefined;

var stats = undefined;

var controls = undefined;

var terrainWidth = 768;
var terrainHeight = 512;

var origTerrainWidth = 20;
var origTerrainHeight = 20;

var projection = undefined;

var gameBoard = undefined;
var pivotPoint = undefined;

var allObjects = [];
var traffic_lights = [];

// Traffic light materials
var blackLightMaterial = new THREE.MeshBasicMaterial({color: 0x333333, emissive: 0x000000});
var redLightMaterial = new THREE.MeshLambertMaterial({emissive: 0xFF0000});
var amberLightMaterial = new THREE.MeshLambertMaterial({emissive: 0xFFDF00});
var greenLightMaterial = new THREE.MeshLambertMaterial({emissive: 0x00FF00});

var traffic_light_meta = undefined;

var trafficLightIntervalID = undefined;

$(document).ready( function() {

    createMinimizeEventHandlers();

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
	top: '20%', // Top position relative to parent
	left: '50%' // Left position relative to parent
    };
    var target = document.getElementById('spinner');
    var spinner = new Spinner(opts).spin(target);
    $("#loading_text").append("<span>Tervetuloa, hetkinen...</span>");

    stats = initStats();

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, $('#webgl').innerWidth() / $('#webgl').innerHeight(), 0.1, 10000 );
    camera.position.set(30, 150, 200);
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({ alpha: true });
    //console.log($('#webgl').innerWidth());
    //console.log($('#webgl').innerHeight());
    renderer.setSize( $('#webgl').innerWidth(), $('#webgl').innerHeight());
    renderer.setClearColor(new THREE.Color(0xaaaaff, 1.0));
    document.getElementById('webgl').appendChild( renderer.domElement );

    controls = new THREE.TrackballControls(camera, renderer.domElement);

    projection = d3.geo.mercator()
	.translate([(terrainWidth) / 2, (terrainHeight) / 2])
	.scale(5715000)
	.rotate([-27, 0, 0])
	.center([23.7510681152 - 27, 61.5004237519]); // mercator: 8734817,5 - x, 2646699;

    pivotPoint = new THREE.Object3D();
    scene.add(pivotPoint);

    //var axes = new THREE.AxisHelper(200);
    //scene.add(axes);

    $("#loading_text").append('<br><span id="light_info">Laitetaan valot päälle</span>');
    addLights();
    
    $("#loading_text").append('<br><span id="bg_info">Ladataan taustakuvaa...</span>');
    setupBackground();
}); // $(document).ready

/*******************************************************************************
 * Setup functionality
 ******************************************************************************/

function setupBackground() {
    var texture = THREE.ImageUtils.loadTexture( '/images/backgrounds/2.jpg', undefined, function() {
	$("#bg_info").text('Ladataan taustakuva... valmis.');
	$("#loading_text").append('<br><span id="terrain_info">Ladataan karttaa...</span>');
	showMap();
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

function showMap() {

    var URL = '/images/mmlorto_tampere_junction.jpg';
    //var URL = '/images/Rock_rauta_rakkaus_1024x1024.png';

    var texture = THREE.ImageUtils.loadTexture(URL, undefined, function () {
	$("#terrain_info").text('Ladataan karttaa... valmis.');
    });
    texture.minFilter = THREE.LinearFilter;
    //console.log(texture);
    //var geometry = new THREE.PlaneGeometry(2048, 2048, 20, 20);
    var geometry = new THREE.PlaneGeometry(768, 512, origTerrainWidth - 1, origTerrainHeight - 1);
    var material = new THREE.MeshPhongMaterial({
	map: texture,
	side: THREE.DoubleSide
    });
    
    var ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;

    gameBoard = ground;
    scene.add(gameBoard);

    showExternalData();

    render();
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

    $("#light_info").text('Laitetaan valot päälle... valmis.');
}

function showExternalData() {
    
    $("#loading_text").append('<br><span id="external_data_info">Ladataan liikennevaloja...</span>');

    setupTrafficLights();

    setTimeout(function () {
	$('#loading').hide();
    }, 1000);
}


function setupTrafficLights() {

    var poleGeom = new THREE.CylinderGeometry(8, 8, 500);
    var upPartGeom = new THREE.BoxGeometry(60, 160, 20);
    var lightGeom = new THREE.CylinderGeometry(20, 20, 2, 12);

    var poleMaterial = new THREE.MeshLambertMaterial({color: 0x848484});
    var upPartMaterial = new THREE.MeshLambertMaterial({color: 0x2E2E2E});

    var trafficLightMesh = new THREE.Mesh(poleGeom, poleMaterial);

    var upPartMesh = new THREE.Mesh(upPartGeom, upPartMaterial);
    upPartMesh.position.y = 170;
    upPartMesh.position.z = 16;
    trafficLightMesh.add(upPartMesh);

    var topLightMesh = new THREE.Mesh(lightGeom, redLightMaterial);
    topLightMesh.name = "red";
    topLightMesh.rotation.x = 0.5 * Math.PI;
    topLightMesh.position.y = 50;
    topLightMesh.position.z = 11;
    upPartMesh.add(topLightMesh);

    var middleLightMesh = new THREE.Mesh(lightGeom, amberLightMaterial);
    middleLightMesh.name = "amber";
    middleLightMesh.rotation.x = 0.5 * Math.PI;
    middleLightMesh.position.y = 0;
    middleLightMesh.position.z = 11;
    upPartMesh.add(middleLightMesh);

    var bottomLightMesh = new THREE.Mesh(lightGeom, greenLightMaterial);
    bottomLightMesh.name = "green";
    bottomLightMesh.rotation.x = 0.5 * Math.PI;
    bottomLightMesh.position.y = -50;
    bottomLightMesh.position.z = 11;
    upPartMesh.add(bottomLightMesh);

    trafficLightMesh.scale.set(0.04, 0.04, 0.04);

    //console.log(trafficLightMesh);

    var pedestrianUpPartGeom = new THREE.BoxGeometry(60, 100, 20);
    var pedestrianLightMesh = new THREE.Mesh(poleGeom, poleMaterial);
    var pedestrianUpPartMesh = new THREE.Mesh(pedestrianUpPartGeom, upPartMaterial);
    pedestrianUpPartMesh.position.y = 200;
    pedestrianUpPartMesh.position.z = 16
    pedestrianLightMesh.add(pedestrianUpPartMesh);
    var pedestrianTopLightMesh = new THREE.Mesh(lightGeom, redLightMaterial);
    pedestrianTopLightMesh.name = "red";
    pedestrianTopLightMesh.rotation.x = 0.5 * Math.PI;
    pedestrianTopLightMesh.position.y = 25;
    pedestrianTopLightMesh.position.z = 11;
    pedestrianUpPartMesh.add(pedestrianTopLightMesh);
    var pedestrianBottomLightMesh = new THREE.Mesh(lightGeom, greenLightMaterial);
    pedestrianBottomLightMesh.name = "green";
    pedestrianBottomLightMesh.rotation.x = 0.5 * Math.PI;
    pedestrianBottomLightMesh.position.y = -25;
    pedestrianBottomLightMesh.position.z = 11;
    pedestrianUpPartMesh.add(pedestrianBottomLightMesh);
    pedestrianLightMesh.scale.set(0.04, 0.04, 0.04);

    //scene.add(pedestrianLightMesh);

    placeTrafficLights(trafficLightMesh, pedestrianLightMesh);
}

function placeTrafficLights(trafficLightMesh, pedestrianLightMesh) {
    d3.csv("data/traffic_lights.csv", function(data) {
	//console.log(data);
	
	for (var i = 0; i < data.length; i++) {
	    coord = projection([data[i].lng, data[i].lat]);
            //console.log(coord);
	    
	    var mesh = undefined;
	    if (data[i].light_name.charAt(0) == '_') {
		mesh = pedestrianLightMesh.clone();
	    }
	    else {
		mesh = trafficLightMesh.clone();
	    }

	    var rot = Math.PI / 180 * data[i].angle;
	    mesh.rotation.y = Math.PI - rot;
	    //mesh.rotation.y = 0.5 * Math.PI;
	    //mesh.rotation.z = -0.5 * Math.PI;
	    //mesh.rotation.x = 1.5 * Math.PI;
            makeInitialTransformations(mesh, coord);
	    mesh.position.z += 1.2;
	    mesh.name = data[i].light_name;
	    
	    mesh.info = [];
	    var text = data[i].light_name.charAt(0) == '_' ? "Jalankulkijan liikennevalo" : "Liikennevalo";
	    mesh.info.push(text + ": " + data[i].light_name);
	    pivotPoint.add(mesh);
	    traffic_lights.push(mesh);
	    allObjects.push(mesh);
	}

	updateTrafficLightsMeta();
    });
}

function updateTrafficLightsMeta() {
    var URL = 'http://data.itsfactory.fi/trafficlights/meta/tampere';
    
    $.getJSON(URL, function (data) {
	//console.log(data);
	
	traffic_light_meta = data.Meta[0].signals;

	if (trafficLightIntervalID == undefined) {
	    trafficLightIntervalID = setInterval(updateTrafficLights, 1000);
	    setInterval(updateTrafficLightsMeta, 604800000);
	}
    });
}

function updateTrafficLights() {
    var URL = 'http://data.itsfactory.fi/trafficlights/data/tampere';

    $.getJSON(URL, function (data) {
	//console.log(data);

	var trafficLightStates = data.Data[0].rows[0].signalStates;

	for (var i = 0; i < traffic_lights.length; i++) {
	    var light_meshes = traffic_lights[i].children[0].children;

	    for (var j = 0; j < traffic_light_meta.length; j++) {
		if((traffic_lights[i].name.charAt(0) != '_' && traffic_lights[i].name.charAt(0) == traffic_light_meta[j].name) || 
		   (traffic_lights[i].name.charAt(0) == '_' && traffic_lights[i].name.charAt(1) == traffic_light_meta[j].name.charAt(1))) {
		    
		    var state = data.Data[0].rows[0].signalStates.charAt(traffic_light_meta[j].index);
		    
		    switch(state) {
		    case '0': // red and amber
			for (var k = 0; k < light_meshes.length; k++) {
			    if (light_meshes[k].name == "red") {
				light_meshes[k].material = redLightMaterial;
			    }
			    else if (light_meshes[k].name == "amber") {
                                light_meshes[k].material = amberLightMaterial;
                            }
			    else {
				light_meshes[k].material = blackLightMaterial;
                            }
			}
			break;
		    case '1':
		    case '3':
		    case '4':
		    case '5':
		    case '6':
		    case '7':
		    case '8':
		    case 'H': // green
			for (var k = 0; k < light_meshes.length; k++) {
                            if (light_meshes[k].name == "red") {
				light_meshes[k].material = blackLightMaterial;
                            }
                            else if (light_meshes[k].name == "amber") {
				light_meshes[k].material = blackLightMaterial;
                            }
                            else {
                                light_meshes[k].material = greenLightMaterial;
                            }
                        }
			break;
		    case ':': // blinking green
			for (var k = 0; k < light_meshes.length; k++) {
                            if (light_meshes[k].name == "red") {
                                light_meshes[k].material = blackLightMaterial;
                            }
                            else if (light_meshes[k].name == "amber") {
                                light_meshes[k].material = blackLightMaterial;
                            }
                            else {
				if (light_meshes[k].material == greenLightMaterial) {
				    light_meshes[k].material = blackLightMaterial;
				}
				else {
                                    light_meshes[k].material = greenLightMaterial;
				}
                            }
                        }
			break;
		    case ';': // flashing amber
			for (var k = 0; k < light_meshes.length; k++) {
                            if (light_meshes[k].name == "red") {
                                light_meshes[k].material = blackLightMaterial;
                            }
                            else if (light_meshes[k].name == "amber") {
				if (light_meshes[k].material == amberLightMaterial) {
                                    light_meshes[k].material = blackLightMaterial;
				}
				else {
				    light_meshes[k].material = amberLightMaterial;
				}
                            }
                            else {
                                light_meshes[k].material = blackLightMaterial;
                            }
                        }
			break;
		    case '<':
		    case '=':
		    case '>':
		    case 'I': // amber
			for (var k = 0; k < light_meshes.length; k++) {
                            if (light_meshes[k].name == "red") {
                                light_meshes[k].material = blackLightMaterial;
                            }
                            else if (light_meshes[k].name == "amber") {
                                light_meshes[k].material = amberLightMaterial;
                            }
                            else {
                                light_meshes[k].material = blackLightMaterial;
                            }
                        }
                        break;
		    case '9':
		    case '?':
		    case 'A':
		    case 'B':
		    case 'C':
		    case 'D':
		    case 'E':
		    case 'F':
		    case 'G':
		    case 'J': // red
			for (var k = 0; k < light_meshes.length; k++) {
                            if (light_meshes[k].name == "red") {
                                light_meshes[k].material = redLightMaterial;
                            }
                            else if (light_meshes[k].name == "amber") {
                                light_meshes[k].material = blackLightMaterial;
                            }
                            else {
                                light_meshes[k].material = blackLightMaterial;
                            }
                        }
			break;
		    default:
			//nothing to do, state undefined
		    }
		    break;
		}
	    }
        }
    });
}


/*******************************************************************************
 * Helper functionality
 ******************************************************************************/

function translate(point) {
  return [point[0] - (terrainWidth / 2), point[1] - (terrainHeight / 2)];
}

function makeInitialTransformations(mesh, coord) {

    var x = coord[0];
    x = Math.round(x / terrainWidth * origTerrainWidth);
    var y = coord[1];
    y = Math.round(y / terrainHeight * origTerrainHeight);
    coord = translate(coord);

    //console.log(coord);

    mesh.position.set(coord[0], -coord[1], 0);
    mesh.rotation.x = Math.PI / 2;
}

function render() {
    stats.update();

    controls.update();
    requestAnimationFrame(render);
    
    pivotPoint.rotation.x = gameBoard.rotation.x;
    pivotPoint.rotation.z = gameBoard.rotation.z;

    renderer.autoClear = false;
    renderer.clear();
    renderer.render(backgroundScene , backgroundCamera );
    renderer.render(scene, camera);
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
        //$("#object_info").hide();
        $("#object_info").css("visibility", "hidden");
    }
    else {
        var content = "";

        for (var i = 0; i < allInfo.length; i++) {
            content += '<div class="object_info_content">' + allInfo[i][0] + '</div>';
        }

        $("#object_info").empty();
        $("#object_info").append('<div id="object_info_contents">' + content + '</div>');
        $("#object_info").css({
            height: Number($("#object_info_contents").height()) + Number($("#object_info").css("padding"))
        });
        $("#object_info").css("visibility", "visible");
    }
}

function createMinimizeEventHandlers() {
    $('#legend_min_href').on('click', function(event) {
        event.preventDefault();
        if ($('#legend_min_img').attr('src') == "/images/arrow_carrot-down.png") {
            $('#legend_junction_content').hide();
            $('#legend_junction').css('height', 50);
            $('#legend_junction').css('width', 160);
            $('#legend_min_img').attr('src', "/images/arrow_carrot-up.png");
        }
        else {
            $('#legend_junction_content').show();
            $('#legend_junction').css('height', 300);
            $('#legend_junction').css('width', 300);
            $('#legend_min_img').attr('src', "/images/arrow_carrot-down.png");
        }
    });

    $('#loading_min_href').on('click', function(event) {
        event.preventDefault();
        if ($('#loading_min_img').attr('src') == "/images/arrow_carrot-down.png") {
            $('#loading_items').hide();
            $('#loading').css('height', 30);
            //$('#loading').css('width', '25%');
            $('#loading_min_img').attr('src', "/images/arrow_carrot-up.png");
        }
        else {
            $('#loading_items').show();
            $('#loading').css('height', 'calc(50% - 50px)');
            //$('#loading').css('width', '25%');
            $('#loading_min_img').attr('src', "/images/arrow_carrot-down.png");
        }
    });

    $('#loading_close_href').on('click', function(event) {
        event.preventDefault();
	$('#loading').hide();
    });
}
