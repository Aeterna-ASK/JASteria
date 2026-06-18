import json

# This assumes we can't easily access the indexedDB from python, but wait!
# Firebase stores data in indexedDB. I cannot easily query it from python.
# Instead, I will write a simple test script that I can run via node if the data was exported,
# but since the app connects to firestore, I could inject a console.log into the Vue app to print out the menus!
