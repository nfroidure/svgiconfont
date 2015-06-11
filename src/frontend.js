var fontBundler = new (require('./common/FontBundler.js'))();
var commandManager = new (require("commandor"))(document.body);
var Stream = require("stream").PassThrough;
var iconInput = document.querySelector('input[type="file"]');
var iconStyle = document.getElementsByTagName('style')[0];
var iconPreview = document.querySelector('.font_preview');
var iconList = document.querySelector('.icons_list');
var iconTPL = document.querySelector('.icons_list li');
var iconForm = document.querySelector('.options form');
var saveButton = document.querySelector('.font_save a');
var fileList = [];

// Application commands
commandManager.suscribe('icons/add', function() {
	iconInput.click();
});
commandManager.suscribe('icons/delete', function(event, params) {
	fileList.splice(params.index,1);
	renderFont();
});
commandManager.suscribe('render', renderFont);

// Remove icon template
iconTPL.parentNode.removeChild(iconTPL);

// Listing files
iconInput.addEventListener('change', function(event) {
  for(var i=0, j=iconInput.files.length; i<j; i++) {
    if(!fileList.some(function(file) {
      return file.name == iconInput.files[i].name;
    })) {
      fileList.push(iconInput.files[i]);
    }
  }
  iconInput.value=null;
  renderFont();
});

// Render
function renderFont() {

  var iconStreams;
  var curCodepoint = 0xE001;
  var usedCodepoints = [];

  while(iconList.firstChild) {
    iconList.removeChild(iconList.firstChild);
  }
  iconPreview.innerHTML = '';

  if(!fileList.length) {
    return;
  }

  iconStreams = fileList.map(function(file, index) {
    var iconStream = new Stream();
    var reader = new FileReader();
    var matches = file.name.match(/^(?:u([0-9a-f]{4})\-)?(.*).svg$/i);
    var codepoint = (matches[1] ? parseInt(matches[1], 16) : curCodepoint++);
    reader.onload = function(e) {
      iconStream.write(e.target.result, 'utf8');
      iconStream.end();
    };
    reader.readAsText(file);

    var iconRow = iconTPL.cloneNode(true);
    iconRow.firstChild.innerHTML = file.name +
      ' [u' + codepoint.toString(16) + ']';
    iconRow.lastChild.setAttribute('href',
      iconRow.lastChild.getAttribute('href') + index);
    iconList.appendChild(iconRow);

    iconStream.metadata = {
      unicode: [String.fromCharCode(codepoint)],
      name: matches[2]
    };

    return iconStream;
  });
  fontBundler.bundle(iconStreams, {
      fontName: iconForm.fontname.value,
      normalize: iconForm.normalize.checked,
      fontHeight: ('' !== iconForm.fontheight.value ? parseInt(iconForm.fontheight.value) : undefined),
      descent: parseInt(iconForm.fontdescent.value, 10) || 0,
      fixedWidth: iconForm.fontfixed.checked,
      normalize: iconForm.normalize.checked
    }, function(result) {
    iconStyle.innerHTML = '\n\
    @font-face {\n\
	    font-family: "'+iconForm.fontname.value+'";\n\
    	src: url("'+result.urls.eot+'");\n\
    	src: url("'+result.urls.eot+'") format("embedded-opentype"),\n\
	         url("'+result.urls.ttf+'") format("truetype"),\n\
	         url("'+result.urls.woff+'") format("woff"),\n\
	         url("'+result.urls.svg+'") format("svg");\n\
	    font-weight: normal;\n\
	    font-style: normal;\n\
    }\n\
    ';
    iconPreview.setAttribute('style','\n\
	    font-family: '+iconForm.fontname.value+';\n\
	    speak: none;\n\
	    font-style: normal;\n\
	    font-weight: normal;\n\
	    font-variant: normal;\n\
	    text-transform: none;\n\
	    line-height:7.2rem;\n\
	    font-size:6rem;\n\
	    -webkit-font-smoothing: antialiased;\n\
	    -moz-osx-font-smoothing: grayscale;');
    iconPreview.innerHTML = iconStreams.length > 1 ? iconStreams.reduce(function(a, b) {
      return (a.metadata && a.metadata.unicode ? a.metadata.unicode[0] : a) +
        ' ' + b.metadata.unicode[0];
    }) : iconStreams[0].metadata.unicode[0];
    if(saveButton.href) {
      window.URL.revokeObjectURL(saveButton.href);
    }
    saveButton.href = window.URL.createObjectURL(result.zip);
    saveButton.download = iconForm.fontname.value+'.zip';
  });
}

module.exports = {};
