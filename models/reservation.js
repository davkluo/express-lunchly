"use strict";

/** Reservation for Lunchly */

const moment = require("moment");
const { BadRequestError } = require("../expressError");

const db = require("../db");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  // GETTERS AND SETTERS

  /** returns reservation notes when requested */
  get notes(){
    return this._notes;
  }

  /** set notes to val or to empty string if val is empty*/
  set notes(val){
    if(val) {
      this._notes = val;
    }
    else{
      this._notes = "";
    }
  }

  /** getter for numGuests */
  get numGuests() {
    return this._numGuests;
  }

  /** setter for numGuests */
  set numGuests(val) {
    if (val < 1) {
      throw new BadRequestError('Who is this for anyway?');
    }

    this._numGuests = val;
  }

  /** getter for startAt */
  get startAt() {
    return this._startAt;
  }

  /** setter for startAt */
  set startAt(val) {
    if (!(val instanceof Date)) {
      throw new BadRequestError("That ain't no date.");
    }

    this._startAt = val;
  }

  /** getter for customerId */
  get customerId() {
    return this._customerId;
  }

  /** setter for customerId */
  set customerId(val) {
    if (this._customerId !== undefined) {
      throw new BadRequestError('Already have a customer id.');
    }

    this._customerId = val;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
        [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** save this reservation */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.customerId, this.startAt, this.numGuests, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE reservations
             SET customer_id=$1,
                 start_at=$2,
                 num_guests=$3,
                 notes=$4
             WHERE id = $5`, [
            this.customerId,
            this.startAt,
            this.numGuests,
            this.notes,
            this.id,
          ],
      );
    }
  }
}


module.exports = Reservation;
