import { rgb2hex, toHex, categoricalColors } from '../../LayerManager/utils'

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