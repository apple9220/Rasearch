+ function($) {
    'use strict';

    var SAVEDPAYLOAD = {};
    var READCNT = 0;
    var CORURLS = [];
    var SCRAPPING_STARTED = false;
    var ERRORURLS = [];
    
    $('#scrape_csv').on('click', function(evt) {        
        $.ajax({
            type: 'post',
            url: '/scrapeCSV',
            data: '',
            dataType: 'json',
            success: function(response) {
                console.log('success');
            },
            error: function(error) {
                console.log('error');
            }
        })
    })
}(jQuery);