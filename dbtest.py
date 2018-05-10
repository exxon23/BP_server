import sqlite3
from sqlite3 import Error

def create_connection(db_file):
    
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except Error as e:
        print(e)
 
    return None

db = create_connection('database')




subjects = []

cursor = db.cursor()
#cursor.execute('''CREATE TABLE users(id INTEGER PRIMARY KEY, name TEXT, unlock_rights BOOL)''')
#db.commit()
#print("Created table")
name2 = 'Dominik'
un2 = 0

cursor.execute('''INSERT INTO users(name, unlock_rights) VALUES(?,?)''',(name2,un2))
print('User inserted')

#db.commit()
#delete_userid = 2
#cursor.execute('''DELETE FROM users WHERE id = ? ''', (delete_userid,))
 
#db.commit()


cursor.execute('''SELECT id, name, unlock_rights FROM users''')
all_rows = cursor.fetchall()
for row in all_rows:

    subjects.append(row)
    print(row)

print(subjects)

db.close()