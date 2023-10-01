# War Crimes Map
Created for Dev Challenge XX

## Description
This project is a map of war crimes that the <sub><sup>r</sup></sub>ussia (terrorist state) has committed in Ukraine.

## Technical information
The solution is based on pure vanilla js with no libs using [Vite](https://vitejs.dev/) as a bundler.

I'm using component-based approach with custom elements. All components are in src/components folder.

Components are using `wcm-` prefix that means "war crimes map."

- The `wcm-app` component is the main component that is containing the whole app.
- The `wcm-map` component is responsible for the map
- The `wcm-navbar` component is responsible for the navigation bar
- The `wcm-filter` component is responsible for the search and filter area

Additional classes:
- `helpers/observable.js` a small observable to add reactivity
- `services/events.service.js` a service that is responsible for the work with events

Few more general files:
- `main.js` files defines all components
- `constants.js` contains generic constants for the app.
- `enums.js` contains enums

## Available functionality
- Showing a map of Ukraine
  - Map can be resized by the mouse wheel. It will zoom into the position of your mouse
  - Map can be moved by dragging
- Show events on the map and group them depending on the scale:
  - When it is a small scale, it shows regions
  - When it is a medium scale, it shows districts
  - When it is a large scale, it shows cities
- Show different events in different colors on map
- On loading we take a bit more time to map all events to the cities, districts and regions. So, when user started to use applciation he 
  will see no lags.
- Show the legend at the bottom of the map

## Geocoding
### General
In the `data` folder, you can find the following files:
- `ADM1.json` - first-order administrative division. A primary administrative division of a country, such as a state in the United States
- `ADM2.json` - second-order administrative division. A subdivision of a first-order administrative division
- `PPL.json` - populated place. A city, town, village, or another agglomeration of buildings where people live and work

These files were created by taking the [geonames database](https://download.geonames.org/export/dump/) and converting them into better format for the project.
Ideally, it should be stored together with coordinates, but we cannot change the data inside `events.json`, so we have what we have :)

### Mapping lat/lng to the region/district/city
With `geokdbush-tk`, `kdbush` libraries and data from geonames database, we can find the closest city/village to the lat/lng coordinates.

## TODO
- [x] Show a map on full Screen
- [x] Add left sidebar UI
- [x] Add right (empty for now) sidebar UI
- [x] Add the search section UI
- [x] Add the Filters section UI
- [x] Add events to the map (The map displays all the data)
- [x] Create grouping of events. Scale X -> show regions. Scale Y -> show ADM2, Scale Z -> show cities 
- [x] Add the list of crime types at the bottom
- [ ] Show amount on the event
- [ ] Add Filters functionality (Working crime filter)
- [x] Allow the map to be resized
- [ ] Create a List View
- [ ] Add Dots animation
- [ ] Add mobile design
- [ ] Documentation
- [x] Use correct fonts
- [ ] Test deployment
- [ ] (Optional) improve scaling
- [ ] (Optional) Get rid of geokdbush
- [ ] (Optional) extract data processing to the service worker to improve performance

## What I'd change if I had more time
- I'd clusterize the events smarter.
  Because we're clusterizing by the city, district, region, some dots are pretty far from their actual position until the user 
  zoom in
- Improve performance of mapping. Not sure what we can do here, because we need to map tens of thousands events on tens of thousands cities.
- Do better scaling. With the current scaling approach, zoomed in version looks very ugly

## How to run
1. Clone the repo
2. Run `npm install`
3. Run `npm run dev`

## How to run test
1. Run `npm run test`

Yeap, it is THAT simple :D
