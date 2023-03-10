
class Processor {
    timeRange;
    timeUnit;
    maxRadius;
    constructor(timeRange, timeUnit, maxRadius) {
        this.timeRange = timeRange;
        this.timeUnit = timeUnit;
        this.maxRadius = maxRadius
    }

    //Generate the difference GeoJSON
    generateDifference(Csv, time1, time2) {
        const timePoints1 = filterTimesWithinM(this.convertCSVtoArray(Csv), time1, this.timeRange, this.timeUnit);
        const timePoints2 = filterTimesWithinM(this.convertCSVtoArray(Csv), time2, this.timeRange, this.timeUnit);
        //find the central points of the time1;
        const {centers1,count1} = this.findPointCenters(timePoints1);
        //check how many points are within these circles in time2
        const {centers2, count2}= centers1.map((center,index)=>{
            const pointsWithin = timePoints2.filter((point)=>{
                return getDistance(point,center) <= this.maxRadius;
            })
            return {center,pointsWithin,points1:points1[index]};
        })

        const negativeFeatureSet = [];
        const positiveFeatureSet = [];

        //For each circle center, add a number of points equal to the difference between the timepoints
        //adding to the correct feature set
        centers1.forEach((center, index) => {
            if(count1[index] > count2[index]){
                for(let i = 0; i < count1[index] - count2[index]; i++){
                    negativeFeatureSet.push({
                        geometry: {
                            type: "point",
                            longitude: center.x,
                            latitude: center.y
                        }
                    });
                }
            }else if(count1[index] < count2[index]){
                for(let i = 0; i < count2[index] - count1[index]; i++){
                    positiveFeatureSet.push({
                        geometry: {
                            type: "point",
                            longitude: center.x,
                            latitude: center.y
                        }
                    });
                }
            }
        });
        const negativeGeoJSON = {
            type: "FeatureCollection",
            features: negativeFeatureSet
        };
        const positiveGeoJSON = {
            type: "FeatureCollection",
            features: positiveFeatureSet
        };
        return {negativeGeoJSON, positiveGeoJSON};

    }

    findPointCenters(timePoints) {
        const convertToCoordinates = timePoints.map((point) => {
            return { x: point.lat, y: point.long };
        });
        return this.findCircleCenters(convertToCoordinates, this.maxRadius);
    }

    //convert a csv into an array of objects with the attributes {time, lat, long, mag}
    convertCSVtoArray(Csv) {
        const lines = Csv.split("\n");
        const result = [];
        const headers = lines[0].split(",");
        for (let i = 1; i < lines.length; i++) {
            const obj = {};
            const currentline = lines[i].split(",");
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j];
            }
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
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
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

