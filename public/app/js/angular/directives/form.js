var app = angular.module('AltitudeApp');

var nextBtn = '<div ng-show="aStyle == \'fill\'"><br><br><button class="btn btn-primary btn-lg pull-right" value="Next" ng-click="next()">Next <i class="fa fa-arrow-circle-o-right"></i></button></div>';

app.directive('aInput', ['$compile', function ($compile) {
	return {
		restrict: 'A',
		replace: false,
		terminal: true,
		priority: 1000,

		link: function(scope, element, attrs) {

			element.attr('a-' + scope.$eval(attrs.aInput), ""); //add dynamic directive

			element.removeAttr("a-input"); //remove the attribute to avoid indefinite loop
			element.removeAttr("data-a-input");

			$compile(element)(scope);
		}
	};
}]);
app.directive('aText', [function() {
	return {
		require: 'ngModel',
		template: '<input ng-model="asdf" class="form-control form-square">' + nextBtn,
		scope: {
			aStyle: '@',
			ngModel: '=',
			aClick: '&'
		},
		link: function($scope, el, attr) {
			if ($scope.aStyle == 'display'){
				var value = $scope.ngModel;
				var template = '<span>'+value+'</span>';
				el.html(template);
			}
			
			$scope.asdf = $scope.ngModel;
			$scope.next = function (){
				$scope.aClick();
			}
			el.bind('change', function(obj, datum) {
				$scope.$apply(function() {
					$scope.ngModel = $scope.asdf;
				});
			});
		}

	};
}]);
app.directive('aNumber', [function () {
    return {
        require: 'ngModel',
        template: '<input type="number" ng-model="asdf" class="form-control form-square">' + nextBtn,
        scope: {
            aStyle: '@',
            ngModel: '=',
            aClick: '&'
        },
        link: function ($scope, el, attr) {
            if ($scope.aStyle == 'display') {
                var value = $scope.ngModel;
                var template = '<span>' + value + '</span>';
                el.html(template);
            }

            $scope.asdf = $scope.ngModel;
            $scope.next = function () {
                $scope.aClick();
            }
            el.bind('change', function (obj, datum) {
                $scope.$apply(function () {
                    $scope.ngModel = $scope.asdf;
                });
            });
        }

    };
}]);
app.directive('aTextarea', [function() {
	return {
		require: 'ngModel',
		template: '<textarea class="form-control form-square" style="font-size:1.4em; height: 5em" ng-model="asdf"></textarea>' + nextBtn,
		scope: {
			aStyle: '@',
			ngModel: '=',
			aClick: '&'
		},
		link: function($scope, el, attr) {
			if ($scope.aStyle == 'display'){
				var value = $scope.ngModel;
				var template = '<span>'+value+'</span>';
				el.html(template);
			}
			
			$scope.asdf = $scope.ngModel;
			$scope.next = function (){
				$scope.aClick();
			}
			el.bind('change', function(obj, datum) {
				$scope.$apply(function() {
					$scope.ngModel = $scope.asdf;
				});
			});
		}
	};
}]);
app.directive('aNumber', [function() {
	return {
		require: 'ngModel',
		template: '<input ng-model="asdf" type="number" class="form-control form-square">' + nextBtn,
		scope: {
			aStyle: '@',
			ngModel: '=',
			aClick: '&'
		},
		link: function($scope, el, attr) {
			if ($scope.aStyle == 'display'){
				var value = $scope.ngModel;
				var template = '<span>'+value+'</span>';
				el.html(template);
			}
			
			$scope.asdf = $scope.ngModel;
			$scope.next = function (){
				$scope.aClick();
			}
			el.bind('change', function(obj, datum) {
				$scope.$apply(function() {
					$scope.ngModel = $scope.asdf;
				});
			});
		}
	};
}]);
app.directive('aDropdown', ['CacheManager', function(CacheManager) {
	var template = '';

	return {
		require: 'ngModel',
		template: '<select ng-model="asdf" class="form-control" style="font-size:1.7em;height:42px"><option ng-repeat="option in options" value="{{option.value}}">{{option.label}}</option></select>' + nextBtn,
		scope: {
			aStyle: '@',
			ngModel: '=',
			aFieldData: '=',
			aClick: '&'
		},
		link: function($scope, el, attr) {
			function display(){
				var value = $scope.ngModel;
				if ($scope.aFieldData.source_type == 'import'){
					for(var i in $scope.options){
						if ($scope.options[i].value == $scope.ngModel){
							value = $scope.options[i].label;
						}
					}
				}
				var template = '<span>'+value+'</span>';
				el.html(template);
			}
			
			$scope.asdf = $scope.ngModel;
			$scope.next = function (val){
				if($scope.aStyle =='fill'){
					$scope.aClick();
				}
			}
			$scope.options = [];
			
			if ($scope.aFieldData.source_type == 'custom'){
				$scope.options = $scope.aFieldData.data
				if ($scope.aStyle == 'display'){
					display();
				}
			}
			else{
				CacheManager.get($scope.aFieldData.source,function (objects){
					$scope.options = [];
					for(var i in objects){
						$scope.options.push({value:objects[i].key_base, label: objects[i].title});
					}
					if ($scope.aStyle == 'display'){
						display();
					}
					$scope.$apply();
				});
			}
			
			
			
			el.bind('change', function(obj, datum) {
				$scope.$apply(function() {
					$scope.ngModel = $scope.asdf;
				});
			});
		}
	};
}]);
app.directive('aButtons', ['CacheManager', function(CacheManager) {
	return {
		require: 'ngModel',
		template: '<div class="btn-group" ><input class="btn btn-default form-square" ng-class="{\'active\': (asdf == option.value)}" style="font-size:2em" type="button" ng-click="click(option.value)" value="{{option.label}}" ng-repeat="option in options"/></div>',
		scope: {
			aStyle: '@',
			ngModel: '=',
			aFieldData: '=',
			aClick: '&'
		},
		link: function($scope, el, attr) {
			function display(){
				var value = $scope.ngModel;
				if ($scope.aFieldData.source_type == 'import'){
					for(var i in $scope.options){
						if ($scope.options[i].value == $scope.ngModel){
							value = $scope.options[i].label;
						}
					}
				}
				var template = '<span>'+value+'</span>';
				el.html(template);
			}
			
			
			$scope.asdf = $scope.ngModel;
			$scope.click = function(val) {
				$scope.ngModel = val;
				$scope.asdf = val;
				if ($scope.aStyle == 'fill'){
					$scope.aClick();
				}
			}
			
			$scope.options = [];
			
			if ($scope.aFieldData.source_type == 'custom'){
				$scope.options = $scope.aFieldData.data
				if ($scope.aStyle == 'display'){
					display();
				}
			}
			else{
				CacheManager.get($scope.aFieldData.source,function (objects){
					$scope.options = [];
					for(var i in objects){
						$scope.options.push({value:objects[i].key_base, label: objects[i].title});
					}
					if ($scope.aStyle == 'display'){
						display();
					}
					$scope.$apply();
				});
			}
		}
	};
}]);
app.directive('aTimer', function () {
    return {
        require: 'ngModel',
        template: '<div><p>{{time}}s</p><input class="btn btn-default form-square" style="font-size:2em" type="button" ng-click="click()" value="{{btnText}}"/></div>',
        scope: {
            aStyle: '@',
            ngModel: '=',
            aFieldData: '=',
            aClick: '&'
        },
        link: function ($scope, el, attr) {
            function currentTime() {
                var diff = (new Date()) - $scope.startTime;
                return diff / 1000;
            }
            if ($scope.aStyle == 'display') {
                el.html('<span>' + $scope.ngModel + '</span>');
            }
            else{
                //$scope.ngModel;
                $scope.time = 0;
                $scope.btnText = "Start";
                $scope.timing = false;
                $scope.startTime = new Date();

                $scope.click = function () {
                    if ($scope.timing) {
                        $scope.ngModel = currentTime();
                        $scope.aClick();
                    }
                    else {
                        $scope.timing = true;
                        $scope.startTime = new Date();
                        $scope.btnText = "Stop";
                        setInterval(function () {
                            $scope.time = currentTime();
                            $scope.$apply();
                        }, 1000)
                    }
                }
            }
        }
    };
});

/**
 * Checklist-model
 * AngularJS directive for list of checkboxes
 * https://github.com/vitalets/checklist-model
 * License: MIT http://opensource.org/licenses/MIT
 */
app.directive('checklistModel', ['$parse', '$compile', function ($parse, $compile) {
    // contains
    function contains(arr, item, comparator) {
        if (angular.isArray(arr)) {
            for (var i = arr.length; i--;) {
                if (comparator(arr[i], item)) {
                    return true;
                }
            }
        }
        return false;
    }

    // add
    function add(arr, item, comparator) {
        arr = angular.isArray(arr) ? arr : [];
        if (!contains(arr, item, comparator)) {
            arr.push(item);
        }
        return arr;
    }

    // remove
    function remove(arr, item, comparator) {
        if (angular.isArray(arr)) {
            for (var i = arr.length; i--;) {
                if (comparator(arr[i], item)) {
                    arr.splice(i, 1);
                    break;
                }
            }
        }
        return arr;
    }

    // http://stackoverflow.com/a/19228302/1458162
    function postLinkFn(scope, elem, attrs) {
        // exclude recursion, but still keep the model
        var checklistModel = attrs.checklistModel;
        attrs.$set("checklistModel", null);
        // compile with `ng-model` pointing to `checked`
        $compile(elem)(scope);
        attrs.$set("checklistModel", checklistModel);

        // getter / setter for original model
        var getter = $parse(checklistModel);
        var setter = getter.assign;
        var checklistChange = $parse(attrs.checklistChange);
        var checklistBeforeChange = $parse(attrs.checklistBeforeChange);

        // value added to list
        var value = attrs.checklistValue ? $parse(attrs.checklistValue)(scope.$parent) : attrs.value;


        var comparator = angular.equals;

        if (attrs.hasOwnProperty('checklistComparator')) {
            if (attrs.checklistComparator[0] == '.') {
                var comparatorExpression = attrs.checklistComparator.substring(1);
                comparator = function (a, b) {
                    return a[comparatorExpression] === b[comparatorExpression];
                };

            } else {
                comparator = $parse(attrs.checklistComparator)(scope.$parent);
            }
        }

        // watch UI checked change
        scope.$watch(attrs.ngModel, function (newValue, oldValue) {
            if (newValue === oldValue) {
                return;
            }

            if (checklistBeforeChange && (checklistBeforeChange(scope) === false)) {
                scope[attrs.ngModel] = contains(getter(scope.$parent), value, comparator);
                return;
            }

            setValueInChecklistModel(value, newValue);

            if (checklistChange) {
                checklistChange(scope);
            }
        });

        function setValueInChecklistModel(value, checked) {
            var current = getter(scope.$parent);
            if (angular.isFunction(setter)) {
                if (checked === true) {
                    setter(scope.$parent, add(current, value, comparator));
                } else {
                    setter(scope.$parent, remove(current, value, comparator));
                }
            }

        }

        // declare one function to be used for both $watch functions
        function setChecked(newArr, oldArr) {
            if (checklistBeforeChange && (checklistBeforeChange(scope) === false)) {
                setValueInChecklistModel(value, scope[attrs.ngModel]);
                return;
            }
            scope[attrs.ngModel] = contains(newArr, value, comparator);
        }

        // watch original model change
        // use the faster $watchCollection method if it's available
        if (angular.isFunction(scope.$parent.$watchCollection)) {
            scope.$parent.$watchCollection(checklistModel, setChecked);
        } else {
            scope.$parent.$watch(checklistModel, setChecked, true);
        }
    }

    return {
        restrict: 'A',
        priority: 1000,
        terminal: true,
        scope: true,
        compile: function (tElement, tAttrs) {
            if ((tElement[0].tagName !== 'INPUT' || tAttrs.type !== 'checkbox') && (tElement[0].tagName !== 'MD-CHECKBOX') && (!tAttrs.btnCheckbox)) {
                throw 'checklist-model should be applied to `input[type="checkbox"]` or `md-checkbox`.';
            }

            if (!tAttrs.checklistValue && !tAttrs.value) {
                throw 'You should provide `value` or `checklist-value`.';
            }

            // by default ngModel is 'checked', so we set it if not specified
            if (!tAttrs.ngModel) {
                // local scope var storing individual checkbox model
                tAttrs.$set("ngModel", "checked");
            }

            return postLinkFn;
        }
    };
}]);