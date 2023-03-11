import React, { useEffect, useRef } from 'react';
import { loadModules } from 'esri-loader';

const ArcGISMap = (props) => {
  const mapRef = useRef();

  useEffect(() => {
    loadModules(['esri/Map', 'esri/views/MapView']).then(([Map, MapView]) => {
      const map = new Map({
        basemap: 'streets-vector'
      });

      const view = new MapView({
        container: mapRef.current,
        map: map,
        zoom: 4,
        center: [-98.583, 39.833] // You can set the initial center and zoom level of the map here
      });

      // You can add any additional layers or graphics to the map here
    });
  }, []);

  return (
    <div className="map" ref={mapRef}></div>
  );
}

export default ArcGISMap;