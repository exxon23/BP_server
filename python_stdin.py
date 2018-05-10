import sys
import cv2
import os
import numpy as np
import os.path
import json
import sqlite3
from sqlite3 import Error


subjects = ["", "Sebastian", "Ondrej","Miki" ,"Kubo","Tom"]
#function to connect to SQLITE3 database
def create_connection(db_file):
    
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except Error as e:
        print(json.dumps({'action':'Connection to Sqlite database','status': False}))
 
    return None
def loadUsers():
    db = create_connection('sqlite3_db_test')
    cursor = db.cursor()
    subjectsID = [0]
    subjectsNAMES = [""]
    cursor.execute('''SELECT id,name FROM users''')
    all_rows = cursor.fetchall()
    for row in all_rows:
        subjectsID.append(row[0])
        subjectsNAMES.append(row[1])
    db.close()
    return subjectsID,subjectsNAMES

#function to detect face using OpenCV
def detect_face(img):
    #convert the test image to gray image as opencv face detector expects gray images
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) 
    face_cascade = cv2.CascadeClassifier('opencv-files/haarcascade_frontalface_alt.xml')
    #let's detect multiscale (some images may be closer to camera than others) images
    #result is a list of faces
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5);  
    #if no faces are detected then return original img
    if (len(faces) == 0):
        return None, None
    
    #under the assumption that there will be only one face,
    #extract the face area
    (x, y, w, h) = faces[0]
    
    #return only the face part of the image
    return gray[y:y+w, x:x+h], faces[0]
#---------------------------------------------------------------------------------------------------------------------------
def prepare_training_data(data_folder_path): 
    #get the directories (one directory for each subject) in data folder
    dirs = os.listdir(data_folder_path)
    
    #list to hold all subject faces
    faces = []
    #list to hold labels for all subjects
    labels = []
    
    #let's go through each directory and read images within it
    for dir_name in dirs:
        
        #our subject directories start with letter 's' so
        #ignore any non-relevant directories if any
        if not dir_name.startswith("s"):
            continue;
            
       
        label = int(dir_name.replace("s", ""))          
        subject_dir_path = data_folder_path + "/" + dir_name
        
        #get the images names that are inside the given subject directory
        subject_images_names = os.listdir(subject_dir_path)
               
        #go through each image name, read image, 
        #detect face and add face to list of faces
        for image_name in subject_images_names:
            
            #ignore system files like .DS_Store
            if image_name.startswith("."):
                continue;
            
            #build image path
            #sample image path = training-data/s1/1.pgm
            image_path = subject_dir_path + "/" + image_name

            #read image
            image = cv2.imread(image_path)
                        
            #detect face
            face, rect = detect_face(image)
                    
            if face is not None:
                #add face to list of faces
                faces.append(face)
                #add label for this face
                labels.append(label)
        
    return faces, labels
#-----------------------------------------------------------------------------------------------------------------------
def train_users():
    print(json.dumps({'action':'Reading photos of users','status': True}))
    #print("Preparing data...")
    faces, labels = prepare_training_data("training-data")
    
    #create our LBPH face recognizer 
    face_recognizer = cv2.face.createLBPHFaceRecognizer()

    #train our face recognizer of our training faces
    face_recognizer.train(faces, np.array(labels))
    print(json.dumps({'action':'Learning photos of users','status': True}))
    #print("Data prepared")
    return face_recognizer
#---------------------------------------------------------------------------------
#given width and heigh
def draw_rectangle(img, rect):
    (x, y, w, h) = rect
    cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)
    
#function to draw text on give image starting from
#passed (x, y) coordinates. 
def draw_text(img, text, x, y):
    cv2.putText(img, text, (x, y), cv2.FONT_HERSHEY_PLAIN, 5, (0, 255, 0), 2)

def predict(test_img,face_recognizer):
    #make a copy of the image as we don't want to chang original image
    img = test_img.copy()
    #detect face from the image
    face, rect = detect_face(img)

    #predict the image using our face recognizer 
    label = face_recognizer.predict(face)
    #get name of respective label returned by face recognizer
    #label_text = subjects[label]
    label_text = usersNames[label]
    print(json.dumps({'action':'Face match','username':label_text, 'userID':usersID[label]}))
    #print(label_text)
    #draw a rectangle around face detected
    draw_rectangle(img, rect)
    #draw name of predicted person
    draw_text(img, label_text, rect[0], rect[1]-5)
    
    return img
if __name__ == '__main__':
    usersID,usersNames = loadUsers()
    face_recognizer = train_users()
    
    while True:
        try:
            lines = str(raw_input())
	    sys.stdout.flush()
            if lines=="btn_push":
                while not os.path.isfile("doorbellCamera.jpg"):
                #ignore if no such file is present
                    pass
                print(json.dumps({'action':'Start face analysis','status': True}))
                #print("Zacinam analyzovat ksicht")
                test_img = cv2.imread('doorbellCamera.jpg')
                
                try:
                    predicted_img5 = predict(test_img,face_recognizer)
                    cv2.imwrite("last_analyse.jpg", predicted_img5)
                    print(json.dumps({'action':'Face recognition complete','status': 'User recognized'}))
                except:
                    print(json.dumps({'action':'Face recognition complete','status': 'No face detected'}))
                    cv2.imwrite("last_analyse.jpg", test_img)                   
                os.remove("doorbellCamera.jpg")           
                
            elif lines=="user_added":
                print(json.dumps({'action':'Learning new user','status': 'User learned'}))
                usersID,usersNames = loadUsers()
                face_recognizer = train_users()
	    sys.stdout.flush()
        except (EOFError):
            continue
        
        
        