var fontBundler = new (require('./common/FontBundler.js'))()
  , commandManager = new (require("commandor"))(document.body)
  , Stream = require("stream").PassThrough
  , iconInput = document.querySelector('input[type="file"]')
  , iconStyle = document.getElementsByTagName('style')[0]
  , iconPreview = document.querySelector('.font_preview')
  , iconList = document.querySelector('.icons_list')
  , iconTPL = document.querySelector('.icons_list li')
  , iconForm = document.querySelector('.options form')
  , saveButton = document.querySelector('.font_save a')
  , fileList = [];

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

  var iconStreams
    , curCodepoint = 0xE001
    , usedCodepoints = [];

  while(iconList.firstChild) {
    iconList.removeChild(iconList.firstChild);
  }
  iconPreview.innerHTML = '';

  if(!fileList.length) {
    return;
  }

  iconStreams = fileList.map(function(file, index) {
    var iconStream = new Stream()
      , reader = new FileReader()
      , matches = file.name.match(/^(?:u([0-9a-f]{4})\-)?(.*).svg$/i)
      , codepoint = (matches[1] ? parseInt(matches[1], 16) : curCodepoint++);
    reader.onload = function(e) {
      iconStream.write(e.target.result, 'utf8');
      iconStream.end();
    };
    reader.readAsText(file);

    var iconRow = iconTPL.cloneNode(true);
    iconRow.firstChild.innerHTML = file.name
      + ' [u' + codepoint.toString(16) + ']';
    iconRow.lastChild.setAttribute('href',
      iconRow.lastChild.getAttribute('href') + index);
    iconList.appendChild(iconRow);

    return {
      stream: iconStream,
      codepoint: codepoint,
      name: matches[2]
    };
  });
  fontBundler.bundle(iconStreams, {
      fontName: iconForm.fontname.value,
      fontHeight: ('' !== iconForm.fontheight.value ? iconForm.fontheight.value : undefined),
      descent: parseInt(iconForm.fontdescent.value, 10) || 0,
      fixedWidth: iconForm.fontfixed.checked
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
    iconPreview.innerHTML = iconStreams.length > 1 ? iconStreams.reduce(function(a,b) {
      return (a.codepoint ? '&#x' + a.codepoint.toString(16) + ';' : a)
        + ' ' + '&#x' + b.codepoint.toString(16) + ';';
    }) : '&#x' + iconStreams[0].codepoint.toString(16) + ';';
    if(saveButton.href) {
      window.URL.revokeObjectURL(saveButton.href);
    }
    saveButton.href = window.URL.createObjectURL(result.zip);
    saveButton.download = iconForm.fontname.value+'.zip';
  });
}

module.exports = {};
