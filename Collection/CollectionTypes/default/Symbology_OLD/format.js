const Symbology = {
  name: "string",
  views: [
    { viewId: "integer",
      layers: [
        { layerId: "string",
          type: "string:enum:[fill, line, circle]",
          show: "?boolean:default=true",
          minZoom: "?integer",
          maxZoom: "?integer",
          paintProperties: {
            paintProperty: {
              value: "?value",
              paintExpression: "?maplibreExpression",
              variable: {
                variableId: "string",
                displayName: "string:default=variableId",
                type: "string:enum:[data-variable, meta-variable]",
                paintExpression: "maplibreExpression",
                includeInLegend: "boolean:default=true",
                scale: {
                  type: "string:enum:[quantile, threshold, ordinal]",
                  range: "array:integer",
                  // domain: "array:integer|string",
                  // format: "?string"
                }
              }
            }
          },
          filters: {
            variableId: {
              filter: [],
              filterExpression: "maplibreExpression"
            }
          }
        }
      ],
      legends: [
        { id: "paintProperty|variableId",
          name: "string",
          type: "string:enum:[quantile, threshold, ordinal]",
          domain: "array:string",
          range: "array:string|integer",
          format: "?string"
        }
      ]
    }
  ]
}
