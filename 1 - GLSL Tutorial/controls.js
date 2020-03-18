var xSpeed = 0.5;
var ySpeed = 0.5;
var zSpeed = 0.5;
var yRotSpeed = 0.05;
var xRotSpeed = 0.05;

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) 
{
	var keyCode = event.code;

	switch (keyCode)
	{
		case 'KeyA':
			window.xpress = -1;
			break;
		case 'KeyD':
			window.xpress = 1;
			break;
		case 'KeyW':
			window.zpress = -1;
			break;
		case 'KeyS':
			window.zpress = 1;
			break;
		case 'KeyE':
			window.ypress = 1;
			break;
		case 'KeyQ':
			window.ypress = -1;
			break;
		case 'ArrowLeft':
			window.yrpress = -1;
			break;
		case 'ArrowRight':
			window.yrpress = 1;
			break;
		case 'ArrowUp':
			window.xrpress = -1;
			break;
		case 'ArrowDown':
			window.xrpress = 1;
			break;
	}
};
document.addEventListener("keyup", onDocumentKeyUp, false);
function onDocumentKeyUp(event) 
{
	var keyCode = event.code;

	switch (keyCode)
	{
		case 'KeyA':
			window.xpress = 0;
			break;
		case 'KeyD':
			window.xpress = 0;
			break;
		case 'KeyW':
			window.zpress = 0;
			break;
		case 'KeyS':
			window.zpress = 0;
			break;
		case 'KeyE':
			window.ypress = 0;
			break;
		case 'KeyQ':
			window.ypress = 0;
			break;
		case 'ArrowLeft':
			window.yrpress = 0;
			break;
		case 'ArrowRight':
			window.yrpress = 0;
			break;
		case 'ArrowUp':
			window.xrpress = 0;
			break;
		case 'ArrowDown':
			window.xrpress = 0;
			break;
	}
};