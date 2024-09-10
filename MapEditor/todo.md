**Originally:**

- 1 layer = 1 view = 1 legend
- Could add any number of views, to get any number of legends
- Theoretically, could make all needed maps like this, with some ISSUES:
  - List of maps gets huge very fast -- 10 years per variable and 30 variables is an ugly list of 300 items
   - Need a way to group the legends so that we reduce the amount of information we need to display at once
  - Making all these maps takes a very long time because you have to click and add a view, and completely redo your legend
  - Even just `duplicate-layer` 300 times would take a long time.
  - We would have a ton of duplicate data inside our symbology object, which at some point gets too big for `localStorage`, and even sometimes causes network issues


**After `interactive-filters`**
- 1 layer = 1 view = many legends
- Allows you to make a logical grouping of legends
 - i.e. `Total Population`
  - Would be able to add a legend for every year, then the end-user could select which single year to view
  - Beforehand, user would have to toggle off 9 separate layers
- Still does not accomodate use case where data comes from different views
 - i.e. `view_1` is for year 1990, `view_2` is for year 1991. 


**Theoretical, if we add `view switcher`**
- 1 layer = many view = many legend
- Allows you to do a "simple interactive filter" where the data is split up across views, rather than columns inside a single view.
- We can accomodate the following data-variable structure (NOT HOW IT IS REPRESENTED IN CODE):

```
{
  "total pop": {
    years: [1990, 1991, 1992]
  }
}
```

That would be a single `layer` within a `symbology`. 
Depending on how the data is structured, the legends would look like:

//assuming all ONE `view`, so columns are "total_pop_1990", "total_pop_1991", etc.
//Each one of these COULD have a compeltely different legend styling. The user is completely selecting a column/color scheme/etc for EACH. 
{
  "filter-type": "interactive",
  "interactive-filters:[
    {
      ...styledata, //The user has to set this manually from scratch
      label: "total population 1990", //The user will want to change this
      view_id: 1, //RIGHT NOW, cannot be changed. But, I think eventually, we want to be able to.
      data-column: "total_pop_1990" //This is the load-bearing change
    },
    {
      ...styledata,
      label: "total population 1991", 
      view_id: 1,
      data-column: "total_pop_1991"
    }
  ]
}

//assuming MANY `view`, so columns are "total_pop", but we have a different view_id (and source, all that stuff), etc.
//These would have to have the same legend styling. The user only has to select `view_ids`, all other styling is applied to all.
{
  "filter-type": "abc", //doesn't actually matter
  "filter-source-views": {
    label: "Name of section",
    view_ids: [1, 2, ...list_of_view_ids]
  },
  "data-column": "total_pop",
}


- If type === 'interactive' , or `filter-source-views` is not null, display a `form control` that allows the user to choose from among the options

- If we could combine `interactive` and `filter-source-views`...
 - You could group a bunch of legends
  - i.e. `Census Vars`
  - Top level is an `interactive-filter`
  - Each legend is a single Census Var (i.e. `Total Population`)
  - Then, can set "filter-source-views", and grab `tot_pop` from many different underlying views
  - The end result, would be a dropdown to pick your "variable". And then another dropdown to select the "year".
 - **HOWEVER**, this would ONLY WORK if the years are split across files. If all the years and mushed together, you would be unable to have two dropdowns. 


SO, how to solve that ^^^ issue.

- In part, current `interactive-filter` is much overkill. We really only wanted to be able to group different `data-column` together. 
- So, what happens if we make that change? `interactive-filter` is still useful, as it allows for you to group things together that make no logical sense (aka clients love this)
- So, what if we change `interactive-filter`, to something more streamlined --


**POTENTIAL FUTURE CHANGE**
- Add a field... `filter-group`
```
{
  label: 'Total Population',
  column_names: ["total_pop_1990", "total_pop_1991"]
}

```
- If this field is present, in the legend, display a select menu that allows the user to switch what data column is shown.
- "Map Maker" can toggle "filter group" on/off via a toggle in the `StyleEditor`
 - If enabled, the existing `color-by` field should only allow for values that have been added to the `filter-group`
  - That way, the legend can be created in the exact same fashion
 - A new field should appear underneath the `color-by` field, that allows the "map maker" to add columns to the group


- I THINK, besides the UI stuff (especially the legend), most/all of this should be compatible with `interactive-legend`
 - Would just need to be able to accomodate 3 dropdowns
  - Top level -- "interactive-filter" level. Each item at this level could be completely different from each other (only shares a `source_id`)
    - "filter-group" level -- Allows the user to choose from among a list of `columns` in this `view`
    - "filter-source-views" level -- Allows the user to choose from among different `views`
- **POTENTIAL ISSUE**
  - No "dependencies"... bascially, if `filter-group` and `filter-source-views` are both there, we assume that all combinations of them work
- **FUTURE WORK**
  - Would need some way to allow the user recompute the legend breaks/values if they want.



**IMO TODO**
- Temporarily get rid of `interactive-filter` stuff in the legend
- Add `filter-group`
 - In `StyleEditor`, the user makes a `label` for the group, and selects a list of `columns` to include
 - In `LegendPanel`, the `label` and a `Select form control` are shown, where the user can change which `data-column` is used
- Add `filter-source-views`
 - In `StyleEditor`, the user makes a `label` for the group, and selects a list of `views` to include
 - In `LegendPanel`, the `label` and a `Select form control` are shown, where the user can change which `view_id` is used.
- Make `LegendPanel` work so that all 3 of `interactive-filter`, `filter-group`, and `filter-source-views` all show up nicely :D


**RANDO BUG TODO**
- If `filter-group` is enabled, and user switches to `simple` or `interactive`, the `filter-group` control is still present
 - `filterGroupEnabled` should be set to `false` (or something like that) when the layerType changes
- if the current `data-column` of a `filter-group` is changed via the `LegendPanel`, it will change the displayed value in the `StyleEditor`, but the legend is still BASED off of something else
 - Maybe just some text or indicator of what column was used to generate the legend. Maybe a star or something?
- FIX `colorSquare` for simple layer types. its all squished and small now
- MAYBE BUG -- for `interactive` filter group, the column select does not "typecheck"
- Do not allow user to have an interactive layer within an interactive layer...

 **UI/UX TODO**
 - Need an indicator  for which `view` generated the legend
  - Just reuse what you did for the filter-group-legend thing 
 - Need a method to recompute legend based on the selected `view`
 - Whenever we recompute the legend (column select change, num of breaks, etc.), MUST update the state properties that track what computed the legend
  - Otherwise, when the user takes an action such as changing the number of breaks in a color-range, it will recompute legend using whatever is being displayed on the map