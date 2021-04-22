# chat/consumers.py
import json
from PIL import Image
from io import BytesIO
import base64
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

sender = None
counter = 0
class CanvasConsumer(WebsocketConsumer):
    id = None
    def connect(self):
        self.accept()

        global counter
        
        id = counter
        
        if counter == 0:
            self.send(text_data=json.dumps(
            {
                'type':'sendOffer'
            }
            ))
            global sender
            sender = self
        
        else:
            global sdp
            self.send(text_data=json.dumps(
                {
                    'type':'offer',
                    'sdp':sdp
                }
            ))
        counter += 1

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        global sdp
        data = json.loads(text_data)
        if data['type'] == 'sendOffer':
            sdp = data['sdp']
        elif data['type'] == "offer":
            global sender
            sender.send(text_data=json.dumps(
            {
                'type':'answer',
                'answer':data['anwser']
            }
            ))

