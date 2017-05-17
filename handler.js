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
      let random_photo = photo_list[Math.floor(Math.random() * photo_list.length)];
      let random_photo_link =  `https://s3.us-east-2.amazonaws.com/${BUCKET_NAME}/${random_photo}`
      let response = `
      <html>
        <head>
          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" integrity="sha384-rwoIResjU2yc3z8GV/NPeZWAv56rSmLldC3R/AZzGRnGxQQKnKkoFVhFQhNUwEyJ" crossorigin="anonymous">
          <title>Serverless Meow</title>
        </head>
        <body style="background-color:#faebd7;">
          <div class="container-fluid">
            <div class="row">
              <div class="col-4"></div>
              <div class="col-4">
                <h1 class="text-center"> Serverless Meow! </h1>
                <br><br><br><br>
              </div>
              <div class="col-4"></div>
            </div>
            <div class="row">
              <div class="col-3"></div>
              <div class="col-6">
                <img src=${random_photo_link} alt=${random_photo} class="center-block img-thumbnail">
              </div>
              <div class="col-3"></div>
            </div>
          </div>
          <script src="https://code.jquery.com/jquery-3.1.1.slim.min.js" integrity="sha384-A7FZj7v+d/sdmMqp/nOQwliLvUsJfDHW+k9Omg/a/EheAdgtzNs3hpfag6Ed950n" crossorigin="anonymous"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/tether/1.4.0/js/tether.min.js" integrity="sha384-DztdAPBWPRXSA/3eYEEUWrWCy7G5KFbe8fFjk5JAIxUYHKkDx6Qin1DkWx51bBrb" crossorigin="anonymous"></script>
          <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/js/bootstrap.min.js" integrity="sha384-vBWWzlZJ8ea9aCX4pEW3rVHjgjt7zpkNpZk+02D9phzyeVkE+jo0ieGizqPLForn" crossorigin="anonymous"></script>
          </body>
        </html>`
      callback(null, response);
    }
  });
};
