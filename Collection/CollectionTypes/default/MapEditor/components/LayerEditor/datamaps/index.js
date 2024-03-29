
export function categoryPaint(column, categoryData, colors, num=10,) {
  let paint = ['match',
      ['to-string',['get', column]],
  ]
  Array.from(Array(10).keys()).forEach((d,i) => {
    let cat = ''+categoryData?.[i]?.[column]
      if(cat && cat != '[object Object]'){
        paint.push(''+categoryData?.[i]?.[column])
        paint.push(colors[i])
      }
  })
  paint.push('#ccc')
  return paint
}