var width = 640,
    height = 480,
    centered,
    quantize;



var path = d3.geo.path();

var mapSvg = d3.select("#uiMap").append("svg")
    .attr("width", width)
    .attr("height", height);
var keySvg = d3.select("#uiKey").append("svg")
    .attr("width", 200)
    .attr("height", height);

var color = d3.scale.linear()
    .domain([0, 20])
    .range(["#bdeeff", "#00114F"])
    .interpolate(d3.interpolateLab);

queue()
    .defer(d3.json, "/content/us.js")
    .defer(d3.csv, "/content/censusquickfacts.csv")
    .defer(d3.csv, "/content/countyfips.csv")
    .await(ready);

var us, census, countyFips;

function showData() {
    var rateById = {};
    var maxVal;
    var minVal;
    var maxFips, minFips, maxCounty, minCounty;
    var vals = [];
    var key = document.getElementById('measure').value;

    census.forEach(function(d) {
        var fips = parseInt(d.fips);
        var val = parseFloat(d[key]);
        if (fips != 0 && fips % 1000 != 0) {
            if (val > maxVal || maxVal == null) {
                maxVal = val;
                maxFips = fips;
            }
            if (val < minVal || minVal == null) {
                minVal = val;
                minFips = fips;
            }
            rateById[fips] = +val;
            vals.push(val);
        }
    });
    countyFips.forEach(function(c) {
        if (parseInt(c.StateFips + c.CountyFips) == maxFips) maxCounty = c.CountyName + ', ' + c.State;
        if (parseInt(c.StateFips + c.CountyFips) == minFips) minCounty = c.CountyName + ', ' + c.State;
    });
    vals = vals.sort(d3.ascending);
    quantize = d3.scale.quantile()
        .domain(vals)
        .range(d3.range(20).map(color));
    //.range(d3.range(20).map(function (i) { return color(i); }));

    mapSvg.select('g').selectAll('path')
        .transition()
        .duration(750)
        .style("fill", function(d) {
            return quantize(rateById[d.id] || 0);
        });

    keySvg.select('g').remove();
    var keysEnter = keySvg.append('g').selectAll('circle')
        .data(d3.range(0, 21, 2))
        .enter();
    keysEnter
        .append('circle')
        .attr('cy', function(i) {
            return (i + 1) * 14;
        })
        .attr('cx', 12)
        .attr('r', 10)
        .style('fill', color);

    keysEnter
        .append('text')
        .attr('class', 'keyLabel')
        .attr('y', function(i) {
            return ((i + 1) * 14) + 5;
        })
        .attr('x', 26)
        .text(function(i) {
            var keyLabel;
            if (i == 0) keyLabel = d3.round(minVal || 0, 1) + ' ' + minCounty;
            if (i != 0 && i != 20) keyLabel = d3.round(quantize.quantiles()[i], 1);
            if (i == 20) keyLabel = d3.round(maxVal || 0, 1) + ' ' + maxCounty;
            return keyLabel;
        });

}
var containerWidth = 640,
    baseWidth = 960,
    baseStrokeWidth = 1,
    scaleFactor = containerWidth / baseWidth;

function prepareMap() {
    mapSvg.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.object(us, us.objects.counties).geometries)
        .enter().append("path")
        .style("fill", function(d) {
            return '#ccc'
        })
        .attr("d", path)
        .attr("transform", "scale(" + scaleFactor + ")")
        //and invert the scale to keep a constant stroke width:
        .style("stroke-width", baseStrokeWidth / scaleFactor + "px")
        .on("click", click);

    mapSvg.append("g")
        .attr("class", "states")
        .append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) {
            return a.id !== b.id;
        }))
        .attr("class", "states")
        .attr("d", path)
        .attr("transform", "scale(" + scaleFactor + ")")
        // and invert the scale to keep a constant stroke width:
        .style("stroke-width", baseStrokeWidth / scaleFactor + "px");
}

function click(d) {
    var x = 0,
        y = 0,
        k = 1;

    if (d && centered !== d) {
        var centroid = path.centroid(d);
        x = -centroid[0] / 4;
        y = -centroid[1] / 4;
        k = 2;
        centered = d;
    } else {
        centered = null;
    }

    mapSvg.selectAll("path")
        .classed("active", centered && function(d) {
            return d === centered;
        });

    mapSvg.selectAll('g').transition()
        .duration(1000)
        .attr("transform", "scale(" + k + ")translate(" + x + "," + y + ")")
        .style("stroke-width", 1.5 / k + "px");
}

function ready(error, usData, censusData, countyFipsData) {
    census = censusData;
    us = usData;
    countyFips = countyFipsData;
    prepareMap();
    showData();
}
