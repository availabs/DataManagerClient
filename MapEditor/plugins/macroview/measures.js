//TODO
//format/map the time period/peak that is passed intop this

const measure_info = {
  'lottr': {
    'definition': ({period}) => `The 80th percentile travel time over 50th percentile travel time for each segment of road during ${period} travel times.`,
    'equation': () => `80th/50th percentile travel times`
  },
  'tttr': {
    'definition':() => `Truck Travel Time Reliability measure (ratio).`,
    'equation': ({period}) => `95th /50th percentile travel times during weekday ${period} hours.`
  },
  //todo this might just be `speed` internally
  'speed_pctl': {
    //TODO figure out a way to display when there is no peak selected
    'definition':({percentile, period}) => `The ${percentile} percentile speed across ${period}.`,
    'equation': () => ``
  },
  'phed': {
    //TODO -- need to map `freeflow` to better language/formatting (freeflow vs posted speed limit)
    //vehicleHours -- between person hours, vehicle hours
    //TODO if all traffic is selected, dont show that value
    'definition': ({freeflow, trafficType}) => `Excessive delay of ${trafficType}.
     Excessive delay means the extra amount of time spent in congested conditions defined by speed thresholds
     that are lower than a normal delay threshold. 
     For the purposes of this rule, the speed threshold is 20 miles per hour or 60 percent of ${freeflow}, whichever is greater.`,
    'equation': () => ``
  },
  // 'ted': {
  //   //TODO -- need to map `freeflow` to better language/formatting (freeflow vs posted speed limit)
  //   //trafficType -- truck vs all
  //   //TODO if all traffic is selected, dont show that value
  //   'definition': ({freeflow, trafficType}) => `Excessive delay of ${trafficType}.
  //    Excessive delay means the extra amount of time spent in congested conditions defined by speed thresholds
  //    that are lower than a normal delay threshold. 
  //    For the purposes of this rule, the speed threshold is 20 miles per hour or 60 percent of ${freeflow}, whichever is greater.`,
  //   'equation': () => ``
  // }
}

export {
  measure_info
}