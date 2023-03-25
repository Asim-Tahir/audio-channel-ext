// Copyright 2012, Google Inc.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
// 
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

function createFadeBuffer(a, b, e) {
    var g = b * a.sampleRate;
    b = g + (b - 2 * e) * a.sampleRate;
    var f = a.createBuffer(1, b, a.sampleRate), c = f.getChannelData(0);
    a = e * a.sampleRate;
    e = g - a;
    for (var d = 0; d < g; ++d)c[d] = d < a ? Math.sqrt(d / a) : d >= e ? Math.sqrt(1 - (d - e) / a) : 1;
    for (d = g; d < b; ++d)c[d] = 0;
    return f
}
function createDelayTimeBuffer(a, b, e, g) {
    var f = b * a.sampleRate;
    b = f + (b - 2 * e) * a.sampleRate;
    a = a.createBuffer(1, b, a.sampleRate);
    e = a.getChannelData(0);
    for (var c = 0; c < f; ++c)e[c] = g ? (f - c) / b : c / f;
    for (c = f; c < b; ++c)e[c] = 0;
    return a
}
var delayTime = .01, fadeTime = .05, bufferTime = .1;
function Jungle(a) {
    this.context = a;
    var b = a.createGain(), e = a.createGain();
    this.input = b;
    this.output = e;
    var g = a.createBufferSource(), f = a.createBufferSource(), c = a.createBufferSource(), d = a.createBufferSource();
    this.shiftDownBuffer = createDelayTimeBuffer(a, bufferTime, fadeTime, !1);
    this.shiftUpBuffer = createDelayTimeBuffer(a, bufferTime, fadeTime, !0);
    g.buffer = this.shiftDownBuffer;
    f.buffer = this.shiftDownBuffer;
    c.buffer = this.shiftUpBuffer;
    d.buffer = this.shiftUpBuffer;
    g.loop = !0;
    f.loop = !0;
    c.loop = !0;
    d.loop = !0;
    var v =
        a.createGain(), w = a.createGain(), n = a.createGain();
    n.gain.setValueAtTime(0, a.currentTime);
    var p = a.createGain();
    p.gain.setValueAtTime(0, a.currentTime);
    g.connect(v);
    f.connect(w);
    c.connect(n);
    d.connect(p);
    var q = a.createGain(), r = a.createGain(), t = a.createDelay(), u = a.createDelay();
    v.connect(q);
    w.connect(r);
    n.connect(q);
    p.connect(r);
    q.connect(t.delayTime);
    r.connect(u.delayTime);
    var k = a.createBufferSource(), l = a.createBufferSource(), h = createFadeBuffer(a, bufferTime, fadeTime);
    k.buffer = h;
    l.buffer = h;
    k.loop = !0;
    l.loop = !0;
    h = a.createGain();
    var m = a.createGain();
    h.gain.setValueAtTime(0, a.currentTime);
    m.gain.setValueAtTime(0, a.currentTime);
    k.connect(h.gain);
    l.connect(m.gain);
    b.connect(t);
    b.connect(u);
    t.connect(h);
    u.connect(m);
    h.connect(e);
    m.connect(e);
    a = a.currentTime + .05;
    b = a + bufferTime - fadeTime;
    g.start(a);
    f.start(b);
    c.start(a);
    d.start(b);
    k.start(a);
    l.start(b);
    this.mod1 = g;
    this.mod2 = f;
    this.mod1Gain = v;
    this.mod2Gain = w;
    this.mod3Gain = n;
    this.mod4Gain = p;
    this.modGain1 = q;
    this.modGain2 = r;
    this.fade1 = k;
    this.fade2 = l;
    this.mix1 = h;
    this.mix2 = m;
    this.delay1 = t;
    this.delay2 = u;
    this.setDelay(delayTime)
}
Jungle.prototype.setDelay = function (a) {
    this.modGain1.gain.setTargetAtTime(.5 * a, 0, .01);
    this.modGain2.gain.setTargetAtTime(.5 * a, 0, .01)
};
var previousPitch = -1;
Jungle.prototype.setPitchOffset = function (a) {
    0 < a ? (
            this.mod1Gain.gain.setTargetAtTime(0, 0, .01),
            this.mod2Gain.gain.setTargetAtTime(0, 0, .01),
            this.mod3Gain.gain.setTargetAtTime(1, 0, .01),
            this.mod4Gain.gain.setTargetAtTime(1, 0, .01)):
        (
            this.mod1Gain.gain.setTargetAtTime(1, 0, .01),
            this.mod2Gain.gain.setTargetAtTime(1, 0, .01),
            this.mod3Gain.gain.setTargetAtTime(0, 0, .01),
            this.mod4Gain.gain.setTargetAtTime(0, 0, .01))
    this.setDelay(delayTime * Math.abs(a));
    previousPitch = a
};