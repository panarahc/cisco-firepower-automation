const express = require("express"),
	app = express(),
	http = require("http").createServer(app),
	cookieParser = require("cookie-parser"),
	session = require("express-session"),
	OathRestClient = require("oauth-rest-client"),
	bodyParser = require("body-parser")
	fpmcRequest = require("request"),
	ftdRequest = require("request"),
	username = "admin",
	password = "Admin123",
	port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

app.set("view engine", "ejs");

var fpwr = {
	fpmc_server : "https://10.255.0.12",
	ftd_token_url : "https://10.255.0.10/api/fdm/v1/fdm/token",
	username : "admin",
	password : "Admin123",
	fpmcAuth : "Basic " + new Buffer(username + ":" + password).toString("base64"),
	authToken : "", // used in requests to the FPMC API
	authRefreshToken : "", // used in requests to refresh the FPMC token
	domain_uuid: "", // used in all FPMC REST requests
	ftd_token_opts : {
		"grant_type": "password",
		"username": "admin",
		"password": "admin"
	} // used to request a token from the FTD API
};

var fpwr_services = {
	deployabledevices: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/deployment/deployabledevices"
	devicegrouprecords: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/devicegroups/devicegrouprecords",
	devicerecords: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/devices/devicerecords",
	fpphysicalinterfaces: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/devices/devicerecords/{containerUUID}/fpphysicalinterfaces",
	fplogicalinterfaces: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/devices/devicerecords/{container_UUID}/fplogicalinterfaces",
	inlinesets: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/devices/devicerecords/{container_UUID}/inlinesets",
	virtualswitches: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/devices/devicerecords/{containerUUID}/virtualswitches"
	hosts: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/object/hosts",
	icmpv4objects: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/object/icmpv4objects",
	isesecuritygrouptags: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/object/isesecuritygrouptags",
	networkaddresses: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/object/networkaddresses",
	networkgroups: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/object/networkgroups",
	networks: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/object/networks",
	ranges: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/object/ranges",
	securityzones: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/object/securityzones",
	variablesets: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/object/variablesets",
	accesspolicies: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/policy/accesspolicies",
	accessrules: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/policy/accesspolicies/{container_UUID}/accessrules",
	defaultactions: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/policy/accesspolicies/{container_UUID}/defaultactions",
	filepolicies: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/policy/filepolicies",
	intrusionpolicies: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/policy/intrusionpolicies",
	snmpalerts: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/policy/snmpalerts",
	syslogalerts: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/policy/syslogalerts",
	policyassignments: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/assignment/policyassignments",
	taskstatuses: "/api/fmc_config/v1/domain/fpwr[domain_uuid]/job/taskstatuses",
	serverversion: "/api/fmc_platform/v1/info/serverversion",
}

fpmcRequest.post({
	url: fpwr.fpmc_server + "/api/fmc_platform/v1/auth/generatetoken",
	headers: {"Authorization": fpwr.fpmcAuth},
	rejectUnauthorized: false,
	requestCert: true, 
}, function(error, response, body){
	if (error){
		console.log(error);
	} else if (response.statusCode === 204) {
		fpwr.authToken = response.headers["x-auth-access-token"];
		fpwr.authRefreshToken = response.headers["x-auth-refresh-token"];
		fpwr.domain_uuid = response.headers["domain_uuid"];
		console.log(fpwr);
		console.log(response.statusCode, "success");
	} else {
		console.log(response.statusCode, response.statusMessage);	
	}
});

fpmcRequest.post({
	url: fpwr.fpmc_server + fpwr_services.devicerecords,
	headers: {"X-auth-access-token": fpwr.authToken},
	rejectUnauthorized: false,
	requestCert: true, 
}, function(error, response, body){
	if (error){
		console.log(error);
	} else if (response.statusCode === 200) {
		console.log(response);
		console.log(response.statusCode, "success");
	} else {
		console.log(response.statusCode, response.statusMessage);	
	}
});

http.listen(port, function(){
	console.log("listening on:", port);
});

// ftdRequest.post({
//	headers: {"Content-Type" : "application/json"},
//	rejectUnauthorized: false,
//	requestCert: true,
//	url: fpwr.ftd_token_url,
//	json: true,
//	body: fpwr.ftd_token_opts
//}, function(error, response, body) {
//	if (error) {
//		console.log(error);
//	} else {
//		console.log(response);
//	}
//});