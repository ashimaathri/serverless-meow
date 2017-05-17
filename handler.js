'use strict';

let AWS = require('aws-sdk');
let dynamoDB = new AWS.DynamoDB.DocumentClient();

let TABLE_NAME = 'KittehPhotoList';
let BUCKET_NAME = 'ashima-serverless-meows';
let search_params = { TableName: TABLE_NAME, Key: { id: '1' } };

module.exports.select_kitteh = (event, context) => {
  let record = event.Records[0];
  let entry = null;

  dynamoDB.get(search_params, (err, data) => {
    if (err) {
      console.log(`Error retrieving item: ${err}`);
    } else {
      entry = data;

      switch(record.eventName) {
        case 'ObjectCreated:Put':
          let add_photo_list = (entry.Item && entry.Item.photo_list) || [];
          add_photo_list.push(record.s3.object.key);

          let add_params = {
            TableName: TABLE_NAME,
            Item: { id: '1', photo_list: add_photo_list }
          };

          dynamoDB.put(add_params, (err, data) => {
            if (err) {
              console.log(`Error putting item: ${err}`);
            } else {
              console.log(`${record.s3.object.key} was added to dynamoDB`);
            }
          });

          break;

        case 'ObjectRemoved:Delete':
          let delete_photo_list = entry.Item.photo_list;
          let deleted_image_index = delete_photo_list.indexOf(record.s3.object.key);

          delete_photo_list.splice(deleted_image_index, 1);

          let delete_params = {
            TableName: TABLE_NAME,
            Item: { id: '1', photo_list: delete_photo_list }
          };

          dynamoDB.put(delete_params, (err, data) => {
            if (err) {
              console.log(`Error removing item: ${err}`);
            } else {
              console.log(`${record.s3.object.key} was removed from dynamoDB`);
            }
          });

          break;

        default:
          console.log(`${record.eventName} could not be processed`);
      }
    }
  });
};

module.exports.hello_kitteh = (event, context, callback) => {
  dynamoDB.get(search_params, (err, data) => {
    if (err) {
      console.log(`Error retrieving item: ${err}`);
      callback(err);
    } else {
      let photo_list = (data.Item && data.Item.photo_list) || []
      let links_list = photo_list.map((photo_name) => {
        return `https://s3.us-east-2.amazonaws.com/${BUCKET_NAME}/${photo_name}`
      });
      let response = {
        statusCode: 200,
        body: JSON.stringify({
          message: links_list 
        })
      };
      callback(null, response);
    }
  });
};
