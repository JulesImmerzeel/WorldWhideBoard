# chat/consumers.py
import json
from PIL import Image
from io import BytesIO
import base64
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

connections = dict()
counter = 0
class CanvasConsumer(WebsocketConsumer):
    def connect(self):
        self.room_group_name = 'main'
        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        self.accept()

        # # Send message to room group
        # async_to_sync(self.channel_layer.group_send)(
        #     self.room_group_name,
        #     {
        #         'type': 'connection',
        #         'count': len(self.channel_layer.groups.get(self.room_group_name, {}).items()),
        #         'sender_channel_name': self.channel_name
        #     }
        # )

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'counter',
                'sender_channel_name': self.channel_name,
                'count': len(self.channel_layer.groups.get(self.room_group_name, {}).items()) - 1
            }
        )
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive(self, text_data):
        if text_data['type'] == 'requestToJoin':
            connections[counter] = text_data['message']



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
                'type': event['type'],
                'centralCanvas' : event['message'],
                'currOnline': len(self.channel_layer.groups.get(self.room_group_name, {}).items()) }))

    def lines(self, event):
        if event['sender_channel_name'] != self.channel_name:
            self.send(text_data=json.dumps({
                'type': event['type'],
                'lines' : event['lines'],
                'currOnline': len(self.channel_layer.groups.get(self.room_group_name, {}).items()),
                'color': event['color'],
                'lineWidth': event['lineWidth']}))

    def counter(self,event):
        if event['sender_channel_name'] != self.channel_name:
            self.send(text_data=json.dumps({'type': event['type'],'currOnline': event['count']}))

    def update(self, event):
        pass