const ThingSpeakClient = require('thingspeakclient');
const client = new ThingSpeakClient();
const writeKey: 'C5O8KWFR1R01PEDZ';
const readKey: 'C6087XH9Q9WXBV5O';
const channelId: 432138;


client.attachChannel(thingSpeakConfig.channelId, 
    {writeKey:thingSpeakConfig.writeKey, 
    readKey:thingSpeakConfig.readKey}, 
        (errAttachChannel,resAttachChennel) => {
                if(!errAttachChannel){
                    client.updateChannel(thingSpeakConfig.channelId, {field1: temp, field2: humidity, field3: pressure}, (updateErr,updateRes) => {
                    console.log('<ThingSpeak> Data posted to ThingSpeak at', new Date().toLocaleString());
                            });  
                }
        }
);
  





