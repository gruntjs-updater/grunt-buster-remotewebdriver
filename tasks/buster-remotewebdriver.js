var childProcess = require("child_process");
var wd = require("wd");
var ip = require("ip");
var Q  = require("q");

module.exports = function(grunt) {
    grunt.registerMultiTask("buster-remotewebdriver", "Run Buster.JS tests via WebDriver", function() {
        var done = this.async();

        var options = this.options({
            serverHost: ip.address(),
            serverPort: 1111,
            testOptions: {}
        });

        var remoteConfigs;
        if ( grunt.option("configs-to-run") ) {
            var configsToRun = grunt.option("configs-to-run").split(/,\s*/);
            remoteConfigs = options.remoteConfigs.filter(function(config) {
                return configsToRun.indexOf(config.name) !== -1;
            });
        }
        else {
            remoteConfigs = options.remoteConfigs;
        }

        var busterServer = runBusterServer(options.serverHost, options.serverPort);
        busterServer.then(function(server) {
            Q.all(captureBrowsers(remoteConfigs, server.url + "/capture")).then(function(browsers) {
                runBusterTest(grunt, server.url, options.testOptions).then(function() {
                    server.process.kill();
                    browsers.forEach(function(browser) {
                        browser.quit();
                    });
                    done();
                });
            });
        });
    });
};

function runBusterServer(hostname, port) {
    var deferred = Q.defer();
    // We do not have to bind given hostname (it is for external access)
    var busterServer = childProcess.spawn("buster-server", ["--port", port], { env: process.env });

    busterServer.stdout.setEncoding("utf8");
    busterServer.stdout.on("data", function(data) {
        if ( data.match(/running/) ) {
            deferred.resolve({
                url: "http://" + hostname + ":" + port,
                process: busterServer
            });
        }
    });

    return deferred.promise;
}

function captureBrowsers(configs, captureUrl) {
    return configs.map(function(config) {
        var deferred = Q.defer();
        var browser = wd.remote(config.address, config.port);
        browser.init(config.capability, function() {
            browser.get(captureUrl, function() {
                deferred.resolve(browser);
            });
        });
        return deferred.promise;
    });
}

function runBusterTest(grunt, serverUrl, testOptions) {
    var args = ["--server", serverUrl].concat(optionsToArgs(testOptions));

    var deferred = Q.defer();
    var busterTest = childProcess.spawn("buster-test", args, { env: process.env });

    busterTest.stdout.on("data", function(data) {
        grunt.log.write(data);
    });
    busterTest.stderr.on("data", function(data) {
        grunt.log.error(data);
    });

    busterTest.on("exit", function() {
        deferred.resolve();
    });

    return deferred.promise;
}

function optionsToArgs(options) {
    var args = [];
    Object.keys(options).forEach(function(k) {
        var v = options[k];
        if ( v !== false ) {
            args.push("--" + k);
            if ( v !== true ) {
                args.push(v);
            }
        }
    });
    return args;
}
