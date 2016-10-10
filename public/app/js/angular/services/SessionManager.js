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