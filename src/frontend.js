var svgicons2svgfont = require('svgicons2svgfont')
  , commandManager = new (require("commandor"))(document.body)
  , Stream = require("stream").PassThrough
  , StringDecoder = require('string_decoder').StringDecoder
  , iconInput = document.querySelector('input[type="file"]')
  , iconStyle = document.getElementsByTagName('style')[0]
  , iconPreview = document.querySelector('.font_preview')
  , iconList = document.querySelector('.icons_list')
  , iconTPL = document.querySelector('.icons_list li')
  , iconName = document.querySelector('.options input')
  , fontURL
  , fontBlob
  , fileList = [];

// Application commands
commandManager.suscribe('icons/add', function() {
	iconInput.click();
});
commandManager.suscribe('icons/delete', function(event, params) {
	fileList.splice(params.index,1);
	renderFont();
});
commandManager.suscribe('font/save', function(event, params) {
  var reader = new FileReader();
  reader.addEventListener("loadend", function() {
  	fontURL && window.open(reader.result);
  });
  reader.readAsDataURL(fontBlob);
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
    , fontStream
    , curCodepoint = 0xE001
    , usedCodepoints = []
    , parts = []
    , decoder = new StringDecoder('utf8');

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
      , matches = file.name.match(/^(?:u([0-9a-f]{4})\-)?(.*).svg$/i);
    reader.onload = function(e) {
      iconStream.write(e.target.result, 'utf8');
      iconStream.end();
    };
    reader.readAsText(file);

    var iconRow = iconTPL.cloneNode(true);
    iconRow.firstChild.innerHTML = file.name;
    iconRow.lastChild.setAttribute('href',
      iconRow.lastChild.getAttribute('href') + index);
    iconList.appendChild(iconRow);
    
    return {
      stream: iconStream,
      codepoint: (matches[1] ? parseInt(matches[1], 16) : curCodepoint++),
      name: matches[2]
    };
  });
  fontStream = svgicons2svgfont(iconStreams, {font: iconName.value});
  fontStream.on('data', function(chunk) {
    parts.push(decoder.write(chunk));
  });
  fontStream.on('finish', function() {
    if(fontURL) {
      window.URL.revokeObjectURL(fontURL);
    }
    fontBlob = new Blob(parts,{type: 'image/svg+xml'});
    fontURL = window.URL.createObjectURL(fontBlob);
    iconStyle.innerHTML = '\n\
    @font-face {\n\
	    font-family: "'+iconName.value+'";\n\
	    src:url("'+fontURL+'") format("svg");\n\
	    font-weight: normal;\n\
	    font-style: normal;\n\
    }\n\
    ';
    iconPreview.setAttribute('style','font-family:'+iconName.value+';');
    iconPreview.innerHTML = iconStreams.length > 1 ? iconStreams.reduce(function(a,b) {
      return (a.codepoint ? '&#x' + a.codepoint.toString(16) + ';' : a)
        + ' ' + '&#x' + b.codepoint.toString(16) + ';';
    }) : '&#x' + iconStreams[0].codepoint.toString(16) + ';';
  });
}

module.exports = {};
