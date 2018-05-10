import sqlite3
from sqlite3 import Error


def create_connection(db_file):
    
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except Error as e:
        print(e)
 
    return None

def loadUsers():
    db = create_connection('sqlite3_db_test')
    cursor = db.cursor()
    subjectsID = [0]
    subjectsNAMES = [""]
    cursor.execute('''SELECT id,name FROM users''')
    all_rows = cursor.fetchall()
    for row in all_rows:
        print(row[1])
        subjectsID.append(row[0])
        subjectsNAMES.append(row[1])
    db.close()
    return subjectsID,subjectsNAMES

id,names = loadUsers()
print(names[1])