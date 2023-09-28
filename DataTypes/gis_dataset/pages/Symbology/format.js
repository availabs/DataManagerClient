const Symbology = [
  { name: "string",
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
                  filterExpression: "?maplibreExpression",
                  paintExpression: "?maplibreExpression",
                  scale: {
                    type: "string:enum:[quantile, threshold, ordinal]",
                    range: "array:string",
                    domain: "?array:string|integer",
                    format: "?string"
                  }
                }
              }
            }
          }
        ]
      }
    ]
  }
]
