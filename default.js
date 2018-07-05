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

        $('#acPolicyGet').on('submit', function(e) {
            e.preventDefault();
            var $inputs = $(':input');
            var values = {};
            $inputs.each(function() {
                values[this.name] = $(this).val();
            });
            API.socket.emit("acpolicy-getID", values);
            $(".ui.loader").toggleClass("active");
        });

        $('#devicerecordpost').on('submit', function(e) {
            e.preventDefault();
            var $inputs = $(':input');
            var $checked = $("input:checked");
            var values = {};
            var checkedvalues = ["BASE"];
            $inputs.each(function() {
                values[this.name] = $(this).val();
            });
            $checked.each(function() {
                checkedvalues.push($(this).val());
            });
            values.lic = checkedvalues;
            API.socket.emit("device-post", values);
            $(".ui.loader").toggleClass("active");
        });

        $("#submit").on('click', function(e) {
            e.preventDefault();
            var tasks = [];

            $(".ui.form").map(function(idx, form) {
                var $form = $(this);
                var formid = $form.attr("id");
                var $inputs = $form.find("input[type=text]");
                var tmpObj = {};
                tmpObj[formid] = {};
                $inputs.each(function() {
                    tmpObj[formid][this.name] = $(this).val();
                });
                if ($checked = $form.find('input:checked').length){
	                var $checked = $form.find('input:checked');
	                var checkarray = [];
	                $checked.each(function() {
	                	checkarray.push(this.value);
	                });
	                tmpObj[formid][$checked[0].name] = checkarray;
                }
                tasks.push(tmpObj);
            });
            console.log(tasks);
            API.socket.emit("new-automation", tasks);
        });

        $("#newdevice").on('click', function(e) {
        	e.preventDefault();
        	$('#devicerecordpost').clone().appendTo('#device');
        });

        $("#removedevice").on('click', function(e) {
        	e.preventDefault();
        	$('#device').children("form").last().remove();
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