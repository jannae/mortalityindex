'use strict';

function colorLuminance(hex, lum) {

    // validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    }
    lum = lum || 0;

    // convert to decimal and change luminosity
    var rgb = '#', c, i;
    for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i*2,2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ('00'+c).substr(c.length);
    }

    return rgb;
}

function mapToRange(value, srcLow, srcHigh, dstLow, dstHigh){
  // value is outside source range return fail
  if (value < srcLow || value > srcHigh){
    return NaN;
  }

  var srcMax = srcHigh - srcLow,
      dstMax = dstHigh - dstLow,
      adjValue = value - srcLow;

  return (adjValue * dstMax / srcMax) + dstLow;
}

function colorize(value) {
    var val = mapToRange(value, 0, 1, 0, 200);
    val = Math.round(val);
    return 'rgb(' + val + ',' + val + ',' + val + ')';
}

function numCommas(x) {
    return x.toString().replace(/\B(?=(?:\d{3})+(?!\d))/g, ',');
}