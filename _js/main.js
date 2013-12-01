var width = window.innerWidth,
    height = window.innerHeight;
var dscale = width;
var dtrans = [width / 2, height / 2];

var svg = d3.select("#main").append("svg");
// .attr("width", width)
// .attr("height", height);
// .call(d3.behavior.zoom().on("zoom", redraw));

var svgmap = d3.geo.albers()
    .scale(dscale)
    .translate(dtrans);
var path = d3.geo.path()
    .pointRadius(1)
    .projection(svgmap);

d3.json("_data/us.json", function(error, us) {
    var counties = topojson.feature(us, us.objects.counties);
    var minbounds = topojson.mesh(us, us.objects.counties,
        function(a, b) { return a !== b; });
    var majbounds = topojson.mesh(us, us.objects.states,
        function(a, b) { return a.id !== b.id; });

    svg.append("path")
        .datum(counties)
        .attr("d", path);

    svg.selectAll(".county")
        .data(counties.features)
        .enter().append("path")
        .attr("class", function(d) {
            return "county " + d.id;
        })
        .attr("d", path);

    svg.append("path")
        .datum(minbounds)
        .attr("d", path)
        .attr("class", "minbounds");

    svg.append("path")
        .datum(majbounds)
        .attr("class", "majbounds")
        .attr("d", path);
});

function redraw() {
    console.log("redraw scale", d3.event.scale * dscale);
    svgmap.scale(d3.event.scale * dscale);
    var xTrans = d3.event.translate[0] + dtrans[0];
    var yTrans = d3.event.translate[1] + dtrans[1];
    console.log("redraw x", xTrans);
    console.log("redraw y", yTrans);
    svgmap.translate([xTrans, yTrans]);
    svg.selectAll("path")
        .attr("d", path);
}
