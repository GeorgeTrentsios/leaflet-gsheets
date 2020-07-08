/* global L Tabletop */

/*
 * Script to display two tables from Google Sheets as point and polygon layers using Leaflet
 * The Sheets are then imported using Tabletop.js and overwrite the initially laded layers
 */
var myLocation = {
  latitude: 40,   //US Default 
  longitude:-100  //US Default 
};
var map = null;
// init() is called as soon as the page loads
function init() {
  initTableTop(); //Initialize tableTop library
  mapCreate();    //Create Map
}
var sidebar = null; //George Trentsios Change after exams for learining reasons 
let panelID = "my-info-panel"; //George Trentsios Changed after exams for test learning reasons.
var panelContent = {          //George Trentsios Changed after exams for test learning reasons.
                      id: panelID,
                      tab: "<i class='fa fa-bars active'></i>",
                      pane: "<p id='sidebar-content'></p>",
                      title: "<h2 id='sidebar-title'>No state selected</h2>"
                  }; //George Trentsios Change after exams for learining reasons
/** George Trentsios Additional code**/

//Initialize TableTop library
function initTableTop(){
  //George Trentsios αλλάγη εκτός χρόνου μόνο το url των google documents σε JSON Format
  var pointsURL ="12Vkhj0GkPqvW2ID6__5OME4Q018o7qCKQubnl1PYofg";  //GTRE
  var polyURL ="1bCc8n_SV5mPKhHCsNVPCLKpoQRMziLtg2AMrlS517Qo" //GTRE
  
  /*
  var polyURL =
    "https://docs.google.com/spreadsheets/d/1EUFSaqi30b6oefK0YWWNDDOzwmCTTXlXkFHAc2QrUxM/edit?usp=sharing";
  var pointsURL =
    "https://docs.google.com/spreadsheets/d/1kjJVPF0LyaiaDYF8z_x23UulGciGtBALQ1a1pK0coRM/edit?usp=sharing";
  */
  Tabletop.init({ key: polyURL, callback: addPolygons, simpleSheet: true });
  Tabletop.init({ key: pointsURL, callback: addPoints, simpleSheet: true }); // simpleSheet assumes there is only one table and automatically sends its data  
}

window.addEventListener("DOMContentLoaded", init); //Call init after document load
//George Trentsios Customn Code Start
/* Event user located */
function onLocationFound(e) {
    //Add a marker to user  location
    var radius = e.accuracy;
    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();
    L.circle(e.latlng, radius).addTo(map);
}
/* Event error locating user */
function onLocationError(e) {
   //Inform user and aks  him to enter his address
   alert("Your location not founded, You can enter it by searching it wiht the magnifier");
}
//George Trentsios Customn Code End
//George Trentsios Encapsulate map creation in a function
function mapCreate(){
  // Create a new Leaflet map centered on the continental US
  map = L.map("map").setView([myLocation.latitude , myLocation.longitude], 4);

  // This is the Carto Positron basemap
  var basemap = L.tileLayer(
    "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='http://cartodb.com/attributions'>CartoDB</a>",
      subdomains: "abcd",
      maxZoom: 19
    }
  );
  basemap.addTo(map);

     sidebar = L.control  //George Trentsios Changed after exams for test learning reasons.
    .sidebar({
      container: "sidebar",
      closeButton: true,
      position: "right"
    })
    .addTo(map);

  //let panelID = "my-info-panel"; //George Trentsios Changed after exams for test learning reasons.
  /*
  panelContent = {          //George Trentsios Changed after exams for test learning reasons.
    id: panelID,
    tab: "<i class='fa fa-bars active'></i>",
    pane: "<p id='sidebar-content'></p>",
    title: "<h2 id='sidebar-title'>No state selected</h2>"
  };
  */
  sidebar.addPanel(panelContent);

  map.on("click", function() {
    sidebar.close(panelID);
  });
//George Trentsios Customn Code Start
  /** George Trentsios add address search Start*/  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider();

  var searchControl = L.esri.Geocoding.geosearch({
                            placeholder:"Give your address",
                            title:"Search for an address",
                            providers: [
                              arcgisOnline,
                              L.esri.Geocoding.mapServiceProvider({
                                label: 'Founded Addresses',
                                url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
                                layers: [2, 3],
                                searchFields: ['ADDRESS', ,"CITY",'COUNTRY']
                              })
                            ]
                        }).addTo(map);
  var results = L.layerGroup().addTo(map);
  searchControl.on('results', function (data) {
    map.fitBounds(response.results[0].bounds);  //George trentsios center map at given address
  });  
  map.locate({setView: true, maxZoom: 18});    //George Trentsis start getting user location
  map.on('locationfound', onLocationFound);  
 /** George Trentsios add address search End*/    
//George Trentsios Customn Code End   
}

// These are declared outisde the functions so that the functions can check if they already exist
var polygonLayer;
var pointGroupLayer;

// The form of data must be a JSON representation of a table as returned by Tabletop.js
// addPolygons first checks if the map layer has already been assigned, and if so, deletes it and makes a fresh one
// The assumption is that the locally stored JSONs will load before Tabletop.js can pull the external data from Google Sheets
function addPolygons(data) {
  if (polygonLayer != null) {
    // If the layer exists, remove it and continue to make a new one with data
    polygonLayer.remove();
  }

  // Need to convert the Tabletop.js JSON into a GeoJSON
  // Start with an empty GeoJSON of type FeatureCollection
  // All the rows will be inserted into a single GeoJSON
  var geojsonStates = {
    type: "FeatureCollection",
    features: []
  };

  for (var row in data) {
    // The Sheets data has a column 'include' that specifies if that row should be mapped
    if (data[row].include == "y") {
      var coords = JSON.parse(data[row].geometry);

      geojsonStates.features.push({
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: coords
        },
        properties: {
          name: data[row].name,
          summary: data[row].summary,
          state: data[row].state,
          local: data[row].local
        }
      });
    }
  }

  // The polygons are styled slightly differently on mouse hovers
  var polygonStyle = { color: "#2ca25f", fillColor: "#99d8c9", weight: 1.5 };
  var polygonHoverStyle = { color: "green", fillColor: "#2ca25f", weight: 3 };

  polygonLayer = L.geoJSON(geojsonStates, {
    onEachFeature: function(feature, layer) {
      layer.on({
        mouseout: function(e) {
          e.target.setStyle(polygonStyle);
        },
        mouseover: function(e) {
          e.target.setStyle(polygonHoverStyle);
        },
        click: function(e) {
          // This zooms the map to the clicked polygon
          // map.fitBounds(e.target.getBounds());

          // if this isn't added, then map.click is also fired!
          L.DomEvent.stopPropagation(e);

          document.getElementById("sidebar-title").innerHTML =
            e.target.feature.properties.name;
          document.getElementById("sidebar-content").innerHTML =
            e.target.feature.properties.summary;
          sidebar.open(panelID);
        }
      });
    },
    style: polygonStyle
  }).addTo(map);
}

// addPoints is a bit simpler, as no GeoJSON is needed for the points
// It does the same check to overwrite the existing points layer once the Google Sheets data comes along
function addPoints(data) {
  if (pointGroupLayer != null) {
    pointGroupLayer.remove();
  }
  pointGroupLayer = L.layerGroup().addTo(map);

  // Choose marker type. Options are:
  // (these are case-sensitive, defaults to marker!)
  // marker: standard point with an icon
  // circleMarker: a circle with a radius set in pixels
  // circle: a circle with a radius set in meters
  var markerType = "marker";

  // Marker radius
  // Wil be in pixels for circleMarker, metres for circle
  // Ignore for point
  var markerRadius = 100;

  for (var row = 0; row < data.length; row++) {
    var marker;
    if (markerType == "circleMarker") {
      marker = L.circleMarker([data[row].lat, data[row].lon], {radius: markerRadius});
    } else if (markerType == "circle") {
      marker = L.circle([data[row].lat, data[row].lon], {radius: markerRadius});
    } else {
      marker = L.marker([data[row].lat, data[row].lon]);
    }
    marker.addTo(pointGroupLayer);

    // UNCOMMENT THIS LINE TO USE POPUPS
    //marker.bindPopup('<h2>' + data[row].location + '</h2>There's a ' + data[row].level + ' ' + data[row].category + ' here');

    // COMMENT THE NEXT 14 LINES TO DISABLE SIDEBAR FOR THE MARKERS
    marker.feature = {
      properties: {
        location: data[row].location,
        category: data[row].category
      }
    };
    marker.on({
      click: function(e) {
        L.DomEvent.stopPropagation(e);
        document.getElementById("sidebar-title").innerHTML =
          e.target.feature.properties.location;
        document.getElementById("sidebar-content").innerHTML =
          e.target.feature.properties.category;
        sidebar.open(panelID);
      }
    });

    // AwesomeMarkers is used to create fancier icons
    var icon = L.AwesomeMarkers.icon({
      icon: "info-sign",
      iconColor: "white",
      markerColor: getColor(data[row].category),
      prefix: "glyphicon",
      extraClasses: "fa-rotate-0"
    });
    if (!markerType.includes("circle")) {
      marker.setIcon(icon);
    }
  }
}

// Returns different colors depending on the string passed
// Used for the points layer
function getColor(type) {
  switch (type) {
  case "Coffee Shop":
    return "green";
  case "Restaurant":
    return "blue";
  default:
    return "green";
  }
}
