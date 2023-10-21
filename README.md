# War Crimes Map
Created for Dev Challenge XX

Deployed app: https://war-crimes-map.vercel.app/

## Description
This project is a map of war crimes that the <sub><sup>r</sup></sub>ussia (terrorist state) has committed in Ukraine.

## Technical information
The solution is based on pure vanilla js with no libs using [Vite](https://vitejs.dev/) as a bundler.

## Project structure
- `assets` - assets needed for the application
- `components` - Project is using component-based approach with custom elements. Components are using `wcm-` prefix that means "war crimes map."
  - The `wcm-app` component is the main component that is containing the whole app, router, and orchestrates the data.
  - The `wcm-map` component is responsible for the map
  - The `wcm-navbar` component is responsible for the navigation bar
  - The `wcm-filter` component is responsible for the search and filter area
  - The `wcm-list` component is responsible for the list view of individual events
- `helpers` - Helper classes
  - `formatter` - Helper class to format things into strings
  - `math.helper` - Math functions that are not defined in the default Math class
  - `observable` - Observable implementation to add reactivity to the app
  - `stats.helper` - Helper class that helps to work with stats' information
- `services` - Services
  - `events.service` - Service that is responsible for the work with events. It is the source of truth for the events and fires new events when something is 
    changed
- `styles` - additional styles
  - `common` - styles that are common for the app and most likely needed in most/all components
  - `variables` - variables that are used in css
- `workers` - Web Workers
  - `reverse-geocoding-worker` - Web Worker that is responsible for the reverse geocoding and grouping events by cities, districts and regions. It is 
    implemented as a web worker to not block the main thread
- `constants.js` - contains generic constants for the app.
- `main.js` - file defines all components
- `main.css` - main css file that defines some top-level styles and fonts
- `enums.js` - enums ¯\_(ツ)_/¯

## Available functionality
- Showing a map of Ukraine
  - Map can be resized by the mouse wheel. It will zoom into the position of your mouse
  - The Map can be moved by dragging
- Show events on the map and group them depending on the scale:
  - When it is a small scale, it shows regions
  - When it is a medium scale, it shows districts
  - When it is a large scale, it shows cities
  - **Be aware!** Filters overrides zoom settings. So, if you filtered by the city, you will see city-level events, even if you zoomed out. Or if you 
    filtered by the region - you will see district-level events, even if you zoomed out. But zoom in will work as expected.
- Show different events in different colors on the map
- Load data and map data inside Web Worker, so it will not block the main thread, and we can show a spinner while it is loading.
- Show the legend at the bottom of the map
- Show count of events on the dot with the thousands' space separator
- Allow filtering events by:
  - crime type
  - region
  - city
- Make filter fields to work reactively with each other, for example:
  - If you select a region, the city field will be populated with cities from this region
  - If you select a city, the region field will be populated with the region of this city
  - If you select a city, crime type area will be populated with crime types that are present in this city
  - etc.
- Show how many events are filtered
- Allow clearing the filter
- On apply - filter the map
- List view that shows individual crimes. It is limited by `MAX_LIST_RECORDS` records. If there are more than `MAX_LIST_RECORDS` records, then we show a text 
  that 
  asks user to use filters to see more precise results
- Animates dots on the map
- Switch to the mobile design if the screen width is less than 1200
  - Change navbar buttons location
  - Change UA logo location
  - Change filters location
  - Open up filter on click
  - Animate filter when it opens and closes
  - Close filter when "Apply" button clicked
  - Make list view look nice
  - Change "Map" button color to black to be visible on the white-colored list view background
  - Allow moving the map by dragging on the mobile
  - Allow zooming the map by pinching on the mobile

## Geocoding
### General
In the `/src/assets/data` folder, you can find the following files:
- `ADM1.json` - first-order administrative division. A primary administrative division of a country, such as a state in the United States
- `ADM2.json` - second-order administrative division. A subdivision of a first-order administrative division
- `PPL.json` - populated place. A city, town, village, or another agglomeration of buildings where people live and work (in the database, corresponds to the 
  union of PPL, PPLC, PPLA, PPLA2, PPLA3, PPLW)

These files were created by taking the [geonames database](https://download.geonames.org/export/dump/) and converting them into better format for the project.
Ideally, it should be stored together with coordinates, but we cannot change the data inside `events.json`, so we have what we have :)

### Mapping lat/lng to the region/district/city
Reverse geocoding is implemented in the web worker `src/workers/reverse-geocoding-worker.js` to not block the main thread.
To geocode every point to the correct city, KD-tree is created from the list of all cities in Ukraine. 
Then we iterate over all events and find the closest city to the event using [Haversine formula](https://en.wikipedia.org/wiki/Haversine_formula).
After that, we group events by the city, district and the region.

This process is a time-consuming operation, so we show a spinner with a progress text while it is working.

## What I'd change if I had more time
- I'd clusterize events smarter.
  Because we're clusterizing by the city, district, region, some dots are pretty far from their actual position until the user 
  zooms in
- Do better scaling. With the current scaling approach, zoomed in version looks hideous
- Optimize performance when user zoomed in too much and show only what is visible on the screen
- Add more unit tests to cover service and components logic
- The Current approach to mapping is not the best. For the huge cities, it can map events on the outskirts of the city to villages near the city.
  - Possible fixes:
    - Use the proper service to accurately map events beforehand and store this information in the database (is not applicable to the challenge)
    - Count in the size of the city when calculating the distance to the city

## How to run
1. Clone the repo
2. Run `npm install`
3. Run `npm run dev`

## How to run test
1. Clone the repo
2. Run `npm install`
3. Run `npm run test`
