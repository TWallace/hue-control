### Installation
git clone https://github.com/tmwllc/hue-control.git

npm install

### Usage
You'll need to get the api key for your Philips Smart Bridge, and the IP address of it. You'll send these values in the headers for each request. To start server run:
```node src/app.js```. By default, this will start the server on port 3001, but this can be changed vis app.js. 

Each API call will require these headers:
```
{
  apikey: YOUR_HUE_API_KEY,
  hueip: YOUR_HUE_SMART_BRIDGE_IP
}
```

#### Get Lights
Make a GET request to:
``` http://localhost:3001/getLights```

#### Set Light 
Make a POST request to:
``` http://localhost:3001/setLightState``` and pass a body like this:
```
{
    "lights": ["Light 1", "Light 2", "Light 3"],
    "colors": [
        [0.67, 0.32],
        [0.48, 0.20],
        [0.28, 0.10],
        [0.17, 0.15],
        [0.15, 0.20],
        [0.16, 0.35],
        [0.17, 0.65],
        [0.28, 0.63],
        [0.40, 0.54],
        [0.57, 0.40]
    ],
    "transitionTime": 10000,
    "lightHoldTime: 10000,
    "synchronized": false
}
```
The colors listed above are along the edges of the gamuts available for Hue lights, as seen here: https://developers.meethue.com/documentation/core-concepts#color_gets_more_complicated. These colors are listed sequentially in a clockwise direction starting with red on the bottom right of the gamuts. This app will rotate colors sequentially through the colors array. The given list above will ensure that colors transition from one highly saturated color to another, without transitioning over the white section in the middle of the gamut.

When this endpoint is called, it selects a random color from the colors array and assigns that to each light. It will not select the same color for any light, unless you specify synchonized as true, in which case all lights will select the same color.

##### Params
- lights - array of light names which you want to affect
- colors - Array of colors. Each value is an array of x/y coordinates. x is first, y is second.
- transitionTime - Time in milliseconds for changing from one color to the next.
- lightHoldTime - How long in milliseconds for the light to stay on each color.
- synchronized - Forces all lights to use the same color at the same time.

### Roadmap
- Add error handling to ensure headers are passed in
