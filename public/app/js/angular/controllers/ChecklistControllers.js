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
