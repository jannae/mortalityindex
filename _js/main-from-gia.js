var metaJson = {"d": {"bingeDrinking": {"label": "", "natMax": 0.361, "natAvg": 0.11292484076433118, "natMin": 0.0}, "noExercise": {"label": "", "natMax": 0.491, "natAvg": 0.20594171974522313, "natMin": 0.0}, "excessDrinking": {"label": "", "natMax": 0.368, "natAvg": 0.1209391719745221, "natMin": 0.0}, "phyisicianUseDelay": {"label": "", "natMax": 0.335, "natAvg": 0.11751464968152878, "natMin": 0.0}, "poorHealth": {"label": "", "natMax": 0.428, "natAvg": 0.1506614649681531, "natMin": 0.0}, "smoking": {"label": "", "natMax": 0.478, "natAvg": 0.16529777070063698, "natMin": 0.0}, "obesity": {"label": "", "natMax": 0.486, "natAvg": 0.22008630573248317, "natMin": 0.0}}, "allAvgsMax": 0.15989961783439494, "timeFrame": "2005-2011", "allAvgsMin": -0.15729777070063697, "totResults": 3140, "dimension": "Total"};

var mapWidth = 0,
    mapHeight = 0,
    mapOrigWidth = undefined,
    usMap = undefined,
    counties = undefined,
    mapProjection = undefined,
    multiplier = 1,
    centered;

var initMap = function() {
    setDimensions();
    censusMap = d3.select("#map-main").append("svg")
        .attr('id', 'map-main-svg')
        .attr("width", mapWidth)
        .attr("height", mapHeight)
        .append('g')

    $.getScript("_data/brfss.js", initBrfss)
}

var preInit = function() {
    var topNav = document.getElementById('topNav').offsetHeight;
    var tempWidth = $('#map-container').width();

    var tempMultiplier = 0;

    if (tempWidth < 1200) {
        tempMultiplier = 3 / 4
    } else {
        tempMultiplier = 9 / 16
    }

    var tempHeight = tempWidth * tempMultiplier;

    $('#map-main').css('height', tempHeight);
    makeNav();

}

var makeNav = function() {
    var items = [];
    $.each( metaJson.d, function( key ) {
        items.push( '<li><a href="#' + key + '">' + key + '</a></li>');
    });
    $("#navMenuLeft").append(items.join( "" ));
}

var initBrfss = function() {

    // setResizer();
    // generateAgeChart()
    drawMap();
    // $('#map-main').css('height', 'auto')
    // $('.ak-map-btn').click(function() {

    //     $('.ak-map-btn').removeClass('gia-tabbed-button-selected')
    //     $(this).addClass('gia-tabbed-button-selected')

    //     mapType = $(this).attr('id')
    //     paintAlaska()
    // })
}

var setDimensions = function() {

    mapWidth = $(window).width();

    if (mapWidth < 1200) {
        multiplier = 3 / 4
    } else {
        multiplier = 9 / 16
    }
    mapHeightAdjuster = -mapWidth + 100
    mapWidthAdjuster = mapWidth - 100
    // if(mapWidth >700 && mapWidth < 940){
    //      mapWidth = 940;
    //  } else if(mapWidth < 700){
    //      mapWidth = $(window).width() - 40;
    //      mapHeightAdjuster = -60
    //  } else if (mapWidth >= 940 && mapWidth < 1200){
    //      multiplier = .65
    //      mapHeightAdjuster = -900;
    //      console.log('here')
    //  }  else {
    //      multiplier = .6
    //      mapHeightAdjuster = -1300;
    //
    //  }
    //
    //  if( mapWidth > 940){
    //
    //  }


    mapHeight = mapWidth * multiplier;

    if (mapOrigWidth == undefined) {
        mapOrigWidth = mapWidth;
    }
}

var setResizer = function() {
    $(window).resize(function() {
        setDimensions();
        d3.select("#map-main-svg").attr("width", mapWidth)
            .attr("height", mapHeight);
        censusMap.attr("transform", 'scale(' + mapWidth / mapOrigWidth + ')')
    });
}

var drawMap = function() {
    $.getJSON( "_data/us.json", function( data ) {



    });
}

preInit();

jQuery(document).ready(function() {
    initMap();
})