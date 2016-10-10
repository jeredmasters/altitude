var app = angular.module('AltitudeApp');

app.directive('help', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'E',
        replace: true,
        template: '<i class="fa fa-question-circle fa-2x text-primary" style="margin: 10px; cursor: pointer; {{style}}" ng-click="openHelp()"></i>',
        transclude: true,
        scope: {
            title: '@',
            style: '@'
        },
        controller: function ($scope, $transclude) {
            var body = "not set";
            $transclude(function (clone, scope) {
                /* for demo am converting to html string*/
                body = angular.element('<div>').append(clone).html();
                //body = clone[0].innerHTML;
            });

            //var body = element.find('#helpBody').html();
            //element.find('#helpBody').remove();

            //var body = element.html();

            $scope.openHelp = function () {
                $rootScope.helpTitle = $scope.title;
                $rootScope.helpBody = body;
                $rootScope.helpModal();
            }

        }
    }
}]);
app.directive('fileModel', ['$parse',
	function ($parse) {
	    return {
	        restrict: 'A',
	        link: function (scope, element, attrs) {
	            var model = $parse(attrs.fileModel);
	            var modelSetter = model.assign;

	            element.bind('change', function () {
	                scope.$apply(function () {
	                    if (element[0].files.length > 1) {
	                        modelSetter(scope.$parent, element[0].files);
	                    }
	                    else {
	                        modelSetter(scope.$parent, element[0].files[0]);
	                    }
	                });
	            });
	        }
	    };
	}
]);
app.directive('aStripe', ['$window',
function ($window) {

    var directive = { restrict: 'A' };
    directive.link = function (scope, element, attributes) {
        var form = angular.element(element);
        form.bind('submit', function () {
            var button = form.find('button');
            button.prop('disabled', true);
            $window.Stripe.createToken(form[0], function () {
                button.prop('disabled', false);
                var args = arguments;
                scope.$apply(function () {
                    scope.$eval(attributes.aStripe).apply(scope, args);
                });
            });
        });
    };
    return directive;

}]);