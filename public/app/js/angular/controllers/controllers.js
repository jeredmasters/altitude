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