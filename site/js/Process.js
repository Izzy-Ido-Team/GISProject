const earthRadiusKm = 6371;

class Processor {
    timeRange;
    timeUnit;
    maxRadius;
    src;
    srcType
    constructor(timeRange, timeUnit, maxRadius, src, srcType) {
        this.timeRange = timeRange;
        this.timeUnit = timeUnit;
        this.maxRadius = maxRadius
        this.src = src;
        this.srcType = srcType;
        if(srcType === 'url'){
            fetch(src).then((response) => {
                return response.text();
            }).then((text) => {
                this.src = text;
            });
        }
    }

    //Generate the difference GeoJSON
    generateDifference(time1, time2) {
        const srcAsArray = this.convertCSVtoArray(this.src);
        const timePoints1 = filterTimesWithinM(srcAsArray, time1, this.timeRange, this.timeUnit);
        const timePoints2 = filterTimesWithinM(srcAsArray, time2, this.timeRange, this.timeUnit);
        //find the central points of the time1;
        const result1 = this.findPointCenters(timePoints1);
        const {centers: centers1, counts: count1} = result1;
        //check how many points are within these circles in time2
        const result2= this.findPointCenters(timePoints2);
        const {centers: centers2, counts: count2} = result2;
        //find loss in centers1
        const lossInCenters = centers1.map((center1, index) => {
               const localCount1 = count1[index];
               const localCount2 = this.findLocalPointsAtTime(center1, timePoints2).length;
               const loss = localCount1 - localCount2;
               return {center1, loss};
        }).filter(lossPoint => lossPoint.loss>0); // get rid of negative values
        let highestLoss = Math.max(...lossInCenters.map((lossPoint) => lossPoint.loss));
        if(highestLoss == 0){
            highestLoss = 1; //avoid divide by zero
        }
        const normalizedLosses = lossInCenters.map((lossPoint) => {
            const {center1, loss} = lossPoint;
            return {center1, loss: loss / highestLoss};
        });
        //find gain in centers2
        const gainInCenters = centers2.map((center2, index) => {
            const localCount1 = this.findLocalPointsAtTime(center2, timePoints1).length;
            const localCount2 = count2[index];
            const gain = localCount2 - localCount1;
            return {center2, gain};
        }).filter(gainPoint => (gainPoint.gain>0));// only include areas with gain
        let highestGain = Math.max(...gainInCenters.map((gainPoint) => gainPoint.gain));
        if(highestGain == 0){
            highestGain = 1; //avoid divide by zero
        }
        const normalizedGain = gainInCenters.map((gainPoint) => {
            const {center2, gain} = gainPoint;
            return {center2, gain: gain / highestGain};
        });
        
        //create the feature circles for example            
        
        return {normalizedLosses, normalizedGain};

    }

    findPointCenters(timePoints) {
        return findCircleCenters(timePoints, this.maxRadius);
    }

    findLocalPointsAtTime(center, timePoints){
        return timePoints.filter((point) => {
            const distance = getDistanceInKm(center.y, center.x, point.y, point.x);
            return distance <= this.maxRadius;
        });
    }

    //convert a csv into an array of objects with the attributes {time, lat, long, mag}
    convertCSVtoArray(src) {
        const lines = src.split("\n");
        const result = [];
        const headers = lines[0].split(",");
        for (let i = 1; i < lines.length; i++) {
            const obj = {};
            const currentline = lines[i].split(",");
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j];
            }
            obj.x=Number.parseFloat(obj['longitude']);
            obj.y=Number.parseFloat(obj['latitude']);
            result.push(obj);
        }
        return result;
    }
}


function findCircleCenters(points, maxRadius) {
    // Step 1: Sort the points based on x-coordinate
    points.sort((a, b) => {
        if (a.x === b.x) {
            return a.y - b.y;
        }
        return a.x - b.x;
    });

    // Step 2: Initialize variables
    const centers = [];
    const counts = [];
    let potentialCenter = points[0];
    let circlePoints = [potentialCenter];

    // Step 3 to 7: Iterate over points and determine circle centers
    for (let i = 1; i < points.length; i++) {
        const currentPoint = points[i];
        const distance = getDistance(currentPoint, potentialCenter);
        if (distance <= 2 * maxRadius) {
            circlePoints.push(currentPoint);
        } else {
            centers.push(getCircleCenter(circlePoints));
            counts.push(circlePoints.length);
            circlePoints = [currentPoint];
            potentialCenter = currentPoint;
        }
    }

    // Step 8: Add the final potential center
    centers.push(getCircleCenter(circlePoints));
    counts.push(circlePoints.length);

    return { centers, counts };
}

// Helper function to calculate distance between two points
function getDistance(point1, point2) {
    return getDistanceInKm(point1.y, point1.x, point2.y, point2.x);
}

// Helper function to calculate center of a circle given its points
function getCircleCenter(points) {
    let sumX = 0;
    let sumY = 0;
    for (const point of points) {
        sumX += point.x;
        sumY += point.y;
    }
    const centerX = sumX / points.length;
    const centerY = sumY / points.length;
    return { x: centerX, y: centerY };
}


// helper function to filter times within m time units of n
function filterTimesWithinM(points, n, m, unit) {
    const nTime = new Date(n);
    let mInMillis;

    switch (unit) {
        case "hours":
            mInMillis = m * 60 * 60 * 1000;
            break;
        case "days":
            mInMillis = m * 24 * 60 * 60 * 1000;
            break;
        case "weeks":
            mInMillis = m * 7 * 24 * 60 * 60 * 1000;
            break;
        default:
            throw new Error("Invalid time unit specified.");
    }

    return points.filter(point => {
        const time = point.time;
        const timeInMillis = new Date(time).getTime();
        const isWithinM = Math.abs(timeInMillis - nTime.getTime()) <= mInMillis;
        return isWithinM;
    });
}
function degreeToRad(deg){
    return deg * (Math.PI/180);
  }


function getDistanceInKm(lat1, lon1, lat2, lon2){
    const dLat = degreeToRad(lat2 - lat1);
    
    // Calculate the longitudinal distance, accounting for the wrap-around
    const dLon = Math.abs(degreeToRad(lon2 - lon1));
    const lonWrap = (dLon > Math.PI) ? 2*Math.PI - dLon : dLon;
  
    // Use the haversine formula to calculate the great-circle distance
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(degreeToRad(lat1)) * Math.cos(degreeToRad(lat2)) *
              Math.sin(lonWrap/2) * Math.sin(lonWrap/2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
    const distance = earthRadiusKm * c;
  
    return distance;
};  
  

