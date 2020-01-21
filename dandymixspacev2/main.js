var camera, scene, renderer, controls;

var screen; // Our ray tracer surface

init();
animate();

function init() 
{
	console.log("Initializing DandyDance Web :^)...")

	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
	camera.position.z = 1;

	scene = new THREE.Scene();


	createTracerSurface();


	// Setup our renderer 
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize, false);


	window.x = 0;
	window.y = 0;
	window.z = 5.0;
	window.xspeed = 0;
	window.yspeed = 0;
	window.zspeed = 0;
	window.xpress = 0;
	window.ypress = 0;
	window.zpress = 0;
	window.yrpress = 0;
	window.xrpress = 0;
	window.yRotSpeed = 0;
	window.xRotSpeed = 0;
	window.yrot = 0.0;
	window.xrot = 0.0;

	document.getElementById("info").innerHTML = '';

	console.log("Initialized DandyDance Web :^)")
}



function createTracerSurface()
{   
	let geometry = new THREE.Geometry();
	
	var lightdef1 = 
	{
		pos: new THREE.Vector3(4.0, 1.0, 5.0),
		colour: new THREE.Vector3(0.8, 1.0, 0.1),
		intens: 1.0,
		dist: 1.0
	}
	var lightdef2 = 
	{
		pos: new THREE.Vector3(-4.0, 5.0, -5.0),
		colour: new THREE.Vector3(1.0, 0.1, 0.1),
		intens: 1.0,
		dist: 1.0
	}
	var lightdef3 = 
	{
		pos: new THREE.Vector3(-1.0, 10.0, -7.0),
		colour: new THREE.Vector3(0.1, 0.1, 1.0),
		intens: 1.0,
		dist: 1.0
	}


	let uniforms = 
	{
		colorB: {type: 'vec3', value: new THREE.Color(0x232323)},
		colorA: {type: 'vec3', value: new THREE.Color(0x2c2c2c)},
		iResolution: {type: 'vec2', value: new THREE.Vector2(1920, 1080)},
		iTime: {type: 'float', value: 1.0 },
		scalePower: {type: 'float', value: 1.0 },
		fieldOfView: {type: 'float', value: 110.0 },
		eye: {type: 'vec3', value: new THREE.Vector3(window.x, window.y, window.z)},
		lights: {value: [ lightdef1, lightdef2, lightdef3 ] }, 
		eyeY: {type: 'float', value: 0.0 },
		eyeX: {type: 'float', value: 0.0 },
		shadowWorld: {type: 'int', value: 0 },
		ambientWorld: {type: 'int', value: 0 },
		distWorld: {type: 'int', value: 0 },
		slider: {type: 'float', value: 0.0 },
	}

	geometry = new THREE.BoxGeometry(2, 1, 1);
	
	screenMaterial =  new THREE.ShaderMaterial(
	{
		uniforms: uniforms,
		fragmentShader: window.shaders.fragmentShader,
		vertexShader: window.shaders.vertexShader,
	})

	let mesh = new THREE.Mesh(geometry, screenMaterial);

	mesh.position.x = 0;
	mesh.position.z = -3;
	mesh.position.y = 0;

	let s = 4;
	mesh.scale.x = s;
	mesh.scale.y = s;
	mesh.scale.z = s;
	
	scene.add(mesh);
	screen = mesh;
}

// This comment left as an exercise for the reader :^)
function onWindowResize() 
{
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}




function animate() 
{
	speedScale = 0.5; // TODO: Scale for FPS
	slowDown = 0.43*speedScale;
	speedUp  = 0.5*speedScale;
	rotSpeed = 0.5*speedScale;
	rotSlow = 0.1*speedScale;
	
	window.xspeed += window.xpress * speedUp;
	window.zspeed += window.zpress * speedUp;
	window.yspeed += window.ypress * speedUp;

	window.yRotSpeed += window.yrpress * rotSpeed;
	window.xRotSpeed += window.xrpress * rotSpeed;

	window.yRotSpeed *= rotSlow;
	window.xRotSpeed *= rotSlow;
	
	window.xspeed *= slowDown;
	window.yspeed *= slowDown;
	window.zspeed *= slowDown;


	window.xrot += window.xRotSpeed;
	window.yrot += window.yRotSpeed;

	// First calculate our movement
	var yAxis = new THREE.Vector3(0, -1, 0);
	var xAxis = new THREE.Vector3(-1, 0, 0);
	var update = new THREE.Vector3(window.xspeed, window.yspeed, window.zspeed);
	out = update.applyAxisAngle(xAxis, window.xrot);
	out = out.applyAxisAngle(yAxis, window.yrot);
	window.x += out.x;
	window.y += out.y;
	window.z += out.z;
	

	// Todo: don't check ever frame
	if (window.devicePixelRatio !== undefined)
		dpr = window.devicePixelRatio;
	else
		dpr = 1;

	requestAnimationFrame(animate);

	// Check settings
	if (document.getElementById("shadow").checked)
		screenMaterial.uniforms.shadowWorld.value = 1;		
	else
		screenMaterial.uniforms.shadowWorld.value = 0;
	if (document.getElementById("ambient").checked)
		screenMaterial.uniforms.ambientWorld.value = 1;		
	else
		screenMaterial.uniforms.ambientWorld.value = 0;
	if (document.getElementById("dist").checked)
		screenMaterial.uniforms.distWorld.value = 1;		
	else
		screenMaterial.uniforms.distWorld.value = 0;

	var sliderVal = document.getElementById("slider").value/100;
	screenMaterial.uniforms.slider.value = sliderVal;
	document.getElementById('sliderValue').innerHTML = sliderVal;

	screenMaterial.uniforms.iTime.value += 0.01;
	let screenx = window.innerWidth * dpr;
	let screeny = window.innerHeight * dpr;
	screenMaterial.uniforms.iResolution.value = new THREE.Vector2(screenx, screeny);
	screenMaterial.uniforms.eye.value = new THREE.Vector3(window.x, window.y, window.z);
	screenMaterial.uniforms.eyeY.value = window.yrot;
	screenMaterial.uniforms.eyeX.value = window.xrot;


	renderer.render(scene, camera);
}
