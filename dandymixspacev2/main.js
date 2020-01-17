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
	window.yrot = 0.0;

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
		fieldOfView: {type: 'float', value: 100.0 },
		eye: {type: 'vec3', value: new THREE.Vector3(window.x, window.y, window.z)},
		lights: {value: [ lightdef1, lightdef2, lightdef3 ] }, 
		eyeY: {type: 'float', value: 0.0 },
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
	if (window.devicePixelRatio !== undefined)
		dpr = window.devicePixelRatio;
	else
		dpr = 1;

	requestAnimationFrame(animate);

	screenMaterial.uniforms.iTime.value += 0.01;
	let screenx = window.innerWidth * dpr;
	let screeny = window.innerHeight * dpr;
	screenMaterial.uniforms.iResolution.value = new THREE.Vector2(screenx, screeny);
	screenMaterial.uniforms.eye.value = new THREE.Vector3(window.x, window.y, window.z);
	screenMaterial.uniforms.eyeY.value = window.yrot;


	renderer.render(scene, camera);
}
