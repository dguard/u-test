(function($) {
    "use strict";

    var Helper = (function(){
        function Helper(){}
            return Helper;
    })();

    Helper.rtrim = function (str, chars) {
        chars = chars || "\\s";
        return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
    };

    Helper.getAvg = function(arr) {
        var sum = 0;
        for(var i = 0; i < arr.length; i++)
            sum += +arr[i];
        var avg = (sum/arr.length).toFixed(2);
        return this.rtrim(avg, '0.');
    };

    var App;

    App = (function() {

        function App() {

            this.view = {
                $body: $('body'),
                $modal: $('#modal'),
                $groupList: $('#group-list')
            };

            this.data = {
                hasLocalStorage: -1,
                balls: {},
                ranks: {},
                stats: {},
                criteriaTable: {}
            };

            this.temp = {
                isSaved: false,
                groupId: 0,
                countGroup: 2,
                criteriaData: {}
            };
            this.init();
        }
        return App;
    })();

    App.prototype.init = function() {
        this.assignEvents();
        this.initCriteriaTable();
        this.readData();
        this.run();
    };

    App.prototype.assignEvents = function() {
        $(document).on('click', '.start-btn',  $.proxy(this.onClickStartBtn,  this));
        $(document).on('click', '.change-btn', $.proxy(this.onClickChangeBtn, this));
        $(document).on('click', '.save-btn',   $.proxy(this.onClickSaveBtn,   this));
        $(document).on('unload', $.proxy(this.onUnload, this));
    };

    App.prototype.onClickStartBtn = function() {
        this.run();
        return false;
    };

    App.prototype.onClickChangeBtn = function(e) {
        var $btn = $(e.currentTarget);

        var groupId = $btn.closest('.group').attr('id');
        groupId = groupId.replace(/group/, '') - 1;
        this.temp.groupId = groupId;

        debugger;
        var balls = this.data.balls[groupId];
        var value = this.len(balls) > 0 ? balls.join('\n') : '';
        this.view.$modal.find('.balls').val(value)
    };

    App.prototype.onClickSaveBtn = function() {
        var groupId = this.temp.groupId;
        this.data.balls[groupId] = this.getBalls();
        this.view.$modal.modal('hide');
        this.temp.isSaved = false;
        this.run();
    };

    App.prototype.onUnload = function(){
        this.saveData();
    };

    App.prototype.readData = function() {
        if(this.hasSupportLocalStorage()) {
            var balls = JSON.parse(localStorage.getItem('balls'));
            if (balls !== null) {
                this.data.balls = balls;
            }
        }
    };

    App.prototype.saveData = function() {
        if(this.hasSupportLocalStorage()) {
            var balls = this.data.balls;
            if (this.len(balls) !== 0) {
                localStorage.setItem('balls', JSON.stringify(balls));
            }
            this.temp.isSaved = true;
        }
    };

    App.prototype.onClickClearBtn = function() {
        if(this.hasSupportLocalStorage()) {
            localStorage.clear();
        }
    };

    App.prototype.canRun = function() {
        this.temp.countGroup = this.getCountGroups();
        var len = this.len(this.data.balls);
        if (len !== 0) {
            return len === this.temp.countGroup;
        } else {
            var balls = JSON.parse(localStorage.getItem('balls'));
            if (balls !== null) {
                return this.len(balls) === this.temp.countGroup;
            }
        }
        return false;
    };

    App.prototype.len = function(arr) {
        var len = 0;
        for(var prop in arr) {
            if (arr.hasOwnProperty(prop)) len++;
        }
        return len;
    };

    App.prototype.run = function() {
        if(this.canRun()) {
            this.calculateRanks();
            this.calculateStats();
            this.calculateCriteria();
            this.outputResults();

            if(!this.temp.isSaved) {
                this.saveData();
            }
        }
    };

    App.prototype.getCountGroups = function() {
        return this.view.$groupList.find('.group').length;
    };

    App.prototype.getBalls = function() {
        debugger;
        var balls = this.view.$modal.find('.balls').val().split(/\n|,/);
        var newBalls = [];

        for(var i = 0, l = balls.length; i < l; i++) {
            var ball = balls[i];
            if(!isNaN(ball) && ball !== "") {
                ball = +$.trim(ball);
                newBalls.push(ball);
            }
        }
        newBalls.sort(function(a, b) { return a - b; });
        return newBalls;
    };

    App.prototype.calculateRanks = function() {
        // TODO validation before
        debugger;
        var sumBalls = [];
        var groupsBalls = this.data.balls;
        var groupBalls;

        for(var i = 0, l = this.temp.countGroup; i < l; i++) {
            groupBalls = groupsBalls[i];

            for(var j = 0, k = groupBalls.length; j < k; j++) {
                sumBalls.push(groupBalls[j]);
            }
        }
        sumBalls.sort(function(a, b) { return a - b; });
        var groupsRanks = {};

        for(i = 0, l = this.temp.countGroup; i < l; i++) {
            groupBalls = groupsBalls[i];
            groupsRanks[i] = this.calculateRank(groupBalls, sumBalls);
        }
        this.data.ranks = groupsRanks;
    };

    App.prototype.calculateStats = function() {
        var stats = [];

        for (var i = 0, l = this.temp.countGroup; i < l; i++) {
            debugger;
            var balls = this.data.balls[i];
            var ranks = this.data.ranks[i];

            stats[i] = {
                ballMax  : Math.max.apply({}, balls),
                ballAvg  : Helper.getAvg(balls),
                ballMin  : Math.min.apply({}, balls),

                rankMax  : Math.max.apply({}, ranks),
                rankAvg  : Helper.getAvg(ranks),
                rankMin  : Math.min.apply({}, ranks),

                studentCount  : this.len(balls)
                //studentDone   : this.len(balls),
                //studentFail   : this.len(balls)
            }
        }
        this.data.stats = stats;
    };

    App.prototype.outputResults = function(){
        var $groups = this.view.$groupList.find('.group');

        for(var i = 0, l = this.temp.countGroup; i < l; i++) {
            debugger;
            var stats = this.data.stats[i];
            var $group = $($groups[i]);

            $group.find('.ball')
                .children('.max').html(stats.ballMax).end()
                .children('.avg').html(stats.ballAvg).end()
                .children('.min').html(stats.ballMin).end()
            .end()
                .find('.rank')
                .children('.max').html(stats.rankMax).end()
                .children('.avg').html(stats.rankAvg).end()
                .children('.min').html(stats.rankMin).end()
            .end()
                .find('.student')
                .children('.count').html(stats.studentCount).end()
                //.children('.done' ).html(stats.studentDone ).end()
                //.children('.fail' ).html(stats.studentFail ).end()
        }

        var criteriaText = this.getCriteriaText();
        this.view.$body.find('.criteria-text').html(criteriaText);

        this.drawChart();
    };

    App.prototype.calculateRank = function(balls, sumBalls) {
        var ranks = [];

        for(var i = 0, l = balls.length; i < l; i++) {
            var ball = balls[i];
            var index = sumBalls.indexOf(ball) + 1;
            var lastIndex = sumBalls.lastIndexOf(ball) + 1;
            ranks[i] =  index === lastIndex ?  index : (index + lastIndex) / 2;
        }
        return ranks;
    };

    App.prototype.calculateCriteria = function() {
        this.temp.criteriaData = this.solveCriteria(0, 1);
    };

    App.prototype.drawChart = function() {
        var series = [];

        for(var i = 0, l = this.temp.countGroup; i < l; i++) {
            series.push({
                name: 'Группа' + (i+1),
                data: this.data.balls[i]
            });
        }

        $('#chart').highcharts({
            title: {
                text: 'Соотношение баллов студентов',
                style: {
                    color: '#0093f0',
                    fontWeight: 'bold'
                }
            },
            credits: {
                enabled: false
            },
            colors: [
                '#fdb912',
                '#ef3e42',
                '#009AF0',
                '#7ac143'

            ],
            xAxis: {
                labels: {
                    enabled: false
                },
                tickWidth: 0
            },
            yAxis: {
                gridLineColor: '#eee',
                title: {
                    text: 'Баллы',
                    style: {
                        color: '#0093f0',
                        fontWeight: 'bold'
                    }
                }
            },
            tooltip: {
                valueSuffix: ' балл',
                headerFormat: '',
                pointFormat: '<span style="color:{series.color}">{series.name}</span> <br/><b>{point.y}</b><br/>'
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 1
            },
            series: series
        });
    };

    App.prototype.solveCriteria = function(firstGroupId, secondGroupId) {

        var ranks1  = this.data.ranks[firstGroupId];
        var ranks2 = this.data.ranks[secondGroupId];

        var n1 = ranks1.length;
        var n2 = ranks2.length;

        debugger;

        var t1 = ranks1.reduce(function(a, b){
            return +a + +b;
        });
        var t2 = ranks2.reduce(function(a, b){
            return +a + +b;
        });

        var U;

        if (t1 > t2) {
            U = n1 * n2 + (n1*(n1+1)) / 2 - t1;
        } else {
            U = n1 * n2 + (n2*(n2+1)) / 2 - t2;
        }

        var criticalU = this.getCriticalU(n1, n2);
        var isAccepted = false;

        if (U <= criticalU) {
            isAccepted = true;
        }

        return {
            isAccepted : isAccepted,
            criticalU  : criticalU,
            computedU  : U
        };
    };

    App.prototype.getCriteriaText = function() {
        var data = this.temp.criteriaData;
        var text = 'В результате вычислений было получено следующее значение U-критерия Манна-Уитни: ' + data.computedU
            + '. Так как оно меньше критического значения, равного ' + data.criticalU + ', ';
        if (data.isAccepted) {
            text += '<span class="important">признается наличие существенного различия</span> между уровнем знаний студентов в рассматриваемых группах.';
        } else {
            text += '<span class="important">признается отсутствие существенного различия</span> между уровнем знаний студентов в рассматриваемых группах';
        }
        return text;
    };

    App.prototype.getCriticalU = function(n1, n2) {
        var table = this.data.criteriaTable;
        if(table[n1] !== null && table[n1][n2-5] !== -1) {
            return table[n1][n2-5];
        } else if (table[n2] !== null && table[n2][n1-5] !== -1) {
            return table[n2][n1-5];
        }
        return false;
    };

    App.prototype.initCriteriaTable = function() {
        this.data.criteriaTable = {
            3  : [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 13, 13],
            4  : [1, 2, 3, 4, 4, 5, 6, 7, 8, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 17, 18, 19, 20, 21, 22, 23],
            5  : [2, 3, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 18, 19, 20, 22, 23, 24, 25, 27, 28, 29, 30, 32, 33],
            6  : [-1, 5, 6, 8, 10, 11, 13, 14, 16, 17, 19, 21, 22, 24, 25, 27, 29, 30, 32, 33, 35, 37, 38, 40, 42, 43],
            7  : [-1, -1, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
            8  : [-1, -1, -1, 13, 15, 17, 19, 22, 24, 26, 29, 31, 34, 36, 38, 41, 43, 45, 48, 50, 53, 55, 57, 60, 62, 65],
            9  : [-1, -1, -1, -1, 17, 20, 23, 26, 28, 31, 34, 37, 39, 42, 45, 48, 50, 53, 56, 59, 62, 64, 67, 70, 73, 76],
            10 : [-1, -1, -1, -1, -1, 23, 26, 29, 33, 36, 39, 42, 45, 48, 52, 55, 58, 61, 64, 67, 71, 74, 77, 80, 83, 87],
            11 : [-1, -1, -1, -1, -1, -1, 30, 33, 37, 40, 44, 47, 51, 55, 58, 62, 65, 69, 73, 76, 80, 83, 87, 90, 94, 98],
            12 : [-1, -1, -1, -1, -1, -1, -1, 37, 41, 45, 49, 53, 57, 61, 65, 69, 73, 77, 81, 85, 89, 93, 97, 101, 105, 109],
            13 : [-1, -1, -1, -1, -1, -1, -1, -1, 45, 50, 54, 59, 63, 67, 72, 76, 80, 85, 89, 94, 98, 102, 107, 111, 116, 120],
            14 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, 55, 59, 64, 67, 74, 78, 83, 88, 93, 98, 102, 107, 112, 118, 122, 127, 131],
            15 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 64, 70, 75, 80, 85, 90, 96, 101, 106, 111, 117, 122, 125, 132, 138, 143],
            16 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 75, 81, 86, 92, 98, 103, 109, 115, 120, 126, 132, 138, 143, 149, 154],
            17 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 87, 93, 99, 105, 111, 117, 123, 129, 135, 141, 147, 154, 160, 166],
            18 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 99, 106, 112, 119, 125, 132, 138, 145, 151, 158, 164, 171, 177],
            19 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 113, 119, 126, 133, 140, 147, 154, 161, 168, 175, 182, 189],
            20 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 127, 134, 141, 149, 156, 163, 171, 178, 186, 193, 200],
            21 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 142, 150, 157, 165, 173, 181, 188, 196, 204, 212],
            22 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 158, 166, 174, 182, 191, 199, 207, 215, 223],
            23 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 175, 183, 192, 200, 209, 218, 226, 235],
            24 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 192, 201, 210, 219, 228, 238, 247],
            25 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 211, 220, 230, 239, 249, 258],
            26 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 230, 240, 250, 260, 270],
            27 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 250, 261, 271, 282],
            28 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 272, 282, 293],
            29 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 294, 305],
            30 : [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 317]
        };
    };

    App.prototype.hasSupportLocalStorage = function() {
        var isSupport;
        if (this.data.hasLocalStorage !== -1) {
            isSupport = this.data.hasLocalStorage;
        } else {
            try {
                isSupport = 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                isSupport = false;
            }
            this.data.hasLocalStorage = isSupport;
        }
        return isSupport;
    };

    $(function() {
        return window.app = new App;
    });

})(jQuery);