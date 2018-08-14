/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const IBMCloudEnv = require('ibm-cloud-env');
IBMCloudEnv.init();

const fs = require('fs');
const extend = require('extend');
const path = require('path');
const async = require('async');
const uuid = require('uuid');
const os = require('os');
const vcapServices = require('vcap_services');
const Canvas = require('canvas'),
    Image = Canvas.Image;
const request = require('sync-request');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const btoa = require("btoa");
const wml_credentials = new Map();

wml_service_credentials_url = "https://us-south.ml.cloud.ibm.com"
wml_service_credentials_username = "fd1bb242-1774-4c04-b6f3-16ac51076202"
wml_service_credentials_password = "ac3a781a-20db-48a6-ac2d-e4721da4d4c3"
scoring_end_point = "https://us-south.ml.cloud.ibm.com/v3/wml_instances/020680c1-6e8f-4514-81db-88e66d4739e2/deployments/e013582a-9f10-46f1-abcc-f6940ede3eef/online"

wml_credentials.set("url", wml_service_credentials_url);
wml_credentials.set("username", wml_service_credentials_username);
wml_credentials.set("password", wml_service_credentials_password);

const TEN_SECONDS = 10000;

/**
 * Parse a base 64 image and return the extension and buffer
 * @param  {String} imageString The image data as base65 string
 * @return {Object}             { type: String, data: Buffer }
 */
const parseBase64Image = (imageString) => {
  //console.log('image_string:', imageString);
  const matches = imageString.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
  const resource = {};
  //console.log('matches', matches);

  if (matches.length !== 3) {
    return null;
  }

  resource.type = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  resource.data = new Buffer(matches[2], 'base64');
  return resource;
};

function apiGet(url, username, password, loadCallback, errorCallback){
	const oReq = new XMLHttpRequest();
	const tokenHeader = "Basic " + btoa((username + ":" + password));
	const tokenUrl = url + "/v3/identity/token";

	oReq.addEventListener("load", loadCallback);
	oReq.addEventListener("error", errorCallback);
	oReq.open("GET", tokenUrl);
	oReq.setRequestHeader("Authorization", tokenHeader);
	oReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	oReq.send();
}

function apiPost(scoring_url, token, payload, loadCallback, errorCallback){
	const oReq = new XMLHttpRequest();
	oReq.addEventListener("load", loadCallback);
	oReq.addEventListener("error", errorCallback);
	oReq.open("POST", scoring_url);
	oReq.setRequestHeader("Accept", "application/json");
	oReq.setRequestHeader("Authorization", token);
	oReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	oReq.send(payload);
}


module.exports = (app) => {
  /**
   * Classifies an image
   * @param req.body.url The URL for an image either.
   *                     images/test.jpg or https://example.com/test.jpg
   * @param req.file The image file.
   */
  app.post('/api/classify', app.upload.single('images_file'), (req, res) => {
    //console.log('POST /api/classify', req.body);
    const params = {
      url: null,
      images_file: null,
      threshold: 0.5,
      classifier_ids: ['default', 'food'],
    };

    if (req.file) { // file image
      params.images_file = fs.createReadStream(req.file.path);
    } else if (req.body.url && req.body.url.indexOf('/images/samples') === 0) { // local image
      params.images_file = fs.createReadStream(path.join('public', req.body.url));
      file = path.join('public', req.body.url)
    } else if (req.body.image_data) {
      // write the base64 image to a temp file
      const resource = parseBase64Image(req.body.image_data);
      const temp = path.join(os.tmpdir(), `${uuid.v4()}.${resource.type}`);
      fs.writeFileSync(temp, resource.data);
      file = temp
      params.images_file = fs.createReadStream(temp);
    } else if (req.body.url) { // url
      params.url = req.body.url;
      var getres = request('GET', params.url);
      const temp = path.join(os.tmpdir(), `${uuid.v4()}`);
      fs.writeFileSync(temp, getres.getBody());
      file = temp
    } else { // malformed url
      return res.status(400).json({ error: 'Malformed URL', code: 400 });
    }

    fs.readFile(file,function(err, data){
      if (err) throw err;

      var img = new Image;
      img.src = data;
      var canvas = new Canvas(32, 32);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 32, 32);
      var imagedata = ctx.getImageData(0, 0, 32, 32);

      image = ''
      for(var y=0; y<32; y++){
        row = ''
        for(var x=0; x<32; x++){
          var index = (y*32+x)*4;
          pixel = '[' + imagedata.data[index]/255 + ',' + imagedata.data[index+1]/255 + ',' + imagedata.data[index+2]/255 + ']'
          row += pixel
          if(x != 31) row += ','
          else row = '[' + row + ']'
        }
        image += row
        if(y != 31) image += ','
        else image = '[' + image + ']'
      }
      payload_data = '{"values": [' + image + ']}'
      //console.log(payload_data)
    });

    apiGet(wml_credentials.get("url"),
    	wml_credentials.get("username"),
    	wml_credentials.get("password"),
    	function (res2) {
            let parsedGetResponse;
            try {
                parsedGetResponse = JSON.parse(this.responseText);
            } catch(ex) {
                // TODO: handle parsing exception
            }
            if (parsedGetResponse && parsedGetResponse.token) {
                const token = parsedGetResponse.token
                const wmlToken = "Bearer " + token;

                // NOTE: manually define and pass the array(s) of values to be scored in the next line
    			//const payload = '{"fields": [array_of_feature_columns], "values": [array_of_values_to_be_scored, another_array_of_values_to_be_scored]}';
          const payload = payload_data
          const scoring_url = scoring_end_point

                apiPost(scoring_url, wmlToken, payload, function (resp) {
                    let parsedPostResponse;
                    try {
                        parsedPostResponse = JSON.parse(this.responseText);
                    } catch (ex) {
                        // TODO: handle parsing exception
                    }
                    console.log("Scoring response");
                    //console.log(parsedPostResponse);
                    var result = {"images":[{"classifiers":[{"classifier_id":"default","name":"default","classes":[]}]}]}
                    var labels = ["Speed limit (20km/h)","Speed limit (30km/h)","Speed limit (50km/h)","Speed limit (60km/h)","Speed limit (70km/h)","Speed limit (80km/h)","End of speed limit (80km/h)","Speed limit (100km/h)","Speed limit (120km/h)","No passing","No passing for vehicles over 3.5 metric tons","Right-of-way at the next intersection","Priority road","Yield","Stop","No vehicles","Vehicles over 3.5 metric tons prohibited","No entry","General caution","Dangerous curve to the left","Dangerous curve to the right","Double curve","Bumpy road","Slippery road","Road narrows on the right","Road work","Traffic signals","Pedestrians","Children crossing","Bicycles crossing","Beware of ice/snow","Wild animals crossing","End of all speed and passing limits","Turn right ahead","Turn left ahead","Ahead only","Go straight or right","Go straight or left","Keep right","Keep left","Roundabout mandatory","End of no passing","End of no passing by vehicles over 3.5 metric tons"]

                    for(var i=0; i<labels.length;i++){
                      cls = {}
                      cls.class = labels[i]
                      cls.score = parsedPostResponse.values[0][i]
                      result.images[0].classifiers[0].classes.push(cls)
                    }
                    res.json(result)
                }, function (error) {
                    console.log(error);
                });
            } else {
                console.log("Failed to retrieve Bearer token");
            }
    	}, function (err) {
    		console.log(err);
    	});
  });
};
