import { useEffect, useRef } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Config from '@arcgis/core/config';


export const Arcgismap = ({dataPoints}) => {
    useEffect(() => {
        Config.apiKey = 'AAPKf31ae4a2e344423d8600437097e2d8a5QjPJWfZfJUHAPBUSJlUOInVwGVj725rxdzL_nu58NQgn4lYm53ivCRF2ONMOGF-a'
    }, []);
    const mapRef = useRef();
    const map = new Map({
        basemap: "streets-vector"
    });


    const view = new MapView({
        container: mapRef.current,
        map: map,
        zoom: 4,
    });

    return (
        <div>
            <div id={mapRef.current} style={{height: "100vh", width: "100vw"}}></div>
        </div>
    )
}