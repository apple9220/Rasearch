+ function($) {
    'use strict';
    
    var FILENAME = window.location.href + 'csv/data.csv';
    var myVar = null;

    $('#scrape_csv').on('click', function(evt) {
        $('#start_time').html('');
        $('#end_time').html('');
        evt.preventDefault();
        
        if (checkFile()) {
            var r = confirm('File exist already. Do you want to continue?')

            if (r == true) {
                removeFile();
                $(this).text('Scrapping...');                
                $('#download_csv').hide();
                scrapeCSV();
                startCheckFile();
            } else {
                $('#download_csv').show();
            }
        } else {
            $(this).text('Scrapping...');
            $('#download_csv').hide();
            scrapeCSV();
            startCheckFile();
        }
    });

    function checkFile () {
        var ret = false;

        var data = {
            fileName: 'csv/data.csv'
        }

        $.ajax({
            async: false,
            url: '/checkFile',
            type:'post',
            data: data,
            error: function()
            {
                //file not exists
                ret = true;
            },
            success: function(response)
            {
                //file exists
                var str = JSON.parse(response);
                if (str == "exist") {
                    ret = true;
                } else {
                    ret = false;
                }
            }
        });
        return ret;
    }

    function removeFile () {
        var data = {
            fileName: 'public/csv/data.csv'
        };
        
        $.ajax({
            async: false,
            data: data,
            url: '/removeFile',
            type:'post',
            error: function(e)
            {
                console.log(e);
            },
            success: function(response)
            {             
                console.log(response);
            }
        });
    }
        
    function scrapeCSV() {
        var date = new Date();
        $('#start_time').html("start time:= " + date.getFullYear() + "/" + date.getMonth() + "/" + date.getDay() + "  " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
        $.ajax({
            type: 'post',
            url: '/scrapeCSV',
            data: '',
            dataType: 'json',
            success: function(response) {                
                console.log('Scrapping Started');                
            },
            error: function(error) {
                console.log('Scrapping Start Error Occured');
            }
        })
    }

    function startCheckFile() {
        myVar = setInterval(function(){    
            var isExist = checkFile();
            var date = new Date();
            
            console.log(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "=" + 'checking file...');
            if (isExist) {
                stopCheckFile();                
            }
        }, 60000);
    }

    function stopCheckFile() {
        console.log('clear interval');
        clearInterval(myVar);
        myVar = null;
        $('#scrape_csv').text('Scrape And Export CSV');
        $('#download_csv').show();

        var date = new Date();
        $('#end_time').html("end time:= " + date.getFullYear() + "/" + date.getMonth() + "/" + date.getDay() + "  " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
    }    
}(jQuery);