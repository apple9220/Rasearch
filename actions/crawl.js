const fs = require('fs')
const Promise = require('bluebird')
const superagent = require('superagent')
const cheerio = require('cheerio')
const json2csv = require('json2csv')


const CONCURRENCY = 20
const DELAY = 0
const MAX_PAGES = Infinity
const SELECTORS = {
    entriesLinks: '.entryform .TDColorC td:nth-child(1) > a',
    paginationLinks: '.entryform td[colspan="4"] > a',
    currentPage: '.entryform td[colspan="4"] > span',
}

const request = superagent.agent()

/**
 * This function takes url as the first argument and returns corp urls from it.
 * @example
 * crawlUrls('https://nvsos.gov/sosentitysearch/RACorps.aspx?fsnain=OQ%252fy6HT6QrwXv%252fzlehtQZw%253d%253d&RAName=INCORP+SERVICES%2c+INC.')
 *   .then((urls) => {
 *     // urls is an array of corp info urls
 *   })
 * @param  {string} url        for example: https://nvsos.gov/sosentitysearch/RACorps.aspx?fsnain=OQ%252fy6HT6QrwXv%252fzlehtQZw%253d%253d&RAName=INCORP+SERVICES%2c+INC.
 * @param  {number} pagesLimit maximum number of pages to follow
 * @return {Promise<string[]>} Promise that resolves to corp urls
 */
async function crawlUrls(url, pagesLimit = MAX_PAGES) {
    let cnt = 0
    let urls = []
    let payload = {}

    while (payload && cnt < pagesLimit) {
        cnt++

        // In case there will be rate limiting on the server
        await Promise.delay(DELAY)

        const { text } = await request
            .post(url)
            .type('form')
            .send(payload)

        const $ = cheerio.load(text)
        const entries = $(SELECTORS.entriesLinks)
            .toArray()
            .map((i) => $(i).attr('href'))

        if (entries && entries.length) {
            urls.push(...entries)
        }

        const paginationLinks = $(SELECTORS.paginationLinks)
            .toArray()
            .map((i) => ({
                text: $(i).text().trim(),
                href: $(i).attr('href')
            }))

        const currentPageNode = $(SELECTORS.currentPage)
        const currentPage = Number(currentPageNode.text().trim())

        console.log('Current page: %s', currentPage)

        const nextPageNode = currentPageNode.next()
        const nextPage = nextPageNode && nextPageNode.text().trim()
        const nextPageHref = nextPageNode && nextPageNode.attr('href')

        if (nextPage && nextPageHref) {
            payload = $('input')
                .toArray()
                .reduce((acc, i) => {
                    const name = $(i).attr('name')
                    const value = $(i).attr('value')

                    acc[name] = value
                    return acc
                }, {})

            const [all, target] = nextPageHref.match(/__doPostBack\('(.+?)'/) || []
            payload.__EVENTTARGET = target
        } else {
            // Stop from future execution
            payload = null
        }
    }

    return urls.map(url => `https://nvsos.gov/sosentitysearch/${url}`)
}

// Refactor String Function
function refactorString(str) {
    var ret = str || ''
    ret = ret.replace(/&#xA0;/g, "");
    ret = ret.replace(/&quot;/g, '"');
    ret = ret.replace(/&apos;/g, "'");
    return ret;
}

/**
 * This function takes an url to corp info page (like https://nvsos.gov/sosentitysearch/CorpDetails.aspx?lx8nvq=LvpXbUZaqy4GnRbbo7osYw%253d%253d&nt7=0)
 * and returns object with data for csv
 * @param  {string} url 
 * @return {Promise<object>}
 */
async function crawlInfo(url) {
    const { text } = await request.get(url)

    // Parsing logic from ./apple.js
    var obj = {}
    var $ = cheerio.load(text);
    var business = '';
    var agent = '';
    var officers = '';
    var cnt = 0;
    $('.entrybox').each(function(index) {
        cnt++;
    });

    if (cnt == 6) {
        $('.entrybox').each(function(index) {
            switch (index) {
                case 0:
                    business = $(this).html();
                    break;
                case 2:
                    agent = $(this).html();
                    break;
                case 4:
                    officers = $(this).html();
                    break;
                default:
                    break;
            }
        });
    } else if (cnt == 5) {
        $('.entrybox').each(function(index) {
            switch (index) {
                case 0:
                    business = $(this).html();
                    break;
                case 1:
                    agent = $(this).html();
                    break;
                case 3:
                    officers = $(this).html();
                    break;
                default:
                    break;
            }
        });
    }

    // Entity Name
    var entityName = $('.SOSContent tbody tr td div table tbody tr:nth-child(2) td center h2 span').html();

    // Agent Data
    $ = cheerio.load('<html><body><table>' + agent + '</table></body></html>');

    var agentName = $('tbody tr:nth-child(2) td table tbody tr:nth-child(1) td:nth-child(2)').html();
    var agentAddress = $('tbody tr:nth-child(2) td table tbody tr:nth-child(1) td:nth-child(4)').html();

    // Business Data
    $ = cheerio.load('<html><body><table>' + business + '</table></body></html>');

    var nvBusinessID = $('tbody tr:nth-child(2) td table tbody tr:nth-child(5) td:nth-child(2)').html();
    var status = $('tbody tr:nth-child(2) td table tbody tr:nth-child(1) td:nth-child(2)').html();
    var type = $('tbody tr:nth-child(2) td table tbody tr:nth-child(2) td:nth-child(2)').html();
    var fileDate = $('tbody tr:nth-child(2) td table tbody tr:nth-child(1) td:nth-child(4)').html();
    var officersDue = $('tbody tr:nth-child(2) td table tbody tr:nth-child(3) td:nth-child(4)').html();
    var expirationDate = $('tbody tr:nth-child(2) td table tbody tr:nth-child(4) td:nth-child(4)').html();
    var licenseExpiration = $('tbody tr:nth-child(2) td table tbody tr:nth-child(5) td:nth-child(4)').html();

    // Officers Data
    $ = cheerio.load('<html><body><table>' + officers + '</table></body></html>');

    var num = 1;
    var officersArr = [];
    var officer = {};

    $('tbody tr:nth-child(2) td table tbody tr').each(function(ii) {
        if (ii % 6 == 0) {
            var temp = $('tbody tr:nth-child(2) td table tbody tr:nth-child(' + (ii + 1) + ') td').html();
            officer['title'] = temp.split('-')[0];
            officer['name'] = temp.split('-')[1];
        } else if (ii % 6 == 1) {
            var temp = $('tbody tr:nth-child(2) td table tbody tr:nth-child(' + (ii + 1) + ') td:nth-child(2)').html();
            officer['address'] = temp;
        } else if (ii % 6 == 5) {
            officersArr.push(officer);
            officer = {};
        }
    });

    obj['Registered Agent Name'] = refactorString(agentName);
    obj['Registered Agent Address'] = refactorString(agentAddress);
    obj['Entity Name'] = refactorString(entityName);
    obj['NV Business ID'] = refactorString(nvBusinessID);
    obj['Status'] = refactorString(status);
    obj['Type'] = refactorString(type);
    obj['File Date'] = refactorString(fileDate);
    obj['List of Officers Due'] = refactorString(officersDue);
    obj['Expiration Date'] = refactorString(expirationDate);
    obj['Business License Expiration'] = refactorString(licenseExpiration);

    for (var i = 0; i < officersArr.length; i++) {
        var element = officersArr[i];
        obj['Officer ' + (i + 1) + ' Name'] = refactorString(element['name']);
        obj['Officer ' + (i + 1) + ' Title'] = refactorString(element['title']);
        obj['Officer ' + (i + 1) + ' Address'] = refactorString(element['address']);
    }
    obj['Direct URL'] = url;

    return obj
}

const FIELDS = [
    'Registered Agent Name',
    'Registered Agent Address',
    'Entity Name',
    'NV Business ID',
    'Status',
    'Type',
    'File Date',
    'List of Officers Due',
    'Expiration Date',
    'Business License Expiration',
    'Officer 1 Title',
    'Officer 1 Name',
    'Officer 1 Address',
    'Officer 2 Title',
    'Officer 2 Name',
    'Officer 2 Address',
    'Officer 3 Title',
    'Officer 3 Name',
    'Officer 3 Address',
    'Officer 4 Title',
    'Officer 4 Name',
    'Officer 4 Address',
    'Officer 5 Title',
    'Officer 5 Name',
    'Officer 5 Address',
    'Officer 6 Title',
    'Officer 6 Name',
    'Officer 6 Address',
    'Officer 7 Title',
    'Officer 7 Name',
    'Officer 7 Address',
    'Officer 8 Title',
    'Officer 8 Name',
    'Officer 8 Address',
    'Officer 9 Title',
    'Officer 9 Name',
    'Officer 9 Address',
    'Officer 10 Title',
    'Officer 10 Name',
    'Officer 10 Address',
    'Direct URL',
]
async function crawlAndSaveToCSV(url, filepath, pagesLimit) {
    const urls = await crawlUrls(url, pagesLimit)

    console.log('Urls fetched: %s', urls.length)
    console.log('Getting Info Started')

    const items = await Promise.map(urls, async(url) => {
        await Promise.delay(DELAY)
        try {
            return await crawlInfo(url)
        } catch (error) {
            console.log('Error crawling info for %s', url)
            console.log(error)
            return null
        }
    }, {
        concurrency: CONCURRENCY,
    })

    console.log('Getting Info Ended')

    const csv = json2csv({
        data: items.filter(i => !!i),
        fields: FIELDS,
    })

    console.log('File Writing Started to: %s', filepath)

    await Promise.fromCallback((cb) => fs.writeFile(filepath, csv, cb))

    console.log('File written to: %s', filepath)
}

// // This just for testing:
// crawlAndSaveToCSV(
//   'https://nvsos.gov/sosentitysearch/RACorps.aspx?fsnain=OQ%252fy6HT6QrwXv%252fzlehtQZw%253d%253d&RAName=INCORP+SERVICES%2c+INC.',
//   'test.csv',
//   100
// ).then(() => {
//   console.log('SUCCESS')
// }).catch((error) => {
//   console.log('ERROR', error)
// })

exports.crawlUrls = crawlUrls
exports.crawlInfo = crawlInfo
exports.crawlAndSaveToCSV = crawlAndSaveToCSV