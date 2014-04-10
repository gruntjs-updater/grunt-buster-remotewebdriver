var childProcess = require("child_process");
var request = require("request");
var wd = require("wd");
var ip = require("ip");
var Q  = require("q");

module.exports = function(grunt) {
    grunt.registerMultiTask("buster-remotewebdriver", "Run Buster.JS tests via WebDriver", function() {
        var done = this.async();

        var options = this.options({
            testConfigs: {}
        });

        var busterServerHost = grunt.option("buster-server-host") || ip.address();
        var busterServerPort = grunt.option("buster-server-port") || 1111;
        var busterServer = runBusterServer(busterServerHost, busterServerPort);

        var remoteConfigs = getRemoteConfigsToRun(grunt, options.remoteConfigs);

        Q.spread([busterServer, remoteConfigs], function(server, configs) {
            Q.all(captureBrowsers(configs, server.url + "/capture")).then(function(browsers) {
                runBusterTest(grunt, server.url, options.testConfigs).then(function() {
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

function filterConfigs(grunt, remoteConfigs) {
    if ( grunt.option("configs-to-run") ) {
        var configsToRun = grunt.option("configs-to-run").split(/,\s*/);
        remoteConfigs = remoteConfigs.filter(function(config) {
            return configsToRun.indexOf(config.name) !== -1;
        });
    }
    return remoteConfigs;
}

function getRemoteConfigsToRun(grunt, remoteConfigs) {
    var deferred = Q.defer();

    if ( grunt.option("config-json") ) {
        remoteConfigs = grunt.file.readJSON(grunt.option("config-json"));
        deferred.resolve(filterConfigs(grunt, remoteConfigs));
    }
    else if ( grunt.option("config-json-url") ) {
        request(grunt.option("config-json-url"), function(err, response, body) {
            remoteConfigs = JSON.parse(body);
            deferred.resolve(filterConfigs(grunt, remoteConfigs));
        });
    }
    else {
        deferred.resolve(filterConfigs(grunt, remoteConfigs));
    }

    return deferred.promise;
}

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
