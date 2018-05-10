// file to create database table users (run only once)
const sqlite3 = require('sqlite3').verbose();

//connecting to sqlite database
let db = new sqlite3.Database('./sqlite3_db_test', (err) => {
    if(err){
        return console.log(err.message);
    }
    console.log('Connected to sqlite3 database');
});


//create table containing users - id,name,unlock_rights,last_unlock
db.run('CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT, unlock_rights INT, last_unlock TEXT)');
db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection.');
  });