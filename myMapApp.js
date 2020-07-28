var myLocation = {
    latitude: 40, //US Default
    longitude: -100 //US Default
};
var map          = null;
var sidebar      = null; 
var panelID      = "my-info-panel"; 
var panelContent = { 
    id: panelID,
    tab: "<i class='fa fa-bars active'></i>",
    pane: "<p id='sidebar-content'></p>",
    title: "<h2 id='sidebar-title'>No state selected</h2>"
}; 
var basemap = null;

class myMapApp {
    constructor() {
        // Create a new Leaflet map centered on the continental US
        map = L.map("map").setView([myLocation.latitude, myLocation.longitude], 4);
        // This is the Carto Positron basemap
        basemap = L.tileLayer(
                "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png", {
                attribution:
                "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='http://cartodb.com/attributions'>CartoDB</a>",
                subdomains: "abcd",
                maxZoom: 19
            });
        basemap.addTo(map);

        sidebar = L.control //George Trentsios Changed after exams for test learning reasons.
            .sidebar({
                container: "sidebar",
                closeButton: true,
                position: "right"
            })
            .addTo(map);
        sidebar.addPanel(panelContent);
		
        map.on("click", function () {
            sidebar.close(panelID);
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider();

        var searchControl = L.esri.Geocoding.geosearch({
                placeholder: "Give your address",
                title: "Search for an address",
                providers: [
                    arcgisOnline,
                    L.esri.Geocoding.mapServiceProvider({
                        label: 'Founded Addresses',
                        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
                        layers: [2, 3],
                        searchFields: ['ADDRESS', , "CITY", 'COUNTRY']
                    })
                ]
            }).addTo(map);

        var results = L.layerGroup().addTo(map);

        searchControl.on('results', function (data) {
            map.fitBounds(response.results[0].bounds); //George trentsios center map at given address
        });

        map.locate({
            setView: true,
            maxZoom: 18,
            enableHighAccuracy: true
        });

        map.on('locationfound', onLocationFound);
        map.on('locationerror', onLocationError);
    };

    /* Event user located */
    onLocationFound(e) {
        //Add a marker to user  location
        var radius = e.accuracy;
        L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();
        L.circle(e.latlng, radius).addTo(map);
    };

    /* Event error locating user */
    onLocationError(e) {
        //Inform user and aks  him to enter his address
        alert("Your location not founded, You can enter it by searching it wiht the magnifier");
    };

}
var myMap = new myMapApp();

