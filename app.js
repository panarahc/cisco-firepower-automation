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
	fpmc_token_url : "https://10.255.0.12/api/fmc_platform/v1/auth/generatetoken",
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

var fpwr_get = {

}

fpmcRequest.post({
	url: fpwr.fpmc_token_url,
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