'use strict';
var app = angular.module('AltitudeApp');

app.service('AppCore', ['$rootScope', 'SessionManager', 'NetLink', 'Alerts', 'CacheManager', '$routeParams', '$location', 'SharedState', '$window','$q','$timeout',
	function ($rootScope, SessionManager, NetLink, Alerts, CacheManager, $routeParams, $location, SharedState, $window, $q, $timeout) {
	    var $appCore = this;
	    this.initializeApp = function (callback) {
	        $rootScope.version = 3.4;
	        setInterval(function () {
	            $appCore.checkForUpdates();
	        }, 600000);

	        $appCore.checkForUpdates();

	        $rootScope.host = NetLink.getHost();
	        $rootScope.domain = NetLink.getDomain();

	        $rootScope.isPhoneGap = NetLink.isPhoneGap();
	        $rootScope.isPhoneGap_str = (NetLink.isPhoneGap() ? 'true' : 'false');

	        setInterval(function () {
	            if ($rootScope.currentUser != null && $rootScope.currentUser !== undefined) {
	                window.sync();
	            }
	        }, 60000);
	        window.sync = function () {
	            CacheManager.sync();
	            $appCore.getState();
	        }
	        window.destroy = function () {
	            SessionManager.SignOut()
	            CacheManager.destroy();
	        }


	        $rootScope.initialPromise = $q.defer();

	        $appCore.initializeSession(function () {
	            $timeout($rootScope.initialPromise.resolve, 500);
	            if (callback != undefined) {
	                callback();
	            }
	        });
	    }

	    this.require = function (role) {
	        var needsLogin = false;
	        if (role === undefined) {
	            if ($rootScope.currentUser == undefined || $rootScope.currentUser == null) {
	                needsLogin = true;
	            }
	        }
	        else {
	            if (!$appCore.hasPermission(role)) {
	                needsLogin = true;
	            }
	        }

	        if (needsLogin) {
	            window.location = '/app/index.html#/login';
	        }
	    }

	    this.hasPermission = function (role) {
	        if (!Array.isArray(role)) {
	            role = [role];
	        }
	        if ($rootScope.currentUser == undefined || $rootScope.currentUser == null) {
	            return false;
	        }
	        if ($rootScope.currentUser.superuser == 1 || $rootScope.currentUser.superuser == '1') {
	            return true;
	        }

	        for (var i in role) {
	            if ($rootScope.userRoles.indexOf(role[i]) != -1) {
	                return true;
	            }
	        }

	        return false;
	    }

	    this.initializePage = function (route) {


	    }


	    this.initializeSession = function (callback) {

	        $rootScope.currentUser = null;
	        SessionManager.hasSession(function (hasSesh){
	            if (hasSesh) {
                    $rootScope.currentUser = SessionManager.getUser();
	                $rootScope.userSettings = {
	                    mapDisclaimerSeen: ''
	                };
	                $rootScope.userRoles = [];

	                if ($rootScope.currentUser != null)
	                {
	                    $rootScope.userRoles = $rootScope.currentUser.roles;
	                }

	                if ($rootScope.currentUser != null)
	                {
	                    CacheManager.init($rootScope.currentUser);
	                }
	                $appCore.getState(callback);
	            }
                else if (callback !== undefined) {
	                callback();
	            }
	        });

	    }

	    this.checkForUpdates = function () {
	        if (navigator.onLine) {
	            var currentVersion = SessionManager.CurrentVersion();
	            NetLink.get('session.version', function (reply) {
	                var changeLog = [];
	                var hardRefresh = false;
	                var needsUpdate = false;
	                var updateState = '';
	                var maxVersion = currentVersion;

	                if (typeof reply == 'string') {
	                    if (reply > $rootScope.version) {
	                        needsUpdate = true;
	                    }
	                }
	                else {
	                    for (var i in reply) {
	                        var update = reply[i];
	                        if (currentVersion != null && update.version > currentVersion) {
	                            needsUpdate = true;
	                            if (update.version > maxVersion) {
	                                maxVersion = update.version;
	                            }
	                            for (var j in update.changes) {
	                                changeLog.push(update.changes[j]);
	                            }
	                            if (update.hardRefresh) {
	                                hardRefresh = true;
	                            }
	                        }
	                    }
	                }

	                SessionManager.CurrentVersion($rootScope.version);
	                if (needsUpdate) {
	                    if (hardRefresh) {
	                        alert("Altitude needs to update, you may need to log in again\nNew VersionChanges:\n" + changeLog.join('\n'));
	                        SessionManager.SignOut(function () {
	                            window.location.reload(true);
	                        });
	                    }
	                    window.location.reload(true);
	                }
	            });
	        }
	    }

	    this.Login = function (logindata, callback) {

	        var operation = {
	            uquery: 'session.login',
	            action: 'get'
	        };
	        var reply = NetLink.makeAsyncRequest(operation, logindata, function (reply) {
	            if (reply.success) {
	                SessionManager.setSession(reply.data.user, reply.data.company);
	                $appCore.initializeSession(function () {
	                    if (callback !== undefined) {
	                        callback(reply);
	                    }
	                });
	            }
                else if (callback !== undefined) {
	                callback(reply);
	            }
	        });
	    };

	    this.getState = function (callback) {
	        NetLink.get('session.state', function (data) {
	            var userState = $rootScope.state.user.get();
	            if (userState !== undefined &&
                    userState != null &&
                    userState.last_update !== undefined &&
                    data.user.last_update < userState.last_update) {
	                $appCore.setState();
	            }
	            else {
	                $rootScope.state.user.set(data.user, true);
	            }
	            $rootScope.state.company.set(data.company);
	            $rootScope.state.system.set(data.company);
	            if (callback !== undefined) {
	                callback(data);
	            }
	        });
	    }

	    this.setState = function () {
	        var data = {
	            settings: $rootScope.state.user.get('settings'),
	            last_update: $rootScope.state.user.get('last_update')
	        };
	        NetLink.set('session.state', data, function (reply) { });
	    }

	    this.SignOut = function (destroy, callback) {
	        SessionManager.End();
	        if (destroy) {
	            CacheManager.destroy(callback);
	        }
	        else {
	            if (callback !== undefined) {
	                callback();
	            }
	        }
	    }
	}
]);