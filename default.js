var API = API || {};

(function($) {
    'use strict';

    API.socket = io.connect("http://10.255.0.100:8080");

    API.ready = function() {
        API.socket.emit("client-ready", "client-ready");

        $('.ui.dropdown').dropdown();
        $('#fpmcCredentials').on('submit', function(e) {
            e.preventDefault();
            var $inputs = $(':input');
            var values = {};
            $inputs.each(function() {
                values[this.name] = $(this).val();
            });
            API.socket.emit("fpmc-register", values);
            $(".ui.loader").toggleClass("active");
        });

        $('#fpmcProfile').on('submit', function(e) {
            e.preventDefault();
            var $inputs = $(':input');
            var values = {};
            $inputs.each(function() {
                values[this.name] = $(this).val();
            });
            API.socket.emit("fpmc-profile", values);
            $(".ui.loader").toggleClass("active");
        });

        $('#acPolicyPost').on('submit', function(e) {
            e.preventDefault();
            var $inputs = $(':input');
            var values = {};
            $inputs.each(function() {
                values[this.name] = $(this).val();
            });
            API.socket.emit("acpolicy-post", values);
            $(".ui.loader").toggleClass("active");
        });

        $('#devicePost').on('submit', function(e) {
            e.preventDefault();
            var $inputs = $(':input');
            var $checked = $("input:checked");
            var values = {};
            var checkedvalues = ["BASE"];
            $inputs.each(function() {
                values[this.name] = $(this).val();
            });
            $checked.each(function(){
            	checkedvalues.push($(this).val());
            });
            values.lic = checkedvalues;
            API.socket.emit("device-post", values);
            $(".ui.loader").toggleClass("active");
        });
    }

    API.socket.on("register-success", function(msg) {
        $(".ui.loader").toggleClass("active");
        $("p").text("Registration successful: " + msg.authToken + " " + msg.authRefreshToken + " " + msg.domain_uuid);
    });

    API.socket.on("profile-result", function(msg) {
        $(".ui.loader").toggleClass("active");
        $("p").text("FPMC profile result: " + JSON.stringify(msg));
    });    
    API.socket.on("acpolicypost-result", function(msg) {
        $(".ui.loader").toggleClass("active");
        $("p").text("ACPolicy post result: " + JSON.stringify(msg));
    });
  	API.socket.on("devicepost-result", function(msg) {
        $(".ui.loader").toggleClass("active");
        $("p").text("Device post result: " + JSON.stringify(msg));
    });

    // jQuery ready.
    $(function() {
        API.ready();
    });

})(jQuery);