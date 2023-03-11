require(["esri/config", "esri/Map", "esri/views/MapView", "esri/layers/CSVLayer", "esri/widgets/TimeSlider"], function(esriConfig, Map, MapView, CSVLayer, TimeSlider) {
    esriConfig.apiKey = "AAPKf31ae4a2e344423d8600437097e2d8a5QjPJWfZfJUHAPBUSJlUOInVwGVj725rxdzL_nu58NQgn4lYm53ivCRF2ONMOGF-a"
    const url =
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.csv";

    var map = new Map({
        basemap: "topo-vector"
    });

    const renderer = {
        type: "heatmap",
        colorStops: [
          { color: "rgba(63, 40, 102, 0)", ratio: 0 },
          { color: "#472b77", ratio: 0.083 },

          { color: "#ffff00", ratio: 1 }
        ],
        maxDensity: 0.01,
        minDensity: 0
      };

    var view = new MapView({
        container: "map",
        map: map,
        zoom: 4
    });

    var timeSlider = new TimeSlider({
        container: "timeSliderDiv",
        view: view,
        mode: "time-window",
        fullTimeExtent: {
          start: new Date().setDate(new Date().getDate() - 7),
          end: new Date()
        },
        timeExtent:{ 
            start: new Date().setDate(new Date().getDate() - 7),
            end: new Date()
        },
        stops: {
          interval: {
            value: 6,
            unit: "hours"
          }
        }});

    view.ui.add(timeSlider, "bottom-right");


    var csvLayer = new CSVLayer({
        url: url,
        title: "Magnitude 2.5+ earthquakes from the last week",
        copyright: "USGS Earthquakes",
        renderer: renderer,
    });

    updateDefinitionExpression(timeSlider.timeExtent);

    timeSlider.watch("timeExtent", function (value) {
        updateDefinitionExpression(value);
    });
  
    function updateDefinitionExpression(timeExtent) {
      const start = timeStampFormat(timeExtent.start);
      const end = timeStampFormat(timeExtent.end);
      csvLayer.definitionExpression = `time >= TIMESTAMP '${start}' AND time <= TIMESTAMP '${end}'`;
      console.log(csvLayer.definitionExpression)
    
    }
    // return date in format yyyy-mm-dd hh:mm:ss
    function timeStampFormat(date){
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const second = date.getSeconds();
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    };


    document.getElementById('addLayer').addEventListener('click', function() {
        map.layers.add(csvLayer);
    });


});