import { rgb2hex, toHex, categoricalColors } from '../../LayerManager/utils'
import ckmeans, {equalIntervalBreaks, jenksBreaks, prettyBreaks} from '~/pages/DataManager/utils/ckmeans'

export function categoryPaint(column, categoryData, colors, num=10, showOther='#ccc') {
  let paint = ['match',
      ['to-string',['get', column]],
  ]
  Array.from(Array(+num).keys()).forEach((d,i) => {
    let cat = ''+categoryData?.[i]?.[column]
      if(cat && cat != '[object Object]'){
        paint.push(''+categoryData?.[i]?.[column])
        paint.push(toHex(colors[i % colors.length]))
      }
  })
  paint.push(showOther)
  return paint
}

export function isValidCategoryPaint(paint) {
  let valid = typeof paint === 'object'
  paint.forEach(cat => {
    if(!cat || cat === 'undefined') {
      valid = false
    }
  }) 
  return valid
}

let methods = {
  'ckmeans': ckmeans,
  'equalInterval': equalIntervalBreaks, 
  'jenks': ckmeans,//jenksBreaks, 
  'pretty': prettyBreaks
}

export function choroplethPaint( column, choroplethdata, colors, num=10, method='ckmeans' ) {
  console.log('paint method', method)
  let paint = [
      'step',
      ['get', column],
     
      //'#51bbd6',
      // 100,
  ]
  // console.log('choroplethdata', choroplethdata)
  if(!Array.isArray(choroplethdata)) {
    return false
  }
  let domain = methods[method](choroplethdata, num)

  if(!Array.isArray(domain) || domain.length  === 0){
    return false
  }

  domain
   //.filter((d,i) => i < domain.length-1)
    .forEach((d,i) => {
    paint.push(colors[i]);
    paint.push(+d)
  })

  paint.push(colors[num-1])

  return paint

  let inerpaint = [
      'interpolate',
      ['linear'],
      [get, 'column'],
      // 274,
      // ['to-color', '#f5e5f3'],
      // 1551,
      // ['to-color', '#8d00ac']
  ]


}