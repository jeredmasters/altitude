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
