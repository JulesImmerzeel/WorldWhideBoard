# chat/consumers.py
import json
from PIL import Image
from io import BytesIO
import base64
from channels.generic.websocket import WebsocketConsumer

consumers = []


class CanvasConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        consumers.append(self)

        with open("art.png", "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())

        self.send(text_data=json.dumps({
            'centralCanvas': encoded_string.decode("utf-8") 
        }))

    def disconnect(self, close_code):
        consumers.remove(self)

    def receive(self, text_data):

        if text_data == 'resend':
            with open("art.png", "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read())

            self.send(text_data=json.dumps({ 'centralCanvas': encoded_string.decode("utf-8") }))

        else:
            canvas = Image.open("art.png")
            input_canvas = Image.open(BytesIO(base64.b64decode(text_data[22:])))

            canvas.paste(input_canvas, (0,0), input_canvas)
            canvas.save("art.png")

            with open("art.png", "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read())


            others = consumers.copy()
            others.remove(self)
            for consumer in others:
                consumer.send(text_data=json.dumps({
                'centralCanvas': encoded_string.decode("utf-8") 
            }))