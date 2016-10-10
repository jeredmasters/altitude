'use strict';
var app = angular.module('AltitudeApp');

app.controller('SubscriptionCtrl', ['$scope', '$rootScope', 'NetLink', 'AppCore', '$window',
	function ($scope, $rootScope, NetLink, AppCore, $window) {
	    Stripe.setPublishableKey('pk_test_huPzPRaV3rfoW2wuc1PYP1h8');

	    $scope.daysRemaining = -1;
	    var companyState = $rootScope.state.company.get();
	    if (companyState.subscription_status == 'trialing') {
	        $scope.daysRemaining = companyState.valid_until - unix();
	        $scope.daysRemaining = $scope.daysRemaining / 86400;
	        $scope.daysRemaining = Math.floor($scope.daysRemaining);
	    }

	    $scope.init = function () {
	        $scope.cardInfo = "No card set";
	        $scope.showForm = false;
	        if (companyState.subscription_card != null &&
                companyState.subscription_card.type !== undefined &&
                companyState.subscription_card.type !== ''
                ) {
	            $scope.cardInfo = companyState.subscription_card.type + ' ending in ' + companyState.subscription_card.last4;
	        }

	        $scope.selected_plan = companyState.subscription_plan;
	    }
	    $scope.plans = [
            {
                id: 'free',
                title: 'Free',
                short: 'For Hobyists',
                long: 'Simple profile, with pre-made checklists and systems',
                price: '0',
                icon: 'gamepad'
            },
            {
                id: 'basic',
                title: 'Basic',
                short: 'For sole-traders',
                long: 'Customisable checklists and equipment tracking and up to 3 users',
                price: '9.99',
                icon: 'user'
            },
            {
                id: 'enterprise',
                title: 'Enterprise',
                short: 'For Large Companies',
                long: 'Offline synchronisation, Customisable checklists and equipment tracking and unlimited users',
                price: '144',
                icon: 'users'
            }
	    ];
	    $scope.changeCard = function (status, response) {
	        if (status != 200) {
	            $scope.cardError = response.error.message;
	        }
	        else {
	            NetLink.makeAsyncRequest({ uquery: 'session.changeCard', action: 'set' }, { source: response.id }, function (reply) {
	                if (reply.success) {
	                    AppCore.getState(function () {
	                        $scope.init();
	                        $scope.$apply();
	                        window.location.reload();
	                    });
	                }
	                else {
	                    $scope.cardError = reply.message;
	                    $scope.$apply();
	                }
	            });
	        }
	    }
	    $scope.changePlan = function (newPlan) {
	        var token = $rootScope.addLoading('Updating Plan...');
	        NetLink.makeAsyncRequest({ uquery: 'session.changePlan', action: 'set' }, { newPlan: newPlan }, function (reply) {
	            $rootScope.removeLoading(token);
	            if (reply.success) {
	                AppCore.getState(function () {
	                    $scope.init();
	                    $scope.$apply();
	                });
	            }
	            else {
	                $scope.planError = reply.message;
	                $scope.$apply();
	            }

	        });
	    }
	    $scope.init();
	}
]);

app.controller('SignOutCtrl', ['$scope', '$location', "AppCore","$rootScope",
	function ($scope, $location, AppCore,$rootScope) {
	    $scope.data = {
            remember: 'remember'
	    }
	    $rootScope.baseButtons = [
            {
                label: 'Sign out',
                icon: 'sign-out',
                click: function () {
                    $scope.signout();
                }
            }
	    ];
	    $scope.signout = function () {
	        AppCore.SignOut($scope.data.remember != 'remember', function () {
	            $location.path('/index');
	            $scope.$apply();
	        });	        
	    }
	    $scope.cancel = function () {
	        $location.path('/home');
	    }
	}
]);

app.controller('AccountCtrl', ['$scope', '$location', "AppCore", '$routeParams', 'NetLink', 'SessionManager',
	function ($scope, $location, AppCore, $routeParams, NetLink, SessionManager) {
	    AppCore.require();
	    $scope.userData = SessionManager.getUser();
	    $scope.password = {};
	    $scope.changePswd = function () {
	        if ($scope.password.new == $scope.password.confirm) {
	            NetLink.makeAsyncRequest({ uquery: 'session.changePassword', action: 'set' }, $scope.password, function (returnData) {
	                if (returnData.success) {
	                    $scope.password = {};
	                    alert('Password Changed');
	                    $scope.$apply();
	                }
	                else {
	                    if (returnData.message !== undefined) {
	                        alert(returnData.message);
	                    }
	                    else {
	                        alert('something went wrong');
	                    }
	                }
	            });
	        }
	        else {
	            alert('New password do not match');
	        }
	    }
	    $scope.saveUser = function () {
	        NetLink.makeAsyncRequest({ uquery: 'session.updateDetails', action: 'set' }, $scope.userData, function (returnData) {
	            if (returnData.success) {
	                alert('Details updated.');
	                $scope.$apply();
	            }
	            else {
	                if (returnData.message !== undefined) {
	                    alert(returnData.message);
	                }
	                else {
	                    alert('something went wrong');
	                }
	            }
	        });
	    };

	}
]);

app.controller('SendInviteCtrl', ['$scope', '$rootScope', "CacheManager", "NetLink", "AppCore",
	function ($scope, $rootScope, CacheManager, NetLink, AppCore) {
	    AppCore.require();
	    $scope.email = '';
	    $scope.sent = false;
	    $scope.sendInvite = function () {
	        var operation = {
	            uquery: 'session.invite',
	            action: 'set'
	        };
	        var data = {
	            email: $scope.email,
	        };
	        var token = $rootScope.addLoading('Sending invite...');
	        NetLink.makeAsyncRequest(operation, data, function (reply) {
	            $rootScope.removeLoading(token);
	            if (reply.success) {
	                $scope.sent = true;
	                $scope.email = '';
	            }
	            else {
	                alert(reply.message);
	            }
	            $scope.$apply();
	        });
	    }
	}
]);

app.controller('UsersCtrl', ['$scope', '$rootScope', 'CacheManager', 'AppCore',
	function ($scope, $rootScope, CacheManager, AppCore) {
	    $scope.users = [];
	    CacheManager.get('user:#', function (users) {
	        $scope.users = users;
	        $scope.$apply();
	    });
	}
]);

app.controller('EditUserCtrl', ['$scope', '$rootScope', 'CacheManager', 'NetLink', '$routeParams', '$location', 'AppCore',
	function ($scope, $rootScope, CacheManager, NetLink, $routeParams, $location, AppCore) {
	    AppCore.require();
	    $scope.userData = {};

	    CacheManager.get($routeParams.id, function (users) {
	        $scope.userData = users[0];

	        $scope.$apply();
	    });

	    $scope.saveUser = function () {
	        CacheManager.set($routeParams.id, $scope.userData, function () {
	            $location.path('/users');
	            $scope.$apply();
	        });
	    }

	    $scope.deleteUser = function () {
	        CacheManager.del($routeParams.id, function () {
	            $location.path('/users');
	            $scope.$apply();
	        });
	    }

	    $scope.loginAs = function () {
	        NetLink.makeAsyncRequest({ uquery: 'session.push', action: 'set' }, $routeParams.id, function () {
	            window.location.reload(true);
	        })
	    }
	}
]);