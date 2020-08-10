/*!
  jQuery timebar plugin
  @name jquery.timebar.js
  @author pulkitchadha (pulkitchadha27@gmail.com]
  @version 1.0
  @date 28/03/2018
  @category jQuery Plugin
  @copyright (c) 2018 pulkitchadha (pulkitchadha)
  @license Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
*/
(function ($) {

    var timebar, defaultOptions, __bind;

    __bind = function (fn, me) {
        return function () {
            return fn.apply(me, arguments);
        };
    };

    // Plugin default options.
    defaultOptions = {
        //properties
        element: null,
        totalTimeInSecond: 0,
        cuepoints: [],
        width: 0,
        globalPageX: 0,
        selectedTime: 0,
        multiSelect: false,
        showCuepoints: true,
        stepBars: 60,
        timeIntervals: 6,
        // events
        barClicked: null,
        cuepointClicked: null,
        timePlusSecondsBegin: 0,
        timePlusSecondsEnd: 0,
        //Currently, Not supported

        // life cycle methods
        beforeCreate: null,
        created: null,
        beforeMount: null,
        mounted: null,
        beforeUpdate: null,
        updated: null,
        // hooks
        beforeAddCuepoint: null,
        afterAddCuepoint: null,
        beforeUpdateCuepoint: null,
        afterUpdateCuepoint: null,
        beforeDeleteCuepoint: null,
        afterDeleteCuepoint: null,
    };

    timebar = (function (options) {

        function timebar(element, options) {
            var self = this;

            // Extend default options.
            $.extend(true, this, defaultOptions, options);

            this.element = element;

            // Bind methods.
            this.init = __bind(this.init, this);
            this.update = __bind(this.update, this);
            this.getSelectedTime = __bind(this.getSelectedTime, this);
            this.setSelectedTime = __bind(this.setSelectedTime, this);
            this.getTotalTime = __bind(this.getTotalTime, this);
            this.setTotalTime = __bind(this.setTotalTime, this);
            this.getWidth = __bind(this.getWidth, this);
            this.setWidth = __bind(this.setWidth, this);
            this.getActualWidth = __bind(this.getActualWidth, this);
            this.formatTime = __bind(this.formatTime, this);
            this.addCuepoints = __bind(this.addCuepoints, this);
            this.deleteSelectedCuepoints = __bind(this.deleteSelectedCuepoints, this);
            this.updateSelectedCuepoint = __bind(this.updateSelectedCuepoint, this);
            this.showHideCuepoints = __bind(this.showHideCuepoints, this);

            // When user clicks on timebar
            $(this.element).off('click');
            $(this.element).on('click', '.step', function (event) {
                self.setSelectedTime($(this).data("time"));
                self.barClicked.call(this, self.getSelectedTime());
                let time = $(this).data('time');
                console.log("time: ", $(element));
                let timeTooltip = moment().set({hour: 0, minute: 0, second: 0, millisecond: 0});

                $('#timebar-selected-time').html(moment(timeTooltip).add(time, 'seconds').format('HH:mm'));

            });

            // Listen to events
            $(this.element).on('click', '.steps-bar', function (event) {
                self._barClicked(this, event, self);

            });

            $(this.element).on("click", '.pointer', function () {
                self._cuepointClicked(this, self);
            });

        }

        timebar.prototype.timeBetweenPoints = function() {
            const beginTime = $('.download-pointer-begin').data().time;
            const endTime = $('.download-pointer-end').data().time;
            return endTime - beginTime;
        }

        // Method for updating the plugins options.
        timebar.prototype.update = function (options) {
            $.extend(true, this, options);
        };

        // methods
        timebar.prototype.getSelectedTime = function () {
            return this.selectedTime;
        };
        timebar.prototype.setSelectedTime = function (time) {
            if (!time && time !== 0) throw new Error('please pass the valid time');

            this.selectedTime = parseInt(time);
            return this.timebarInstance;
        };
        timebar.prototype.getTotalTime = function () {
            return this.totalTimeInSecond;
        };
        timebar.prototype.setTotalTime = function (time) {
            if (!time) throw new Error('please pass the valid time');

            this.totalTimeInSecond = parseInt(time);
            return this.timebarInstance;
        };
        timebar.prototype.getWidth = function () {
            return this.width;
        };
        timebar.prototype.setWidth = function (width) {
            if (!width) throw new Error('please pass the valid width');

            this.width = width;
            width = this.getActualWidth() + 57;
            $(".timeline-cover").css('width', width + 'px');
            return this.timebarInstance;
        };
        timebar.prototype.getActualWidth = function () {
            let width = this.width;
            width = parseInt(width.replace(/px|%/g, ''));
            return width;
        }
        timebar.prototype.getCuepoints = function () {
            return this.cuepoints;
        }
        timebar.prototype.formatTime = function (sec_num) {
            return this.toDuration(sec_num);
        }
        timebar.prototype.addCuepoints = function (cuepoint) {
            if (!cuepoint) throw new Error('please pass the valid time');

            cuepoint = parseInt(cuepoint);

            if (!this.cuepoints.includes(cuepoint)) {
                this.cuepoints.push(cuepoint);
                this.markCuepoints(cuepoint);
            } else {
                throw new Error('Cuepoint already exists');
            }

            return this.timebarInstance;
        }
        timebar.prototype.deleteSelectedCuepoints = function () {
            const cuepoints = this.cuepoints;
            const selectedCuepoints = [];

            $(".pointerSelected").each(function () {
                const id = $(this).attr("id");
                selectedCuepoints.push(parseInt(id));
            });

            if (selectedCuepoints.length) {
                this.cuepoints = cuepoints.filter((val) => !selectedCuepoints.includes(val));
                $(".pointerSelected").remove();
            } else {
                throw new Error('No Cuepoint is selected');
            }

            return this.timebarInstance;
        }
        timebar.prototype.updateSelectedCuepoint = function (cuepoint) {
            const selectedCuepoints = [];

            $(".pointerSelected").each(function () {
                const id = $(this).attr("id");
                selectedCuepoints.push(parseInt(id));
            });

            if (selectedCuepoints.length > 1) throw new Error('Please select only one cuepoint to update');

            this.deleteSelectedCuepoints();

            this.addCuepoints(cuepoint);

            return this.timebarInstance;
        }
        timebar.prototype.showHideCuepoints = function (show) {
            if (!show) throw new Error('please pass a valid value');

            this.parseBoolean(show) ? $(".pointer").show() : $(".pointer").hide();

            return this.timebarInstance;
        }

        // Main method.
        timebar.prototype.init = function () {
            let data = `<div class='timeline-cover'>
                                <div id='draggable'><span id="timebar-selected-time" style="position: relative; top: -20px; left: -20px; color: red">00:00</span></div>
                                <div class='download download-bar download-bar-begin' style="display: none;"><span id="download-bar-begin-text" style="position: relative; top: -20px; left: -40px; color: blue">00:00</span></div>
                                <div class='download download-bar download-bar-end' style="display: none;"><span id="download-bar-end-text" style="position: relative; top: -20px; left: 0px; color: blue">00:00</span></div>                            
                            <div class='timeline-bar'>
                                <div class='steps-bar clearfix'></div>
                            </div>
                        </div>`;

            $(this.element).append(data);

            this.setWidth(this.width);

            let timeDivison = this.totalTimeInSecond / this.stepBars;
            let time = 0 + (this.timePlusSecondsBegin);
            let timeTooltip = moment().set({hour: 0, minute: 0, second: 0, millisecond: 0});

            // mark bars
            for (let i = 0; i <= this.stepBars; i++) {
                $(".steps-bar").append(`<div class="step" data-toggle="tooltip" data-placement="bottom" title="${moment(timeTooltip).add(time, 'seconds').format('HH:mm')}" data-time=${time}><span class="step-border"></span></div>`);
                time = time + timeDivison;
            }

            let markTimeDivison = this.totalTimeInSecond / this.timeIntervals;

            // mark time intervals
            for (let i = 0; i <= this.timeIntervals; i++) {
                const time = this.toDuration(Math.round(markTimeDivison * i) + this.timePlusSecondsBegin);
                const pos = i * 10 + 1;
                $(`.step:nth-child(${pos})`).append(`<span class="time-instant">${time}</span>`);
            }

            this.markCuepoints(this.cuepoints);

            if (!this.showCuepoints) {
                $(".pointer").hide();
            }
        };

        timebar.prototype.toDuration = function (sec_num) {
            let hours = Math.floor(sec_num / 3600);
            let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
            let seconds = sec_num - (hours * 3600) - (minutes * 60);
            if (hours < 10) {
                hours = "0" + Math.round(hours);
            }
            if (minutes < 10) {
                minutes = "0" + Math.round(minutes);
            }
            if (seconds < 10) {
                seconds = "0" + Math.round(seconds);
            }
            const time = (hours === "010") ? minutes + ':' + seconds : hours + ':' + minutes; // + ':' + seconds;
            return time;
        }

        timebar.prototype.markCuepoints = function (cuepoints = []) {
            const options = this;
            const cuepointArr = Array.isArray(cuepoints) ? cuepoints : [cuepoints];

            $.each(cuepointArr, function (i, time) {
                const animateLeft = (time * 100) / 86400; // options.totalTimeInSecond;
                if (i === 0) {
                    $(".timeline-bar").append(`<div class="pointer download download-pointer-begin draggable" style="left:${animateLeft}%" data-time="${time}"></div>`);
                } else {
                    $(".timeline-bar").append(`<div class="pointer download download-pointer-end draggable" style="left:${animateLeft}%" data-time="${time}"></div>`);
                }
            });

            let self = this;
            $(".download-pointer-begin.draggable").draggable({
                axis: "x",
                containment: '.steps-bar',
                drag: function (event) {
                    const offsetLeft = (event.pageX - $(".steps-bar").offset().left);
                    $(".download-bar-begin").show().css({
                        left: `${offsetLeft}px`
                    });

                    $(".step").each(function () {
                        let left = $(this).offset().left - $(".steps-bar").offset().left;
                        let op = Math.trunc(left) - Math.trunc(offsetLeft);
                        if (op >= -10 && op <= 10) {
                            let timeTooltip = moment().set({hour: 0, minute: 0, second: 0, millisecond: 0});
                            let time = $(this).data('time');
                            $('.download-pointer-begin').data('time', time);
                            $('#download-bar-begin-text').html(moment(timeTooltip).add(time, 'seconds').format('HH:mm'));
                            return false;
                        }
                    });

                    if(self.timeBetweenPoints() >= 60 * 60 || self.timeBetweenPoints() < 0 ) {
                        console.log("aki");
                        const beginTime = $('.download-pointer-begin').data().time;
                        let stepElem = self.findStepCloserToTime(beginTime);
                        const endTime = $(stepElem).data('time');
                        let timeTooltip = moment().set({hour: 0, minute: 0, second: 0, millisecond: 0});
                        let offsetLeft = $(stepElem).offset().left - $(".steps-bar").offset().left;
                        $(".download-bar-end, .download-pointer-end").css({
                            left: `${offsetLeft}px`
                        });
                        $('#download-bar-end-text').html(moment(timeTooltip).add(endTime, 'seconds').format('HH:mm'));
                    
                    }
                },
            });

            $(".download-pointer-end.draggable").draggable({
                axis: "x",
                containment: '.steps-bar',
                // start: function(event, obj) {
                //     if (self.timeBetweenPoints() > 60 * 60) {
                //         self.dontDragEnd = true;
                //         self.currentEndLeft = obj.position.left;
                //     }
                // },
                drag: function (event, obj) {
                    console.log("current left: ", self.timeBetweenPoints());
                    if(self.timeBetweenPoints() >= 60 * 60 && (obj.position.left > self.currentEndLeft)) {
                        return false;
                    }
                    self.currentEndLeft = obj.position.left;
                    const offsetLeft = (event.pageX - $(".steps-bar").offset().left);
                    $(".download-bar-end").show().css({
                        left: `${offsetLeft}px`
                    });

                    $(".step").each(function () {
                        let left = $(this).offset().left - $(".steps-bar").offset().left;
                        let op = Math.trunc(left) - Math.trunc(offsetLeft);
                        if (op >= -10 && op <= 10) {
                            let timeTooltip = moment().set({hour: 0, minute: 0, second: 0, millisecond: 0});
                            let time = $(this).data('time');
                            $('.download-pointer-end').data('time', time);
                            $('#download-bar-end-text').html(moment(timeTooltip).add(time, 'seconds').format('HH:mm'));
                            return false;
                        }
                    })
                },
            });

        }

        timebar.prototype._barClicked = function (element, event, self) {
            const offset = $(element).offset();
            const offsetLeft = (event.pageX - offset.left);
            $('.pointer').removeClass("pointerSelected");
            $("#draggable").css({
                left: `${offsetLeft}px`
            });
        };
        timebar.prototype._cuepointClicked = function (element, self) {
            $(element).hasClass("pointerSelected") ? $(element).removeClass("pointerSelected") : $(element).addClass("pointerSelected");

            self.setSelectedTime($(element).data("time"));
            console.log($(element).data("time"));

            if (typeof self.pointerClicked === 'function') {
                self.pointerClicked.call(element, self.getSelectedTime());
            }
        };

        timebar.prototype.parseBoolean = function (val) {
            return (val.toLowerCase() === 'true');
        };

        timebar.prototype.findStepCloserToTime = function(val) {
            let closest = 0;
            let result = null;
            $(".step").each(function () {
                let time = $(this).data('time');
                if (time > closest && (time - val ) <= 60 * 60) {
                    closest = time;
                    result = this;
                }
            });
            return result;
        }

        return timebar;
    })();

    $.fn.timebar = function (options) {
        // Create a timebar instance if not available.
        if (!this.timebarInstance) {
            this.timebarInstance = new timebar(this, options || {});
        } else {
            this.timebarInstance.update(options || {});
        }

        // Init plugin.
        this.timebarInstance.init();

        // return jQuery object to maintain chainability.
        return this.timebarInstance;
    };
})(jQuery);
