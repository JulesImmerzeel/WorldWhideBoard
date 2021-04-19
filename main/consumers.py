# chat/consumers.py
import json
from PIL import Image
from io import BytesIO
import base64
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync


class CanvasConsumer(WebsocketConsumer):
    def connect(self):
        self.room_group_name = 'main'
        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        self.accept()

        with open("art.png", "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())

        self.send(text_data=json.dumps({
            'centralCanvas': encoded_string.decode("utf-8"),
            'currOnline': len(self.channel_layer.groups.get(self.room_group_name, {}).items())
        }))

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive(self, text_data):
        # drawlines stuff
        if len(self.channel_layer.groups.get(self.room_group_name, {}).items()) > 1:
            data = json.loads(text_data)
            
            # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'lines',
                    'lines': data['lines'],
                    'color': data['color'],
                    'lineWidth': data['lineWidth'],
                    'sender_channel_name': self.channel_name
                }
            )


        # draw canvas stuff
        else:
            canvas = Image.open("art.png")
            input_canvas = Image.open(BytesIO(base64.b64decode(text_data[22:])))

            canvas.paste(input_canvas, (0,0), input_canvas)
            canvas.save("art.png")

            with open("art.png", "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read())

            # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'canvas',
                    'message': encoded_string.decode(),
                    'sender_channel_name': self.channel_name
                }
            )

    # Receive message from room group (other users)
    def canvas(self, event):
        # avoid sending message to the client that send it
        if event['sender_channel_name'] != self.channel_name:
            # Send canvas to WebSocket
            self.send(text_data=json.dumps({
                'centralCanvas' : event['message'],
                'currOnline': len(self.channel_layer.groups.get(self.room_group_name, {}).items()) }))

    def lines(self, event):
        if event['sender_channel_name'] != self.channel_name:
            self.send(text_data=json.dumps({
                'lines' : event['lines'],
                'currOnline': len(self.channel_layer.groups.get(self.room_group_name, {}).items()),
                'color': event['color'],
                'lineWidth': event['lineWidth']}))
