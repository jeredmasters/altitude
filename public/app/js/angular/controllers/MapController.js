'use strict';
var app = angular.module('AltitudeApp');

app.controller('MapCtrl', ['$scope', '$rootScope', 'CacheManager', 'AppCore', 'SharedState', 'NgMap',
	function ($scope, $rootScope, CacheManager, AppCore, SharedState, NgMap) {
	    SharedState.initialize($scope, "modal_disclaimer");
	    SharedState.initialize($scope, "modal_legend");
	    SharedState.initialize($scope, "modal_mapHelp");
	    SharedState.initialize($scope, "modal_info");

	    $rootScope.baseButtons = [
	        {
	            label: 'Disclaimer',
	            icon: 'exclamation-circle',
	            click: function () {	                
	                SharedState.turnOn('modal_disclaimer');
	            }
	        },
            {
                label: 'Help',
                icon: 'question-circle',
                click: function () {
                    SharedState.turnOn('modal_mapHelp');
                }
            },
            {
                label: 'Legend',
                icon: 'info-circle',
                click: function () {
                    SharedState.turnOn('modal_legend');
                }
            },
	    ];


	    var forceHelp = false;
	    if (!($rootScope.getUserSetting('mapDisclaimerSeen') == 'true')) {
	        forceHelp = true;	        
	        SharedState.turnOn('modal_disclaimer');	        
	    }
	    
	    $scope.hideModal = function () {
	        if (forceHelp) {
	            SharedState.turnOn('modal_mapHelp');
	        }
	        $rootScope.setUserSetting('mapDisclaimerSeen', 'true');
            forceHelp = false;
	    }
	    NgMap.getMap().then(function (map) {
	        _map = map;
	    });
	    var red = "#FF0000";
	    var orange = "#FF7E00";
	    var yellow = "#FFC600";
	    var _map;


	    $scope.red = red;
	    $scope.orange = orange;
	    $scope.yellow = yellow;


	    $scope.circles = {};

	    

	    $scope.showAirport = function (marker, airport, index) {
	        $scope.airport = airport;
	        SharedState.turnOn('modal_info');
	    }
	    $scope.getColor = function (size) {
	        switch (size) {
	            case 'Closed':
	                return "#999";
	                break;
	            case 'Small':
	                return "#FFC600";
	                break;
	            case 'Medium':
	                return "#FF7E00";
	                break;
	            case 'Large':
	                return "#FF0000";
	                break;
	        }
	    }
	    $scope.getMessage = function (size) {
	        switch (size) {
	            case 'Closed':
	                return 'No permission required, just be alert';
	                break;
	            case 'Small':
	                return 'No permission required, just be alert';
	                break;
	            case 'Medium':
	                return 'Issue NOTAM';
	                break;
	            case 'Large':
	                return 'Must get area approval before flying';
	                break;
	        }
	    }
	    $scope.getStyle = function (size) {
	        var color = $scope.getColor(size);
	        switch (size) {
	            case 'Closed':
	            case 'Small':
	                return 'background-color: ' + color + ';color: #000;font-weight: 500;';
	                break;
	            case 'Medium':
	            case 'Large':
	                return 'background-color: ' + color + ';color: #FFF;font-weight: 700;';
	                break;
	        }
	    }
	    $scope.markerDropped = function (event) {
	        var me = event.latLng;
	        for (var i = 0; i < window.airportData.length ; i++) {
	            var ap = new google.maps.LatLng(window.airportData[i].lat, window.airportData[i].long);
	            var dist = (google.maps.geometry.spherical.computeDistanceBetween(me, ap) / 1000).toFixed(2);

	            if (dist < 300 && $scope.circles[i] === undefined) {
	                $scope.circles[i] = window.airportData[i];
	            }
	        }
	        $scope.$apply();
	    }
	    function getNormalizedCoord(coord, zoom) {
	        var y = coord.y;
	        var x = coord.x;

	        // tile range in one direction range is dependent on zoom level
	        // 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
	        var tileRange = 1 << zoom;

	        // don't repeat across y-axis (vertically)
	        if (y < 0 || y >= tileRange) {
	            return null;
	        }

	        // repeat across x-axis
	        if (x < 0 || x >= tileRange) {
	            x = (x % tileRange + tileRange) % tileRange;
	        }

	        return {
	            x: x,
	            y: y
	        };
	    }
	    $scope.$on('mapInitialized', function (event, map) {
	        var myloc = new google.maps.Marker({
	            clickable: false,
	            icon: new google.maps.MarkerImage('//maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
					new google.maps.Size(22, 22),
					new google.maps.Point(0, 18),
					new google.maps.Point(11, 11)),
	            shadow: null,
	            zIndex: 999,
	            map: map
	        });

	        var serverIndex = 0;
	        var servers = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
	        var customMapTypeOptions = {
	            getTileUrl: function (coord, zoom) {
	                var normalizedCoord = getNormalizedCoord(coord, zoom);
	                if (!normalizedCoord) {
	                    return null;
	                }
	                var bound = Math.pow(2, zoom);
	                if (serverIndex >= servers.length) {
	                    serverIndex = 0;
	                }

	                var url = 'http://' + servers[serverIndex] + '.tile.openweathermap.org/map/pressure_cntr/' + zoom + '/' + normalizedCoord.x + '/' + normalizedCoord.y + '.png';
	                serverIndex++;

	                //getImageServer() + '/' + zoom + '/' + normalizedCoord.x + '/' + normalizedCoord.y + '.jpg';
	                return url;
	            },
	            tileSize: new google.maps.Size(256, 256),
	            maxZoom: 15,
	            minZoom: 3,
	            radius: 1738000,
	            scrollwheel: false, // disableScrollingWithMouseWheel as default
	        };

	        var textureMapType = new google.maps.ImageMapType(customMapTypeOptions);

	        navigator.geolocation.getCurrentPosition(function (pos) {
	            var me = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
	            myloc.setPosition(me);
	            map.setCenter(me);
	            $scope.me = { lat: pos.coords.latitude, long: pos.coords.longitude};
	            $scope.markerDropped({ latLng: me });
	            $scope.$apply();
	        }, function (error) {
	            alert('position error: ' + error.message);
	        }, {
	            enableHighAccuracy: false,
	            timeout: 20000
	        });

	    });

	}
]);
