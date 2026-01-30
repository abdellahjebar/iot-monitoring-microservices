import pika
import json
import time
import os
from pymongo import MongoClient

# Configuration
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
MONGO_HOST = os.getenv('MONGO_HOST', 'localhost')
MONGO_URI = f"mongodb://admin:1234@{MONGO_HOST}:27017"
EXCHANGE_NAME = 'iot_events'
TOPIC = 'device.test_event'

def verify_monitoring():
    print(f"[-] Connecting to RabbitMQ at {RABBITMQ_HOST}...")
    try:
        # 1. Publish Message
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
        channel = connection.channel()
        channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type='topic', durable=True)
        
        payload = {"status": "test_verification", "value": 123}
        body = json.dumps(payload)
        
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=TOPIC,
            body=body
        )
        print(f"[+] Published test message: {payload}")
        connection.close()
        
        # 2. Wait for Consumer
        print("[-] Waiting 5s for consumer to process...")
        time.sleep(5)
        
        # 3. Check MongoDB
        print(f"[-] Checking MongoDB at {MONGO_URI}...")
        client = MongoClient(MONGO_URI)
        db = client['db_monitoring']
        collection = db['events']
        
        # Find the document
        doc = collection.find_one({"topic": TOPIC, "payload.status": "test_verification"})
        
        if doc:
            print(f"[SUCCESS] Found document in MongoDB! ID: {doc['_id']}")
            print(f"Data: {doc['payload']}")
        else:
            print("[FAIL] Document not found in MongoDB.")
            
    except Exception as e:
        print(f"[!] Error: {e}")

if __name__ == "__main__":
    verify_monitoring()
