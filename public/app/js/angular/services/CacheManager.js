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