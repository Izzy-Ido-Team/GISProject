require(["esri/config", "esri/Map", "esri/views/MapView"], function(esriConfig, Map, MapView) {
    esriConfig.apiKey = "AAPKf31ae4a2e344423d8600437097e2d8a5QjPJWfZfJUHAPBUSJlUOInVwGVj725rxdzL_nu58NQgn4lYm53ivCRF2ONMOGF-a"
    var map = new Map({
        basemap: "topo-vector"
    });
    var view = new MapView({
        container: "map",
        map: map,
        zoom: 4
    });
});