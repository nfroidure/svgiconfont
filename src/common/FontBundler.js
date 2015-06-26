var svgicons2svgfont = require('svgicons2svgfont');
var svg2ttf = require('svg2ttf');
var ttf2eot = require('ttf2eot');
var ttf2woff = require('ttf2woff');
var ttf2woff2 = require('ttf2woff2');
var JSZip = require('jszip');
var StringDecoder = require('string_decoder').StringDecoder;

function FontBundler() {

  /* Private vars */
  var _self = this;
  var _urls = {};
  var _zip;
  var _options;


  /* Public methods */
  this.bundle = function bundle(icons, options, callback) {
    // Revoke old URLs
    if(window && window.URL && window.URL.createObjectURL) {
      for(var prop in _urls) {
        window.URL.revokeObjectURL(_urls[prop]);
      }
    }
    // Prepare to ZIP
    _zip = new JSZip();
    // Save options
    _options = options || {};
    _options.fontName = _options.fontName || 'iconfont';
    // Generate SVG
    makeSVG(icons, function aSVGCallback(content) {
      // Add to ZIP
      _zip.file(_options.fontName+'.svg', content);
      // Generate TTF
      var ttfFontBuffer = makeTTF(content);
      _zip.file(_options.fontName+'.ttf', ttfFontBuffer);
      _zip.file(_options.fontName+'.eot', makeEOT(ttfFontBuffer));
      _zip.file(_options.fontName+'.woff', makeWOFF(ttfFontBuffer));
      _zip.file(_options.fontName+'.woff2', makeWOFF2(ttfFontBuffer));
      callback({
        urls: _urls,
        zip: _zip.generate({type:'blob', compression:'DEFLATE'})
      });
      urls={}; _zip = null;
    });
  };

  /* Private functions */
  function makeSVG(iconStreams, callback) {
    var fontStream = svgicons2svgfont(_options);
    var parts = [];
    var decoder = new StringDecoder('utf8');
    fontStream = svgicons2svgfont(_options);
    fontStream.on('data', function(chunk) {
      parts.push(decoder.write(chunk));
    });
    fontStream.on('finish', function() {
      if(window && window.URL && window.URL.createObjectURL) {
        _urls.svg = window.URL.createObjectURL(new Blob(parts,
          {type: 'image/svg+xml'}));
      }
      callback(parts.join(''));
    });
    iconStreams.forEach(fontStream.write.bind(fontStream));
    fontStream.end();
  }

  function makeTTF(svgFont) {
    var ttfFontBuffer = svg2ttf(svgFont).buffer;
    if(window && window.URL && window.URL.createObjectURL) {
      _urls.ttf = window.URL.createObjectURL(
        new Blob([ttfFontBuffer],
          {type: 'application/octet-stream'}));
    }
    return ttfFontBuffer;
  }

  function makeEOT(ttfFontBuffer) {
    var eotFontBuffer = ttf2eot(ttfFontBuffer).buffer;
    if(window && window.URL && window.URL.createObjectURL) {
      _urls.eot = window.URL.createObjectURL(new Blob([eotFontBuffer],
        {type: 'application/octet-stream'}));
    }
    return eotFontBuffer;
  }

  function makeWOFF(ttfFontBuffer) {
    var woffFontBuffer = ttf2woff(new Uint8Array(ttfFontBuffer.buffer)).buffer;
    if(window && window.URL && window.URL.createObjectURL) {
      _urls.woff = window.URL.createObjectURL(new Blob([woffFontBuffer],
        {type: 'application/octet-stream'}));
    }
    return woffFontBuffer;
  }

  function makeWOFF2(ttfFontBuffer) {
    ttfFontBuffer = new Uint8Array(ttfFontBuffer);
    var buf = new Buffer(ttfFontBuffer.length);
    for(var i = 0, j = ttfFontBuffer.length; i < j; i++) {
      buf.writeUInt8(ttfFontBuffer[i], i);
    }
    buf = ttf2woff2(buf);
    var woff2FontBuffer = new Uint8Array(buf.length);
    for(i = 0, j = buf.length; i < j; i++) {
      woff2FontBuffer[i] = buf.readUInt8(i);
    }
    if(window && window.URL && window.URL.createObjectURL) {
      _urls.woff2 = window.URL.createObjectURL(new Blob([woff2FontBuffer],
        {type: 'application/octet-stream'}));
    }
    return woff2FontBuffer;
  }
}

module.exports = FontBundler;
