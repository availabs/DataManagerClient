import React, { useEffect, useRef } from "react"

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

export const rgb2hex=c=> {
	if(!c || typeof c !== 'string'){
		c =  defaultColors[generateRandom(0, defaultColors.length-1)]
	}
	// console.log('test', c)
	let out = '#'+c.match(/\d+/g).map(x=>(+x).toString(16).padStart(2,0)).join``
	return out
}

const toRGB = (color) => {
    const { style } = new Option();
    style.color = color;
    return style.color;
}

export const toHex = (color) => rgb2hex(toRGB(color))

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
	      "id": `${layer_id}_case`,
	      "type": "line",
	      "paint": {
	         "line-color": RGB_Log_Shade(-0.4, newColor),
	         "line-width": 3, 
	      },
	      "source": viewLayer.source,
	      "source-layer": viewLayer['source-layer']
	   	},
   		{
	      "id": layer_id,
	      "type": "line",
	      "paint": {
	         "line-color": newColor,
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
	      "id": `${layer_id}_case`,
	      "type": "line",
	      "paint": {
	         "line-color": RGB_Log_Shade(-0.4, newColor),
	         "line-width": 1, 
	      },
	      "source": viewLayer.source,
	      "source-layer": viewLayer['source-layer']
	    },
   	    {
	      "id": layer_id,
	      "type": "fill",
	      "paint": {
	         "fill-color": newColor,
	         "fill-opacity": 0.75, 
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

export const getValidSources = (sources, dama_host) => {
  return sources.map(src => {
  	let { id, source: { url, type } } = src;
    if(!url) return src; // postgres tiles have a differente structure
    if(url && url?.includes('.pmtiles')){
      url = url
        .replace("$HOST", dama_host)
        .replace('https://', 'pmtiles://')
        .replace('http://', 'pmtiles://')

    } else {
      url = url.replace("$HOST", dama_host)
    }
    
    return {
      id,
      source: {
        type,
        url: url
      }
    }
  });
}

export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export const categoricalColors = {
	"cat1": [
		'rgb(107, 184, 199)',
		'rgb(229, 102, 102)',
		'rgb(172, 114, 165)',
		'rgb(114, 172, 120)',
		'rgb(234, 147, 97)',
		'rgb(166, 140, 217)',
		'rgb(237, 190, 94)',
		'rgb(103, 203, 148)',
		'rgb(209, 152, 77)',
		'rgb(168, 169, 96)',
	],
	"cat2":[
		'rgb(234, 147, 97)',
		'rgb(136, 154, 221)',
		'rgb(198, 150, 88)',
		'rgb(139, 193, 168)',
		'rgb(225, 184, 81)',
		'rgb(206, 126, 168)',
		'rgb(184, 203, 128)',
		'rgb(152, 135, 196)',
		'rgb(223, 215, 129)',
		'rgb(148, 209, 152)'
	],
	"cat3":[
		'rgb(119, 170, 221)',
		'rgb(238, 136, 102)',
		'rgb(238, 221, 136)',
		'rgb(255, 170, 187)',
		'rgb(153, 221, 255)',
		'rgb(68, 187, 153)',
		'rgb(187, 204, 51)',
		'rgb(112, 128, 207)',
		'rgb(170, 170, 0)',
		'rgb(170, 68, 153)'
	],
	"cat4":[
		'rgb(155, 201, 69)',
		'rgb(138, 81, 158)',
		'rgb(228, 136, 7)',
		'rgb(195, 75, 143)',
		'rgb(46, 137, 194)',
		'rgb(60, 175, 154)',
		'rgb(249, 122, 113)',
		'rgb(223, 173, 22)',
		'rgb(116, 116, 205)',
		'rgb(179, 136, 86)'
	],
	"cat5":[
		'rgb(92, 107, 192)',
		'rgb(255, 167, 38)',
		'rgb(236, 64, 122)',
		'rgb(66, 165, 245)',
		'rgb(255, 112, 67)',
		'rgb(102, 187, 106)',
		'rgb(255, 213, 79)',
		'rgb(38, 166, 154)',
		'rgb(255, 138, 101)',
		'rgb(126, 87, 194)'
	],
	"cat6":[
		'rgb(204, 102, 119)',
		'rgb(51, 34, 136)',
		'rgb(221, 204, 119)',
		'rgb(17, 119, 51)',
		'rgb(136, 204, 238)',
		'rgb(136, 34, 85)',
		'rgb(68, 170, 153)',
		'rgb(153, 153, 51)',
		'rgb(170, 68, 153)',
		'rgb(238, 119, 51)'
	],
	"cat7": [
		'rgb(129, 144, 71)',
		'rgb(93, 106, 42)',
		'rgb(172, 114, 165)',
		'rgb(107, 71, 128)',
		'rgb(114, 127, 192)',
		'rgb(76, 89, 154)',
		'rgb(179, 126, 117)',
		'rgb(141, 87, 78)',
		'rgb(166, 140, 43)',
		'rgb(76, 141, 154)'
	],
	"cat8": [
		'rgb(255, 115, 87)',
		'rgb(255, 142, 66)',
		'rgb(255, 173, 41)',
		'rgb(249, 203, 21)',
		'rgb(147, 208, 83)',
		'rgb(40, 189, 140)',
		'rgb(7, 166, 171)',
		'rgb(64, 142, 191)',
		'rgb(107, 127, 184)',
		'rgb(138, 111, 165)'
	],
	"cat9": [
		'rgb(201, 63, 54)',
		'rgb(219, 96, 51)',
		'rgb(233, 125, 43)',
		'rgb(242, 154, 38)',
		'rgb(248, 187, 42)',
		'rgb(191, 202, 88)',
		'rgb(139, 179, 111)',
		'rgb(103, 158, 125)',
		'rgb(69, 130, 124)',
		'rgb(40, 109, 128)'
	]
}
