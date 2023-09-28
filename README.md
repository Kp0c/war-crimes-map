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
- The `wcm-filter` component is responsible for the filter area

`main.js` files defines all components

## Available functionality
- Showing a map of Ukraine

## TODO
- [x] Show a map on full Screen
- [x] Add left sidebar UI
- [x] Add right (empty for now) sidebar UI
- [ ] Add the search section UI
- [ ] Add the Filters section UI
- [ ] Add Filters functionality (Working crime filter)
- [ ] Add events to the map (The map displays all the data)
- [ ] Allow the map to be resized
- [ ] Create events grouping based on the zoom level
- [ ] Create a List View
- [ ] Add Dots animation
- [ ] Add mobile design
- [ ] Documentation
- [ ] Test deployment

## How to run
1. Clone the repo
2. Run `npm install`
3. Run `npm run dev`
