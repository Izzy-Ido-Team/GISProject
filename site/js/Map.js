require(["esri/config", "esri/Map", "esri/views/MapView", "esri/layers/CSVLayer", "esri/layers/GraphicsLayer", "esri/widgets/TimeSlider", "esri/geometry/Circle", "esri/Graphic"], function (esriConfig, Map, MapView, CSVLayer, GraphicsLayer, TimeSlider, Circle, Graphic) {
    esriConfig.apiKey = "AAPKf31ae4a2e344423d8600437097e2d8a5QjPJWfZfJUHAPBUSJlUOInVwGVj725rxdzL_nu58NQgn4lYm53ivCRF2ONMOGF-a"
    const url =
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.csv";

    var map = new Map({
        basemap: "topo-vector"
    });
    var nlayer = undefined;

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
        timeExtent: {
            start: new Date().setDate(new Date().getDate() - 7),
            end: new Date()
        },
        stops: {
            interval: {
                value: 6,
                unit: "hours"
            }
        }
    });

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
    function timeStampFormat(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const second = date.getSeconds();
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    };


    const process = new Processor(1, 'days', 1000, url, 'url');
    document.getElementById('addLayer').addEventListener('click', function () {
        map.layers.add(csvLayer);
    });
    document.getElementById('addDifferenceLayer').addEventListener('click', function () {
        if(nlayer){
            map.layers.remove(nlayer);
        }
        const test1 = new Date().setDate(new Date().getDate() - 7);
        const test2 = new Date();

        const differences = process.generateDifference(test1, test2);
        
        const graphicCircles = []
        differences.normalizedLosses.forEach((circlePoint, index) => {
            const center = circlePoint.center1;
            const loss = circlePoint.loss;
            const shape = new Circle({
                center: [center.x, center.y],
                geodesic: true,
                numberOfPoints: 100,
                radius: 1000,
                radiusUnit: 'kilometers'
            });

            graphicCircles.push( new Graphic({
                geometry: shape,
                symbol: {
                    type: "simple-fill",
                    style: "solid",
                    color: [227, 139, 79, (loss * 0.9)],
                    outline: {
                        color: 'red',
                        width: 1
                    }
                },
                attributes: {
                    oid: index,
                    loss: loss
                }
            }));
        });

        differences.normalizedGain.forEach((circlePoint, index) => {
            const center = circlePoint.center2;
            const gain = circlePoint.gain;
            const shape = new Circle({
                center: [center.x, center.y],
                geodesic: true,
                numberOfPoints: 100,
                radius: 1000,
                radiusUnit: 'kilometers'
            });

            graphicCircles.push( new Graphic({
                geometry: shape,
                symbol: {
                    type: "simple-fill",
                    style: "solid",
                    color: [79, 139, 244, (gain*0.9)],
                    outline: {
                        color: 'blue',
                        width: 1
                    }
                },
                attributes: {
                    oid: index,
                    gain: gain
                }
            }));
        });

        


        console.log(graphicCircles)
        nlayer = new GraphicsLayer({
                graphics: graphicCircles
            });
        map.layers.add(nlayer);


        });


    });