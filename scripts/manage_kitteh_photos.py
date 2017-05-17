#! /usr/bin/env python3
import uuid
import os
import argparse

import boto3
import botocore

boto3_session = boto3.Session(profile_name='serverless-meow')

client = boto3_session.client('s3')
BUCKET = os.getenv('BUCKET_NAME')
REGION = 'us-east-2'


def upload_photo(photo_path):
    with open(photo_path, 'rb') as kitteh_photo:
        try:
            client.head_object(Bucket=BUCKET,
                               Key=os.path.basename(photo_path))
        except botocore.exceptions.ClientError as e:
            if e.response['Error']['Code'] == '404':
                client.upload_fileobj(Fileobj=kitteh_photo,
                                       Bucket=BUCKET,
                                       Key=os.path.basename(photo_path))
            else:
                raise
        else:
            print('Kitteh photo {path} already exists, skipping'.format(path=os.path.basename(photo_path)))


def remove_photo(photo_path):
    try:
        client.head_object(Bucket=BUCKET, Key=os.path.basename(photo_path))
    except botocore.exceptions.ClientError as e:
        if e.response['Error']['Code'] == '404':
            print('Kitteh photo {path} does not exist, skipping'.format(path=os.path.basename(photo_path)))
        else:
            raise
    else:
        client.delete_object(Bucket=BUCKET, Key=os.path.basename(photo_path))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Manage your kitteh's photos")
    parser.add_argument('-a', '--add', dest='add_photo_path', help='Path to kitteh photo that you want to upload to s3')
    parser.add_argument('-r', '--remove', dest='remove_photo_path', help='Path to kitteh photo that you want to remove from s3')
    args = parser.parse_args()
    if args.add_photo_path:
        if os.path.isdir(args.add_photo_path):
            for item in os.listdir(args.add_photo_path):
                file_path = os.path.join(args.add_photo_path, item)
                if os.path.isfile(file_path):
                    print('Uploading kitteh photo {path} to s3 bucket {bucket}...'.format(path=file_path, bucket=BUCKET))
                    upload_photo(file_path)
                    print('Upload complete')
        elif os.path.isfile(args.add_photo_path):
            print('Uploading kitteh photo {path} to s3 bucket {bucket}...'.format(path=args.add_photo_path, bucket=BUCKET))
            upload_photo(args.add_photo_path)
            print('Upload complete')
    if args.remove_photo_path:
        if os.path.isdir(args.remove_photo_path):
            for item in os.listdir(args.remove_photo_path):
                file_path = os.path.join(args.remove_photo_path, item)
                if os.path.isfile(file_path):
                    print('Removing kitteh photo {path} from s3 bucket {bucket}...'.format(path=file_path, bucket=BUCKET))
                    remove_photo(file_path)
            print('Removal complete')
        elif os.path.isfile(args.remove_photo_path):
            print('Removing kitteh photo {path} from s3 bucket {bucket}...'.format(path=args.remove_photo_path, bucket=BUCKET))
            remove_photo(args.remove_photo_path)
        print('Removal complete')
