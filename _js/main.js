var topNav = document.getElementById('topNav').offsetHeight;

var width = document.getElementById('map-container').offsetWidth,
    height = window.innerHeight - topNav,
    centered,
    quantize,
    color;

var x, y, xAxis, yAxis, barChart;

var hash = ((!window.location.hash) ? 'bingeDrinking' : document.URL.substr(document.URL.indexOf('#') + 1));
// var color = d3.scale.category20b();

// .range(["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"]);

var dscale = width * 1.2;
var dtrans = [width / 2, height / 2];

var projmap = d3.geo.albersUsa()
    .scale(dscale)
    .translate(dtrans);

var path = d3.geo.path()
    .projection(projmap);

var usSvg = d3.select('#map-main').append('svg')
    .attr('width', width)
    .attr('height', height);
// .call(d3.behavior.zoom().on('zoom', redraw));

var group = usSvg.append('g');

var keySvg = d3.select("#key-main").append("svg").attr('height', 310);

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
    makeBarChart()
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

    group.append('path')
        .datum(countyborders)
        .attr('class', 'borders')
        .attr('id', 'county-borders')
        .attr('d', path);

    group.append('path')
        .datum(stateborders)
        .attr('class', 'borders')
        .attr('id', 'state-borders')
        .attr('d', path);

    group.append('path')
        .datum(namericaborders)
        .attr('class', 'borders')
        .attr('id', 'new-borders')
        .attr('d', path);
}

function showData(dFilter) {
    $('g').html("");
    dataFilter = dFilter;
    var cntyInfo = {};
    var vals = [];
    var maxVal,
        minVal;

    $.each(meta, function(k, val) {
        $.each(meta.d, function(k, v) {
            if (k == dFilter) {
                maxVal = v.natMax;
                minVal = v.natMin;
            }
        });
    });

    console.log(minVal + ', ' + maxVal);
    color = d3.scale.linear()
        .domain([minVal, maxVal])
        .range(["white", "steelblue"])
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

    var curFill = group.select('g').selectAll('path').style('fill');
    console.log(curFill);

    group.select('g').selectAll('path')
        .transition()
        .style('fill', function(d) {
            return color(cntyInfo[d.id]);
        });

    keySvg.select('g').remove();

    var keysEnter = keySvg.append('g').selectAll('circle')
        .data(d3.range(0, 21, 2))
        .enter();
    keysEnter.append('circle')
        .attr('cy', function(d) {
            return (d + 1) * 14;
        })
        .attr('cx', 12)
        .attr('r', 10)
        .style('fill', color);

    keysEnter.append('text')
        .attr('class', 'keyLabel')
        .attr('y', function(d) {
            return ((d + 1) * 14) + 5;
        })
        .attr('x', 26)
        .text(function(d) {
            var keyLabel;
            if (d == 0) keyLabel = d3.round(minVal || 0, 1);
            if (d != 0 && d != 20) keyLabel = d3.round(quantize.quantiles()[d], 1);
            if (d == 20) keyLabel = d3.round(maxVal || 0, 1);
            return keyLabel;
        });
}

function showCountyData(d) {
    var nm = brfss[d.id].countyName;
    var st = brfss[d.id].stateAbb;

    var stats = brfss[d.id]['d'];

    var rate = stats[dataFilter].rate;
    var countyRates = "";

    // $.each(meta.d, function(k, v) {
    //     var num = (stats[k].rate).toFixed(2);
    //     // // if (num > 0) {
    //     //     countyRates += '<li><b>'+k+'</b>: '+num+'%</li>';
    //     // // }
    // });
    $.each(meta.d, function(k, v) {
    // d3.json("_data/meta.json", function(error, data) {
        // var items = data.d;
        // console.log(items);
        x.domain(data.map(function(d) { return d.d; }));
        y.domain([0, d3.max(data, function(d) {
            return items.natMax;
        })]);

        barChart.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) {
                return x(d);
            })
            .attr("width", x.rangeBand())
            .attr("y", function(d) {
                return y(stats[d].rate);
            })
            .attr("height", function(d) {
                return height - y(stats[d].rate);
            });

    });

    $('#county-info').html('<h4>' + nm + ', ' + st + '</h4>\n<ul>' + countyRates + '</ul>');
}

function makeBarChart() {
    var mgn = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
    },
        cW = $('#county-chart').width() - mgn.left - mgn.right,
        cH = 250 - mgn.top - mgn.bottom;

    x = d3.scale.ordinal()
        .rangeRoundBands([0, cW], .1);

    y = d3.scale.linear()
        .range([cH, 0]);

    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10, "%");

    barChart = d3.select("#county-chart")
        .append("svg")
        .attr('width', cW + mgn.left + mgn.right)
        .attr('height', cH + mgn.top + mgn.bottom)
        .append('g')
        .attr('transform', 'translate(' + mgn.left + ',' + mgn.top + ')');

    barChart.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + cH + ')')
        .call(xAxis);

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
    $('#county-info').html('');
}

function ready(error, usData, naData, metaData, brfssData) {
    us = usData;
    na = naData;
    meta = metaData;
    brfss = brfssData;

    prepare();
    showData(dataFilter);
}

function showhideData(d) {

}

function colorize(value) {
    var val = mapToRange(value, 0, 1, 0, 200);
    val = Math.round(val);
    return 'rgb(' + val + ',' + val + ',' + val + ')';
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
        $("#navMenuLeft").append(items.join(""));
    });
}

$('ul').on('click', 'li', function() {
    $('#navMenuLeft li').removeClass("active");
    // add class to the one we clicked
    $(this).addClass("active");
    showData(this.id);
});
