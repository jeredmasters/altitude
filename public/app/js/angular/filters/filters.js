'use strict';

/* Filters */

var app = angular.module('AltitudeApp');

app.filter("sanitize", ['$sce', function ($sce) {
    return function (htmlCode) {
        return $sce.trustAsHtml(htmlCode);
    }
}]);