'use strict';

var app = angular.module('AltitudeApp', [
	'ngRoute',
	'mobile-angular-ui',
	'ngStorage',
	'angular-md5',
	'ui.bootstrap',
	'ngMap',
	'ui.tree',
    'mgo-angular-wizard'
]);

//
// For this trivial demo we have just a unique MainController 
// for everything
//
app.controller('MainController', ['$rootScope', '$scope','CacheManager', '$timeout', 'SharedState', 
    function ($rootScope, $scope, CacheManager, $timeout, SharedState) {
    SharedState.initialize($scope, 'helpmodal');
    $rootScope.helpModal = function () {
        SharedState.turnOn('helpmodal');
    }
    
        
    // Needed for the loading screen
    var token = '';
    $rootScope.$on('$routeChangeStart', function () {
        $rootScope.baseButtons = [];
        token = $rootScope.addLoading('Loading Page...');
    });

    $rootScope.$on('$routeChangeSuccess', function () {
        $rootScope.removeLoading(token);
    });


    var runChecklistLinks = [];

    $scope.runChecklist = function () {
        CacheManager.get('scaffold.checklist:#', function (scaffolds) {
            runChecklistLinks = [];
            var checklistScaffolds = scaffolds;
            for (var i in checklistScaffolds) {
                var scaffold = checklistScaffolds[i];
                runChecklistLinks.push({
                    text: scaffold.title,
                    href: '#/checklist/' + scaffold.key,
                });
            }
            $rootScope.openSidebarRight("Run Checklist", runChecklistLinks);
            $scope.$apply();
        });
    }
}]);

app.run(['$rootScope', 'SharedState', 'SessionManager', function ($rootScope, SharedState, SessionManager) {
    $rootScope.loadingText = {};
    $rootScope.addLoading = function (text) {
        var token = newGuid(6);
        $rootScope.loadingText[token] = text;
        $rootScope.loading = true;
        return token;
    }
    $rootScope.removeLoading = function (token) {
        delete $rootScope.loadingText[token];
        var empty = true;
        for (var key in $rootScope.loadingText) {
            if ($rootScope.loadingText.hasOwnProperty(key)) {
                empty = false;
            }
        }
        if (empty) {
            $rootScope.loading = false;
        }
    }

    $rootScope.sidebarRight = {};
    $rootScope.openSidebarRight = function (title, links) {
        $rootScope.sidebarRight.title = title;
        $rootScope.sidebarRight.links = links;
        SharedState.turnOn('uiSidebarRight');
        $rootScope.showBack = true;
    };
    $rootScope.closeSidebarRight = function () {
        SharedState.turnOff('uiSidebarRight');
        $rootScope.showBack = false;
    };
    function isObject(val) {
        return (                        
            val !== undefined &&
            val != null &&
            typeof val == 'object' &&
            !Array.isArray(val)
            );
    }
    function getState(name) {
        var $state = {
            name: name,
            get: function (key) {
                var currentState = SessionManager.Get(this.name);
                if (key === undefined) {
                    return currentState;
                }
                else {
                    var keys = key.split('.');
                    var val = currentState;
                    for (var i in keys) {
                        if (val === undefined) {
                            return null;
                        }
                        val = val[keys[i]]; //drill down into
                    }
                    return val;
                }
            },
            set: function (state, force) {
                var currentState = this.get();
                if (force || currentState == null || state.last_update > currentState.last_update) {
                    SessionManager.Set(this.name, state);
                }
            },
            update: function (key, value) {
                var currentState = this.get();
                var keys = key.split('.');
                var update = false;
                var test = typeof currentState[keys[0]];
                if (keys.length > 1 && !isObject(currentState[keys[0]])) {
                    currentState[keys[0]] = {};
                }
                if (keys.length > 2 && !isObject(currentState[keys[0]][keys[1]])) {
                    currentState[keys[0]][keys[1]] = {};
                }
                if (keys.length > 3 && !isObject(currentState[keys[0]][keys[1]][keys[2]])) {
                    currentState[keys[0]][keys[1]][keys[2]] = {};
                }




                switch (keys.length) {
                    case 1:
                        if (currentState[keys[0]] != value) {
                            update = true;
                            currentState[keys[0]] = value;
                        }
                        break;
                    case 2:
                        if (currentState[keys[0]][keys[1]] != value) {
                            update = true;                            
                            currentState[keys[0]][keys[1]] = value;
                        }
                        break;
                    case 3:
                        if (currentState[keys[0]][keys[1]][keys[2]] != value) {
                            update = true;
                            currentState[keys[0]] = {};
                            currentState[keys[0]][keys[1]][keys[2]] = value;
                        }
                        break;
                    case 4:
                        if (currentState[keys[0]][keys[1]][keys[2]][keys[3]] != value) {
                            update = true;
                            currentState[keys[0]][keys[1]][keys[2]][keys[3]] = value;
                        }
                        break;
                }
                if (update) {
                    currentState.last_update = unix();
                    this.set(currentState, true);
                }
                return update;
            }
        }
        return $state;
    }
    $rootScope.state = {
        company: getState('state_company'),
        user: getState('state_user'),
        system: getState('state_system')
    };
    $rootScope.getUserSetting = function (name) {
        var val = $rootScope.state.user.get('settings.' + name);
        if (val === undefined) {
            val = null;
        }
        return val;
    };
    $rootScope.setUserSetting = function (name, val) {
        $rootScope.state.user.update('settings.' + name, val);
    };
}]);

app.run(['AppCore', function (AppCore) {
    AppCore.initializeApp();
}]);
