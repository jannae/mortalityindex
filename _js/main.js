var width = window.innerWidth,
    height = window.innerHeight,
    centered;

var color = d3.scale.category20b();

var dscale = width;
var dtrans = [width / 2, height / 2];

var projmap = d3.geo.albersUsa()
    .scale(dscale)
    .translate(dtrans);

var path = d3.geo.path()
    .projection(projmap);

var svg = d3.select('#main').append('svg')
    .attr('width', width)
    .attr('height', height);
    // .call(d3.behavior.zoom().on('zoom', redraw));

svg.append('rect')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height)
    .on('click', clicked);

var group = svg.append('g');

d3.json('_data/us.json', function(error, us) {
    var counties = topojson.feature(us, us.objects.counties);
    var states = topojson.feature(us, us.objects.states);

    var countyborders = topojson.mesh(us, us.objects.counties,
        function(a, b) { return a !== b; });
    var stateborders = topojson.mesh(us, us.objects.states,
        function(a, b) { return a.id !== b.id; });

    // group.append('g')
    //     .attr('id','states')
    //     .selectAll('path')
    //     .data(states.features)
    //     .enter().append('path')
    //     .attr('d', path)
    //     .attr('class', 'state')
    //     .attr('id', function(d){ return d.id; })
    //     .on('click', clicked);

    group.append('g')
        .attr('id','counties')
        .selectAll('path')
        .data(counties.features)
        .enter().append('path')
        .attr('d', path)
        .attr('class', 'county')
        .attr('id', function(d){ return d.id; })
        .on('click', clicked);

    group.append('path')
        .datum(countyborders)
        .attr('class','borders')
        .attr('d', path)
        .attr('id', 'county-borders');

    group.append('path')
        .datum(stateborders)
        .attr('class','borders')
        .attr('id', 'state-borders')
        .attr('d', path);
});

function colorize(d) {

}

function clicked(d) {
  var x, y, k;

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
      .classed('active', centered && function(d) { return d === centered; });

  group.transition()
      .duration(750)
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
      .style('stroke-width', 1.5 / k + 'px');
}


// Set up the three.js scene.
function initScene() {
    // set the scene size
    var WIDTH = width,
        HEIGHT = height;

    // set some camera attributes
    var VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 10000;

    // create a WebGL renderer, camera, and a scene
    renderer = new THREE.WebGLRenderer({antialias:true});
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene = new THREE.Scene();

    // add and position the camera at a fixed position
    scene.add(camera);
    camera.position.z = 550;
    camera.position.x = 0;
    camera.position.y = 550;
    camera.lookAt( scene.position );

    // start the renderer, and black background
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearColor(0x000);

    // add the render target to the page
    $('#main').append(renderer.domElement);

    // add a light at a specific position
    var pointLight = new THREE.PointLight(0xFFFFFF);
    scene.add(pointLight);
    pointLight.position.x = 800;
    pointLight.position.y = 800;
    pointLight.position.z = 800;

    // add a base plane on which we'll render our map
    var planeGeo = new THREE.PlaneGeometry(10000, 10000, 10, 10);
    var planeMat = new THREE.MeshLambertMaterial({color: 0x666699});
    var plane = new THREE.Mesh(planeGeo, planeMat);

    // rotate it to correct position
    plane.rotation.x = -Math.PI/2;
    scene.add(plane);
}

function redraw() {
    console.log('redraw scale', d3.event.scale * dscale);
    projmap.scale(d3.event.scale * dscale);
    var xTrans = d3.event.translate[0] + dtrans[0];
    var yTrans = d3.event.translate[1] + dtrans[1];
    console.log('redraw x', xTrans);
    console.log('redraw y', yTrans);
    projmap.translate([xTrans, yTrans]);
    svg.selectAll('path')
        .attr('d', path);
}