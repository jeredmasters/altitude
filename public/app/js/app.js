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

var app = angular.module('AltitudeApp');

app.config(['$routeProvider',
	function ($routeProvider) {
	    var resolve = {
	        delay: function ($rootScope, $q, $timeout) {
	            if ($rootScope.initialPromise !== undefined) {
	                return $rootScope.initialPromise.promise;
	            }
	            var delay = $q.defer();
	            $timeout(delay.resolve, 1);
	            return delay.promise;
	        }
	    };
	    $routeProvider.
		when('/upload', {
		    templateUrl: 'partials/upload.html',
		    controller: 'UploadCtrl',
		    pageTitle: 'Login',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/procedures', {
		    templateUrl: 'partials/procedures.html',
		    controller: 'ProceduresCtrl',
		    reloadOnSearch: false
		}).
		when('/procedure/:id', {
		    templateUrl: 'partials/procedure.html',
		    controller: 'RunProcedureCtrl',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/login', {
		    templateUrl: 'partials/login.html',
		    controller: 'LoginCtrl',
		    pageTitle: 'Login',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/createuser', {
		    templateUrl: 'partials/createuser.html',
		    controller: 'CreateUserCtrl',
		    pageTitle: 'Create User',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/home', {
		    templateUrl: 'partials/home.html',
		    controller: 'HomeCtrl',
		    access: {
		        requireLogin: true
		    },
		    pageTitle: 'Home',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/checklists', {
		    templateUrl: 'partials/checklists.html',
		    controller: 'ChecklistsCtrl',
		    access: {
		        requireLogin: true
		    },
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/users', {
		    templateUrl: 'partials/users.html',
		    controller: 'UsersCtrl',
		    access: {
		        requireLogin: true
		    },
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/edituser/:id', {
		    templateUrl: 'partials/edituser.html',
		    controller: 'EditUserCtrl',
		    access: {
		        requireLogin: true
		    },
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/checklist/:formHandle/:procedure?', {
		    templateUrl: 'partials/checklist.html',
		    controller: 'ChecklistCtrl',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/signout', {
		    templateUrl: 'partials/signout.html',
		    controller: 'SignOutCtrl',
		    pageTitle: 'Signout',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/provider', {
		    templateUrl: 'partials/home.html',
		    controller: 'ProviderCtrl',
		    pageTitle: 'Signout',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/sendinvite', {
		    templateUrl: 'partials/sendinvite.html',
		    controller: 'SendInviteCtrl',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/index', {
		    templateUrl: 'partials/public.html',
		    controller: 'PublicCtrl',
		    pageTitle: 'Altitude',
		    bodyClass: 'public',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/newprofile', {
		    templateUrl: 'partials/newprofile.html',
		    controller: 'NewProfileCtrl',
		    pageTitle: 'Altitude',
		    bodyClass: 'public',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/map-vector', {
		    templateUrl: 'partials/map_vector.html',
		    controller: 'MapCtrl',
		    pageTitle: 'Map',
		    bodyClass: 'map',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/about', {
		    templateUrl: 'partials/about.html',
		    pageTitle: 'About',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/account', {
		    templateUrl: 'partials/account.html',
		    controller: 'AccountCtrl',
		    pageTitle: 'Account',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
        when('/subscription', {
            templateUrl: 'partials/subscription.html',
            controller: 'SubscriptionCtrl',
            pageTitle: 'Subscription',
            reloadOnSearch: false,
            resolve: resolve
        }).
		when('/help', {
		    templateUrl: 'partials/help.html',
		    pageTitle: 'Help',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/edit/:handle', {
		    templateUrl: 'partials/edit.html',
		    controller: 'EditCtrl',
		    pageTitle: 'Help',
		    reloadOnSearch: false,
		    resolve: resolve
		}).
		when('/equipment/:handle?', {
		    templateUrl: 'partials/equipment.html',
		    controller: 'EquipmentCtrl',
		    pageTitle: 'Help',
		    reloadOnSearch: false,
		    resolve: resolve
		}).

		otherwise({
		    redirectTo: '/index'
		});
	}
]);
'use strict';

/* Filters */

var app = angular.module('AltitudeApp');

app.filter("sanitize", ['$sce', function ($sce) {
    return function (htmlCode) {
        return $sce.trustAsHtml(htmlCode);
    }
}]);
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
'use strict';
var app = angular.module('AltitudeApp');

app.service('CacheManager', ['md5', 'NetLink', '$rootScope',
	function (md5, NetLink, $rootScope) {
	    var $cache = this;
	    var $db_data = null;

	    window.get = function (str) { // for testing
	        var start = new Date().getTime();

	        $cache.get(str, function (result) {

	            var end = new Date().getTime();
	            var time = end - start;
	            console.log('query took: ' + time + 'ms');
	            console.log(result);
	        });
	        return 'async working...';
	    }

	    this.init = function (user) {
	        var token = null;
	        $db_data = database(user.key_base);
	        $db_data.init(function () {
	            token = $rootScope.addLoading("Setting up database...");
	        },
				function () {
				    $rootScope.removeLoading(token);
				    setTimeout(function () { $rootScope.$apply(); }, 50);
				});

	    }
	    this.sync = function () {
	        $db_data.sync(false);
	    }

	    this.saveFiles = function (files) {
	        for (var i in files) {
	            $cache.saveFile(files[i]);
	        }
	    }
	    this.destroy = function (callback) {
	        $db_data.destroyDB(callback);	        
	    }
	    this.disconnect = function () {
	        $db_data = null;
	        document.cookie = '';
	    }
	    this.saveFile = function (file, callback) {
	        var reader = new FileReader();
	        reader.onloadend = function () {
	            var key = 'file:' + file.name + '-' + $cache.newGuid(6);
	            $cache.set(key, {
	                key: key,
	                name: file.name,
	                file_size: file.size,
	                blob_size: reader.result.length,
	                content_type: file.type,
	                content: btoa(reader.result),

	            }, callback);
	        }

	        var start = 0;
	        var stop = file.size - 1;

	        var blob = file.slice(start, stop + 1);
	        reader.readAsBinaryString(blob);
	    }
	    this.downloadFile = function (id) {
	        $cache.get(function (file) {
	            if (file.content == null) {
	                window.location = file.url;
	            }
	            else {
	                var pom = document.createElement('a');
	                pom.setAttribute('href', 'data:' + file.content_type + ';charset=utf-16le;base64,' + file.content);
	                pom.setAttribute('download', file.name);

	                pom.style.display = 'none';
	                document.body.appendChild(pom);

	                pom.click();

	                document.body.removeChild(pom);
	            }
	        });
	    }
	    this.set = function (id, data, callback) {
	        if (typeof id == 'string') {
	            id = uquery(id);
	        }

	        id.newTimestamp();
	        $db_data.set(id, data, function (retData) {
	            $db_data.exchange({ send: [retData.key] }); // send this data to the server also
	            callback(retData);
	        });
	    }
	    this.get = function (id, callback) {
	        return $db_data.get(id, callback);
	    }
	    this.del = function (id, callback) {
	        $db_data.del(id, function (retData) {
	            $db_data.exchange({ send: [retData.key] }); // send this data to the server also
	            callback(retData);
	        });
	    }
	    this.update = function (id, fields, callback) {
	        return $db_data.update(id, fields, callback);
	    }
	    this.checkConnection = function () {
	        return window.navigator.onLine;
	    }

	    this.makeHash = function (operation, context) {
	        return md5.createHash(JSON.stringify(operation));
	    }
	}

]);
'use strict';
var app = angular.module('AltitudeApp');

app.service('NetLink', ['$localStorage', '$rootScope','Alerts',
	function($localStorage, $rootScope, Alerts) {
		var $netLink = this;
		this.get = function(definition, callback) {
			var operation = {
				uquery: definition,
				action: 'get'
			};


			$netLink.makeAsyncRequest(operation, ['null'], function(reply) {
				if (callback != undefined) {
					callback(reply['data']);
				}
			});
		}
		this.set = function(definition, data, callback) {
			$netLink.makeAsyncRequest({
					uquery: definition,
					action: 'set'
				},
				data,
				callback);
		}
		this.endSession = function() {
			$netLink.makeAsyncRequest({
				uquery: 'session.end',
				action: 'set'
			}, ['null']);
		}
		this.isPhoneGap = function() {
			var domain = document.domain;

			if (domain === undefined || domain == null || domain == '') {
				return true;
			}

			return false;
		};
		this.getHost = function() {


			if ($netLink.isPhoneGap()) {
				return 'localhost';
			}

			return document.domain;
		};

		this.getDomain = function() {
			if ($netLink.isPhoneGap()) {
				return 'altitude.novalab.com.au';
			}

			return document.domain;
		};
		this.getUrl = function() {


			return 'http://' + $netLink.getDomain() + '/operation/process';
		};
		this.makeRequest = function(operation, data, options) {
			if (options === undefined) {
				options = {
					showError: false,
					showSuccess: false,
				}
			}

			var context = {
				user: -1,
				isPhoneGap: $netLink.isPhoneGap()
			}

			if ($rootScope.currentUser != undefined) {
				context.user = $rootScope.currentUser.id;
			}

			var request = {
				context: context,
				operation: operation,
				data: data
			}

			var retval = null;

			$.ajax({
				url: $netLink.getUrl(),
				data: {
					request: request,
					phonegap: $netLink.isPhoneGap()
				},
				async: false,
				datatype: 'json',
				success: function(reply) {
					//reply = JSON.parse(reply);
					if (reply.success == true) {
						if (options.showSuccess) {
							Alerts.add('success', reply['message'], 3000);
						}
						//success flash
					}
					else {
						if (options.showError) {
							Alerts.add('danger', reply['message'], 3000);
						}
						//error flash
					}
					reply['source'] = 'remote';

					if (reply['urgent'] !== undefined) {

					}

					retval = reply;
				}

			});

			return retval;
		}
		this.makeAsyncRequest = function(operation, data, callback, options) {
			if (options === undefined) {
				options = {
					showError: false,
					showSuccess: false,
				}
			}

			var context = {
				user: -1,
			}

			if ($rootScope.currentUser != undefined) {
				context.user = $rootScope.currentUser.id;
			}

			var request = {
				context: context,
				operation: operation,
				data: data
			}

			$.post($netLink.getUrl(), {
				request: request
			}, function(reply) {
				if (reply['success'] == true) {
					if (options.showSuccess) {
						Alerts.add('success', reply['message'], 3000);
					}
					//success flash
				}
				else {
					if (options.showError) {
						Alerts.add('danger', reply['message'], 3000);
					}
					//error flash
				}
				reply['source'] = 'remote';

				if (reply['urgent'] !== undefined) {

				}
				if (callback !== undefined) {
					callback(reply);
				}
			});
		}
	}
]);

app.factory('Alerts', ['$rootScope' ,function($rootScope) {
	var alertService = {};

	// create an array of alerts available globally
	$rootScope.alerts = [];

	alertService.add = function(type, msg, timeout) {

		$rootScope.alerts.push({
			'type': type,
			'msg': msg
		});
		$rootScope.$apply();
		if (timeout !== 'undefined') {
			setTimeout(function() {
				alertService.closeAlert(0, true);
			}, timeout);
		}
	};

	alertService.closeAlert = function(index, timed) {
		$rootScope.alerts.splice(index, 1);
		if (timed !== 'undefined' && timed == true) {
			$rootScope.$apply();
		}
	};

	return alertService;
}]);

'use strict';
var app = angular.module('AltitudeApp');


app.service('SessionManager', ['NetLink', '$rootScope', '$localStorage',
	function (NetLink, $rootScope, $localStorage) {
	    var $session = this;
	    var session_on_server = false;
	    var session_in_cache = false;
	    var user_on_server = '';
	    var user_object = null;

	    this.getUser = function () {
	        var user = $session.Get('user');
	        return user;
	    };

	    this.End = function () {
	        $localStorage.$reset();
	        NetLink.endSession();
	        $rootScope.currentUser = null;
	        document.cookie = '';
	    }
	    this.hasSession = function (callback) {
	        if (navigator.onLine) {
	            var operation = {
	                uquery: 'session.user',
	                action: 'get'
	            };
	            NetLink.makeAsyncRequest(operation, null, function (reply) {
	                if (reply != null) {
	                    if (reply.success) {
	                        if (reply.data.user !== undefined) {
	                            $session.Set('user', reply.data.user);
	                        }
	                        if (reply.data.pushEmail !== undefined) {
	                            $rootScope.pushEmail = reply.data.pushEmail;
	                        }
	                    }
	                    else {
	                        $session.Set('user', null);
	                    }
	                }
	                if (callback !== undefined) {
	                    callback(reply != null && $session.getUser() != null);
	                }
	            });
	        }
	    }

	    this.setSession = function (user, company) {
	        $localStorage.$reset();
	        $session.Set('user', user);
	        $session.Set('company', company);
	    }

	    this.createUser = function (user, callback) {

	        var operation = {
	            uquery: 'session.newuser',
	            action: 'set'
	        };
	        var reply = NetLink.makeRequest(operation, user);

	        if (reply.success) {
	            $session.Set('user', reply.data);


	        }
	        else { }
	        return reply;
	    };

	    this.CurrentVersion = function (version) {
	        if (version === undefined) {
	            return $session.Get('currentVersion');
	        }
	        return $session.Set('currentVersion', version);
	    }
	    this.Get = function (key, fail_over) {
	        var val = $localStorage[key];

	        if (val === undefined) {
	            if (fail_over === undefined) {
	                fail_over = null;
	            }
	            return fail_over;
	        }

	        return val;
	    }
	    this.Set = function (key, data) {
	        $localStorage[key] = data;
	    }

	}
]);
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
'use strict';
var app = angular.module('AltitudeApp');

app.controller('ChecklistsCtrl', ['$scope', '$rootScope', 'CacheManager', 'AppCore',
	function ($scope, $rootScope, CacheManager, AppCore) {
	    AppCore.require();
	    $scope.checklists = [];
	    $scope.checklistScaffolds = [];

	    var checklistScaffolds = [];

	    var runChecklistLinks = [];
	    var editChecklistLinks = [];

	    CacheManager.get('scaffold.checklist:#', function (scaffolds) {
	        checklistScaffolds = scaffolds;
	        editChecklistLinks.push({
	            text: 'New',
	            href: '#/edit/scaffold.checklist:new',
	        });

	        for (var i in checklistScaffolds) {
	            var checklist = checklistScaffolds[i];
	            runChecklistLinks.push({
	                text: checklist.title,
	                href: '#/checklist/' + checklist.key,
	            });
	            editChecklistLinks.push({
	                text: checklist.title,
	                href: '#/edit/' + checklist.key_base,
	            });
	        }

	    });

	    CacheManager.get('object.checklist:%', function (objects) {
	        $scope.myChecklists = [];

	        for (var i in objects) {
	            $scope.myChecklists.push(objects[i]);
	        }
	        $scope.$apply();

	    });

	    if (AppCore.hasPermission('admin')) {
	        CacheManager.get('object.checklist:*', function (objects) {
	            $scope.allChecklists = [];
	            var users = {};
	            var user_count = 0;
	            for (var i in objects) {
	                CacheManager.get(objects[i].created_by, function (user) {
	                    if (user.length > 0) {
	                        users[user[0].key_base] = user[0].fullname;
	                    }
	                    user_count++;

	                    if (user_count == objects.length) {
	                        for (var i in $scope.allChecklists) {
	                            if (users[$scope.allChecklists[i].created_by] !== undefined) {
	                                $scope.allChecklists[i].user_fullname = users[$scope.allChecklists[i].created_by];
	                            }
	                            else {
	                                $scope.allChecklists[i].user_fullname = 'unknown';
	                            }
	                        }
	                        $scope.$apply();
	                    }
	                });
	                $scope.allChecklists.push(objects[i]);
	            }

	        });
	    }

	    $scope.runChecklist = function () {
	        $rootScope.openSidebarRight("Run Checklist", runChecklistLinks);
	    }
	    $scope.editChecklists = function () {
	        $rootScope.openSidebarRight("Edit Checklists", editChecklistLinks);
	    }
	}
]);
app.controller('ChecklistCtrl', ['$scope', '$routeParams', 'CacheManager', "AppCore", '$rootScope', '$location', '$compile',
	function ($scope, $routeParams, CacheManager, AppCore, $rootScope, $location, $compile) {
	    AppCore.require();
	    var checklist = $routeParams.formHandle;
	    var u = uquery(checklist);
	    $scope.procedure_link = null;
	    var procedure = null;
	    if ($routeParams.procedure !== undefined) {
	        procedure = uquery($routeParams.procedure);
	        $scope.procedure_link = "#/procedure/" + procedure.key;
	    }

	    $scope.page_title = " Checklist";


	    if (u.struct == 'object') {
	        $scope.page_title = "";
	        $scope.checklist_template = "partials/checklist_view.html";
	        $scope.fields = [];

	        $scope.downloadFile = function (file) {
	            CacheManager.downloadFile(file);
	        }

	        CacheManager.get($routeParams.formHandle, function (objects) {

	            var checklist = objects[0];
	            var answers = checklist.data;

	            $scope.scaffoldTitle = checklist.title;

	            $scope.page_title = checklist.title + " Checklist";

	            CacheManager.get(checklist.scaffold, function (scaffolds) {
	                var scaffold = scaffolds[0];

	                if (scaffold != null) {
	                    var fields = scaffold['data'];


	                    for (var i = 0; i < fields.length; i++) {
	                        fields[i]['value'] = answers[fields[i].handle];
	                    }

	                    $scope.fields = fields;
	                    $scope.$apply();
	                }
	                else {
	                    console.log("shouldn't have null scaffold here: " + checklist.scaffold);
	                }

	            });

	            CacheManager.get(checklist.created_by, function (user) {
	                $scope.user_fullname = 'unknown';
	                if (user.length) {
	                    $scope.user_fullname = user[0].fullname;
	                }

	                $scope.$apply();
	            })


	        });
	    }
	    else {
	        $scope.checklist_template = "partials/checklist_run.html";

	        var scaffold = null;
	        $scope.formData = {};
	        $scope.totalItems = 64;
	        $scope.currentPage = 0;
	        $scope.itemsPerPage = 1;
	        $scope.percent = 0;
	        $scope.directive = 'test-dir';
	        $compile($scope);


	        $scope.prevPage = function () {
	            $scope.currentPage--;
	        };
	        $scope.nextPage = function () {
	            $scope.currentPage++;
	        };

	        $scope.setPage = function (pageNo) {
	            $scope.currentPage = pageNo;
	        };

	        $scope.pageChanged = function () {
	            //$log.log('Page changed to: ' + $scope.currentPage);
	        };
	        $scope.file = null;
	        $scope.saveFile = function () {
	            CacheManager.saveFile($scope.file, function (ref) {
	                $scope.formData[$scope.currQuestion.handle] = ref;
	                $scope.$apply($scope.nextPage);
	            });
	        }

	        $scope.saveForm = function () {

	            CacheManager.set('object.checklist:' + createId($scope.scaffold_title), {
	                scaffold: $scope.scaffoldkey,
	                title: $scope.scaffold_title + ' ' + (new Date()).simple(),
	                data: $scope.formData,
	                procedure: procedure
	            }, function (result) {

	                if (procedure != null) {
	                    $location.path('/procedure/' + procedure);
	                    CacheManager.get(procedure.key, function (procedures) {
	                        var procedure_obj = procedures[0];
	                        CacheManager.get(procedure_obj.scaffold + ':' + procedure.sub_handle, function (field) {
	                            if (procedure_obj.data === undefined) {
	                                procedure_obj.data = {};
	                            }
	                            procedure_obj.data[procedure.sub_handle] = {
	                                value: result.id,
	                                summary: evalReg(field.summary, $scope.formData)
	                            };
	                            CacheManager.set(procedure, procedure_obj, function () {
	                                $scope.$apply();
	                            });
	                        });
	                    });
	                }
	                else {
	                    $location.path('/checklist/' + result.key);
	                    $scope.$evalAsync();
	                }


	            });

	        };
	        $scope.dataVal = function (index, defaultVal) {
	            var data = $scope.currQuestion.data.split('|');
	            var val = data[index];

	            if (val === undefined) {
	                if (defaultVal === undefined) {
	                    return '';
	                }
	                return defaultVal;
	            }
	            return val;
	        };

	        $scope.currentUnix = function () {
	            return Math.round(new Date().getTime() / 1000);
	        };

	        $scope.maxSize = 5;
	        $scope.bigTotalItems = 175;
	        $scope.bigCurrentPage = 1;
	        $scope.questionTemplate = '';

	        var cycle = function () {
	            if ($scope.currentPage >= $scope.totalItems) {
	                $scope.currQuestion = {
	                    title: "Checklist Complete",
	                    description: ""

	                };

	                $scope.questionTemplate = 'partials/form/finished.html';
	            }
	            else {
	                console.log($scope.formData);


	                $scope.percent = ($scope.currentPage * 100) / $scope.totalItems;
	                $scope.currQuestion = $scope.questions[$scope.currentPage];
	                $scope.questionTemplate = 'partials/form/fill/' + $scope.currQuestion.type + '.html';

	                //$('.slide-animate').addClass('ng-enter');				 

	            }

	        };


	        $scope.scaffold = $routeParams.formHandle;
	        $scope.scaffold_title = $routeParams.formHandle;


	        CacheManager.get(checklist, function (reply) {

	            if (reply != null) {
	                var scaff = reply[0];
	                scaffold = scaff;
	                $scope.scaffold_title = scaff['title'];
	                $scope.scaffoldkey = scaff['key'];
	                $scope.questions = scaff['data'];
	                $scope.totalItems = $scope.questions.length;
	                $scope.$watch('currentPage', cycle);
	                $scope.currentPage = 0;
	                $scope.handle = $scope.scaffold +


					$scope.$apply();

	            }
	        });
	    }

	}
]);

'use strict';
var app = angular.module('AltitudeApp');


app.controller('HomeCtrl', ['$scope', '$rootScope', "AppCore", 'CacheManager',
	function ($scope, $rootScope, AppCore, CacheManager) {
	    $scope.currentUser = $rootScope.currentUser;
		AppCore.require();
		$scope.subscriptionText = 'Free';
		$scope.user = $rootScope.currentUser;
		switch ($rootScope.state.company.get('subscription_status')) {
		    case 'trialing':
		        var daysRemaining = $rootScope.state.company.get('valid_until') - unix();
		        daysRemaining = daysRemaining / 86400
		        $scope.subscriptionText = 'Pro Trial. ' + Math.floor(daysRemaining) + ' days remaining';
		        break;
		    case 'active':
		        $scope.subscriptionText = 'Active Subscription';
		        break;
		    case 'past_due':
		        $scope.subscriptionText = 'Past Due';
		        break;
		}
        
		var unsubscribe = $rootScope.$on('userUpdated', function(user) {
			$scope.currentUser = $rootScope.currentUser;
		});


	}
]);


app.controller('ProceduresCtrl', ['$scope', '$rootScope', 'CacheManager', 'AppCore',
	function($scope, $rootScope, CacheManager, AppCore) {
		AppCore.require();
		$scope.checklists = [];
		$scope.checklistScaffolds = [];

		var checklistScaffolds = [];

		var runChecklistLinks = [];
		var editChecklistLinks = [];

		CacheManager.get('scaffold.procedure:#', function(scaffolds) {
			checklistScaffolds = scaffolds;
			editChecklistLinks.push({
				text: 'New',
				href: '#/edit-procedure/new',
			});

			for (var i in checklistScaffolds) {
				var procedure = checklistScaffolds[i];
				runChecklistLinks.push({
					text: procedure.title,
					href: '#/procedure/' + procedure.key,
				});
				editChecklistLinks.push({
					text: procedure.title,
					href: '#/edit-procedure/' + procedure.handle,
				});
			}

		});

		CacheManager.get('object.procedure:%', function(objects) {
			$scope.myProcedures = [];
			for (var i in objects) {
				$scope.myProcedures.push(objects[i]);
			}
			$scope.$apply();
		});

		if (AppCore.hasPermission('admin')) {
			CacheManager.get('object.procedure:*', function(objects) {
				$scope.allProcedures = [];
				for (var i in objects) {
					$scope.allProcedures.push(objects[i]);
				}
				$scope.$apply();
			});
		}

		$scope.runChecklist = function() {
			$rootScope.openSidebarRight("Run Checklist", runChecklistLinks);
		}
		$scope.editChecklists = function() {
			$rootScope.openSidebarRight("Edit Checklists", editChecklistLinks);
		}
	}
]);
app.controller('RunProcedureCtrl', ['$scope', '$rootScope', 'CacheManager', '$routeParams','SharedState','$location','AppCore',
	function($scope, $rootScope, CacheManager, $routeParams,SharedState,$location,AppCore) {
		AppCore.require();
		function saveProcedure(reload){
			
			CacheManager.set('object.procedure', $scope.procedure, function(result) {
				if (reload !== undefined && reload == true)
				$location.path('/procedure/' + result.id);
				$scope.$apply();
			});
		}
		
		var u = uquery($routeParams.id);
		
		var type = u.type.split('.');
		$scope.procedure = {
			data: []
		};
		if (type[0] == 'scaffold'){
			CacheManager.get($routeParams.id,  function(scaffolds) {
				$scope.scaffold = scaffolds[0];
				
				$scope.procedure = {
					title: null,
					scaffold: $routeParams.id,
					data: {},
				};
				
				$scope.procedure_title = $scope.scaffold.title + ' ' + (new Date()).simple();
				
				for(var i in $scope.scaffold.data){
					$scope.procedure.data[$scope.scaffold.data[i].handle] = null;
				}
				$scope.$apply();
			});
		}
		else{
			CacheManager.get($routeParams.id, function (objects){
				var procedure = objects[0].value;
				$scope.procedure = procedure;
				$scope.procedure_title = $scope.procedure.title;
				CacheManager.get(procedure.scaffold, function(scaffolds) {
					$scope.scaffold = scaffolds[0];
					$scope.$apply();
				});
			} );
		}
		
		
		$scope.downloadFile = function (file){
			CacheManager.downloadFile(file);
		}
		$scope.getFileName = function (){
			
		}
		$scope.saveTitle = function(){
			$scope.procedure.title = $scope.procedure_title;
			saveProcedure(true);
		}

		var current_field = null;
		
		$scope.runField= function (field){
			current_field = field;
			switch (field.type){
				case "form":
					$scope.form_fields = field.data;
					if ($scope.procedure.data[field.handle] != null){	
						$scope.form_data = $scope.procedure.data[field.handle].value;
					}
					else{
						$scope.form_data = null;
					}
					SharedState.initialize($scope, 'modal2');
					SharedState.turnOn('modal2');
					break;
				case "import":
					if ($scope.procedure.data[field.handle] == null){
						$location.path('/checklist/' + field.data+'/' + $scope.procedure.key + ':' + field.handle);
					}
					else{
						$location.path('/checklist/' + $scope.procedure.data[field.handle].value+'/' + $scope.procedure.key + ':' + field.handle);
					}
					break;
			}
			
		}
		
		$scope.saveForm = function (){
			var form_data = [];
			for(var i in $scope.form_fields){
				form_data[$scope.form_fields[i].handle] = $scope.form_fields[i].value;
			}
			
			$scope.procedure.data[current_field.handle] = {
				value: form_data,
				summary: evalReg(current_field.summary,form_data)
				};
			saveProcedure(false);
		}
		
		
		
	}
]);

app.controller('CreateUserCtrl', ['$rootScope', '$scope', '$location', "NetLink", "AppCore", "SessionManager",
	function($rootScope, $scope, $location, NetLink, AppCore, SessionManager) {
		$scope.saveUser = function() {
			console.log($scope.newuser);
			var reply = SessionManager.createUser($scope.newuser);
			if (reply.success == 'true') {
			    AppCore.initializeSession(function () {
			        $location.path('/home');
			        $scope.$apply();
			    });				
			}
			else {
				$scope.loginResponse = 'Login Failed';
			}
		};
	}
]);

app.controller('EquipmentCtrl', ['$scope', '$location', "AppCore",'$routeParams','CacheManager',
	function($scope, $location, AppCore,$routeParams,CacheManager) {
		AppCore.require();
		
		var handle = $routeParams.handle;
		
		if (handle === undefined || handle == null){
			$scope.equipment_template = "partials/equipment_list.html";
			
			$scope.scaffolds = [];
			$scope.objects = {};
			CacheManager.get('scaffold.equipment:#', function(reply) {
				$scope.scaffolds = reply;
				CacheManager.get('object.equipment:#', function (objects){
					for(var i in objects){
						if ($scope.objects[objects[i].scaffold] === undefined){
							$scope.objects[objects[i].scaffold] = [];
						}
						
						$scope.objects[objects[i].scaffold].push(objects[i]);
					}
					$scope.$apply();
				});
			});
			
		}
		else{
			$scope.equipment_template = "partials/equipment_edit.html";
			
			var u = uquery(handle);
			var scaffold = null;
			var object = {};
			$scope.object = {};
			$scope.formData = {};
			$scope.formData.fields = {};
			
			if (u.table == 'object'){
				CacheManager.get(u.key_base, function(reply) {
					object = reply[0];
					$scope.formData.fields = object.data;
					$scope.object = object;
					var s_key = uquery(object.scaffold);
					s_key.flag = '&';
					CacheManager.get(s_key, function(reply) {
						$scope.newscaffold = false;
						scaffold = reply[0];
						$scope.selected = null;
						$scope.fields = scaffold.data;
						$scope.$apply();
					});
				});
			}
			else{
				CacheManager.get(u.key_base, function(reply) {
					$scope.newscaffold = false;
					scaffold = reply[0];
					$scope.selected = null;
					$scope.fields = scaffold.data;
					$scope.$apply();
					object.scaffold = scaffold.key_base;
				});
			}
			
			$scope.saveObject = function() {
				var key = '';
				if (u.table == 'scaffold'){
					key = 'object.equipment:' + createId($scope.object.title);
				}
				else{
					key = handle;
				}
				object.title = $scope.object.title;
				object.data = $scope.formData.fields;
				CacheManager.set(key, object);
				$location.path('/equipment');
			}
		}
	}
]);

app.controller('EditCtrl', ['$scope', '$location', "AppCore",'$routeParams','CacheManager',
	function($scope, $location, AppCore,$routeParams,CacheManager) {
		AppCore.require();
		
		var handle = $routeParams.handle;
		var u = uquery(handle);
		var typeName = u.s_type;
		var firstLetter = typeName.charAt(0);
		typeName = firstLetter.toUpperCase() + typeName.substr(1);
		$scope.typeName = typeName;
		$scope.action = "Edit";
		if (u.table == 'scaffold'){
		
			var scaffold = null;
			$scope.newscaffold = true;
			$scope.scaffold = {};
			$scope.models = [];
			$scope.scaffold.title = '';
			$scope.scaffold.handle = '';
			$scope.importable = [];
			
			CacheManager.get('scaffold.equipment:#', function(imports) {
			
				for(var i in imports){
					var imp_kay = uquery(imports[i].key);
					$scope.importable.push({value: 'object.equipment:#' + imp_kay.handle, label: imports[i].title});
				}
	
				if (u.id == 'new') {
					$scope.action = "New";
					$scope.selected = null;
					scaffold = {};
				}
				else {
					CacheManager.get(u.key_base, function(reply) {
						$scope.newscaffold = false;
						scaffold = reply[0];
						$scope.selected = null;
						$scope.models = scaffold.data;
						$scope.scaffold.title = scaffold.title;
						$scope.scaffold.handle = scaffold.handle;
						$scope.$apply();
					});
				}
			});
	
	
			$scope.addItem = function() {
				$scope.models.push({
					"handle": "",
					"title": "",
					"description": "",
					"type": "text",
					"source_type": "custom",
					"data": []
				});
			}
	
			$scope.saveChecklist = function() {
				if ($scope.scaffold.title == ""){
					alert("Please enter a title for this " + $scope.typeName);
					return;
				}
				if (u.id == 'new'){
					handle = u.type + ':' + createId($scope.scaffold.title);
				}
				scaffold.title = $scope.scaffold.title;
				scaffold.data = $scope.models;
				for(var i in scaffold.data){
					if (scaffold.data[i].handle === undefined || scaffold.data[i].handle == '' || scaffold.data[i].handle == null){
						scaffold.data[i].handle = createId(scaffold.data[i].title);
					}
				}
				CacheManager.set(handle, scaffold, function (){
					$location.path('/' + u.s_type);
					$scope.$apply();
				});
				
			}
			$scope.deleteChecklist = function() {
				if (confirm('Are you sure you wish to delete?')) {
					CacheManager.del(scaffold.key, function() {
						$location.path('/home');
					});
					$location.path('/home');
				}
			}
			$scope.deleteField = function (index){
				if(confirm('Are you sure you want to delete this?')){
					$scope.models.splice(index,1);
				}
			}
	
	
			// Model to JSON for demo purpose
			$scope.$watch('models', function(model) {
				$scope.modelAsJson = angular.toJson(model, true);
			}, true);
		}
	}
	
]);
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


window.airportData = [{ "size": "Small", "icao": "YANG", "iata": "", "city": "", "name": "West Angelas Airport", "runway": "", "lat": "-23.136", "long": "0" },
{ "size": "Small", "icao": "YUSL", "iata": "USL", "city": "", "name": "Useless Loop Airport", "runway": "", "lat": "-26.167", "long": "113.4" },
{ "size": "Small", "icao": "YGAR", "iata": "", "city": "", "name": "Gnaraloo Station Airport", "runway": "", "lat": "-23.792", "long": "113.529" },
{ "size": "Medium", "icao": "YSHK", "iata": "DNM", "city": "", "name": "SHARK BAY", "runway": "5545 ft", "lat": "-25.894", "long": "113.577" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Abrolhos North Island", "runway": "", "lat": "-28.3", "long": "113.596" },
{ "size": "Medium", "icao": "YCAR", "iata": "CVQ", "city": "", "name": "CARNARVON", "runway": "5509 ft", "lat": "-24.881", "long": "113.672" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Abrolhos Island", "runway": "", "lat": "-28.475", "long": "113.689" },
{ "size": "Small", "icao": "YTML", "iata": "", "city": "", "name": "Tamala Airport", "runway": "", "lat": "-26.667", "long": "113.733" },
{ "size": "Small", "icao": "YCOY", "iata": "", "city": "", "name": "Coral Bay Airport", "runway": "", "lat": "-23.13", "long": "113.777" },
{ "size": "Small", "icao": "YRAT", "iata": "", "city": "", "name": "Abrolhos Rat Island", "runway": "", "lat": "-28.72", "long": "113.784" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Yardie Homestead", "runway": "", "lat": "-21.884", "long": "114.007" },
{ "size": "Small", "icao": "YEXM", "iata": "EXM", "city": "", "name": "Exmouth Airport", "runway": "", "lat": "-22.033", "long": "114.1" },
{ "size": "Small", "icao": "YKBR", "iata": "KAX", "city": "", "name": "KALBARRI", "runway": "5246 ft", "lat": "-27.69", "long": "114.262" },
{ "size": "Small", "icao": "YGIR", "iata": "", "city": "", "name": "Giralia Airport", "runway": "", "lat": "-22.683", "long": "114.367" },
{ "size": "Small", "icao": "YWPL", "iata": "", "city": "", "name": "Winning Pool North Airport", "runway": "", "lat": "-23.1", "long": "114.533" },
{ "size": "Small", "icao": "YBLB", "iata": "", "city": "", "name": "Billabong Road House Airport", "runway": "", "lat": "-26.817", "long": "114.617" },
{ "size": "Small", "icao": "YNHP", "iata": "", "city": "", "name": "Northampton Airport", "runway": "", "lat": "-28.35", "long": "114.683" },
{ "size": "Medium", "icao": "YGEL", "iata": "GET", "city": "", "name": "GERALDTON", "runway": "6499 ft", "lat": "-28.796", "long": "114.707" },
{ "size": "Small", "icao": "YMIX", "iata": "", "city": "", "name": "Middalya Homestead Airport", "runway": "", "lat": "-23.9", "long": "114.767" },
{ "size": "Small", "icao": "YYNR", "iata": "", "city": "", "name": "Yanrey Airport", "runway": "", "lat": "-22.517", "long": "114.8" },
{ "size": "Small", "icao": "YDRA", "iata": "DOX", "city": "", "name": "Dongara Airport", "runway": "", "lat": "-29.3", "long": "114.933" },
{ "size": "Small", "icao": "YBDX", "iata": "", "city": "", "name": "Barradale Airport", "runway": "", "lat": "-22.863", "long": "114.963" },
{ "size": "Small", "icao": "YLEA", "iata": "", "city": "", "name": "Leeman Airport", "runway": "", "lat": "-29.983", "long": "114.983" },
{ "size": "Small", "icao": "YTHV", "iata": "", "city": "", "name": "Thevenard Island Airport", "runway": "", "lat": "-21.467", "long": "115" },
{ "size": "Small", "icao": "YNYG", "iata": "", "city": "", "name": "Nyang Airport", "runway": "", "lat": "-23.033", "long": "115.033" },
{ "size": "Small", "icao": "YJNB", "iata": "JUR", "city": "", "name": "Jurien Bay Airport", "runway": "", "lat": "-30.3", "long": "115.033" },
{ "size": "Small", "icao": "YLUW", "iata": "", "city": "", "name": "Leeuwin Estate Airport", "runway": "", "lat": "-34.017", "long": "115.05" },
{ "size": "Small", "icao": "YMDR", "iata": "", "city": "", "name": "Minderoo Station Airport", "runway": "", "lat": "-22", "long": "115.05" },
{ "size": "Small", "icao": "YCVS", "iata": "", "city": "", "name": "Cervantes Airport", "runway": "", "lat": "-30.483", "long": "115.083" },
{ "size": "Small", "icao": "YBUC", "iata": "", "city": "", "name": "Butch Airport", "runway": "", "lat": "-33.833", "long": "115.1" },
{ "size": "Small", "icao": "YMGT", "iata": "", "city": "", "name": "MARGARET RIVER", "runway": "3619 ft", "lat": "-33.931", "long": "115.1" },
{ "size": "Small", "icao": "YOLW", "iata": "ONS", "city": "", "name": "Onslow Airport", "runway": "4400 ft", "lat": "-21.668", "long": "115.113" },
{ "size": "Small", "icao": "YAUG", "iata": "", "city": "", "name": "Augusta Airport", "runway": "", "lat": "-34.367", "long": "115.15" },
{ "size": "Small", "icao": "YWMY", "iata": "", "city": "", "name": "Williambury Airport", "runway": "", "lat": "-23.867", "long": "115.15" },
{ "size": "Small", "icao": "YGSC", "iata": "", "city": "", "name": "Gascoyne Junction Airport", "runway": "", "lat": "-25.05", "long": "115.2" },
{ "size": "Small", "icao": "YLYN", "iata": "", "city": "", "name": "Lyndon Airport", "runway": "", "lat": "-23.633", "long": "115.233" },
{ "size": "Small", "icao": "YBLN", "iata": "BQB", "city": "", "name": "BUSSELTON", "runway": "5906 ft", "lat": "-33.693", "long": "115.395" },
{ "size": "Small", "icao": "YBWX", "iata": "BWB", "city": "", "name": "BARROW ISLAND", "runway": "6234 ft", "lat": "-20.864", "long": "115.406" },
{ "size": "Small", "icao": "YMEW", "iata": "", "city": "", "name": "Mingenew Airport", "runway": "", "lat": "-29.267", "long": "115.45" },
{ "size": "Small", "icao": "YNNT", "iata": "", "city": "", "name": "Nantarra Airport", "runway": "", "lat": "-22.533", "long": "115.5" },
{ "size": "Small", "icao": "YMWA", "iata": "MXU", "city": "", "name": "Mullewa Airport", "runway": "3000 ft", "lat": "-28.475", "long": "115.517" },
{ "size": "Small", "icao": "YYLG", "iata": "", "city": "", "name": "Yallalong Homestead Airport", "runway": "", "lat": "-27.426", "long": "115.518" },
{ "size": "Medium", "icao": "YRTI", "iata": "RTS", "city": "", "name": "ROTTNEST ISLAND", "runway": "4242 ft", "lat": "-32.007", "long": "115.54" },
{ "size": "Small", "icao": "YEUD", "iata": "", "city": "", "name": "Eudamulla Station Airport", "runway": "", "lat": "-24.45", "long": "115.6" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Between Lakes Private Airstrip", "runway": "", "lat": "-32.85", "long": "115.64" },
{ "size": "Small", "icao": "YBUN", "iata": "BUY", "city": "", "name": "BUNBURY", "runway": "3330 ft", "lat": "-33.378", "long": "115.677" },
{ "size": "Small", "icao": "YGAD", "iata": "", "city": "", "name": "Garden Island (Military) Airport", "runway": "1400 ft", "lat": "-32.242", "long": "115.683" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Preston Field - Blair Howe", "runway": "", "lat": "-33.019", "long": "115.701" },
{ "size": "Small", "icao": "YNAU", "iata": "", "city": "", "name": "Nannup Airport", "runway": "", "lat": "-34.033", "long": "115.733" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Wheeler Field", "runway": "", "lat": "-32.787", "long": "115.789" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Tardun Christian Brothers airfield", "runway": "", "lat": "-28.709", "long": "115.818" },
{ "size": "Small", "icao": "YBBL", "iata": "", "city": "", "name": "Billabalong Airport", "runway": "", "lat": "-27.417", "long": "115.833" },
{ "size": "Small", "icao": "YMUL", "iata": "", "city": "", "name": "MURRAY FIELD", "runway": "3750 ft", "lat": "-32.508", "long": "115.842" },
{ "size": "Small", "icao": "YTHS", "iata": "", "city": "", "name": "Three Springs Airport", "runway": "", "lat": "-29.528", "long": "115.858" },
{ "size": "Small", "icao": "YGIG", "iata": "", "city": "", "name": "GINGIN", "runway": "5997 ft", "lat": "-31.465", "long": "115.863" },
{ "size": "Small", "icao": "YDRC", "iata": "", "city": "", "name": "Dairy Creek Homestead Airport", "runway": "", "lat": "-25.283", "long": "115.867" },
{ "size": "Small", "icao": "YSEN", "iata": "", "city": "", "name": "Serpentine Airport", "runway": "3000 ft", "lat": "-32.395", "long": "115.871" },
{ "size": "Small", "icao": "YCNH", "iata": "", "city": "", "name": "Carnarmah Airport", "runway": "", "lat": "-29.683", "long": "115.883" },
{ "size": "Small", "icao": "YMDZ", "iata": "", "city": "", "name": "Mardi Station Airport", "runway": "", "lat": "-21.2", "long": "115.983" },
{ "size": "Small", "icao": "YMSS", "iata": "", "city": "", "name": "Murchison Shire Airport", "runway": "", "lat": "-26.917", "long": "115.983" },
{ "size": "Small", "icao": "YMRW", "iata": "MWB", "city": "", "name": "Morawa Airport", "runway": "3000 ft", "lat": "-29.202", "long": "116.022" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Yuin Station", "runway": "", "lat": "-27.983", "long": "116.033" },
{ "size": "Small", "icao": "YRHL", "iata": "", "city": "", "name": "Red Hill Station Airport", "runway": "", "lat": "-21.967", "long": "116.067" },
{ "size": "Small", "icao": "YEDM", "iata": "", "city": "", "name": "Edmund Station Airport", "runway": "", "lat": "-23.75", "long": "116.1" },
{ "size": "Small", "icao": "YFCU", "iata": "", "city": "", "name": "Fortescue River Airport", "runway": "", "lat": "-21.3", "long": "116.133" },
{ "size": "Small", "icao": "YMJM", "iata": "MJP", "city": "", "name": "MANJIMUP", "runway": "4016 ft", "lat": "-34.265", "long": "116.14" },
{ "size": "Small", "icao": "YWEE", "iata": "", "city": "", "name": "Wooleen Homestead Airport", "runway": "", "lat": "-27.082", "long": "116.15" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Northcliffe Airstrips (needs confirmation)", "runway": "", "lat": "-34.659", "long": "116.152" },
{ "size": "Small", "icao": "YBOO", "iata": "", "city": "", "name": "Catholic Agricultural College Bindoon Airstrip", "runway": "", "lat": "-31.34", "long": "116.188" },
{ "size": "Small", "icao": "YDGT", "iata": "", "city": "", "name": "Dalgety Downs Station Airport", "runway": "", "lat": "-25.283", "long": "116.2" },
{ "size": "Small", "icao": "YCOI", "iata": "", "city": "", "name": "Collie Airport", "runway": "", "lat": "-33.367", "long": "116.217" },
{ "size": "Small", "icao": "YGIF", "iata": "", "city": "", "name": "Gifford Creek Station Airport", "runway": "", "lat": "-24.05", "long": "116.217" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "New Norcia North", "runway": "", "lat": "-30.921", "long": "116.24" },
{ "size": "Closed", "icao": "", "iata": "", "city": "", "name": "Avon Valley NP Airstrip", "runway": "", "lat": "-31.606", "long": "116.261" },
{ "size": "Small", "icao": "YGUL", "iata": "", "city": "", "name": "Gullewa Airport", "runway": "", "lat": "-28.633", "long": "116.283" },
{ "size": "Small", "icao": "YPJI", "iata": "", "city": "", "name": "Perenjori Airport", "runway": "", "lat": "-29.433", "long": "116.283" },
{ "size": "Small", "icao": "YPIX", "iata": "", "city": "", "name": "Pia Airport", "runway": "", "lat": "-27.192", "long": "116.292" },
{ "size": "Small", "icao": "YPNW", "iata": "", "city": "", "name": "Pannawonica Airport", "runway": "", "lat": "-21.617", "long": "116.317" },
{ "size": "Small", "icao": "YMGO", "iata": "", "city": "", "name": "Murgoo Airport", "runway": "", "lat": "-27.367", "long": "116.417" },
{ "size": "Small", "icao": "YBOP", "iata": "", "city": "", "name": "Boyup Brook Airport", "runway": "", "lat": "-33.9", "long": "116.467" },
{ "size": "Small", "icao": "YSHN", "iata": "", "city": "", "name": "Shannon River Airport", "runway": "", "lat": "-34.75", "long": "116.483" },
{ "size": "Small", "icao": "YDVE", "iata": "", "city": "", "name": "Dale River Airport", "runway": "", "lat": "-32.283", "long": "116.55" },
{ "size": "Small", "icao": "YMNF", "iata": "", "city": "", "name": "Manfred Airport", "runway": "", "lat": "-26.45", "long": "116.55" },
{ "size": "Small", "icao": "YDWU", "iata": "", "city": "", "name": "Dalwallinu Airport", "runway": "", "lat": "-30.2", "long": "116.65" },
{ "size": "Small", "icao": "YERO", "iata": "", "city": "", "name": "Erong Station Airport", "runway": "", "lat": "-25.567", "long": "116.667" },
{ "size": "Small", "icao": "YNTM", "iata": "", "city": "", "name": "Northam Airport", "runway": "3000 ft", "lat": "-31.63", "long": "116.683" },
{ "size": "Small", "icao": "YWPE", "iata": "", "city": "", "name": "Walpole Airport", "runway": "", "lat": "-34.95", "long": "116.7" },
{ "size": "Small", "icao": "YWOH", "iata": "", "city": "", "name": "Wongan Hills Airport", "runway": "", "lat": "-30.867", "long": "116.733" },
{ "size": "Small", "icao": "YBIU", "iata": "", "city": "", "name": "Ballidu Airport", "runway": "", "lat": "-30.593", "long": "116.78" },
{ "size": "Small", "icao": "YBLD", "iata": "", "city": "", "name": "Brooklands Airport", "runway": "", "lat": "-31.825", "long": "116.796" },
{ "size": "Small", "icao": "YYRK", "iata": "", "city": "", "name": "York Airport", "runway": "", "lat": "-31.855", "long": "116.799" },
{ "size": "Small", "icao": "YHLM", "iata": "", "city": "", "name": "Hillman Farm Airport", "runway": "", "lat": "-33.264", "long": "116.815" },
{ "size": "Small", "icao": "YROT", "iata": "", "city": "", "name": "Rothsay Mine Airport", "runway": "", "lat": "-29.292", "long": "116.867" },
{ "size": "Small", "icao": "YGOM", "iata": "", "city": "", "name": "Goomalling Airport", "runway": "", "lat": "-31.367", "long": "116.883" },
{ "size": "Small", "icao": "YLDO", "iata": "", "city": "", "name": "Landor Station Airport", "runway": "", "lat": "-25.1", "long": "116.9" },
{ "size": "Small", "icao": "YMAU", "iata": "", "city": "", "name": "Mount Augusta Airport", "runway": "", "lat": "-24.3", "long": "116.917" },
{ "size": "Small", "icao": "YMJE", "iata": "", "city": "", "name": "Mount James Airport", "runway": "", "lat": "-24.617", "long": "116.933" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "White Gum Farm", "runway": "", "lat": "-31.867", "long": "116.939" },
{ "size": "Small", "icao": "YBEV", "iata": "", "city": "", "name": "Beverley Airport", "runway": "", "lat": "-32.133", "long": "116.95" },
{ "size": "Small", "icao": "YGGE", "iata": "", "city": "", "name": "Golden Grove Airport", "runway": "", "lat": "-28.75", "long": "116.95" },
{ "size": "Small", "icao": "YLNR", "iata": "", "city": "", "name": "Landor Races Airport", "runway": "", "lat": "-24.95", "long": "116.967" },
{ "size": "Small", "icao": "YDGR", "iata": "", "city": "", "name": "Dalgaranga Airport", "runway": "", "lat": "-27.791", "long": "116.993" },
{ "size": "Small", "icao": "YAHD", "iata": "", "city": "", "name": "Ashburton Downs Airport", "runway": "", "lat": "-23.383", "long": "117.033" },
{ "size": "Small", "icao": "YDON", "iata": "", "city": "", "name": "Dowerin Airport", "runway": "", "lat": "-31.183", "long": "117.05" },
{ "size": "Small", "icao": "YPIY", "iata": "", "city": "", "name": "Pingelly Airport", "runway": "", "lat": "-32.54", "long": "117.073" },
{ "size": "Small", "icao": "YNRG", "iata": "", "city": "", "name": "Narrogin Airport", "runway": "", "lat": "-32.93", "long": "117.08" },
{ "size": "Small", "icao": "YKAE", "iata": "", "city": "", "name": "Kalannie Airport", "runway": "", "lat": "-30.367", "long": "117.133" },
{ "size": "Small", "icao": "YKOJ", "iata": "", "city": "", "name": "Kojonup Airport", "runway": "", "lat": "-33.767", "long": "117.133" },
{ "size": "Small", "icao": "YERA", "iata": "", "city": "", "name": "Errabiddy Homestead Airport", "runway": "", "lat": "-25.5", "long": "117.167" },
{ "size": "Small", "icao": "YCUN", "iata": "", "city": "", "name": "CUNDERDIN", "runway": "6089 ft", "lat": "-31.622", "long": "117.217" },
{ "size": "Small", "icao": "YBGD", "iata": "OCM", "city": "", "name": "Boolgeeda", "runway": "", "lat": "-22.54", "long": "117.275" },
{ "size": "Small", "icao": "YDGA", "iata": "DGD", "city": "", "name": "Dalgaranga Gold Mine Airport", "runway": "", "lat": "-27.83", "long": "117.316" },
{ "size": "Small", "icao": "YMUX", "iata": "", "city": "", "name": "Mileura Airport", "runway": "", "lat": "-26.367", "long": "117.333" },
{ "size": "Small", "icao": "YWAB", "iata": "", "city": "", "name": "Waldburg Homestead Airport", "runway": "", "lat": "-24.75", "long": "117.367" },
{ "size": "Small", "icao": "YWGN", "iata": "", "city": "", "name": "Wagin Airport", "runway": "", "lat": "-33.333", "long": "117.367" },
{ "size": "Small", "icao": "YQDG", "iata": "", "city": "", "name": "Quairading Airport", "runway": "", "lat": "-32", "long": "117.4" },
{ "size": "Small", "icao": "YRLE", "iata": "", "city": "", "name": "Rocklea Airport", "runway": "", "lat": "-22.883", "long": "117.45" },
{ "size": "Small", "icao": "YCRN", "iata": "", "city": "", "name": "Cranbrook Airport", "runway": "", "lat": "-34.283", "long": "117.55" },
{ "size": "Small", "icao": "YMCE", "iata": "", "city": "", "name": "Mount Clere Homestead Airport", "runway": "", "lat": "-25.1", "long": "117.583" },
{ "size": "Small", "icao": "YKNG", "iata": "KNI", "city": "", "name": "Katanning Airport", "runway": "", "lat": "-33.717", "long": "117.633" },
{ "size": "Small", "icao": "YPYF", "iata": "", "city": "", "name": "Paynes Find Airport", "runway": "", "lat": "-29.25", "long": "117.667" },
{ "size": "Small", "icao": "YKEB", "iata": "", "city": "", "name": "Kellerberrin Airport", "runway": "", "lat": "-31.667", "long": "117.733" },
{ "size": "Small", "icao": "YDUM", "iata": "", "city": "", "name": "Dumbleyung Airport", "runway": "", "lat": "-33.333", "long": "117.75" },
{ "size": "Small", "icao": "", "iata": "SLJ", "city": "", "name": "Solomon Aerodrome", "runway": "", "lat": "-22.255", "long": "117.763" },
{ "size": "Small", "icao": "YKNM", "iata": "", "city": "", "name": "Koonmarra Airport", "runway": "", "lat": "-26.283", "long": "117.783" },
{ "size": "Small", "icao": "YCWY", "iata": "COY", "city": "", "name": "Coolawanyah Airport", "runway": "", "lat": "-21.783", "long": "117.8" },
{ "size": "Small", "icao": "YCIG", "iata": "", "city": "", "name": "Corrigin Airport", "runway": "", "lat": "-32.333", "long": "117.817" },
{ "size": "Medium", "icao": "YMOG", "iata": "MMG", "city": "", "name": "MOUNT MAGNET", "runway": "5906 ft", "lat": "-28.116", "long": "117.842" },
{ "size": "Small", "icao": "YBCB", "iata": "", "city": "", "name": "Bencubbin Airport", "runway": "", "lat": "-30.833", "long": "117.867" },
{ "size": "Small", "icao": "YBEC", "iata": "", "city": "", "name": "Beacon Airport", "runway": "", "lat": "-30.483", "long": "117.883" },
{ "size": "Small", "icao": "YKNP", "iata": "", "city": "", "name": "Kununoppin Airport", "runway": "", "lat": "-31.133", "long": "117.9" },
{ "size": "Small", "icao": "YCUE", "iata": "CUY", "city": "", "name": "Cue Airport", "runway": "6400 ft", "lat": "-27.447", "long": "117.918" },
{ "size": "Small", "icao": "YYRW", "iata": "", "city": "", "name": "Yarlarweelor Airport", "runway": "", "lat": "-25.458", "long": "117.975" },
{ "size": "Small", "icao": "YELE", "iata": "", "city": "", "name": "Belele Airport", "runway": "", "lat": "-26.367", "long": "118.017" },
{ "size": "Small", "icao": "YGNW", "iata": "", "city": "", "name": "Gnowangerup Airport", "runway": "", "lat": "-33.983", "long": "118.033" },
{ "size": "Small", "icao": "YMLA", "iata": "", "city": "", "name": "Malina Airport", "runway": "", "lat": "-20.883", "long": "118.033" },
{ "size": "Small", "icao": "YMDB", "iata": "", "city": "", "name": "Mundabullangana Airport", "runway": "", "lat": "-20.517", "long": "118.067" },
{ "size": "Small", "icao": "YBRO", "iata": "", "city": "", "name": "Bruce Rock Airport", "runway": "", "lat": "-31.883", "long": "118.117" },
{ "size": "Small", "icao": "YTUC", "iata": "", "city": "", "name": "Tuckabiana Airport", "runway": "", "lat": "-27.475", "long": "118.125" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Kulin Airport", "runway": "", "lat": "-32.672", "long": "118.169" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Stirling Range Retreat", "runway": "", "lat": "-34.312", "long": "118.186" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Lily Dutch Windmill Airstrip", "runway": "", "lat": "-34.225", "long": "118.216" },
{ "size": "Small", "icao": "YMVR", "iata": "", "city": "", "name": "Mount Vernon Station Airport", "runway": "", "lat": "-24.233", "long": "118.233" },
{ "size": "Small", "icao": "YMKB", "iata": "", "city": "", "name": "Mukinbudin Airport", "runway": "", "lat": "-30.933", "long": "118.25" },
{ "size": "Small", "icao": "YRDY", "iata": "", "city": "", "name": "Reedys Airport", "runway": "", "lat": "-27.132", "long": "118.28" },
{ "size": "Small", "icao": "YKDN", "iata": "", "city": "", "name": "Kondinin Airport", "runway": "", "lat": "-32.467", "long": "118.283" },
{ "size": "Small", "icao": "YMDN", "iata": "", "city": "", "name": "Merredin Airport", "runway": "", "lat": "-31.505", "long": "118.323" },
{ "size": "Small", "icao": "YMIL", "iata": "", "city": "", "name": "Milgun Airport", "runway": "", "lat": "-25.083", "long": "118.333" },
{ "size": "Small", "icao": "YWIT", "iata": "WIT", "city": "", "name": "Wittenoom Airport", "runway": "", "lat": "-22.218", "long": "118.348" },
{ "size": "Small", "icao": "YFOR", "iata": "", "city": "", "name": "Fortnum Airport", "runway": "", "lat": "-25.333", "long": "118.367" },
{ "size": "Small", "icao": "YLGC", "iata": "", "city": "", "name": "Lake Grace Airport", "runway": "", "lat": "-33.133", "long": "118.4" },
{ "size": "Small", "icao": "YNRB", "iata": "", "city": "", "name": "Narembeen Airport", "runway": "", "lat": "-32.117", "long": "118.417" },
{ "size": "Small", "icao": "YLGA", "iata": "", "city": "", "name": "Mulga Downs Airport", "runway": "", "lat": "-22.107", "long": "118.471" },
{ "size": "Medium", "icao": "YMEK", "iata": "MKR", "city": "", "name": "MEEKATHARRA", "runway": "7156 ft", "lat": "-26.612", "long": "118.548" },
{ "size": "Small", "icao": "YHSL", "iata": "", "city": "", "name": "Horseshoe Lights Airport", "runway": "", "lat": "-25.35", "long": "118.617" },
{ "size": "Small", "icao": "YTRK", "iata": "", "city": "", "name": "Turee Creek Airport", "runway": "", "lat": "-23.617", "long": "118.617" },
{ "size": "Small", "icao": "YWSX", "iata": "", "city": "", "name": "Westonia Airport", "runway": "", "lat": "-31.333", "long": "118.667" },
{ "size": "Small", "icao": "YMUJ", "iata": "", "city": "", "name": "Munjina Airport", "runway": "", "lat": "-22.366", "long": "118.681" },
{ "size": "Small", "icao": "YPLL", "iata": "", "city": "", "name": "Peak Hill Airport", "runway": "", "lat": "-25.6", "long": "118.683" },
{ "size": "Small", "icao": "YWDC", "iata": "", "city": "", "name": "Wodgina Airport", "runway": "", "lat": "-21.142", "long": "118.692" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "West Angelas Airport", "runway": "", "lat": "-23.136", "long": "118.707" },
{ "size": "Small", "icao": "YBYA", "iata": "", "city": "", "name": "Bryah Airport", "runway": "", "lat": "-25.533", "long": "118.733" },
{ "size": "Small", "icao": "YCWA", "iata": "CJF", "city": "", "name": "Coondewanna Wa Airport", "runway": "", "lat": "-22.967", "long": "118.813" },
{ "size": "Small", "icao": "YOUN", "iata": "", "city": "", "name": "Youanmi Airport", "runway": "", "lat": "-28.615", "long": "118.842" },
{ "size": "Small", "icao": "YHYD", "iata": "", "city": "", "name": "Hyden Airport", "runway": "", "lat": "-32.433", "long": "118.867" },
{ "size": "Small", "icao": "YYDE", "iata": "", "city": "", "name": "Yandee Airport", "runway": "", "lat": "-21.333", "long": "118.867" },
{ "size": "Small", "icao": "YJGP", "iata": "", "city": "", "name": "Jerramungup Airport", "runway": "", "lat": "-33.9", "long": "118.9" },
{ "size": "Small", "icao": "YWRC", "iata": "", "city": "", "name": "Wave Rock Airport", "runway": "", "lat": "-32.427", "long": "118.908" },
{ "size": "Small", "icao": "YNDG", "iata": "", "city": "", "name": "Newdegate Airport", "runway": "", "lat": "-33.117", "long": "119" },
{ "size": "Small", "icao": "YRDM", "iata": "", "city": "", "name": "Redmont Airport", "runway": "", "lat": "-21.967", "long": "119.017" },
{ "size": "Small", "icao": "YYUM", "iata": "", "city": "", "name": "Yuinmery Airport", "runway": "", "lat": "-28.563", "long": "119.019" },
{ "size": "Small", "icao": "YTHR", "iata": "", "city": "", "name": "Three Rivers Homestead Airport", "runway": "", "lat": "-25.133", "long": "119.117" },
{ "size": "Small", "icao": "YBRY", "iata": "BYP", "city": "", "name": "BARIMUNYA", "runway": "6168 ft", "lat": "-22.674", "long": "119.166" },
{ "size": "Small", "icao": "YGPI", "iata": "", "city": "", "name": "Giles Point Airport", "runway": "", "lat": "-23.267", "long": "119.167" },
{ "size": "Small", "icao": "YDGY", "iata": "", "city": "", "name": "De Grey Homestead Airport", "runway": "", "lat": "-20.175", "long": "119.169" },
{ "size": "Closed", "icao": "YYCN", "iata": "", "city": "", "name": "Yandicoogina Airport", "runway": "", "lat": "-22.76", "long": "119.227" },
{ "size": "Small", "icao": "YATY", "iata": "", "city": "", "name": "Atley Airport", "runway": "", "lat": "-28.217", "long": "119.25" },
{ "size": "Small", "icao": "YDMF", "iata": "", "city": "", "name": "Diemal Find Airport", "runway": "", "lat": "-29.667", "long": "119.283" },
{ "size": "Small", "icao": "YRRG", "iata": "", "city": "", "name": "Rhodes Ridge Airport", "runway": "", "lat": "-23.108", "long": "119.333" },
{ "size": "Small", "icao": "YSCR", "iata": "SQC", "city": "", "name": "Southern Cross Airport", "runway": "3000 ft", "lat": "-31.24", "long": "119.36" },
{ "size": "Small", "icao": "YGID", "iata": "", "city": "", "name": "Gidgee Airport", "runway": "", "lat": "-27.27", "long": "119.405" },
{ "size": "Small", "icao": "YHIL", "iata": "", "city": "", "name": "Hillside Airport", "runway": "", "lat": "-21.75", "long": "119.417" },
{ "size": "Small", "icao": "YPLU", "iata": "", "city": "", "name": "Plutonic Airport", "runway": "", "lat": "-25.333", "long": "119.425" },
{ "size": "Small", "icao": "YLVY", "iata": "", "city": "", "name": "Lake Varley Airport", "runway": "", "lat": "-32.708", "long": "119.513" },
{ "size": "Small", "icao": "YKBG", "iata": "", "city": "", "name": "Koolyanobbing Range Airport", "runway": "", "lat": "-30.841", "long": "119.529" },
{ "size": "Small", "icao": "YMVH", "iata": "", "city": "", "name": "Marvel Loch Airport", "runway": "", "lat": "-31.467", "long": "119.533" },
{ "size": "Small", "icao": "YBUO", "iata": "", "city": "", "name": "Bulloo Downs Station Airport", "runway": "", "lat": "-24.017", "long": "119.567" },
{ "size": "Small", "icao": "YSAH", "iata": "", "city": "", "name": "Sandhill Airport", "runway": "", "lat": "-22.8", "long": "119.617" },
{ "size": "Small", "icao": "YCOG", "iata": "", "city": "", "name": "Coongan Airport", "runway": "", "lat": "-20.683", "long": "119.667" },
{ "size": "Small", "icao": "YFTA", "iata": "", "city": "", "name": "Forrestania Airport", "runway": "", "lat": "-32.58", "long": "119.703" },
{ "size": "Small", "icao": "YBUG", "iata": "", "city": "", "name": "Bulga Downs Station Airport", "runway": "", "lat": "-28.5", "long": "119.733" },
{ "size": "Small", "icao": "YMYI", "iata": "", "city": "", "name": "Marymia Airport", "runway": "", "lat": "-25.093", "long": "119.755" },
{ "size": "Small", "icao": "YLKG", "iata": "", "city": "", "name": "Lake King Airport", "runway": "", "lat": "-33.079", "long": "119.766" },
{ "size": "Small", "icao": "YMHL", "iata": "", "city": "", "name": "Mount Holland Airport", "runway": "", "lat": "-32.118", "long": "119.768" },
{ "size": "Small", "icao": "YDME", "iata": "", "city": "", "name": "Mount Dimer Airport", "runway": "", "lat": "-30.402", "long": "119.83" },
{ "size": "Small", "icao": "YMBL", "iata": "MBB", "city": "", "name": "Marble Bar Airport", "runway": "3000 ft", "lat": "-21.163", "long": "119.833" },
{ "size": "Small", "icao": "YBYD", "iata": "", "city": "", "name": "Bonney Downs Station Airport", "runway": "", "lat": "-22.267", "long": "119.883" },
{ "size": "Small", "icao": "YBOY", "iata": "", "city": "", "name": "Booylgoo Springs Airport", "runway": "", "lat": "-27.75", "long": "119.9" },
{ "size": "Small", "icao": "YRAV", "iata": "", "city": "", "name": "Ravensthorpe Airport", "runway": "", "lat": "-33.528", "long": "119.953" },
{ "size": "Small", "icao": "YRYH", "iata": "RHL", "city": "", "name": "Roy Hill Station Airport", "runway": "", "lat": "-22.626", "long": "119.959" },
{ "size": "Small", "icao": "YCPG", "iata": "", "city": "", "name": "Coppins Gap Airport", "runway": "", "lat": "-20.95", "long": "120.033" },
{ "size": "Small", "icao": "YSLV", "iata": "", "city": "", "name": "Sylvania Homestead Airport", "runway": "", "lat": "-23.558", "long": "120.047" },
{ "size": "Small", "icao": "YDPS", "iata": "", "city": "", "name": "Depot Springs Airport", "runway": "", "lat": "-27.883", "long": "120.083" },
{ "size": "Small", "icao": "YHPE", "iata": "", "city": "", "name": "Hopetoun Airport", "runway": "", "lat": "-33.9", "long": "120.158" },
{ "size": "Small", "icao": "YNUL", "iata": "NLL", "city": "", "name": "Nullagine Airport", "runway": "3000 ft", "lat": "-21.913", "long": "120.198" },
{ "size": "Small", "icao": "YNRV", "iata": "RVT", "city": "", "name": "RAVENSTHORPE", "runway": "5512 ft", "lat": "-33.797", "long": "120.208" },
{ "size": "Medium", "icao": "YWLU", "iata": "WUN", "city": "", "name": "WILUNA", "runway": "5942 ft", "lat": "-26.629", "long": "120.221" },
{ "size": "Small", "icao": "YABS", "iata": "", "city": "", "name": "Albion Downs Airport", "runway": "", "lat": "-27.283", "long": "120.383" },
{ "size": "Small", "icao": "YPCS", "iata": "", "city": "", "name": "Pinnacles Homestead Airport", "runway": "", "lat": "-28.2", "long": "120.433" },
{ "size": "Small", "icao": "YLWY", "iata": "", "city": "", "name": "Lake Way Airport", "runway": "", "lat": "-26.945", "long": "120.47" },
{ "size": "Small", "icao": "YLAW", "iata": "", "city": "", "name": "Lawlers Airport", "runway": "", "lat": "-28.083", "long": "120.5" },
{ "size": "Medium", "icao": "YMNE", "iata": "WME", "city": "", "name": "MOUNT KEITH", "runway": "5896 ft", "lat": "-27.286", "long": "120.555" },
{ "size": "Small", "icao": "YJUN", "iata": "", "city": "", "name": "Jundee Airport", "runway": "6800 ft", "lat": "-26.422", "long": "120.577" },
{ "size": "Small", "icao": "YCAI", "iata": "", "city": "", "name": "Callion Airport", "runway": "", "lat": "-30.117", "long": "120.583" },
{ "size": "Small", "icao": "YBLU", "iata": "", "city": "", "name": "Bellevue Airport", "runway": "", "lat": "-27.615", "long": "120.612" },
{ "size": "Medium", "icao": "YLST", "iata": "LER", "city": "", "name": "LEINSTER", "runway": "5906 ft", "lat": "-27.843", "long": "120.703" },
{ "size": "Small", "icao": "YJIG", "iata": "", "city": "", "name": "Jiggalong Mission Airport", "runway": "", "lat": "-23.367", "long": "120.783" },
{ "size": "Small", "icao": "YMCU", "iata": "", "city": "", "name": "Mount Mcclure Airport", "runway": "", "lat": "-27.47", "long": "120.917" },
{ "size": "Small", "icao": "YMIS", "iata": "", "city": "", "name": "Millrose Homestead Airport", "runway": "", "lat": "-26.4", "long": "120.95" },
{ "size": "Small", "icao": "YLOC", "iata": "", "city": "", "name": "Lochinvar Airport", "runway": "", "lat": "-20.758", "long": "121.017" },
{ "size": "Small", "icao": "YMZI", "iata": "", "city": "", "name": "Menzies Airport", "runway": "", "lat": "-29.667", "long": "121.017" },
{ "size": "Small", "icao": "YBWG", "iata": "", "city": "", "name": "BRONZEWING", "runway": "6692 ft", "lat": "-27.366", "long": "121.036" },
{ "size": "Small", "icao": "YCLG", "iata": "", "city": "", "name": "Coolgardie Airport", "runway": "", "lat": "-30.95", "long": "121.15" },
{ "size": "Small", "icao": "YSFI", "iata": "", "city": "", "name": "Sandfire Airport", "runway": "", "lat": "-19.767", "long": "121.167" },
{ "size": "Small", "icao": "YJEY", "iata": "", "city": "", "name": "Jeedamya Airport", "runway": "", "lat": "-29.4", "long": "121.267" },
{ "size": "Small", "icao": "YDLO", "iata": "", "city": "", "name": "Darlot Airport", "runway": "", "lat": "-27.883", "long": "121.267" },
{ "size": "Small", "icao": "YMRS", "iata": "", "city": "", "name": "Melrose Airport", "runway": "", "lat": "-27.933", "long": "121.3" },
{ "size": "Small", "icao": "YWNO", "iata": "", "city": "", "name": "Wonganoo Airport", "runway": "", "lat": "-27.125", "long": "121.333" },
{ "size": "Small", "icao": "YORW", "iata": "", "city": "", "name": "Orient Well Airport", "runway": "", "lat": "-29.199", "long": "121.438" },
{ "size": "Small", "icao": "YKOK", "iata": "", "city": "", "name": "Kookynie Airport", "runway": "", "lat": "-29.35", "long": "121.483" },
{ "size": "Small", "icao": "YAPA", "iata": "", "city": "", "name": "Anna Plains Airport", "runway": "", "lat": "-19.267", "long": "121.517" },
{ "size": "Small", "icao": "YLRG", "iata": "", "city": "", "name": "Lorna Glen Homestead Airport", "runway": "", "lat": "-26.217", "long": "121.55" },
{ "size": "Small", "icao": "YERH", "iata": "", "city": "", "name": "Earaheedy Airport", "runway": "", "lat": "-25.6", "long": "121.583" },
{ "size": "Small", "icao": "YCNF", "iata": "NIF", "city": "", "name": "Camp Nifty Airport", "runway": "", "lat": "-21.672", "long": "121.587" },
{ "size": "Small", "icao": "YBJW", "iata": "", "city": "", "name": "Banjawarn Airport", "runway": "", "lat": "-27.667", "long": "121.6" },
{ "size": "Small", "icao": "YKBL", "iata": "", "city": "", "name": "Kambalda Airport", "runway": "", "lat": "-31.183", "long": "121.6" },
{ "size": "Small", "icao": "YNSM", "iata": "NSM", "city": "", "name": "Norseman Airport", "runway": "3000 ft", "lat": "-32.21", "long": "121.755" },
{ "size": "Small", "icao": "YMLX", "iata": "", "city": "", "name": "Milurie Homestead Airport", "runway": "", "lat": "-27.583", "long": "121.783" },
{ "size": "Small", "icao": "YMNX", "iata": "", "city": "", "name": "Minura Airport", "runway": "", "lat": "-28.883", "long": "121.8" },
{ "size": "Small", "icao": "YLGB", "iata": "", "city": "", "name": "La Grange Bay Airport", "runway": "", "lat": "-18.683", "long": "121.808" },
{ "size": "Medium", "icao": "YESP", "iata": "EPR", "city": "", "name": "ESPERANCE", "runway": "4921 ft", "lat": "-33.684", "long": "121.823" },
{ "size": "Small", "icao": "YYER", "iata": "", "city": "", "name": "Yerilla Airport", "runway": "", "lat": "-29.468", "long": "121.83" },
{ "size": "Small", "icao": "YMMI", "iata": "WUI", "city": "", "name": "MURRIN MURRIN", "runway": "6562 ft", "lat": "-28.705", "long": "121.891" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Myrup fly in estate Airport", "runway": "", "lat": "-33.794", "long": "121.958" },
{ "size": "Small", "icao": "YWGW", "iata": "", "city": "", "name": "Wongawol Airport", "runway": "", "lat": "-26.133", "long": "121.967" },
{ "size": "Small", "icao": "YYDM", "iata": "", "city": "", "name": "Yundamindera Airport", "runway": "", "lat": "-29.117", "long": "122.033" },
{ "size": "Small", "icao": "YMGS", "iata": "", "city": "", "name": "Mount Morgans Airport", "runway": "", "lat": "-28.787", "long": "122.034" },
{ "size": "Small", "icao": "YGLY", "iata": "", "city": "", "name": "Glenayle Homestead Airport", "runway": "", "lat": "-25.283", "long": "122.05" },
{ "size": "Small", "icao": "YTCF", "iata": "", "city": "", "name": "Tracies Field", "runway": "", "lat": "-22.317", "long": "122.067" },
{ "size": "Small", "icao": "YRUD", "iata": "", "city": "", "name": "Rudal River Airport", "runway": "", "lat": "-22.55", "long": "122.15" },
{ "size": "Medium", "icao": "YTEF", "iata": "TEF", "city": "", "name": "TELFER", "runway": "6562 ft", "lat": "-21.715", "long": "122.229" },
{ "size": "Small", "icao": "YWDA", "iata": "WND", "city": "", "name": "Windarra Airport", "runway": "", "lat": "-28.475", "long": "122.242" },
{ "size": "Small", "icao": "YPOP", "iata": "", "city": "", "name": "Porphyry Airport", "runway": "", "lat": "-29.778", "long": "122.268" },
{ "size": "Small", "icao": "YDUK", "iata": "", "city": "", "name": "Duketon Airport", "runway": "", "lat": "-27.958", "long": "122.308" },
{ "size": "Small", "icao": "YLTN", "iata": "LVO", "city": "", "name": "LAVERTON", "runway": "5906 ft", "lat": "-28.614", "long": "122.424" },
{ "size": "Small", "icao": "YMNW", "iata": "", "city": "", "name": "Mount Weld Airport", "runway": "", "lat": "-28.772", "long": "122.44" },
{ "size": "Small", "icao": "YSRD", "iata": "", "city": "", "name": "Sunrise Dam Airport", "runway": "", "lat": "-29.102", "long": "122.45" },
{ "size": "Small", "icao": "YCTC", "iata": "", "city": "", "name": "Cotten Creek Airport", "runway": "", "lat": "-22.8", "long": "122.583" },
{ "size": "Small", "icao": "YBGB", "iata": "", "city": "", "name": "Beagle Bay Airport", "runway": "", "lat": "-16.983", "long": "122.65" },
{ "size": "Small", "icao": "YPNI", "iata": "", "city": "", "name": "Prenti Downs Airport", "runway": "", "lat": "-26.517", "long": "122.8" },
{ "size": "Small", "icao": "YCOS", "iata": "", "city": "", "name": "Cosmo Newberry Airport", "runway": "", "lat": "-27.985", "long": "122.903" },
{ "size": "Small", "icao": "YLBD", "iata": "", "city": "", "name": "Lombadina Airport", "runway": "", "lat": "-16.517", "long": "122.917" },
{ "size": "Small", "icao": "YCLQ", "iata": "", "city": "", "name": "Cape Leveque Airport", "runway": "", "lat": "-16.398", "long": "122.932" },
{ "size": "Small", "icao": "YORL", "iata": "", "city": "", "name": "Orleans Farm Airport", "runway": "", "lat": "-33.783", "long": "122.95" },
{ "size": "Small", "icao": "YCGI", "iata": "", "city": "", "name": "Carnegie Station Airport", "runway": "", "lat": "-25.8", "long": "122.967" },
{ "size": "Small", "icao": "YOAP", "iata": "", "city": "", "name": "One Arm Point Airport", "runway": "", "lat": "-16.433", "long": "123.05" },
{ "size": "Small", "icao": "YCNN", "iata": "", "city": "", "name": "Coonana Airport", "runway": "", "lat": "-31.017", "long": "123.167" },
{ "size": "Small", "icao": "YPUN", "iata": "", "city": "", "name": "Punmu Airport", "runway": "", "lat": "-22.067", "long": "123.167" },
{ "size": "Small", "icao": "YBWS", "iata": "", "city": "", "name": "Browse Is Airport", "runway": "", "lat": "-14.112", "long": "123.547" },
{ "size": "Small", "icao": "YZAN", "iata": "", "city": "", "name": "Zanthus Airport", "runway": "", "lat": "-31.033", "long": "123.567" },
{ "size": "Small", "icao": "YCTI", "iata": "", "city": "", "name": "Cockatoo Island Airport", "runway": "", "lat": "-16.083", "long": "123.617" },
{ "size": "Small", "icao": "YBAL", "iata": "", "city": "", "name": "Balladonia Airport", "runway": "", "lat": "-32.35", "long": "123.618" },
{ "size": "Medium", "icao": "YDBY", "iata": "DRB", "city": "", "name": "DERBY", "runway": "5696 ft", "lat": "-17.37", "long": "123.661" },
{ "size": "Small", "icao": "YNON", "iata": "", "city": "", "name": "Noondoonia Homestead Airport", "runway": "", "lat": "-32.283", "long": "123.667" },
{ "size": "Small", "icao": "YYRN", "iata": "", "city": "", "name": "Yamarna Airport", "runway": "", "lat": "-28.154", "long": "123.673" },
{ "size": "Medium", "icao": "YCIN", "iata": "DCN", "city": "", "name": "CURTIN", "runway": "10003 ft", "lat": "-17.581", "long": "123.828" },
{ "size": "Small", "icao": "YWOX", "iata": "", "city": "", "name": "Woorlba Airport", "runway": "", "lat": "-32.4", "long": "124.033" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Tjukayirla Roadhouse Airstrip", "runway": "", "lat": "-27.155", "long": "124.585" },
{ "size": "Small", "icao": "YWEX", "iata": "", "city": "", "name": "Well 33 Airport", "runway": "", "lat": "-22.367", "long": "124.767" },
{ "size": "Small", "icao": "YNKA", "iata": "", "city": "", "name": "Noonkanbah Airport", "runway": "", "lat": "-18.5", "long": "124.833" },
{ "size": "Small", "icao": "YNPD", "iata": "", "city": "", "name": "Napier Downs Airport", "runway": "", "lat": "-17.317", "long": "124.85" },
{ "size": "Small", "icao": "YKAN", "iata": "", "city": "", "name": "Kanandah Airport", "runway": "", "lat": "-30.895", "long": "124.862" },
{ "size": "Small", "icao": "YMHT", "iata": "", "city": "", "name": "Mount Hart Station Airport", "runway": "", "lat": "-16.82", "long": "124.908" },
{ "size": "Small", "icao": "YWDJ", "iata": "", "city": "", "name": "Windjana Grove Airport", "runway": "", "lat": "-17.421", "long": "124.925" },
{ "size": "Small", "icao": "YDPT", "iata": "", "city": "", "name": "Depot Outcamp Airport", "runway": "", "lat": "-31.572", "long": "125.187" },
{ "size": "Small", "icao": "YRWA", "iata": "", "city": "", "name": "Rawlinna Station Airport", "runway": "", "lat": "-31.025", "long": "125.191" },
{ "size": "Small", "icao": "YSLG", "iata": "", "city": "", "name": "Silent Grove Airport", "runway": "", "lat": "-17.067", "long": "125.25" },
{ "size": "Small", "icao": "YRAW", "iata": "", "city": "", "name": "Rawlinna Airport", "runway": "", "lat": "-31", "long": "125.317" },
{ "size": "Small", "icao": "YWFD", "iata": "", "city": "", "name": "Western Field Airport", "runway": "", "lat": "-19.283", "long": "125.417" },
{ "size": "Small", "icao": "YBYS", "iata": "BVZ", "city": "", "name": "Beverley Springs Airport", "runway": "3000 ft", "lat": "-16.733", "long": "125.433" },
{ "size": "Small", "icao": "YTJI", "iata": "", "city": "", "name": "Tjirrkarli Airport", "runway": "", "lat": "-26.035", "long": "125.472" },
{ "size": "Small", "icao": "YCAG", "iata": "CGV", "city": "", "name": "Caiguna Airport", "runway": "", "lat": "-32.265", "long": "125.493" },
{ "size": "Small", "icao": "", "iata": "CBC", "city": "", "name": "Cherrabun Airport", "runway": "", "lat": "-18.918", "long": "125.538" },
{ "size": "Medium", "icao": "YFTZ", "iata": "FIZ", "city": "", "name": "FITZROY CROSSING", "runway": "4265 ft", "lat": "-18.182", "long": "125.559" },
{ "size": "Small", "icao": "YBGI", "iata": "", "city": "", "name": "Balgair Airport", "runway": "", "lat": "-31.067", "long": "125.667" },
{ "size": "Small", "icao": "YMHO", "iata": "MHO", "city": "", "name": "Mount House Airport", "runway": "3000 ft", "lat": "-17.055", "long": "125.71" },
{ "size": "Small", "icao": "YCAJ", "iata": "", "city": "", "name": "Cadjebut Airport", "runway": "", "lat": "-18.7", "long": "125.9" },
{ "size": "Small", "icao": "YBAN", "iata": "", "city": "", "name": "Mount Barnet Airport", "runway": "", "lat": "-16.737", "long": "125.909" },
{ "size": "Small", "icao": "YCRK", "iata": "CXQ", "city": "", "name": "Christmas Creek Station Airport", "runway": "", "lat": "-18.883", "long": "125.917" },
{ "size": "Small", "icao": "YADD", "iata": "", "city": "", "name": "Arubiddy Airport", "runway": "", "lat": "-31.8", "long": "125.933" },
{ "size": "Small", "icao": "YHAG", "iata": "", "city": "", "name": "Haig Airport", "runway": "", "lat": "-31", "long": "126.083" },
{ "size": "Small", "icao": "YCKY", "iata": "", "city": "", "name": "Cocklebiddy Airport", "runway": "", "lat": "-32.05", "long": "126.092" },
{ "size": "Small", "icao": "YMTZ", "iata": "", "city": "", "name": "Mount Elizabeth Airport", "runway": "", "lat": "-16.433", "long": "126.1" },
{ "size": "Small", "icao": "YTTI", "iata": "", "city": "", "name": "Troughton Is Airport", "runway": "3000 ft", "lat": "-13.752", "long": "126.148" },
{ "size": "Small", "icao": "YMNT", "iata": "", "city": "", "name": "Mornington Station Airport", "runway": "", "lat": "-17.394", "long": "126.229" },
{ "size": "Small", "icao": "YDGN", "iata": "", "city": "", "name": "Doongan Airport", "runway": "", "lat": "-15.4", "long": "126.3" },
{ "size": "Small", "icao": "YTST", "iata": "", "city": "", "name": "TRUSCOTT MUNGALALU", "runway": "5643 ft", "lat": "-14.09", "long": "126.381" },
{ "size": "Small", "icao": "YDRD", "iata": "DRY", "city": "", "name": "Drysdale River Airport", "runway": "", "lat": "-15.714", "long": "126.381" },
{ "size": "Small", "icao": "YGIB", "iata": "GBV", "city": "", "name": "Gibb River Airport", "runway": "3000 ft", "lat": "-16.423", "long": "126.445" },
{ "size": "Small", "icao": "YWBR", "iata": "", "city": "", "name": "WARBURTON", "runway": "5216 ft", "lat": "-26.128", "long": "126.583" },
{ "size": "Small", "icao": "YORA", "iata": "", "city": "", "name": "Moonerah Airport", "runway": "", "lat": "-31.689", "long": "126.586" },
{ "size": "Small", "icao": "YKAL", "iata": "UBU", "city": "", "name": "Kalumburu Airport", "runway": "4200 ft", "lat": "-14.288", "long": "126.632" },
{ "size": "Small", "icao": "YLOU", "iata": "", "city": "", "name": "Louisa Downs Airport", "runway": "", "lat": "-18.717", "long": "126.717" },
{ "size": "Small", "icao": "YMGR", "iata": "MGV", "city": "", "name": "Margaret River (Station) Airport", "runway": "3000 ft", "lat": "-18.622", "long": "126.883" },
{ "size": "Small", "icao": "YTAB", "iata": "TBL", "city": "", "name": "Tableland Homestead Airport", "runway": "", "lat": "-17.283", "long": "126.9" },
{ "size": "Small", "icao": "YLGN", "iata": "", "city": "", "name": "Loongana Airport", "runway": "", "lat": "-30.95", "long": "127.033" },
{ "size": "Small", "icao": "YMAD", "iata": "", "city": "", "name": "Madura Airport", "runway": "", "lat": "-31.883", "long": "127.033" },
{ "size": "Small", "icao": "YTJU", "iata": "", "city": "", "name": "Tjuntjuntjarra Airport", "runway": "", "lat": "-29.358", "long": "127.128" },
{ "size": "Small", "icao": "YFWY", "iata": "", "city": "", "name": "Faraway Bay Airport", "runway": "", "lat": "-13.981", "long": "127.181" },
{ "size": "Small", "icao": "YBDF", "iata": "BDW", "city": "", "name": "Bedford Downs Airport", "runway": "", "lat": "-17.287", "long": "127.463" },
{ "size": "Small", "icao": "YBIL", "iata": "BIW", "city": "", "name": "Billiluna Airport", "runway": "", "lat": "-19.567", "long": "127.667" },
{ "size": "Medium", "icao": "YHLC", "iata": "HCQ", "city": "", "name": "HALLS CREEK", "runway": "4839 ft", "lat": "-18.234", "long": "127.67" },
{ "size": "Small", "icao": "YJAM", "iata": "", "city": "", "name": "Jameson Airport", "runway": "", "lat": "-25.85", "long": "127.683" },
{ "size": "Small", "icao": "YYGG", "iata": "", "city": "", "name": "Yagga Yagga Airport", "runway": "", "lat": "-20.891", "long": "127.949" },
{ "size": "Small", "icao": "YBGO", "iata": "BQW", "city": "", "name": "Balgo Hill Airport", "runway": "5200 ft", "lat": "-20.148", "long": "127.973" },
{ "size": "Small", "icao": "YEQO", "iata": "", "city": "", "name": "El Questro Airport", "runway": "", "lat": "-16.008", "long": "127.975" },
{ "size": "Small", "icao": "YYAG", "iata": "", "city": "", "name": "Yagga Yagga Airport", "runway": "", "lat": "-20.967", "long": "128.083" },
{ "size": "Medium", "icao": "YFRT", "iata": "FOS", "city": "", "name": "FORREST", "runway": "4984 ft", "lat": "-30.838", "long": "128.115" },
{ "size": "Small", "icao": "YWYM", "iata": "WYN", "city": "", "name": "WYNDHAM", "runway": "5272 ft", "lat": "-15.511", "long": "128.153" },
{ "size": "Small", "icao": "YMDT", "iata": "", "city": "", "name": "Mundrabilla Motel Airport", "runway": "", "lat": "-31.827", "long": "128.23" },
{ "size": "Small", "icao": "YBSR", "iata": "", "city": "", "name": "Blackstone Airport", "runway": "", "lat": "-25.987", "long": "128.288" },
{ "size": "Small", "icao": "YFLO", "iata": "FVL", "city": "", "name": "Flora Valley Airport", "runway": "", "lat": "-18.283", "long": "128.417" },
{ "size": "Small", "icao": "YARG", "iata": "GYL", "city": "", "name": "ARGYLE", "runway": "7546 ft", "lat": "-16.637", "long": "128.451" },
{ "size": "Small", "icao": "YRSK", "iata": "", "city": "", "name": "Ringer Soak Airport", "runway": "", "lat": "-18.789", "long": "128.624" },
{ "size": "Small", "icao": "YJUK", "iata": "", "city": "", "name": "Tjukurla Airport", "runway": "", "lat": "-24.371", "long": "128.739" },
{ "size": "Small", "icao": "YECL", "iata": "EUC", "city": "", "name": "Eucla Airport", "runway": "", "lat": "-31.7", "long": "128.883" },
{ "size": "Small", "icao": "YNIC", "iata": "NLS", "city": "", "name": "Nicholson Airport", "runway": "", "lat": "-18.05", "long": "128.9" },
{ "size": "Small", "icao": "YWNL", "iata": "", "city": "", "name": "Wingellina Airport", "runway": "", "lat": "-26.067", "long": "128.95" },
{ "size": "Small", "icao": "YDVR", "iata": "DKV", "city": "", "name": "Docker River Airport", "runway": "3000 ft", "lat": "-24.86", "long": "129.07" },
{ "size": "Small", "icao": "YWCM", "iata": "", "city": "", "name": "Wilson's Camp Airport", "runway": "", "lat": "-20.101", "long": "129.126" },
{ "size": "Small", "icao": "YMDV", "iata": "", "city": "", "name": "Mount Davies Airport", "runway": "", "lat": "-26.167", "long": "129.133" },
{ "size": "Small", "icao": "YNES", "iata": "", "city": "", "name": "Nelson Springs Airport", "runway": "", "lat": "-17.3", "long": "129.283" },
{ "size": "Small", "icao": "YWTL", "iata": "WLO", "city": "", "name": "Waterloo Airport", "runway": "", "lat": "-16.63", "long": "129.32" },
{ "size": "Small", "icao": "YKNT", "iata": "", "city": "", "name": "Kintore Airport", "runway": "", "lat": "-23.265", "long": "129.387" },
{ "size": "Small", "icao": "YLGU", "iata": "", "city": "", "name": "Legune Airport", "runway": "", "lat": "-15.217", "long": "129.448" },
{ "size": "Small", "icao": "YBDU", "iata": "", "city": "", "name": "Birrindudu Airport", "runway": "", "lat": "-18.383", "long": "129.483" },
{ "size": "Small", "icao": "YHGS", "iata": "", "city": "", "name": "Hughes Siding Airport", "runway": "", "lat": "-30.717", "long": "129.515" },
{ "size": "Medium", "icao": "YPKT", "iata": "PKT", "city": "", "name": "PORT KEATS", "runway": "4626 ft", "lat": "-14.25", "long": "129.529" },
{ "size": "Small", "icao": "YKIL", "iata": "", "city": "", "name": "Kildurk Airport", "runway": "", "lat": "-16.432", "long": "129.615" },
{ "size": "Small", "icao": "YTMN", "iata": "", "city": "", "name": "Tanami Airport", "runway": "3000 ft", "lat": "-19.917", "long": "129.725" },
{ "size": "Small", "icao": "YTAN", "iata": "", "city": "", "name": "Tanami Downs Airport", "runway": "", "lat": "-20.574", "long": "129.74" },
{ "size": "Small", "icao": "YBVY", "iata": "", "city": "", "name": "Bullo River Valley Airport", "runway": "", "lat": "-15.467", "long": "129.767" },
{ "size": "Small", "icao": "YPUA", "iata": "", "city": "", "name": "Palumpa Airport", "runway": "", "lat": "-14.333", "long": "129.867" },
{ "size": "Small", "icao": "YLIM", "iata": "", "city": "", "name": "Limbunya Station Airport", "runway": "", "lat": "-17.25", "long": "129.883" },
{ "size": "Small", "icao": "YLSY", "iata": "", "city": "", "name": "Mount Lindsay Airport", "runway": "", "lat": "-27.018", "long": "129.885" },
{ "size": "Small", "icao": "YSUJ", "iata": "", "city": "", "name": "Supplejack Downs Airport", "runway": "", "lat": "-19.267", "long": "129.95" },
{ "size": "Small", "icao": "YAUV", "iata": "AVG", "city": "", "name": "Auvergne Airport", "runway": "", "lat": "-15.7", "long": "130" },
{ "size": "Small", "icao": "YRBT", "iata": "", "city": "", "name": "Rabbit Flat Airport", "runway": "", "lat": "-20.183", "long": "130.017" },
{ "size": "Small", "icao": "YRVE", "iata": "", "city": "", "name": "Riveren Airport", "runway": "", "lat": "-17.9", "long": "130.217" },
{ "size": "Small", "icao": "YNYP", "iata": "", "city": "", "name": "Nypari Airport", "runway": "", "lat": "-26.2", "long": "130.233" },
{ "size": "Small", "icao": "YTGT", "iata": "", "city": "", "name": "The Granites Airport", "runway": "", "lat": "-20.548", "long": "130.347" },
{ "size": "Small", "icao": "YANJ", "iata": "", "city": "", "name": "Angatja Airport", "runway": "", "lat": "-26.1", "long": "130.4" },
{ "size": "Small", "icao": "YOOK", "iata": "", "city": "", "name": "Cook Airport", "runway": "", "lat": "-30.618", "long": "130.406" },
{ "size": "Medium", "icao": "YGPT", "iata": "GPN", "city": "", "name": "GARDEN POINT", "runway": "4314 ft", "lat": "-11.402", "long": "130.422" },
{ "size": "Small", "icao": "YTBR", "iata": "TBK", "city": "", "name": "Timber Creek Airport", "runway": "3000 ft", "lat": "-15.62", "long": "130.445" },
{ "size": "Small", "icao": "YMSF", "iata": "MTD", "city": "", "name": "Mount Sanford Station Airport", "runway": "", "lat": "-16.978", "long": "130.555" },
{ "size": "Small", "icao": "YNRR", "iata": "", "city": "", "name": "Nyrripi Airport", "runway": "", "lat": "-22.645", "long": "130.565" },
{ "size": "Medium", "icao": "YBTI", "iata": "BRT", "city": "", "name": "BATHURST ISLAND", "runway": "4823 ft", "lat": "-11.769", "long": "130.62" },
{ "size": "Small", "icao": "YHBR", "iata": "HUB", "city": "", "name": "Humbert River Airport", "runway": "", "lat": "-16.49", "long": "130.63" },
{ "size": "Small", "icao": "YHOO", "iata": "HOK", "city": "", "name": "Hooker Creek Airport", "runway": "5100 ft", "lat": "-18.337", "long": "130.638" },
{ "size": "Medium", "icao": "YSNB", "iata": "SNB", "city": "", "name": "SNAKE BAY", "runway": "4734 ft", "lat": "-11.423", "long": "130.654" },
{ "size": "Small", "icao": "YDLV", "iata": "DLV", "city": "", "name": "Delissaville Airport", "runway": "2800 ft", "lat": "-12.55", "long": "130.685" },
{ "size": "Small", "icao": "YDMN", "iata": "DVR", "city": "", "name": "Daly River Airport", "runway": "", "lat": "-13.75", "long": "130.694" },
{ "size": "Small", "icao": "YKKG", "iata": "KFG", "city": "", "name": "KALKGURUNG", "runway": "4101 ft", "lat": "-17.432", "long": "130.808" },
{ "size": "Small", "icao": "YOKV", "iata": "", "city": "", "name": "Oak Valley Airport", "runway": "", "lat": "-29.517", "long": "130.867" },
{ "size": "Small", "icao": "YVNS", "iata": "", "city": "", "name": "Vaughan Springs Airport", "runway": "", "lat": "-22.333", "long": "130.867" },
{ "size": "Small", "icao": "YAAL", "iata": "", "city": "", "name": "Yarralin Airport", "runway": "", "lat": "-16.445", "long": "130.881" },
{ "size": "Small", "icao": "YNUB", "iata": "NUR", "city": "", "name": "Nullabor Motel Airport", "runway": "3000 ft", "lat": "-31.442", "long": "130.902" },
{ "size": "Small", "icao": "YPME", "iata": "", "city": "", "name": "Palmer Airport", "runway": "", "lat": "-12.833", "long": "130.933" },
{ "size": "Small", "icao": "YKDM", "iata": "", "city": "", "name": "Kidman Springs Airport", "runway": "3000 ft", "lat": "-16.117", "long": "130.953" },
{ "size": "Small", "icao": "YVRD", "iata": "VCD", "city": "", "name": "Victoria River Downs Airport", "runway": "3000 ft", "lat": "-16.402", "long": "131.005" },
{ "size": "Small", "icao": "YBCR", "iata": "", "city": "", "name": "Batchelor Airport", "runway": "", "lat": "-13.067", "long": "131.033" },
{ "size": "Small", "icao": "YMKT", "iata": "", "city": "", "name": "Emkaytee (Unlic) Airport", "runway": "", "lat": "-12.617", "long": "131.05" },
{ "size": "Small", "icao": "YWAV", "iata": "WAV", "city": "", "name": "Wave Hill Airport", "runway": "3000 ft", "lat": "-17.393", "long": "131.118" },
{ "size": "Small", "icao": "YNHV", "iata": "", "city": "", "name": "New Haven Airport", "runway": "", "lat": "-22.728", "long": "131.145" },
{ "size": "Small", "icao": "YAMT", "iata": "AMT", "city": "", "name": "Amata Airport", "runway": "", "lat": "-26.108", "long": "131.207" },
{ "size": "Small", "icao": "YPGH", "iata": "", "city": "", "name": "Pigeon Hole Airport", "runway": "", "lat": "-16.81", "long": "131.219" },
{ "size": "Small", "icao": "YLBG", "iata": "", "city": "", "name": "Mount Liebig Airport", "runway": "", "lat": "-23.243", "long": "131.26" },
{ "size": "Small", "icao": "YISV", "iata": "", "city": "", "name": "Innesvale Airport", "runway": "", "lat": "-15.383", "long": "131.267" },
{ "size": "Small", "icao": "YCFD", "iata": "CFI", "city": "", "name": "Camfield Airport", "runway": "", "lat": "-17.022", "long": "131.327" },
{ "size": "Small", "icao": "YKCA", "iata": "", "city": "", "name": "Kings Canyon Airport", "runway": "", "lat": "-24.26", "long": "131.49" },
{ "size": "Small", "icao": "YOOO", "iata": "", "city": "", "name": "Mooloola Homestead Airport", "runway": "", "lat": "-16.333", "long": "131.5" },
{ "size": "Small", "icao": "YMEI", "iata": "", "city": "", "name": "Mereenie Airport", "runway": "", "lat": "-23.977", "long": "131.562" },
{ "size": "Small", "icao": "YMRA", "iata": "", "city": "", "name": "Maralinga Airport", "runway": "", "lat": "-30.163", "long": "131.625" },
{ "size": "Small", "icao": "YDMR", "iata": "", "city": "", "name": "Delamere Station Airport", "runway": "", "lat": "-15.62", "long": "131.637" },
{ "size": "Small", "icao": "YMUP", "iata": "", "city": "", "name": "Mulga Park Airport", "runway": "", "lat": "-25.9", "long": "131.667" },
{ "size": "Small", "icao": "YKLE", "iata": "", "city": "", "name": "Killarney Airport", "runway": "", "lat": "-16.25", "long": "131.747" },
{ "size": "Small", "icao": "YCSP", "iata": "", "city": "", "name": "Curtin Springs Airport", "runway": "", "lat": "-25.317", "long": "131.75" },
{ "size": "Small", "icao": "YYND", "iata": "YUE", "city": "", "name": "YUENDUMU", "runway": "4724 ft", "lat": "-22.254", "long": "131.782" },
{ "size": "Small", "icao": "YODA", "iata": "", "city": "", "name": "Ooldea Airport", "runway": "", "lat": "-30.457", "long": "131.823" },
{ "size": "Small", "icao": "YCPD", "iata": "", "city": "", "name": "Cape Don Airport", "runway": "", "lat": "-11.298", "long": "131.827" },
{ "size": "Small", "icao": "YPNC", "iata": "", "city": "", "name": "Pine Creek Airport", "runway": "", "lat": "-13.833", "long": "131.833" },
{ "size": "Small", "icao": "YKCS", "iata": "KCS", "city": "", "name": "Kings Creek Airport", "runway": "3000 ft", "lat": "-24.423", "long": "131.835" },
{ "size": "Small", "icao": "YHAA", "iata": "", "city": "", "name": "Haasts Bluff Airport", "runway": "3000 ft", "lat": "-23.455", "long": "131.853" },
{ "size": "Small", "icao": "YSAI", "iata": "", "city": "", "name": "Saipem Airport", "runway": "", "lat": "-23.7", "long": "131.867" },
{ "size": "Small", "icao": "YPAY", "iata": "", "city": "", "name": "Papunya Airport", "runway": "3000 ft", "lat": "-23.247", "long": "131.903" },
{ "size": "Small", "icao": "YMDY", "iata": "", "city": "", "name": "MOUNT BUNDEY", "runway": "3970 ft", "lat": "-12.89", "long": "131.908" },
{ "size": "Small", "icao": "YDWF", "iata": "", "city": "", "name": "Delamere Range Facility Airport", "runway": "", "lat": "-15.747", "long": "131.92" },
{ "size": "Small", "icao": "YVSH", "iata": "", "city": "", "name": "Vashon Head Airport", "runway": "", "lat": "-11.15", "long": "131.983" },
{ "size": "Small", "icao": "YFRG", "iata": "", "city": "", "name": "Fregon Airport", "runway": "3000 ft", "lat": "-26.775", "long": "132.017" },
{ "size": "Small", "icao": "YUMU", "iata": "", "city": "", "name": "Umuwa Airport", "runway": "", "lat": "-26.487", "long": "132.04" },
{ "size": "Small", "icao": "YMNN", "iata": "", "city": "", "name": "Mount Denison Airport", "runway": "", "lat": "-22.142", "long": "132.07" },
{ "size": "Small", "icao": "YSMP", "iata": "SHU", "city": "", "name": "Smith Point Airport", "runway": "", "lat": "-11.15", "long": "132.15" },
{ "size": "Small", "icao": "YMWE", "iata": "", "city": "", "name": "Mount Wedge Airport", "runway": "", "lat": "-22.737", "long": "132.151" },
{ "size": "Small", "icao": "YERN", "iata": "ERB", "city": "", "name": "Ernabella Airport", "runway": "3800 ft", "lat": "-26.263", "long": "132.182" },
{ "size": "Small", "icao": "YEMJ", "iata": "", "city": "", "name": "Emu Junction Airport", "runway": "", "lat": "-28.633", "long": "132.183" },
{ "size": "Small", "icao": "YMNA", "iata": "", "city": "", "name": "Mount Allan Airport", "runway": "", "lat": "-22.275", "long": "132.217" },
{ "size": "Small", "icao": "YNDR", "iata": "", "city": "", "name": "Nundroo Airport", "runway": "", "lat": "-31.78", "long": "132.223" },
{ "size": "Small", "icao": "YARN", "iata": "", "city": "", "name": "Areyonga Airport", "runway": "", "lat": "-24.067", "long": "132.267" },
{ "size": "Small", "icao": "YWLH", "iata": "", "city": "", "name": "Wallara Ranch Airport", "runway": "", "lat": "-24.65", "long": "132.317" },
{ "size": "Small", "icao": "YKHG", "iata": "", "city": "", "name": "Katherine Gorge Airport", "runway": "", "lat": "-14.389", "long": "132.393" },
{ "size": "Small", "icao": "YTPE", "iata": "", "city": "", "name": "Tempe Downs Airport", "runway": "", "lat": "-24.382", "long": "132.423" },
{ "size": "Small", "icao": "YKEN", "iata": "", "city": "", "name": "Kenmore Park Airport", "runway": "", "lat": "-26.333", "long": "132.467" },
{ "size": "Small", "icao": "YCKI", "iata": "CKI", "city": "", "name": "Croker Island Airport", "runway": "4700 ft", "lat": "-11.165", "long": "132.483" },
{ "size": "Small", "icao": "YCOO", "iata": "CDA", "city": "", "name": "Cooinda Airport", "runway": "3000 ft", "lat": "-12.903", "long": "132.532" },
{ "size": "Small", "icao": "YCNS", "iata": "", "city": "", "name": "Coniston Airport", "runway": "", "lat": "-22.133", "long": "132.533" },
{ "size": "Small", "icao": "YMIJ", "iata": "", "city": "", "name": "Minjilang Airport", "runway": "3500 ft", "lat": "-11.158", "long": "132.547" },
{ "size": "Small", "icao": "YIMA", "iata": "", "city": "", "name": "Imanpa Airport", "runway": "", "lat": "-25.133", "long": "132.57" },
{ "size": "Small", "icao": "YWLA", "iata": "", "city": "", "name": "Willowra Airport", "runway": "", "lat": "-21.277", "long": "132.623" },
{ "size": "Small", "icao": "YMBZ", "iata": "", "city": "", "name": "Mount Ebenezer Airport", "runway": "", "lat": "-25.167", "long": "132.633" },
{ "size": "Small", "icao": "YNWT", "iata": "", "city": "", "name": "Narwietooma Airport", "runway": "", "lat": "-23.233", "long": "132.633" },
{ "size": "Small", "icao": "YBTN", "iata": "", "city": "", "name": "Barton Siding Airport", "runway": "", "lat": "-30.525", "long": "132.66" },
{ "size": "Small", "icao": "YEVP", "iata": "", "city": "", "name": "Everard Park Airport", "runway": "", "lat": "-27.017", "long": "132.717" },
{ "size": "Small", "icao": "YHMB", "iata": "HMG", "city": "", "name": "Hermannsburg Airport", "runway": "3000 ft", "lat": "-23.93", "long": "132.805" },
{ "size": "Small", "icao": "YBMY", "iata": "", "city": "", "name": "Bamyili Airport", "runway": "2600 ft", "lat": "-14.52", "long": "132.883" },
{ "size": "Small", "icao": "YJAB", "iata": "JAB", "city": "", "name": "JABIRU", "runway": "4670 ft", "lat": "-12.658", "long": "132.893" },
{ "size": "Small", "icao": "YMUE", "iata": "", "city": "", "name": "Mount Borradale Airport", "runway": "", "lat": "-12.098", "long": "132.907" },
{ "size": "Small", "icao": "YCAN", "iata": "", "city": "", "name": "Cannon Hill Community Airport", "runway": "", "lat": "-12.367", "long": "132.95" },
{ "size": "Small", "icao": "YMPK", "iata": "", "city": "", "name": "Milton Park Airport", "runway": "", "lat": "-23.367", "long": "133" },
{ "size": "Small", "icao": "YPNG", "iata": "", "city": "", "name": "Penong Airport", "runway": "", "lat": "-31.917", "long": "133" },
{ "size": "Small", "icao": "YOEN", "iata": "OPI", "city": "", "name": "OENPELLI", "runway": "4331 ft", "lat": "-12.325", "long": "133.006" },
{ "size": "Small", "icao": "YANN", "iata": "", "city": "", "name": "Anningie Airport", "runway": "", "lat": "-21.832", "long": "133.125" },
{ "size": "Small", "icao": "YMKA", "iata": "", "city": "", "name": "Mararanka Homestead Airport", "runway": "", "lat": "-14.932", "long": "133.125" },
{ "size": "Small", "icao": "YABU", "iata": "", "city": "", "name": "Amburla Airport", "runway": "", "lat": "-23.333", "long": "133.183" },
{ "size": "Small", "icao": "YMVG", "iata": "", "city": "", "name": "Mount Cavenagh Airport", "runway": "", "lat": "-25.967", "long": "133.2" },
{ "size": "Small", "icao": "YHBY", "iata": "", "city": "", "name": "Henbury Airport", "runway": "", "lat": "-24.55", "long": "133.217" },
{ "size": "Small", "icao": "YERL", "iata": "", "city": "", "name": "Erldunda Airport", "runway": "", "lat": "-25.217", "long": "133.25" },
{ "size": "Small", "icao": "YDRL", "iata": "", "city": "", "name": "De Rose Hill Airport", "runway": "", "lat": "-26.433", "long": "133.258" },
{ "size": "Small", "icao": "YMIB", "iata": "", "city": "", "name": "Mintabie Airport", "runway": "", "lat": "-27.328", "long": "133.305" },
{ "size": "Small", "icao": "YNAB", "iata": "", "city": "", "name": "Nabarlek Airport", "runway": "", "lat": "-12.308", "long": "133.313" },
{ "size": "Small", "icao": "YIDK", "iata": "IDK", "city": "", "name": "Indulkana Airport", "runway": "3000 ft", "lat": "-26.967", "long": "133.325" },
{ "size": "Small", "icao": "YLLA", "iata": "", "city": "", "name": "Mobella Airport", "runway": "", "lat": "-29.798", "long": "133.345" },
{ "size": "Small", "icao": "YTCY", "iata": "", "city": "", "name": "Tarcoonyinna Airport", "runway": "", "lat": "-26.75", "long": "133.35" },
{ "size": "Small", "icao": "YGBI", "iata": "GBL", "city": "", "name": "South Goulburn Is Airport", "runway": "4500 ft", "lat": "-11.65", "long": "133.382" },
{ "size": "Small", "icao": "YTIT", "iata": "", "city": "", "name": "Ti Tree Airport", "runway": "", "lat": "-22.132", "long": "133.42" },
{ "size": "Small", "icao": "YWYB", "iata": "", "city": "", "name": "Wynbring Airport", "runway": "", "lat": "-30.562", "long": "133.533" },
{ "size": "Small", "icao": "YIMP", "iata": "", "city": "", "name": "Impadna Airport", "runway": "", "lat": "-25.15", "long": "133.583" },
{ "size": "Small", "icao": "YGDW", "iata": "GTS", "city": "", "name": "Granite Downs Airport", "runway": "", "lat": "-26.948", "long": "133.607" },
{ "size": "Small", "icao": "YALA", "iata": "MRP", "city": "", "name": "Marla Airport", "runway": "3000 ft", "lat": "-27.333", "long": "133.627" },
{ "size": "Small", "icao": "YGMD", "iata": "", "city": "", "name": "Goomadeer Airport", "runway": "", "lat": "-12.1", "long": "133.667" },
{ "size": "Small", "icao": "YHGR", "iata": "", "city": "", "name": "Hugh River Airport", "runway": "", "lat": "-24.417", "long": "133.7" },
{ "size": "Small", "icao": "YUMB", "iata": "", "city": "", "name": "Umbeara Airport", "runway": "", "lat": "-25.747", "long": "133.702" },
{ "size": "Medium", "icao": "YCDU", "iata": "CED", "city": "", "name": "CEDUNA", "runway": "5709 ft", "lat": "-32.131", "long": "133.71" },
{ "size": "Small", "icao": "YIDR", "iata": "", "city": "", "name": "Idracowra Airport", "runway": "", "lat": "-25.063", "long": "133.733" },
{ "size": "Small", "icao": "YNPB", "iata": "", "city": "", "name": "Napperby Airport", "runway": "", "lat": "-22.533", "long": "133.763" },
{ "size": "Small", "icao": "YMVY", "iata": "", "city": "", "name": "Mount Valley Airport", "runway": "", "lat": "-14.083", "long": "133.817" },
{ "size": "Small", "icao": "YBSP", "iata": "", "city": "", "name": "Bond Springs Airport", "runway": "", "lat": "-23.515", "long": "133.843" },
{ "size": "Small", "icao": "YBRC", "iata": "", "city": "", "name": "Barrow Creek Airport", "runway": "", "lat": "-21.533", "long": "133.883" },
{ "size": "Small", "icao": "YTYN", "iata": "", "city": "", "name": "Tieyon Airport", "runway": "", "lat": "-26.217", "long": "133.917" },
{ "size": "Small", "icao": "YMGG", "iata": "", "city": "", "name": "Mulgathing Airport", "runway": "", "lat": "-30.229", "long": "133.986" },
{ "size": "Small", "icao": "YLLC", "iata": "", "city": "", "name": "Lilla Creek Airport", "runway": "", "lat": "-25.567", "long": "134" },
{ "size": "Small", "icao": "YMYV", "iata": "", "city": "", "name": "Maryvale Airport", "runway": "", "lat": "-24.66", "long": "134.032" },
{ "size": "Small", "icao": "YCDH", "iata": "", "city": "", "name": "Cadney Homestead Airport", "runway": "", "lat": "-27.908", "long": "134.053" },
{ "size": "Small", "icao": "YLAM", "iata": "", "city": "", "name": "Lambina Airport", "runway": "", "lat": "-26.913", "long": "134.058" },
{ "size": "Small", "icao": "YHDD", "iata": "", "city": "", "name": "Hodgson Downs Airport", "runway": "", "lat": "-15.222", "long": "134.076" },
{ "size": "Small", "icao": "YWLB", "iata": "", "city": "", "name": "Welbourn Hill Airport", "runway": "", "lat": "-27.358", "long": "134.093" },
{ "size": "Small", "icao": "YMSK", "iata": "", "city": "", "name": "Mount Skinner Airport", "runway": "", "lat": "-22.183", "long": "134.117" },
{ "size": "Small", "icao": "YDPW", "iata": "", "city": "", "name": "Deep Well Airport", "runway": "", "lat": "-24.3", "long": "134.133" },
{ "size": "Small", "icao": "YCWH", "iata": "", "city": "", "name": "Commonwealth Hill Airport", "runway": "", "lat": "-29.962", "long": "134.143" },
{ "size": "Small", "icao": "YNUT", "iata": "", "city": "", "name": "Nutwood Downs Airport", "runway": "", "lat": "-15.817", "long": "134.15" },
{ "size": "Small", "icao": "YWIB", "iata": "", "city": "", "name": "Mount Willoughby Airport", "runway": "", "lat": "-27.983", "long": "134.15" },
{ "size": "Small", "icao": "YHSB", "iata": "", "city": "", "name": "Horseshoe Bend Airport", "runway": "", "lat": "-25.217", "long": "134.267" },
{ "size": "Small", "icao": "YKBY", "iata": "KBY", "city": "", "name": "STREAKY BAY", "runway": "4432 ft", "lat": "-32.836", "long": "134.293" },
{ "size": "Small", "icao": "YCPH", "iata": "", "city": "", "name": "Copper Hills Airport", "runway": "", "lat": "-27.978", "long": "134.317" },
{ "size": "Small", "icao": "YMAK", "iata": "", "city": "", "name": "Mabel Creek Station Airport", "runway": "", "lat": "-28.942", "long": "134.333" },
{ "size": "Small", "icao": "YMTC", "iata": "", "city": "", "name": "Mount Clarence Airport", "runway": "", "lat": "-28.833", "long": "134.358" },
{ "size": "Small", "icao": "YMAI", "iata": "", "city": "", "name": "Manguri Airport", "runway": "", "lat": "-28.98", "long": "134.372" },
{ "size": "Small", "icao": "YSTT", "iata": "", "city": "", "name": "Santa Teresa Airport", "runway": "", "lat": "-24.118", "long": "134.39" },
{ "size": "Small", "icao": "YWBI", "iata": "", "city": "", "name": "Warrabri Airport", "runway": "3000 ft", "lat": "-21", "long": "134.397" },
{ "size": "Small", "icao": "YALM", "iata": "", "city": "", "name": "Allambie Airport", "runway": "", "lat": "-24.267", "long": "134.4" },
{ "size": "Small", "icao": "YGDR", "iata": "", "city": "", "name": "The Garden Airport", "runway": "", "lat": "-23.287", "long": "134.44" },
{ "size": "Small", "icao": "YALC", "iata": "", "city": "", "name": "Alcoota Station Airport", "runway": "", "lat": "-22.833", "long": "134.45" },
{ "size": "Small", "icao": "YBNY", "iata": "", "city": "", "name": "Brunchilly Airport", "runway": "", "lat": "-18.87", "long": "134.462" },
{ "size": "Small", "icao": "YEYD", "iata": "", "city": "", "name": "Evelyn Downs Airport", "runway": "", "lat": "-28.205", "long": "134.488" },
{ "size": "Small", "icao": "YFLS", "iata": "", "city": "", "name": "Flinders Island Airport", "runway": "", "lat": "-33.7", "long": "134.517" },
{ "size": "Small", "icao": "YBDS", "iata": "", "city": "", "name": "Birthday Siding Airport", "runway": "", "lat": "-30.283", "long": "134.517" },
{ "size": "Small", "icao": "YROV", "iata": "", "city": "", "name": "Ross River Airport", "runway": "", "lat": "-23.599", "long": "134.517" },
{ "size": "Small", "icao": "YWSI", "iata": "", "city": "", "name": "Wirrida Siding Airport", "runway": "", "lat": "-29.567", "long": "134.517" },
{ "size": "Small", "icao": "YUPG", "iata": "", "city": "", "name": "Urapunga Airport", "runway": "", "lat": "-14.717", "long": "134.567" },
{ "size": "Small", "icao": "YUTS", "iata": "", "city": "", "name": "Utopia Station Airport", "runway": "", "lat": "-22.233", "long": "134.58" },
{ "size": "Small", "icao": "YTNR", "iata": "", "city": "", "name": "Tanumbirini Airport", "runway": "", "lat": "-16.45", "long": "134.65" },
{ "size": "Small", "icao": "YMDK", "iata": "", "city": "", "name": "Mount Riddock Airport", "runway": "", "lat": "-23.033", "long": "134.683" },
{ "size": "Small", "icao": "YMYW", "iata": "", "city": "", "name": "Murray Downs Airport", "runway": "", "lat": "-21.048", "long": "134.683" },
{ "size": "Medium", "icao": "YCBP", "iata": "CPD", "city": "", "name": "COOBER PEDY", "runway": "4685 ft", "lat": "-29.04", "long": "134.721" },
{ "size": "Small", "icao": "YWNA", "iata": "", "city": "", "name": "Wilgena Airport", "runway": "", "lat": "-30.767", "long": "134.73" },
{ "size": "Small", "icao": "YAKG", "iata": "", "city": "", "name": "Arckaringa Airport", "runway": "", "lat": "-27.947", "long": "134.745" },
{ "size": "Medium", "icao": "YNGU", "iata": "RPM", "city": "", "name": "NGUKURR", "runway": "5020 ft", "lat": "-14.723", "long": "134.748" },
{ "size": "Small", "icao": "YTDM", "iata": "", "city": "", "name": "Todmorden Airport", "runway": "", "lat": "-27.124", "long": "134.77" },
{ "size": "Small", "icao": "YUTP", "iata": "", "city": "", "name": "Utopia Airport", "runway": "", "lat": "-22.055", "long": "134.79" },
{ "size": "Small", "icao": "YIGR", "iata": "", "city": "", "name": "Ingomar Airport", "runway": "", "lat": "-29.633", "long": "134.793" },
{ "size": "Small", "icao": "YCHR", "iata": "", "city": "", "name": "Childra Airport", "runway": "", "lat": "-31.7", "long": "134.833" },
{ "size": "Small", "icao": "YNCS", "iata": "", "city": "", "name": "New Crown Airport", "runway": "", "lat": "-25.667", "long": "134.833" },
{ "size": "Small", "icao": "YKDL", "iata": "", "city": "", "name": "Kondoolka Airport", "runway": "", "lat": "-32.024", "long": "134.861" },
{ "size": "Small", "icao": "YDLD", "iata": "", "city": "", "name": "Delmore Downs Airport", "runway": "", "lat": "-22.459", "long": "134.884" },
{ "size": "Small", "icao": "YRNG", "iata": "RAM", "city": "", "name": "RAMINGINING", "runway": "4825 ft", "lat": "-12.356", "long": "134.898" },
{ "size": "Small", "icao": "YBUL", "iata": "", "city": "", "name": "Bulgunnia Airport", "runway": "", "lat": "-30.187", "long": "134.903" },
{ "size": "Small", "icao": "YHTS", "iata": "", "city": "", "name": "Harts Range Airport", "runway": "", "lat": "-22.985", "long": "134.918" },
{ "size": "Small", "icao": "YRNW", "iata": "", "city": "", "name": "Ringwood Airport", "runway": "", "lat": "-23.828", "long": "134.962" },
{ "size": "Small", "icao": "YMNB", "iata": "", "city": "", "name": "Mount Barry Airport", "runway": "", "lat": "-28.233", "long": "135" },
{ "size": "Small", "icao": "YMNS", "iata": "", "city": "", "name": "Mount Swan Airport", "runway": "", "lat": "-22.6", "long": "135.017" },
{ "size": "Small", "icao": "YLVD", "iata": "", "city": "", "name": "Lake Everard Airport", "runway": "", "lat": "-31.733", "long": "135.027" },
{ "size": "Small", "icao": "YHMT", "iata": "", "city": "", "name": "Hamilton Airport", "runway": "", "lat": "-26.72", "long": "135.073" },
{ "size": "Small", "icao": "YHTA", "iata": "", "city": "", "name": "Hiltaba Airport", "runway": "", "lat": "-32.143", "long": "135.099" },
{ "size": "Small", "icao": "YMPA", "iata": "MIN", "city": "", "name": "Minnipa Airport", "runway": "3000 ft", "lat": "-32.843", "long": "135.145" },
{ "size": "Small", "icao": "YDPR", "iata": "", "city": "", "name": "Dneiper Airport", "runway": "", "lat": "-22.617", "long": "135.2" },
{ "size": "Small", "icao": "YAMJ", "iata": "", "city": "", "name": "Ampilatwatja Airport", "runway": "", "lat": "-21.655", "long": "135.23" },
{ "size": "Small", "icao": "YMDS", "iata": "", "city": "", "name": "Macdonald Downs Airport", "runway": "", "lat": "-22.467", "long": "135.233" },
{ "size": "Small", "icao": "YAMM", "iata": "AMX", "city": "", "name": "Ammaroo Airport", "runway": "", "lat": "-21.738", "long": "135.242" },
{ "size": "Small", "icao": "YKKH", "iata": "", "city": "", "name": "Kokatha Airport", "runway": "", "lat": "-31.292", "long": "135.242" },
{ "size": "Small", "icao": "YSAR", "iata": "", "city": "", "name": "Mount Sarah Airport", "runway": "", "lat": "-27.043", "long": "135.242" },
{ "size": "Small", "icao": "YMTX", "iata": "", "city": "", "name": "Mount Dare Airport", "runway": "", "lat": "-26.062", "long": "135.247" },
{ "size": "Small", "icao": "YEPR", "iata": "", "city": "", "name": "Epenarra Airport", "runway": "", "lat": "-20.433", "long": "135.267" },
{ "size": "Small", "icao": "YADO", "iata": "", "city": "", "name": "Andado Airport", "runway": "", "lat": "-25.412", "long": "135.29" },
{ "size": "Small", "icao": "YKGA", "iata": "", "city": "", "name": "Kingoonya Airport", "runway": "", "lat": "-30.902", "long": "135.305" },
{ "size": "Small", "icao": "YNWL", "iata": "", "city": "", "name": "North Well Airport", "runway": "", "lat": "-30.846", "long": "135.309" },
{ "size": "Small", "icao": "YDYD", "iata": "", "city": "", "name": "Derry Downs Airport", "runway": "", "lat": "-22.083", "long": "135.333" },
{ "size": "Small", "icao": "YMTP", "iata": "", "city": "", "name": "Mount Hope Airport", "runway": "", "lat": "-34.137", "long": "135.338" },
{ "size": "Small", "icao": "YHOA", "iata": "", "city": "", "name": "Howard Island Airport", "runway": "", "lat": "-12.095", "long": "135.362" },
{ "size": "Small", "icao": "YNUE", "iata": "", "city": "", "name": "Numery Airport", "runway": "", "lat": "-23.983", "long": "135.4" },
{ "size": "Small", "icao": "YOAD", "iata": "", "city": "", "name": "Old Andado Airport", "runway": "", "lat": "-25.383", "long": "135.417" },
{ "size": "Small", "icao": "YELK", "iata": "", "city": "", "name": "Elkedra Airport", "runway": "", "lat": "-21.167", "long": "135.433" },
{ "size": "Small", "icao": "YHKT", "iata": "", "city": "", "name": "Huckitta Airport", "runway": "", "lat": "-22.943", "long": "135.447" },
{ "size": "Small", "icao": "YOOD", "iata": "ODD", "city": "", "name": "Oodnadatta Airport", "runway": "3000 ft", "lat": "-27.562", "long": "135.447" },
{ "size": "Small", "icao": "YWUD", "iata": "WUD", "city": "", "name": "WUDINNA", "runway": "4954 ft", "lat": "-33.043", "long": "135.447" },
{ "size": "Small", "icao": "YBAH", "iata": "", "city": "", "name": "Bauhinia Downs Airport", "runway": "", "lat": "-16.133", "long": "135.467" },
{ "size": "Small", "icao": "YBBO", "iata": "", "city": "", "name": "Bon Bon Airport", "runway": "", "lat": "-30.407", "long": "135.48" },
{ "size": "Small", "icao": "YRDA", "iata": "", "city": "", "name": "Yardea Airport", "runway": "", "lat": "-32.41", "long": "135.485" },
{ "size": "Small", "icao": "DALH", "iata": "", "city": "", "name": "Dalhousie Airport", "runway": "", "lat": "-26.429", "long": "135.506" },
{ "size": "Small", "icao": "YCOF", "iata": "", "city": "", "name": "Coffin Bay Airport", "runway": "", "lat": "-34.633", "long": "135.517" },
{ "size": "Small", "icao": "YDLH", "iata": "", "city": "", "name": "Dalhousie Airport", "runway": "", "lat": "-26.435", "long": "135.517" },
{ "size": "Small", "icao": "YANL", "iata": "AYL", "city": "", "name": "Anthony Lagoon Airport", "runway": "", "lat": "-18.018", "long": "135.535" },
{ "size": "Small", "icao": "YCCK", "iata": "", "city": "", "name": "Canteen Creek Airport", "runway": "", "lat": "-20.651", "long": "135.585" },
{ "size": "Small", "icao": "YKWG", "iata": "", "city": "", "name": "Kangaroo Well Airport", "runway": "", "lat": "-31.785", "long": "135.638" },
{ "size": "Small", "icao": "YMAC", "iata": "", "city": "", "name": "Macumba Airport", "runway": "", "lat": "-27.262", "long": "135.638" },
{ "size": "Small", "icao": "YCUS", "iata": "", "city": "", "name": "CUMMINS", "runway": "4124 ft", "lat": "-34.208", "long": "135.642" },
{ "size": "Small", "icao": "YRRR", "iata": "", "city": "", "name": "Raymangirr Airport", "runway": "", "lat": "-12.333", "long": "135.65" },
{ "size": "Small", "icao": "YWHL", "iata": "", "city": "", "name": "Walhallow Airport", "runway": "", "lat": "-17.767", "long": "135.65" },
{ "size": "Small", "icao": "YMEB", "iata": "", "city": "", "name": "Mount Eba Airport", "runway": "", "lat": "-30.176", "long": "135.671" },
{ "size": "Small", "icao": "YARP", "iata": "", "city": "", "name": "Arapunya Airport", "runway": "", "lat": "-22.317", "long": "135.7" },
{ "size": "Small", "icao": "YCMM", "iata": "", "city": "", "name": "Cummins Town Airport", "runway": "", "lat": "-34.258", "long": "135.708" },
{ "size": "Small", "icao": "YNUM", "iata": "NUB", "city": "", "name": "NUMBULWAR", "runway": "4331 ft", "lat": "-14.272", "long": "135.717" },
{ "size": "Small", "icao": "YVIV", "iata": "", "city": "", "name": "Mount Vivian Airport", "runway": "", "lat": "-30.583", "long": "135.717" },
{ "size": "Small", "icao": "YCCF", "iata": "", "city": "", "name": "Cape Crawford Airport", "runway": "", "lat": "-16.683", "long": "135.733" },
{ "size": "Small", "icao": "YJNK", "iata": "", "city": "", "name": "Jinka Airport", "runway": "", "lat": "-22.95", "long": "135.733" },
{ "size": "Small", "icao": "YWRV", "iata": "", "city": "", "name": "Walker River Airport", "runway": "", "lat": "-13.593", "long": "135.755" },
{ "size": "Small", "icao": "YGLD", "iata": "", "city": "", "name": "Glendambo Airport", "runway": "", "lat": "-30.967", "long": "135.775" },
{ "size": "Small", "icao": "YMYH", "iata": "", "city": "", "name": "Mallapunyah Springs Airport", "runway": "", "lat": "-16.967", "long": "135.783" },
{ "size": "Small", "icao": "YLEV", "iata": "LEL", "city": "", "name": "LAKE EVELLA", "runway": "3494 ft", "lat": "-12.499", "long": "135.806" },
{ "size": "Small", "icao": "YBKS", "iata": "", "city": "", "name": "Barkly Wayside Inn Airport", "runway": "", "lat": "-19.709", "long": "135.819" },
{ "size": "Small", "icao": "YMOE", "iata": "", "city": "", "name": "Moonaree Airport", "runway": "", "lat": "-31.966", "long": "135.875" },
{ "size": "Small", "icao": "YCDB", "iata": "", "city": "", "name": "Coondambo Airport", "runway": "", "lat": "-31.067", "long": "135.883" },
{ "size": "Small", "icao": "YNPA", "iata": "", "city": "", "name": "Nilpinna Airport", "runway": "", "lat": "-28.483", "long": "135.9" },
{ "size": "Small", "icao": "YPKE", "iata": "", "city": "", "name": "Peake Airport", "runway": "", "lat": "-28.25", "long": "135.9" },
{ "size": "Small", "icao": "YBRU", "iata": "BTD", "city": "", "name": "Brunette Downs Airport", "runway": "", "lat": "-18.64", "long": "135.938" },
{ "size": "Small", "icao": "YGAN", "iata": "", "city": "", "name": "Gan Gan Airport", "runway": "", "lat": "-13.067", "long": "135.95" },
{ "size": "Small", "icao": "YMIV", "iata": "", "city": "", "name": "Mount Ive Airport", "runway": "", "lat": "-32.444", "long": "136.069" },
{ "size": "Small", "icao": "YORT", "iata": "", "city": "", "name": "Ooratippra Airport", "runway": "", "lat": "-21.906", "long": "136.069" },
{ "size": "Small", "icao": "YTBB", "iata": "", "city": "", "name": "Tumby Bay Airport", "runway": "3000 ft", "lat": "-34.362", "long": "136.095" },
{ "size": "Small", "icao": "YJVS", "iata": "", "city": "", "name": "Jervois Airport", "runway": "", "lat": "-22.913", "long": "136.12" },
{ "size": "Small", "icao": "YIKL", "iata": "", "city": "", "name": "Baikal Airport", "runway": "", "lat": "-22.763", "long": "136.163" },
{ "size": "Small", "icao": "YANK", "iata": "", "city": "", "name": "Anna Creek Airport", "runway": "", "lat": "-28.897", "long": "136.17" },
{ "size": "Small", "icao": "YKIA", "iata": "", "city": "", "name": "Kiana Station Airport", "runway": "", "lat": "-17.242", "long": "136.175" },
{ "size": "Small", "icao": "YJVM", "iata": "", "city": "", "name": "Jervois Mine Airport", "runway": "", "lat": "-22.633", "long": "136.267" },
{ "size": "Small", "icao": "YLUC", "iata": "", "city": "", "name": "Lucy Creek Airport", "runway": "", "lat": "-22.467", "long": "136.267" },
{ "size": "Small", "icao": "YKOL", "iata": "", "city": "", "name": "Kolendo Airport", "runway": "", "lat": "-32.416", "long": "136.298" },
{ "size": "Small", "icao": "YBRL", "iata": "BOX", "city": "", "name": "BORROLOOLA", "runway": "3770 ft", "lat": "-16.075", "long": "136.302" },
{ "size": "Small", "icao": "YWMC", "iata": "", "city": "", "name": "William Creek Airport", "runway": "", "lat": "-28.907", "long": "136.342" },
{ "size": "Small", "icao": "YATL", "iata": "", "city": "", "name": "Atula Airport", "runway": "", "lat": "-23.283", "long": "136.367" },
{ "size": "Small", "icao": "YPKI", "iata": "", "city": "", "name": "Parakylia Airport", "runway": "", "lat": "-30.4", "long": "136.392" },
{ "size": "Small", "icao": "YMWO", "iata": "", "city": "", "name": "Mahanewo Airport", "runway": "", "lat": "-31.718", "long": "136.433" },
{ "size": "Small", "icao": "YANW", "iata": "", "city": "", "name": "Annitowa Airport", "runway": "", "lat": "-21.2", "long": "136.448" },
{ "size": "Small", "icao": "YIMB", "iata": "", "city": "", "name": "Kimba Airport", "runway": "5100 ft", "lat": "-33.1", "long": "136.46" },
{ "size": "Small", "icao": "YNIG", "iata": "", "city": "", "name": "Nonning Airport", "runway": "", "lat": "-32.522", "long": "136.494" },
{ "size": "Medium", "icao": "YCEE", "iata": "CVC", "city": "", "name": "CLEVE", "runway": "4429 ft", "lat": "-33.71", "long": "136.505" },
{ "size": "Small", "icao": "YDHL", "iata": "", "city": "", "name": "Dhalinbuy Airport", "runway": "", "lat": "-12.413", "long": "136.537" },
{ "size": "Small", "icao": "YCBO", "iata": "", "city": "", "name": "Cape Borda Airport", "runway": "", "lat": "-35.757", "long": "136.598" },
{ "size": "Small", "icao": "YARD", "iata": "", "city": "", "name": "Argadargada Airport", "runway": "", "lat": "-21.677", "long": "136.678" },
{ "size": "Small", "icao": "YALX", "iata": "AXL", "city": "", "name": "Alexandria Homestead Airport", "runway": "", "lat": "-19.06", "long": "136.71" },
{ "size": "Small", "icao": "YROK", "iata": "", "city": "", "name": "Rocky River Airport", "runway": "", "lat": "-35.93", "long": "136.72" },
{ "size": "Small", "icao": "YRXB", "iata": "", "city": "", "name": "Roxby Downs Station Airport", "runway": "", "lat": "-30.717", "long": "136.737" },
{ "size": "Small", "icao": "YCWE", "iata": "", "city": "", "name": "Cape Wessels Airport", "runway": "", "lat": "-11", "long": "136.75" },
{ "size": "Small", "icao": "YTLT", "iata": "", "city": "", "name": "Tarlton Downs Airport", "runway": "", "lat": "-22.633", "long": "136.8" },
{ "size": "Small", "icao": "YYOO", "iata": "", "city": "", "name": "Yalymboo Airport", "runway": "", "lat": "-31.803", "long": "136.86" },
{ "size": "Small", "icao": "YCWL", "iata": "CCW", "city": "", "name": "Cowell Airport", "runway": "4800 ft", "lat": "-33.667", "long": "136.892" },
{ "size": "Small", "icao": "YBNM", "iata": "", "city": "", "name": "Benmara Airport", "runway": "", "lat": "-17.937", "long": "136.9" },
{ "size": "Small", "icao": "YRBR", "iata": "", "city": "", "name": "Robinson River Airport", "runway": "", "lat": "-16.718", "long": "136.945" },
{ "size": "Small", "icao": "YSDN", "iata": "", "city": "", "name": "Soudan Station Airport", "runway": "", "lat": "-20.05", "long": "137.017" },
{ "size": "Small", "icao": "YMTA", "iata": "MIY", "city": "", "name": "Mittebah Airport", "runway": "", "lat": "-18.809", "long": "137.082" },
{ "size": "Small", "icao": "YCKA", "iata": "", "city": "", "name": "Curdimurka Airport", "runway": "", "lat": "-29.477", "long": "137.088" },
{ "size": "Small", "icao": "YAMK", "iata": "ADO", "city": "", "name": "Andamooka Airport", "runway": "3000 ft", "lat": "-30.438", "long": "137.137" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Lake Eyre North", "runway": "", "lat": "-28.417", "long": "137.3" },
{ "size": "Small", "icao": "YAVD", "iata": "", "city": "", "name": "Avon Downs Airport", "runway": "", "lat": "-20.033", "long": "137.517" },
{ "size": "Medium", "icao": "YKSC", "iata": "KGC", "city": "", "name": "KINGSCOTE", "runway": "4600 ft", "lat": "-35.714", "long": "137.521" },
{ "size": "Small", "icao": "YMIN", "iata": "XML", "city": "", "name": "Minlaton Airport", "runway": "", "lat": "-34.75", "long": "137.533" },
{ "size": "Small", "icao": "YYOR", "iata": "ORR", "city": "", "name": "Yorketown Airport", "runway": "", "lat": "-35", "long": "137.617" },
{ "size": "Small", "icao": "YCPP", "iata": "", "city": "", "name": "Copper Triangle Airport", "runway": "", "lat": "-33.982", "long": "137.662" },
{ "size": "Medium", "icao": "YPAG", "iata": "PUG", "city": "", "name": "PORT AUGUSTA", "runway": "5413 ft", "lat": "-32.507", "long": "137.717" },
{ "size": "Small", "icao": "YMLD", "iata": "", "city": "", "name": "Maitland Airport", "runway": "", "lat": "-34.393", "long": "137.717" },
{ "size": "Small", "icao": "YAUS", "iata": "AWP", "city": "", "name": "Austral Downs Airport", "runway": "", "lat": "-20.5", "long": "137.75" },
{ "size": "Small", "icao": "YRBM", "iata": "", "city": "", "name": "Redbank Mine Airport", "runway": "", "lat": "-17.183", "long": "137.767" },
{ "size": "Small", "icao": "YARS", "iata": "", "city": "", "name": "Ardrossan Airport", "runway": "", "lat": "-34.442", "long": "137.883" },
{ "size": "Small", "icao": "YMLR", "iata": "", "city": "", "name": "Muloorina Airport", "runway": "", "lat": "-29.247", "long": "137.91" },
{ "size": "Small", "icao": "YNUJ", "iata": "", "city": "", "name": "Nudjaburra Airport", "runway": "", "lat": "-17.967", "long": "137.933" },
{ "size": "Small", "icao": "YWOR", "iata": "WLL", "city": "", "name": "Wollogorang Airport", "runway": "", "lat": "-17.22", "long": "137.935" },
{ "size": "Small", "icao": "YMCR", "iata": "MFP", "city": "", "name": "Manners Creek Airport", "runway": "", "lat": "-22.1", "long": "137.983" },
{ "size": "Medium", "icao": "YPIR", "iata": "PPI", "city": "", "name": "PORT PIRIE", "runway": "3422 ft", "lat": "-33.239", "long": "137.995" },
{ "size": "Small", "icao": "YMRE", "iata": "RRE", "city": "", "name": "Marree Airport", "runway": "4400 ft", "lat": "-29.663", "long": "138.065" },
{ "size": "Small", "icao": "YRKS", "iata": "", "city": "", "name": "Rocklands Airport", "runway": "", "lat": "-19.867", "long": "138.1" },
{ "size": "Small", "icao": "YQRN", "iata": "", "city": "", "name": "Quorn Airport", "runway": "", "lat": "-32.32", "long": "138.102" },
{ "size": "Small", "icao": "YCMW", "iata": "CML", "city": "", "name": "Camooweal Airport", "runway": "", "lat": "-19.912", "long": "138.125" },
{ "size": "Small", "icao": "YWRA", "iata": "", "city": "", "name": "Wooroona Airport", "runway": "", "lat": "-20.482", "long": "138.168" },
{ "size": "Small", "icao": "YWML", "iata": "", "city": "", "name": "Westmoreland Airport", "runway": "", "lat": "-17.333", "long": "138.233" },
{ "size": "Small", "icao": "YKLR", "iata": "", "city": "", "name": "Kalamurina Airport", "runway": "", "lat": "-27.717", "long": "138.262" },
{ "size": "Small", "icao": "YBWT", "iata": "", "city": "", "name": "Bowthorn Airport", "runway": "", "lat": "-18.083", "long": "138.275" },
{ "size": "Small", "icao": "YHDY", "iata": "HIP", "city": "", "name": "Headingly Airport", "runway": "", "lat": "-21.333", "long": "138.283" },
{ "size": "Small", "icao": "YKFC", "iata": "", "city": "", "name": "Kingfisher Camp Airport", "runway": "", "lat": "-17.869", "long": "138.295" },
{ "size": "Small", "icao": "YCWI", "iata": "CWR", "city": "", "name": "Cowarie Airport", "runway": "", "lat": "-27.712", "long": "138.328" },
{ "size": "Small", "icao": "YNOF", "iata": "", "city": "", "name": "Norfolk Airport", "runway": "", "lat": "-19.333", "long": "138.333" },
{ "size": "Small", "icao": "YBVA", "iata": "", "city": "", "name": "Balaklava Airport", "runway": "", "lat": "-34.084", "long": "138.334" },
{ "size": "Small", "icao": "YUDG", "iata": "", "city": "", "name": "Urandangi Airport", "runway": "", "lat": "-21.59", "long": "138.358" },
{ "size": "Small", "icao": "YBOC", "iata": "", "city": "", "name": "Booleroo Centre Airport", "runway": "3000 ft", "lat": "-32.905", "long": "138.36" },
{ "size": "Small", "icao": "YHEG", "iata": "", "city": "", "name": "Hells Gate Airport", "runway": "", "lat": "-17.467", "long": "138.367" },
{ "size": "Small", "icao": "YSNT", "iata": "", "city": "", "name": "Snowtown Airport", "runway": "", "lat": "-33.8", "long": "138.367" },
{ "size": "Medium", "icao": "YLEC", "iata": "LGH", "city": "", "name": "LEIGH CREEK", "runway": "5610 ft", "lat": "-30.598", "long": "138.426" },
{ "size": "Small", "icao": "YBAW", "iata": "BKP", "city": "", "name": "Barkly Downs Airport", "runway": "", "lat": "-20.496", "long": "138.475" },
{ "size": "Small", "icao": "YCRT", "iata": "", "city": "", "name": "Carrieton Airport", "runway": "", "lat": "-32.417", "long": "138.517" },
{ "size": "Small", "icao": "YALG", "iata": "", "city": "", "name": "Adels Grove Airport", "runway": "", "lat": "-18.7", "long": "138.533" },
{ "size": "Small", "icao": "YCVG", "iata": "", "city": "", "name": "Calvin Grove Airport", "runway": "", "lat": "-34.697", "long": "138.578" },
{ "size": "Small", "icao": "YRYK", "iata": "", "city": "", "name": "Rawnsley Park Airport", "runway": "", "lat": "-31.654", "long": "138.61" },
{ "size": "Small", "icao": "YCDT", "iata": "", "city": "", "name": "Carandotta Airport", "runway": "", "lat": "-21.967", "long": "138.617" },
{ "size": "Small", "icao": "YUDL", "iata": "", "city": "", "name": "Undilla Airport", "runway": "", "lat": "-19.625", "long": "138.633" },
{ "size": "Small", "icao": "YLAH", "iata": "LWH", "city": "", "name": "Lawn Hill Airport", "runway": "3000 ft", "lat": "-18.568", "long": "138.635" },
{ "size": "Small", "icao": "YORR", "iata": "", "city": "", "name": "Orroroo Airport", "runway": "", "lat": "-32.773", "long": "138.665" },
{ "size": "Small", "icao": "YCNY", "iata": "", "city": "", "name": "CENTURY MINE", "runway": "5734 ft", "lat": "-18.753", "long": "138.707" },
{ "size": "Small", "icao": "YGAW", "iata": "", "city": "", "name": "Gawler Airport", "runway": "", "lat": "-34.602", "long": "138.717" },
{ "size": "Small", "icao": "YBLM", "iata": "", "city": "", "name": "Blinman Airport", "runway": "", "lat": "-31.119", "long": "138.726" },
{ "size": "Small", "icao": "YGWA", "iata": "", "city": "", "name": "Goolwa Airport", "runway": "3500 ft", "lat": "-35.482", "long": "138.752" },
{ "size": "Small", "icao": "YFFT", "iata": "", "city": "", "name": "Farrell Flat Airport", "runway": "", "lat": "-33.833", "long": "138.767" },
{ "size": "Small", "icao": "YDMG", "iata": "DMD", "city": "", "name": "DOOMADGEE", "runway": "5403 ft", "lat": "-17.94", "long": "138.822" },
{ "size": "Small", "icao": "YGLO", "iata": "GLM", "city": "", "name": "Glenormiston Airport", "runway": "", "lat": "-22.888", "long": "138.825" },
{ "size": "Small", "icao": "YPTB", "iata": "", "city": "", "name": "Peterborough Airport", "runway": "", "lat": "-33.005", "long": "138.858" },
{ "size": "Small", "icao": "YKLL", "iata": "", "city": "", "name": "Kallala Airport", "runway": "", "lat": "-21.75", "long": "138.883" },
{ "size": "Small", "icao": "YLYK", "iata": "", "city": "", "name": "Lyndoch Airport", "runway": "", "lat": "-34.622", "long": "138.914" },
{ "size": "Small", "icao": "YNPU", "iata": "", "city": "", "name": "Nepabunna Airport", "runway": "", "lat": "-30.603", "long": "138.948" },
{ "size": "Small", "icao": "YWPA", "iata": "", "city": "", "name": "Wirrealpa Airport", "runway": "", "lat": "-31.133", "long": "138.967" },
{ "size": "Small", "icao": "YSYN", "iata": "", "city": "", "name": "Strathalbyn Airport", "runway": "", "lat": "-35.312", "long": "138.99" },
{ "size": "Small", "icao": "YMNP", "iata": "", "city": "", "name": "Murnpeowie Airport", "runway": "", "lat": "-29.592", "long": "139.052" },
{ "size": "Small", "icao": "YMTW", "iata": "", "city": "", "name": "Martins Well Airport", "runway": "", "lat": "-31.474", "long": "139.111" },
{ "size": "Small", "icao": "YMTI", "iata": "ONG", "city": "", "name": "MORNINGTON ISLAND", "runway": "4987 ft", "lat": "-16.663", "long": "139.178" },
{ "size": "Small", "icao": "YAOR", "iata": "", "city": "", "name": "Ardmore Airport", "runway": "", "lat": "-21.65", "long": "139.183" },
{ "size": "Small", "icao": "YTEN", "iata": "", "city": "", "name": "Tenneco Station Five Airport", "runway": "", "lat": "-31.975", "long": "139.207" },
{ "size": "Small", "icao": "YMBD", "iata": "", "city": "", "name": "Murray Bridge Airport", "runway": "3000 ft", "lat": "-35.067", "long": "139.227" },
{ "size": "Small", "icao": "YGDS", "iata": "GGD", "city": "", "name": "Gregory Downs Airport", "runway": "3000 ft", "lat": "-18.625", "long": "139.233" },
{ "size": "Small", "icao": "YADS", "iata": "AWN", "city": "", "name": "Alton Downs Airport", "runway": "", "lat": "-26.533", "long": "139.267" },
{ "size": "Small", "icao": "YSFL", "iata": "", "city": "", "name": "Stonefield Gliding", "runway": "", "lat": "-34.342", "long": "139.308" },
{ "size": "Small", "icao": "YNIN", "iata": "", "city": "", "name": "Meningie Airport", "runway": "", "lat": "-35.7", "long": "139.333" },
{ "size": "Small", "icao": "YBLC", "iata": "LCN", "city": "", "name": "Balcanoona Airport", "runway": "", "lat": "-30.535", "long": "139.337" },
{ "size": "Small", "icao": "YARK", "iata": "", "city": "", "name": "Arkaroola Airport", "runway": "", "lat": "-30.407", "long": "139.346" },
{ "size": "Medium", "icao": "YBDV", "iata": "BVI", "city": "", "name": "BIRDSVILLE", "runway": "5682 ft", "lat": "-25.898", "long": "139.347" },
{ "size": "Small", "icao": "YWEO", "iata": "", "city": "", "name": "Wertaloona Airport", "runway": "", "lat": "-30.65", "long": "139.35" },
{ "size": "Small", "icao": "YGPR", "iata": "", "city": "", "name": "Gunpowder Airport", "runway": "", "lat": "-19.7", "long": "139.367" },
{ "size": "Small", "icao": "YTNN", "iata": "", "city": "", "name": "Tenneco Station Four Airport", "runway": "", "lat": "-31.183", "long": "139.383" },
{ "size": "Small", "icao": "YPDI", "iata": "PDE", "city": "", "name": "Pandie Pandie Airport", "runway": "", "lat": "-26.117", "long": "139.4" },
{ "size": "Small", "icao": "YCTS", "iata": "", "city": "", "name": "Calton Hills Airport", "runway": "", "lat": "-20.133", "long": "139.417" },
{ "size": "Small", "icao": "YESC", "iata": "", "city": "", "name": "Escott Airport", "runway": "3000 ft", "lat": "-17.725", "long": "139.417" },
{ "size": "Small", "icao": "YERU", "iata": "", "city": "", "name": "Erudina Airport", "runway": "", "lat": "-31.434", "long": "139.425" },
{ "size": "Small", "icao": "YWLN", "iata": "", "city": "", "name": "Wooltana Airport", "runway": "", "lat": "-30.422", "long": "139.436" },
{ "size": "Medium", "icao": "YBIE", "iata": "BEU", "city": "", "name": "BEDOURIE", "runway": "4921 ft", "lat": "-24.346", "long": "139.46" },
{ "size": "Small", "icao": "YFTN", "iata": "", "city": "", "name": "Mount Fitton Talc Airport", "runway": "", "lat": "-29.909", "long": "139.474" },
{ "size": "Small", "icao": "YDAJ", "iata": "DJR", "city": "", "name": "Dajarra Airport", "runway": "", "lat": "-21.708", "long": "139.533" },
{ "size": "Small", "icao": "YBKT", "iata": "BUC", "city": "", "name": "BURKETOWN", "runway": "4501 ft", "lat": "-17.749", "long": "139.534" },
{ "size": "Small", "icao": "YYUN", "iata": "", "city": "", "name": "Yunta Airport", "runway": "", "lat": "-32.583", "long": "139.55" },
{ "size": "Small", "icao": "YBEE", "iata": "", "city": "", "name": "Beverley Airport", "runway": "", "lat": "-30.187", "long": "139.558" },
{ "size": "Small", "icao": "YBTK", "iata": "", "city": "", "name": "Bentinck Island Airport", "runway": "", "lat": "-17.087", "long": "139.566" },
{ "size": "Small", "icao": "YSWE", "iata": "", "city": "", "name": "Sweers Island Resort Airport", "runway": "", "lat": "-17.122", "long": "139.598" },
{ "size": "Small", "icao": "YGLE", "iata": "GLG", "city": "", "name": "Glengyle Airport", "runway": "", "lat": "-24.808", "long": "139.6" },
{ "size": "Small", "icao": "YUNY", "iata": "CZY", "city": "", "name": "Cluny Airport", "runway": "", "lat": "-24.517", "long": "139.617" },
{ "size": "Small", "icao": "YALY", "iata": "", "city": "", "name": "Alderley Airport", "runway": "", "lat": "-22.483", "long": "139.633" },
{ "size": "Small", "icao": "YRSB", "iata": "RSB", "city": "", "name": "Roseberth Airport", "runway": "3000 ft", "lat": "-25.833", "long": "139.65" },
{ "size": "Small", "icao": "YTEC", "iata": "", "city": "", "name": "Tenneco Station Three Airport", "runway": "", "lat": "-30.337", "long": "139.665" },
{ "size": "Small", "icao": "YMWX", "iata": "MXD", "city": "", "name": "Marion Downs Airport", "runway": "", "lat": "-23.367", "long": "139.667" },
{ "size": "Small", "icao": "YBHK", "iata": "", "city": "", "name": "Bushy Park Airport", "runway": "", "lat": "-21.267", "long": "139.717" },
{ "size": "Small", "icao": "YSBO", "iata": "", "city": "", "name": "Stanbroke Airport", "runway": "", "lat": "-21.567", "long": "139.717" },
{ "size": "Small", "icao": "YFRD", "iata": "", "city": "", "name": "Frome Downs Airport", "runway": "", "lat": "-31.217", "long": "139.75" },
{ "size": "Small", "icao": "YMWT", "iata": "", "city": "", "name": "Moolawatana Airport", "runway": "", "lat": "-29.917", "long": "139.75" },
{ "size": "Small", "icao": "YAML", "iata": "", "city": "", "name": "Armraynald Airport", "runway": "", "lat": "-17.967", "long": "139.767" },
{ "size": "Small", "icao": "YPMB", "iata": "", "city": "", "name": "Plumbago Airport", "runway": "", "lat": "-32.053", "long": "139.872" },
{ "size": "Small", "icao": "YKIG", "iata": "", "city": "", "name": "Kingston Airport", "runway": "", "lat": "-36.823", "long": "139.875" },
{ "size": "Small", "icao": "YAGD", "iata": "AUD", "city": "", "name": "Augustus Downs Airport", "runway": "3000 ft", "lat": "-18.515", "long": "139.878" },
{ "size": "Medium", "icao": "YBOU", "iata": "BQL", "city": "", "name": "BOULIA", "runway": "4180 ft", "lat": "-22.913", "long": "139.9" },
{ "size": "Small", "icao": "YLOR", "iata": "LOA", "city": "", "name": "Lorraine Airport", "runway": "3000 ft", "lat": "-18.993", "long": "139.907" },
{ "size": "Small", "icao": "YTMO", "iata": "PHQ", "city": "", "name": "THE MONUMENT", "runway": "6233 ft", "lat": "-21.811", "long": "139.924" },
{ "size": "Small", "icao": "YTOS", "iata": "", "city": "", "name": "Tenneco Station Two Airport", "runway": "", "lat": "-29.55", "long": "139.95" },
{ "size": "Small", "icao": "YWER", "iata": "", "city": "", "name": "Wernadinga Airport", "runway": "", "lat": "-18.133", "long": "139.967" },
{ "size": "Small", "icao": "YWKI", "iata": "", "city": "", "name": "WAIKERIE", "runway": "3151 ft", "lat": "-34.184", "long": "140.031" },
{ "size": "Small", "icao": "YKAJ", "iata": "", "city": "", "name": "Kajabbi Airport", "runway": "", "lat": "-20.033", "long": "140.033" },
{ "size": "Small", "icao": "YTNE", "iata": "", "city": "", "name": "Tenneco Station One Airport", "runway": "", "lat": "-28.733", "long": "140.05" },
{ "size": "Small", "icao": "YKML", "iata": "KML", "city": "", "name": "Kamileroi Airport", "runway": "3000 ft", "lat": "-19.375", "long": "140.057" },
{ "size": "Small", "icao": "YTIN", "iata": "", "city": "", "name": "Tintinara Airport", "runway": "", "lat": "-35.867", "long": "140.067" },
{ "size": "Small", "icao": "YOOM", "iata": "MOO", "city": "", "name": "MOOMBA", "runway": "5636 ft", "lat": "-28.099", "long": "140.197" },
{ "size": "Small", "icao": "YDRI", "iata": "DRR", "city": "", "name": "Durrie Airport", "runway": "3000 ft", "lat": "-25.685", "long": "140.228" },
{ "size": "Small", "icao": "YDEV", "iata": "", "city": "", "name": "Devoncourt Airport", "runway": "", "lat": "-21.217", "long": "140.233" },
{ "size": "Small", "icao": "YKTH", "iata": "", "city": "", "name": "Keith Airport", "runway": "", "lat": "-36.108", "long": "140.242" },
{ "size": "Small", "icao": "YCNG", "iata": "", "city": "", "name": "Cooranga Airport", "runway": "", "lat": "-36.82", "long": "140.273" },
{ "size": "Small", "icao": "YCTH", "iata": "", "city": "", "name": "Chatsworth Airport", "runway": "", "lat": "-21.967", "long": "140.3" },
{ "size": "Small", "icao": "YMYT", "iata": "RTY", "city": "", "name": "Merty Merty Airport", "runway": "", "lat": "-28.583", "long": "140.317" },
{ "size": "Small", "icao": "YSTR", "iata": "", "city": "", "name": "Strathearn Airport", "runway": "", "lat": "-31.767", "long": "140.333" },
{ "size": "Small", "icao": "YLUI", "iata": "", "city": "", "name": "Lucindale Airport", "runway": "", "lat": "-36.972", "long": "140.352" },
{ "size": "Small", "icao": "YMCT", "iata": "MLR", "city": "", "name": "MILLICENT", "runway": "3937 ft", "lat": "-37.584", "long": "140.366" },
{ "size": "Small", "icao": "YGNA", "iata": "", "city": "", "name": "Granada Airport", "runway": "", "lat": "-20.1", "long": "140.367" },
{ "size": "Small", "icao": "YCLE", "iata": "", "city": "", "name": "Callendale Airport", "runway": "", "lat": "-37.243", "long": "140.445" },
{ "size": "Small", "icao": "YQON", "iata": "", "city": "", "name": "Quondong Airport", "runway": "", "lat": "-33.163", "long": "140.452" },
{ "size": "Small", "icao": "YBMR", "iata": "", "city": "", "name": "Barmera Airport", "runway": "", "lat": "-34.257", "long": "140.458" },
{ "size": "Small", "icao": "YPDY", "iata": "", "city": "", "name": "Padthaway Station Airport", "runway": "", "lat": "-36.617", "long": "140.483" },
{ "size": "Small", "icao": "YLUL", "iata": "", "city": "", "name": "Mooleulooloo Airport", "runway": "", "lat": "-31.633", "long": "140.533" },
{ "size": "Small", "icao": "YMNK", "iata": "ONR", "city": "", "name": "Monkira Airport", "runway": "3000 ft", "lat": "-24.817", "long": "140.533" },
{ "size": "Small", "icao": "YDOO", "iata": "", "city": "", "name": "Donors Hill Airport", "runway": "", "lat": "-18.717", "long": "140.55" },
{ "size": "Small", "icao": "YLAO", "iata": "", "city": "", "name": "Lameroo Airport", "runway": "", "lat": "-35.367", "long": "140.55" },
{ "size": "Small", "icao": "YOSB", "iata": "OSO", "city": "", "name": "OSBORNE MINE", "runway": "6550 ft", "lat": "-22.082", "long": "140.555" },
{ "size": "Small", "icao": "YINV", "iata": "", "city": "", "name": "Inverleigh Airport", "runway": "", "lat": "-18.017", "long": "140.567" },
{ "size": "Small", "icao": "YLOX", "iata": "", "city": "", "name": "Loxton Airport", "runway": "3800 ft", "lat": "-34.475", "long": "140.663" },
{ "size": "Medium", "icao": "YREN", "iata": "RMK", "city": "", "name": "RENMARK", "runway": "5709 ft", "lat": "-34.196", "long": "140.674" },
{ "size": "Small", "icao": "YCGH", "iata": "", "city": "", "name": "Clonagh Airport", "runway": "", "lat": "-20.133", "long": "140.683" },
{ "size": "Small", "icao": "YSPV", "iata": "KSV", "city": "", "name": "Springvale Airport", "runway": "", "lat": "-23.55", "long": "140.7" },
{ "size": "Small", "icao": "YNRC", "iata": "NAC", "city": "", "name": "NARACOORTE", "runway": "3438 ft", "lat": "-36.985", "long": "140.725" },
{ "size": "Small", "icao": "YINN", "iata": "INM", "city": "", "name": "Innamincka Airport", "runway": "3000 ft", "lat": "-27.7", "long": "140.733" },
{ "size": "Small", "icao": "YBEO", "iata": "BTX", "city": "", "name": "Betoota Airport", "runway": "3000 ft", "lat": "-25.642", "long": "140.783" },
{ "size": "Medium", "icao": "YMTG", "iata": "MGB", "city": "", "name": "MOUNT GAMBIER", "runway": "5000 ft", "lat": "-37.746", "long": "140.785" },
{ "size": "Small", "icao": "YCNQ", "iata": "", "city": "", "name": "Coonawarra Airport", "runway": "", "lat": "-37.283", "long": "140.8" },
{ "size": "Small", "icao": "YTOA", "iata": "", "city": "", "name": "Toolachie Airport", "runway": "", "lat": "-28.408", "long": "140.81" },
{ "size": "Small", "icao": "YKMB", "iata": "KRB", "city": "", "name": "Karumba Airport", "runway": "4100 ft", "lat": "-17.457", "long": "140.83" },
{ "size": "Small", "icao": "YBLG", "iata": "", "city": "", "name": "Bollards Lagoon Airport", "runway": "", "lat": "-28.983", "long": "140.85" },
{ "size": "Small", "icao": "YDGI", "iata": "", "city": "", "name": "Dullingari Airport", "runway": "", "lat": "-28.133", "long": "140.882" },
{ "size": "Small", "icao": "YTEE", "iata": "TQP", "city": "", "name": "TREPELL", "runway": "5903 ft", "lat": "-21.835", "long": "140.888" },
{ "size": "Small", "icao": "YCAM", "iata": "", "city": "", "name": "Cannington Station Airport", "runway": "", "lat": "-21.875", "long": "140.9" },
{ "size": "Small", "icao": "YPNN", "iata": "", "city": "", "name": "Pinnaroo Airport", "runway": "", "lat": "-35.253", "long": "140.943" },
{ "size": "Small", "icao": "YAND", "iata": "", "city": "", "name": "Answer Downs Airport", "runway": "", "lat": "-21.667", "long": "140.983" },
{ "size": "Small", "icao": "YMOO", "iata": "OOR", "city": "", "name": "Mooraberree Airport", "runway": "", "lat": "-25.25", "long": "140.983" },
{ "size": "Small", "icao": "YARY", "iata": "AAB", "city": "", "name": "Arrabury Airport", "runway": "3000 ft", "lat": "-26.7", "long": "141.05" },
{ "size": "Medium", "icao": "YNTN", "iata": "NTN", "city": "", "name": "NORMANTON", "runway": "5499 ft", "lat": "-17.684", "long": "141.07" },
{ "size": "Small", "icao": "YDPD", "iata": "DVP", "city": "", "name": "Davenport Downs Airport", "runway": "3000 ft", "lat": "-24.15", "long": "141.108" },
{ "size": "Small", "icao": "YSDW", "iata": "", "city": "", "name": "Strathdownie Airport", "runway": "", "lat": "-37.732", "long": "141.125" },
{ "size": "Small", "icao": "YNAP", "iata": "NMR", "city": "", "name": "Nappa Merrie Airport", "runway": "3000 ft", "lat": "-27.558", "long": "141.133" },
{ "size": "Small", "icao": "YSCA", "iata": "", "city": "", "name": "Scotia Sanctuary Airport", "runway": "", "lat": "-33.207", "long": "141.173" },
{ "size": "Small", "icao": "YEPL", "iata": "", "city": "", "name": "Epsilon Airport", "runway": "", "lat": "-28.283", "long": "141.2" },
{ "size": "Small", "icao": "YOMI", "iata": "", "city": "", "name": "Omicron Station Airport", "runway": "", "lat": "-28.767", "long": "141.2" },
{ "size": "Small", "icao": "YIFY", "iata": "IFF", "city": "", "name": "Iffley Airport", "runway": "3000 ft", "lat": "-18.9", "long": "141.217" },
{ "size": "Small", "icao": "YKNV", "iata": "", "city": "", "name": "Kaniva Airport", "runway": "", "lat": "-36.383", "long": "141.25" },
{ "size": "Small", "icao": "YEDE", "iata": "", "city": "", "name": "Edenhope Airport", "runway": "", "lat": "-37.017", "long": "141.267" },
{ "size": "Small", "icao": "YMCK", "iata": "", "city": "", "name": "Mckinley Airport", "runway": "", "lat": "-21.283", "long": "141.288" },
{ "size": "Small", "icao": "YDLT", "iata": "DDN", "city": "", "name": "Delta Downs Airport", "runway": "3000 ft", "lat": "-16.992", "long": "141.317" },
{ "size": "Small", "icao": "YCTN", "iata": "", "city": "", "name": "Casterton Airport", "runway": "", "lat": "-37.6", "long": "141.4" },
{ "size": "Small", "icao": "YWSD", "iata": "", "city": "", "name": "Westward Downs Airport", "runway": "", "lat": "-30.725", "long": "141.4" },
{ "size": "Small", "icao": "YYAA", "iata": "", "city": "", "name": "Yandama Airport", "runway": "", "lat": "-29.683", "long": "141.425" },
{ "size": "Small", "icao": "YMNY", "iata": "OXY", "city": "", "name": "Morney Airport", "runway": "3000 ft", "lat": "-25.358", "long": "141.433" },
{ "size": "Small", "icao": "YIKM", "iata": "IKP", "city": "", "name": "Inkerman Airport", "runway": "", "lat": "-16.275", "long": "141.442" },
{ "size": "Small", "icao": "YCNA", "iata": "", "city": "", "name": "Corona Station Airport", "runway": "", "lat": "-31.291", "long": "141.452" },
{ "size": "Medium", "icao": "YPOD", "iata": "PTJ", "city": "", "name": "PORTLAND", "runway": "5302 ft", "lat": "-38.318", "long": "141.471" },
{ "size": "Small", "icao": "YCUD", "iata": "", "city": "", "name": "Cuddapan Airport", "runway": "", "lat": "-25.59", "long": "141.508" },
{ "size": "Small", "icao": "YWNI", "iata": "", "city": "", "name": "Wathanin Airport", "runway": "", "lat": "-13.7", "long": "141.55" },
{ "size": "Small", "icao": "YMLL", "iata": "", "city": "", "name": "Millungera Airport", "runway": "", "lat": "-19.858", "long": "141.562" },
{ "size": "Small", "icao": "", "iata": "BHT", "city": "", "name": "Brighton Downs Airport", "runway": "", "lat": "-23.364", "long": "141.563" },
{ "size": "Small", "icao": "YARI", "iata": "", "city": "", "name": "Arizona 1 Airport", "runway": "", "lat": "-21.667", "long": "141.567" },
{ "size": "Small", "icao": "YKNC", "iata": "", "city": "", "name": "Kencherang Airport", "runway": "", "lat": "-13.845", "long": "141.592" },
{ "size": "Small", "icao": "YPMP", "iata": "EDR", "city": "", "name": "PORMPURAAW", "runway": "4462 ft", "lat": "-14.897", "long": "141.609" },
{ "size": "Small", "icao": "YNHL", "iata": "", "city": "", "name": "NHILL", "runway": "3281 ft", "lat": "-36.31", "long": "141.641" },
{ "size": "Small", "icao": "YTTE", "iata": "", "city": "", "name": "Ti Tree Airport", "runway": "", "lat": "-13.985", "long": "141.657" },
{ "size": "Small", "icao": "YCOL", "iata": "", "city": "", "name": "Coleraine Airport", "runway": "", "lat": "-37.6", "long": "141.7" },
{ "size": "Small", "icao": "YBXH", "iata": "", "city": "", "name": "Branxholme Airport", "runway": "", "lat": "-37.867", "long": "141.702" },
{ "size": "Small", "icao": "YAUR", "iata": "AUU", "city": "", "name": "AURUKUN", "runway": "4140 ft", "lat": "-13.354", "long": "141.721" },
{ "size": "Small", "icao": "YJLC", "iata": "JCK", "city": "", "name": "JULIA CREEK", "runway": "4600 ft", "lat": "-20.668", "long": "141.722" },
{ "size": "Small", "icao": "YTKS", "iata": "", "city": "", "name": "Toorak Research Station Airport", "runway": "3000 ft", "lat": "-21.042", "long": "141.787" },
{ "size": "Small", "icao": "YDOR", "iata": "DRD", "city": "", "name": "Dorunda Airport", "runway": "", "lat": "-16.558", "long": "141.808" },
{ "size": "Small", "icao": "YLLE", "iata": "", "city": "", "name": "BALLERA", "runway": "5906 ft", "lat": "-27.408", "long": "141.808" },
{ "size": "Small", "icao": "YRTP", "iata": "RTP", "city": "", "name": "Rutland Plains Airport", "runway": "3000 ft", "lat": "-15.643", "long": "141.843" },
{ "size": "Small", "icao": "YWTO", "iata": "", "city": "", "name": "Wentworth Airport", "runway": "", "lat": "-34.088", "long": "141.892" },
{ "size": "Small", "icao": "YACS", "iata": "", "city": "", "name": "Acacia Downs Airport", "runway": "", "lat": "-31.417", "long": "141.9" },
{ "size": "Small", "icao": "YDRH", "iata": "DHD", "city": "", "name": "Durham Downs Airport", "runway": "3000 ft", "lat": "-27.075", "long": "141.9" },
{ "size": "Small", "icao": "YKYN", "iata": "", "city": "", "name": "Kynuna Airport", "runway": "", "lat": "-21.6", "long": "141.917" },
{ "size": "Small", "icao": "YNRL", "iata": "", "city": "", "name": "Naryilco Airport", "runway": "", "lat": "-28.55", "long": "141.917" },
{ "size": "Small", "icao": "YTNB", "iata": "", "city": "", "name": "Tanbar Airport", "runway": "", "lat": "-25.848", "long": "141.928" },
{ "size": "Small", "icao": "YVRS", "iata": "VNR", "city": "", "name": "Vanrook Station Airport", "runway": "", "lat": "-16.963", "long": "141.95" },
{ "size": "Small", "icao": "YRBW", "iata": "", "city": "", "name": "Rainbow Airport", "runway": "", "lat": "-35.917", "long": "141.983" },
{ "size": "Small", "icao": "YCUT", "iata": "", "city": "", "name": "Cuthero Airport", "runway": "", "lat": "-33.033", "long": "142.017" },
{ "size": "Small", "icao": "YSOW", "iata": "", "city": "", "name": "Southwell Airport", "runway": "", "lat": "-14.517", "long": "142.033" },
{ "size": "Medium", "icao": "YTIB", "iata": "TYB", "city": "", "name": "TIBOOBURRA", "runway": "3202 ft", "lat": "-29.451", "long": "142.058" },
{ "size": "Medium", "icao": "YHML", "iata": "HLT", "city": "", "name": "HAMILTON", "runway": "4606 ft", "lat": "-37.649", "long": "142.065" },
{ "size": "Small", "icao": "YTAD", "iata": "", "city": "", "name": "Tandou Lake Airport", "runway": "", "lat": "-32.633", "long": "142.083" },
{ "size": "Small", "icao": "YSGW", "iata": "ZGL", "city": "", "name": "South Galway Airport", "runway": "3000 ft", "lat": "-25.683", "long": "142.108" },
{ "size": "Small", "icao": "YLAN", "iata": "", "city": "", "name": "Langawirra Airport", "runway": "", "lat": "-31.45", "long": "142.133" },
{ "size": "Small", "icao": "YPCH", "iata": "", "city": "", "name": "Patchewollock Airport", "runway": "", "lat": "-35.367", "long": "142.15" },
{ "size": "Medium", "icao": "YHSM", "iata": "HSM", "city": "", "name": "HORSHAM", "runway": "4337 ft", "lat": "-36.67", "long": "142.173" },
{ "size": "Small", "icao": "YBAU", "iata": "BDD", "city": "", "name": "Badu Island Airport", "runway": "", "lat": "-10.15", "long": "142.173" },
{ "size": "Small", "icao": "YKRV", "iata": "", "city": "", "name": "Kendall River Airport", "runway": "", "lat": "-13.75", "long": "142.183" },
{ "size": "Small", "icao": "YKOG", "iata": "", "city": "", "name": "Koongarra Airport", "runway": "", "lat": "-36", "long": "142.217" },
{ "size": "Small", "icao": "YBOI", "iata": "GIC", "city": "", "name": "Boigu Airport", "runway": "", "lat": "-9.233", "long": "142.218" },
{ "size": "Small", "icao": "YKUB", "iata": "KUG", "city": "", "name": "KUBIN", "runway": "3147 ft", "lat": "-10.225", "long": "142.218" },
{ "size": "Small", "icao": "YWTV", "iata": "", "city": "", "name": "Watson River Airport", "runway": "", "lat": "-13.217", "long": "142.233" },
{ "size": "Small", "icao": "YCRY", "iata": "CDQ", "city": "", "name": "Croydon Airport", "runway": "3000 ft", "lat": "-18.225", "long": "142.258" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Port Fairy", "runway": "", "lat": "-38.362", "long": "142.264" },
{ "size": "Small", "icao": "YVVA", "iata": "", "city": "", "name": "Victoria Valley Airport", "runway": "", "lat": "-37.5", "long": "142.27" },
{ "size": "Small", "icao": "YGMP", "iata": "", "city": "", "name": "Grampians Airport", "runway": "", "lat": "-37.05", "long": "142.283" },
{ "size": "Small", "icao": "YMHW", "iata": "", "city": "", "name": "Mount Howitt Airport", "runway": "3000 ft", "lat": "-26.512", "long": "142.283" },
{ "size": "Small", "icao": "YWMA", "iata": "", "city": "", "name": "Wonnaminta Stat Airport", "runway": "", "lat": "-30.651", "long": "142.342" },
{ "size": "Small", "icao": "YOUY", "iata": "OYN", "city": "", "name": "Ouyen Airport", "runway": "", "lat": "-35.089", "long": "142.354" },
{ "size": "Medium", "icao": "YHPN", "iata": "HTU", "city": "", "name": "HOPETOUN", "runway": "3730 ft", "lat": "-35.715", "long": "142.36" },
{ "size": "Small", "icao": "YSDL", "iata": "", "city": "", "name": "Sudley Airport", "runway": "", "lat": "-12.75", "long": "142.367" },
{ "size": "Small", "icao": "YDBR", "iata": "DNB", "city": "", "name": "Dunbar Airport", "runway": "", "lat": "-16.05", "long": "142.4" },
{ "size": "Small", "icao": "YMED", "iata": "", "city": "", "name": "Menindee Airport", "runway": "", "lat": "-32.367", "long": "142.405" },
{ "size": "Small", "icao": "YJAK", "iata": "", "city": "", "name": "Jackson Airport", "runway": "5900 ft", "lat": "-27.638", "long": "142.408" },
{ "size": "Small", "icao": "YBEU", "iata": "", "city": "", "name": "Beulah 1 Airport", "runway": "", "lat": "-35.95", "long": "142.417" },
{ "size": "Small", "icao": "YMEP", "iata": "", "city": "", "name": "Merapah Airport", "runway": "", "lat": "-13.717", "long": "142.417" },
{ "size": "Medium", "icao": "YWKB", "iata": "WKB", "city": "", "name": "WARRACKNABEAL", "runway": "4501 ft", "lat": "-36.321", "long": "142.419" },
{ "size": "Small", "icao": "YSGD", "iata": "", "city": "", "name": "Strathgordon Airport", "runway": "", "lat": "-14.795", "long": "142.433" },
{ "size": "Small", "icao": "YWBL", "iata": "WMB", "city": "", "name": "WARRNAMBOOL", "runway": "4501 ft", "lat": "-38.295", "long": "142.447" },
{ "size": "Small", "icao": "YGDV", "iata": "", "city": "", "name": "Galdeville Airport", "runway": "", "lat": "-20.25", "long": "142.45" },
{ "size": "Small", "icao": "YKLA", "iata": "", "city": "", "name": "Koolatah Airport", "runway": "", "lat": "-15.917", "long": "142.45" },
{ "size": "Small", "icao": "YBAM", "iata": "ABM", "city": "", "name": "BAMAGA INJINOO", "runway": "5462 ft", "lat": "-10.951", "long": "142.459" },
{ "size": "Small", "icao": "YMEU", "iata": "", "city": "", "name": "Merluna Airport", "runway": "", "lat": "-13.05", "long": "142.483" },
{ "size": "Small", "icao": "YKAY", "iata": "", "city": "", "name": "Kayrunnera Airport", "runway": "", "lat": "-30.683", "long": "142.533" },
{ "size": "Small", "icao": "YCFF", "iata": "", "city": "", "name": "Dadswells Bridge Airport", "runway": "", "lat": "-36.968", "long": "142.548" },
{ "size": "Small", "icao": "YSMR", "iata": "STH", "city": "", "name": "Strathmore Airport", "runway": "", "lat": "-17.85", "long": "142.567" },
{ "size": "Small", "icao": "YHTL", "iata": "", "city": "", "name": "Heathlands Airport", "runway": "", "lat": "-11.75", "long": "142.583" },
{ "size": "Small", "icao": "YNCD", "iata": "", "city": "", "name": "Noccundra Airport", "runway": "", "lat": "-27.8", "long": "142.583" },
{ "size": "Small", "icao": "YPVD", "iata": "", "city": "", "name": "Plevna Downs Airport", "runway": "", "lat": "-26.667", "long": "142.583" },
{ "size": "Small", "icao": "YPCE", "iata": "", "city": "", "name": "Pooncarie Airport", "runway": "3400 ft", "lat": "-33.367", "long": "142.588" },
{ "size": "Small", "icao": "YALN", "iata": "", "city": "", "name": "Allandy Airport", "runway": "", "lat": "-30.383", "long": "142.6" },
{ "size": "Small", "icao": "YMWM", "iata": "", "city": "", "name": "Mount William Airport", "runway": "", "lat": "-37.295", "long": "142.603" },
{ "size": "Small", "icao": "YODL", "iata": "", "city": "", "name": "Ourdel Airport", "runway": "", "lat": "-25.35", "long": "142.633" },
{ "size": "Small", "icao": "YGWD", "iata": "", "city": "", "name": "Galway Downs Airport", "runway": "", "lat": "-25.183", "long": "142.667" },
{ "size": "Small", "icao": "YWIL", "iata": "", "city": "", "name": "Wilandra Airport", "runway": "", "lat": "-31.283", "long": "142.667" },
{ "size": "Medium", "icao": "YWDH", "iata": "WNR", "city": "", "name": "WINDORAH", "runway": "4508 ft", "lat": "-25.413", "long": "142.667" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Pomonal Airstrip", "runway": "", "lat": "-37.231", "long": "142.677" },
{ "size": "Small", "icao": "YNOC", "iata": "", "city": "", "name": "Nockatunga Airport", "runway": "", "lat": "-27.717", "long": "142.712" },
{ "size": "Small", "icao": "YCWO", "iata": "", "city": "", "name": "Chatsworth Airport", "runway": "", "lat": "-37.833", "long": "142.717" },
{ "size": "Medium", "icao": "YSWL", "iata": "SWC", "city": "", "name": "STAWELL", "runway": "4603 ft", "lat": "-37.072", "long": "142.741" },
{ "size": "Small", "icao": "YROI", "iata": "RBC", "city": "", "name": "Robinvale Airport", "runway": "3700 ft", "lat": "-34.65", "long": "142.783" },
{ "size": "Small", "icao": "YSMY", "iata": "", "city": "", "name": "Strathmay Airport", "runway": "", "lat": "-14.883", "long": "142.802" },
{ "size": "Small", "icao": "YSTB", "iata": "", "city": "", "name": "Strathburn Airport", "runway": "", "lat": "-14.482", "long": "142.817" },
{ "size": "Small", "icao": "YMAG", "iata": "", "city": "", "name": "Manangatang Airport", "runway": "", "lat": "-35.05", "long": "142.867" },
{ "size": "Small", "icao": "YLBO", "iata": "", "city": "", "name": "Lake Bolac Airport", "runway": "", "lat": "-37.683", "long": "142.883" },
{ "size": "Small", "icao": "YSLK", "iata": "", "city": "", "name": "Sea Lake Airport", "runway": "3400 ft", "lat": "-35.527", "long": "142.888" },
{ "size": "Small", "icao": "YPBH", "iata": "", "city": "", "name": "Peterborough Airport", "runway": "", "lat": "-38.6", "long": "142.917" },
{ "size": "Small", "icao": "YBIR", "iata": "", "city": "", "name": "BIRCHIP", "runway": "3422 ft", "lat": "-36", "long": "142.917" },
{ "size": "Small", "icao": "YBLH", "iata": "", "city": "", "name": "Bellalie Airport", "runway": "", "lat": "-27.033", "long": "142.95" },
{ "size": "Small", "icao": "YSVN", "iata": "", "city": "", "name": "Strathaven Airport", "runway": "", "lat": "-14.9", "long": "142.967" },
{ "size": "Small", "icao": "YYLD", "iata": "", "city": "", "name": "Yalda Downs Homestead Airport", "runway": "", "lat": "-30.261", "long": "142.977" },
{ "size": "Medium", "icao": "YARA", "iata": "ARY", "city": "", "name": "ARARAT", "runway": "4068 ft", "lat": "-37.309", "long": "142.989" },
{ "size": "Small", "icao": "YDOD", "iata": "", "city": "", "name": "DONALD", "runway": "3825 ft", "lat": "-36.36", "long": "143.007" },
{ "size": "Small", "icao": "YRAM", "iata": "", "city": "", "name": "Raymore Homestead Airport", "runway": "", "lat": "-26.15", "long": "143.017" },
{ "size": "Small", "icao": "YWAT", "iata": "", "city": "", "name": "Wattle Hills Airport", "runway": "", "lat": "-12.633", "long": "143.05" },
{ "size": "Small", "icao": "YCDE", "iata": "", "city": "", "name": "Cobden Airport", "runway": "", "lat": "-38.327", "long": "143.057" },
{ "size": "Small", "icao": "YJDA", "iata": "JUN", "city": "", "name": "Jundah Airport", "runway": "3000 ft", "lat": "-24.842", "long": "143.058" },
{ "size": "Small", "icao": "YCCT", "iata": "CNC", "city": "", "name": "Coconut Island Airport", "runway": "", "lat": "-10.05", "long": "143.07" },
{ "size": "Small", "icao": "YWHC", "iata": "", "city": "", "name": "White Cliffs Airport", "runway": "3000 ft", "lat": "-30.853", "long": "143.072" },
{ "size": "Small", "icao": "YSVH", "iata": "", "city": "", "name": "Silver Hills Airport", "runway": "", "lat": "-20.617", "long": "143.083" },
{ "size": "Medium", "icao": "YWTN", "iata": "WIN", "city": "", "name": "WINTON", "runway": "4600 ft", "lat": "-22.364", "long": "143.086" },
{ "size": "Small", "icao": "YNVE", "iata": "", "city": "", "name": "Navarre Airport", "runway": "", "lat": "-36.917", "long": "143.1" },
{ "size": "Medium", "icao": "YCOE", "iata": "CUQ", "city": "", "name": "COEN", "runway": "4107 ft", "lat": "-13.761", "long": "143.114" },
{ "size": "Small", "icao": "YRMD", "iata": "RCM", "city": "", "name": "RICHMOND", "runway": "5000 ft", "lat": "-20.702", "long": "143.115" },
{ "size": "Small", "icao": "YQUE", "iata": "", "city": "", "name": "Questa Park Airport", "runway": "", "lat": "-30.392", "long": "143.142" },
{ "size": "Small", "icao": "YKUW", "iata": "", "city": "", "name": "Kurweeton Airport", "runway": "", "lat": "-38.05", "long": "143.15" },
{ "size": "Small", "icao": "YABI", "iata": "ABG", "city": "", "name": "Abingdon Downs Airport", "runway": "", "lat": "-17.617", "long": "143.167" },
{ "size": "Small", "icao": "YMPH", "iata": "", "city": "", "name": "Mount Elephant Airport", "runway": "", "lat": "-37.9", "long": "143.167" },
{ "size": "Small", "icao": "YSTA", "iata": "", "city": "", "name": "SAINT ARNAUD", "runway": "3278 ft", "lat": "-36.637", "long": "143.186" },
{ "size": "Small", "icao": "YDER", "iata": "", "city": "", "name": "Derrinallum Airport", "runway": "", "lat": "-37.934", "long": "143.228" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Natya Airport", "runway": "", "lat": "-34.968", "long": "143.233" },
{ "size": "Small", "icao": "YMLN", "iata": "", "city": "", "name": "Monolon Airport", "runway": "", "lat": "-30.2", "long": "143.233" },
{ "size": "Small", "icao": "YWYF", "iata": "", "city": "", "name": "Wycheproof Airport", "runway": "3300 ft", "lat": "-36.058", "long": "143.243" },
{ "size": "Small", "icao": "YBEF", "iata": "", "city": "", "name": "Beaufort Airport", "runway": "", "lat": "-37.45", "long": "143.25" },
{ "size": "Small", "icao": "YEMG", "iata": "", "city": "", "name": "Eromanga Airport", "runway": "", "lat": "-26.7", "long": "143.267" },
{ "size": "Small", "icao": "YGGL", "iata": "", "city": "", "name": "Glen Garland Airport", "runway": "", "lat": "-14.867", "long": "143.283" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Moonambel Airfield", "runway": "", "lat": "-36.972", "long": "143.286" },
{ "size": "Small", "icao": "YCHL", "iata": "", "city": "", "name": "Charlton Airport", "runway": "", "lat": "-36.25", "long": "143.3" },
{ "size": "Small", "icao": "YSTO", "iata": "", "city": "", "name": "Stonehenge Airport", "runway": "3000 ft", "lat": "-24.358", "long": "143.3" },
{ "size": "Medium", "icao": "YLHR", "iata": "IRG", "city": "", "name": "LOCKHART RIVER", "runway": "4919 ft", "lat": "-12.787", "long": "143.305" },
{ "size": "Small", "icao": "YRAG", "iata": "", "city": "", "name": "Raglan Airport", "runway": "", "lat": "-37.377", "long": "143.306" },
{ "size": "Small", "icao": "YMMT", "iata": "", "city": "", "name": "Mount Margaret Airport", "runway": "", "lat": "-26.933", "long": "143.317" },
{ "size": "Small", "icao": "YCWN", "iata": "", "city": "", "name": "Corowa Downs Airport", "runway": "", "lat": "-26.467", "long": "143.35" },
{ "size": "Small", "icao": "YLSM", "iata": "", "city": "", "name": "Lismore Airport", "runway": "", "lat": "-37.933", "long": "143.35" },
{ "size": "Small", "icao": "YWCA", "iata": "WIO", "city": "", "name": "WILCANNIA", "runway": "3701 ft", "lat": "-31.526", "long": "143.375" },
{ "size": "Small", "icao": "YBOD", "iata": "", "city": "", "name": "Bodalla Airport", "runway": "", "lat": "-26.3", "long": "143.383" },
{ "size": "Small", "icao": "YSLN", "iata": "", "city": "", "name": "Strathleven Airport", "runway": "", "lat": "-15.898", "long": "143.383" },
{ "size": "Small", "icao": "YATR", "iata": "", "city": "", "name": "Amphitheatre Airport", "runway": "", "lat": "-37.183", "long": "143.4" },
{ "size": "Small", "icao": "YTRC", "iata": "", "city": "", "name": "Tarcombe Airport", "runway": "", "lat": "-24.083", "long": "143.4" },
{ "size": "Small", "icao": "YBFT", "iata": "", "city": "", "name": "Beaufort", "runway": "", "lat": "-37.495", "long": "143.43" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Trawalla Airport", "runway": "", "lat": "-37.439", "long": "143.459" },
{ "size": "Small", "icao": "YTHY", "iata": "TYG", "city": "", "name": "Thylungra Airport", "runway": "", "lat": "-26.083", "long": "143.467" },
{ "size": "Small", "icao": "YBWM", "iata": "BIP", "city": "", "name": "Bulimba Airport", "runway": "", "lat": "-16.881", "long": "143.479" },
{ "size": "Small", "icao": "YWED", "iata": "", "city": "", "name": "Wedderburn Airport", "runway": "", "lat": "-36.433", "long": "143.483" },
{ "size": "Small", "icao": "YKLN", "iata": "", "city": "", "name": "Killarney Airport", "runway": "", "lat": "-15.4", "long": "143.5" },
{ "size": "Small", "icao": "YMGV", "iata": "", "city": "", "name": "Musgrave Airport", "runway": "", "lat": "-14.783", "long": "143.5" },
{ "size": "Small", "icao": "YQBK", "iata": "", "city": "", "name": "Quambatook Airport", "runway": "", "lat": "-35.862", "long": "143.51" },
{ "size": "Small", "icao": "YCTY", "iata": "", "city": "", "name": "Cape Otway Airport", "runway": "", "lat": "-38.86", "long": "143.515" },
{ "size": "Small", "icao": "YLRN", "iata": "", "city": "", "name": "Lorraine Station Airport", "runway": "", "lat": "-22.533", "long": "143.517" },
{ "size": "Small", "icao": "YGTN", "iata": "GTT", "city": "", "name": "GEORGETOWN", "runway": "3799 ft", "lat": "-18.305", "long": "143.53" },
{ "size": "Medium", "icao": "YSWH", "iata": "SWH", "city": "", "name": "SWAN HILL", "runway": "4905 ft", "lat": "-35.376", "long": "143.533" },
{ "size": "Small", "icao": "YBTD", "iata": "", "city": "", "name": "Brighton Downs Airport", "runway": "", "lat": "-23.35", "long": "143.533" },
{ "size": "Small", "icao": "YPIN", "iata": "", "city": "", "name": "Pinnacle Airport", "runway": "", "lat": "-15.667", "long": "143.55" },
{ "size": "Small", "icao": "YFSA", "iata": "", "city": "", "name": "Forsayth Airport", "runway": "", "lat": "-18.585", "long": "143.569" },
{ "size": "Medium", "icao": "YBRN", "iata": "BZD", "city": "", "name": "BALRANALD", "runway": "3888 ft", "lat": "-34.624", "long": "143.578" },
{ "size": "Small", "icao": "YDNK", "iata": "", "city": "", "name": "Darnick Airport", "runway": "", "lat": "-32.883", "long": "143.583" },
{ "size": "Small", "icao": "YNOO", "iata": "", "city": "", "name": "Nooyeah Downs Airport", "runway": "", "lat": "-28.05", "long": "143.583" },
{ "size": "Small", "icao": "YVVL", "iata": "", "city": "", "name": "Violet Vale Airport", "runway": "", "lat": "-14.733", "long": "143.583" },
{ "size": "Small", "icao": "YDAG", "iata": "", "city": "", "name": "Dagworth Airport", "runway": "", "lat": "-17.942", "long": "143.588" },
{ "size": "Small", "icao": "YAPO", "iata": "", "city": "", "name": "Apollo Bay Airport", "runway": "", "lat": "-38.775", "long": "143.661" },
{ "size": "Small", "icao": "YGAM", "iata": "GBP", "city": "", "name": "Gamboola Airport", "runway": "", "lat": "-16.55", "long": "143.667" },
{ "size": "Small", "icao": "YLLV", "iata": "", "city": "", "name": "Lily Vale Airport", "runway": "", "lat": "-14.483", "long": "143.667" },
{ "size": "Small", "icao": "YTVA", "iata": "", "city": "", "name": "Talavera Airport", "runway": "", "lat": "-19.217", "long": "143.667" },
{ "size": "Small", "icao": "YWNS", "iata": "", "city": "", "name": "Wandsworth Airport", "runway": "", "lat": "-25.05", "long": "143.667" },
{ "size": "Small", "icao": "YOLA", "iata": "XCO", "city": "", "name": "Colac Airport", "runway": "", "lat": "-38.287", "long": "143.68" },
{ "size": "Small", "icao": "YDLL", "iata": "", "city": "", "name": "Dunolly Airport", "runway": "", "lat": "-36.85", "long": "143.7" },
{ "size": "Small", "icao": "YNVL", "iata": "", "city": "", "name": "Normanville Airport", "runway": "", "lat": "-35.783", "long": "143.7" },
{ "size": "Small", "icao": "YNVR", "iata": "", "city": "", "name": "Navarra Airport", "runway": "", "lat": "-24.85", "long": "143.7" },
{ "size": "Small", "icao": "YMBU", "iata": "", "city": "", "name": "MARYBOROUGH", "runway": "3414 ft", "lat": "-37.033", "long": "143.709" },
{ "size": "Small", "icao": "YROB", "iata": "ROH", "city": "", "name": "Robinhood Airport", "runway": "", "lat": "-18.845", "long": "143.71" },
{ "size": "Small", "icao": "YRKE", "iata": "", "city": "", "name": "Kuruc-A-Ruc South Airport", "runway": "", "lat": "-37.9", "long": "143.717" },
{ "size": "Small", "icao": "YBBT", "iata": "", "city": "", "name": "Boort Airport", "runway": "", "lat": "-36.137", "long": "143.727" },
{ "size": "Small", "icao": "YMYY", "iata": "", "city": "", "name": "Mary Valley Airport", "runway": "", "lat": "-15.05", "long": "143.75" },
{ "size": "Closed", "icao": "YYWE", "iata": "", "city": "", "name": "Yarrowee Airport", "runway": "", "lat": "-37.74", "long": "143.753" },
{ "size": "Small", "icao": "YBGT", "iata": "", "city": "", "name": "Budgerygar Airport", "runway": "", "lat": "-25.37", "long": "143.773" },
{ "size": "Small", "icao": "YBLT", "iata": "", "city": "", "name": "BALLARAT", "runway": "4150 ft", "lat": "-37.512", "long": "143.791" },
{ "size": "Small", "icao": "YBUX", "iata": "", "city": "", "name": "Bulleringa Airport", "runway": "", "lat": "-17.65", "long": "143.8" },
{ "size": "Small", "icao": "YLLR", "iata": "", "city": "", "name": "Lake Leagur Airport", "runway": "", "lat": "-35.983", "long": "143.8" },
{ "size": "Medium", "icao": "YTGM", "iata": "XTG", "city": "", "name": "THARGOMINDAH", "runway": "4800 ft", "lat": "-27.986", "long": "143.811" },
{ "size": "Small", "icao": "YKLG", "iata": "", "city": "", "name": "Kalinga Airport", "runway": "", "lat": "-15.2", "long": "143.85" },
{ "size": "Medium", "icao": "YKII", "iata": "KNS", "city": "", "name": "KING ISLAND", "runway": "5198 ft", "lat": "-39.877", "long": "143.878" },
{ "size": "Small", "icao": "YMNO", "iata": "", "city": "", "name": "Maneroo Airport", "runway": "", "lat": "-23.367", "long": "143.883" },
{ "size": "Small", "icao": "YTII", "iata": "", "city": "", "name": "Trinidad Airport", "runway": "", "lat": "-25.6", "long": "143.917" },
{ "size": "Medium", "icao": "YKER", "iata": "KRA", "city": "", "name": "KERANG", "runway": "3501 ft", "lat": "-35.751", "long": "143.939" },
{ "size": "Small", "icao": "YCLA", "iata": "", "city": "", "name": "Clare Station Airport", "runway": "", "lat": "-33.407", "long": "143.94" },
{ "size": "Small", "icao": "YBGR", "iata": "", "city": "", "name": "Bridgewater Airport", "runway": "", "lat": "-36.617", "long": "143.95" },
{ "size": "Small", "icao": "YWMP", "iata": "WPK", "city": "", "name": "Wrotham Park Airport", "runway": "", "lat": "-16.658", "long": "144.002" },
{ "size": "Closed", "icao": "YEDH", "iata": "", "city": "", "name": "Meredith Airport", "runway": "", "lat": "-37.883", "long": "144.083" },
{ "size": "Small", "icao": "YLED", "iata": "", "city": "", "name": "Lethbridge Park Airport", "runway": "", "lat": "-37.919", "long": "144.101" },
{ "size": "Small", "icao": "YPYD", "iata": "", "city": "", "name": "Pyramid Hill Airport", "runway": "", "lat": "-36.067", "long": "144.133" },
{ "size": "Small", "icao": "YPRA", "iata": "", "city": "", "name": "Prairie Airport", "runway": "", "lat": "-36.307", "long": "144.139" },
{ "size": "Small", "icao": "YOIT", "iata": "", "city": "", "name": "Orielton Airport", "runway": "", "lat": "-22.067", "long": "144.15" },
{ "size": "Small", "icao": "YCAL", "iata": "", "city": "", "name": "Castlemaine Airport", "runway": "", "lat": "-37.133", "long": "144.167" },
{ "size": "Small", "icao": "YWAG", "iata": "", "city": "", "name": "Wanaaring Airport", "runway": "", "lat": "-29.717", "long": "144.167" },
{ "size": "Small", "icao": "YKID", "iata": "", "city": "", "name": "Kidston Airport", "runway": "3000 ft", "lat": "-18.87", "long": "144.173" },
{ "size": "Small", "icao": "YBWR", "iata": "", "city": "", "name": "Bolwarra Airport", "runway": "", "lat": "-17.4", "long": "144.183" },
{ "size": "Small", "icao": "YWOV", "iata": "", "city": "", "name": "Woodvale Airport", "runway": "", "lat": "-36.633", "long": "144.183" },
{ "size": "Small", "icao": "YCOH", "iata": "", "city": "", "name": "Cohuna Airport", "runway": "", "lat": "-35.817", "long": "144.2" },
{ "size": "Small", "icao": "YKPR", "iata": "", "city": "", "name": "Kalpowar Airport", "runway": "", "lat": "-14.9", "long": "144.2" },
{ "size": "Small", "icao": "YLFD", "iata": "", "city": "", "name": "Lakefield Airport", "runway": "", "lat": "-14.933", "long": "144.2" },
{ "size": "Small", "icao": "YHUG", "iata": "HGD", "city": "", "name": "HUGHENDEN", "runway": "5394 ft", "lat": "-20.815", "long": "144.225" },
{ "size": "Medium", "icao": "YQLP", "iata": "ULP", "city": "", "name": "QUILPIE", "runway": "4898 ft", "lat": "-26.612", "long": "144.253" },
{ "size": "Small", "icao": "YCES", "iata": "", "city": "", "name": "Ceres Airport", "runway": "", "lat": "-38.148", "long": "144.258" },
{ "size": "Small", "icao": "YJWB", "iata": "", "city": "", "name": "Jowalbinna Airport", "runway": "", "lat": "-15.733", "long": "144.267" },
{ "size": "Small", "icao": "YALH", "iata": "", "city": "", "name": "Albilbah Airport", "runway": "", "lat": "-24.7", "long": "144.283" },
{ "size": "Small", "icao": "YRWH", "iata": "", "city": "", "name": "Ravensworth Airport", "runway": "", "lat": "-34.633", "long": "144.283" },
{ "size": "Small", "icao": "YMSP", "iata": "", "city": "", "name": "Mount Surprise Airport", "runway": "", "lat": "-18.126", "long": "144.285" },
{ "size": "Small", "icao": "YIVO", "iata": "", "city": "", "name": "IVANHOE", "runway": "4088 ft", "lat": "-32.883", "long": "144.31" },
{ "size": "Small", "icao": "YCPN", "iata": "", "city": "", "name": "Carpentaria Downs Airport", "runway": "", "lat": "-18.717", "long": "144.317" },
{ "size": "Small", "icao": "YBDG", "iata": "BXG", "city": "", "name": "BENDIGO", "runway": "3724 ft", "lat": "-36.739", "long": "144.33" },
{ "size": "Small", "icao": "YLVB", "iata": "", "city": "", "name": "Lovely Banks Airport", "runway": "", "lat": "-38.033", "long": "144.333" },
{ "size": "Small", "icao": "YNOR", "iata": "", "city": "", "name": "Norwood Airport", "runway": "", "lat": "-34.25", "long": "144.333" },
{ "size": "Small", "icao": "YGLG", "iata": "GEX", "city": "", "name": "Geelong Airport", "runway": "", "lat": "-38.225", "long": "144.333" },
{ "size": "Small", "icao": "YDNV", "iata": "", "city": "", "name": "Dynevor Downs Airport", "runway": "", "lat": "-28.1", "long": "144.35" },
{ "size": "Small", "icao": "YLRS", "iata": "LUT", "city": "", "name": "New Laura Airport", "runway": "", "lat": "-15.183", "long": "144.367" },
{ "size": "Small", "icao": "YGBW", "iata": "", "city": "", "name": "Gunbower Airport", "runway": "", "lat": "-35.967", "long": "144.383" },
{ "size": "Small", "icao": "YGGS", "iata": "", "city": "", "name": "Gregory Springs Airport", "runway": "", "lat": "-19.717", "long": "144.383" },
{ "size": "Small", "icao": "YJNY", "iata": "", "city": "", "name": "Jonroy Airport", "runway": "", "lat": "-16.5", "long": "144.4" },
{ "size": "Small", "icao": "YBSS", "iata": "", "city": "", "name": "Bacchus Marsh Airport", "runway": "", "lat": "-37.733", "long": "144.422" },
{ "size": "Small", "icao": "YISF", "iata": "ISI", "city": "", "name": "ISISFORD", "runway": "4498 ft", "lat": "-24.258", "long": "144.425" },
{ "size": "Small", "icao": "YBRS", "iata": "", "city": "", "name": "Barwon Heads Airport", "runway": "", "lat": "-38.258", "long": "144.428" },
{ "size": "Small", "icao": "TCYT", "iata": "", "city": "", "name": "Crystal Brook Airport", "runway": "", "lat": "-17.45", "long": "144.45" },
{ "size": "Small", "icao": "YCYT", "iata": "", "city": "", "name": "Crystal Brook Airport", "runway": "", "lat": "-17.383", "long": "144.45" },
{ "size": "Small", "icao": "YHRD", "iata": "", "city": "", "name": "Hungerford Airport", "runway": "", "lat": "-28.983", "long": "144.45" },
{ "size": "Small", "icao": "YLRA", "iata": "LUU", "city": "", "name": "Laura Airport", "runway": "", "lat": "-15.55", "long": "144.45" },
{ "size": "Small", "icao": "YKTA", "iata": "", "city": "", "name": "Kotta Airport", "runway": "", "lat": "-36.18", "long": "144.525" },
{ "size": "Small", "icao": "YCGO", "iata": "LLG", "city": "", "name": "CHILLAGOE", "runway": "3218 ft", "lat": "-17.143", "long": "144.529" },
{ "size": "Small", "icao": "YTRB", "iata": "", "city": "", "name": "Torrumbarry Airport", "runway": "", "lat": "-36.067", "long": "144.533" },
{ "size": "Small", "icao": "YMTB", "iata": "UTB", "city": "", "name": "Muttaburra Airport", "runway": "3000 ft", "lat": "-22.583", "long": "144.533" },
{ "size": "Small", "icao": "YAVM", "iata": "", "city": "", "name": "Avonmore Airport", "runway": "", "lat": "-36.567", "long": "144.55" },
{ "size": "Small", "icao": "YSPK", "iata": "SCG", "city": "", "name": "Spring Creek Airport", "runway": "", "lat": "-18.633", "long": "144.567" },
{ "size": "Small", "icao": "YUDA", "iata": "UDA", "city": "", "name": "Undara Airport", "runway": "", "lat": "-18.2", "long": "144.6" },
{ "size": "Small", "icao": "YISD", "iata": "", "city": "", "name": "Isis Downs Airport", "runway": "", "lat": "-24.217", "long": "144.617" },
{ "size": "Small", "icao": "YYWA", "iata": "", "city": "", "name": "Yowah Airport", "runway": "", "lat": "-27.933", "long": "144.617" },
{ "size": "Small", "icao": "YBEW", "iata": "", "city": "", "name": "Beechworth Airport", "runway": "", "lat": "-31.917", "long": "144.633" },
{ "size": "Small", "icao": "YBMM", "iata": "", "city": "", "name": "Bamawm Airport", "runway": "", "lat": "-36.25", "long": "144.633" },
{ "size": "Small", "icao": "YOTN", "iata": "", "city": "", "name": "Ootann Airport", "runway": "", "lat": "-17.433", "long": "144.633" },
{ "size": "Small", "icao": "YELM", "iata": "", "city": "", "name": "Elmore Airport", "runway": "", "lat": "-36.49", "long": "144.647" },
{ "size": "Small", "icao": "YSLE", "iata": "", "city": "", "name": "St Leonards Airfield", "runway": "", "lat": "-38.17", "long": "144.689" },
{ "size": "Small", "icao": "YMDW", "iata": "", "city": "", "name": "Maitland Downs Airport", "runway": "", "lat": "-16.223", "long": "144.703" },
{ "size": "Small", "icao": "YHTR", "iata": "", "city": "", "name": "Hunter Island Airport", "runway": "", "lat": "-40.517", "long": "144.733" },
{ "size": "Small", "icao": "YCJU", "iata": "", "city": "", "name": "Conjuboy Airport", "runway": "", "lat": "-18.683", "long": "144.75" },
{ "size": "Medium", "icao": "YECH", "iata": "ECH", "city": "", "name": "ECHUCA", "runway": "3615 ft", "lat": "-36.157", "long": "144.762" },
{ "size": "Medium", "icao": "YHAY", "iata": "HXX", "city": "", "name": "HAY", "runway": "4800 ft", "lat": "-34.531", "long": "144.83" },
{ "size": "Small", "icao": "YWDT", "iata": "", "city": "", "name": "Wyandotte Airport", "runway": "", "lat": "-18.75", "long": "144.833" },
{ "size": "Small", "icao": "YLND", "iata": "", "city": "", "name": "Lakeland Airport", "runway": "", "lat": "-15.833", "long": "144.85" },
{ "size": "Small", "icao": "YSPF", "iata": "", "city": "", "name": "Springfield Airport", "runway": "", "lat": "-24.3", "long": "144.883" },
{ "size": "Small", "icao": "YBFR", "iata": "", "city": "", "name": "Balfour Airport", "runway": "", "lat": "-41.259", "long": "144.886" },
{ "size": "Small", "icao": "YWDV", "iata": "", "city": "", "name": "Wandovale Airport", "runway": "", "lat": "-19.667", "long": "144.9" },
{ "size": "Medium", "icao": "YMEN", "iata": "MEB", "city": "", "name": "MELBOURNE ESSENDON", "runway": "6302 ft", "lat": "-37.728", "long": "144.902" },
{ "size": "Medium", "icao": "YDLQ", "iata": "DNQ", "city": "", "name": "DENILIQUIN", "runway": "3999 ft", "lat": "-35.559", "long": "144.946" },
{ "size": "Closed", "icao": "YWAN", "iata": "", "city": "", "name": "Wallan Airport", "runway": "", "lat": "-37.433", "long": "144.988" },
{ "size": "Small", "icao": "YLKD", "iata": "", "city": "", "name": "Lucky Downs Airport", "runway": "", "lat": "-18.917", "long": "145" },
{ "size": "Small", "icao": "YTCK", "iata": "", "city": "", "name": "Torrens Creek Airport", "runway": "", "lat": "-20.783", "long": "145" },
{ "size": "Small", "icao": "YEUO", "iata": "", "city": "", "name": "Eulo Airport", "runway": "3000 ft", "lat": "-28.167", "long": "145.042" },
{ "size": "Small", "icao": "YPKL", "iata": "", "city": "", "name": "Puckapunyal (Military) Airport", "runway": "2600 ft", "lat": "-37", "long": "145.063" },
{ "size": "Small", "icao": "YBNC", "iata": "", "city": "", "name": "Bannockburn Airport", "runway": "", "lat": "-21.8", "long": "145.083" },
{ "size": "Small", "icao": "YDIM", "iata": "", "city": "", "name": "Dimbulah Airport", "runway": "", "lat": "-17.133", "long": "145.083" },
{ "size": "Medium", "icao": "YSMI", "iata": "SIO", "city": "", "name": "SMITHTON", "runway": "5246 ft", "lat": "-40.835", "long": "145.084" },
{ "size": "Small", "icao": "YVLG", "iata": "", "city": "", "name": "Valley of Lagoons Airport", "runway": "", "lat": "-18.667", "long": "145.1" },
{ "size": "Small", "icao": "YWEC", "iata": "", "city": "", "name": "Wellclose Airport", "runway": "", "lat": "-25.85", "long": "145.1" },
{ "size": "Small", "icao": "YCNO", "iata": "", "city": "", "name": "Conargo Airport", "runway": "", "lat": "-35.317", "long": "145.117" },
{ "size": "Small", "icao": "YGNV", "iata": "GVP", "city": "", "name": "Greenvale Airport", "runway": "", "lat": "-18.983", "long": "145.117" },
{ "size": "Small", "icao": "YNGB", "iata": "", "city": "", "name": "Nagambie Airport", "runway": "", "lat": "-36.738", "long": "145.125" },
{ "size": "Small", "icao": "YGHG", "iata": "", "city": "", "name": "Glen Harding Airport", "runway": "", "lat": "-18.267", "long": "145.133" },
{ "size": "Small", "icao": "YMRT", "iata": "", "city": "", "name": "Mount Garnet Airport", "runway": "", "lat": "-17.7", "long": "145.15" },
{ "size": "Small", "icao": "YGUW", "iata": "", "city": "", "name": "Gunnawarra Airport", "runway": "", "lat": "-17.95", "long": "145.167" },
{ "size": "Small", "icao": "YMLK", "iata": "", "city": "", "name": "Minnamoolka Airport", "runway": "", "lat": "-18.183", "long": "145.167" },
{ "size": "Small", "icao": "YMNG", "iata": "", "city": "", "name": "MANGALORE", "runway": "6650 ft", "lat": "-36.888", "long": "145.184" },
{ "size": "Medium", "icao": "YCKN", "iata": "CTN", "city": "", "name": "COOKTOWN", "runway": "5338 ft", "lat": "-15.445", "long": "145.184" },
{ "size": "Small", "icao": "YCWS", "iata": "", "city": "", "name": "Cowes Airport", "runway": "", "lat": "-38.508", "long": "145.213" },
{ "size": "Small", "icao": "YAMC", "iata": "AXC", "city": "", "name": "Aramac Airport", "runway": "3000 ft", "lat": "-22.967", "long": "145.242" },
{ "size": "Small", "icao": "YSRN", "iata": "SRN", "city": "", "name": "Strahan Airport", "runway": "4000 ft", "lat": "-42.155", "long": "145.292" },
{ "size": "Small", "icao": "YCFL", "iata": "", "city": "", "name": "Cape Flattery Airport", "runway": "", "lat": "-14.967", "long": "145.3" },
{ "size": "Small", "icao": "YNHE", "iata": "", "city": "", "name": "Newhaven Airport", "runway": "", "lat": "-38.533", "long": "145.317" },
{ "size": "Small", "icao": "YYEA", "iata": "", "city": "", "name": "Yeaburn Airport", "runway": "", "lat": "-37.173", "long": "145.322" },
{ "size": "Small", "icao": "YBMD", "iata": "", "city": "", "name": "Bloomfield River Airport", "runway": "", "lat": "-15.9", "long": "145.333" },
{ "size": "Small", "icao": "YYAK", "iata": "", "city": "", "name": "Yalkulka Airport", "runway": "", "lat": "-16.733", "long": "145.333" },
{ "size": "Small", "icao": "YLCS", "iata": "", "city": "", "name": "Locksley Field", "runway": "3000 ft", "lat": "-36.815", "long": "145.348" },
{ "size": "Small", "icao": "YZHN", "iata": "", "city": "", "name": "Zeehan Airport", "runway": "", "lat": "-41.883", "long": "145.35" },
{ "size": "Small", "icao": "YLIL", "iata": "", "city": "", "name": "Lilydale Airport", "runway": "", "lat": "-37.692", "long": "145.367" },
{ "size": "Medium", "icao": "YSHT", "iata": "SHT", "city": "", "name": "SHEPPARTON", "runway": "4062 ft", "lat": "-36.429", "long": "145.393" },
{ "size": "Small", "icao": "YGRU", "iata": "", "city": "", "name": "Glen Ruth Airport", "runway": "", "lat": "-18.083", "long": "145.4" },
{ "size": "Small", "icao": "YHTN", "iata": "", "city": "", "name": "Herberton Airport", "runway": "", "lat": "-17.433", "long": "145.4" },
{ "size": "Medium", "icao": "YMBA", "iata": "MRG", "city": "", "name": "MAREEBA", "runway": "4938 ft", "lat": "-17.069", "long": "145.419" },
{ "size": "Small", "icao": "YCBY", "iata": "", "city": "", "name": "Daintree Airport", "runway": "", "lat": "-16.219", "long": "145.425" },
{ "size": "Small", "icao": "YTDN", "iata": "", "city": "", "name": "Tooradin Airport", "runway": "", "lat": "-38.217", "long": "145.427" },
{ "size": "Small", "icao": "YLZR", "iata": "", "city": "", "name": "Lizard Island Airport", "runway": "", "lat": "-14.683", "long": "145.45" },
{ "size": "Small", "icao": "YLZI", "iata": "LZR", "city": "", "name": "LIZARD ISLAND", "runway": "3038 ft", "lat": "-14.667", "long": "145.45" },
{ "size": "Small", "icao": "YLOD", "iata": "", "city": "", "name": "Longwood Airport", "runway": "", "lat": "-36.808", "long": "145.457" },
{ "size": "Small", "icao": "YCMK", "iata": "", "city": "", "name": "Camel Creek Airport", "runway": "", "lat": "-18.85", "long": "145.467" },
{ "size": "Small", "icao": "YHLS", "iata": "", "city": "", "name": "HILLSTON", "runway": "4262 ft", "lat": "-33.493", "long": "145.523" },
{ "size": "Small", "icao": "YQNS", "iata": "UEE", "city": "", "name": "Queenstown Airport", "runway": "4100 ft", "lat": "-42.075", "long": "145.532" },
{ "size": "Small", "icao": "YWRT", "iata": "", "city": "", "name": "Waratah Airport", "runway": "", "lat": "-41.45", "long": "145.55" },
{ "size": "Small", "icao": "YFIL", "iata": "FLY", "city": "", "name": "Finley Airport", "runway": "", "lat": "-35.667", "long": "145.55" },
{ "size": "Small", "icao": "YBYW", "iata": "", "city": "", "name": "Bayswater Airport", "runway": "", "lat": "-25.45", "long": "145.583" },
{ "size": "Small", "icao": "YTOB", "iata": "", "city": "", "name": "Toomba Airport", "runway": "", "lat": "-19.933", "long": "145.583" },
{ "size": "Small", "icao": "YTOC", "iata": "TCW", "city": "", "name": "TOCUMWAL", "runway": "4596 ft", "lat": "-35.812", "long": "145.608" },
{ "size": "Medium", "icao": "YCMU", "iata": "CMA", "city": "", "name": "CUNNAMULLA", "runway": "5686 ft", "lat": "-28.03", "long": "145.622" },
{ "size": "Small", "icao": "YWON", "iata": "", "city": "", "name": "Wonthaggi Airport", "runway": "", "lat": "-38.472", "long": "145.623" },
{ "size": "Small", "icao": "YWDS", "iata": "", "city": "", "name": "Woodside Au Airport", "runway": "", "lat": "-35.133", "long": "145.667" },
{ "size": "Small", "icao": "YTGG", "iata": "", "city": "", "name": "Taggerty Airport", "runway": "", "lat": "-37.35", "long": "145.7" },
{ "size": "Small", "icao": "YGGI", "iata": "", "city": "", "name": "Goolgowi Airport", "runway": "", "lat": "-34", "long": "145.717" },
{ "size": "Small", "icao": "YELS", "iata": "", "city": "", "name": "Earlston Airport", "runway": "", "lat": "-36.596", "long": "145.722" },
{ "size": "Small", "icao": "YJER", "iata": "", "city": "", "name": "Jerilderie Airport", "runway": "", "lat": "-35.37", "long": "145.725" },
{ "size": "Small", "icao": "YSBG", "iata": "", "city": "", "name": "Strathbogie Airport", "runway": "", "lat": "-36.855", "long": "145.738" },
{ "size": "Small", "icao": "YBUP", "iata": "", "city": "", "name": "Bunyip Airport", "runway": "", "lat": "-38.017", "long": "145.75" },
{ "size": "Small", "icao": "YLLD", "iata": "", "city": "", "name": "Langlo Downs Airport", "runway": "", "lat": "-25.533", "long": "145.767" },
{ "size": "Small", "icao": "YNMN", "iata": "", "city": "", "name": "New Moon Airport", "runway": "", "lat": "-19.2", "long": "145.767" },
{ "size": "Small", "icao": "YLOY", "iata": "", "city": "", "name": "Longwarry Airport", "runway": "", "lat": "-38.108", "long": "145.778" },
{ "size": "Medium", "icao": "YCBA", "iata": "CAZ", "city": "", "name": "COBAR", "runway": "4984 ft", "lat": "-31.538", "long": "145.794" },
{ "size": "Small", "icao": "YHLG", "iata": "", "city": "", "name": "Hillgrove Airport", "runway": "", "lat": "-19.642", "long": "145.797" },
{ "size": "Small", "icao": "YEGA", "iata": "", "city": "", "name": "Engonnia Airport", "runway": "", "lat": "-29.317", "long": "145.833" },
{ "size": "Small", "icao": "YELW", "iata": "", "city": "", "name": "Eildon Weir Airport", "runway": "", "lat": "-37.208", "long": "145.833" },
{ "size": "Small", "icao": "YBTS", "iata": "", "city": "", "name": "Battery Downs Airport", "runway": "", "lat": "-19.433", "long": "145.85" },
{ "size": "Small", "icao": "YCLY", "iata": "", "city": "", "name": "Coleambally Airport", "runway": "", "lat": "-34.8", "long": "145.85" },
{ "size": "Small", "icao": "YLEG", "iata": "", "city": "", "name": "LEONGATHA", "runway": "3032 ft", "lat": "-38.493", "long": "145.86" },
{ "size": "Small", "icao": "YBUI", "iata": "", "city": "", "name": "Burnie Airport", "runway": "", "lat": "-41.049", "long": "145.88" },
{ "size": "Small", "icao": "YRSV", "iata": "", "city": "", "name": "Rosevale Resort Airport", "runway": "", "lat": "-27.133", "long": "145.9" },
{ "size": "Small", "icao": "YTUY", "iata": "", "city": "", "name": "Tully Airport", "runway": "", "lat": "-17.933", "long": "145.917" },
{ "size": "Medium", "icao": "YBKE", "iata": "BRK", "city": "", "name": "BOURKE", "runway": "6004 ft", "lat": "-30.039", "long": "145.952" },
{ "size": "Small", "icao": "YOKE", "iata": "", "city": "", "name": "Oakvale Airport", "runway": "", "lat": "-22.267", "long": "145.983" },
{ "size": "Small", "icao": "YWYA", "iata": "", "city": "", "name": "Wyandra Airport", "runway": "3000 ft", "lat": "-27.267", "long": "145.99" },
{ "size": "Medium", "icao": "YBLA", "iata": "BLN", "city": "", "name": "BENALLA", "runway": "3422 ft", "lat": "-36.552", "long": "146.007" },
{ "size": "Small", "icao": "YIFL", "iata": "IFL", "city": "", "name": "INNISFAIL", "runway": "4439 ft", "lat": "-17.559", "long": "146.012" },
{ "size": "Small", "icao": "YYWG", "iata": "", "city": "", "name": "YARRAWONGA", "runway": "3750 ft", "lat": "-36.029", "long": "146.029" },
{ "size": "Small", "icao": "YWRE", "iata": "", "city": "", "name": "Wirralie Airport", "runway": "", "lat": "-22.27", "long": "146.05" },
{ "size": "Small", "icao": "YFCK", "iata": "", "city": "", "name": "Fish Creek Airport", "runway": "", "lat": "-38.715", "long": "146.053" },
{ "size": "Small", "icao": "YTNS", "iata": "", "city": "", "name": "Toliness Airport", "runway": "", "lat": "-25.321", "long": "146.069" },
{ "size": "Small", "icao": "YMFD", "iata": "", "city": "", "name": "Mansfield Airport", "runway": "", "lat": "-37.067", "long": "146.117" },
{ "size": "Small", "icao": "YDKI", "iata": "DKI", "city": "", "name": "Dunk Island Airport", "runway": "", "lat": "-17.942", "long": "146.14" },
{ "size": "Small", "icao": "YNDS", "iata": "", "city": "", "name": "Natal Downs Airport", "runway": "", "lat": "-21.083", "long": "146.15" },
{ "size": "Small", "icao": "YIGM", "iata": "IGH", "city": "", "name": "INGHAM", "runway": "5006 ft", "lat": "-18.661", "long": "146.152" },
{ "size": "Small", "icao": "YBHB", "iata": "", "city": "", "name": "Bathurst Harbour Airport", "runway": "", "lat": "-43.421", "long": "146.156" },
{ "size": "Small", "icao": "YJRO", "iata": "", "city": "", "name": "Jericho Airport", "runway": "", "lat": "-23.583", "long": "146.167" },
{ "size": "Small", "icao": "YDAL", "iata": "", "city": "", "name": "Dallas Airport", "runway": "", "lat": "-34.567", "long": "146.183" },
{ "size": "Small", "icao": "YDNB", "iata": "", "city": "", "name": "Doongmabulla Airport", "runway": "", "lat": "-22.067", "long": "146.233" },
{ "size": "Small", "icao": "YLSS", "iata": "", "city": "", "name": "Lansdowne Airport", "runway": "", "lat": "-25.05", "long": "146.267" },
{ "size": "Small", "icao": "YCHT", "iata": "CXT", "city": "", "name": "CHARTERS TOWERS", "runway": "5695 ft", "lat": "-20.043", "long": "146.273" },
{ "size": "Small", "icao": "YTMB", "iata": "", "city": "", "name": "Tambo Airport", "runway": "", "lat": "-24.85", "long": "146.283" },
{ "size": "Medium", "icao": "YWGT", "iata": "WGT", "city": "", "name": "WANGARATTA", "runway": "5381 ft", "lat": "-36.416", "long": "146.307" },
{ "size": "Small", "icao": "YNYM", "iata": "", "city": "", "name": "Nymagee Airport", "runway": "", "lat": "-32.05", "long": "146.317" },
{ "size": "Small", "icao": "YTDL", "iata": "", "city": "", "name": "Tidal River Airport", "runway": "", "lat": "-39.034", "long": "146.327" },
{ "size": "Small", "icao": "YLPR", "iata": "", "city": "", "name": "Lake Pedder Airport", "runway": "", "lat": "-43.05", "long": "146.333" },
{ "size": "Small", "icao": "YMLC", "iata": "", "city": "", "name": "Mole Creek Airport", "runway": "", "lat": "-41.533", "long": "146.333" },
{ "size": "Medium", "icao": "YCOR", "iata": "CWW", "city": "", "name": "COROWA", "runway": "5994 ft", "lat": "-35.995", "long": "146.357" },
{ "size": "Small", "icao": "YLCG", "iata": "", "city": "", "name": "Lake Cargelligo Airport", "runway": "3900 ft", "lat": "-33.278", "long": "146.37" },
{ "size": "Small", "icao": "YBYR", "iata": "", "city": "", "name": "Byrock Airport", "runway": "", "lat": "-30.667", "long": "146.4" },
{ "size": "Small", "icao": "YWLP", "iata": "", "city": "", "name": "Wilsons Promontory Airport", "runway": "", "lat": "-39.131", "long": "146.425" },
{ "size": "Small", "icao": "YEAT", "iata": "", "city": "", "name": "Yea Airport", "runway": "", "lat": "-37.216", "long": "146.43" },
{ "size": "Small", "icao": "YILA", "iata": "", "city": "", "name": "Milawa Vineyard Airport", "runway": "", "lat": "-36.45", "long": "146.433" },
{ "size": "Small", "icao": "YLEE", "iata": "", "city": "", "name": "Leeton Airport", "runway": "", "lat": "-34.5", "long": "146.433" },
{ "size": "Small", "icao": "YEAB", "iata": "", "city": "", "name": "Euabalong Airport", "runway": "", "lat": "-33.117", "long": "146.45" },
{ "size": "Medium", "icao": "YLTV", "iata": "LTB", "city": "", "name": "LATROBE VALLEY", "runway": "4692 ft", "lat": "-38.207", "long": "146.47" },
{ "size": "Small", "icao": "YMCS", "iata": "", "city": "", "name": "Macrossan Airport", "runway": "", "lat": "-20.017", "long": "146.483" },
{ "size": "Small", "icao": "YLHL", "iata": "", "city": "", "name": "Long Hill Airport", "runway": "", "lat": "-41.333", "long": "146.5" },
{ "size": "Small", "icao": "YPAM", "iata": "PMK", "city": "", "name": "PALM ISLAND", "runway": "3714 ft", "lat": "-18.755", "long": "146.581" },
{ "size": "Medium", "icao": "YAPH", "iata": "ABH", "city": "", "name": "ALPHA", "runway": "4777 ft", "lat": "-23.646", "long": "146.584" },
{ "size": "Small", "icao": "YAUA", "iata": "", "city": "", "name": "Augathella Airport", "runway": "", "lat": "-25.755", "long": "146.587" },
{ "size": "Small", "icao": "YHVH", "iata": "", "city": "", "name": "Harvest Home Airport", "runway": "", "lat": "-20.683", "long": "146.65" },
{ "size": "Small", "icao": "YLGL", "iata": "", "city": "", "name": "Laglan Airport", "runway": "", "lat": "-22.5", "long": "146.667" },
{ "size": "Small", "icao": "YBCH", "iata": "", "city": "", "name": "Beechworth Airport", "runway": "", "lat": "-36.393", "long": "146.696" },
{ "size": "Small", "icao": "YTWE", "iata": "", "city": "", "name": "Trelawney Airport", "runway": "", "lat": "-22.85", "long": "146.717" },
{ "size": "Small", "icao": "YYRM", "iata": "", "city": "", "name": "Yarram Airport", "runway": "3500 ft", "lat": "-38.567", "long": "146.755" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Snowy Range Airfield", "runway": "", "lat": "-37.349", "long": "146.766" },
{ "size": "Small", "icao": "YMPE", "iata": "", "city": "", "name": "Mount Cooper Airport", "runway": "", "lat": "-20.517", "long": "146.767" },
{ "size": "Small", "icao": "YLVK", "iata": "", "city": "", "name": "Laverak (Military) Airport", "runway": "1900 ft", "lat": "-19.322", "long": "146.802" },
{ "size": "Medium", "icao": "YBRW", "iata": "BWQ", "city": "", "name": "BREWARRINA", "runway": "4547 ft", "lat": "-29.974", "long": "146.817" },
{ "size": "Small", "icao": "YCDV", "iata": "", "city": "", "name": "Caldervale Station Airport", "runway": "", "lat": "-25.108", "long": "146.833" },
{ "size": "Small", "icao": "YDOP", "iata": "", "city": "", "name": "Donnington Airpark", "runway": "", "lat": "-19.612", "long": "146.84" },
{ "size": "Small", "icao": "YGTO", "iata": "GEE", "city": "", "name": "Georgetown (Tas) Airport", "runway": "", "lat": "-41.08", "long": "146.84" },
{ "size": "Small", "icao": "YARL", "iata": "", "city": "", "name": "Ardlethan Airport", "runway": "", "lat": "-34.367", "long": "146.883" },
{ "size": "Small", "icao": "YPOK", "iata": "", "city": "", "name": "Porepunkah Airport", "runway": "", "lat": "-36.718", "long": "146.89" },
{ "size": "Small", "icao": "YBOT", "iata": "", "city": "", "name": "Boatman Airport", "runway": "", "lat": "-27.25", "long": "146.917" },
{ "size": "Small", "icao": "YWMG", "iata": "", "city": "", "name": "Weilmoringle Airport", "runway": "", "lat": "-29.233", "long": "146.933" },
{ "size": "Small", "icao": "YADM", "iata": "", "city": "", "name": "Yandan Mine Airport", "runway": "", "lat": "-21.273", "long": "146.99" },
{ "size": "Small", "icao": "YGVE", "iata": "", "city": "", "name": "Glendevie Airport", "runway": "", "lat": "-43.23", "long": "147.012" },
{ "size": "Small", "icao": "YBEL", "iata": "", "city": "", "name": "Bothwell Airport", "runway": "", "lat": "-42.367", "long": "147.033" },
{ "size": "Small", "icao": "YSLT", "iata": "", "city": "", "name": "Sale Airport", "runway": "", "lat": "-38.117", "long": "147.075" },
{ "size": "Small", "icao": "YBWI", "iata": "", "city": "", "name": "Burdekin Falls Dam Airport", "runway": "", "lat": "-20.6", "long": "147.083" },
{ "size": "Small", "icao": "YMVN", "iata": "", "city": "", "name": "Morven Airport", "runway": "", "lat": "-26.4", "long": "147.1" },
{ "size": "Small", "icao": "YYAC", "iata": "", "city": "", "name": "Yacamunda Airport", "runway": "", "lat": "-21.383", "long": "147.1" },
{ "size": "Small", "icao": "YLGD", "iata": "", "city": "", "name": "Longdown Airport", "runway": "", "lat": "-41.695", "long": "147.143" },
{ "size": "Medium", "icao": "YMES", "iata": "SXE", "city": "", "name": "EAST SALE", "runway": "7995 ft", "lat": "-38.099", "long": "147.149" },
{ "size": "Small", "icao": "YTOK", "iata": "", "city": "", "name": "Torres Park Homestead Airport", "runway": "", "lat": "-25.117", "long": "147.167" },
{ "size": "Small", "icao": "YNYN", "iata": "NYN", "city": "", "name": "NYNGAN", "runway": "5390 ft", "lat": "-31.551", "long": "147.203" },
{ "size": "Small", "icao": "YSFY", "iata": "", "city": "", "name": "Sandfly Airport", "runway": "", "lat": "-42.992", "long": "147.208" },
{ "size": "Small", "icao": "YCDO", "iata": "CBX", "city": "", "name": "CONDOBOLIN", "runway": "4501 ft", "lat": "-33.064", "long": "147.209" },
{ "size": "Small", "icao": "YWIE", "iata": "", "city": "", "name": "Wirralie Gold Mine Airport", "runway": "", "lat": "-21.117", "long": "147.267" },
{ "size": "Small", "icao": "YVAF", "iata": "", "city": "", "name": "Valley Field Airport", "runway": "", "lat": "-41.81", "long": "147.292" },
{ "size": "Small", "icao": "YHBK", "iata": "", "city": "", "name": "Holbrook Airport", "runway": "", "lat": "-35.683", "long": "147.317" },
{ "size": "Small", "icao": "YJCO", "iata": "", "city": "", "name": "Jericho Airport", "runway": "", "lat": "-42.367", "long": "147.317" },
{ "size": "Small", "icao": "YMCL", "iata": "", "city": "", "name": "Mount Coolon Airport", "runway": "3000 ft", "lat": "-21.392", "long": "147.325" },
{ "size": "Small", "icao": "YAYR", "iata": "AYR", "city": "", "name": "AYR", "runway": "4796 ft", "lat": "-19.584", "long": "147.329" },
{ "size": "Small", "icao": "YMIR", "iata": "", "city": "", "name": "Miralwyn Airport", "runway": "", "lat": "-30.15", "long": "147.335" },
{ "size": "Small", "icao": "YITT", "iata": "", "city": "", "name": "Mitta Mitta Airport", "runway": "", "lat": "-36.514", "long": "147.359" },
{ "size": "Small", "icao": "YTUN", "iata": "", "city": "", "name": "Tunbridge Airport", "runway": "", "lat": "-42.1", "long": "147.367" },
{ "size": "Small", "icao": "YTOT", "iata": "", "city": "", "name": "Tottenham Airport", "runway": "3100 ft", "lat": "-32.248", "long": "147.368" },
{ "size": "Small", "icao": "YFDN", "iata": "", "city": "", "name": "Federation Hsd Airport", "runway": "", "lat": "-35.012", "long": "147.374" },
{ "size": "Small", "icao": "YGDA", "iata": "", "city": "", "name": "GOODOOGA", "runway": "3530 ft", "lat": "-29.073", "long": "147.376" },
{ "size": "Small", "icao": "YBYI", "iata": "", "city": "", "name": "Bruny Island Airport", "runway": "", "lat": "-43.234", "long": "147.38" },
{ "size": "Small", "icao": "YBDP", "iata": "", "city": "", "name": "Bridport Airport", "runway": "", "lat": "-41.017", "long": "147.417" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Woodbury Airfield", "runway": "", "lat": "-42.168", "long": "147.446" },
{ "size": "Small", "icao": "YCBG", "iata": "", "city": "", "name": "HOBART CAMBRIDGE", "runway": "3346 ft", "lat": "-42.827", "long": "147.475" },
{ "size": "Small", "icao": "YBLL", "iata": "BLS", "city": "", "name": "Bollon Airport", "runway": "3000 ft", "lat": "-28.058", "long": "147.483" },
{ "size": "Medium", "icao": "YTEM", "iata": "TEM", "city": "", "name": "TEMORA", "runway": "6454 ft", "lat": "-34.421", "long": "147.512" },
{ "size": "Small", "icao": "YCAE", "iata": "", "city": "", "name": "Campbell Town Airport", "runway": "", "lat": "-41.967", "long": "147.531" },
{ "size": "Medium", "icao": "YBNS", "iata": "BSJ", "city": "", "name": "BAIRNSDALE", "runway": "3612 ft", "lat": "-37.888", "long": "147.568" },
{ "size": "Small", "icao": "YOMO", "iata": "", "city": "", "name": "Omeo Airport", "runway": "", "lat": "-37.097", "long": "147.593" },
{ "size": "Small", "icao": "YTLL", "iata": "", "city": "", "name": "Tullamore Airport", "runway": "", "lat": "-32.617", "long": "147.6" },
{ "size": "Medium", "icao": "YCMT", "iata": "CMQ", "city": "", "name": "CLERMONT", "runway": "4301 ft", "lat": "-22.773", "long": "147.621" },
{ "size": "Small", "icao": "YBTT", "iata": "", "city": "", "name": "Buttabone Airport", "runway": "", "lat": "-31.358", "long": "147.633" },
{ "size": "Small", "icao": "YJEM", "iata": "", "city": "", "name": "Jemalong Airport", "runway": "", "lat": "-32.41", "long": "147.67" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Lake Omeo Dry Lake Ultralightport", "runway": "", "lat": "-36.962", "long": "147.673" },
{ "size": "Small", "icao": "YBRA", "iata": "", "city": "", "name": "Benambra Airport", "runway": "", "lat": "-36.967", "long": "147.699" },
{ "size": "Small", "icao": "YWWH", "iata": "", "city": "", "name": "Wentworth Airport", "runway": "", "lat": "-22.1", "long": "147.7" },
{ "size": "Small", "icao": "YCRA", "iata": "", "city": "", "name": "Carinda Airport", "runway": "", "lat": "-30.458", "long": "147.708" },
{ "size": "Small", "icao": "YOLY", "iata": "", "city": "", "name": "Oxley Station Airport", "runway": "", "lat": "-31.013", "long": "147.711" },
{ "size": "Medium", "icao": "YWRN", "iata": "QRR", "city": "", "name": "WARREN", "runway": "3894 ft", "lat": "-31.733", "long": "147.803" },
{ "size": "Small", "icao": "YQBE", "iata": "", "city": "", "name": "Quambone Royona Airport", "runway": "", "lat": "-30.879", "long": "147.842" },
{ "size": "Small", "icao": "YKCK", "iata": "", "city": "", "name": "Killiecrankie Airport", "runway": "", "lat": "-39.849", "long": "147.858" },
{ "size": "Small", "icao": "YCSV", "iata": "KCE", "city": "", "name": "Collinsville Airport", "runway": "3000 ft", "lat": "-20.597", "long": "147.86" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Boobyalla Airfield", "runway": "", "lat": "-40.899", "long": "147.865" },
{ "size": "Medium", "icao": "YCRG", "iata": "CYG", "city": "", "name": "CORRYONG", "runway": "4340 ft", "lat": "-36.183", "long": "147.888" },
{ "size": "Small", "icao": "YHRG", "iata": "", "city": "", "name": "Haddon Rig Airport", "runway": "", "lat": "-31.469", "long": "147.895" },
{ "size": "Small", "icao": "YTUA", "iata": "", "city": "", "name": "Triabunna Airport", "runway": "", "lat": "-42.514", "long": "147.898" },
{ "size": "Small", "icao": "YMIT", "iata": "MTQ", "city": "", "name": "MITCHELL", "runway": "4675 ft", "lat": "-26.483", "long": "147.937" },
{ "size": "Small", "icao": "YLAG", "iata": "", "city": "", "name": "Lagoon Bay Airport", "runway": "", "lat": "-42.885", "long": "147.953" },
{ "size": "Small", "icao": "YLKE", "iata": "", "city": "", "name": "Lakes Entrance Airport", "runway": "", "lat": "-37.853", "long": "147.958" },
{ "size": "Small", "icao": "YELG", "iata": "", "city": "", "name": "Elengerah Airport", "runway": "", "lat": "-31.85", "long": "147.983" },
{ "size": "Medium", "icao": "YLRD", "iata": "LHG", "city": "", "name": "LIGHTNING RIDGE", "runway": "4613 ft", "lat": "-29.457", "long": "147.984" },
{ "size": "Small", "icao": "YLET", "iata": "", "city": "", "name": "Lakes Entrance Airport", "runway": "", "lat": "-37.879", "long": "147.987" },
{ "size": "Small", "icao": "YFLI", "iata": "FLS", "city": "", "name": "Flinders Island Airport", "runway": "5600 ft", "lat": "-40.092", "long": "147.993" },
{ "size": "Small", "icao": "YTGI", "iata": "", "city": "", "name": "Trangie Airport", "runway": "", "lat": "-31.967", "long": "148" },
{ "size": "Small", "icao": "YGRL", "iata": "", "city": "", "name": "Great Lakes Vi Airport", "runway": "", "lat": "-37.842", "long": "148" },
{ "size": "Small", "icao": "YCBN", "iata": "CBI", "city": "", "name": "Cape Barren Island Airport", "runway": "", "lat": "-40.392", "long": "148.017" },
{ "size": "Medium", "icao": "YCTM", "iata": "CMD", "city": "", "name": "COOTAMUNDRA", "runway": "4682 ft", "lat": "-34.624", "long": "148.028" },
{ "size": "Small", "icao": "YSWA", "iata": "", "city": "", "name": "Swansea Airport", "runway": "", "lat": "-42.102", "long": "148.068" },
{ "size": "Small", "icao": "YDAR", "iata": "", "city": "", "name": "Darlington Airport", "runway": "", "lat": "-42.573", "long": "148.069" },
{ "size": "Small", "icao": "YSPI", "iata": "", "city": "", "name": "Springsure Airport", "runway": "", "lat": "-24.128", "long": "148.075" },
{ "size": "Small", "icao": "YTGV", "iata": "", "city": "", "name": "The Grove Airport", "runway": "", "lat": "-34.686", "long": "148.104" },
{ "size": "Small", "icao": "YKHA", "iata": "", "city": "", "name": "Khancoban Airport", "runway": "", "lat": "-36.233", "long": "148.117" },
{ "size": "Medium", "icao": "YWLG", "iata": "WGE", "city": "", "name": "WALGETT", "runway": "5335 ft", "lat": "-30.033", "long": "148.126" },
{ "size": "Small", "icao": "YCKD", "iata": "", "city": "", "name": "Clarke Island Airport", "runway": "", "lat": "-40.517", "long": "148.133" },
{ "size": "Small", "icao": "YEUL", "iata": "", "city": "", "name": "Eulalia Airport", "runway": "", "lat": "-31.033", "long": "148.175" },
{ "size": "Small", "icao": "YGLN", "iata": "", "city": "", "name": "Glencoe Airport", "runway": "", "lat": "-31.617", "long": "148.2" },
{ "size": "Small", "icao": "YPKH", "iata": "", "city": "", "name": "Peak Hill Airport", "runway": "", "lat": "-32.75", "long": "148.2" },
{ "size": "Small", "icao": "YBWN", "iata": "ZBO", "city": "", "name": "Bowen Airport", "runway": "4400 ft", "lat": "-20.018", "long": "148.215" },
{ "size": "Medium", "icao": "YDBI", "iata": "DRN", "city": "", "name": "DIRRANBANDI", "runway": "3993 ft", "lat": "-28.592", "long": "148.217" },
{ "size": "Medium", "icao": "YNRM", "iata": "QRM", "city": "", "name": "NARROMINE", "runway": "4990 ft", "lat": "-32.215", "long": "148.225" },
{ "size": "Medium", "icao": "YTMU", "iata": "TUM", "city": "", "name": "TUMUT", "runway": "3478 ft", "lat": "-35.263", "long": "148.241" },
{ "size": "Medium", "icao": "YYNG", "iata": "NGA", "city": "", "name": "YOUNG", "runway": "4003 ft", "lat": "-34.256", "long": "148.248" },
{ "size": "Small", "icao": "YLDB", "iata": "", "city": "", "name": "Lady Barron (Flinders Is) Airport", "runway": "", "lat": "-40.2", "long": "148.25" },
{ "size": "Small", "icao": "YFRI", "iata": "", "city": "", "name": "Friendly Beaches Airport", "runway": "", "lat": "-42", "long": "148.259" },
{ "size": "Small", "icao": "YSTH", "iata": "HLS", "city": "", "name": "St Helens Airport", "runway": "3500 ft", "lat": "-41.337", "long": "148.282" },
{ "size": "Small", "icao": "YTBG", "iata": "", "city": "", "name": "Talbingo Airport", "runway": "", "lat": "-35.583", "long": "148.283" },
{ "size": "Medium", "icao": "YDYS", "iata": "DYA", "city": "", "name": "DYSART", "runway": "5085 ft", "lat": "-22.622", "long": "148.364" },
{ "size": "Medium", "icao": "YCNM", "iata": "CNB", "city": "", "name": "COONAMBLE", "runway": "5010 ft", "lat": "-30.983", "long": "148.376" },
{ "size": "Small", "icao": "YHAE", "iata": "", "city": "", "name": "Harden Airport", "runway": "", "lat": "-34.557", "long": "148.388" },
{ "size": "Small", "icao": "YGTP", "iata": "", "city": "", "name": "Greenthorpe Airport", "runway": "", "lat": "-33.983", "long": "148.417" },
{ "size": "Small", "icao": "YHAB", "iata": "", "city": "", "name": "Hideaway Bay Airport", "runway": "", "lat": "-20.117", "long": "148.433" },
{ "size": "Small", "icao": "YCSL", "iata": "", "city": "", "name": "Consuelo Airport", "runway": "", "lat": "-24.633", "long": "148.467" },
{ "size": "Small", "icao": "YOAY", "iata": "", "city": "", "name": "Oaky Creek Airport", "runway": "", "lat": "-23.06", "long": "148.495" },
{ "size": "Small", "icao": "YBUA", "iata": "", "city": "", "name": "Bundarra Airport", "runway": "", "lat": "-21.967", "long": "148.533" },
{ "size": "Small", "icao": "YINJ", "iata": "INJ", "city": "", "name": "Injune Airport", "runway": "3000 ft", "lat": "-25.85", "long": "148.533" },
{ "size": "Small", "icao": "YKUY", "iata": "", "city": "", "name": "Kurray Airport", "runway": "", "lat": "-28.22", "long": "148.578" },
{ "size": "Small", "icao": "YCBR", "iata": "CRB", "city": "", "name": "Collarenebri Airport", "runway": "3900 ft", "lat": "-29.522", "long": "148.582" },
{ "size": "Small", "icao": "YSGE", "iata": "SGO", "city": "", "name": "ST GEORGE", "runway": "4987 ft", "lat": "-28.05", "long": "148.595" },
{ "size": "Small", "icao": "YJIN", "iata": "QJD", "city": "", "name": "Jindabyne Airport", "runway": "3000 ft", "lat": "-36.427", "long": "148.602" },
{ "size": "Small", "icao": "YORB", "iata": "RBS", "city": "", "name": "Orbost Airport", "runway": "3700 ft", "lat": "-37.79", "long": "148.61" },
{ "size": "Small", "icao": "YRLL", "iata": "", "city": "", "name": "Rolleston Airport", "runway": "", "lat": "-24.462", "long": "148.632" },
{ "size": "Small", "icao": "YGIL", "iata": "", "city": "", "name": "Gilgandra Airport", "runway": "3000 ft", "lat": "-31.703", "long": "148.638" },
{ "size": "Medium", "icao": "YCWR", "iata": "CWT", "city": "", "name": "COWRA", "runway": "5348 ft", "lat": "-33.845", "long": "148.649" },
{ "size": "Small", "icao": "YCWW", "iata": "", "city": "", "name": "Canowindra Airport", "runway": "", "lat": "-33.543", "long": "148.663" },
{ "size": "Small", "icao": "YWJS", "iata": "", "city": "", "name": "Wee Jasper Airport", "runway": "", "lat": "-35.262", "long": "148.667" },
{ "size": "Small", "icao": "YACI", "iata": "", "city": "", "name": "Arcadia Airport", "runway": "", "lat": "-25.2", "long": "148.683" },
{ "size": "Small", "icao": "YMMU", "iata": "MMM", "city": "", "name": "MIDDLEMOUNT", "runway": "5085 ft", "lat": "-22.802", "long": "148.705" },
{ "size": "Small", "icao": "YFVW", "iata": "", "city": "", "name": "Fairview Airport", "runway": "", "lat": "-32.789", "long": "148.72" },
{ "size": "Small", "icao": "YCLM", "iata": "", "city": "", "name": "Collymongle Airport", "runway": "", "lat": "-29.453", "long": "148.743" },
{ "size": "Small", "icao": "YSHR", "iata": "JHQ", "city": "", "name": "Shute Harbour Airport", "runway": "", "lat": "-20.278", "long": "148.757" },
{ "size": "Small", "icao": "YCUA", "iata": "CUG", "city": "", "name": "Cudal Airport", "runway": "4400 ft", "lat": "-33.278", "long": "148.763" },
{ "size": "Small", "icao": "YWHI", "iata": "", "city": "", "name": "Whitsunday Island Airport", "runway": "", "lat": "-20.267", "long": "148.767" },
{ "size": "Small", "icao": "YADI", "iata": "", "city": "", "name": "Adaminaby Airport", "runway": "", "lat": "-35.998", "long": "148.796" },
{ "size": "Small", "icao": "YADY", "iata": "", "city": "", "name": "Adaminaby Airport", "runway": "", "lat": "-35.983", "long": "148.8" },
{ "size": "Medium", "icao": "YBTR", "iata": "BLT", "city": "", "name": "BLACKWATER", "runway": "5023 ft", "lat": "-23.603", "long": "148.807" },
{ "size": "Small", "icao": "YPLG", "iata": "", "city": "", "name": "Pilliga Airport", "runway": "", "lat": "-30.367", "long": "148.883" },
{ "size": "Small", "icao": "YTWN", "iata": "", "city": "", "name": "Tooraweenah Airport", "runway": "3000 ft", "lat": "-31.442", "long": "148.9" },
{ "size": "Small", "icao": "YDEG", "iata": "", "city": "", "name": "Delegate Airport", "runway": "", "lat": "-37.061", "long": "148.942" },
{ "size": "Small", "icao": "YBRJ", "iata": "", "city": "", "name": "Burren Junction Airport", "runway": "", "lat": "-30.158", "long": "148.975" },
{ "size": "Small", "icao": "YRUG", "iata": "", "city": "", "name": "Rugby Airport", "runway": "", "lat": "-34.392", "long": "148.975" },
{ "size": "Small", "icao": "YWEL", "iata": "", "city": "", "name": "Wellington Airport", "runway": "", "lat": "-32.467", "long": "148.983" },
{ "size": "Small", "icao": "YASS", "iata": "", "city": "", "name": "Bakblok Airport", "runway": "", "lat": "-34.887", "long": "149.015" },
{ "size": "Small", "icao": "YYBE", "iata": "", "city": "", "name": "Yarrabee Mine Airport", "runway": "", "lat": "-23.267", "long": "149.017" },
{ "size": "Small", "icao": "YYAS", "iata": "", "city": "", "name": "Yass Airport", "runway": "", "lat": "-34.83", "long": "149.042" },
{ "size": "Small", "icao": "YMGI", "iata": "", "city": "", "name": "MUNGINDI", "runway": "4606 ft", "lat": "-28.967", "long": "149.058" },
{ "size": "Small", "icao": "YSRT", "iata": "", "city": "", "name": "Surat Airport", "runway": "", "lat": "-27.15", "long": "149.083" },
{ "size": "Small", "icao": "YBAD", "iata": "", "city": "", "name": "Baradine Airport", "runway": "", "lat": "-30.955", "long": "149.092" },
{ "size": "Closed", "icao": "YWLE", "iata": "", "city": "", "name": "Williamsdale Airport", "runway": "", "lat": "-35.559", "long": "149.13" },
{ "size": "Small", "icao": "YBUY", "iata": "", "city": "", "name": "Bunyan Airfield", "runway": "", "lat": "-36.134", "long": "149.132" },
{ "size": "Small", "icao": "YPFT", "iata": "", "city": "", "name": "Cooma/Polo Flat (Unlic) Airport", "runway": "", "lat": "-36.23", "long": "149.15" },
{ "size": "Small", "icao": "YBOM", "iata": "", "city": "", "name": "Bombala Airport", "runway": "", "lat": "-36.917", "long": "149.167" },
{ "size": "Small", "icao": "YCNR", "iata": "", "city": "", "name": "Cann River Airport", "runway": "", "lat": "-37.517", "long": "149.167" },
{ "size": "Small", "icao": "YBMO", "iata": "", "city": "", "name": "Bombala Airport", "runway": "", "lat": "-36.905", "long": "149.182" },
{ "size": "Small", "icao": "YTUG", "iata": "", "city": "", "name": "Trugananni Airport", "runway": "", "lat": "-24.467", "long": "149.267" },
{ "size": "Medium", "icao": "YCBB", "iata": "COJ", "city": "", "name": "COONABARABRAN", "runway": "4987 ft", "lat": "-31.332", "long": "149.267" },
{ "size": "Small", "icao": "YBPI", "iata": "BMP", "city": "", "name": "Brampton Island Airport", "runway": "", "lat": "-20.803", "long": "149.27" },
{ "size": "Small", "icao": "YBID", "iata": "", "city": "", "name": "Binda", "runway": "", "lat": "-34.303", "long": "149.36" },
{ "size": "Small", "icao": "YKIU", "iata": "", "city": "", "name": "Kaiuroo Airport", "runway": "", "lat": "-23.117", "long": "149.367" },
{ "size": "Small", "icao": "YWWA", "iata": "WEW", "city": "", "name": "Wee Waa Airport", "runway": "3000 ft", "lat": "-30.258", "long": "149.408" },
{ "size": "Small", "icao": "YWDR", "iata": "", "city": "", "name": "Collector2 Airport", "runway": "", "lat": "-34.939", "long": "149.41" },
{ "size": "Small", "icao": "YBCL", "iata": "", "city": "", "name": "Boolcarrol Station Airport", "runway": "", "lat": "-30.05", "long": "149.417" },
{ "size": "Small", "icao": "YCLT", "iata": "", "city": "", "name": "Collector Airport", "runway": "", "lat": "-34.883", "long": "149.417" },
{ "size": "Small", "icao": "YGAH", "iata": "", "city": "", "name": "Greenbah Airport", "runway": "", "lat": "-30.126", "long": "149.435" },
{ "size": "Small", "icao": "YCRL", "iata": "", "city": "", "name": "Crookwell Airport", "runway": "", "lat": "-34.5", "long": "149.45" },
{ "size": "Small", "icao": "YTOG", "iata": "", "city": "", "name": "Togo Station Airport", "runway": "", "lat": "-30.082", "long": "149.532" },
{ "size": "Small", "icao": "YBMI", "iata": "", "city": "", "name": "Boomi Airport", "runway": "", "lat": "-28.733", "long": "149.583" },
{ "size": "Small", "icao": "YCAH", "iata": "CLH", "city": "", "name": "Coolah Airport", "runway": "3500 ft", "lat": "-31.773", "long": "149.61" },
{ "size": "Small", "icao": "YDLC", "iata": "", "city": "", "name": "Dulacca Airport", "runway": "", "lat": "-26.633", "long": "149.717" },
{ "size": "Small", "icao": "YMCO", "iata": "XMC", "city": "", "name": "Mallacoota Airport", "runway": "3300 ft", "lat": "-37.598", "long": "149.72" },
{ "size": "Medium", "icao": "YGLB", "iata": "GUL", "city": "", "name": "GOULBURN", "runway": "4209 ft", "lat": "-34.81", "long": "149.726" },
{ "size": "Small", "icao": "YTLG", "iata": "", "city": "", "name": "Taralga Grathawa Airport", "runway": "", "lat": "-34.289", "long": "149.782" },
{ "size": "Small", "icao": "YTMS", "iata": "", "city": "", "name": "Tambar Springs Airport", "runway": "", "lat": "-31.315", "long": "149.847" },
{ "size": "Small", "icao": "YBAO", "iata": "", "city": "", "name": "Braidwood Airport", "runway": "", "lat": "-35.45", "long": "149.85" },
{ "size": "Small", "icao": "YGBO", "iata": "", "city": "", "name": "Gabo Island Airport", "runway": "", "lat": "-37.567", "long": "149.9" },
{ "size": "Small", "icao": "YTAM", "iata": "XTO", "city": "", "name": "Taroom Airport", "runway": "3600 ft", "lat": "-25.802", "long": "149.9" },
{ "size": "Small", "icao": "YPRE", "iata": "", "city": "", "name": "Premer Betoota Airport", "runway": "", "lat": "-31.477", "long": "149.903" },
{ "size": "Small", "icao": "YMEY", "iata": "", "city": "", "name": "Mullaley Airport", "runway": "", "lat": "-31.1", "long": "149.917" },
{ "size": "Small", "icao": "YGOV", "iata": "", "city": "", "name": "Gabo Is aAd sSte Airport", "runway": "", "lat": "-37.57", "long": "149.918" },
{ "size": "Small", "icao": "YLMB", "iata": "", "city": "", "name": "Lambrook Airport", "runway": "", "lat": "-31.1", "long": "149.933" },
{ "size": "Small", "icao": "YCSI", "iata": "", "city": "", "name": "Cassilis Rotherw Airport", "runway": "", "lat": "-32.002", "long": "149.961" },
{ "size": "Small", "icao": "YMOU", "iata": "", "city": "", "name": "Moura Airport", "runway": "3000 ft", "lat": "-24.612", "long": "149.995" },
{ "size": "Small", "icao": "YHOY", "iata": "", "city": "", "name": "Hollins Bay Airport", "runway": "", "lat": "-22.267", "long": "150.033" },
{ "size": "Small", "icao": "YBOG", "iata": "", "city": "", "name": "Boggabri Airport", "runway": "", "lat": "-30.717", "long": "150.05" },
{ "size": "Small", "icao": "YTDR", "iata": "TDR", "city": "", "name": "Theodore Airport", "runway": "3000 ft", "lat": "-24.993", "long": "150.093" },
{ "size": "Small", "icao": "YBIK", "iata": "", "city": "", "name": "Bindook Airport", "runway": "", "lat": "-34.167", "long": "150.1" },
{ "size": "Small", "icao": "YMLS", "iata": "WLE", "city": "", "name": "Miles Airport", "runway": "3000 ft", "lat": "-26.808", "long": "150.175" },
{ "size": "Small", "icao": "YWIS", "iata": "", "city": "", "name": "WILLIAMSON", "runway": "5928 ft", "lat": "-22.473", "long": "150.178" },
{ "size": "Small", "icao": "YBVL", "iata": "", "city": "", "name": "Blackville Airport", "runway": "", "lat": "-31.583", "long": "150.183" },
{ "size": "Small", "icao": "YBGY", "iata": "", "city": "", "name": "Biniguy Airport", "runway": "", "lat": "-29.505", "long": "150.192" },
{ "size": "Medium", "icao": "YGDH", "iata": "GUH", "city": "", "name": "GUNNEDAH", "runway": "5400 ft", "lat": "-30.961", "long": "150.251" },
{ "size": "Small", "icao": "YGDI", "iata": "GOO", "city": "", "name": "GOONDIWINDI", "runway": "4396 ft", "lat": "-28.521", "long": "150.32" },
{ "size": "Small", "icao": "YKAT", "iata": "", "city": "", "name": "Katoomba Airport", "runway": "3000 ft", "lat": "-33.668", "long": "150.323" },
{ "size": "Small", "icao": "YUPH", "iata": "", "city": "", "name": "Upper Horton Wyl Airport", "runway": "", "lat": "-30.105", "long": "150.404" },
{ "size": "Small", "icao": "YILT", "iata": "", "city": "", "name": "Milton Airport", "runway": "", "lat": "-35.321", "long": "150.439" },
{ "size": "Small", "icao": "YTAA", "iata": "XTR", "city": "", "name": "Tara Airport", "runway": "3000 ft", "lat": "-27.157", "long": "150.477" },
{ "size": "Small", "icao": "YMIG", "iata": "", "city": "", "name": "Mittagong Airport", "runway": "", "lat": "-34.467", "long": "150.5" },
{ "size": "Small", "icao": "YQDI", "iata": "UIR", "city": "", "name": "QUIRINDI", "runway": "3629 ft", "lat": "-31.491", "long": "150.514" },
{ "size": "Small", "icao": "YBZA", "iata": "", "city": "", "name": "Breeza Airport", "runway": "", "lat": "-31.317", "long": "150.517" },
{ "size": "Small", "icao": "YKEP", "iata": "", "city": "", "name": "Lake Keepit Airport", "runway": "", "lat": "-30.891", "long": "150.526" },
{ "size": "Small", "icao": "YBIA", "iata": "", "city": "", "name": "Bingara Airport", "runway": "", "lat": "-29.8", "long": "150.533" },
{ "size": "Small", "icao": "YWRL", "iata": "", "city": "", "name": "Warialda Airport", "runway": "", "lat": "-29.533", "long": "150.533" },
{ "size": "Medium", "icao": "YSNW", "iata": "NOA", "city": "", "name": "NOWRA", "runway": "6870 ft", "lat": "-34.949", "long": "150.537" },
{ "size": "Small", "icao": "YOAS", "iata": "", "city": "", "name": "The Oaks Airport", "runway": "", "lat": "-34.084", "long": "150.559" },
{ "size": "Small", "icao": "YBBA", "iata": "", "city": "", "name": "Barraba Airport", "runway": "", "lat": "-30.383", "long": "150.6" },
{ "size": "Medium", "icao": "YCCA", "iata": "CCL", "city": "", "name": "CHINCHILLA", "runway": "3497 ft", "lat": "-26.775", "long": "150.617" },
{ "size": "Small", "icao": "YWLX", "iata": "", "city": "", "name": "Wallacia Airport", "runway": "", "lat": "-33.867", "long": "150.65" },
{ "size": "Small", "icao": "YWIO", "iata": "", "city": "", "name": "Wilton Airport", "runway": "", "lat": "-34.233", "long": "150.667" },
{ "size": "Medium", "icao": "YSCN", "iata": "CDU", "city": "", "name": "CAMDEN", "runway": "4804 ft", "lat": "-34.04", "long": "150.687" },
{ "size": "Small", "icao": "YCNX", "iata": "", "city": "", "name": "Cooranga Airport", "runway": "", "lat": "-29.067", "long": "150.767" },
{ "size": "Medium", "icao": "YWOL", "iata": "WOL", "city": "", "name": "WOLLONGONG", "runway": "5967 ft", "lat": "-34.561", "long": "150.789" },
{ "size": "Small", "icao": "YWBN", "iata": "", "city": "", "name": "Wedderburn Airport", "runway": "", "lat": "-34.187", "long": "150.805" },
{ "size": "Small", "icao": "YEMP", "iata": "", "city": "", "name": "Emu Park Airport", "runway": "", "lat": "-23.257", "long": "150.813" },
{ "size": "Small", "icao": "YSCO", "iata": "NSO", "city": "", "name": "SCONE", "runway": "4606 ft", "lat": "-32.037", "long": "150.832" },
{ "size": "Closed", "icao": "YHOX", "iata": "", "city": "", "name": "HOXTON PARK", "runway": "3602 ft", "lat": "-33.91", "long": "150.852" },
{ "size": "Small", "icao": "YWBH", "iata": "", "city": "", "name": "Wallabadah Airport", "runway": "", "lat": "-31.533", "long": "150.867" },
{ "size": "Small", "icao": "YDNR", "iata": "", "city": "", "name": "Dunmore Manila Airport", "runway": "", "lat": "-30.658", "long": "150.875" },
{ "size": "Small", "icao": "YGGO", "iata": "", "city": "", "name": "Goonoo Goonoo Airport", "runway": "", "lat": "-31.317", "long": "150.917" },
{ "size": "Small", "icao": "YSHW", "iata": "", "city": "", "name": "Holsworthy (Military) Airport", "runway": "2200 ft", "lat": "-33.995", "long": "150.952" },
{ "size": "Small", "icao": "YASF", "iata": "", "city": "", "name": "Ashford Airport", "runway": "", "lat": "-29.317", "long": "151.05" },
{ "size": "Small", "icao": "YMTO", "iata": "MNQ", "city": "", "name": "MONTO", "runway": "4301 ft", "lat": "-24.886", "long": "151.1" },
{ "size": "Small", "icao": "YWOM", "iata": "", "city": "", "name": "Woolomin Airport", "runway": "", "lat": "-31.317", "long": "151.133" },
{ "size": "Small", "icao": "YMQD", "iata": "", "city": "", "name": "Mount Mcquoid Airport", "runway": "", "lat": "-33.11", "long": "151.138" },
{ "size": "Small", "icao": "YINO", "iata": "", "city": "", "name": "Inverell North Airport", "runway": "", "lat": "-29.767", "long": "151.167" },
{ "size": "Closed", "icao": "YCAA", "iata": "", "city": "", "name": "Calga Airport", "runway": "", "lat": "-33.403", "long": "151.212" },
{ "size": "Small", "icao": "YLYD", "iata": "", "city": "", "name": "Lyndley Airport", "runway": "", "lat": "-26.833", "long": "151.233" },
{ "size": "Small", "icao": "YDAY", "iata": "DBY", "city": "", "name": "DALBY", "runway": "4160 ft", "lat": "-27.155", "long": "151.267" },
{ "size": "Small", "icao": "YMMN", "iata": "", "city": "", "name": "Millmerran Airport", "runway": "", "lat": "-27.863", "long": "151.275" },
{ "size": "Small", "icao": "YMDA", "iata": "", "city": "", "name": "Mundubbera Airport", "runway": "3000 ft", "lat": "-25.592", "long": "151.317" },
{ "size": "Small", "icao": "YELR", "iata": "", "city": "", "name": "Elderslie Airport", "runway": "", "lat": "-32.617", "long": "151.333" },
{ "size": "Small", "icao": "YEES", "iata": "", "city": "", "name": "Elderslie Airport", "runway": "", "lat": "-32.6", "long": "151.34" },
{ "size": "Small", "icao": "YCNK", "iata": "CES", "city": "", "name": "CESSNOCK", "runway": "3600 ft", "lat": "-32.788", "long": "151.342" },
{ "size": "Small", "icao": "YMSO", "iata": "", "city": "", "name": "Mount Sandon Airport", "runway": "", "lat": "-31.39", "long": "151.41" },
{ "size": "Small", "icao": "YHCT", "iata": "", "city": "", "name": "Heathcote Emergency Airport", "runway": "", "lat": "-31.24", "long": "151.432" },
{ "size": "Closed", "icao": "YOOB", "iata": "", "city": "", "name": "Cooranbong Airport", "runway": "", "lat": "-33.06", "long": "151.462" },
{ "size": "Small", "icao": "YMND", "iata": "MTL", "city": "", "name": "MAITLAND", "runway": "3786 ft", "lat": "-32.703", "long": "151.488" },
{ "size": "Small", "icao": "YWCH", "iata": "WLC", "city": "", "name": "Walcha Airport", "runway": "", "lat": "-31", "long": "151.567" },
{ "size": "Small", "icao": "YGAY", "iata": "GAH", "city": "", "name": "GAYNDAH", "runway": "4150 ft", "lat": "-25.614", "long": "151.619" },
{ "size": "Small", "icao": "YPWH", "iata": "", "city": "", "name": "Pittsworth Airport", "runway": "", "lat": "-27.721", "long": "151.633" },
{ "size": "Small", "icao": "YKEL", "iata": "", "city": "", "name": "Kelvin Station Airport", "runway": "", "lat": "-30.655", "long": "151.638" },
{ "size": "Small", "icao": "YPEC", "iata": "BEO", "city": "", "name": "Aeropelican Airport", "runway": "3000 ft", "lat": "-33.067", "long": "151.648" },
{ "size": "Medium", "icao": "YGLI", "iata": "GLI", "city": "", "name": "GLEN INNES", "runway": "4915 ft", "lat": "-29.675", "long": "151.689" },
{ "size": "Medium", "icao": "YBOK", "iata": "OKY", "city": "", "name": "OAKEY", "runway": "5410 ft", "lat": "-27.411", "long": "151.735" },
{ "size": "Small", "icao": "YWVL", "iata": "", "city": "", "name": "Woodville Airport", "runway": "", "lat": "-30.416", "long": "151.755" },
{ "size": "Medium", "icao": "YKRY", "iata": "KGY", "city": "", "name": "KINGAROY", "runway": "5249 ft", "lat": "-26.581", "long": "151.841" },
{ "size": "Small", "icao": "YCFN", "iata": "", "city": "", "name": "Clifton Airport", "runway": "", "lat": "-27.928", "long": "151.847" },
{ "size": "Small", "icao": "YWND", "iata": "WDI", "city": "", "name": "Wondai Airport", "runway": "3000 ft", "lat": "-26.283", "long": "151.858" },
{ "size": "Medium", "icao": "YTWB", "iata": "TWB", "city": "", "name": "TOOWOOMBA", "runway": "3678 ft", "lat": "-27.543", "long": "151.916" },
{ "size": "Small", "icao": "YMUA", "iata": "", "city": "", "name": "Monduran Airport", "runway": "", "lat": "-24.875", "long": "151.917" },
{ "size": "Small", "icao": "YWCK", "iata": "", "city": "", "name": "WARWICK", "runway": "5380 ft", "lat": "-28.149", "long": "151.943" },
{ "size": "Small", "icao": "YGCR", "iata": "", "city": "", "name": "Gloucester Airport", "runway": "", "lat": "-32.05", "long": "151.983" },
{ "size": "Small", "icao": "YNAN", "iata": "", "city": "", "name": "Nanango Airport", "runway": "", "lat": "-26.69", "long": "151.983" },
{ "size": "Small", "icao": "YSPE", "iata": "SNH", "city": "", "name": "STANTHORPE", "runway": "5597 ft", "lat": "-28.62", "long": "151.991" },
{ "size": "Small", "icao": "YBIN", "iata": "", "city": "", "name": "Biggenden Airport", "runway": "", "lat": "-25.525", "long": "152.05" },
{ "size": "Small", "icao": "YWMM", "iata": "", "city": "", "name": "Wollomombi Airport", "runway": "", "lat": "-30.533", "long": "152.083" },
{ "size": "Small", "icao": "YCHB", "iata": "", "city": "", "name": "Cherrabah Airport", "runway": "", "lat": "-28.417", "long": "152.167" },
{ "size": "Small", "icao": "YCDS", "iata": "", "city": "", "name": "Childers Airport", "runway": "", "lat": "-25.253", "long": "152.335" },
{ "size": "Small", "icao": "YWSG", "iata": "", "city": "", "name": "Watts Bridge Airport", "runway": "3000 ft", "lat": "-27.098", "long": "152.46" },
{ "size": "Small", "icao": "YBCM", "iata": "", "city": "", "name": "Coominya", "runway": "", "lat": "-27.391", "long": "152.467" },
{ "size": "Small", "icao": "YFST", "iata": "FOT", "city": "", "name": "Forster (Wallis Is) Airport", "runway": "", "lat": "-32.204", "long": "152.479" },
{ "size": "Small", "icao": "YTNC", "iata": "", "city": "", "name": "Tuncurry Airport", "runway": "", "lat": "-32.15", "long": "152.483" },
{ "size": "Small", "icao": "YPAC", "iata": "", "city": "", "name": "Pacific Haven Airport", "runway": "", "lat": "-25.237", "long": "152.543" },
{ "size": "Small", "icao": "YOBR", "iata": "", "city": "", "name": "Old Bar Heritage Airport", "runway": "", "lat": "-31.965", "long": "152.591" },
{ "size": "Small", "icao": "YBOA", "iata": "", "city": "", "name": "Boonah Airport", "runway": "", "lat": "-28.017", "long": "152.682" },
{ "size": "Small", "icao": "YGYM", "iata": "GYP", "city": "", "name": "GYMPIE", "runway": "4600 ft", "lat": "-26.283", "long": "152.702" },
{ "size": "Small", "icao": "YMYB", "iata": "MBH", "city": "", "name": "MARYBOROUGH", "runway": "5207 ft", "lat": "-25.513", "long": "152.715" },
{ "size": "Small", "icao": "YCMH", "iata": "", "city": "", "name": "Camden Haven Airport", "runway": "3000 ft", "lat": "-31.665", "long": "152.742" },
{ "size": "Medium", "icao": "YKMP", "iata": "KPS", "city": "", "name": "KEMPSEY", "runway": "5413 ft", "lat": "-31.074", "long": "152.77" },
{ "size": "Small", "icao": "YKBN", "iata": "", "city": "", "name": "Kooralbyn Airport", "runway": "", "lat": "-28.09", "long": "152.845" },
{ "size": "Closed", "icao": "YBML", "iata": "", "city": "", "name": "Bromelton Airport", "runway": "", "lat": "-27.968", "long": "152.9" },
{ "size": "Small", "icao": "YSGR", "iata": "", "city": "", "name": "South Grafton Airport", "runway": "", "lat": "-29.708", "long": "152.928" },
{ "size": "Small", "icao": "YCAB", "iata": "", "city": "", "name": "Caboolture Airport", "runway": "", "lat": "-27.083", "long": "152.983" },
{ "size": "Small", "icao": "YCXA", "iata": "", "city": "", "name": "Cooloola Village Airpark", "runway": "", "lat": "-25.975", "long": "153" },
{ "size": "Medium", "icao": "YGFN", "iata": "GFN", "city": "", "name": "GRAFTON", "runway": "5607 ft", "lat": "-29.759", "long": "153.03" },
{ "size": "Small", "icao": "YNSH", "iata": "NSV", "city": "", "name": "Noosa Airport", "runway": "", "lat": "-26.423", "long": "153.063" },
{ "size": "Small", "icao": "YCAS", "iata": "CSI", "city": "", "name": "CASINO", "runway": "3609 ft", "lat": "-28.883", "long": "153.067" },
{ "size": "Small", "icao": "YRBB", "iata": "", "city": "", "name": "Rainbow Beach Airport", "runway": "", "lat": "-25.833", "long": "153.067" },
{ "size": "Small", "icao": "YCDR", "iata": "CUD", "city": "", "name": "Caloundra Airport", "runway": "3000 ft", "lat": "-26.8", "long": "153.1" },
{ "size": "Small", "icao": "LGRS", "iata": "", "city": "", "name": "Logan Reserve Airport", "runway": "", "lat": "-27.708", "long": "153.105" },
{ "size": "Small", "icao": "YPLI", "iata": "", "city": "", "name": "Palmers Island/Yamba Airport", "runway": "", "lat": "-29.446", "long": "153.267" },
{ "size": "Small", "icao": "YHEC", "iata": "", "city": "", "name": "Heck Field Airport", "runway": "", "lat": "-27.767", "long": "153.339" },
{ "size": "Small", "icao": "YTGA", "iata": "TAN", "city": "", "name": "Tangalooma Airport", "runway": "", "lat": "-27.13", "long": "153.363" },
{ "size": "Small", "icao": "YSPT", "iata": "SHQ", "city": "", "name": "Southport Airport", "runway": "2600 ft", "lat": "-27.915", "long": "153.373" },
{ "size": "Small", "icao": "YXTA", "iata": "", "city": "", "name": "Tangalooma Resort Airport", "runway": "", "lat": "-27.2", "long": "153.383" },
{ "size": "Small", "icao": "YMUR", "iata": "", "city": "", "name": "Murwillumbah Airport", "runway": "", "lat": "-28.332", "long": "153.413" },
{ "size": "Small", "icao": "YEVD", "iata": "EVH", "city": "", "name": "EVANS HEAD", "runway": "4144 ft", "lat": "-29.093", "long": "153.42" },
{ "size": "Small", "icao": "", "iata": "", "city": "", "name": "Kooringal Airstrip", "runway": "", "lat": "-27.346", "long": "153.426" },
{ "size": "Small", "icao": "YDUN", "iata": "", "city": "", "name": "Dunwich Airport", "runway": "3000 ft", "lat": "-27.517", "long": "153.428" },
{ "size": "Small", "icao": "YTYH", "iata": "", "city": "", "name": "Tyagarah Airport", "runway": "", "lat": "-28.595", "long": "153.551" },
{ "size": "Small", "icao": "", "iata": "", "city": "Abrolhos", "name": "Abrolhos East Wallabi Island Airport", "runway": "", "lat": "-28.438", "long": "113.736" },
{ "size": "Medium", "icao": "YPAD", "iata": "ADL", "city": "Adelaide", "name": "ADELAIDE INTL", "runway": "10171 ft", "lat": "-34.945", "long": "138.531" },
{ "size": "Medium", "icao": "YPED", "iata": "", "city": "Adelaide", "name": "EDINBURGH", "runway": "8399 ft", "lat": "-34.703", "long": "138.621" },
{ "size": "Small", "icao": "YPPF", "iata": "PAL", "city": "Adelaide", "name": "ADELAIDE PARAFIELD", "runway": "4429 ft", "lat": "-34.793", "long": "138.633" },
{ "size": "Small", "icao": "YAWT", "iata": "", "city": "Agnes Water", "name": "Agnes Water Airport", "runway": "", "lat": "-24.202", "long": "151.893" },
{ "size": "Small", "icao": "", "iata": "AGW", "city": "Agnew", "name": "Agnew Airport", "runway": "", "lat": "-12.146", "long": "142.149" },
{ "size": "Small", "icao": "", "iata": "WSY", "city": "Airlie Beach", "name": "Whitsunday Airstrip", "runway": "", "lat": "-20.267", "long": "148.75" },
{ "size": "Medium", "icao": "YABA", "iata": "ALH", "city": "Albany", "name": "ALBANY", "runway": "5906 ft", "lat": "-34.943", "long": "117.809" },
{ "size": "Medium", "icao": "YMAY", "iata": "ABX", "city": "Albury", "name": "ALBURY", "runway": "6234 ft", "lat": "-36.068", "long": "146.958" },
{ "size": "Small", "icao": "YADG", "iata": "", "city": "Aldinga", "name": "Aldinga Airport", "runway": "", "lat": "-35.29", "long": "138.49" },
{ "size": "Medium", "icao": "YBAS", "iata": "ASP", "city": "Alice Springs", "name": "ALICE SPRINGS", "runway": "7999 ft", "lat": "-23.807", "long": "133.902" },
{ "size": "Small", "icao": "YLKN", "iata": "LNH", "city": "Alpurrurulam", "name": "Lake Nash Airport", "runway": "", "lat": "-20.981", "long": "137.918" },
{ "size": "Small", "icao": "", "iata": "AYD", "city": "Alroy Downs", "name": "Alroy Downs Airport", "runway": "", "lat": "-19.291", "long": "136.079" },
{ "size": "Small", "icao": "", "iata": "", "city": "Althorpe Islands", "name": "Althorpe Lighthouse Airstrip", "runway": "", "lat": "-35.371", "long": "136.861" },
{ "size": "Medium", "icao": "YARM", "iata": "ARM", "city": "Armidale", "name": "ARMIDALE", "runway": "5702 ft", "lat": "-30.528", "long": "151.617" },
{ "size": "Small", "icao": "YATN", "iata": "", "city": "Atherton", "name": "Atherton Airport", "runway": "3000 ft", "lat": "-17.262", "long": "145.515" },
{ "size": "Small", "icao": "", "iata": "", "city": "Avoca", "name": "Avoca Airport", "runway": "", "lat": "-41.782", "long": "147.719" },
{ "size": "Medium", "icao": "YAYE", "iata": "AYQ", "city": "Ayers Rock", "name": "AYERS ROCK CONNELLAN", "runway": "8527 ft", "lat": "-25.186", "long": "130.976" },
{ "size": "Medium", "icao": "YBNA", "iata": "BNK", "city": "Ballina", "name": "BALLINA BYRON GATEWAY", "runway": "6234 ft", "lat": "-28.834", "long": "153.562" },
{ "size": "Small", "icao": "YBBC", "iata": "", "city": "Bamboo Creek Gold Mine", "name": "Bamboo Creek Airport", "runway": "", "lat": "-20.945", "long": "120.165" },
{ "size": "Small", "icao": "", "iata": "BYX", "city": "Baniyala", "name": "Baniyala Airport", "runway": "", "lat": "-13.198", "long": "136.227" },
{ "size": "Small", "icao": "", "iata": "", "city": "Baralaba", "name": "Baralaba", "runway": "", "lat": "-24.187", "long": "149.845" },
{ "size": "Medium", "icao": "YBAR", "iata": "BCI", "city": "Barcaldine", "name": "BARCALDINE", "runway": "5591 ft", "lat": "-23.565", "long": "145.307" },
{ "size": "Small", "icao": "YBYL", "iata": "", "city": "Baryulgil", "name": "Baryulgil Airstrip", "runway": "", "lat": "-29.218", "long": "152.616" },
{ "size": "Small", "icao": "", "iata": "BVW", "city": "Batavia Downs", "name": "Batavia Downs Airport", "runway": "", "lat": "-12.659", "long": "142.675" },
{ "size": "Medium", "icao": "YBTH", "iata": "BHS", "city": "Bathurst", "name": "BATHURST", "runway": "5594 ft", "lat": "-33.409", "long": "149.652" },
{ "size": "Small", "icao": "YBEB", "iata": "", "city": "Bellburn", "name": "Pumululu National Park", "runway": "", "lat": "-17.545", "long": "128.305" },
{ "size": "Closed", "icao": "YBER", "iata": "", "city": "Berwick", "name": "Berwick Airport", "runway": "", "lat": "-38.04", "long": "145.336" },
{ "size": "Small", "icao": "", "iata": "BCZ", "city": "Bickerton Island", "name": "Milyakburra Airport", "runway": "", "lat": "-13.781", "long": "136.202" },
{ "size": "Small", "icao": "", "iata": "", "city": "Bickerton Island", "name": "[DELETE] Milyakburra Airport", "runway": "", "lat": "-13.781", "long": "138.202" },
{ "size": "Small", "icao": "YBBE", "iata": "BBE", "city": "Big Bell", "name": "Big Bell Airport", "runway": "", "lat": "-27.329", "long": "117.673" },
{ "size": "Medium", "icao": "YTNG", "iata": "THG", "city": "Biloela", "name": "THANGOOL", "runway": "4993 ft", "lat": "-24.494", "long": "150.576" },
{ "size": "Medium", "icao": "YBCK", "iata": "BKQ", "city": "Blackall", "name": "BLACKALL", "runway": "5538 ft", "lat": "-24.428", "long": "145.429" },
{ "size": "Small", "icao": "", "iata": "BFC", "city": "Bloomfield", "name": "Bloomfield Airport", "runway": "", "lat": "-15.874", "long": "145.33" },
{ "size": "Small", "icao": "", "iata": "BCK", "city": "Bolwarra", "name": "Bolwarra Airport", "runway": "", "lat": "-17.388", "long": "144.169" },
{ "size": "Small", "icao": "YBOV", "iata": "", "city": "Border Village", "name": "Border Village Airport", "runway": "", "lat": "-31.639", "long": "129.012" },
{ "size": "Small", "icao": "YBOR", "iata": "", "city": "Bordertown", "name": "Bordertown Airport", "runway": "", "lat": "-36.265", "long": "140.712" },
{ "size": "Small", "icao": "", "iata": "", "city": "Bremer Bay", "name": "Bremer Bay Airport", "runway": "", "lat": "-34.381", "long": "119.332" },
{ "size": "Small", "icao": "YBAF", "iata": "", "city": "Brisbane", "name": "BRISBANE ARCHERFIELD", "runway": "4859 ft", "lat": "-27.57", "long": "153.008" },
{ "size": "Large", "icao": "YBBN", "iata": "BNE", "city": "Brisbane", "name": "BRISBANE INTL", "runway": "11680 ft", "lat": "-27.384", "long": "153.118" },
{ "size": "Medium", "icao": "YBHI", "iata": "BHQ", "city": "Broken Hill", "name": "BROKEN HILL", "runway": "8251 ft", "lat": "-32.001", "long": "141.472" },
{ "size": "Medium", "icao": "YBRM", "iata": "BME", "city": "Broome", "name": "BROOME INTL", "runway": "7769 ft", "lat": "-17.945", "long": "122.232" },
{ "size": "Medium", "icao": "YPEA", "iata": "", "city": "Bullsbrook", "name": "PEARCE", "runway": "8002 ft", "lat": "-31.668", "long": "116.015" },
{ "size": "Small", "icao": "YDEA", "iata": "", "city": "Bulman", "name": "Delara Airfield", "runway": "", "lat": "-13.669", "long": "134.291" },
{ "size": "Medium", "icao": "YBUD", "iata": "BDB", "city": "Bundaberg", "name": "BUNDABERG", "runway": "5030 ft", "lat": "-24.904", "long": "152.319" },
{ "size": "Medium", "icao": "YWYY", "iata": "BWT", "city": "Burnie", "name": "WYNYARD", "runway": "5413 ft", "lat": "-40.999", "long": "145.731" },
{ "size": "Small", "icao": "YCUR", "iata": "", "city": "Cabramurra Township", "name": "Cabramurra Airport", "runway": "", "lat": "-35.927", "long": "148.393" },
{ "size": "Medium", "icao": "YBCS", "iata": "CNS", "city": "Cairns", "name": "CAIRNS INTL", "runway": "10489 ft", "lat": "-16.886", "long": "145.755" },
{ "size": "Large", "icao": "YSCB", "iata": "CBR", "city": "Canberra", "name": "CANBERRA", "runway": "8802 ft", "lat": "-35.307", "long": "149.195" },
{ "size": "Small", "icao": "YCBE", "iata": "CBY", "city": "Canobie", "name": "Canobie Airport", "runway": "", "lat": "-19.479", "long": "140.927" },
{ "size": "Small", "icao": "", "iata": "CQP", "city": "Cape Flattery", "name": "Cape Flattery Airport", "runway": "", "lat": "-14.971", "long": "145.311" },
{ "size": "Small", "icao": "YCEL", "iata": "", "city": "Capella", "name": "Capella Airport", "runway": "", "lat": "-23.1", "long": "148.033" },
{ "size": "Small", "icao": "", "iata": "CRY", "city": "Carlton Hill", "name": "Carlton Hill Airport", "runway": "", "lat": "-15.502", "long": "128.534" },
{ "size": "Small", "icao": "", "iata": "CTR", "city": "Cattle Creek", "name": "Cattle Creek Airport", "runway": "", "lat": "-17.607", "long": "131.549" },
{ "size": "Medium", "icao": "YBCV", "iata": "CTL", "city": "Charleville", "name": "CHARLEVILLE", "runway": "5000 ft", "lat": "-26.413", "long": "146.262" },
{ "size": "Small", "icao": "", "iata": "", "city": "Chittering", "name": "Chittering Airstrip", "runway": "", "lat": "-31.521", "long": "116.147" },
{ "size": "Small", "icao": "YCFH", "iata": "", "city": "Clifton Hills", "name": "Clifton Hills Airport", "runway": "", "lat": "-27.018", "long": "138.892" },
{ "size": "Medium", "icao": "YCCY", "iata": "CNJ", "city": "Cloncurry", "name": "CLONCURRY", "runway": "6562 ft", "lat": "-20.669", "long": "140.504" },
{ "size": "Small", "icao": "", "iata": "KFE", "city": "Cloudbreak Village", "name": "Fortescue - Dave Forrest Aerodrome", "runway": "", "lat": "-22.285", "long": "119.429" },
{ "size": "Small", "icao": "YFDF", "iata": "", "city": "Cloudbreak Village", "name": "Fortescue - Dave Forrest Aerodrome", "runway": "", "lat": "0.000(N)", "long": "119.429" },
{ "size": "Medium", "icao": "YSCH", "iata": "CFS", "city": "Coffs Harbour", "name": "COFFS HARBOUR", "runway": "6824 ft", "lat": "-30.321", "long": "153.116" },
{ "size": "Small", "icao": "YCEM", "iata": "", "city": "Coldstream", "name": "Coldstream Airport", "runway": "", "lat": "-37.728", "long": "145.408" },
{ "size": "Small", "icao": "", "iata": "COB", "city": "Coolibah", "name": "Coolibah Airport", "runway": "", "lat": "-15.548", "long": "130.962" },
{ "size": "Medium", "icao": "YCOM", "iata": "OOM", "city": "Cooma", "name": "COOMA SNOWY MOUNTAINS", "runway": "6955 ft", "lat": "-36.301", "long": "148.974" },
{ "size": "Small", "icao": "", "iata": "CRJ", "city": "Coorabie", "name": "Coorabie Airport", "runway": "", "lat": "-31.894", "long": "132.296" },
{ "size": "Small", "icao": "YCOD", "iata": "ODL", "city": "Cordillo Downs", "name": "Cordillo Downs Airport", "runway": "", "lat": "-26.745", "long": "140.638" },
{ "size": "Small", "icao": "", "iata": "CSD", "city": "Cresswell Downs", "name": "Cresswell Downs Airport", "runway": "", "lat": "-17.948", "long": "135.916" },
{ "size": "Small", "icao": "YDLW", "iata": "DYW", "city": "Daly Waters", "name": "Daly Waters Airport", "runway": "", "lat": "-16.265", "long": "133.383" },
{ "size": "Small", "icao": "YDNI", "iata": "NLF", "city": "Darnley Island", "name": "Darnley Island Airport", "runway": "", "lat": "-9.583", "long": "143.767" },
{ "size": "Medium", "icao": "YPDN", "iata": "DRW", "city": "Darwin", "name": "DARWIN INTL", "runway": "11004 ft", "lat": "-12.415", "long": "130.877" },
{ "size": "Small", "icao": "", "iata": "", "city": "Delatite", "name": "Delatite Airstrip", "runway": "", "lat": "-37.145", "long": "146.159" },
{ "size": "Small", "icao": "YDEK", "iata": "", "city": "Denmark", "name": "Denmark Airport", "runway": "", "lat": "-34.945", "long": "117.397" },
{ "size": "Small", "icao": "", "iata": "", "city": "Dept. of Conservation, Karijini National Park (08 9189 8157)", "name": "Karijini National Park", "runway": "", "lat": "-22.487", "long": "118.468" },
{ "size": "Medium", "icao": "YDPO", "iata": "DPO", "city": "Devonport", "name": "DEVONPORT", "runway": "6030 ft", "lat": "-41.17", "long": "146.43" },
{ "size": "Small", "icao": "", "iata": "DYM", "city": "Diamantina Lakes", "name": "Diamantina Lakes Airport", "runway": "", "lat": "-23.762", "long": "141.145" },
{ "size": "Small", "icao": "YDDF", "iata": "DFP", "city": "Drumduff", "name": "Drumduff Airport", "runway": "", "lat": "-16.053", "long": "143.012" },
{ "size": "Medium", "icao": "YSDU", "iata": "DBO", "city": "Dubbo", "name": "DUBBO", "runway": "5604 ft", "lat": "-32.217", "long": "148.575" },
{ "size": "Small", "icao": "YDLK", "iata": "DLK", "city": "Dulkaninna", "name": "Dulkaninna Airport", "runway": "", "lat": "-29.013", "long": "138.481" },
{ "size": "Small", "icao": "", "iata": "", "city": "Dwellingup", "name": "Dwellingup Airstrip", "runway": "", "lat": "-32.693", "long": "116.075" },
{ "size": "Small", "icao": "YEIN", "iata": "EIH", "city": "Einasleigh", "name": "Einasleigh Airport", "runway": "", "lat": "-18.503", "long": "144.094" },
{ "size": "Medium", "icao": "YELD", "iata": "ELC", "city": "Elcho Island", "name": "ELCHO ISLAND", "runway": "4724 ft", "lat": "-12.019", "long": "135.571" },
{ "size": "Small", "icao": "", "iata": "EKD", "city": "Elkedra", "name": "Elkedra Airport", "runway": "", "lat": "-21.173", "long": "135.444" },
{ "size": "Small", "icao": "YELL", "iata": "", "city": "Elliott", "name": "Elliott Airport", "runway": "", "lat": "-17.527", "long": "133.53" },
{ "size": "Medium", "icao": "YEML", "iata": "EMD", "city": "Emerald", "name": "EMERALD", "runway": "6234 ft", "lat": "-23.567", "long": "148.179" },
{ "size": "Small", "icao": "YEEB", "iata": "ENB", "city": "Eneabba", "name": "Eneabba Airport", "runway": "", "lat": "-29.833", "long": "115.246" },
{ "size": "Small", "icao": "", "iata": "EDD", "city": "Erldunda", "name": "Erldunda Airport", "runway": "", "lat": "-25.206", "long": "133.254" },
{ "size": "Small", "icao": "YEDA", "iata": "ETD", "city": "Etadunna", "name": "Etadunna Airport", "runway": "", "lat": "-28.741", "long": "138.589" },
{ "size": "Small", "icao": "YEUA", "iata": "", "city": "Euroa", "name": "Euroa Aerodrome", "runway": "", "lat": "-36.745", "long": "145.513" },
{ "size": "Small", "icao": "YEVA", "iata": "EVD", "city": "Eva Downs", "name": "Eva Downs Airport", "runway": "", "lat": "-18.001", "long": "134.863" },
{ "size": "Medium", "icao": "YPLM", "iata": "LEA", "city": "Exmouth", "name": "LEARMONTH", "runway": "9997 ft", "lat": "-22.236", "long": "114.089" },
{ "size": "Small", "icao": "YFNE", "iata": "FIK", "city": "Finke", "name": "Finke Airport", "runway": "", "lat": "-25.595", "long": "134.583" },
{ "size": "Small", "icao": "YFSK", "iata": "", "city": "Fiskville", "name": "Fiskville Airport", "runway": "", "lat": "-37.678", "long": "144.221" },
{ "size": "Medium", "icao": "YFBS", "iata": "FRB", "city": "Forbes,", "name": "FORBES", "runway": "4029 ft", "lat": "-33.364", "long": "147.935" },
{ "size": "Small", "icao": "YFRK", "iata": "", "city": "Frankland River Grazing co", "name": "Frankland Airport", "runway": "", "lat": "-34.423", "long": "117.026" },
{ "size": "Small", "icao": "", "iata": "", "city": "Frankland Valley Vineyard or Ferngrove Winery", "name": "Frankland Valley Vineyard", "runway": "", "lat": "-34.348", "long": "116.952" },
{ "size": "Closed", "icao": "YGAT", "iata": "", "city": "Gatton", "name": "Gatton Campus Airport", "runway": "", "lat": "-27.56", "long": "152.34" },
{ "size": "Closed", "icao": "YWMD", "iata": "", "city": "Gillieston Heights", "name": "West Maitland Airport", "runway": "", "lat": "-32.757", "long": "151.53" },
{ "size": "Medium", "icao": "YGLA", "iata": "GLT", "city": "Gladstone", "name": "GLADSTONE", "runway": "5364 ft", "lat": "-23.87", "long": "151.223" },
{ "size": "Medium", "icao": "YBCG", "iata": "OOL", "city": "Gold Coast", "name": "GOLD COAST", "runway": "6699 ft", "lat": "-28.164", "long": "153.505" },
{ "size": "Small", "icao": "YGDN", "iata": "GDD", "city": "Gordon Downs", "name": "Gordon Downs Airport", "runway": "", "lat": "-18.678", "long": "128.592" },
{ "size": "Small", "icao": "YGKL", "iata": "GKL", "city": "Great Keppel Island", "name": "Great Keppel Is Airport", "runway": "", "lat": "-23.183", "long": "150.942" },
{ "size": "Small", "icao": "YGNF", "iata": "GFE", "city": "Grenfell", "name": "Grenfell Airport", "runway": "", "lat": "-34", "long": "148.133" },
{ "size": "Medium", "icao": "YGTH", "iata": "GFF", "city": "Griffith", "name": "GRIFFITH", "runway": "4931 ft", "lat": "-34.251", "long": "146.067" },
{ "size": "Medium", "icao": "YGTE", "iata": "GTE", "city": "Groote Eylandt", "name": "GROOTE EYLANDT", "runway": "6237 ft", "lat": "-13.975", "long": "136.46" },
{ "size": "Small", "icao": "YSMB", "iata": "", "city": "Grosford", "name": "Somersby Airstrip", "runway": "", "lat": "-33.368", "long": "151.3" },
{ "size": "Medium", "icao": "YBHM", "iata": "HTI", "city": "Hamilton Island", "name": "HAMILTON ISLAND", "runway": "5395 ft", "lat": "-20.358", "long": "148.952" },
{ "size": "Small", "icao": "", "iata": "", "city": "Harrismith", "name": "Harrismith Airport", "runway": "", "lat": "-32.942", "long": "117.865" },
{ "size": "Small", "icao": "YHAW", "iata": "HWK", "city": "Hawker", "name": "Wilpena Pound Airport", "runway": "", "lat": "-31.856", "long": "138.468" },
{ "size": "Small", "icao": "", "iata": "HAT", "city": "Heathlands", "name": "Heathlands Airport", "runway": "", "lat": "-11.737", "long": "142.577" },
{ "size": "Small", "icao": "", "iata": "HLV", "city": "Helenvale", "name": "Helenvale Airport", "runway": "", "lat": "-15.686", "long": "145.215" },
{ "size": "Medium", "icao": "YHBA", "iata": "HVB", "city": "Hervey Bay", "name": "HERVEY BAY", "runway": "6561 ft", "lat": "-25.319", "long": "152.88" },
{ "size": "Small", "icao": "", "iata": "HIG", "city": "Highbury", "name": "Highbury Airport", "runway": "", "lat": "-16.424", "long": "143.146" },
{ "size": "Medium", "icao": "YMHB", "iata": "HBA", "city": "Hobart", "name": "HOBART", "runway": "7385 ft", "lat": "-42.836", "long": "147.51" },
{ "size": "Small", "icao": "YHOV", "iata": "", "city": "Hodgeson River", "name": "Hodgeson River Airfield", "runway": "", "lat": "-15.546", "long": "134.096" },
{ "size": "Closed", "icao": "", "iata": "", "city": "Hopetoun", "name": "Hopetoun Airfield", "runway": "", "lat": "-33.909", "long": "120.147" },
{ "size": "Medium", "icao": "YHID", "iata": "HID", "city": "Horn Island", "name": "HORN ISLAND", "runway": "4557 ft", "lat": "-10.586", "long": "142.29" },
{ "size": "Small", "icao": "YELN", "iata": "", "city": "http://www.elliston.sa.gov.au", "name": "Elliston Airport", "runway": "", "lat": "-33.638", "long": "134.9" },
{ "size": "Small", "icao": "", "iata": "", "city": "http://www.maitraya.com", "name": "Maitraya Resort Airstrip", "runway": "", "lat": "-34.987", "long": "118.056" },
{ "size": "Small", "icao": "", "iata": "", "city": "Indigenous Land Corporation", "name": "Cardabia Station Airstrip", "runway": "", "lat": "-23.106", "long": "113.805" },
{ "size": "Small", "icao": "YILW", "iata": "", "city": "Inglewood", "name": "Inglewood Airport", "runway": "", "lat": "-28.417", "long": "151.083" },
{ "size": "Small", "icao": "YIMT", "iata": "", "city": "Innamincka Township", "name": "Innamincka Township Airport", "runway": "", "lat": "-27.742", "long": "140.745" },
{ "size": "Medium", "icao": "YIVL", "iata": "IVR", "city": "Inverell", "name": "INVERELL", "runway": "6936 ft", "lat": "-29.888", "long": "151.144" },
{ "size": "Small", "icao": "YINW", "iata": "IVW", "city": "Inverway", "name": "Inverway Airport", "runway": "", "lat": "-17.841", "long": "129.643" },
{ "size": "Medium", "icao": "YAMB", "iata": "", "city": "Ipswich", "name": "AMBERLEY", "runway": "9997 ft", "lat": "-27.641", "long": "152.712" },
{ "size": "Small", "icao": "YPSH", "iata": "PEA", "city": "Ironstone", "name": "Penneshaw Airport", "runway": "", "lat": "-35.756", "long": "137.963" },
{ "size": "Small", "icao": "YJST", "iata": "", "city": "Jamestown", "name": "Hubert Wilkins Airstrip", "runway": "", "lat": "-33.192", "long": "138.616" },
{ "size": "Small", "icao": "YJBY", "iata": "", "city": "Jervis Bay Territory", "name": "JERVIS BAY", "runway": "5000 ft", "lat": "-35.147", "long": "150.697" },
{ "size": "Medium", "icao": "YPKG", "iata": "KGI", "city": "Kalgoorlie", "name": "KALGOORLIE BOULDER", "runway": "6562 ft", "lat": "-30.789", "long": "121.462" },
{ "size": "Small", "icao": "YKAP", "iata": "", "city": "Kapunda", "name": "Kapunda Airport", "runway": "", "lat": "-34.25", "long": "138.917" },
{ "size": "Medium", "icao": "YPKA", "iata": "KTA", "city": "Karratha", "name": "KARRATHA", "runway": "6070 ft", "lat": "-20.712", "long": "116.773" },
{ "size": "Medium", "icao": "YPTN", "iata": "KTR", "city": "Katherine", "name": "TINDAL", "runway": "9003 ft", "lat": "-14.521", "long": "132.378" },
{ "size": "Closed", "icao": "YXKE", "iata": "", "city": "Kempsey", "name": "Kempsey Hospital Helicopter Landing Site", "runway": "", "lat": "-31.067", "long": "152.821" },
{ "size": "Small", "icao": "", "iata": "", "city": "Kilcoy", "name": "Kilcoy Airfield", "runway": "", "lat": "-26.971", "long": "152.57" },
{ "size": "Small", "icao": "", "iata": "KBD", "city": "Kimberley Downs", "name": "Kimberley Downs Airport", "runway": "", "lat": "-17.398", "long": "124.355" },
{ "size": "Small", "icao": "YKIR", "iata": "KBB", "city": "Kirkimbie", "name": "Kirkimbie Station Airport", "runway": "", "lat": "-17.779", "long": "129.21" },
{ "size": "Small", "icao": "", "iata": "KOH", "city": "Koolatah", "name": "Koolatah Airport", "runway": "", "lat": "-15.889", "long": "142.439" },
{ "size": "Small", "icao": "YKLB", "iata": "KKP", "city": "Koolburra", "name": "Koolburra Airport", "runway": "", "lat": "-15.319", "long": "143.955" },
{ "size": "Medium", "icao": "YKOW", "iata": "KWM", "city": "Kowanyama", "name": "KOWANYAMA", "runway": "4528 ft", "lat": "-15.486", "long": "141.751" },
{ "size": "Small", "icao": "", "iata": "", "city": "Kukerin WA", "name": "Kukerin", "runway": "", "lat": "-33.175", "long": "118.085" },
{ "size": "Small", "icao": "", "iata": "KGR", "city": "Kulgera", "name": "Kulgera Airport", "runway": "", "lat": "-25.843", "long": "133.292" },
{ "size": "Small", "icao": "", "iata": "", "city": "Kulin", "name": "Kulin Bush Races Strip", "runway": "", "lat": "-32.664", "long": "118.311" },
{ "size": "Medium", "icao": "YPKU", "iata": "KNX", "city": "Kununurra", "name": "KUNUNURRA", "runway": "6000 ft", "lat": "-15.778", "long": "128.708" },
{ "size": "Small", "icao": "YKTN", "iata": "", "city": "Kyneton", "name": "Kyneton Airport", "runway": "", "lat": "-37.226", "long": "144.447" },
{ "size": "Small", "icao": "", "iata": "", "city": "Lake Clifton", "name": "Lake Clifton Airstrip", "runway": "", "lat": "-32.791", "long": "115.671" },
{ "size": "Small", "icao": "YBIZ", "iata": "BZP", "city": "Lakefield National Park", "name": "Bizant Airport", "runway": "", "lat": "-14.74", "long": "144.119" },
{ "size": "Small", "icao": "YLAK", "iata": "", "city": "Lakeside", "name": "Lakeside Airpark", "runway": "", "lat": "-20.682", "long": "148.628" },
{ "size": "Closed", "icao": "YLCI", "iata": "", "city": "Lancelin", "name": "Lancelin Airport", "runway": "", "lat": "-31.017", "long": "115.333" },
{ "size": "Closed", "icao": "", "iata": "", "city": "Latrobe", "name": "Latrobe Airport", "runway": "", "lat": "-41.235", "long": "146.396" },
{ "size": "Medium", "icao": "YMLT", "iata": "LST", "city": "Launceston", "name": "LAUNCESTON", "runway": "6499 ft", "lat": "-41.545", "long": "147.214" },
{ "size": "Closed", "icao": "YLVT", "iata": "", "city": "Laverton", "name": "RAAF Williams, Laverton Base", "runway": "5000 ft", "lat": "-37.864", "long": "144.746" },
{ "size": "Medium", "icao": "YLEO", "iata": "LNO", "city": "Leonora", "name": "LEONORA", "runway": "6621 ft", "lat": "-28.878", "long": "121.315" },
{ "size": "Small", "icao": "", "iata": "LIB", "city": "Limbunya", "name": "Limbunya Airport", "runway": "", "lat": "-17.236", "long": "129.882" },
{ "size": "Small", "icao": "YLIN", "iata": "LDC", "city": "Lindeman Island", "name": "Lindeman Island Airport", "runway": "", "lat": "-20.454", "long": "149.04" },
{ "size": "Medium", "icao": "YLIS", "iata": "LSY", "city": "Lismore", "name": "LISMORE", "runway": "5404 ft", "lat": "-28.83", "long": "153.26" },
{ "size": "Small", "icao": "YLOK", "iata": "LOC", "city": "Lock", "name": "Lock Airport", "runway": "", "lat": "-33.544", "long": "135.693" },
{ "size": "Medium", "icao": "YLRE", "iata": "LRE", "city": "Longreach", "name": "LONGREACH", "runway": "6352 ft", "lat": "-23.434", "long": "144.28" },
{ "size": "Small", "icao": "YLHI", "iata": "LDH", "city": "Lord Howe Island", "name": "Lord Howe Island Airport", "runway": "2900 ft", "lat": "-31.538", "long": "159.077" },
{ "size": "Small", "icao": "YLOV", "iata": "LTV", "city": "Lotus Vale", "name": "Lotus Vale Airport", "runway": "", "lat": "-17.048", "long": "141.376" },
{ "size": "Small", "icao": "YLOH", "iata": "", "city": "Louth", "name": "Louth Airport", "runway": "", "lat": "-30.542", "long": "145.1" },
{ "size": "Small", "icao": "YLHS", "iata": "LTP", "city": "Lyndhurst", "name": "Lyndhurst Airport", "runway": "", "lat": "-19.196", "long": "144.371" },
{ "size": "Small", "icao": "YMAA", "iata": "UBB", "city": "Mabuiag Island", "name": "Mabuiag Island Airport", "runway": "", "lat": "-9.95", "long": "142.183" },
{ "size": "Small", "icao": "", "iata": "MNW", "city": "Macdonald Downs", "name": "Macdonald Downs Airport", "runway": "", "lat": "-22.444", "long": "135.199" },
{ "size": "Medium", "icao": "YBMK", "iata": "MKY", "city": "Mackay", "name": "MACKAY", "runway": "6499 ft", "lat": "-21.172", "long": "149.18" },
{ "size": "Small", "icao": "", "iata": "MIZ", "city": "Mainoru", "name": "Mainoru Airstrip", "runway": "", "lat": "-14.053", "long": "134.094" },
{ "size": "Small", "icao": "YMDI", "iata": "MQA", "city": "Mandora", "name": "Mandora Airport", "runway": "", "lat": "-19.738", "long": "120.838" },
{ "size": "Small", "icao": "YMVM", "iata": "", "city": "Mangrove Mountain", "name": "Mangrove Mountain Airport", "runway": "", "lat": "-33.285", "long": "151.213" },
{ "size": "Medium", "icao": "YMGD", "iata": "MNG", "city": "Maningrida", "name": "MANINGRIDA", "runway": "5020 ft", "lat": "-12.056", "long": "134.234" },
{ "size": "Medium", "icao": "YBMC", "iata": "MCY", "city": "Maroochydore", "name": "MAROOCHYDORE SUNSHINE COAST", "runway": "5896 ft", "lat": "-26.603", "long": "153.091" },
{ "size": "Small", "icao": "YMQA", "iata": "MQE", "city": "Marqua", "name": "Marqua Airport", "runway": "", "lat": "-22.806", "long": "137.251" },
{ "size": "Small", "icao": "YMHU", "iata": "", "city": "McArthur River Mine", "name": "MCARTHUR RIVER MINE", "runway": "4931 ft", "lat": "-16.442", "long": "136.084" },
{ "size": "Medium", "icao": "YMAV", "iata": "AVV", "city": "Melbourne", "name": "AVALON", "runway": "10000 ft", "lat": "-38.039", "long": "144.469" },
{ "size": "Large", "icao": "YMML", "iata": "MEL", "city": "Melbourne", "name": "MELBOURNE INTL", "runway": "11998 ft", "lat": "-37.673", "long": "144.843" },
{ "size": "Medium", "icao": "YMMB", "iata": "MBW", "city": "Melbourne", "name": "MELBOURNE MOORABBIN", "runway": "3812 ft", "lat": "-37.976", "long": "145.102" },
{ "size": "Closed", "icao": "YPLE", "iata": "", "city": "Melbourne", "name": "Plenty Airport", "runway": "", "lat": "-37.723", "long": "145.113" },
{ "size": "Small", "icao": "YTYA", "iata": "", "city": "Melbourne", "name": "Tyabb Airport", "runway": "", "lat": "-38.267", "long": "145.175" },
{ "size": "Small", "icao": "YMEL", "iata": "", "city": "Melton", "name": "Melton Airport", "runway": "", "lat": "-37.617", "long": "144.567" },
{ "size": "Medium", "icao": "YMER", "iata": "MIM", "city": "Merimbula", "name": "MERIMBULA", "runway": "5256 ft", "lat": "-36.909", "long": "149.901" },
{ "size": "Small", "icao": "YMEO", "iata": "", "city": "Merton", "name": "Merton Airport", "runway": "", "lat": "-36.968", "long": "145.708" },
{ "size": "Small", "icao": "", "iata": "", "city": "Middlebrook Station", "name": "Middlebrook Station Scone Airstrip", "runway": "", "lat": "-31.971", "long": "150.811" },
{ "size": "Small", "icao": "YCDL", "iata": "", "city": "Middlesex", "name": "Cradle Mountain Airport", "runway": "", "lat": "-41.581", "long": "145.938" },
{ "size": "Medium", "icao": "YMIA", "iata": "MQL", "city": "Mildura", "name": "MILDURA", "runway": "6004 ft", "lat": "-34.229", "long": "142.086" },
{ "size": "Small", "icao": "YMGB", "iata": "MGT", "city": "Milingimbi Island", "name": "MILINGIMBI", "runway": "4626 ft", "lat": "-12.094", "long": "134.894" },
{ "size": "Small", "icao": "", "iata": "MWY", "city": "Miranda Downs", "name": "Miranda Downs Airport", "runway": "", "lat": "-17.329", "long": "141.886" },
{ "size": "Small", "icao": "YMIP", "iata": "MIH", "city": "Mitchell Plateau", "name": "Mitchell Plateau Airport", "runway": "", "lat": "-14.791", "long": "125.824" },
{ "size": "Medium", "icao": "YMRB", "iata": "MOV", "city": "Moranbah", "name": "MORANBAH", "runway": "5000 ft", "lat": "-22.058", "long": "148.077" },
{ "size": "Medium", "icao": "YMOR", "iata": "MRZ", "city": "Moree", "name": "MOREE", "runway": "5292 ft", "lat": "-29.499", "long": "149.845" },
{ "size": "Small", "icao": "YMOT", "iata": "MET", "city": "Moreton", "name": "Moreton Airport", "runway": "", "lat": "-12.444", "long": "142.638" },
{ "size": "Small", "icao": "", "iata": "", "city": "Morphett Vale", "name": "Huntfield Airfield", "runway": "", "lat": "-35.173", "long": "138.494" },
{ "size": "Medium", "icao": "YMRY", "iata": "MYA", "city": "Moruya", "name": "MORUYA", "runway": "4997 ft", "lat": "-35.898", "long": "150.144" },
{ "size": "Small", "icao": "YMOM", "iata": "", "city": "Moulamein", "name": "Moulamein Airport", "runway": "", "lat": "-35.058", "long": "144.021" },
{ "size": "Small", "icao": "YMBT", "iata": "", "city": "Mount Beauty", "name": "Mount Beauty Airport", "runway": "", "lat": "-36.732", "long": "147.169" },
{ "size": "Small", "icao": "YGON", "iata": "GPD", "city": "Mount Gordon Mine", "name": "Mount Gordon Airport", "runway": "", "lat": "-19.773", "long": "139.404" },
{ "size": "Small", "icao": "YMGN", "iata": "GSN", "city": "Mount Gunson", "name": "Mount Gunson Airport", "runway": "", "lat": "-31.46", "long": "137.174" },
{ "size": "Medium", "icao": "YHOT", "iata": "MHU", "city": "Mount Hotham", "name": "MOUNT HOTHAM", "runway": "4762 ft", "lat": "-37.047", "long": "147.334" },
{ "size": "Medium", "icao": "YBMA", "iata": "ISA", "city": "Mount Isa", "name": "MOUNT ISA", "runway": "8399 ft", "lat": "-20.664", "long": "139.489" },
{ "size": "Small", "icao": "YMUC", "iata": "MUQ", "city": "Muccan Station", "name": "Muccan Station Airport", "runway": "", "lat": "-20.659", "long": "120.067" },
{ "size": "Medium", "icao": "YMDG", "iata": "DGE", "city": "Mudgee", "name": "MUDGEE", "runway": "5705 ft", "lat": "-32.562", "long": "149.611" },
{ "size": "Small", "icao": "YHEW", "iata": "", "city": "Mulara", "name": "Hedlow Airport", "runway": "", "lat": "-23.223", "long": "150.605" },
{ "size": "Small", "icao": "", "iata": "MUP", "city": "Mulga Park", "name": "Mulga Park Airport", "runway": "", "lat": "-25.86", "long": "131.65" },
{ "size": "Small", "icao": "YMUK", "iata": "MVK", "city": "Mulka", "name": "Mulka Airport", "runway": "", "lat": "-28.348", "long": "138.65" },
{ "size": "Small", "icao": "YMBX", "iata": "", "city": "Mundrabilla", "name": "Mundrabilla Airport", "runway": "", "lat": "-31.867", "long": "127.854" },
{ "size": "Small", "icao": "YMUG", "iata": "MNE", "city": "Mungeranie", "name": "Mungeranie Airport", "runway": "", "lat": "-28.009", "long": "138.657" },
{ "size": "Small", "icao": "YLMU", "iata": "", "city": "Mungo", "name": "Mungo Lodge Airport", "runway": "", "lat": "-33.746", "long": "143.001" },
{ "size": "Small", "icao": "YMUI", "iata": "MYI", "city": "Murray Island", "name": "Murray Island Airport", "runway": "", "lat": "-9.917", "long": "144.055" },
{ "size": "Small", "icao": "", "iata": "MYO", "city": "Myroodah", "name": "Camballin Airport", "runway": "", "lat": "-18.125", "long": "124.272" },
{ "size": "Closed", "icao": "", "iata": "", "city": "Nain", "name": "Hutt River Airstrip", "runway": "", "lat": "-28.071", "long": "114.477" },
{ "size": "Small", "icao": "YNHS", "iata": "NBH", "city": "Nambucca Heads", "name": "Nambucca Heads Airport", "runway": "", "lat": "-30.65", "long": "153" },
{ "size": "Small", "icao": "YNUD", "iata": "", "city": "Nammuldi Mine", "name": "Nammuldi Mine Airstrip", "runway": "", "lat": "-22.392", "long": "117.376" },
{ "size": "Medium", "icao": "YNBR", "iata": "NAA", "city": "Narrabri", "name": "NARRABRI", "runway": "5000 ft", "lat": "-30.319", "long": "149.827" },
{ "size": "Medium", "icao": "YNAR", "iata": "NRA", "city": "Narrandera", "name": "NARRANDERA", "runway": "5302 ft", "lat": "-34.702", "long": "146.512" },
{ "size": "Small", "icao": "YDIX", "iata": "DXD", "city": "New Dixie", "name": "Dixie Airport", "runway": "", "lat": "-15.117", "long": "143.316" },
{ "size": "Small", "icao": "", "iata": "", "city": "New Norcia", "name": "New Norcia airstrip", "runway": "", "lat": "-30.967", "long": "116.215" },
{ "size": "Medium", "icao": "YNWN", "iata": "ZNE", "city": "Newman", "name": "NEWMAN", "runway": "6798 ft", "lat": "-23.418", "long": "119.803" },
{ "size": "Medium", "icao": "YPGV", "iata": "GOV", "city": "Nhulunbuy", "name": "GOVE", "runway": "7244 ft", "lat": "-12.269", "long": "136.818" },
{ "size": "Small", "icao": "YGLP", "iata": "", "city": "Nicholson", "name": "Gallipolli Airport", "runway": "", "lat": "-19.142", "long": "137.874" },
{ "size": "Small", "icao": "", "iata": "NKB", "city": "Noonkanbah", "name": "Noonkanbah Airport", "runway": "", "lat": "-18.495", "long": "124.852" },
{ "size": "Small", "icao": "YOLD", "iata": "OLP", "city": "Olympic Dam", "name": "OLYMPIC DAM", "runway": "5220 ft", "lat": "-30.485", "long": "136.877" },
{ "size": "Medium", "icao": "YORG", "iata": "OAG", "city": "Orange", "name": "ORANGE", "runway": "5499 ft", "lat": "-33.382", "long": "149.133" },
{ "size": "Small", "icao": "", "iata": "OKB", "city": "Orchid Beach", "name": "Orchid Beach Airport", "runway": "", "lat": "-24.959", "long": "153.315" },
{ "size": "Small", "icao": "YORV", "iata": "ODR", "city": "Ord River", "name": "Ord River Airport", "runway": "", "lat": "-17.341", "long": "128.912" },
{ "size": "Closed", "icao": "YPAK", "iata": "", "city": "Pakenham", "name": "Pakenham Airport", "runway": "", "lat": "-38.099", "long": "145.488" },
{ "size": "Medium", "icao": "YPBO", "iata": "PBO", "city": "Paraburdoo", "name": "PARABURDOO", "runway": "6995 ft", "lat": "-23.171", "long": "117.745" },
{ "size": "Small", "icao": "YPDO", "iata": "PRD", "city": "Pardoo", "name": "Pardoo Airport", "runway": "", "lat": "-20.118", "long": "119.59" },
{ "size": "Medium", "icao": "YPKS", "iata": "PKE", "city": "Parkes", "name": "PARKES", "runway": "5525 ft", "lat": "-33.131", "long": "148.239" },
{ "size": "Small", "icao": "YPTJ", "iata": "", "city": "Patjarr", "name": "Patjarr Airport", "runway": "", "lat": "-24.619", "long": "126.327" },
{ "size": "Small", "icao": "", "iata": "PEP", "city": "Peppimenarti", "name": "Peppimenarti Airport", "runway": "", "lat": "-14.144", "long": "130.091" },
{ "size": "Small", "icao": "", "iata": "", "city": "Perth", "name": "Langley Park Airstrip", "runway": "", "lat": "-31.961", "long": "115.868" },
{ "size": "Medium", "icao": "YPJT", "iata": "JAD", "city": "Perth", "name": "PERTH JANDAKOT", "runway": "4179 ft", "lat": "-32.097", "long": "115.881" },
{ "size": "Large", "icao": "YPPH", "iata": "PER", "city": "Perth", "name": "PERTH INTL", "runway": "11299 ft", "lat": "-31.94", "long": "115.967" },
{ "size": "Small", "icao": "", "iata": "", "city": "Pinjarra", "name": "Pinjarra Skydiving Airstrip", "runway": "", "lat": "-32.667", "long": "115.882" },
{ "size": "Small", "icao": "", "iata": "", "city": "Pinjarra", "name": "Pinjarra North Airstrip", "runway": "", "lat": "-32.58", "long": "115.885" },
{ "size": "Medium", "icao": "YMPC", "iata": "", "city": "Point Cook", "name": "POINT COOK", "runway": "4508 ft", "lat": "-37.932", "long": "144.753" },
{ "size": "Medium", "icao": "YPPD", "iata": "PHE", "city": "Port Hedland", "name": "PORT HEDLAND INTL", "runway": "8202 ft", "lat": "-20.378", "long": "118.626" },
{ "size": "Medium", "icao": "YPLC", "iata": "PLO", "city": "Port Lincoln", "name": "PORT LINCOLN", "runway": "4918 ft", "lat": "-34.605", "long": "135.88" },
{ "size": "Medium", "icao": "YPMQ", "iata": "PQQ", "city": "Port Macquarie", "name": "PORT MACQUARIE", "runway": "5203 ft", "lat": "-31.436", "long": "152.863" },
{ "size": "Small", "icao": "YKYB", "iata": "", "city": "Private Airfield in the Shire of Campaspe", "name": "Kyabram Airport", "runway": "", "lat": "-36.332", "long": "144.972" },
{ "size": "Medium", "icao": "YBPN", "iata": "PPP", "city": "Proserpine", "name": "PROSERPINE WHITSUNDAY COAST", "runway": "6801 ft", "lat": "-20.495", "long": "148.552" },
{ "size": "Small", "icao": "YRED", "iata": "", "city": "Redcliffe", "name": "Redcliffe Airport", "runway": "2700 ft", "lat": "-27.207", "long": "153.068" },
{ "size": "Small", "icao": "YING", "iata": "", "city": "Rewan", "name": "Ingelara Airport", "runway": "", "lat": "-24.997", "long": "148.333" },
{ "size": "Medium", "icao": "YSRI", "iata": "XRH", "city": "Richmond", "name": "RICHMOND", "runway": "7001 ft", "lat": "-33.601", "long": "150.781" },
{ "size": "Small", "icao": "YRID", "iata": "", "city": "Riddell", "name": "Riddell Airport", "runway": "", "lat": "-37.48", "long": "144.718" },
{ "size": "Small", "icao": "YRBE", "iata": "", "city": "Robe", "name": "Robe Airport", "runway": "", "lat": "-37.175", "long": "139.805" },
{ "size": "Medium", "icao": "YBRK", "iata": "ROK", "city": "Rockhampton", "name": "ROCKHAMPTON", "runway": "8622 ft", "lat": "-23.382", "long": "150.475" },
{ "size": "Small", "icao": "", "iata": "RDA", "city": "Rockhampton Downs", "name": "Rockhampton Downs Airport", "runway": "", "lat": "-18.953", "long": "135.201" },
{ "size": "Small", "icao": "YROE", "iata": "RBU", "city": "Roebourne", "name": "Roebourne Airport", "runway": "", "lat": "-20.762", "long": "117.157" },
{ "size": "Medium", "icao": "YROM", "iata": "RMA", "city": "Roma", "name": "ROMA", "runway": "4934 ft", "lat": "-26.545", "long": "148.775" },
{ "size": "Small", "icao": "YRSY", "iata": "", "city": "Romsey", "name": "Romsey (Riddell/Penfield) Airport", "runway": "", "lat": "-37.392", "long": "144.738" },
{ "size": "Small", "icao": "YRRB", "iata": "RPB", "city": "Roper Bar", "name": "Roper Bar Airport", "runway": "", "lat": "-14.735", "long": "134.525" },
{ "size": "Small", "icao": "YSII", "iata": "SBR", "city": "Saibai Island", "name": "Saibai Island Airport", "runway": "", "lat": "-9.378", "long": "142.625" },
{ "size": "Medium", "icao": "YWSL", "iata": "", "city": "Sale", "name": "WEST SALE", "runway": "5010 ft", "lat": "-38.092", "long": "146.965" },
{ "size": "Small", "icao": "YSAN", "iata": "NDS", "city": "Sandstone", "name": "Sandstone Airport", "runway": "", "lat": "-27.98", "long": "119.297" },
{ "size": "Small", "icao": "", "iata": "SWB", "city": "Shaw River", "name": "Shaw River Airport", "runway": "", "lat": "-21.51", "long": "119.362" },
{ "size": "Small", "icao": "YSHG", "iata": "SGP", "city": "Shay Gap", "name": "Shay Gap Airport", "runway": "", "lat": "-20.425", "long": "120.141" },
{ "size": "Small", "icao": "", "iata": "", "city": "Sherlock", "name": "Sherlock Ultralight Airfield", "runway": "", "lat": "-35.32", "long": "139.793" },
{ "size": "Small", "icao": "YSIA", "iata": "", "city": "Siam", "name": "Siam Airport", "runway": "", "lat": "-32.557", "long": "136.709" },
{ "size": "Small", "icao": "YSGT", "iata": "SIX", "city": "Singleton", "name": "Singleton Airport", "runway": "", "lat": "-32.601", "long": "151.193" },
{ "size": "Small", "icao": "YDOC", "iata": "", "city": "Singleton", "name": "Dochra Airfield", "runway": "10200 ft", "lat": "-32.65", "long": "151.208" },
{ "size": "Small", "icao": "YSWK", "iata": "", "city": "South West Rocks", "name": "South West Rocks Airport", "runway": "", "lat": "-30.925", "long": "153.028" },
{ "size": "Small", "icao": "", "iata": "ZVG", "city": "Springvale", "name": "Springvale Airport", "runway": "", "lat": "-17.787", "long": "127.67" },
{ "size": "Small", "icao": "YSTC", "iata": "", "city": "Stuart Creek", "name": "Stuart Creek Airport", "runway": "", "lat": "-29.717", "long": "137.063" },
{ "size": "Small", "icao": "", "iata": "SSK", "city": "Sturt Creek", "name": "Sturt Creek Airport", "runway": "", "lat": "-19.166", "long": "128.174" },
{ "size": "Small", "icao": "YWBS", "iata": "SYU", "city": "Sue Islet", "name": "Warraber Island Airport", "runway": "", "lat": "-10.208", "long": "142.825" },
{ "size": "Small", "icao": "YPEF", "iata": "", "city": "Sunbury", "name": "Penfield Airfield", "runway": "", "lat": "-37.513", "long": "144.698" },
{ "size": "Medium", "icao": "YSBK", "iata": "BWU", "city": "Sydney", "name": "SYDNEY BANKSTOWN", "runway": "4448 ft", "lat": "-33.924", "long": "150.988" },
{ "size": "Large", "icao": "YSSY", "iata": "SYD", "city": "Sydney", "name": "SYDNEY INTL", "runway": "12999 ft", "lat": "-33.946", "long": "151.177" },
{ "size": "Medium", "icao": "YSTW", "iata": "TMW", "city": "Tamworth", "name": "TAMWORTH", "runway": "7218 ft", "lat": "-31.084", "long": "150.847" },
{ "size": "Small", "icao": "YTAR", "iata": "TAQ", "city": "Tarcoola", "name": "Tarcoola Airport", "runway": "", "lat": "-30.703", "long": "134.584" },
{ "size": "Medium", "icao": "YTRE", "iata": "TRO", "city": "Taree", "name": "TAREE", "runway": "4934 ft", "lat": "-31.889", "long": "152.514" },
{ "size": "Medium", "icao": "YTNK", "iata": "TCA", "city": "Tennant Creek", "name": "TENNANT CREEK", "runway": "6427 ft", "lat": "-19.634", "long": "134.183" },
{ "size": "Small", "icao": "YTFD", "iata": "", "city": "Tenterfield", "name": "Tenterfield Airport", "runway": "", "lat": "-28.992", "long": "151.93" },
{ "size": "Small", "icao": "YTHD", "iata": "TDN", "city": "Theda Station", "name": "Theda Station Airport", "runway": "", "lat": "-14.788", "long": "126.496" },
{ "size": "Small", "icao": "YTHI", "iata": "", "city": "Thistle Island", "name": "Thistle Island Airport", "runway": "", "lat": "-35.025", "long": "136.18" },
{ "size": "Small", "icao": "YTLP", "iata": "", "city": "Tilpa", "name": "Tilpa Airport", "runway": "", "lat": "-30.933", "long": "144.417" },
{ "size": "Small", "icao": "YTMY", "iata": "TYP", "city": "Tobermorey", "name": "Tobermorey Airport", "runway": "", "lat": "-22.256", "long": "137.953" },
{ "size": "Small", "icao": "", "iata": "TPR", "city": "Tom Price", "name": "Tom Price Airport", "runway": "", "lat": "-22.746", "long": "117.869" },
{ "size": "Small", "icao": "YTQY", "iata": "", "city": "Torquay", "name": "Torquay Airport", "runway": "", "lat": "-38.3", "long": "144.365" },
{ "size": "Small", "icao": "", "iata": "TWP", "city": "Torwood", "name": "Torwood Airport", "runway": "", "lat": "-17.363", "long": "143.75" },
{ "size": "Medium", "icao": "YBTL", "iata": "TSV", "city": "Townsville", "name": "TOWNSVILLE", "runway": "7999 ft", "lat": "-19.253", "long": "146.765" },
{ "size": "Small", "icao": "YTFA", "iata": "", "city": "Truro Flat", "name": "Truro Flat Airpark", "runway": "", "lat": "-34.398", "long": "139.385" },
{ "size": "Small", "icao": "YTKY", "iata": "TKY", "city": "Turkey Creek", "name": "Turkey Creek Airport", "runway": "", "lat": "-17.041", "long": "128.206" },
{ "size": "Small", "icao": "YUCH", "iata": "", "city": "Ucharonidge Station", "name": "Ucharonidge Airport", "runway": "", "lat": "-17.672", "long": "134.241" },
{ "size": "Small", "icao": "YBWO", "iata": "", "city": "Upper Cornish Creek", "name": "Bowen Downs Airport", "runway": "", "lat": "-22.464", "long": "144.998" },
{ "size": "Medium", "icao": "YSWG", "iata": "WGA", "city": "Wagga Wagga", "name": "WAGGA WAGGA", "runway": "5801 ft", "lat": "-35.165", "long": "147.466" },
{ "size": "Small", "icao": "YWAL", "iata": "WLA", "city": "Wallal", "name": "Wallal Airport", "runway": "", "lat": "-19.774", "long": "120.649" },
{ "size": "Small", "icao": "YWAX", "iata": "", "city": "Wanarn", "name": "Wanarn Airport", "runway": "", "lat": "-25.298", "long": "127.556" },
{ "size": "Small", "icao": "YGLS", "iata": "", "city": "Warakurna", "name": "Giles Airport", "runway": "", "lat": "-25.044", "long": "128.296" },
{ "size": "Small", "icao": "YWKW", "iata": "", "city": "Warkworth", "name": "Warkworth Airport", "runway": "", "lat": "-32.549", "long": "151.024" },
{ "size": "Small", "icao": "YWVA", "iata": "", "city": "Warnervale", "name": "Warnervale Airport", "runway": "", "lat": "-33.24", "long": "151.43" },
{ "size": "Small", "icao": "", "iata": "WRW", "city": "Warrawagine", "name": "Warrawagine Airport", "runway": "", "lat": "-20.844", "long": "120.702" },
{ "size": "Small", "icao": "YWRR", "iata": "", "city": "Warroora Homestead", "name": "Warroora Homestead Airport", "runway": "", "lat": "-23.446", "long": "113.849" },
{ "size": "Small", "icao": "", "iata": "", "city": "Warroora Station", "name": "Warroora Station Airstrip", "runway": "", "lat": "-23.475", "long": "113.799" },
{ "size": "Small", "icao": "YWAC", "iata": "", "city": "Wauchope", "name": "Wauchope Airport", "runway": "", "lat": "-20.65", "long": "134.217" },
{ "size": "Medium", "icao": "YBWP", "iata": "WEI", "city": "Weipa", "name": "WEIPA", "runway": "5397 ft", "lat": "-12.679", "long": "141.925" },
{ "size": "Small", "icao": "YBSG", "iata": "", "city": "Weipa", "name": "SCHERGER", "runway": "10003 ft", "lat": "-12.624", "long": "142.087" },
{ "size": "Medium", "icao": "YWWL", "iata": "WWY", "city": "West Wyalong", "name": "WEST WYALONG", "runway": "5200 ft", "lat": "-33.937", "long": "147.191" },
{ "size": "Medium", "icao": "YWHA", "iata": "WYA", "city": "Whyalla", "name": "WHYALLA", "runway": "5531 ft", "lat": "-33.059", "long": "137.514" },
{ "size": "Closed", "icao": "YWKH", "iata": "", "city": "Wickham", "name": "Wickham Airport", "runway": "", "lat": "-20.676", "long": "117.125" },
{ "size": "Medium", "icao": "YWLM", "iata": "NTL", "city": "Williamtown", "name": "WILLIAMTOWN", "runway": "7999 ft", "lat": "-32.795", "long": "151.834" },
{ "size": "Small", "icao": "YWDL", "iata": "WON", "city": "Wondoola", "name": "Wondoola Airport", "runway": "", "lat": "-18.575", "long": "140.892" },
{ "size": "Small", "icao": "YWWI", "iata": "WWI", "city": "Woodie Woodie", "name": "Woodie Woodie Airport", "runway": "", "lat": "-21.663", "long": "121.234" },
{ "size": "Small", "icao": "YWKD", "iata": "", "city": "Woodycupaldiya", "name": "Woodycupaldiya Airfield", "runway": "", "lat": "-13.867", "long": "129.988" },
{ "size": "Small", "icao": "YPWR", "iata": "UMR", "city": "Woomera", "name": "WOOMERA", "runway": "7782 ft", "lat": "-31.144", "long": "136.817" },
{ "size": "Small", "icao": "YWKM", "iata": "", "city": "Wyalkatchem", "name": "Wyalkatchem Airport", "runway": "", "lat": "-31.203", "long": "117.379" },
{ "size": "Small", "icao": "YYTA", "iata": "KYI", "city": "Yalata Mission", "name": "Yalata Mission Airport", "runway": "", "lat": "-31.471", "long": "131.825" },
{ "size": "Small", "icao": "YYAL", "iata": "YLG", "city": "Yalgoo", "name": "Yalgoo Airport", "runway": "", "lat": "-28.355", "long": "116.684" },
{ "size": "Small", "icao": "YYMI", "iata": "XMY", "city": "Yam Island", "name": "Yam Island Airport", "runway": "", "lat": "-9.901", "long": "142.776" },
{ "size": "Small", "icao": "", "iata": "KYF", "city": "Yeelirrie", "name": "Yeelirrie Airport", "runway": "", "lat": "-27.277", "long": "120.096" },
{ "size": "Small", "icao": "YYKI", "iata": "OKR", "city": "Yorke Island", "name": "Yorke Island Airport", "runway": "", "lat": "-9.757", "long": "143.411" },
{ "size": "" }]
if (!window.indexedDB) {
	window.alert("Your browser doesn't support a stable version of IndexedDB. Please update to a more modern browser... Something this century...");
}

var db_version = '_v3';

Date.prototype.array = function() {
	var r = {
		yyyy: this.getFullYear().toString(),
		mm: (this.getMonth()+1).toString(), // getMonth() is zero-based
		dd: this.getDate().toString(),
		HH: this.getHours().toString(),
		ii: this.getMinutes().toString(),
		ss: this.getSeconds().toString(),
		ms: this.getMilliseconds().toString()
	}
	
	r.mm = (r.mm[1]?r.mm:"0"+r.mm[0]);
	r.dd = (r.dd[1]?r.dd:"0"+r.dd[0]);
	r.HH = (r.HH[1]?r.HH:"0"+r.HH[0]);
	r.ii = (r.ii[1]?r.ii:"0"+r.ii[0]);
	r.ss = (r.ss[1]?r.ss:"0"+r.ss[0]);
	
	while(r.ms.length < 3){
		r.ms = '0' + r.ms;
	}
	
	return r;
   
  };
Date.prototype.condensed = function() {
   var r = this.array();
   return 'D' + r.yyyy + r.mm + r.dd + 'T' + r.HH + r.ii +  r.ss + 'Z' + r.ms; 
  };
Date.prototype.simple = function() {
   var r = this.array();
   return r.yyyy + '-' + r.mm + '-' + r.dd + ' ' + r.HH + ':' + r.ii + ':' +  r.ss; // padding
  };
function dateId(){
	return (new Date).condensed();
}

function camelCase (input, length){
	var output = input.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
		return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
	}).replace(/\s+/g, '');
	
	if (length === undefined){
		length = 7;
	}
	
	return output.substring(0,length);
}

function newGuid(length) {
	if (length === undefined || length == null) {
		length = 15;
	}

	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;

}

function createId(title){
	return camelCase(title) + '!' + newGuid(8);
}

function unix() {
    return Math.round(new Date().getTime() / 1000);
}

function database (userKey){
	var db = {};
	var iDb;
	if (!window.indexedDB){
		alert('IndexedDB not supported. Please upgrade to a more modern browser, something this century');
	}

	
	db.sync = function (fullsync, callback){
		if (fullsync === undefined){
			fullsync = false;
		}
		
		var tables = ['object','scaffold','user'];
		var keys = {};
		
		var transaction = iDb.transaction(tables);
		
		if (fullsync){
			keys = [];
			for(var i in tables){
				var store = transaction.objectStore(tables[i]);
				var request = store.openCursor();
				request.onsuccess = function(event) {
					if (event.target.result){
						var doc = event.target.result;
						keys.push(doc.key);
						event.target.result.continue();
					}
				};
			}
		}
		else{
			for(var i in tables){
				var store = transaction.objectStore(tables[i]);
				var request = store.openCursor();
				request.onsuccess = function(event) {
					if (event.target.result){
						var doc = event.target.result;
						if (keys[doc.value.key_base] === undefined || doc.key > keys[doc.value.key_base]){
							keys[doc.value.key_base] = doc.key;
						}
						event.target.result.continue();
					}
				};
			}
		}
		
		transaction.oncomplete = function(result) {
			console.log(keys);
			
			$.post('/data/init',{state:keys,fullsync:fullsync},function (changes){
				db.exchange(changes,callback);
			});
		}
	}
	
	db.exchange = function (changes, callback){
		console.log(changes);
		var get_finished = true;
		var send_finished = true;
		for(var i in changes.send){
			send_finished = false;
			db.get(changes.send[i],function (data){
				$.post('/data/set',{data:data[0]},function (){
					send_finished = true;
					if (get_finished && callback !== undefined){
						callback();
					}
				});
			});
		}
		var docs = [];
		for(var i in changes.get){
			get_finished = false;
			$.post('/data/get',{key:changes.get[i]},function (data){
				console.log(data);
				docs.push(data[0]);
				if (docs.length == changes.get.length){
					db.bulkSet(docs, function (){
						get_finished = true;
						if (send_finished && callback !== undefined){
							callback();
						}
					});
				}
			});
		}
		if (get_finished && send_finished && callback !== undefined){
			callback();
		}
	}
	
	db.del = function(id,callback){
		var u = uquery(id);
		var transaction = iDb.transaction(u.table,'readwrite');
		var store = transaction.objectStore(u.table);
		//get existing data chunk
		var request = store.get(u.key);
		request.onsuccess = function(event) {
			if (event.target.result){
				var doc = event.target.result;
				doc.status = 'deleted';
				u.newTimestamp(); // create new version so the status gets synced.
				db.set(u.key,doc, function (){
					callback(u);
				});
			}
		}
		return u;
	}
		
	db.destroy = function(id, callback) {
		var u = uquery(id);
		var transaction = iDb.transaction([u.table],"readwrite");
		var store = transaction.objectStore(u.table);
		
		transaction.oncomplete = function(event) {
			callback();
		}
		store.delete(id);
	}
	
	db.checkId = function(id, callback) {
		var u = uquery(id);
		var transaction = iDb.transaction(u.table);
		
		var request = transaction.objectStore(u.table).get(id);
		request.onsuccess = function(event) {
			callback(true);
		};
		request.onerror = function (event){
			callback(false);
		}
	}
	
	db.init = function (callback_start,callback_end){
		callback_start();
		var request = window.indexedDB.open(userKey + db_version, 3);
		request.onerror = function(event) {
		  alert("HELP!!! Something went wrong!!\n" + event.target.errorCode );
		};
		request.onsuccess = function(event) {
			console.log("database success");
			iDb = event.target.result;
			db.sync(true,callback_end);
		};
		request.onupgradeneeded = function(e) {
			console.log("running onupgradeneeded");
			var thisDB = e.target.result;
			
			var os = [
				"scaffold",
				"object",
				"user",
				"file",
				"subscription"
				];
				
			for (var i in os){
				if(!thisDB.objectStoreNames.contains(os[i])) {
					thisDB.createObjectStore(os[i]);
				}
			}
		}
	}

	db.update = function (definition, update, callback){

	}
	
	db.bulkSet = function(data, callback) {
		if (data.length > 0){
			var doc = data[0];
			data.splice(0, 1);
			if (doc === undefined || doc == null){
				db.bulkSet(data);
			}
			else{
				db.set(doc.key,doc,function (){ 
					db.bulkSet(data, callback);
				});
			}
		}
		else{
			if (callback !== undefined){
				callback(data);
			}
		}
	}
	db.set = function(definition, data, callback) {
		if (data.status == 'destroy'){
			db.destroy(definition,callback()); //should never get here, items should be destroyed as part of the exchange
			return;
		}
		var def = definition;
		if (typeof definition == 'string'){
				def = uquery(definition);
		}



		
		if (data.created_by == undefined || data.created_by == null){
			data.created_by = userKey;
		}
		if (data.created_ts === undefined || data.created_ts == null){
			data.created_ts = Math.round(new Date().getTime() / 1000);
		}
		data.key = def.key;
		data.key_base = def.key_base;

		data.modified_at = Math.round(new Date().getTime() / 1000);
		data.type = def.type;

		
		
		
		var transaction = iDb.transaction(def.table,'readwrite');
		var store = transaction.objectStore(def.table);
		
		store.put(data,def.key);
		
		if (data.status !== undefined && data.status == 'deleted'){
			var request = store.openCursor();
			request.onsuccess = function(event) {
				if (event.target.result){
					var cursor = event.target.result;
					var u = uquery(cursor.key);
					if (u.key_base == def.key_base) {
						var doc = cursor.value;
						doc.status = 'deleted';
						cursor.update(doc);
					}
					cursor.continue();
				}
			}
			transaction.oncomplete=(function (){
				
				if (callback !== undefined){
					callback(data);
				}
			})
		}
		else{
			if (callback !== undefined){
				callback(data);
			}
		}
	}
	
	db.destroyDB = function (callback){		
	    iDb.close();
	    iDb = null;
		var req = window.indexedDB.deleteDatabase(userKey + db_version);
		req.onsuccess = function () {
		    console.log("Deleted database successfully");
		    if (callback !== undefined) {
		        callback();
		    }
		};
		req.onerror = function () {
		    console.log("Couldn't delete database");
		    if (callback !== undefined) {
		        callback();
		    }
		};
		req.onblocked = function () {
		    console.log("Couldn't delete database due to the operation being blocked");
		    if (callback !== undefined) {
		        callback();
		    }
		};
	}
	
	db.get = function(definition, callback) {
		


		var def = definition;
		if (typeof definition == 'string'){
			def = uquery(definition);
		} 
		
		var transaction = iDb.transaction(def.table);
		var store = transaction.objectStore(def.table);

		transaction.oncomplete = function(result) {
			if (def.sub_handle == null){
				callback(aggregate);
			}
			else{
				for(var i in aggregate){
					var item = aggregate[i];
					var val = null;
					var data = null;
					var unset = true;
					if (item.data !== undefined){
						for(var key in item.data){
							if (key == def.sub_handle || (item.data[key].handle !== undefined && item.data[key].handle == def.sub_handle)){
								val = item.data[key];
								unset = false;
							}
						}
					}
					if (unset){
						for(var akey in item){
							if (akey == def.sub_handle || (item[akey] != null && item[akey].handle !== undefined && item[akey].handle == def.sub_handle)){
								val = item[akey];
								unset = false;
							}
						}
					}
					
					aggregate[i] = val;
				}
				callback(aggregate);
			}
		}
		
		var aggregate = [];


		switch (def.flag) {
			case "#": //latest of type
				var request = store.openCursor();
				request.onsuccess = function(event) {
					if (event.target.result){
						var cursor = event.target.result
						var doc = cursor.value;
						var u = uquery(doc.key);
						if (u.type == def.type) {
							var latest = true;
							var first = true;
							var scaff = true;
							for(var i in aggregate){
								if (aggregate[i].key_base == u.key_base){
									first = false;
									if (aggregate[i].key > u.key){
										latest = false;
									}
									else{
										aggregate.splice(i,1);
										i--;
									}
								}
							}
							if (def.handle != ''){
								if (doc.scaffold){
									scaff = uquery(doc.scaffold).handle == def.handle;
								}
								else{
									scaff = false;
								}
							}
							
							if ((first || latest) && doc.status != 'deleted' && scaff){
								aggregate.push(doc);
							}
						}
						cursor.continue();
					}
					
				};
				break;
			case "*": //all of type
				var request = store.openCursor();
				request.onsuccess = function(event) {
					if (event.target.result){
						var doc = event.target.result;
						var u = uquery(doc.key);
						if (u.type == def.type && doc.value.status != 'deleted') {
							aggregate.push(doc.value);
						}
						doc.continue();
					}

				};
				break;
			case "&": //latest of handle
				var request = store.openCursor();
				request.onsuccess = function(event) {
					if (event.target.result){
						var doc = event.target.result;
						var u = uquery(doc.key);
						if (u.type == def.type && u.handle == def.handle) {
							if (aggregate.length == 0 || aggregate[0].key < doc.key){
								aggregate = [doc.value];
							}
						}
						doc.continue();
					}
				};
				break;
			case "%": //owned by user
				var request = store.openCursor();
				request.onsuccess = function(event) {
					if (event.target.result){
						var doc = event.target.result.value;
						var u = uquery(doc.key);
						if (u.type == def.type && doc.created_by !== undefined && doc.created_by == userKey) {
							aggregate.push(doc);
						}
						event.target.result.continue();
					}
				};
				break;
			case '?':
				var request = store.openCursor();
				request.onsuccess = function(event) {
					if (event.target.result){
						var cursor = event.target.result
						var doc = cursor.value;
						var u = uquery(doc.key);
						if (u.type == def.type) {// check for right type
							var latest = true;
							var first = true;
							var filter = false;
							for(var i in aggregate){
								if (aggregate[i].key_base == u.key_base){
									first = false;
									if (aggregate[i].key > u.key){
										latest = false;
									}
									else{
										aggregate.splice(i,1);
										i--;
									}
								}
							}
							if (def.handle != ''){
								var sides = def.handle.split('=');
								if (doc[sides[0]] !== undefined){
									sides[0] = doc[sides[0]];
								}
								else {
									if (doc.data[sides[0]] !== undefined){
										sides[0] = doc.data[sides[0]];
									}
									else{
										throw "value doesn't exist: " + sides[0];
									}
								}
								
								filter = sides[0] == sides[1];
							}
							
							if ((first || latest) && doc.status != 'deleted' && filter){
								aggregate.push(doc);
							}
						}
						cursor.continue();
					}
					
				};
				break;
			default:
				var request = store.get(def.key);
				request.onsuccess = function(event) {
					if (event.target.result){
						aggregate.push(event.target.result);
					}
				}
				break;
		}
	}
	return db;

}


function uquery(definition){
	var u = {};
	u.raw = definition;
	var def = definition.replace(/([^\\]):/g, '$1\u000B').split('\u000B');
	u.type = def[0];
	u.struct = u.type.split('.')[0];
	u.id = '';
	if (def.length > 1){
		u.id = def[1];
	}
	
	u.sub_handle = null;
	if (def.length > 2){
		u.sub_handle = def[2];
	}
	var split = u.id.lastIndexOf('-');
	
	if (split == -1){
		u.handle = u.id;
	}
	else{
		u.handle = u.id.substring(0,split);
	}
	u.flag = u.id[0];
	if (['$','&','*','#','%','?'].indexOf(u.handle[0]) != -1){
		u.handle = u.handle.substr(1);
	}
	else{
		if (split == -1){
			u.flag = '&';
		}
	}
	u.handle = u.handle.replace('\\:',':');
	
	if (split != -1){
		u.timestamp = u.id.substr(split+1);
	}
	else{
		u.timestamp = dateId();
	}
	
	
	var type_parts = u.type.split('.');
	
	u.table = type_parts[0];
	u.s_type = u.table;
	if (type_parts.length > 1){
		u.s_type = type_parts[1];
	}
	u.key_base = u.type + ':' + u.handle;
	u.key = u.type + ':' + u.handle + '-' + u.timestamp;
	
	u.newTimestamp = function(){
		u.timestamp = dateId();
		u.id = u.handle + '-' + u.timestamp;
		u.key = u.type + ':' + u.id;
		
	}
	
	return u;
}

function evalReg(str, obj){
	var std = {
		currentDate: (new Date).simple()
	}
	
	for(var key in std){
		str = str.replace('{' + key + '}',std[key]);
	}
	for(var key in obj){
		str = str.replace('{' + key + '}',obj[key]);
	}
	
	return str;
}