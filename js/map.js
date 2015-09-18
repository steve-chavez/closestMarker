$(function() {
	
    var mapOptions = {
        zoom: 14,
        center: new google.maps.LatLng(-12.07, -77.01),
        panControl: false,
        panControlOptions: {
            position: google.maps.ControlPosition.BOTTOM_LEFT
        },
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        scaleControl: false

    };
	
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    //superagent.get('http://localhost:3000/polyview').end(function(err, res){
        //map.data.addGeoJson(res.body[0]);
    //});

    var features = map.data.addGeoJson(laVictoria);
    map.data.setStyle(function(feature) {
        if(feature.getProperty('punto-medio'))
            var mapLabel = new MapLabel({
              text: feature.getProperty('nombre'),
              position: new google.maps.LatLng(feature.getProperty('punto-medio').lng, feature.getProperty('punto-medio').lat),
              map: map,
              fontSize: 15,
              align: 'center'
            });
        return ({
            fillColor: feature.getProperty('fill'),
            fillOpacity: 0.3,
            strokeWeight: 1,
            strokeOpacity: feature.getProperty('stroke-opacity'),
        });
    });

    var getRandomMarker = function(bounds) {
      var lat_min = bounds.getSouthWest().lat(),
          lat_range = bounds.getNorthEast().lat() - lat_min,
          lng_min = bounds.getSouthWest().lng(),
          lng_range = bounds.getNorthEast().lng() - lng_min;

      return new google.maps.LatLng(lat_min + (Math.random() * lat_range), 
                                    lng_min + (Math.random() * lng_range));
    }
    
    var cleanMarkers = function(markers){
        markers.forEach(function(e, i, a){
            e.setMap(null); 
        });
    };

    var generateRandomMarkers = function( map, number){
        var markers = [];
        var marker;
        var mapBounds = map.getBounds();
        for (var i = 0; i < number; i++) {
            marker = new google.maps.Marker({
                position: getRandomMarker(mapBounds), 
                map: map
            });   
            markers.push(marker);
        }
        return markers;
    };

    var calculateDistance = function(lat1, lon1, lat2, lon2) {
      var p = 0.017453292519943295;    // Math.PI / 180
      var c = Math.cos;
      var a = 0.5 - c((lat2 - lat1) * p)/2 + 
              c(lat1 * p) * c(lat2 * p) * 
              (1 - c((lon2 - lon1) * p))/2;

      return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }

    var getShortestDistancePoint = function(points, markerLat, markerLng){
        var minDistance = Infinity;
        var dist = 0;
        var position;
        points.forEach(function(e, i, a){
            var pointLat = e.getPosition().lat();
            var pointLng = e.getPosition().lng();
            dist = calculateDistance( markerLat, markerLng, pointLat, pointLng);
            if( dist < minDistance){
                minDistance = dist;
                position = { lat: pointLat, lng: pointLng};
            }
        }); 
        console.log(minDistance);
        return position;
    };

    var alreadyLoaded = false;
    var line = null;
    var markers = null;

    $("#buttonGenerate").click(function(){
        if(markers)
            cleanMarkers(markers);
        markers = generateRandomMarkers(map, $("#inputNroRecursos").val());
    });

    var doMain = function(event){
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        var path = []

        path.push({lat: lat, lng: lng});
        var point =  getShortestDistancePoint(markers, lat, lng);
        path.push(point);

        if(line) line.setMap(null);
        line = new google.maps.Polyline({
            path: path,
            map: map,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
    };

    //Geojson is limited, can't manipulate the editable attribute on polygon, so I set a listener to all map data
    map.data.addListener('rightclick', function(event) {
        doMain(event);
    });

    google.maps.event.addListener(map, "rightclick", function(event) {
        doMain(event);
    });
});

