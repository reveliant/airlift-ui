/*jshint nocomma: true, nonew: true, plusplus: true, strict: true, browser: true, devel: true, jquery: true*/

function RestAPI () {
    "use strict";
    var my = this,  // Public scope
        priv = {};  // Private scope
    
    this.get = function (url, data, success) {
        $.ajax({
            type: "GET",
            url: url,
            data: data,
            success: success,
            contentType: "application/json; charset=UTF-8",
            dataType: "json"
        });
    };
    
    this.post = function (url, data, success) {
        $.ajax({
            type: "POST",
            url: url,
            data: data,
            success: success,
            contentType: "application/json; charset=UTF-8",
            dataType: "json"
        });
    };
    
    this.put = function (url, data, success) {
        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: success,
            contentType: "application/json; charset=UTF-8",
            dataType: "json"
        });
    };
    
    this.delete = function (url, data, success) {
        $.ajax({
            type: "DELETE",
            url: url,
            data: data,
            success: success,
            contentType: "application/json; charset=UTF-8",
            dataType: "json"
        });
    };
}

function Airlift () {
    "use strict";
    var my = this,  // Public scope
        priv = {},  // Private scope
        Rest = new RestAPI();
    
    priv.apiUrl = "api";
    priv.session = {};
    
    this.login = function (username, password) {
        Rest.post(priv.apiUrl + "/sessions", null, function(data) {
            priv.session = data;
        });
    };
    
    this.userInfo = function () {
        Rest.get(priv.apiUrl + "/data.json", null, function(data) {
            $("#user-name").text(data.user.name);
            if (data.user.avatar) {
                $("#user-avatar").attr("src", "img/" + data.user.username + "." + data.user.avatar);
            }
        });
    };
}

$(document).ready(function () {
    "use strict";
    var airlift = new Airlift ();
    airlift.userInfo();
});