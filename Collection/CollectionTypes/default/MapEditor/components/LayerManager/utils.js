
export const defaultColors = [
	'rgb(80, 149, 127)',
	'rgb(159, 161, 69)',
	'rgb(128, 182, 109)',
	'rgb(122, 168, 36)',
	'rgb(96, 117, 159)',
	'rgb(55, 124, 164)',
	'rgb(78, 139, 212)',
	'rgb(104, 198, 222)',
	'rgb(136, 154, 221)',
	'rgb(143, 125, 191)',
	'rgb(158, 101, 179)',
	'rgb(191, 105, 162)',
	'rgb(204, 98, 92)',
	'rgb(235, 147, 96)',
	'rgb(213, 176, 42)',
	'rgb(242, 218, 58)',
	'rgb(173, 122, 103)',
	'rgb(130, 100, 100)',
	// 'rgb(51, 51, 51)',
	'rgb(128, 128, 128)',
	'rgb(204, 204, 204)',
]



function getCircleLayer( layer_id, viewLayer) {
	const newColor = defaultColors[generateRandom(0, defaultColors.length-1)]
	return [
   		{
	      "id": layer_id,
	      "type": "circle",
	      "paint": {
	         "circle-color": newColor,
	         "circle-radius": 4,
	         "circle-stroke-color": RGB_Log_Shade(-0.4, newColor),
	         "circle-stroke-width": 1 
	      },
	      "source": viewLayer.source,
	      "source-layer": viewLayer['source-layer']
	   }
	]
}

function getLineLayer( layer_id, viewLayer) {
	const newColor = defaultColors[generateRandom(0, defaultColors.length-1)]
	return [
   		{
	      "id": layer_id,
	      "type": "line",
	      "paint": {
	         "line-color": newColor,
	         "line-width": 3, 
	      },
	      "source": viewLayer.source,
	      "source-layer": viewLayer['source-layer']
	   },
	   {
	      "id": `${layer_id}_case`,
	      "type": "line",
	      "paint": {
	         "line-color": RGB_Log_Shade(-0.4, newColor),
	         "line-width": 3, 
	      },
	      "source": viewLayer.source,
	      "source-layer": viewLayer['source-layer']
	   }
	]
}

function getFillLayer( layer_id, viewLayer) {
	const newColor = defaultColors[generateRandom(0, defaultColors.length-1)]
	return [
   		{
	      "id": layer_id,
	      "type": "fill",
	      "paint": {
	         "fill-color": newColor,
	         "fill-opacity": 0.75, 
	      },
	      "source": viewLayer.source,
	      "source-layer": viewLayer['source-layer']
	   },
	   {
	      "id": `${layer_id}_case`,
	      "type": "line",
	      "paint": {
	         "line-color": RGB_Log_Shade(-0.4, newColor),
	         "line-width": 1, 
	      },
	      "source": viewLayer.source,
	      "source-layer": viewLayer['source-layer']
	   }
	]
}

export const getLayer = (layer_id, viewLayer) => {
	
	const layerByType = {
		fill: getFillLayer,
		line: getLineLayer,
		circle: getCircleLayer
	}

	let gotLayer = layerByType[viewLayer?.type] ? 
		layerByType[viewLayer?.type](layer_id, viewLayer) :
		[viewLayer]
	// console.log('gotlayer', gotLayer)
	return gotLayer
}


//-------------------
// rgb transform
// RGB_Log_Shade ( 0.42, color1 ); // rgb(20,60,200) + [42% Lighter] => rgb(166,171,225)
// RGB_Log_Shade ( -0.4, color5 ); // #F3A + [40% Darker] => #c62884
// RGB_Log_Shade ( 0.42, color8 ); // rgba(200,60,20,0.98631) + [42% Lighter] => rgba(225,171,166,0.98631)
// ---------------------------
const RGB_Log_Shade=(p,c)=>{
    var i=parseInt,r=Math.round,[a,b,c,d]=c.split(","),P=p<0,t=P?0:p*255**2,P=P?1+p:1-p;
    return"rgb"+(d?"a(":"(")+r((P*i(a[3]=="a"?a.slice(5):a.slice(4))**2+t)**0.5)+","+r((P*i(b)**2+t)**0.5)+","+r((P*i(c)**2+t)**0.5)+(d?","+d:")");
}



function generateRandom(min = 0, max = 100) {
	return Math.floor(  Math.random() * (max - min)) + min;
}