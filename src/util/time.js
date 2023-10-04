var differenceInMilliseconds = require( 'date-fns/differenceInMilliseconds' );

// const HOURS_PER_DAY = 24;
// const MINUTES_PER_HOUR = 60;
// const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

const toSeconds = ms => ms / MILLISECONDS_PER_SECOND;

/** Class representing a timer. */
class Timer {

  /**
   * Create a timer
   * @param {number} delay - The time in milliseconds
   */
  constructor( delay ) {
    this.delay = delay;
    this.last = new Date();
  }

  /**
   * Reset the timer.
   * @return {number} The new last date
   */
  reset() {
    this.last = new Date();
  }

  /**
   * Has the delay elapsed (since last)?
   * @return {boolean} True if elapsed.
   */
  hasElapsed() {
    const elapsed = differenceInMilliseconds( Date.now(), this.last );
    return elapsed >= this.delay;
  }
}


export { Timer, toSeconds };