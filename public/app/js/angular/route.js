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