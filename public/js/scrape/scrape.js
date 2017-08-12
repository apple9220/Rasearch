+ function($) {
    'use strict';
    
    var SAVEDPAYLOAD = {};
    var READCNT = 0;
    var CORURLS = [];
    var SCRAPPING_STARTED = false;
    var ERRORURLS = [];
    
    $('#get_infos').on('click', function(evt) {        
        var temp = [];

        for (var i = 0; i < CORURLS.length; i++) {
            var urls = CORURLS[i];
            
            for (var j = 0; j < urls.length; j++) {
                temp.push(urls[j]);
            }
        }

        CORURLS = temp;

        console.log('URL Fetched:= ' + CORURLS.length);

        for (var i = 0; i < CORURLS.length; i++) {
            var data = {
                url: CORURLS[i]
            };

            $.ajax({
                async: false,
                type: "POST",
                url: '/getInfos',
                data: data,
                dataType: 'json',
                success: function(response) {                    
                    console.log('url:=' + i);                    
                    if (response == "error") {
                        console.log('error url:= ' +CORURLS[i]);
                        ERRORURLS.push(CORURLS[i]);
                    }                    
                    if (i == CORURLS.length - 1) {   
                        console.log('ErrorURL Length:= ' + ERRORURLS.length);                     
                        reCallErrorURLS();
                    }        
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    alert(xhr.status);
                    alert(thrownError);
                }
            });

            sleep(100);
        }   
    });

    function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds){
                break;
            }
        }
    }

    function reCallErrorURLS () {
        if (ERRORURLS.length <= 0) {
            exportCSV();
        }

        for(var i = 0; i < ERRORURLS.length; i++) {
            var data = {
                url: ERRORURLS[i]
            };

            $.ajax({
                async: false,
                type: "POST",
                url: '/getInfos',
                data: data,
                dataType: 'json',
                success: function(response) {        
                    console.log('recall error url:= ' + i + ':=' + ERRORURLS[i]);
                    if (i == ERRORURLS.length - 1) {
                        exportError();                        
                    }        
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    alert(xhr.status);
                    alert(thrownError);
                }
            });
        }
    }

    function exportError () {
        var data = {
            data: ERRORURLS
        };

        $.ajax({
            async: false,
            type: "POST",
            url: '/exportError',
            data: data,
            aysnc: false,
            dataType: 'json',
            success: function(response) {
                exportCSV();
            },
            error: function(xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
            }
        }); 
    }

    function exportCSV() {
        var data = {
            data: ''
        };

        $.ajax({
            async: false,
            type: "POST",
            url: '/exportCSV',
            data: data,
            aysnc: false,
            dataType: 'json',
            success: function(response) {
                alert(response);
                SCRAPPING_STARTED = false;

                $('#scrape_csv').text('Scrape And Export CSV');
            },
            error: function(xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
            }
        });        
    }

    $('#scrape_csv').on('click', function(evt) {
        if (SCRAPPING_STARTED == false)  {
            
            SCRAPPING_STARTED = true;            
            SAVEDPAYLOAD = {};
            READCNT = 0;
            CORURLS = [];

            ERRORURLS = [];

            $('#scrape_csv').text('Scrapping...');
        }        

        evt.preventDefault();

        var data = { 
            savedPayload: SAVEDPAYLOAD,
            readCnt: READCNT
        };

        $.ajax({
            type: "POST",
            url: '/scrapeURLS',
            data: data,
            dataType: 'json',
            success: function(response) {
                var urls = response.urls;
                var readCnt = response.readCnt;
                var savedPayload = response.payload;
                                         
                CORURLS.push(urls);                           

                SAVEDPAYLOAD = savedPayload;
                READCNT = readCnt;                

                console.log('readCnt:= ' + READCNT);
                
                if (savedPayload != undefined && savedPayload != null && savedPayload != '') {                    
                    reCallFunc();
                } else {                    
                    $('#get_infos').trigger('click');
                }
            },
            error: function(xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
            }
        })

        function reCallFunc() {
            $('#scrape_csv').trigger('click');
        }
    });
}(jQuery);