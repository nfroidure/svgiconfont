var svgicons2svgfont = require('svgicons2svgfont')
  , svg2ttf = require('svg2ttf')
  , ttf2eot = require('ttf2eot')
  , ttf2woff = require('ttf2woff')
  , JSZip = require('jszip')
  , StringDecoder = require('string_decoder').StringDecoder
;

function FontBundler() {

  /* Private vars */
  var _self = this
    , _urls = {}
    , _zip
    , _options;


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
      var ttfFontBuffer = makeTTF(content)
      _zip.file(_options.fontName+'.ttf', ttfFontBuffer);
      _zip.file(_options.fontName+'.eot', makeEOT(ttfFontBuffer));
      _zip.file(_options.fontName+'.woff', makeWOFF(ttfFontBuffer));
      callback({
        urls: _urls,
        zip: _zip.generate({type:'blob', compression:'DEFLATE'})
      });
      urls={}; _zip = null;
    });
  }

  /* Private functions */
  function makeSVG(iconStreams, callback) {
    var fontStream
      , parts = []
      , decoder = new StringDecoder('utf8');
    ;
    fontStream = svgicons2svgfont(iconStreams, {font: _options.fontName});
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
    var woffFontBuffer = ttf2woff(ttfFontBuffer.buffer).buffer;
    if(window && window.URL && window.URL.createObjectURL) {
      _urls.woff = window.URL.createObjectURL(new Blob([woffFontBuffer],
        {type: 'application/octet-stream'}));
    }
    return woffFontBuffer;
  }
}

module.exports = FontBundler;
