import React, {useState, useMemo, useEffect} from 'react'
import { TabPanel,  ColorInput, useFalcor } from "modules/avl-components/src"
import { getColorRange } from 'utils/color-ranges'
import ckmeans from '../../../../utils/ckmeans'
import * as d3scale from "d3-scale"
import get from 'lodash.get'

/*{
      name: source.name,
      pgEnv,
      source: source,
      activeView: activeView,
      activeVariable: activeVar,

      attributes: get(source,'metadata',[])
        .filter(d => ['integer','string','number'].includes(d.type))
        .map(d => d.name),
      activeViewId: activeViewId,
      sources: get(mapData,'sources',[]), 
      layers: get(mapData,'layers',[]),
      symbology: {... get(mapData, `symbology`, {}), ...tempSymbology}
}*/


const SymbologyControls = ({layer, onChange=()=>{}}) => {
  const [symbology, setSymbology] = useState(get(layer, `symbology`, []))
  const [activeColumn, setActiveColumn] = useState('default')
  const columns =  useMemo(() =>  get(layer, 'attributes',[]),[layer])
  
  useEffect(() => {
  	console.log('symbology control change', symbology)
  	onChange(symbology)
  },[symbology])

  const mapLayer = React.useMemo(() => 
  	get(layer, `layers[0]`, {}),
  	[layer]
  )

  return React.useMemo(() => (
    <div className='border-t border-gray-300 h-full w-full'> 
      {/*<pre>
      	{JSON.stringify(symbology,null,3)}
    	</pre>*/}
    	
    	<div className='flex flex-1'>
	      <div className='py-3.5 px-2 text-sm text-gray-400'>Column : </div>
	      <div className='flex-1'>
	        <select  
	            className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
	            value={activeColumn}
	            onChange={(e) => setActiveColumn(e.target.value)}
	          >
	            <option  className="ml-2  truncate" value={null}>
	              Default    
	            </option>
	            {columns
	              .map((v,i) => (
	              <option key={i} className="ml-2  truncate" value={v}>
	                {v}
	              </option>
	            ))}
	        </select>
	      </div>
	    </div>

      <SymbologyControl
    		layerType={mapLayer.type}
    		layer={layer}
				symbology={symbology}
				setSymbology={setSymbology}
				activeColumn={activeColumn}
  		/>

    </div>
  ), [mapLayer,symbology, layer, activeColumn])
}

export default SymbologyControls



//
const SymbologyControl = (props) => {
  const paintAttributes = [
  	{
  		name: 'Fill Color',
  		layerType: 'fill',
  		paintAttribute: 'fill-color',
  		defaultData: '#ccc',
  		Component: ColorControl
  	},

  	// controls for line-type
  	{
  		name: 'Color',
  		layerType: 'line',
  		paintAttribute: 'line-color',
  		defaultData: '#ccc',
  		Component: ColorControl
  	},
  	{
  		name: 'Opacity',
  		layerType: 'line',
  		paintAttribute: 'line-opacity',
  		defaultData: '1',
  		Component: SimpleRangeControl
  	},
  	{
  		name: 'Width',
  		layerType: 'line',
  		paintAttribute: 'line-width',
  		defaultData: '1',
  		Component: SimpleNumberControl
  	}
  ]
  return (
    <div className=''>
    	<TabPanel 
        tabs={
        	paintAttributes
        		.filter(attr => attr.layerType === props.layerType)
        		.map(attr => {
        			return {
          			name: <div className='text-sm text-left'> {attr.name} </div>,
          			Component: () => (
	          			<PaintControl 
	          				{...props} 
	          				{...attr}
	          			/>
	          		)
    					}
    				})
    		}
        themeOptions={{tabLocation:'left'}}
       />
    </div>
  )
}


/*{
	'fill-color' : {
			default: {
				type: //
				value: 
			},
			columnOne : {
				type: //
				value: 
			}
	}	
}*/

const PaintControl = ({
		Component,
		paintAttribute, 
		defaultData,
		layer,
		activeColumn,
		symbology, 
		setSymbology
	}) => {

	const columnSymbology = useMemo(() => 
		get(symbology, `[${paintAttribute}].[${activeColumn}]`, {
				type: 'simple',
				value: defaultData
		})
	,[symbology, paintAttribute, activeColumn])

	
	const update = (attr,value) => {
		columnSymbology[attr] = value
		setSymbology({
			...symbology,
			[paintAttribute]: {
				[activeColumn] : columnSymbology
			}
		})
	}

	return (
		<div className='flex px-2 py-4 h-full'>
			<div className='bg-white flex-1 border border-gray-300 hover:bg-gray-100 h-full'>
				<Component
					symbology={columnSymbology}
					activeColumn={activeColumn}
					layer={layer}
					onChange={update}
				/>
			</div>
		</div>
	)
}

const ColorControl = ({activeColumn, layer, symbology,onChange}) => {
		const renderControl = React.useMemo(() => {
	  	switch(symbology.type) {
	  		case 'simple':
	  			return <SimpleColorControl 
						{...symbology}
						onChange={onChange}
					/>
	  		case 'scale-ordinal':
	  			return <OrdinalScaleColorControl 
						{...symbology}
						activeColumn={activeColumn}
						layer={layer}
						onChange={onChange}
					/>
	  		case 'scale-threshold':
	  			return <ThresholdScaleColorControl 
						{...symbology}
						activeColumn={activeColumn}
						layer={layer}
						onChange={onChange}
					/>
	  		default:
	  			return <div>Invalid Layer</div>
	  	}
	  },[symbology])

		return (
			<div>
				<div className='p-1'>
					<select 
						className='p-2 w-full bg-white'
						value={symbology.type} 
						onChange={v => onChange("type", v.target.value)} >
						<option value='simple'>Single Color</option>
						<option value='scale-ordinal'>Category</option>
						<option value='scale-threshold'>Threshold</option>
					</select>
				</div>
				{renderControl}

			</div>
		)

}

const SimpleColorControl = ({value,onChange}) => 
		<ColorInput 
			value={ value } small
      onChange={ v => onChange("value", v) }
      showInputs={ true }
     />

const ThresholdScaleColorControl = ({
	layer,
	activeColumn,
	value,
	onChange
}) => {
	const {falcor, falcorCache} = useFalcor();
	const [colorRange, setColorRange] = useState('Reds');
	const [numBins, setNumBins] = useState(5)
	const [domain, setDomain] = useState([])
	
	useEffect(() => {
		if(activeColumn !== 'default') {
			const {
	      activeViewId,
	      pgEnv
	    } = layer
	    // console.log('fetchData', activeViewId, activeVariable)
	    console.time(`SymbologyData ${activeViewId} ${activeColumn}`)
	    return falcor.get(['dama',pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'])
	      .then(d => {
	        let length = get(d, 
	          ['json', 'dama', pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'], 
	        0)
	        return falcor.chunk([
	          'dama',
	          pgEnv,
	          'viewsbyId',
	          activeViewId,
	          'databyIndex', 
	          [...Array(length).keys()],
	          activeColumn
	        ])
	      }).then(d => {
	        console.timeEnd(`SymbologyData ${activeViewId} ${activeColumn}`) 
	      })
	  }
  },[activeColumn])

	useEffect(() => {
		if(activeColumn !== 'default') {
			const {
	      activeViewId,
	      pgEnv
	    } = layer
      const dataById = get(falcorCache, 
        ['dama', pgEnv, 'viewsbyId', activeViewId, 'databyId'], 
      {})
      
      const domainData = Object.values(dataById).map( d => d[activeColumn] )
      
      if(domainData.length > 0){
      	console.log('domainData', domainData.length)
        let colorScale = getColorScale(domainData, numBins, colorRange) 
        let colors = Object.keys(dataById).reduce((out, id) => {
          out[+id] = colorScale(dataById[+id][activeColumn]) || "#000"
          return out
        },{})
        
        console.log(
        	'test',
        	domain.sort().toString() != colorScale.domain().sort().toString(),
        	domain.sort().toString(),colorScale.domain().sort().toString()
        )
	    	if(domain.sort().toString() != colorScale.domain().sort().toString()) {
		    	setDomain(colorScale.domain())
					
					// onChange(
					// 	'value', 
					// 	["get",["to-string",["get","ogc_fid"]], ["literal", colors]]
					// )
				}
      }
      
    }
	}, [falcorCache, numBins, colorRange,activeColumn])

	

	return (
		<div>
			Threshold {
				domain
					.map(d => <div>{d}</div>)
				
			}
		</div>
	)

} 
		

const OrdinalScaleColorControl = ({value,onChange}) => 
		<div> Ordinal Scale Color Control </div>
	
const SimpleRangeControl = ({symbology,onChange, min=0, max=1,step=0.01}) => 
		<div className = 'flex justify-between items-center p-1 '>
			<div className='pt-2'>
				<input 
					type='range'
					min={min}
					max={max}
					step={step}
					value={ symbology.value } 
		      onChange={ v => onChange("value", v.target.value) }
		     />
		  </div>
		  <div>{symbology.value}</div>
		</div>

const SimpleNumberControl = ({symbology,onChange, min=1, max=50,step=1}) => 
		<div className = 'flex justify-between items-center p-1 '>
			<div className='flex-1'>
				<input 
					className='p-2 w-full bg-white text-right'
					type='number'
					min={min}
					max={max}
					step={step}
					value={ symbology.value } 
		      onChange={ v => onChange("value", v.target.value) }
		     />
		  </div>
		  <div>px</div>
		</div>


function getColorScale(domain, numBins=5, color='Reds') {
    return d3scale.scaleThreshold()
        .domain(ckmeans(domain,Math.min(numBins,domain.length)))
        .range(getColorRange(numBins,color));
  }