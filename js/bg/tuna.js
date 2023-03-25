/*
 Copyright (c) 2012 DinahMoe AB & Oskar Eriksson

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
 modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
 is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
 OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/*global module*/
(function () {

    var userContext,
        userInstance,
        pipe = function (param, val) {
//            console.log(param, val);
//            param.value = val;
            param.setValueAtTime(val, userContext.currentTime);
//            param.setValueAtTime(val.toFixed(2), userContext.currentTime);
//            param.setTargetAtTime(val, userContext.currentTime + 1, 0.5);
//            param.setTargetAtTime(val.toFixed(2), userContext.currentTime + 1, 0.5);
        },
        Super = Object.create(null, {
            activate: {
                writable: true,
                value: function (doActivate) {
                    if (doActivate) {
                        this.input.disconnect();
                        this.input.connect(this.activateNode);
                        if (this.activateCallback) {
                            this.activateCallback(doActivate);
                        }
                    } else {
                        this.input.disconnect();
                        this.input.connect(this.output);
                    }
                }
            },
            bypass: {
                get: function () {
                    return this._bypass;
                },
                set: function (value) {
                    if (this._lastBypassValue === value) {
                        return;
                    }
                    this._bypass = value;
                    this.activate(!value);
                    this._lastBypassValue = value;
                }
            },
            connect: {
                value: function (target) {
                    this.output.connect(target);
                }
            },
            disconnect: {
                value: function (target) {
                    this.output.disconnect(target);
                }
            },
            connectInOrder: {
                value: function (nodeArray) {
                    var i = nodeArray.length - 1;
                    while (i--) {
                        if (!nodeArray[i].connect) {
                            return console.error("AudioNode.connectInOrder: TypeError: Not an AudioNode.", nodeArray[i]);
                        }
                        if (nodeArray[i + 1].input) {
                            nodeArray[i].connect(nodeArray[i + 1].input);
                        } else {
                            nodeArray[i].connect(nodeArray[i + 1]);
                        }
                    }
                }
            },
            getDefaults: {
                value: function () {
                    var result = {};
                    for (var key in this.defaults) {
                        result[key] = this.defaults[key].value;
                    }
                    return result;
                }
            },
            automate: {
                value: function (property, value, duration, startTime) {
                    var start = startTime ? ~~(startTime / 1000) : userContext.currentTime,
                        dur = duration ? ~~(duration / 1000) : 0,
                        _is = this.defaults[property],
                        param = this[property],
                        method;

                    if (param) {
                        if (_is.automatable) {
                            if (!duration) {
                                method = "setValueAtTime";
                            } else {
                                method = "linearRampToValueAtTime";
                                param.cancelScheduledValues(start);
                                param.setValueAtTime(param.value, start);
                            }
                            param[method](value, dur + start);
                        } else {
                            param = value;
                        }
                    } else {
                        console.error("Invalid Property for " + this.name);
                    }
                }
            }
        }),
        FLOAT = "float",
        BOOLEAN = "boolean",
        STRING = "string",
        INT = "int";

    if (typeof module !== "undefined" && module.exports) {
        module.exports = Tuna;
    }
    else if (typeof define === "function") {
        window.define("Tuna", definition);
    }
    else {
        window.Tuna = Tuna;
    }

    function definition() {
        return Tuna;
    }

    function Tuna(context) {
        if (!(this instanceof Tuna)) {
            return new Tuna(context);
        }

        var _window = typeof window === 'undefined' ? {} : window;

        if (!_window.AudioContext) {
            _window.AudioContext = _window.webkitAudioContext;
        }
        if (!context) {
            console.log("tuna.js: Missing audio context! Creating a new context for you.");
            context = _window.AudioContext && (new _window.AudioContext());
        }
        if (!context) {
            throw new Error("Tuna cannot initialize because this environment does not support web audio.");
        }
        connectify(context);
        userContext = context;
        userInstance = this;
    }

    function connectify(context) {
        if (context.__connectified__ === true) return;

        var gain = context.createGain(),
            proto = Object.getPrototypeOf(Object.getPrototypeOf(gain)),
            oconnect = proto.connect;

        proto.connect = shimConnect;
        context.__connectified__ = true; // Prevent overriding connect more than once

        function shimConnect() {
            var node = arguments[0];
            arguments[0] = Super.isPrototypeOf ? (Super.isPrototypeOf(node) ? node.input : node) : (node.input || node);
            oconnect.apply(this, arguments);
            return node;
        }
    }

    function initValue(userVal, defaultVal) {
        return userVal === undefined ? defaultVal : userVal;
    }

    Tuna.prototype.Chorus = function (properties) {
        if (!properties) {
            properties = this.getDefaults();
        }
        this.input = userContext.createGain();
        this.attenuator = this.activateNode = userContext.createGain();
        this.splitter = userContext.createChannelSplitter(2);
        this.delayL = userContext.createDelay();
        this.delayR = userContext.createDelay();
        this.feedbackGainNodeLR = userContext.createGain();
        this.feedbackGainNodeRL = userContext.createGain();
        this.merger = userContext.createChannelMerger(2);
        this.output = userContext.createGain();

        this.lfoL = new userInstance.LFO({
            target: this.delayL.delayTime,
            callback: pipe
        });
        this.lfoR = new userInstance.LFO({
            target: this.delayR.delayTime,
            callback: pipe
        });

        this.input.connect(this.attenuator);
        this.attenuator.connect(this.output);
        this.attenuator.connect(this.splitter);
        this.splitter.connect(this.delayL, 0);
        this.splitter.connect(this.delayR, 1);
        this.delayL.connect(this.feedbackGainNodeLR);
        this.delayR.connect(this.feedbackGainNodeRL);
        this.feedbackGainNodeLR.connect(this.delayR);
        this.feedbackGainNodeRL.connect(this.delayL);
        this.delayL.connect(this.merger, 0, 0);
        this.delayR.connect(this.merger, 0, 1);
        this.merger.connect(this.output);

        this.feedback = initValue(properties.feedback, this.defaults.feedback.value);
        this.rate = initValue(properties.rate, this.defaults.rate.value);
        this.delay = initValue(properties.delay, this.defaults.delay.value);
        this.depth = initValue(properties.depth, this.defaults.depth.value);
        this.lfoR.phase = Math.PI / 2;
//        this.attenuator.gain.value = 0.6934; // 1 / (10 ^ (((20 * log10(3)) / 3) / 20))
        this.attenuator.gain.setValueAtTime(0.6934, userContext.currentTime);
        this.lfoL.activate(true);
        this.lfoR.activate(true);
        this.bypass = properties.bypass || false;
    };
    Tuna.prototype.Chorus.prototype = Object.create(Super, {
        name: {
            value: "Chorus"
        },
        defaults: {
            writable: true,
            value: {
                feedback: {
                    value: 0,
                    min: 0,
                    max: 0.95,
                    automatable: false,
                    type: FLOAT
                },
                delay: {
                    value: 0,
                    min: 0,
                    max: 1,
                    automatable: false,
                    type: FLOAT
                },
                depth: {
                    value: 0.7,
                    min: 0,
                    max: 1,
                    automatable: false,
                    type: FLOAT
                },
                rate: {
                    value: 0,
                    min: 0,
                    max: 8,
                    automatable: false,
                    type: FLOAT
                },
                bypass: {
                    value: false,
                    automatable: false,
                    type: BOOLEAN
                }
            }
        },
        delay: {
            enumerable: true,
            get: function () {
                return this._delay;
            },
            set: function (value) {
                this._delay = 0.0002 * (Math.pow(10, value) * 2);
                this.lfoL.offset = this._delay;
                this.lfoR.offset = this._delay;
                this._depth = this._depth;
            }
        },
        depth: {
            enumerable: true,
            get: function () {
                return this._depth;
            },
            set: function (value) {
                this._depth = value;
                this.lfoL.oscillation = this._depth * this._delay;
                this.lfoR.oscillation = this._depth * this._delay;
            }
        },
        feedback: {
            enumerable: true,
            get: function () {
                return this._feedback;
            },
            set: function (value) {
                this._feedback = value;
                this.feedbackGainNodeLR.gain.setValueAtTime(this._feedback, userContext.currentTime);
                this.feedbackGainNodeRL.gain.setValueAtTime(this._feedback, userContext.currentTime);
//                this.feedbackGainNodeLR.gain.value = this._feedback;
//                this.feedbackGainNodeRL.gain.value = this._feedback;
            }
        },
        rate: {
            enumerable: true,
            get: function () {
                return this._rate;
            },
            set: function (value) {
                this._rate = value;
                this.lfoL.frequency = this._rate;
                this.lfoR.frequency = this._rate;
            }
        }
    });

    Tuna.prototype.Convolver = function (properties) {
        if (!properties) {
            properties = this.getDefaults();
        }
        this.input = userContext.createGain();
        this.activateNode = userContext.createGain();
        this.convolver = userContext.createConvolver();
        this.dry = userContext.createGain();
        this.filterLow = userContext.createBiquadFilter();
        this.filterHigh = userContext.createBiquadFilter();
        this.wet = userContext.createGain();
        this.output = userContext.createGain();

        this.activateNode.connect(this.filterLow);
        this.activateNode.connect(this.dry);
        this.filterLow.connect(this.filterHigh);
        this.filterHigh.connect(this.convolver);
        this.convolver.connect(this.wet);
        this.wet.connect(this.output);
        this.dry.connect(this.output);

        this.dryLevel = initValue(properties.dryLevel, this.defaults.dryLevel.value);
        this.wetLevel = initValue(properties.wetLevel, this.defaults.wetLevel.value);
        this.highCut = properties.highCut || this.defaults.highCut.value;
        this.buffer = properties.impulse || "../impulses/ir_rev_short.wav";
        this.lowCut = properties.lowCut || this.defaults.lowCut.value;
        this.level = initValue(properties.level, this.defaults.level.value);
        this.filterHigh.type = "lowpass";
        this.filterLow.type = "highpass";
        this.bypass = properties.bypass || false;
    };
    Tuna.prototype.Convolver.prototype = Object.create(Super, {
        name: {
            value: "Convolver"
        },
        defaults: {
            writable: true,
            value: {
                highCut: {
                    value: 22050,
                    min: 20,
                    max: 22050,
                    automatable: true,
                    type: FLOAT
                },
                lowCut: {
                    value: 20,
                    min: 20,
                    max: 22050,
                    automatable: true,
                    type: FLOAT
                },
                dryLevel: {
                    value: 1,
                    min: 0,
                    max: 1,
                    automatable: true,
                    type: FLOAT
                },
                wetLevel: {
                    value: 0,
                    min: 0,
                    max: 1,
                    automatable: true,
                    type: FLOAT
                },
                level: {
                    value: 1,
                    min: 0,
                    max: 1,
                    automatable: true,
                    type: FLOAT
                }
            }
        },
        lowCut: {
            get: function () {
                return this.filterLow.frequency.value;
            },
            set: function (value) {
//                this.filterLow.frequency.setValueAtTime(value, userContext.currentTime);
                this.filterLow.frequency.value = value;
            }
        },
        highCut: {
            get: function () {
                return this.filterHigh.frequency.value;
            },
            set: function (value) {
//                this.filterHigh.frequency.setValueAtTime(value, userContext.currentTime);
                this.filterHigh.frequency.value = value;
            }
        },
        level: {
            get: function () {
                return this.output.gain.value;
            },
            set: function (value) {
                this.output.gain.setValueAtTime(value, userContext.currentTime);
//                this.output.gain.value = value;
            }
        },
        dryLevel: {
            get: function () {
                return this.dry.gain.value;
            },
            set: function (value) {
                this.dry.gain.setValueAtTime(value, userContext.currentTime);
//                this.dry.gain.value = value;
            }
        },
        wetLevel: {
            get: function () {
                return this.wet.gain.value;
            },
            set: function (value) {
//                this.wet.gain.setValueAtTime(value, userContext.currentTime);
                this.wet.gain.value = value;
            }
        },
        buffer: {
            enumerable: false,
            get: function () {
                return this.convolver.buffer;
            },
            set: function (impulse) {
                var convolver = this.convolver,
                    xhr = new XMLHttpRequest();
                if (!impulse) {
                    console.log("Tuna.Convolver.setBuffer: Missing impulse path!");
                    return;
                }
                xhr.open("GET", impulse, true);
                xhr.responseType = "arraybuffer";
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status < 300 && xhr.status > 199 || xhr.status === 302) {
                            userContext.decodeAudioData(xhr.response, function (buffer) {
                                convolver.buffer = buffer;
                            }, function (e) {
                                if (e) console.log("Tuna.Convolver.setBuffer: Error decoding data" + e);
                            });
                        }
                    }
                };
                xhr.send(null);
            }
        }
    });

    Tuna.prototype.LFO = function (properties) {
        if (!properties) {
            properties = this.getDefaults();
        }

        //Instantiate AudioNode
        this.input = userContext.createGain();
        this.output = userContext.createScriptProcessor(256, 1, 1);
        this.activateNode = userContext.destination;

        //Set Properties
        this.frequency = initValue(properties.frequency, this.defaults.frequency.value);
        this.offset = initValue(properties.offset, this.defaults.offset.value);
        this.oscillation = initValue(properties.oscillation, this.defaults.oscillation.value);
        this.phase = initValue(properties.phase, this.defaults.phase.value);
        this.target = properties.target || {};
        this.output.onaudioprocess = this.callback(properties.callback || function () {
        });
        this.bypass = properties.bypass || false;
    };
    Tuna.prototype.LFO.prototype = Object.create(Super, {
        name: {
            value: "LFO"
        },
        bufferSize: {
            value: 256
        },
        sampleRate: {
            value: 44100
        },
        defaults: {
            value: {
                frequency: {
                    value: 1,
                    min: 0,
                    max: 20,
                    automatable: false,
                    type: FLOAT
                },
                offset: {
                    value: 0.85,
                    min: 0,
                    max: 22049,
                    automatable: false,
                    type: FLOAT
                },
                oscillation: {
                    value: 0.3,
                    min: -22050,
                    max: 22050,
                    automatable: false,
                    type: FLOAT
                },
                phase: {
                    value: 0,
                    min: 0,
                    max: 2 * Math.PI,
                    automatable: false,
                    type: FLOAT
                }
            }
        },
        frequency: {
            get: function () {
                return this._frequency;
            },
            set: function (value) {
                this._frequency = value;
                this._phaseInc = 2 * Math.PI * this._frequency * this.bufferSize / this.sampleRate;
            }
        },
        offset: {
            get: function () {
                return this._offset;
            },
            set: function (value) {
                this._offset = value;
            }
        },
        oscillation: {
            get: function () {
                return this._oscillation;
            },
            set: function (value) {
                this._oscillation = value;
            }
        },
        phase: {
            get: function () {
                return this._phase;
            },
            set: function (value) {
                this._phase = value;
            }
        },
        target: {
            get: function () {
                return this._target;
            },
            set: function (value) {
                this._target = value;
            }
        },
        activate: {
            value: function (doActivate) {
                if (doActivate) {
                    this.output.connect(userContext.destination);
                    if (this.activateCallback) {
                        this.activateCallback(doActivate);
                    }
                } else {
                    this.output.disconnect();
                }
            }
        },
        callback: {
            value: function (callback) {
                var that = this;
                return function () {
                    that._phase += that._phaseInc;
                    if (that._phase > 2 * Math.PI) {
                        that._phase = 0;
                    }
                    callback(that._target, that._offset + that._oscillation * Math.sin(that._phase));
                };
            }
        }
    });

    Tuna.toString = Tuna.prototype.toString = function () {
        return "Please visit https://github.com/Theodeus/tuna/wiki for instructions on how to use Tuna.js";
    };
})();
