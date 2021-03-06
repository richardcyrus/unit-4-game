/**
 * jQuery
 * @param  {object} $ jQuery object reference.
 */
/* global jQuery */
(function($) {
    'use strict';

    /**
     * The number of times the player has won a game.
     *
     * @type {number}
     */
    let numberOfWins = 0;

    /**
     * The number of times the player has lost a game.
     *
     * @type {number}
     */
    let numberOfLosses = 0;

    /**
     * The current total count of the gems that have been clicked.
     *
     * @type {number}
     */
    let currentScore = 0;

    /**
     * Get a random number between start and end.
     *
     * Here the + 1 accounts for the rounding down of Math.floor().
     *
     * @see https://www.codecademy.com/en/forum_questions/5198adbdbbeddf9726000700
     *
     * @param start
     * @param end
     * @returns {number}
     */
    function getRandomNumber(start, end) {
        return Math.floor(Math.random() * ((end - start) + 1) + start);
    }

    /**
     * A JavaScript object to represent the Crystal Collector game.
     */
    const Game = {
        gems: ['emerald', 'ruby', 'sapphire', 'topaz'],
        targetNumber: 0,
        restartID: 0,
        restartSeconds: 5,
        uniqueGemValues: [],
        elTimerMessage: $('.timer__message'),
        elTimerOverlay: $('.timer__overlay'),
        elTimerTimeLeft: $('.timer__time-left'),
        elGamesWon: $('.games__won'),
        elGamesLost: $('.games__lost'),
        elTargetNumber: $('.game__target-number'),
        elTotalScore: $('.game__total-score'),
        elGemDisplay: $('#gem-display'),

        /**
         * Trigger game start.
         *
         * We set `bind` on page load. Since we are using delegate
         * event registration, if we call bind each time the game
         * resets, we end up with the clicks multiplying as the
         * game progresses. (Didn't make sense at first why I would click
         * a gem and get a value of 33 when the range is 1 - 12.)
         *
         * @param {boolean} bind Is this page load?
         */
        start: function (bind = false) {
            this.generateGemNumbers();
            this.targetNumber = this.generateTargetNumber();
            this.startPlay();

            if (bind) {
                this.bind();
            }
        },

        /**
         * Update the page with the Gem buttons, their values, the
         * target number chosen by the computer, and game statistics.
         */
        startPlay: function( ) {
            for (let gem of this.gems) {
                const name = `gem-button__${gem}`;

                const button = $('<button>')
                    .addClass(`gem-button ${name}`)
                    .attr('data-gem-value', this.uniqueGemValues.shift());

                this.elGemDisplay.append(button);
            }

            this.elGamesWon.text(numberOfWins);
            this.elGamesLost.text(numberOfLosses);
            this.elTotalScore.text(currentScore);
            this.elTargetNumber.text(this.targetNumber);
        },

        /**
         * Bind the click event to the gem buttons via the parent container.
         *
         * Uses jQuery delegated binding so we can register the event handler
         * before the elements exist on the page.
         */
        bind: function () {
            /**
             * `$.proxy` allows us to define the meaning of `this`
             * in the playerClick method.
             */
            this.elGemDisplay.on(
                'click', '.gem-button', $.proxy(this.playerClick, this)
            );
        },

        /**
         * Generate unique values across all gems in the current game.
         *
         * The values for each gem range from 1 to 12 and are chosen
         * randomly. Each generated number is checked against the previously
         * generated numbers to make sure that each gem has a different value.
         */
        generateGemNumbers: function() {
            while (this.uniqueGemValues.length < 4) {
                const random = getRandomNumber(1, 12);

                if (! this.uniqueGemValues.includes(random)) {
                    this.uniqueGemValues.push(random);
                }
            }
        },

        /**
         * Create a random number between 19 and 120 to use as the target
         * number that the player needs to achieve for the win.
         *
         * @returns {number}
         */
        generateTargetNumber: function() {
            return getRandomNumber(19, 120);
        },

        /**
         * Reset the game values and start a new session.
         */
        resetGame: function() {
            this.elGemDisplay.empty();
            this.uniqueGemValues = [];
            this.targetNumber = 0;
            currentScore = 0;

            this.elTimerMessage.empty();
            this.elTimerOverlay.css('display', 'none');
            this.elTimerTimeLeft.empty();
            this.elTimerMessage.removeClass('game-won game-lost');

            this.start();
        },

        /**
         * Evaluate the value of the gem that was clicked, and determine
         * if the player has won, lost or needs to continue playing.
         * This also updates the scores during game play.
         *
         * @param event Browser event object.
         */
        playerClick: function(event) {
            /**
             * The event object. Used to collect the value from
             * the gem that was clicked.
             *
             * @type {EventTarget | Node | HTMLElement}
             */
            let el = event.target;

            let gemValue = ($(el).attr('data-gem-value'));
            gemValue = parseInt(gemValue);

            currentScore += gemValue;
            this.elTotalScore.text(currentScore);

            if (currentScore === this.targetNumber) {
                numberOfWins++;
                this.elGamesWon.text(numberOfWins);

                this.elTimerMessage.addClass('game-won');
                this.elTimerMessage.text("Awesome, You've Won!");
                this.restartGame(this.restartSeconds);

            } else if (currentScore > this.targetNumber) {
                numberOfLosses++;
                this.elGamesLost.text(numberOfLosses);

                this.elTimerMessage.addClass('game-lost');
                this.elTimerMessage.text("Sorry, you lose!");
                this.restartGame(this.restartSeconds);
            }
        },

        /**
         * Execute a timed delay before starting the next play.
         *
         * @param seconds
         */
        restartGame: function (seconds) {
            // Show the overlay.
            this.elTimerOverlay.css('display', 'flex');

            // Clear existing timers.
            clearInterval(this.restartID);

            const now = Date.now();
            const then = now + seconds * 1000;

            // Start the clock.
            this.displayTimeLeft(seconds);

            this.restartID = setInterval(() => {
                const secondsLeft = Math.round((then - Date.now()) / 1000);

                // Should we stop?
                if (secondsLeft < 0) {
                    // Stop setInterval.
                    clearInterval(this.restartID);

                    // Start the next game.
                    this.resetGame();
                }

                // Display time left
                this.displayTimeLeft(secondsLeft);
            }, 1000);
        },

        /**
         * Update the countdown timer between plays.
         *
         * @param seconds
         * @param withMinutes
         */
        displayTimeLeft: function (seconds, withMinutes = false) {
            const minutes = Math.floor(seconds / 60);
            const remainderSeconds = seconds % 60;
            let timeLeft = remainderSeconds;

            if (withMinutes) {
                timeLeft = `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
            }

            this.elTimerTimeLeft.text(timeLeft);
        }
    };

    Game.start(true);

})(jQuery);
