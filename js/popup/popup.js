var Localizations=function(){var a=$("[datatype=i18n]"),b=$("#powerIcon");a.each(function(c){$(a[c]).html(Methods.getLocalizedText(a[c].id))});b.on("mouseover",function(){var c=Methods.getLocalizedText("captureCurrentTab");b.attr("title",c)});$(".info").hover(function(){$("#info").html(Methods.getLocalizedText(this.id+"Info"))},function(){$("#info").html("")})},Instance=function(){};
Instance.isInstance=function(){if("false"==Methods.load("instance"))return window.onunload=function(){Methods.save("instance","false");Methods.setIcon("off")},Methods.save("instance","true"),!0};
var BackgroundListener=function(){chrome.runtime.onMessage.addListener(function(a){switch(a.type){case "panChange":Pan.change(a.value);case "analyserModule":analyserModule(a);break;case "chorusSettings":$("#chorusRate").val(a.rate)[0].updateBg();$("#chorusDepth").val(a.depth)[0].updateBg();$("#chorusFeedback").val(a.feedback)[0].updateBg();$("#chorusDelay").val(a.delay)[0].updateBg();Chorus.updateNumerics();break;case "convolverSettings":$("#convolverWetLevel").val(a.wetLevel)[0].updateBg();$("#convolverDryLevel").val(a.dryLevel)[0].updateBg();
$("#convolverHighCut").val(a.highCut)[0].updateBg();$("#convolverLowCut").val(a.lowCut)[0].updateBg();Convolver.updateNumerics();break;case "pitchSettings":$("#pitch").val(a.pitch)[0].updateBg();$("#pitchCents").val(a.cents)[0].updateBg();Pitch.updateNumerics();break;case "volumeSetting":$("#volume").val(a.value)[0].updateBg();break;case "eqSettings":$("#twenty").val(a.twenty)[0].updateBg();$("#fifty").val(a.fifty)[0].updateBg();$("#oneHundred").val(a.oneHundred)[0].updateBg();$("#twoHundred").val(a.twoHundred)[0].updateBg();
$("#fiveHundred").val(a.fiveHundred)[0].updateBg();$("#oneThousand").val(a.oneThousand)[0].updateBg();$("#twoThousand").val(a.twoThousand)[0].updateBg();$("#fiveThousand").val(a.fiveThousand)[0].updateBg();$("#tenThousand").val(a.tenThousand)[0].updateBg();$("#twentyThousand").val(a.twentyThousand)[0].updateBg();break;case "limiterSettings":$("#threshold").val(a.threshold)[0].updateBg();$("#attack").val(a.attack)[0].updateBg();$("#release").val(a.release)[0].updateBg();$("#ratio").val(a.ratio)[0].updateBg();
$("#knee").val(a.knee)[0].updateBg();Limiter.updateNumerics();break;case "popupVisualOn":Power.visualOn(a.value);break;case "popupPowerOff":chrome.tabs.query({active:!0,currentWindow:!0},function(b){Power.off();Popup.channelModal(b[0].title,"Stream Unavailable")})}})},ButtonEvents=function(){$("#darkThemeLabel").on("click",function(){Theme.makeDark("#mainPanel")});$("#lightThemeLabel").on("click",function(){Theme.makeLight("#mainPanel")});$("#volume").on("click",function(a){$("#valInfo").html(Math.floor(100*
a.target.value)+"%")});$("#gotoTab").on("click",function(){chrome.runtime.getBackgroundPage(function(a){chrome.tabs.get(a.capturedTabObj.id,function(b){chrome.tabs.highlight({windowId:b.windowId,tabs:b.index})})})});$("#editInBackground").on("click",function(){chrome.runtime.getBackgroundPage(function(a){chrome.tabs.get(a.capturedTabObj.id,function(b){Methods.sendRuntime({type:"bgInitOn"})})})});$("#resetLabel").on("click",function(){Volume.reset();switch(Tabs.current()){case "limiter":Limiter.reset();
Popup.sendLimiter();Limiter.updateNumerics();break;case "eq":Equalizer.reset();Popup.sendEq();break;case "chorus":Chorus.reset();Popup.sendChorus();Chorus.updateNumerics();break;case "convolver":Convolver.reset();Popup.sendConvolver();Convolver.updateNumerics();break;case "pitch":Pitch.reset(),Popup.sendPitch(),Pitch.updateNumerics()}});$("#chorusRadio").on("click",function(){Chorus.show()});$("#convolverRadio").on("click",function(){Convolver.show()});$("#pitchRadio").on("click",function(){Pitch.show()});
$("#advancedLabel").on("click",function(){Advanced.toggle()});$("#limiterRadio").on("click",function(){Limiter.show()});$("#eqRadio").on("click",function(){Equalizer.show()});$("#powerIcon").on("click",function(){chrome.tabs.query({active:!0,currentWindow:!0},function(a){a=a[0];Power.powerIcon(a.id,a.title)})});$("#power").on("click",function(){Power.toggle()});$("#presets").on("change",function(a){Preset.presetsChangeHandler(a.target.value)});$("#delete").on("click",function(){Methods.save("volumePresetVal",
1);Preset.deletePreset(Tabs.current());Popup.showSave()});$("#savePresetLabel").on("click",function(){Preset.savePreset(Tabs.current()+"Preset");Popup.showLoad()});$("#optionsPage").on("click",function(){chrome.tabs.create({url:"options.html"})});$("#loadPresetLabel").on("click",function(){Preset.loadPreset(Tabs.current()+"Preset")});$("#bypass").on("click",function(){Bypass.toggle()});$("#monoBtn").on("click",function(){Mono.toggle()});$("#karaokeBtn").on("click",function(){Karaoke.toggle()});$("#panDiv").on("dblclick",
function(){Pan.change(0)})},Popup=function(){new Localizations;var a=function(){new BackgroundListener;new ButtonEvents;Theme.loadSelected();chrome.tabs.query({active:!0,currentWindow:!0},function(b){var c=function(d){chrome.runtime.getBackgroundPage(function(e){e.capturedTabObj.id==d?Power.init(b[0].title):(Power.alreadyActive(e.capturedTabObj.title),"true"==Methods.load("autoOpen")?$("#powerIcon").click():Methods.sendRuntime({type:"sendAnalyserStream"}))})},f=function(d){chrome.runtime.getBackgroundPage(function(e){"undefined"==
typeof e.capturedTabObj.stream&&Power.on(d.id,d.title)})};"true"==Methods.load("power")?c(b[0].id):f(b[0])})};Instance.isInstance()?a():($("body").remove(),$("html").html(Methods.getLocalizedText("instanceOpenAlready")).css("padding","10px"))};Popup.channelModal=function(a,b){$("#modalBody").html(a);$("#modalTitle").html(b)};Popup.setTitle=function(a){$("#title").text(a)};Popup.setVersion=function(){$("#version").html(Methods.version())};Popup.hideModal=function(){$("#visualizer").show();$("#modalOff").removeClass("unhide")};
Popup.showModal=function(){$("#visualizer").hide();$("#modalOff").addClass("unhide");Volume.display(!1)};Popup.showLoad=function(){$("#savePresetLabel").addClass("hidden");$("#delete").removeClass("hidden");$("#loadPresetLabel").removeClass("hidden")};Popup.showSave=function(){$("#loadPresetLabel").addClass("hidden");$("#delete").addClass("hidden");$("#savePresetLabel").removeClass("hidden")};
Popup.sendChorus=function(){Methods.sendRuntime({type:"chorusRate",value:$("#chorusRate").val()});Methods.sendRuntime({type:"chorusDepth",value:$("#chorusDepth").val()});Methods.sendRuntime({type:"chorusFeedback",value:$("#chorusFeedback").val()});Methods.sendRuntime({type:"chorusDelay",value:$("#chorusDelay").val()})};
Popup.sendConvolver=function(){Methods.sendRuntime({type:"convolverWetLevel",value:$("#convolverWetLevel").val()});Methods.sendRuntime({type:"convolverDryLevel",value:$("#convolverDryLevel").val()});Methods.sendRuntime({type:"convolverHighCut",value:$("#convolverHighCut").val()});Methods.sendRuntime({type:"convolverLowCut",value:$("#convolverLowCut").val()})};
Popup.sendPitch=function(){var a=$("#pitch").val(),b=$("#pitchCents").val();Methods.sendRuntime({type:"pitch",value:a});Methods.sendRuntime({type:"pitchCents",value:b})};Popup.sendLimiter=function(){Methods.sendRuntime({type:"threshold",value:$("#threshold").val()});Methods.sendRuntime({type:"ratio",value:$("#ratio").val()});Methods.sendRuntime({type:"knee",value:$("#knee").val()});Methods.sendRuntime({type:"release",value:$("#release").val()});Methods.sendRuntime({type:"attack",value:$("#attack").val()})};
Popup.sendEq=function(){Methods.sendRuntime({type:"twenty",value:$("#twenty").val()});Methods.sendRuntime({type:"fifty",value:$("#fifty").val()});Methods.sendRuntime({type:"oneHundred",value:$("#oneHundred").val()});Methods.sendRuntime({type:"twoHundred",value:$("#twoHundred").val()});Methods.sendRuntime({type:"fiveHundred",value:$("#fiveHundred").val()});Methods.sendRuntime({type:"oneThousand",value:$("#oneThousand").val()});Methods.sendRuntime({type:"twoThousand",value:$("#twoThousand").val()});
Methods.sendRuntime({type:"fiveThousand",value:$("#fiveThousand").val()});Methods.sendRuntime({type:"tenThousand",value:$("#tenThousand").val()});Methods.sendRuntime({type:"twentyThousand",value:$("#twentyThousand").val()})};var init=new Popup;

