
angular.module('starter.controllers', ['starter.services', 'starter.filters'])

.controller('AppCtrl', function($scope, SESSION, $rootScope, USER) {

  $rootScope.$watch(function () {
    return SESSION.isUserLoggedIn();
  }, function () {
    $scope.isUserLoggedIn = SESSION.isUserLoggedIn();
  });
  
  $rootScope.$watch(function () {
    return USER.isAdmin();
  }, function () {
    $scope.isUserAdmin = USER.isAdmin();
  });
  
})

.controller('RegisterCtrl', function ($scope, $state, DEVICE, $timeout, $ionicLoading, SERVER, $ionicPopup, $cordovaPreferences, $ionicHistory, CONFIG, $ionicSideMenuDelegate, $cordovaNetwork) {

  $scope.$on('$ionicView.afterEnter', function () {
    $ionicSideMenuDelegate.canDragContent(false);
  });
  $scope.$on('$ionicView.beforeLeave', function () {
    $ionicSideMenuDelegate.canDragContent(true);
  });

  var timer;
  var pin;

  $scope.server = CONFIG.server;  
  $scope.title = CONFIG.appTitle;
  $scope.nwUser = {
    name: "",
    username: "",
    pin: ""
  };

  $scope.error = "";

  $scope.register = function () {
    timer && $timeout.cancel(timer);
    $ionicLoading.show();

    // Check for validation
    validate();
    if ($scope.error) { // If error is there
      $ionicLoading.hide();
      timer = $timeout(function () {
        $scope.error = "";
      }, CONFIG.timeout.error); // Display the error for 3 seconds
      return;
    }

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    // Notes: Since $scope.nwUser.pin is a number
    // 0s in the left hand side will be neglected.. 
    // So adding manually
    var userPin = "" + $scope.nwUser.pin;
    while (userPin.length < 6) {
      userPin = "0" + userPin;
    }
    console.log(' > User Pin:', userPin);

    var data = {
      name: $scope.nwUser.name,
      username: $scope.nwUser.username,
      pin: userPin,
      deviceUUId: DEVICE.uuid
    };
    var errorMsg = "Registration failed..";
    SERVER.register(data) // Posting the new user details to SERVER
    .then(function (res) {
      if (res.data && res.data.success) {
        DEVICE.setRegSuccess();
        $ionicLoading.hide();
        $ionicHistory.nextViewOptions({
          disableBack: true
        });
        $ionicPopup.alert({
          title: "SUCCESS",
          okType: "button-positive",
          template: "Device registration successful.."
        }).then(function () {
          // Processing has been delayed for smooth transition
          // Delay can be configured in CONFIG - service
          $ionicLoading.show();
          $timeout(function () {
            $ionicLoading.hide();
            $state.go("app.login");
          }, CONFIG.timeout.delay);
        });
      } else {
        $ionicLoading.hide();
        if (res.data && res.data.message) {
          errorMsg = res.data.message;
        }
        console.log(" >> ", errorMsg);
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        // if (err.data.forceLogout) {
        //   $timeout(function () {
        //     $rootScope.$broadcast('doLogout');
        //   }, CONFIG.timeout.delay);
        // }

      }
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });

  };

  $scope.openSettings = function () {
    var preValue = $scope.server.url;
    $ionicPopup.show({
      title: "SETTINGS",
      template: "Server URL<br><input type=\"text\" ng-model=\"server.url\">",
      scope: $scope,
      buttons: [
        {
          text: "Cancel",
          type: "button-light",
          onTap: function () {
            $scope.server.url = preValue;
          }
        },
        {
          text: "Submit",
          type: "button-positive",
          onTap: function () {
            console.log(" > Close the modal..");
          }
        }
      ]
    });
  };

  $scope.simplifyName = function () {
    var name = $scope.nwUser.name;
    name = name.replace(/[\d!"#$%&'(*)+,-\/:;<=>?@\\\[\]\^_\`\{\|\}~]/g, '');
    // name = name.replace(/ */, ' '); // toomany spaces
    name = name.toLowerCase();
    name = name.replace(/(^| )(\w)/g, function (x) {
      return x.toUpperCase();
    });
    $scope.nwUser.name = name;
  };

  $scope.simplifyUsername = function () {
    var username = $scope.nwUser.username;
    username = username.toLowerCase();
    username = username.replace(/[\s!"#$%&'(*)+,-\/:;<=>?@\\\[\]\^\`\{\|\}~]/g, '')
    console.log(" > Username", username);
    i = 0;
    while (username[i] in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      username = username.split('');
      username[0] = ''
      username = username.join('');
      console.log(" > removed number..", username);
      i++;
    }
    $scope.nwUser.username = username;
  };

  $scope.simplfyPin = function () {
    if (!$scope.nwUser.pin) {
      $scope.nwUser.pin = "";
    }
  };

  function validate() {
    // Overall validation
    if (!$scope.nwUser.name  &&
      !$scope.nwUser.username &&
      !$scope.nwUser.pin) {
      console.log(" > Please fill all fields..");
      $scope.error = "Please fill all fields..";
      return false;
    }

    // Validation for Name
    if ($scope.nwUser.name.length < 3 ||
      $scope.nwUser.name.length > 64   ||
      /^[A-Za-z\s]{1,}[\.]{0,1}[A-Za-z\s]{0,}$/.test($scope.nwUser.name) === false) {
      console.log(" > Invalid Name..");
      $scope.error = "Invalid Name..";
      return false;
    }

    // Validation for Username
    if ($scope.nwUser.username.length < 3 ||
      $scope.nwUser.username.length > 20   ||
      /^[a-z]{1,}[0-9]{0,}$/.test($scope.nwUser.username) === false) {
      console.log(" > Invalid Username..");
      $scope.error = "Invalid Username..";
      return false;
    }

    // Validation for Pin
    if (!$scope.nwUser.pin) {
      console.log(" > Invalid Pin..");
      $scope.error = "Invalid PIN.."
      return false;
    }

    return true;
  }
})

.controller('LoginCtrl', function($scope, $state, $ionicHistory, DEVICE, SERVER, $ionicLoading, SESSION, $ionicPopup, $timeout, CONFIG, $ionicSideMenuDelegate, $cordovaNetwork, USER, $rootScope, Idle) {

  $scope.$on('$ionicView.afterEnter', function () {
    $ionicSideMenuDelegate.canDragContent(false);
  });
  $scope.$on('$ionicView.beforeLeave', function () {
    $ionicSideMenuDelegate.canDragContent(true);
  });

  var timer;

  $scope.loginDetails = {
    userPin: ""
  };
  $scope.error = "";
  $scope.server = CONFIG.server;
  $scope.title = CONFIG.appTitle;

  $scope.login = function () {
    timer && $timeout.cancel(timer);
    $ionicLoading.show();
    console.log(" > logging in..", $scope.loginDetails);

    // Validation
    if (!$scope.loginDetails.userPin) {
      $ionicLoading.hide();
      console.log(" > Please enter the PIN..");
      $scope.error = "Please enter the PIN..";
      timer = $timeout(function () {
        $scope.error = "";
      }, CONFIG.timeout.error); // Display the error for 3 seconds
      return;
    }
    if ($scope.loginDetails.userPin.length < 6) {
      $ionicLoading.hide();
      console.log(" > PIN should be of length 6..");
      $scope.error = "PIN should be of length 6..";
      timer = $timeout(function () {
        $scope.error = "";
      }, CONFIG.timeout.error); // Display the error for 3 seconds
      return;
    }

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    // Notes: Since $scope.loginDetails.userPin is a number
    // 0s in the left hand side will be neglected.. 
    // So adding manually
    // var userPin = "" + $scope.loginDetails.userPin;
    // console.log(' > User Pin1:', userPin);
    // console.log(' > User Pin1 length:', userPin.length);
    // while (userPin.length < 6) {
    //   userPin = "0" + userPin;
    // }
    // console.log(' > User Pin2:', userPin);
    
    var data = {
      deviceUUId: DEVICE.uuid,
      userPin: $scope.loginDetails.userPin
    }

    var errorMsg = "Authentication failed..";
    SERVER.login(data)
    .then(function (res) {
      if (res.data && res.data.success) {
        console.log(" >> Authentication successful..", res.data);
        SESSION.start({
          token: res.data.token,
          userId: res.data.userId
        }).then(function () {
          USER.init()
          .then(function () {
            console.log(" > User details has been set..");
            $state.go("app.dashboard");
            Idle.watch();
            // $ionicHistory.clearHistory();
            $ionicHistory.nextViewOptions({
              disableBack: true
            });
            $ionicLoading.hide();
          }, function () {
            $ionicLoading.hide();
            $scope.loginDetails.userPin = "";
            console.log(" > Unable to get user details..");
            errorMsg = "Unable to get user details..";
            $ionicPopup.alert({
              title: "ERROR",
              okType: "button-positive",
              template: errorMsg
            });
          });
          
        }, function (err) {
          $ionicLoading.hide();
          $scope.loginDetails.userPin = "";
          errorMsg = "Unable to start session..";
          console.log(" > Unable to start the session..");
          $ionicPopup.alert({
            title: "ERROR",
            okType: "button-positive",
            template: errorMsg
          });
        });
      } else {
        $ionicLoading.hide();
        $scope.loginDetails.userPin = "";
        if (res.data && res.data.message) {
          errorMsg = res.data.message;
        }
        console.log(" >> ", errorMsg); // username and password failure
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        // if (err.data.forceLogout) {
        //   $timeout(function () {
        //     $rootScope.$broadcast('doLogout');
        //   }, CONFIG.timeout.delay);
        // }

      }
      $ionicLoading.hide();
      $scope.loginDetails.userPin = "";
      console.log(" >> ", errorMsg);
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });

  };

  $scope.openSettings = function () {
    var preValue = $scope.server.url;
    $ionicPopup.show({
      title: "SETTINGS",
      template: "Server URL<br><input type=\"text\" ng-model=\"server.url\">",
      scope: $scope,
      buttons: [
        {
          text: "Cancel",
          type: "button-light",
          onTap: function () {
            $scope.server.url = preValue;
          }
        },
        {
          text: "Submit",
          type: "button-positive",
          onTap: function () {
            console.log(" > Close the modal..");
          }
        }
      ]
    });
  };

  $scope.simplfyPin = function () {
    if (!$scope.loginDetails.userPin) {
      $scope.loginDetails.userPin = "";
    }
  };
})

.controller('LoginPasswordCtrl', function($scope, $timeout, CONFIG, SERVER, $state, SESSION, $ionicHistory, $cordovaNetwork, $ionicPopup, USER) {

  $scope.server = CONFIG.server;

  // Form data for the login modal
  $scope.loginData = {};

  // Perform the login action when the user submits the login form
  $scope.login = function() {
    
    if (!$scope.loginData.username) {
      return;
    }

    if (!$scope.loginData.password) {
      return;
    }

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    console.log('Doing login', $scope.loginData);
    SERVER.login($scope.loginData)
    .then(function(res){
      console.log(" >> I got the response for Authentication..", res);
      if (res.data && res.data.success) {
        console.log(" >> Authentication successful..");
        SESSION.start({
          token: res.data.token,
          userId: res.data.userId
        }).then(function () {
          USER.init();
        });
        $state.go("app.dashboard");
        // $ionicHistory.clearHistory();
        $ionicHistory.nextViewOptions({
          disableBack: true
        });
      } else {
        console.log(" >> Authentication failed.."); // username and password failure
        alert("Invalid User Credentials..");
      }

    }, function(res){
      console.log(" >> Authentication error..", res); // no internet, server is down
    })
  };

})

.controller('LogoutCtrl', function (SESSION, CONFIG, $state, $ionicHistory, $timeout, $ionicLoading, $ionicPopup, $cordovaNetwork, SERVER, $rootScope) {

  function init() {

    // Confirm whether user want to logout or not
    $ionicPopup.confirm({
      title: "CONFIRM",
      okType: "button-positive",
      template: "Do you want to logout?"
    }).then(function (res) {
      if (res) {
        // Do logout

        if ($cordovaNetwork.isOnline()) {
          // If the device is online, inform SERVER
          // that the user is logging out
          $ionicLoading.hide();
          SERVER.logout();
        }

        $ionicLoading.show();
        $timeout(function () {
          console.log(" > logging out..");
          $ionicLoading.hide();
          $rootScope.$broadcast('doLogout');
        }, CONFIG.timeout.delay);
      } else {
        $ionicHistory.backView().go();
      }
    });
  }
  
  init();

})

.controller('DashboardCtrl', function ($scope, SESSION, SERVER, $ionicLoading, $cordovaNetwork, CONFIG, $ionicPopup, USER, $rootScope, $timeout) {
  $scope.user = null;
  $scope.overview = null;
  $scope.isUserAdmin = false;

  function init() {
    $scope.user = USER.details;
    console.log(" > DASHBOARD User Details:", $scope.user);
    $scope.isUserAdmin = USER.isAdmin();
    console.log(" > DASHBOARD Is Admin", $scope.isUserAdmin);

    $ionicLoading.show();

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    var errorMsg = "Data Unavailable..";
    SERVER.getOverview()
    .then(function (res) {
      if (res.data) {
        $scope.overview = res.data;
        $ionicLoading.hide();
      } else {
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
      console.log(" > Server error:",err);
    });
  }
  
  init();

  $scope.doRefresh = function() {
    init();
    $scope.$broadcast('scroll.refreshComplete');
  };

})

.controller('BlocksCtrl', function ($scope, SERVER, $state, $ionicLoading, $ionicPopup, $cordovaNetwork, CONFIG, $timeout, $rootScope) {

  $scope.blocks = [];

  $scope.toggleSwitch = function (event) {
    console.log(" > I got clicked..");
  };

  function init() {
    $ionicLoading.show();

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    var errorMsg = "Data Unavailable..";
    SERVER.getAllBlocks()
    .then(function (res) {
      if (res.data) {
        $scope.blocks = res.data;
        $ionicLoading.hide();
      } else {
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });
  }

  init();

  $scope.doRefresh = function() {
    init();
    $scope.$broadcast('scroll.refreshComplete');
  };

})

.controller('BlockCtrl', function($scope, $stateParams, SERVER, $ionicLoading, $ionicPopup, CONFIG, $cordovaNetwork, USER, $timeout, $rootScope) {

  $scope.block = null;
  $scope.switches = [];
  $scope.clickToggle = function(evt){
    evt.stopPropagation();
  };

  function init() {
    $ionicLoading.show();
    $scope.isUserAdmin = USER.isAdmin();
    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    var errorMsg = "Data Unavailable..";
    SERVER.getBlock({
      bid: $stateParams.blockId
    }).then(function (res) {
      $scope.block = res.data;
      console.log(' > Details of Block:', $scope.block);
      
      SERVER.getSwitches({
        bid: $stateParams.blockId
      })
      .then(function (res) {
        if (res.data) {
          $scope.switches = res.data;
          $ionicLoading.hide();
        } else {
          $ionicLoading.hide();
          $ionicPopup.alert({
            title: "ERROR",
            okType: "button-positive",
            template: errorMsg
          });
        }
      }, function (err) {
        if (err.statusText) {
          errorMsg = err.statusText;
        }
  
        if (err.data) {
          if (err.data.message) {
            errorMsg = err.data.message;
          }
  
          if (err.data.forceLogout) {
            $timeout(function () {
              $rootScope.$broadcast('doLogout');
            }, CONFIG.timeout.delay);
          }
  
        }

        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      });

    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });

    });
    
  }

  init();

  $scope.doRefresh = function() {
    init();
    $scope.$broadcast('scroll.refreshComplete');
  };

  $scope.clickToggle = function(evt, sw) {
    $ionicLoading.show();
    var status = '0';
    if(evt.target.checked) {
      status = '5';
    }

    console.log("I got changed to", status);
    console.log("sw", sw);

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      sw.status = (status == '5') ? '0' : '5';
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }
    
    var errorMsg = "Operation Failed..";
    SERVER.changeSwitchStatus(sw.sid, {
      status: status
    })
    .then(function (res) {
      if (res.data && res.data.success) {
        sw.status = status;
        $ionicLoading.hide();
      } else {
        if (res.data && res.data.message) {
          errorMsg = res.data.message;
        }
        sw.status = (status == '5') ? '0' : '5';
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      sw.status = (status == '5') ? '0' : '5';
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });
  };

})

.controller("SwitchesCtrl", function($scope, SERVER, $ionicLoading, $ionicPopup, $cordovaNetwork, CONFIG, $timeout, $rootScope){

  $scope.switches = [];
  $scope.filters = [
    {
      value: "all",
      displayName: "All"
    },
    {
      value: "active",
      displayName: "Active"
    },
    {
      value: "inactive",
      displayName: "Inactive"
    }
  ]
  $scope.filter = "all";

  function init() {
    $ionicLoading.show();

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    var errorMsg = "Data Unavailable..";
    SERVER.getAllSwitches()
    .then(function(res){
      if (res.data) {
        $scope.switches = res.data;
        $ionicLoading.hide();
      } else {
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });

    $scope.filter = "active";
  }

  init();

  $scope.doRefresh = function() {
    init();
    $scope.$broadcast('scroll.refreshComplete');
  };

  $scope.clickToggle = function(evt, sw) {
    $ionicLoading.show();
    var status = '0';
    if(evt.target.checked) {
      status = '5';
    }

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      sw.status = (status == '5') ? '0' : '5';
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    console.log("I got changed to", status);
    console.log("sw", sw);
    
    var errorMsg = "Operation Failed..";
    SERVER.changeSwitchStatus(sw.sid, {
      status: status
    })
    .then(function (res) {
      if (res.data && res.data.success) {
        sw.status = status;
        $ionicLoading.hide();
      } else {
        if (res.data && res.data.message) {
          errorMsg = res.data.message;
        }
        sw.status = (status == '5') ? '0' : '5';
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      sw.status = (status == '5') ? '0' : '5';
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });
  };

})

.controller('SwitchCtrl', function($scope, SERVER, $stateParams, $ionicPopup, $ionicLoading, $cordovaNetwork, CONFIG, SESSION, USER, $timeout, $rootScope){
  $scope.switch = null;
  $scope.isUserAdmin = false;

  function init() {
    $scope.isUserAdmin = USER.isAdmin();
    /* Notes
    {
      "sid": 1,
      "type": "1",
      "pin": 2,
      "status": "0",
      "lock": 0,
      "title": "Main Light",
      "desc": "The CFL (Compact Fluroscent Light) Bulb located in the Hall center",
      "subtitle": 'Main fan for the Hall'
    }
    */
    $ionicLoading.show();

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    var errorMsg = "Data Unavailable..";
    SERVER.getSwitch({
      sid: $stateParams.switchId
    }).then(function (res) {
      $scope.switch = res.data;
      $ionicLoading.hide();
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      $ionicLoading.hide();
      ionicPopup.alert({
        title: "Error",
        template: errorMsg
      });
    });
  }

  init();

  $scope.doRefresh = function() {
    init();
    $scope.$broadcast('scroll.refreshComplete');
  };

  $scope.clickToggle = function(evt, sw) {
    $ionicLoading.show();
    var status = '0';
    if(evt.target.checked) {
      status = '5';
    }

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      sw.status = (status == '5') ? '0' : '5';
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    var errorMsg = "Operation Failed..";
    SERVER.changeSwitchStatus(sw.sid, {
      status: status
    })
    .then(function (res) {
      if (res.data && res.data.success) {
        sw.status = status;
        $ionicLoading.hide();
      } else {
        if (res.data && res.data.message) {
          errorMsg = res.data.message;
        }
        sw.status = (status == '5') ? '0' : '5';
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      sw.status = (status == '5') ? '0' : '5';
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });
  };

  $scope.changeLevel = function (evt, newVal, oldVal) {
    console.log(' > Switch status changed to', newVal, 'from', oldVal);
    $ionicLoading.show();

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $scope.switch.status = oldVal;
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    var errorMsg = "Operation Failed..";
    SERVER.changeSwitchStatus($scope.switch.sid, {
      status: newVal
    }).then(function (res) {
      if (res.data && res.data.success) {
        console.log(' > SUCCESS');
        $ionicLoading.hide();
      } else {
        if (res.data && res.data.message) {
          errorMsg = res.data.message;
        }
        $scope.switch.status = oldVal;
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
      console.log(' > RESPONSE', res);
      
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      console.log(' > ERROR', err);
      $scope.switch.status = oldVal;
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });
  }

  $scope.toggleLock = function () {
    console.log(' > LOCK:', $scope.switch.lock);
    $ionicLoading.show();

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $scope.switch.lock = $scope.switch.lock ? false : true;
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    var errorMsg = "Operation Failed..";
    SERVER.changeSwitchLockStatus($scope.switch.sid, {
      lock: $scope.switch.lock
    }).then(function (res) {
      if (res.data && res.data.success) {
        console.log(' > Change of lock: SUCCESS');
        $ionicLoading.hide();
      } else {
        if (res.data && res.data.message) {
          errorMsg = res.data.message;
        }
        $scope.switch.lock = $scope.switch.lock ? false : true;
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }

    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      console.log(' > Error', err);
      $scope.switch.lock = $scope.switch.lock ? false : true;
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });
  }
  
})

.controller('UsersCtrl', function($scope, SERVER, $ionicModal, $timeout, $ionicLoading, $ionicPopup, $cordovaNetwork, CONFIG, $rootScope) {

  $scope.users = [];

  function init() {
    $ionicLoading.show();
    
    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }
    
    var errorMsg = "Data Unavailable..";
    SERVER.getAllUsers()
    .then(function (res) {
      if (res && res.data) {
        $scope.users = res.data;
        $ionicLoading.hide();
      } else {
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });
  }

  init();

  $scope.doRefresh = function() {
    init();
    $scope.$broadcast('scroll.refreshComplete');
  };

  /*
  * Notes: One user per device functionality does not support
  * add user functionality..
  * You need device uuid to add user
  $scope.nwUser = {
    name: "",
    username: "",
    pin: "",
    accessLevel: "1",
    deactiveted: false
  };

  $ionicModal.fromTemplateUrl('templates/modal-add-user.html', {
    scope: $scope
  }).then(function (modal) {
    $scope.modal = modal;
  });

  $scope.openAddUser = function () {
    $scope.modal.show();
  };

  $scope.closeAddUser = function () {
    $scope.modal.hide();
  }

  $scope.addUser = function () {
    console.log(" > adding new user..")
    console.log(" > details:", $scope.nwUser);
    SERVER.addUser($scope.nwUser)
    .then(function (res) {
      if (res.data && res.data.success) {
        console.log(' > User successfully added..');

        // Update the SESSIONS List by adding new user
        $scope.users.append({
          _id: res.data.id, // will be retrieved from SERVER
          name: $scope.nwUser.name,
          username: $scope.nwUser.username,
          accessLevel: $scope.nwUser.accessLevel,
          deactivated: $scope.nwUser.deactivated
        });

        // Reset the newUser
        $scope.nwUser.name = "";
        $scope.nwUser.username = "";
        $scope.nwUser.pin = "";
        $scope.nwUser.accessLevel = "1";
        $scope.nwUser.deactiveted = false;

      } else {
        console.log(' > User adding failed..', res.data.message);
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      console.log(' > User adding failed..', err);
    });
    $timeout(function () {
      $scope.closeAddUser();
    }, 500);
  }
  */

  
})

.controller('UserCtrl', function($scope, $stateParams, SERVER, $ionicModal, $timeout, $ionicPopup, $ionicLoading, CONFIG, $cordovaNetwork, SESSION, USER, $rootScope) {

  var timer;

  var timerForClicks;
  var clicksOnUsername = 0;

  $scope.user = null;
  $scope.changePinDetails = {};
  $scope.error = null;
  $scope.userTypes = [
    {
      id: 1,
      label : "General"
    },
    {
      id: 2,
      label : "Admin"
    }
  ];
  $scope.isLoggedInUserAdmin = false;

  $scope.getUserType = function (id) {
    var type = "User";
    $scope.userTypes.forEach(function (val, ind, arr) {
      if (val.id === id) {
        type = val.label;
      }
    });
    return type;
  };
  
  $ionicModal.fromTemplateUrl("templates/modal-change-pin.html", {
    scope: $scope
  }).then(function (modal) {
    $scope.modalChangePin = modal;
  });

  $scope.clicksOnUsername = function (event) {
    timerForClicks && $timeout.cancel(timerForClicks);
    clicksOnUsername += 1;
    if (clicksOnUsername == 3) {
      clicksOnUsername = 0;
      console.log(" > It works..");
      $ionicPopup.alert({
        title: "ALERT",
        okType: "button-positive",
        template: "You Got It.."
      });
    }

    timerForClicks = $timeout(function () {
      timerForClicks = null;
      clicksOnUsername = 0;
    }, 600);
  };

  $scope.changeName = function () {
    var preName = $scope.user.name;
    $ionicPopup.show({
      title: "CHANGE YOUR NAME",
      subTitle: "It will be displayed everywhere..",
      template: '<input type="text" ng-model="user.name" />',
      scope: $scope,
      buttons: [
        {
          text: "Cancel",
          type: "button-light",
        },
        {
          text: "<b>Save</b>",
          type: "button-positive",
          onTap: function (e) {
            if (!$scope.user.name) {
              e.preventDefault();
            } else {
              return $scope.user.name;
            }
          }
        }
      ]
    }). then(function (name) {
      console.log(" > Name Change..", name, preName);
      if (!name) {
        $scope.user.name = preName;
      } else {
        // Send the request to SERVER for changing the name
        $ionicLoading.show();

        // Check for network connectivity
        if ($cordovaNetwork.isOffline()) {
          $scope.user.name = preName;
          $ionicLoading.hide();
          $ionicPopup.alert({
            title: "ERROR",
            okType: "button-positive",
            template: CONFIG.message.errorNetwork
          });
          return;
        }

        var errorMsg = "Operation Failed..";
        SERVER.changeUserDetails($scope.user._id, {
          name: name
        })
        .then(function (res) {
          if (res.data && res.data.success) {
            $scope.user.name = name;
            updateCurrentUserDetails();
            $ionicLoading.hide();
          } else {
            if (res.data && res.data.message) {
              errorMsg = res.data.message;
            }
            $scope.user.name = preName;
            $ionicLoading.hide();
            $ionicPopup.alert({
              title: "ERROR",
              okType: "button-positive",
              template: errorMsg
            });
          }
        }, function (err) {
          if (err.statusText) {
            errorMsg = err.statusText;
          }
    
          if (err.data) {
            if (err.data.message) {
              errorMsg = err.data.message;
            }
    
            if (err.data.forceLogout) {
              $timeout(function () {
                $rootScope.$broadcast('doLogout');
              }, CONFIG.timeout.delay);
            }
    
          }
  
          $scope.user.name = preName;
          $ionicLoading.hide();
          $ionicPopup.alert({
            title: "ERROR",
            okType: "button-positive",
            template: errorMsg
          });
        });
      }
    });
  };

  $scope.changePin = function () {
    timer && $timeout.cancel(timer);
    console.log(" > Changed Pin Details:", $scope.changePinDetails);

    // Validation
    if (!$scope.changePinDetails.oPin ||
        !$scope.changePinDetails.nPin ||
        !$scope.changePinDetails.rPin) {
      $scope.error = "Enter PIN Details!";
      timer = $timeout(function () {
        $scope.error = "";
      }, CONFIG.timeout.error);
      return;
    }
    
    if ($scope.changePinDetails.oPin.length < 6 ||
        $scope.changePinDetails.nPin.length < 6 ||
        $scope.changePinDetails.rPin.length < 6) {
      $scope.error = "PIN should be of length 6..";
      timer = $timeout(function () {
        $scope.error = "";
      }, CONFIG.timeout.error); // Display the error for 3 seconds
      return;
    }

    // var userCurPin = "" + $scope.changePinDetails.oPin;
    // while (userCurPin.length < 6) {
    //   userCurPin = "0" + userCurPin;
    // }
    // var userNewPin = "" + $scope.changePinDetails.nPin;
    // while (userNewPin.length < 6) {
    //   userNewPin = "0" + userNewPin;
    // }
    // var userRtpPin = "" + $scope.changePinDetails.nPin;
    // while (userRtpPin.length < 6) {
    //   userRtpPin = "0" + userRtpPin;
    // }

    if ($scope.changePinDetails.nPin !== $scope.changePinDetails.rPin) {
      console.log(' > Retyped PIN Mismatch!');
      // $scope.changePinDetails.rPin = "";
      $scope.error = "Retyped PIN Mismatch!";
      timer = $timeout(function () {
        $scope.error = "";
      }, CONFIG.timeout.error);
      return;
    }

    $ionicLoading.show();

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $scope.changePinDetails = {};
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    var errorMsg = "Operation Failed!";
    SERVER.changeUserDetails($scope.user._id, {
      newPin: $scope.changePinDetails.nPin,
      curPin: $scope.changePinDetails.oPin
    }).then(function (res) {
      if (res.data && res.data.success) {
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "SUCCESS",
          okType: "button-positive",
          template: "PIN Change Successful!"
        }).then(function () {
          $scope.changePinDetails = {};
          $scope.modalChangePin.hide();
        });
      } else {
        if (res.data && res.data.message) {
          errorMsg = res.data.message;
        }
        $scope.changePinDetails = {};
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      $scope.changePinDetails = {};
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });
  };

  $scope.simplfyPin = function (pinType) {
    if (!$scope.changePinDetails[pinType]) {
      $scope.changePinDetails[pinType] = "";
    }
  };

  $scope.changeAccessLevel = function (newVal, oldVal) { // newVal and oldVal are Strings and convert to int before using
    console.log(' > VALUES:', newVal, oldVal);
    $ionicLoading.show();

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $scope.user.accessLevel = parseInt(oldVal);
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    var errorMsg = "Operation Failed!";
    SERVER.changeUserDetails($scope.user._id, {
      accessLevel: $scope.user.accessLevel
    }).then(function (res) {
      if (res.data && res.data.success) {
        updateCurrentUserDetails();
        $ionicLoading.hide();
      } else {
        if (res.data && res.data.message) {
          errorMsg = res.data.message;
        }
        $scope.user.accessLevel = parseInt(oldVal);
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      $scope.user.accessLevel = parseInt(oldVal);
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });
  };

  $scope.toggleDeactivatedState = function (evt) {
    // console.log(" > Is the switch deactivated:", $scope.user.deactivated);
    $ionicLoading.show();

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      evt.target.checked = evt.target.checked ? false : true;
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }

    var errorMsg = "Operation Failed..";
    SERVER.changeUserDetails($scope.user._id, {
      deactivated: $scope.user.deactivated
    }).then(function (res) {
      if (res.data && res.data.success) {
        updateCurrentUserDetails();
        $ionicLoading.hide();
      } else {
        if (res.data && res.data.message) {
          errorMsg = res.data.message;
        }
        evt.target.checked = evt.target.checked ? false : true;
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      evt.target.checked = evt.target.checked ? false : true;
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });
  };

  function updateCurrentUserDetails() {
    var userId = parseInt($stateParams.userId);
    if (userId === SESSION.getUserId()) {
      USER.init();
    }
  }

  function init() {
    $scope.isLoggedInUserAdmin = USER.isAdmin();
    $ionicLoading.show();

    // Check for network connectivity
    if ($cordovaNetwork.isOffline()) {
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: CONFIG.message.errorNetwork
      });
      return;
    }
        
    var errorMsg = "Data Unavailable..";
    SERVER.getUser({
      id: $stateParams.userId
    })
    .then(function (res) {
      if (res.data) {
        $scope.user = res.data;
        $ionicLoading.hide();
      } else {
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "ERROR",
          okType: "button-positive",
          template: errorMsg
        });
      }
    }, function (err) {
      if (err.statusText) {
        errorMsg = err.statusText;
      }

      if (err.data) {
        if (err.data.message) {
          errorMsg = err.data.message;
        }

        if (err.data.forceLogout) {
          $timeout(function () {
            $rootScope.$broadcast('doLogout');
          }, CONFIG.timeout.delay);
        }

      }

      $ionicLoading.hide();
      $ionicPopup.alert({
        title: "ERROR",
        okType: "button-positive",
        template: errorMsg
      });
    });
  }

  init();

  $scope.doRefresh = function() {
    init();
    $scope.$broadcast('scroll.refreshComplete');
  };
  
})

.controller('SettingsCtrl', function($scope, CONFIG, USER) {

  $scope.server = CONFIG.server;
  $scope.user = USER.details;

});
