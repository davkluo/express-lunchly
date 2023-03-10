"use strict";

const { Value } = require("nunjucks/src/nodes");
/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

const { BadRequestError } = require("../expressError");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, middleName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.middleName = middleName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  // GETTERS AND SETTERS

  // /** gets customer phone number */
  // get phone(){
  //   return this._phone;
  // }

  // /** sets customer phone number */
  // /* would also need to take into account phone numbers with extentions.
  // set phone(val){
  //   const phoneNumberRegex = /^\(?(\d{3})\)?[-. ]?(\d{3})[-. ]?(\d{4})$/;
  //   console.log("val type-", typeof val)
  //   if(val.match(phoneNumberRegex) || val === ''){
  //     this._phone = val
  //   }
  //   else{
  //     throw new BadRequestError("That is not a valid phone number!")
  //   }
  // }


  /** returns customer notes when requested */
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

  /** Return the full name of the customer */

  get fullName() {
    return `${this.firstName} ${(this.middleName) ? this.middleName + ' ' : ''}${this.lastName}`;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  middle_name AS "middleName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** find customers based on search term */

  static async search(term) {
    let likeTerm = '%' + term + '%';
    likeTerm = likeTerm.replace(/\s/g, ''); // Strips spaces from search term
    const results = await db.query(
      `SELECT id,
                first_name AS "firstName",
                middle_name AS "middleName",
                last_name  AS "lastName",
                phone,
                notes
          FROM customers
          WHERE CONCAT(first_name, middle_name, last_name) ILIKE $1
          ORDER BY last_name, first_name`, [likeTerm]
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  middle_name AS "middleName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get top 10 customers ordered by most reservations */

  static async getTopTen() {
    const results = await db.query( // Is it okay to use COUNT(*)?
      `SELECT c.id,
          c.first_name AS "firstName",
          c.middle_name AS "middleName",
          c.last_name  AS "lastName",
          c.phone,
          c.notes
        FROM customers as c
          JOIN reservations as r
            ON c.id = r.customer_id
        GROUP BY c.id
        ORDER BY COUNT(r.id) DESC
        LIMIT 10`
    );

    return results.rows.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, middle_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
          [this.firstName, this.middleName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 middle_name=$2,
                 last_name=$3,
                 phone=$4,
                 notes=$5
             WHERE id = $6`, [
            this.firstName,
            this.middleName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }
}

module.exports = Customer;
