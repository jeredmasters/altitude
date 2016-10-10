'use strict';

var app = angular.module('AltitudeApp');


app.controller('PublicCtrl', ['$rootScope', '$scope', '$location', "AppCore", "CacheManager",
	function ($rootScope, $scope, $location, AppCore, CacheManager) {
	    $rootScope.baseButtons = [];
	    if ($rootScope.currentUser != null) {
	        $location.path('/home');
	    }
	}
]);

app.controller('NewProfileCtrl', ['$scope', '$rootScope', 'NetLink', 'SharedState', 'AppCore', '$location', 'WizardHandler',
	function ($scope, $rootScope, NetLink, SharedState, AppCore, $location, WizardHandler) {
	    var wizard = function () {
	        return WizardHandler.wizard();
	    };
	    var step = function () {
	        return wizard().currentStep();
	    }
	    $rootScope.baseButtons = [
	        {
	            label: 'Back',
	            icon: 'chevron-left',
	            click: function () {
	                wizard().previous();
	            },
	            show: function () {
	                var step = wizard().currentStepNumber();	               
	                return step != 1;
	            }
	        },
            {
                label: 'Next',
                icon: 'chevron-right',
                click: function () {
                    wizard().next();
                },
                show: function () {
                    var step = wizard().currentStepNumber();
                    return step != wizard().totalStepCount();
                }
            },
            {
                label: 'Submit',
                icon: 'chevron-right',
                click: function () {
                    wizard().next();
                },
                show: function () {
                    var step = wizard().currentStepNumber();
                    return step == wizard().totalStepCount();
                }
            },


	    ];
	    $scope.data = {};
	    $scope.commercial_units = [
            { id: 'trimble_ux5', text: 'Trimble UX5' },
            { id: 'sensefly_ebee', text: 'Sensefly Ebee' }
	    ];
	    $scope.recreational_units = [
            { id: 'dji_phantom', text: 'DJI Phantom' },
            { id: 'dji_inspire', text: 'DJI Inspire' },
	    ]
	    SharedState.initialize($scope, 'betaNotice');
	    SharedState.turnOn('betaNotice');
	    $scope.step = 0;

	    $scope.createProfile = function () {
	        var token = $rootScope.addLoading("Creating Profile...");
	        NetLink.makeAsyncRequest({ uquery: 'session.createProfile', action: 'set' }, $scope.data, function (reply) {
	            $rootScope.baseButtons = [{
	                label: 'Go to Home',
	                icon: 'chevron-right',
	                click: function () {
	                    $scope.goHome();
	                }
	            }];
	            $scope.complete = true;
	            $rootScope.removeLoading(token);
	            $scope.$apply();
	        });
	    }

	    $scope.goHome = function () {
	        AppCore.initializeSession(function () {
	            $location.path('/home');
	            $scope.$apply();
	        });	        
	    }

	    $scope.wzprevious = function () {
	        WizardHandler.wizard().previous();
	    }

	    $scope.wznext = function () {
	        WizardHandler.wizard().next();
	    }

	    function valid(val) {
	        if (val === undefined || val == null) {
	            return false;
	        }
	        if (val == '' || val == -1) {
	            return false;
	        }
	        return true;
	    }

	    $scope.exitValidation = function (context) {
	        
	        var validate = [];
	        switch (step().title) {
	            case "Plan":
	                validate = ['plan'];
	                break;
	            case "Operator":
	                validate = ['operation'];
	                break;
	            case "Details":
	                if ($scope.data.password != $scope.data.passwordConfirm) {
	                    return false;
	                }
	                validate = ['name', 'email', 'password'];
	                if ($scope.data.operation == 'commercial') {
	                    validate.push('company');
	                }

	                break;
	        }

	        for (var i in validate) {
	            var value = $scope.data[validate[i]];
	            if (!valid(value)) {
	                return false;
	            }
	        }

	        return true;
	    }
	}
]);
app.controller('LoginCtrl', ['$rootScope', '$scope', '$location', "NetLink", "AppCore",
	function ($rootScope, $scope, $location, NetLink, AppCore) {
	    $scope.loginResponse = "";
	    $scope.logindata = {
	        email: $rootScope.pushEmail,
	        password: ''
	    };
	    $scope.login = function () {
	        $scope.loginResponse = '';
	        AppCore.Login($scope.logindata, function (reply) {
	            if (reply.success == true) {
	                AppCore.initializeSession(function () {
	                    $location.path('/home');
	                    $scope.$apply();
	                });
	            }
	            else {
	                $scope.loginResponse = "Login Failed";
	                if (reply.message !== undefined && reply.message != null && reply.message != '') {
	                    $scope.loginResponse = reply.message;
	                }
	            }
	            $scope.$apply();
	        });
	    }
	}
]);

