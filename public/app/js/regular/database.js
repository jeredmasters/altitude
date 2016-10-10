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