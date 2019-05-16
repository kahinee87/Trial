
mapboxgl.accessToken = 'pk.eyJ1IjoiY3dob25nIiwiYSI6IjAyYzIwYTJjYTVhMzUxZTVkMzdmYTQ2YzBmMTM0ZDAyIn0.owNd_Qa7Sw2neNJbK6zc1A';

var map = new mapboxgl.Map({
  container: 'mapContainer',
  style: 'mapbox://styles/mapbox/light-v9',
  center: [-73.930864,40.647238],
  zoom: 13.2,
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());


var LandUseLookup = (code) => {
  switch (code) {
    case 1:
      return {
        color: '#f4f455',
        description: '1 & 2 Family',
      };
    case 2:
      return {
        color: '#f7d496',
        description: 'Multifamily Walk-up',
      };
    case 3:
      return {
        color: '#FF9900',
        description: 'Multifamily Elevator',
      };
    case 4:
      return {
        color: '#f7cabf',
        description: 'Mixed Res. & Commercial',
      };
    case 5:
      return {
        color: '#ea6661',
        description: 'Commercial & Office',
      };
    case 6:
      return {
        color: '#d36ff4',
        description: 'Industrial & Manufacturing',
      };
    case 7:
      return {
        color: '#dac0e8',
        description: 'Transportation & Utility',
      };
    case 8:
      return {
        color: '#5CA2D1',
        description: 'Public Facilities & Institutions',
      };
    case 9:
      return {
        color: '#8ece7c',
        description: 'Open Space & Outdoor Recreation',
      };
    case 10:
      return {
        color: '#bab8b6',
        description: 'Parking Facilities',
      };
    case 11:
      return {
        color: '#5f5f60',
        description: 'Vacant Land',
      };
    case 12:
      return {
        color: '#5f5f60',
        description: 'Other',
      };
    default:
      return {
        color: 'transparent',
        description: 'Other',
      };
  }
};


// a little object for looking up neighborhood center points
var neighborHoodLookup = {
  'Crown-Heights': [-73.931347,40.660131],
  'Lefferts-Garden': [-73.931304,40.646522],
  'East-Flatbush': [-73.930489,40.636036],
  'Flatlands': [-73.926680,40.616624],
  'utica-avenue':[-73.932753,40.638186],
}


// we can't add our own sources and layers until the base style is finished loading
map.on('style.load', function() {
  // add a button click listener that will control the map
  // we have 4 buttons, but can listen for clicks on any of them with just one listener
  $('.flyto').on('click', function(e) {
    // pull out the data attribute for the neighborhood using query
    var neighborhood = $(e.target).data('neighborhood');

    // this is a useful notation for looking up a key in an object using a variable
    var center = neighborHoodLookup[neighborhood];

    // fly to the neighborhood's center point
    map.flyTo({center: center, zoom: 14.5});
  });

  // let's hack the basemap style a bit
  // you can use map.getStyle() in the console to inspect the basemap layers
  map.setPaintProperty('water', 'fill-color', '#a4bee8')

  //this sets up the geojson as the source on themap which we can use to add visuals layers
  map.addSource('Pluto-data',{
    type: 'geojson',
    data: './data/Pluto-data.geojson',
  });


  map.addLayer ({
    id: 'utica-lots-fill',
    type: 'fill',
    source: 'Pluto-data',
    paint: {
      'fill-opacity': 0.7,
      'fill-color':{
              type: 'categorical',
              property: 'landuse',
              stops: [
           [
             '01',
             LandUseLookup(1).color,
           ],
           [
             "02",
             LandUseLookup(2).color,
           ],
           [
             "03",
             LandUseLookup(3).color,
           ],
           [
             "04",
             LandUseLookup(4).color,
           ],
           [
             "05",
             LandUseLookup(5).color,
           ],
           [
             "06",
             LandUseLookup(6).color,
           ],
           [
             "07",
             LandUseLookup(7).color,
           ],
           [
             "08",
             LandUseLookup(8).color,
           ],
           [
             "09",
             LandUseLookup(9).color,
           ],
           [
             "10",
             LandUseLookup(10).color,
           ],
           [
             "11",
             LandUseLookup(11).color,
           ],
         ]
       }
   }
 }, 'waterway-label')




        // add an outline to the tax lots which is only visible after zoom level 14.8
    map.addLayer({
           id: 'utica-lots-line',
           type: 'line',
           source: 'Pluto-data',
           paint: {
             'line-opacity': 0.7,
             'line-color': 'gray'
             'line-opacity': {
               stops: [[14, 0], [14.8, 1]], // zoom-dependent opacity, the lines will fade in between zoom level 14 and 14.8
             }
           }
         });


        // add an empty data source, which we will use to highlight the lot the user is hovering over
        map.addSource('outline-feature', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        })

        // add a layer for the highlighted lot
        map.addLayer({
          id: 'outline-line',
          type: 'line',
          source: 'outline-feature',
          paint: {
            'line-width': 3,
            'line-opacity': 0.9,
            'line-color': 'white',
          }
        });

        // when the mouse moves, do stuff!
        map.on('mousemove', function (e) {
          // query for the features under the mouse, but only in the lots layer
          var features = map.queryRenderedFeatures(e.point, {
              layers: ['utica-lots-fill'],
          });

          // get the first feature from the array of returned features.
          var lot = features[0]

          if (lot) {  // if there's a lot under the mouse, do stuff
            map.getCanvas().style.cursor = 'pointer';  // make the cursor a pointer

            // lookup the corresponding description for the land use code
            var landuseDescription = LandUseLookup(parseInt(lot.properties.landuse)).description;


            // use jquery to display the address and land use description to the sidebar
            $('#address').text(lot.properties.address);
            $('#landuse').text(landuseDescription);


            // set this lot's polygon feature as the data for the highlight source
            map.getSource('outline-feature').setData(lot.geometry);
          } else {
            map.getCanvas().style.cursor = 'default'; // make the cursor default

            // reset the highlight source to an empty featurecollection
            map.getSource('outline-feature').setData({
              type: 'FeatureCollection',
              features: []
            });
          }
        })
      })
