
const typeConfigs = {
  'fill': [
    {
      label: 'type',
      type: 'inline',
      controls: [
        {
          type: 'select',
          params: {
            options: [
              {name:'Simple', value: 'simple'},
              {name:'Categories', value: 'categories'},
              {name:'Color Range', value: 'colors'}
            ]
          },
          path: `layers[1]['layer-type']`
        }
      ]
    },
    {
      label: 'Fill',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[1].paint['fill-color']`
        }
      ]
    },
    {
      label: 'Stroke',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[0].paint['line-color']`
        },
        {
          type: 'range',
          unit: 'px',
          path: `layers[0].paint['line-width']`,
          params: {
            min: "0",
            max: "10",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Opacity',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[1].paint['fill-opacity']`,
          params: {
            min: "0",
            max: "1",
            step: "0.01",
            default: "0.75",
            units: "%",
            format: (v) => Math.round(v * 100)
          }
        },
      ],
    }
  ],
  'circle': [
    
    {
      label: 'Fill',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[0].paint['circle-color']`
        }
      ],
    },
    {
      label: 'Size',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[0].paint['circle-radius']`,
          params: {
            min: "0",
            max: "20",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Stroke',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[0].paint['circle-stroke-color']`
        },
        {
          type: 'range',
          unit: 'px',
          path: `layers[0].paint['circle-stroke-width']`,
          params: {
            min: "0",
            max: "20",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Opacity',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[0].paint['circle-opacity']`,
          params: {
            min: "0",
            max: "1",
            step: "0.01",
            default: "0.75",
            units: "%",
            format: (v) => Math.round(v * 100)
          }
        },
      ],
    }
  ],
  'line': [
    {
      label: 'Type',
      type: 'inline',
      controls: [
        {
          type: 'select',
          params: {
            options: [
              {name:'Simple', value: 'simple'},
              {name:'Categories', value: 'categories'},
              {name:'Color Range', value: 'colors'}
            ]
          },
          path: `['layer-type']`
        }
      ]
    },
    {
      label: 'Color By',
      type: 'inline',
      conditional: {
        path: `['layer-type']`,
        conditions: ['categories', 'colors']
      },
      controls: [
        {
          type: 'selectViewColumn',
          params: {
            options: [
              {name:'Column Select', value: 'simple'},
              
            ]
          },
          path: `['data-column']`
        }
      ]
    },
    {
      label: 'Categories',
      type: 'popover',
      conditional: {
        path: `['layer-type']`,
        conditions: ['categories']
      },
      controls: [
        {
          type: 'categoryControl',
          params: {
            options: [
              {name:'Column Select', value: 'simple'},
              
            ]
          },
          path: `layers[1].paint['line-color']`
          // vars: {
            
          // }
        }
      ]
    },
    {
      label: 'Fill',
      type: 'inline',
      conditional: {
        path: `['layer-type']`,
        conditions: ['categories']
      },
      controls: [
        {
          type: 'categoricalColor',
          path: `['color-set']`
        }
      ],
    },
    {
      label: 'Fill',
      type: 'popover',
      conditional: {
        path: `['layer-type']`,
        conditions: ['simple']
      },
      controls: [
        {
          type: 'color',
          path: `layers[1].paint['line-color']`
        }
      ],
    },
    {
      label: 'Size',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[1].paint['line-width']`,
          params: {
            min: "0",
            max: "20",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Casing',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[0].paint['line-color']`
        },
        {
          type: 'range',
          unit: 'px',
          path: `layers[0].paint['line-width']`,
          params: {
            min: "0",
            max: "20",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Opacity',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[1].paint['line-opacity']`,
          params: {
            min: "0",
            max: "1",
            step: "0.01",
            default: "0.75",
            units: "%",
            format: (v) => Math.round(v * 100)
          }
        },
      ],
    }
  ]
}

export default typeConfigs