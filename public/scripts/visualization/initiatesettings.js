//****************** Set default values ******************//
let RGBA = {'r': 255, 'g': 0, 'b': 0, 'a': 1}

let settingHelpMap = {
    'Visualizations' : 'Select the visualizations/viewports to display',
    'Image' : 'Select the image to display',
    'Users' : 'Select the users to display',
    'Color' : 'Modify the color of the fixations on the Attention Map',
    'Editor' : 'Instructs the navigation commands for the AOI editor',
    'Zoom' : 'Modify the zoom level of the thumbnails in the Gaze Stripes'
}

//- Initialize State of RGBA sliders -//
for ([x, y] of Object.entries(RGBA)) {
    readSlidersRGBA(x, y);
}

let defaultZoomValue = 50;

//****************** Define Settings Functions ******************//


function settingHelp(setting) {
    $('.toast')
        .toast('close')
        $('body')
            .toast({
                showIcon: 'info',
                title: setting + ' setting',
                displayTime: 0,
                message: settingHelpMap[setting],
                class: 'info',
                position: 'top center',
                closeIcon: true
        });
    }


//- Auto Apply Behavior -//
function settingChanged() {
    if ($('input#auto_apply[type="checkbox"]').is(":checked")) {
        applySettings()
    };
};

//****************** Set Element Behaviors/States ******************//

//- Detect checkbox update -//
$('input.settings')
    .click(function() {
        checkboxChanged(this.id);
        settingChanged();
    });    

//- Image Dropdown -//
$('.dropdown.search.selection.image')
    .dropdown({
        fullTextSearch: 'exact', 
        match: 'both',
        onChange: function(value,text) {
            selectImage(text);
            settingChanged();
        }
    });

//- Image Preview on Dropdown -//
$('.image-selector')
    .on('mouseenter', function(evt){
        $('.preview').show();
        $('.inner-frame').hide();
        $('#preview-image').attr("src", "/testdataset/images/" + this.innerHTML);
        $(this).on('mouseleave', function(){
            $('.preview').hide();
            $('.inner-frame').show();
        });
    });

//- User Dropdown -//
$('.dropdown.search.selection.user')
    .dropdown({
        fullTextSearch: 'exact',
        onAdd: function(addedValue, addedText) {
            usersAdd(addedText);
            settingChanged();
        },
        onRemove: function(removedValue, removedText) {
            usersRemove(removedText);
            settingChanged();
        }
    });

//- Clear User Dropdown Button -//
$('.clear.button')
    .on('click', function() {
        $('.dropdown.search.selection.user')
            .dropdown('clear');
        settingChanged();
    });

//- Select All User Dropdown Button -//
$('.add.button')
    .on('click', function() {
        enableAllUsers()
        settingChanged();
    });

//- RGB Slider initialization -//
$('.ui.slider.rgb')
    .each(function() {
        $('#'+this.id).slider({
            min: 0,
            max: 255,
            start: RGBA[this.id],
            step: 1,
            onChange: function(value) {
                readSlidersRGBA(this.id, value)
                settingChanged()
            }
        });
    });

//- Alpha Slider initialization -//
$('.alpha.ui.slider')
    .slider({
        min: 0.1,
        max: 1,
        start: RGBA['a'],
        step: 0.01,
        onChange: function(value) {
            readSlidersRGBA(this.id, value)
            settingChanged()
        }
    });

//- Zoom Level Slider -//
$('.zoom-preview').text(defaultZoomValue);
$('.ui.slider.zoom')
    .slider({
        min: 25,
        max: 200,
        start: defaultZoomValue,
        step: 1,
        onChange: function(value) {
            readSlidersZoom(value)
            settingChanged()
        }
    });