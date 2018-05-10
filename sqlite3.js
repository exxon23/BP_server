const sqlite3 = require('sqlite3').verbose();

//connecting to sqlite database
let db = new sqlite3.Database('./sqlite3_db_test', (err) => {
    if(err){
        return console.log(err.message);
    }
    console.log('Connected to sqlite3 database');
});

//create table containing users - id,name,unlock_rights,last_unlock
//db.run('CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT, unlock_rights INT, last_unlock TEXT)');
/*

// insert one row into the  table users
let sql = db.prepare("INSERT INTO users VALUES(?,?,?,?)");
sql.run(null,'Sebastian',1,new Date().toLocaleString());
sql.finalize();
*/

//get all data
db.each("SELECT id,name,unlock_rights,last_unlock FROM users",function(err,row){
    console.log(row);
})


// get last id
db.get("SELECT id FROM users ORDER BY id DESC",(err,row) => {
    console.log(row.id);
})


/*
//quering
let sql = `SELECT id,name,unlock_rights,last_unlock FROM users WHERE id=?`;
db.get(sql,3,(err,row)=>{
    if(err){
        return console.error(err.message);
    }
    return row ? console.log(row) : console.log('Not found');
});*/


db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection.');
  });

  