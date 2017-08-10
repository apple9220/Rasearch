+ function($) {
    'use strict';

    $('#scrape_csv').click(function(evt) {

        // disable scrapping
        $('#scrape_csv').attr('disabled', 'disabled');

        // hide download
        $('#download_csv').hide();

        // show alert
        $('#alert').show();

        evt.preventDefault();
        var data = { id : 3};
        $.ajax({
            type: "POST",
            url: '/scrapeCSV',
            data: data,
            aysnc: false,
            dataType: 'json',
            success: function(response) {
                // enable scrapping
                $('#scrape_csv').removeAttr('disabled');

                // show download
                $('#download_csv').show();

                // show alert
                $('#alert').hide();

                alert(response);
            },
            error: function(xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
            }
        })
    });
}(jQuery);