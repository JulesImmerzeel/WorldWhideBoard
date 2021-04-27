# chat/consumers.py
import json
from PIL import Image
from io import BytesIO
import base64
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

count = 0
class CanvasConsumer(WebsocketConsumer):
    def connect (self):
        self.room_group_name = 'main'
        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        global count
        count += 1
        self.accept()
        if count == 1:
            with open("art.png", "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read())
            self.send(text_data=json.dumps({'type': 'canvas', 'canvas': encoded_string.decode("utf-8")}))
        else:
            # Send message to room group requesting THEM to send new consumer offers
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type' : 'newConnection',
                    'sender_channel_name' : self.channel_name
                }
            )

    def disconnect (self, close_code):
        # Remove from consumer layer
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )
        global count
        count -= 1

    def receive (self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'sendOffer':
            async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type' : 'sendOffer',
                'for' : data['sender_channel_name'],
                'from' : self.channel_name,
                'offer' : data['sdp']
            }
        )

        elif data['type'] == "offer":
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type' : 'sendAnswer',
                    'for' : data['sender_channel_name'],
                    'from' : self.channel_name,
                    'answer' : data['anwser']
                }
            )
        elif data['type'] == "canvas":
            canvas = Image.open("art.png")
            input_canvas = Image.open(BytesIO(base64.b64decode(data['canvas'][22:])))

            canvas.paste(input_canvas, (0,0), input_canvas)
            canvas.save("art.png")

            with open("art.png", "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read())

    # -----------|----------------------------------|-------------
    # Functions that handle incoming messages from other sockets
    # -----------|----------------------------------|-------------


    # Broadcast a message to all already connected consumers REQUESTING THEM to send you sdps
    def newConnection (self, event):
        if event['sender_channel_name'] != self.channel_name:
            self.send(text_data=json.dumps(
            {
                'type' : 'sendOffer',
                'sender_channel_name' : event['sender_channel_name']
            }))

    # All cosumers send there sdps the new consumer receives them and sends it to it's frontend
    def sendOffer (self, event):
        if event['for'] == self.channel_name:
            self.send(text_data=json.dumps(
                {
                    'type' : 'offer',
                    'sdp' : event['offer'],
                    'sender_channel_name' : event['from']
                }
            ))

    # The new consumer got it's sdp back from the frontend and sends it to the creator of the offer
    def sendAnswer (self, event):
        if event['for'] == self.channel_name:
            self.send(text_data=json.dumps(
                {
                    'type' : 'answer',
                    'answer' : event['answer'],
                    'sender_channel_name' : event['from']

                }))

    # After sendAnswer the signaling is done!
