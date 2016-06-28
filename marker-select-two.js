/**
 * MAP SETTINGS
 * Here you can specify the initial map setting
 *
 * 1. Position: Latitude and Longitude settings
 * 2. Zoom level:  0-22,  (higher number is more zoomed in)*
 */
var settings = {
    mapQuestionType: 'marker-basic', // <-- Edit This: marker-basic, marker-one-select, marker-two-select, polygon-area
    commentFieldLabel: 'Comment', // <-- Edit This: Label above comment field
    position: {
        lat: 55.6773329,  // <-- Edit This: initial long/lat of map
        long: 12.5514528  // <-- EdIt This: initial long/lat of map
    },
    zoomLevel: 15, 		  // <-- EdIt This: initial map zoom level
    testMode: true,       // <-- Change this true to see the output when testing
    offlineMode: true     // <-- Developer mode only; Should always be false when using in LimeSurvey;
}
///////////////////////////////////////////////////////////////////////////////
/////////////////////////// END OF MAP SETTINGS ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////


var SGQA = '{SGQ}';
var imageRoot = '';
if (settings.offlineMode) {
    SGQA = '_map';
    imageRoot = '.';
}
var answerObject = {
};
var answerInput = $('#answer' + SGQA);

//Edit form to be displayed with new marker
//Edit form to be displayed with new marker
var EditForm =
    '<div class="marker-info-win" style="min-width: 500px;">' +
    '<div class="marker-inner-win">' +
    '<div class="wrapper">' +
    '<div class="row">' +
    '<div class="col-md-8">' +
    '<div id="pano-div" style="height:200px;background:yellow"></div>' +
    '</div>' +
    '<div class="col-md-4">' +
    '<form action=" " method="POST" name="SaveMarker" id="SaveMarker" class="">' +
    '<div class="form-group infowindow-wrapper marker-edit">' +
    '<label for="prescategory">Select1 Label: </label>' +
    '<select name="selectOne" id="SelectOne" class="save-selectone form-control">' +
    '<option selected="selected" disabled="true">-- Select --</option>' +
    '<option value="Option1">Option1</option>' +
    '<option value="Option2">Option2</option>' +
    '<option value="Option3">Option3</option>' +
    '</select>' +
    '<label for="selectTwo">Select2 Label: </label>' +
    '<select name="selectTwo" id="selectTwo" class="save-selecttwo form-control">' +
    '<option selected="selected" disabled="true">-- Select --</option>' +
    '<option value="Option1">Option1</option>' +
    '<option value="Option2">Option2</option>' +
    '<option value="Option3">Option3</option>' +
    '</select>' +
    '</div>' +
    '</form>' +
    '</div>' +
    '</div>' +
    '<div class="row" style="margin-top: 20px;">' +
    '<div class="col-md-12">' +
    '<div class="form-group">' +
    '<label for="issue-description">' + settings.commentFieldLabel + '</label>' +
    '<textarea class="form-control save-description" rows="3" name="issue-description"></textarea>' +
    '</div>' +
    '<div class="form-group actions">' +
    '<button type="button" name="save-marker" class="save-marker btn btn-success btn-sm" title="Save info">Save</button>' +
    '<button name="remove-marker" class="remove-marker btn btn-danger btn-sm" title="Delete point" style="margin-left:6px;">Delete point</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';


var timerSet = false;

function setSingleTimer(callback) {
    if (!timerSet) {
        timerSet = true;
        setTimeout(function() {
            callback();
            timerSet = false;
        },20);
    }
}

function getPanorama(element, position, povSetting) {
    if (typeof povSetting === 'undefined') {
        povSetting = {
            heading: 34,
            pitch: 10
        };
    }
    panorama = new google.maps.StreetViewPanorama(element, {
        position: position,
        pov: povSetting
    });
    panorama.addListener('pov_changed', function () {
        pov = panorama.getPov();
    });
    return panorama;
}

$(document).ready(function () {

    var map;
    var drawingManager;
    var markersArray = [];
    var descriptionArray = [];
    var selectedShape;
    var image = imageRoot + '/images/mapping/custompin_small.png';
    var savedMarker = imageRoot + '/images/mapping/custompin_blue.png';

    if (!settings.testMode) {
        answerInput.hide();
    }

    /**
     * Load GoogleMaps library
     */
    (function includeGoogle() {
        if (typeof google === 'undefined') {
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBQLesy7ouvgb_5jsUbrehh0qHgjZkSlmc&libraries=drawing";
            script.type = 'text/javascript';
            script.async = true;
            script.defer = true;
            head.appendChild(script);
        }
    })();

    //functions added to improve the drawing
    function clearSelection() {
        if (selectedShape) {
            selectedShape.setIcon(imageRoot + '/images/mapping/custompin_blue.png');
        }
        selectedShape = null;
    }

    function setSelection(shape) {
        clearSelection();
        selectedShape = shape;
        //shape.setIcon(image);
    }//setSelection

    var bootstrapMarker = function(marker, content)
    {
        marker.markerIndex = markersArray.push(marker) - 1;
        var contentString = $(EditForm);
        if (typeof content !== 'undefined') {
            contentString = content;
        }
        createPanorama(marker, contentString);
        var infowindow = createInfoWindow(marker,  contentString);
        attachMarkerListeners(marker, infowindow);
        attachInfoWindowListeners(marker, infowindow, contentString);

        if (! marker.saved) { //whether info window should be open by default
            infowindow.open(map, marker);
        }

        // turn drawing mode off
        deactivateDraw();
        //disableDraw();


        setSelection(marker);
        map.setOptions({
            streetViewControl: false
        });
        marker.panorama.setVisible(true);
    }

    var createInfoWindow = function (marker, content)
    {
        //Create an infoWindow
        var infowindow = new google.maps.InfoWindow({
            maxWidth: 600,
            position: marker.getPosition()
        });
        infowindow.setContent(content[0]); //this makes sure the infowindow is resized

        return infowindow;
    }
    var attachMarkerListeners = function(marker, infowindow)
    {
        addClickListener(marker, infowindow);
        addDragListener(marker, infowindow);
        addDragEndListener(marker, infowindow);
    }
    var attachInfoWindowListeners = function (marker, infowindow, contentString)
    {
        addCloseClickListener(marker, infowindow);
        addSaveClickListener(marker, infowindow, contentString);
        addRemoveClickListener(marker, infowindow, contentString);
    }
    var createPanorama = function(marker, contentString)
    {
        marker.panoDiv = contentString.find('div#pano-div')[0];
        marker.panorama = getPanorama(marker.panoDiv, marker.getPosition());
        map.setStreetView(marker.panorama);
        map.setOptions({
            streetViewControl: true
        });
    }
    var addRemoveClickListener = function (marker, infowindow, contentString)
    {
        var removeBtn = contentString.find('button.remove-marker')[0];
        google.maps.event.addDomListener(removeBtn, "click", function (event) {
            infowindow.close();
            removeMarker(marker, descriptionArray);
            event.preventDefault();
        });
    }
    var addSaveClickListener = function(marker, infowindow, contentString)
    {
        //Find save button in infoWindow
        var saveBtn = contentString.find('button.save-marker')[0];
        if (typeof saveBtn !== 'undefined') {
            google.maps.event.addDomListener(saveBtn, "click", function (event) {
                var mSelectOne = contentString.find('select.save-selectone')[0].value; //actvity selected
                var mSelectTwo = contentString.find('select.save-selecttwo')[0].value; //actvity selected
                var mDescription = contentString.find('textarea.save-description')[0].value; //description input field value
                descriptionArray.push(mDescription);
                saveMarker(marker, mSelectOne, mSelectTwo, mDescription);
                infowindow.close();
                map.setOptions({
                    streetViewControl: false
                });
                marker.panorama.setVisible(false);
            });
        }

    }
    var addClickListener = function(marker, infowindow)
    {
        google.maps.event.addListener(marker, 'click', function (el) {
            marker.panorama = getPanorama(marker.panoDiv, marker.getPosition(), answerObject[marker.markerIndex].pov);
            marker.panorama.addListener('position_changed', function () {
                marker.setPosition(marker.panorama.getPosition())
            });
            marker.saved = true;
            map.setStreetView(marker.panorama);
            map.setOptions({
                streetViewControl: true
            });
            // panorama.setVisible(false);
            infowindow.open(map, marker); // click on marker opens info window
            setSelection(marker);
        });
    }
    var addCloseClickListener = function(marker, infowindow)
    {
        google.maps.event.addListener(infowindow,'closeclick',function(){
            if (!marker.saved) {
                marker.setMap(null); //removes the polygon
            }

            map.setOptions({
                streetViewControl: false
            });
            marker.panorama.setVisible(false);
        });


        google.maps.event.addListener(marker,'closeclick',function(){
            if (!polygon.saved) {
                polygon.setMap(null); //removes the polygon
            }
        });
    }
    var addDragListener = function(marker)
    {
        google.maps.event.addListener(marker, "drag", function () {
            setSingleTimer(function() {
                marker.panorama = getPanorama(marker.panoDiv, marker.getPosition());
                map.setStreetView(marker.panorama);
            });
        });
    }
    var addDragEndListener = function(marker, infowindow)
    {
        // Handle the drag end case for the marker, which becomes unselected
        google.maps.event.addListener(marker, "dragend", function () {
            setSelection(marker);
            marker.panorama = getPanorama(marker.panoDiv, marker.getPosition());
            map.setStreetView(marker.panorama);
        });
    }

    $("#cursor-button").click(function(e) {
        e.preventDefault();
        deactivateDraw();
    });

    $("#draw-button").click(function(e) {
        e.preventDefault();
        activateDraw();
    });

    var activateDraw = function()
    {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.MARKER);
        $('#draw-button').removeClass('btn-success');
        $('#draw-button').addClass('btn-default');
        $('#cursor-button').removeClass('btn-default');
        $('#cursor-button').addClass('btn-success');
    }

    var deactivateDraw = function()
    {
        drawingManager.setDrawingMode(null);
        $('#draw-button').removeClass('btn-default');
        $('#draw-button').addClass('btn-success');
        $('#cursor-button').removeClass('btn-success');
        $('#cursor-button').addClass('btn-default');
    }

    /**
     * Initialize the Map
     */
    function initialize() {
        // wait until GoogleMaps library is loaded
        if (typeof google === 'undefined') {
            setTimeout(function () {
                console.log('loading map...');
                return initialize();
            }, 10);
            return;
        }

        // Create the Map Instance
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: settings.zoomLevel,
            center: new google.maps.LatLng(settings.position.lat, settings.position.long),
            streetViewControl: false,
            mapTypeControl: true,
            mapTypeControlOptions: {
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            panControl: false,
            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.SMALL,
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            scaleControl: true
        });

        // Create the Drawing Manager Instance
        drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: false,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_LEFT,
                drawingModes: [google.maps.drawing.OverlayType.MARKER]
            },
            map: map,
            markerOptions: {
                icon: image
            }
        });
        drawingManager.setMap(map);

        //########  When marker is created in map  ########
        google.maps.event.addListener(drawingManager, 'markercomplete', function (marker) {
            marker.setDraggable(true);
            marker.setIcon(image);
            marker.setTitle('New Point');
            bootstrapMarker(marker);
        });

        // Reload any saved markers on page load
        var loadMarkers = function(markers)
        {
            var numMarkers = Object.keys(markers).length;
            for (var i=0; i<numMarkers; i++) {
                var coordinates = markers[i].latlong.split(',');
                var myLatlng = {
                    lat: Number(coordinates[0]),
                    lng: Number(coordinates[1])
                };
                var marker = new google.maps.Marker({
                    position: myLatlng,
                    title:"New Point",
                    icon: savedMarker
                });
                marker.setMap(map);
                marker.saved = true;
                marker.setDraggable(true);
                var contentString = $(EditForm);
                contentString.find('textarea.save-description')[0].value = markers[i].description;
                descriptionArray.push(marker.description);
                bootstrapMarker(marker, contentString);

                // allow drawing mode
                //drawingManager.setOptions({
                //    drawingControl: true
                //});
                //enableDraw();
            }



        }

        var fieldData = answerInput.val();
        if (typeof fieldData !== 'undefined' && fieldData !== '' && fieldData.length !== 2) {
            console.log('load it');
            answerObject = JSON.parse(fieldData);
            loadMarkers(JSON.parse(fieldData))
        }
    }

    //############### Remove Marker Function ##############
    function removeMarker(marker, descriptionArray) {
        delete answerObject[marker.markerIndex];
        answerInput.val(JSON.stringify(answerObject, null, 4));
        marker.setMap(null);
    }

    //############### Save Marker Function ##############
    function saveMarker(marker, mSelectOne, mSelectTwo, mDescription) {
        //Save new marker using jQuery Ajax
        var mlatlong = marker.getPosition().toUrlValue(); //get marker position
        var mzoom = map.getZoom();
        var myData = {
            mindex: marker.markerIndex,
            latlong: mlatlong,
            zoom: mzoom,
            pano: marker.panorama.getPano(),
            pov: marker.panorama.getPov(),
            selectOne: mSelectOne,
            selectTwo: mSelectTwo,
            description: mDescription
        };
        marker.setDraggable(false); //set marker to fixed
        marker.setIcon(imageRoot + '/images/mapping/custompin_blue.png');
        answerObject[myData.mindex] = myData;
        answerInput.val(JSON.stringify(answerObject, null, 4));
    }

    initialize();



});
