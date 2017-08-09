+ function($) {
    'use strict';

    $('#scrape_csv').click(function(evt) {

        // disable scrapping
        $('#scrape_csv').attr('disabled', 'disabled');

        // show alert
        $('#alert').show();

        evt.preventDefault();
        var data = { pageCnt: $('#page_cnt').val() };
        $.ajax({
            type: "POST",
            url: '/scrapeCSV',
            data: data,
            dataType: 'json',
            success: function(response) {
                // enable scrapping
                $('#scrape_csv').removeAttr('disabled');

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