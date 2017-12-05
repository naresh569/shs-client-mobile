
angular.module('starter', ['ionic', 'starter.controllers', 'ngCordova'])

.run(function($ionicPlatform, $state, DEVICE, $rootScope, SESSION, $ionicPopup, $ionicHistory, $cordovaNetwork, CONFIG, USER) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }

    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    DEVICE.init()
    .then(function () {
      console.log(" > Device UUId:", DEVICE.uuid);
      if (DEVICE.isRegistered) {
        $state.go('app.login', {}, { reload: true });
      } else {
        $state.go('app.register', {}, { reload: true });
      }
    }, function () {
      console.log(" > Error in getting device details..");
    });
    
    // Check for validity of session on moving from one page to another
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, options) {
      // console.log(" > APP State Change", event, toState, toParams, fromState, fromParams, options);
      console.log(" > APP To State", toState.name);

      // Authentication bypass for register and login
      if (toState.name === "app.register" || toState.name === "app.login") {
        return;
      }

      // For all other pages except register and login
      // check for authentication
      if (!SESSION.isUserLoggedIn()) { // if not logged in
        event.preventDefault();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: "Invalid Session. Please Login.."
        });
        $state.go('app.login', {}, { reload: true });
        return;
      }

      // For the pages - app.users, app.user
      // user role should be admin
      // Normal user can access only his/her details
      if (toState.name === "app.users") {
        if (USER.isAdmin()) {
          return;
        }
        event.preventDefault();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: "Not authorized to visit this page.."
        });
      }
      if (toState.name === "app.user") {
        var userId = parseInt(toParams.userId);
        if (USER.isGeneralUser() && USER.details._id === userId) {
          return;
        }
        if (USER.isAdmin()) {
          return;
        }
        event.preventDefault();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: "Not authorized to visit this page.."
        });
      }

    });

    // Check for network connectivity on start of app
    if ($cordovaNetwork.isOffline()) {
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
    }

  });

  $ionicPlatform.registerBackButtonAction(function () {

    if ($ionicHistory.backView()) { // if backview is there..
      $ionicHistory.goBack();
    } else {
      $ionicPopup.confirm({
        title: "Confirm",
        template: "Do you want to exit?"
      }).then(function (res) {
        if (res) {
          ionic.Platform.exitApp();
        }
      });
    }

  }, 100);
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  $ionicConfigProvider.backButton.text('').icon('ion-chevron-left').previousTitleText(false);

  $stateProvider
  .state('app', {
    url: '/app',
    cache: false,
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })
  .state('app.register', {
    url: '/register',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/register.html',
        controller: 'RegisterCtrl'
      }
    }
  })
  .state('app.login', {
    url: '/login',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl'
      }
    }
  })
  .state('app.login.password', {
    url: '/login/password',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/login-password.html',
        controller: 'LoginPasswordCtrl'
      }
    }
  })
  .state('app.dashboard', {
    url: '/dashboard',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/dashboard.html',
        controller: 'DashboardCtrl'
      }
    }
  })
  .state('app.blocks', {
    url: '/blocks',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/blocks.html',
        controller: 'BlocksCtrl'
      }
    }
  })
  .state('app.block', {
    url: '/blocks/:blockId',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/block.html',
        controller: 'BlockCtrl'
      }
    }
  })
  .state('app.switches', {
    url: '/switches',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/switches.html',
        controller: 'SwitchesCtrl'
      }
    }
  })
  .state('app.switch', {
    url: '/switches/:switchId',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/switch.html',
        controller: 'SwitchCtrl'
      }
    }
  })
  .state('app.users', {
    url: '/users',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/users.html',
        controller: 'UsersCtrl'
      }
    }
  })
  .state('app.user', {
    url: '/users/:userId',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/user.html',
        controller: 'UserCtrl'
      }
    }
  })
  .state('app.settings', {
    url: '/settings',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/settings.html',
        controller: 'SettingsCtrl'
      }
    }
  })
  .state('app.logout', {
    url: '/logout',
    cache: false,
    views: {
      'menuContent': {
        controller: 'LogoutCtrl',
        templateUrl: 'templates/logout.html'
      }
    }
  });

  // $urlRouterProvider.otherwise('/app/register');
});
