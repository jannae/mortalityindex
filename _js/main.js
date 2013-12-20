var topNav = $('#topNav').outerHeight(true);
var hdrTitle = $('#hdrTitle').outerHeight(true);

var width = $('#map-container').outerWidth(true),
    keywidth = $('#legend').outerWidth(true),
    height = $(window).height() - topNav - hdrTitle,
    centered,
    quantize,
    color;

var maxVal,
    minVal;

var x, y, xAxis, yAxis, barChart, mgn, cW, cH;

var hash = ((!window.location.hash) ? 'totAvg' : document.URL.substr(document.URL.indexOf('#') + 1));

var dscale = width; // * 1.1;
var dtrans = [width / 2, height / 2];

var projmap = d3.geo.albersUsa()
    .scale(dscale)
    .translate(dtrans);

var path = d3.geo.path()
    .projection(projmap);

var usSvg = d3.select('#map-main').append('svg')
    .attr('width', width)
    .attr('height', height);

var group = usSvg.append('g');

var keyblock = d3.select("#key-container")
    .append("div")
    .attr('id', 'key-main')
    .attr('height', 100)
    .attr('width', keywidth);

queue()
    .defer(d3.json, "_data/us.json")
    .defer(d3.json, "_data/na.json")
    .defer(d3.json, "_data/meta.json")
    .defer(d3.json, "_data/brfss.json")
    .await(ready);

var us,
    meta,
    brfss,
    dataFilter = hash;

function prepare() {
    makeNav();
    makeBarChart();

    var counties = topojson.feature(us, us.objects.counties);
    var states = topojson.feature(us, us.objects.states);
    var namerica = topojson.feature(na, na.objects.newamerica);

    group.append('g')
        .attr('id', 'counties')
        .selectAll('path')
        .data(counties.features)
        .enter().append('path')
        .attr('d', path)
        .attr('class', 'county')
        .attr('id', function(d) {
            return d.id;
        })
        .on('click', clicked)
        .on('mouseover', showCountyData)
        .on('mouseout', hideCountyData);


    var countyborders = topojson.mesh(us, us.objects.counties,
        function(a, b) {
            return a !== b;
        });
    var stateborders = topojson.mesh(us, us.objects.states,
        function(a, b) {
            return a.id !== b.id;
        });

    var namericaborders = topojson.mesh(na, na.objects.newamerica,
        function(a, b) {
            return a !== b;
        });

    var usborders = topojson.mesh(us, us.objects.land);

    group.append('path')
        .datum(countyborders)
        .attr('class', 'borders')
        .attr('id', 'county-borders')
        .attr('d', path);

    group.append('path')
        .datum(stateborders)
        .attr('class', 'borders')
        .attr('id', 'state-borders')
        .attr('d', path)
        .style('stroke-width', '1px');

    group.append('path')
        .datum(namericaborders)
        .attr('class', 'borders')
        .attr('id', 'new-borders')
        .attr('d', path)
        .style('stroke-width', '1px');

    group.append('path')
        .datum(usborders)
        .attr('class', 'borders')
        .attr('id', 'us-borders')
        .attr('d', path)
        .style('stroke-width', '1px');
}

function showData(dFilter) {
    $('g').html("");
    dataFilter = dFilter;
    var cntyInfo = {};
    var vals = [];


    makeHeader();

    $.each(meta, function(k, val) {
        $.each(meta.d, function(k, v) {
            if (k == dFilter) {
                maxVal = v.natMax;
                minVal = v.natMin;
                dColor = v.color;
            }
        });
    });

    color = d3.scale.linear()
        .domain([minVal, maxVal])
        .range(["white", dColor])
        .interpolate(d3.interpolateLab);

    quantize = d3.scale.quantile()
        .domain([minVal, maxVal])
        .range(d3.range(20).map(color));

    $.each(brfss, function(id, val) {
        // cntyInfo[id] = val.totAvg;
        $.each(val.d, function(k, v) {
            if (k == dFilter) {
                cntyInfo[id] = v.rate;
            }
        });
    });

    // var curFill = group.select('g').selectAll('path').style('fill');
    // console.log(curFill);

    group.select('g').selectAll('path')
        .transition()
        .style('fill', function(d) {
            return color(cntyInfo[d.id]);
        });

    makeKey();
}

function makeKey() {
    keyblock.selectAll('div').remove();

    var keysEnter = keyblock.selectAll('div')
        .data(d3.range(0, 13, 2))
        .enter();

    kB = keysEnter.append('div')
        .attr('class', 'key-block');

    kB.append('div')
        .attr('class', 'key-color-block')
        .style('background-color', function(d) {
            var clrVal;
            if (d == 0) clrVal = color(d3.round(minVal || 0));
            if (d != 0 && d != 12) clrVal = color(d3.round(quantize.quantiles()[d]));
            if (d == 12) clrVal = color(d3.round(maxVal || 0));
            return clrVal;
        });

    kB.append('small')
        .attr('class', 'key-value text-center text-muted')
        .text(function(d) {
            var keyVal;
            if (d == 0) keyVal = "N/D*";
            if (d != 0 && d != 12) keyVal = d3.round(quantize.quantiles()[d]) + '%';
            if (d == 12) keyVal = d3.round(maxVal || 0) + '%';
            return keyVal;
        });

    keyblock.append('div').attr('class', 'clearfix');
}

function showCountyData(d) {
    showCountyBarChart(d);

    var nm = brfss[d.id].countyName;
    var st = brfss[d.id].state;
    var pop = numCommas(brfss[d.id].population);

    var stats = brfss[d.id]['d'];

    var rate = stats[dataFilter].rate;
    var countyRates = "";

    $.each(stats, function(k, v) {
        var num = (v.rate).toFixed(2);
        // if (num > 0) {
        countyRates += '<li><b>' + k + '</b>: ' + num + '%</li>';
        // }
    });

    $('#county-info h4').html(nm + ' County, ' + st);
    $('#county-info p').html('<strong>Population:</strong> '+pop);
}

function showCountyBarChart(d) {
    barChart.selectAll('g').remove();
    var nm = brfss[d.id].countyName;
    var st = brfss[d.id].stateAbb;

    var stats = brfss[d.id]['d'];
    // var stats = brfss[d.id]['d'];
    var data = [];

    $.each(stats, function(k, v) {
        var loop = {}
        // loop.id = k;
        loop.label = meta['d'][k].label;
        loop.rate = v.rate / 100
        loop.color = meta['d'][k].color;
        loop.natAvg = meta['d'][k].natAvg / 100;
        data.push(loop);
    })

    x = d3.scale.ordinal()
        .rangeRoundBands([0, cW], .1);


    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");


    x.domain(data.map(function(d) {
        return d.label;
    }));
    y.domain([0, 1]);

    xA = barChart.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + cH + ')')
        .call(xAxis);

    barChart.selectAll('.bar').remove();
    barChart.selectAll('.line').remove();
    barChart.selectAll('.barlabels').remove();


    barChart.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('Rate');

    barChart.selectAll('.x')
        .selectAll("text")
    // .attr('transform', 'rotate(-60, 0, 40)');
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d) {
            return "rotate(-60,0,0)"
        });

    barChart.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) {
            return x(d.label);
        })
        .attr("width", x.rangeBand())
        .attr("y", function(d) {
            return y(d.rate);
        })
        .attr("height", function(d) {
            return cH - y(d.rate);
        });

    barChart.selectAll(".line")
        .data(data)
        .enter().append("line")
        .attr("class", "line")
        .attr("x1", function(d) {
            return x(d.label) - 1;
        })
        .attr("y1", function(d) {
            return y(d.natAvg);
        })
        .attr("x2", function(d) {
            return x(d.label) + x.rangeBand() + 1;
        })
        .attr("y2", function(d) {
            return y(d.natAvg);
        })
        .attr("stroke-width", 1)
        .attr("stroke", "purple");

    barChart.selectAll('.barlabels')
        .data(data)
        .enter().append('text')
        .attr("class", "barlabels small text-muted axis")
        .attr("x", function(d) {
            return x(d.label);
        })
        .attr("y", function(d) {
            return y(d.rate)-5;
        })
        // .append('small')
        .text(function(d) {
            return (d.rate*100).toFixed(1);
        });
}

function makeBarChart() {
    mgn = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
    };
    cW = $('#county-chart').width() - mgn.left - mgn.right;
    cH = 150 - mgn.top - mgn.bottom;

    barChart = d3.select("#county-chart")
        .append("svg")
        .attr('width', cW + mgn.left + mgn.right)
        .attr('height', cH + mgn.top + mgn.bottom + 125)
        .append('g')
        .attr('transform', 'translate(' + mgn.left + ',' + mgn.top + ')');

    y = d3.scale.linear()
        .range([cH, 0]);

    yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(6, "%");

    barChart.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('Rate');


}

function hideCountyData(d) {
    // $('#county-info').html('');
    // barChart.selectAll('.bar').remove();
    // barChart.selectAll('.line').remove();
    // barChart.selectAll('.barlabels').remove();
}

function ready(error, usData, naData, metaData, brfssData) {
    us = usData;
    na = naData;
    meta = metaData;
    brfss = brfssData;

    prepare();
    showData(dataFilter);
}

function clicked(d) {
    var x = 0,
        y = 0,
        k = 1;

    if (d && centered !== d) {
        var centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 4;
        centered = d;
    } else {
        x = width / 2;
        y = height / 2;
        k = 1;
        centered = null;
    }

    group.selectAll('path')
        .classed('active', centered && function(d) {
            return d === centered;
        });

    group.transition()
        .duration(750)
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
        .style('stroke-width', 1.5 / k + 'px');
}

function redraw() {
    console.log('redraw scale', d3.event.scale * dscale);
    projmap.scale(d3.event.scale * dscale);
    var xTrans = d3.event.translate[0] + dtrans[0];
    var yTrans = d3.event.translate[1] + dtrans[1];
    console.log('redraw x', xTrans);
    console.log('redraw y', yTrans);
    projmap.translate([xTrans, yTrans]);
    usSvg.selectAll('path')
        .attr('d', path);
}

function makeNav() {
    $.getJSON("_data/meta.json", function(data) {
        var items = [];
        $.each(data.d, function(k, v) {
            var active = (k == dataFilter) ? ' class="active"' : '';
            items.push('<li id="' + k + '"' + active + '><a href="#' + k + '">' + v.label + '</a></li>');
        });
        $("#navDropdownLeft").append(items.join(""));
    });
}

function makeHeader() {
    var metaD = meta.d[dataFilter];
    $('#hdrTitle h2').html(metaD.label);
    $('#desc').html(metaD.description);
    $('#ques').html('<em>' + metaD.question + '</em>');
}

$('ul#navDropdownLeft').on('click', 'li', function() {
    $('#navDropdownLeft li').removeClass("active");
    // add class to the one we clicked
    $(this).addClass("active");
    var navLab = $(this).text();
    $('#navDropdownTitle').html(navLab + ' <b class="caret"></b>');
    showData(this.id);
});



$(".navbar-form input[type='checkbox']").on('click', function() {
    if (this.checked) {
        $('#' + this.name).attr('style', 'stroke-width:1.25px');
    } else {
        $('#' + this.name).removeAttr('style');
    }
});

// #state-borders {
//     stroke: #00ff00;
//     stroke-width: 0.5px;
// }
// #new-borders
