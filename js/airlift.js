/*jshint nocomma: true, nonew: true, plusplus: true, strict: true, browser: true, devel: true, jquery: true*/

Date.prototype.diff = function(date) {	
    'use strict';
    var diff = this - date;
    return {
        years: Math.floor(diff / 31536000000),
        months: Math.floor(diff / 2628000000),
        weeks: Math.floor(diff / 604800000), 
        days: Math.floor(diff / 86400000), 
        hours: Math.floor(diff / 3600000), 
        minutes: Math.floor(diff / 60000), 
        seconds: Math.floor(diff / 1000)
    };
};

Number.prototype.time = function() {	
    'use strict';
    var hours = Math.floor(this / 60),
        minutes = this % 60;
    return {
        hours: hours,
        minutes: minutes,
        text: hours + ':' + (minutes < 10 ? '0' : '') + minutes
    };
};

Number.prototype.toTimeString = function() {	
    'use strict';
    var time = this.time();
    return time.hours + ':' + (time.minutes < 10 ? '0' : '') + time.minutes;
};

function RestAPI (url) {
    'use strict';
    var my = this,  // Public scope
        priv = {};  // Private scope
    
    priv.headers = {};
    priv.url = url || '/api';
    
    this.setUrl = function (url) {
        priv.url = url;
    };
    
    this.setHeaders = function (headers) {
        priv.headers = headers;
    };
    
    this.setHeader = function (key, value) {
        priv.headers[key] = value;
    };
    
    this.get = function (url, success) {
        return $.ajax({
            type: 'GET',
            url: priv.url + url,
            success: success,
            headers: priv.headers,
            contentType: 'application/json; charset=UTF-8',
            dataType: 'json'
        });
    };
    
    this.post = function (url, data, success) {
        return $.ajax({
            type: 'POST',
            url: priv.url + url,
            data: data,
            success: success,
            headers: priv.headers,
            contentType: 'application/json; charset=UTF-8',
            dataType: 'json'
        });
    };
    
    this.put = function (url, data, success) {
        return $.ajax({
            type: 'PUT',
            url: priv.url + url,
            data: data,
            success: success,
            headers: priv.headers,
            contentType: 'application/json; charset=UTF-8',
            dataType: 'json'
        });
    };
    
    this.delete = function (url, success) {
        return $.ajax({
            type: 'DELETE',
            url: priv.url + url,
            success: success,
            headers: priv.headers,
            contentType: 'application/json; charset=UTF-8',
            dataType: 'json'
        });
    };
}

function Airlift () {
    'use strict';
    var my = this,  // Public scope
        priv = {},  // Private scope
        Rest = new RestAPI('https://airlift.oxiame.eu');
    
    priv.session = {};
    priv.flights = [];
    priv.aircrafts = { models: [], registration: [] };
    
    priv.total = {
        time: {
            single: { se: 0, me: 0 },
            multi: { multi: 0, turbine: 0 }
        },
        grandTotal: 0,
        landings: { day: 0, night: 0 },
        conditions: { night: 0, ifr: 0 },
        function: { pic: 0, copilot: 0, dual: 0, instructor: 0 },
        synthetic: 0
    };
    priv.total12months = {
        time: {
            single: { se: 0, me: 0 },
            multi: { multi: 0, turbine: 0 }
        },
        grandTotal: 0,
        landings: { day: 0, night: 0 },
        conditions: { night: 0, ifr: 0 },
        function: { pic: 0, copilot: 0, dual: 0, instructor: 0 },
        synthetic: 0
    };
    
    my.options = {
        show: {
            date: true,
            departure: { place: true, time: true },
            arrival: { place: true, time: true },
            aircraft: { model: true, registration: true},
            time: {
                single: { se: true, me: true },
                multi: { multi: true, turbine: true },
            },
            total: true,
            pic: true,
            landings: { day: true, night: true },
            conditions: { night: true, ifr: true },
            function: { pic: true, copilot: true, dual: true, instructor: true },
            synthetic: { date: true, type: true, time: true },
            remark: true
        }
    };
    
    this.login = function (username, password) {
        Rest.post('/user/login', null, function(data) {
            if (data.session.store !== undefined) {
                priv.session = data.session.store;
            }
            if (data.session.token !== undefined) {
                Rest.setHeader('X-Airlift-Token', data.session.token);
            }
        });
    };
    
    this.userInfo = function () {
        Rest.get('/user', function(data) {
            if (data.user !== undefined) {
                if (data.user.name) {
                    $('#user-name').text(data.user.name);
                }
                if (data.user.avatar !== undefined) {
                    $('#user-avatar').attr('src', 'img/' +  data.user.avatar);
                }
                if (data.user.show !== undefined) {
                    my.options.show = data.user.show;
                }
            }
        });
    };
    
    this.flightTime = function (time) {
        if (time !== null && time > 0) {
            return time.toTimeString();
        } else {
            return null;
        }
    };
    
    this.validateFlight = function (flt) {
        var flight = flt || {};
        flight = {
            date: flight.date || null,
            departure: flight.departure || {},
            arrival: flight.arrival || {},
            aircraft: flight.aircraft || {},
            time: flight.time || {},
            pic: flight.pic || null,
            landings: flight.landings || {},
            conditions: flight.conditions || {},
            function: flight.function || {},
            synthetic: flight.synthetic || {},
            remark: flight.remark || null
        };
        flight.time = {
            single: flight.time.single || {},
            multi: flight.time.multi || {}
        };
        
        return {
            date: new Date(flight.date),
            departure: {
                place: flight.departure.place || null,
                time: flight.departure.time || null
            },
            arrival: {
                place: flight.arrival.place || null,
                time: flight.arrival.time || null,
            },
            aircraft: {
                model: flight.aircraft.model || null,
                registration: flight.aircraft.registration || null
            },
            time: {
                single: {
                    se: flight.time.single.se || null,
                    me: flight.time.single.me || null
                },
                multi: {
                    multi: flight.time.multi.multi || 0,
                    turbine: flight.time.multi.turbine || 0
                }
            },
            total: (flight.time.single.se || 0) + (flight.time.single.me || 0) + (flight.time.multi.multi || 0) + (flight.time.multi.turbine || 0),
            pic: flight.pic || null,
            landings: {
                day: flight.landings.day || 0,
                night: flight.landings.night || 0
            },
            conditions: {
                night: flight.conditions.night || null,
                ifr: flight.conditions.ifr || null
            },
            function: {
                pic: flight.function.pic || 0,
                copilot: flight.function.copilot || 0,
                dual: flight.function.dual || 0,
                instructor: flight.function.instructor || 0
            },
            synthetic: {
                date: new Date(flight.synthetic.date || null),
                type: flight.synthetic.type || null,
                time: flight.synthetic.time || 0
            },
            remark: flight.remark || null
        };
    };
    
    this.addToTotals = function (flight) {
        priv.total.time.single.se += flight.time.single.se;
        priv.total.time.single.me += flight.time.single.me;
        priv.total.time.multi.multi += flight.time.multi.multi;
        priv.total.time.multi.turbine += flight.time.multi.turbine;
        priv.total.grandTotal += flight.total;
        priv.total.landings.day += flight.landings.day;
        priv.total.landings.night += flight.landings.night;
        priv.total.conditions.night += flight.conditions.night;
        priv.total.conditions.ifr += flight.conditions.ifr;
        priv.total.function.pic += flight.function.pic;
        priv.total.function.copilot += flight.function.copilot;
        priv.total.function.dual += flight.function.dual;
        priv.total.function.instructor += flight.function.instructor;
        priv.total.synthetic += flight.synthetic.time;
        
        if ((new Date()).diff(flight.date).years < 1) {
            priv.total12months.time.single.se += flight.time.single.se;
            priv.total12months.time.single.me += flight.time.single.me;
            priv.total12months.time.multi.multi += flight.time.multi.multi;
            priv.total12months.time.multi.turbine += flight.time.multi.turbine;
            priv.total12months.grandTotal += flight.total;
            priv.total12months.landings.day += flight.landings.day;
            priv.total12months.landings.night += flight.landings.night;
            priv.total12months.conditions.night += flight.conditions.night;
            priv.total12months.conditions.ifr += flight.conditions.ifr;
            priv.total12months.function.pic += flight.function.pic;
            priv.total12months.function.copilot += flight.function.copilot;
            priv.total12months.function.dual += flight.function.dual;
            priv.total12months.function.instructor += flight.function.instructor;
            priv.total12months.synthetic += flight.synthetic.time;
        }
        
        if (priv.aircrafts.models[flight.aircraft.model] === undefined) {
            priv.aircrafts.models[flight.aircraft.model] = 0;
        }
        if (priv.aircrafts.registration[flight.aircraft.registration] === undefined) {
            priv.aircrafts.registration[flight.aircraft.registration] = 0;
        }
        priv.aircrafts.models[flight.aircraft.model] += flight.total;
        priv.aircrafts.registration[flight.aircraft.registration] += flight.total;
    };
    
    this.addFlight = function (flt) {
        var flight = my.validateFlight(flt);
        priv.flights.push(flight);
        my.addToTotals(flight);
    };
    
    this.addFlights = function (flights) {
        for (var flight in flights) {
            if (flights[flight] !== undefined) my.addFlight(flights[flight]);
        }
    };

    this.showHeader = function () {
        var headers = $('#flight-table thead').empty(),
            numbers = $('<tr/>').appendTo(headers),
            titles = $('<tr/>').appendTo(headers),
            subtitles = $('<tr/>').addClass('subth').appendTo(headers),
            number = null,
            cell = null,
            space = 0;

        // 1 - Date
        if (my.options.show.date) {
            $('<th/>').text('1').appendTo(numbers);
            $('<th/>').text('Date').attr('rowspan', 2).appendTo(titles);
        }
        
        // 2 - Departure
        if (my.options.show.departure.place || my.options.show.departure.time) {
            number = $('<th/>').text('2').appendTo(numbers);
            cell = $('<th/>').text('Departure').appendTo(titles);
            if (my.options.show.departure.place && my.options.show.departure.time) {
                number.attr('colspan', 2);
                cell.attr('colspan', 2);
            }
        }
        if (my.options.show.departure.place) $('<th/>').text('Place').appendTo(subtitles);
        if (my.options.show.departure.time) $('<th/>').text('Time').appendTo(subtitles);
        
        // 3 - Arrival
        if (my.options.show.arrival.place || my.options.show.arrival.time) {
            number = $('<th/>').text('3').appendTo(numbers);
            cell = $('<th/>').text('Arrival').appendTo(titles);
            if (my.options.show.arrival.place && my.options.show.arrival.time) {
                number.attr('colspan', 2);
                cell.attr('colspan', 2);
            }
        }
        if (my.options.show.arrival.place) $('<th/>').text('Place').appendTo(subtitles);
        if (my.options.show.arrival.time) $('<th/>').text('Time').appendTo(subtitles);
        
        // 4 - Aircraft
        if (my.options.show.aircraft.model || my.options.show.aircraft.registration) {
            number = $('<th/>').text('4').appendTo(numbers);
            cell = $('<th/>').text('Aircraft').appendTo(titles);
            if (my.options.show.aircraft.model && my.options.show.aircraft.registration) {
                number.attr('colspan', 2);
                cell.attr('colspan', 2);
            }
        }
        if (my.options.show.aircraft.model) $('<th/>').text('Model').appendTo(subtitles);
        if (my.options.show.aircraft.registration) $('<th/>').text('Registration').appendTo(subtitles);
        
        // 5 - Time
        space = (my.options.show.time.single.se ? 1 : 0) + (my.options.show.time.single.me ? 1 : 0) + (my.options.show.time.multi.multi ? 1 : 0) + (my.options.show.time.multi.turbine ? 1 : 0);
        if (space) {
            number = $('<th/>').text('5').appendTo(numbers);
            if (space > 1) number.attr('colspan', space);
        }
        // 5 - Single-pilot Time
        if (my.options.show.time.single.se || my.options.show.time.single.me) {
            cell = $('<th/>').text('Single-pilot').appendTo(titles);
            if (my.options.show.time.single.se && my.options.show.time.single.me) cell.attr('colspan', 2);
        }
        if (my.options.show.time.single.se) $('<th/>').text('SE').appendTo(subtitles);
        if (my.options.show.time.single.me) $('<th/>').text('ME').appendTo(subtitles);
        
        // 5 - Multi-pilot Time
        if (my.options.show.time.multi.multi || my.options.show.time.multi.turbine) {
            cell = $('<th/>').text('Multi-pilot').appendTo(titles);
            if (my.options.show.time.multi.multi && my.options.show.time.multi.turbine) cell.attr('colspan', 2);
        }
        if (my.options.show.time.multi.multi) $('<th/>').text('Multi-pilot').appendTo(subtitles);
        if (my.options.show.time.multi.turbine) $('<th/>').text('Turbine').appendTo(subtitles);
        
        // 6 - Total time
        if (my.options.show.total) {
            $('<th/>').text('6').appendTo(numbers);
            $('<th/>').text('Total time').attr('rowspan', 2).appendTo(titles);
        }
        
        // 7 - Pilot-in-Command
        if (my.options.show.pic) {
            $('<th/>').text('7').appendTo(numbers);
            $('<th/>').text('Pilot-in-command').attr('rowspan', 2).appendTo(titles);
        }
        
        // 8 -Landings
        if (my.options.show.landings.day || my.options.show.landings.night) {
            number = $('<th/>').text('8').appendTo(numbers);
            cell = $('<th/>').text('Landings').appendTo(titles);
            if (my.options.show.landings.day && my.options.show.landings.night) {
                number.attr('colspan', 2);
                cell.attr('colspan', 2);
            }
        }
        if (my.options.show.landings.day) $('<th/>').text('Day').appendTo(subtitles);
        if (my.options.show.landings.night) $('<th/>').text('Night').appendTo(subtitles);
        
        // 9 - Operation Conditions Time
        if (my.options.show.conditions.night || my.options.show.conditions.ifr) {
            $('<th/>').text('7').appendTo(numbers);
            $('<th/>').text('Pilot-in-command').appendTo(titles);
            if (my.options.show.conditions.night && my.options.show.conditions.ifr) {
                number.attr('colspan', 2);
                cell.attr('colspan', 2);
            }
        }
        if (my.options.show.conditions.night) $('<th/>').text('Night').appendTo(subtitles);
        if (my.options.show.conditions.ifr) $('<th/>').text('IFR').appendTo(subtitles);
        
        // 10 - Pilot Function Time
        space = (my.options.show.function.pic ? 1 : 0) + (my.options.show.function.copilot ? 1 : 0) + (my.options.show.function.dual ? 1 : 0) + (my.options.show.function.instructor ? 1 : 0);
        if (space) {
            number = $('<th/>').text('10').appendTo(numbers);
            cell = $('<th/>').text('Pilot function time').appendTo(titles);
            if (space > 1) {
                number.attr('colspan', space);
                cell.attr('colspan', space);
            }
        }
        if (my.options.show.function.pic) $('<th/>').text('PiC').appendTo(subtitles);
        if (my.options.show.function.copilot) $('<th/>').text('Co-pilot').appendTo(subtitles);
        if (my.options.show.function.dual) $('<th/>').text('Dual').appendTo(subtitles);
        if (my.options.show.function.instructor) $('<th/>').text('Instructor').appendTo(subtitles);
        
        // 11 - Synthetic Training Device Session
        space = (my.options.show.synthetic.date ? 1 : 0) + (my.options.show.synthetic.type ? 1 : 0) + (my.options.show.synthetic.time ? 1 : 0);
        if (space) {
            number = $('<th/>').text('11').appendTo(numbers);
            cell = $('<th/>').text('Synthetic Training').appendTo(titles);
            if (space > 1) {
                number.attr('colspan', space);
                cell.attr('colspan', space);
            }
        }
        if (my.options.show.synthetic.date) $('<th/>').text('Date').appendTo(subtitles);
        if (my.options.show.synthetic.type) $('<th/>').text('Type').appendTo(subtitles);
        if (my.options.show.synthetic.time) $('<th/>').text('Time').appendTo(subtitles);
        
        // 12 - Remarks
        if (my.options.show.remark) {
            $('<th/>').text('12').appendTo(numbers);
            $('<th/>').text('Remark').attr('rowspan', 2).appendTo(titles);
        }
    };
    
    this.showFooter = function () {
        var footer = $('#flight-table tfoot').empty(),
            row = $('<tr/>').appendTo(footer),
            space = 0,
            dateSpace = $('<th/>').text('Total time'),
            syntheticSpace = $('<th/>');

        // 1, 2, 3, 4
        space = (my.options.show.date ? 1 : 0);
        space += (my.options.show.departure.place ? 1 : 0) + (my.options.show.departure.time ? 1 : 0);
        space += (my.options.show.arrival.place ? 1 : 0) + (my.options.show.arrival.time ? 1 : 0);
        space += (my.options.show.aircraft.model ? 1 : 0) + (my.options.show.aircraft.registration ? 1 : 0);
        if (space) dateSpace.appendTo(row);
        if (space > 1) dateSpace.attr('colspan', space);
        
        // 5 - Single-pilot Time
        if (my.options.show.time.single.se) $('<th/>').text(priv.total.time.single.se.toTimeString()).appendTo(row);
        if (my.options.show.time.single.me) $('<th/>').text(priv.total.time.single.me.toTimeString()).appendTo(row);
        // 5 - Multi-pilot Time
        if (my.options.show.time.multi.multi) $('<th/>').text(priv.total.time.multi.multi.toTimeString()).appendTo(row);
        if (my.options.show.time.multi.turbine) $('<th/>').text(priv.total.time.multi.turbine.toTimeString()).appendTo(row);
        // 6 - Total time
        if (my.options.show.total) $('<th/>').text(priv.total.grandTotal.toTimeString()).appendTo(row);
        // 7 - Pilot-in-Command
        if (my.options.show.pic) $('<th/>').appendTo(row);
        // 8 -Landings
        if (my.options.show.landings.day) $('<th/>').text(priv.total.landings.day).appendTo(row);
        if (my.options.show.landings.night) $('<th/>').text(priv.total.landings.night).appendTo(row);
        // 9 - Operation Conditions Time
        if (my.options.show.conditions.night) $('<th/>').text(priv.total.conditions.night.toTimeString()).appendTo(row);
        if (my.options.show.conditions.ifr) $('<th/>').text(priv.total.conditions.ifr.toTimeString()).appendTo(row);
        // 10 - Pilot Function Time
        if (my.options.show.function.pic) $('<th/>').text(priv.total.function.pic.toTimeString()).appendTo(row);
        if (my.options.show.function.copilot) $('<th/>').text(priv.total.function.copilot.toTimeString()).appendTo(row);
        if (my.options.show.function.dual) $('<th/>').text(priv.total.function.dual.toTimeString()).appendTo(row);
        if (my.options.show.function.instructor) $('<th/>').text(priv.total.function.instructor.toTimeString()).appendTo(row);
        // 11 - Synthetic Training Device Session
        if (my.options.show.synthetic.date || my.options.show.synthetic.type) syntheticSpace.appendTo(row);
        if (my.options.show.synthetic.date && my.options.show.synthetic.type) syntheticSpace.attr('colspan', 2);
        if (my.options.show.synthetic.time) $('<th/>').text(priv.total.synthetic.toTimeString()).appendTo(row);
        // 12 - Remarks
        if (my.options.show.remark) $('<th/>').appendTo(row);
    };
    
    this.showFlight = function (flight) {
        var row = $('<tr/>').appendTo('#flight-table tbody');

        // 1 - Date
        if (my.options.show.date) $('<td/>').append($('<time/>').text(flight.date.toLocaleDateString()).attr('datetime', flight.date.toISOString())).appendTo(row);
        // 2 - Departure
        if (my.options.show.departure.place) $('<td/>').text(flight.departure.place).appendTo(row);
        if (my.options.show.departure.time) $('<td/>').text(flight.departure.time).appendTo(row);
        // 3 - Arrival
        if (my.options.show.arrival.place) $('<td/>').text(flight.arrival.place).appendTo(row);
        if (my.options.show.arrival.time) $('<td/>').text(flight.arrival.time).appendTo(row);
        // 4 - Aircraft
        if (my.options.show.aircraft.model) $('<td/>').text(flight.aircraft.model).appendTo(row);
        if (my.options.show.aircraft.registration) $('<td/>').text(flight.aircraft.registration).appendTo(row);
        // 5 - Single-pilot Time
        if (my.options.show.time.single.se) $('<td/>').text(my.flightTime(flight.time.single.se)).appendTo(row);
        if (my.options.show.time.single.me) $('<td/>').text(my.flightTime(flight.time.single.me)).appendTo(row);
        // 5 - Multi-pilot Time
        if (my.options.show.time.multi.multi) $('<td/>').text(my.flightTime(flight.time.multi.multi)).appendTo(row);
        if (my.options.show.time.multi.turbine) $('<td/>').text(my.flightTime(flight.time.multi.turbine)).appendTo(row);
        // 6 - Total time
        if (my.options.show.total) $('<td/>').text(flight.total.toTimeString()).appendTo(row);
        // 7 - Pilot-in-Command
        if (my.options.show.pic) $('<td/>').text(flight.pic).appendTo(row);
        // 8 -Landings
        if (my.options.show.landings.day) $('<td/>').text(flight.landings.day).appendTo(row);
        if (my.options.show.landings.night) $('<td/>').text(flight.landings.night).appendTo(row);
        // 9 - Operation Conditions Time
        if (my.options.show.conditions.night) $('<td/>').text(my.flightTime(flight.conditions.night)).appendTo(row);
        if (my.options.show.conditions.ifr) $('<td/>').text(my.flightTime(flight.conditions.ifr)).appendTo(row);
        // 10 - Pilot Function Time
        if (my.options.show.function.pic) $('<td/>').text(my.flightTime(flight.function.pic)).appendTo(row);
        if (my.options.show.function.copilot) $('<td/>').text(my.flightTime(flight.function.copilot)).appendTo(row);
        if (my.options.show.function.dual) $('<td/>').text(my.flightTime(flight.function.dual)).appendTo(row);
        if (my.options.show.function.instructor) $('<td/>').text(my.flightTime(flight.function.instructor)).appendTo(row);
        // 11 - Synthetic Training Device Session
        if (my.options.show.synthetic.date) $('<td/>').append($('<time/>').text(flight.synthetic.date.toLocaleString()).attr('datetime', flight.synthetic.date.toISOString())).appendTo(row);
        if (my.options.show.synthetic.type) $('<td/>').text(flight.synthetic.type).appendTo(row);
        if (my.options.show.synthetic.time) $('<td/>').text(my.flightTime(flight.synthetic.time)).appendTo(row);
        // 12 - Remarks
        if (my.options.show.remark) $('<td/>').text(flight.remark).appendTo(row);
    };
    
    this.showFlights = function () {
        $('#flight-table tbody').empty();
        $.each(priv.flights, function(index, flight) {
            my.showFlight(flight);
        });
    };
    
    this.showTable = function () {
        this.showHeader();
        this.showFlights();
        this.showFooter();
    };
    
    this.showHours = function () {
        $('#stats-hours').removeClass('card-warning card-success card-info');
        if(priv.total.grandTotal.time().hours < 12) {
            $('#stats-hours').addClass('card-warning');
        } else {
            $('#stats-hours').addClass('card-success');
        }
        $('[data-stats="grand-total"]').text(priv.total.grandTotal.toTimeString());
        $('[data-stats="12m-total"]').text(priv.total12months.grandTotal.toTimeString());
        $('[data-stats="12m-pic"]').text(priv.total12months.function.pic.toTimeString());
        $('[data-stats="12m-dual"]').text(priv.total12months.function.dual.toTimeString());
        $('[data-stats="12m-landings"]').text(priv.total12months.landings.day + priv.total12months.landings.night);
    };
    
    this.showAircrafts = function () {
        $('#stats-aircraft ul').empty();
        var sorted = priv.aircrafts.registration.sort().reverse();
        for (var entry in sorted) {
           if (sorted[entry] !== undefined) {
               $('<li/>').addClass('list-group-item').text(entry).appendTo('#stats-aircraft ul')
                   .append($('<small/>').text(sorted[entry].toTimeString()).addClass('pull-right'));
           }
        }
    };
    
    this.showModels = function () {
        $('#stats-models ul').empty();
        var sorted = priv.aircrafts.models.sort().reverse();
        for (var entry in sorted) {
           if (sorted[entry] !== undefined) {
               $('<li/>').addClass('list-group-item').text(entry).appendTo('#stats-models ul')
                   .append($('<small/>').text(sorted[entry].toTimeString()).addClass('pull-right'));
           }
        }
    };
    
    this.showStats = function () {
        my.showHours();
        my.showAircrafts();
        my.showModels();
    };
    
    this.flights = function () {
    
        Rest.get('/flights', function(data) {
            if (data.flights !== undefined) {
                my.addFlights(data.flights);
                my.showTable();
                my.showStats();
            }
        });
    };
}

$(document).ready(function () {
    'use strict';
    var airlift = new Airlift ();
    airlift.userInfo();
    airlift.flights();
});