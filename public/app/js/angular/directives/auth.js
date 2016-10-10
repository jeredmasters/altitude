var app = angular.module('AltitudeApp');

app.directive('aRequire', ['$rootScope', 'AppCore', '$animate',
    function ($rootScope, AppCore, $animate) {
    return {
        restrict: 'A',
        scope: {},
        link: function ($scope, $elem, $attrs) {
            var NG_HIDE_CLASS = 'ng-hide';
            var NG_HIDE_IN_PROGRESS_CLASS = 'ng-hide-animate';

            $animate[AppCore.hasPermission($attrs.aRequire) ? 'removeClass' : 'addClass']($elem, NG_HIDE_CLASS, {
                tempClasses: NG_HIDE_IN_PROGRESS_CLASS
            });
        }
    };
}]);
app.directive('aPlan', ['$rootScope', 'AppCore', '$animate', 
    function ($rootScope, AppCore, $animate) {
    return {
        restrict: 'A',
        scope: {},
        link: function ($scope, $elem, $attrs) {
            var NG_HIDE_CLASS = 'ng-hide';
            var NG_HIDE_IN_PROGRESS_CLASS = 'ng-hide-animate';
            var subscribed = false;
            var companyState = $rootScope.state.company();
            if (companyState !== null) {
                if (companyState.subscription_plan == $attrs.aPlan) {
                    var status = companyState.subscription_status;
                    subscribed = (status == 'active' || status == 'trialing');
                }
            }
            $animate[subscribed ? 'removeClass' : 'addClass']($elem, NG_HIDE_CLASS, {
                tempClasses: NG_HIDE_IN_PROGRESS_CLASS
            });
        }
    };
}]);