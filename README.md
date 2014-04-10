# grunt-buster-remotewebdriver

> [Grunt](http://gruntjs.com/) task for running
> [Buster.JS](http://busterjs.org/) tests in Real Devices or Simuletors via Remote WebDriver


## Getting started

This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out
the [Getting started](http://gruntjs.com/getting-started) guide, as it explains
how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as
install and use Grunt plugins. Once you're familiar with that process, you may
install this plugin with this command:

``` shell
npm install grunt-buster-remotewebdriver
```

Once the plugin has been installed, it may be enabled inside your Gruntfile
with this line of JavaScript:

``` js
grunt.loadNpmTasks('grunt-buster-remotewebdriver');
```

Then, you must install Buster.JS:

``` shell
npm install buster
```


## Run

grunt buster-remotewebdriver


## Sample Configuration

```javascript
"buster-remotewebdriver": {
    sample: {
        options: {
            remoteConfigs: [
                // Android 4.x Device / Simulator (appium / Chrome)
                {
                    address: "localhost",
                    port: 4723,
                    capability: {
                        device: "Android",
                        app: "chrome"
                    }
                },
                // for iPhone Simulator (appium / Mobile Safari)
                {
                    address: "localhost",
                    port: 4723,
                    capability: {
                        device: "iPhone Simulator",
                        version: "6.0",
                        app: "safari"
                    }
                },
                // for iPhone Device (appium / Mobile Safari)
                {
                    address: "localhost",
                    port: 4723,
                    capability: {
                        device: "iPhone",
                        app: "safari"
                    }
                },
            ],
        }
    }
}
```
