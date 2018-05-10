import matlab.net.*
import matlab.net.http.*
r = RequestMessage;
darkSkyForecastApiURL = URI('https://api.darksky.net/forecast/077e9a5e77f09466a7e8a6e1bc0cffa5/49.224317,16.577616?units=si');
darkSkyForecast = send(r,darkSkyForecastApiURL);
readChannelID = 432138;    % Channel ID to read data from  
readAPIKey = 'C6087XH9Q9WXBV5O'; % Channel Read API Key
writeAPIKey = 'C5O8KWFR1R01PEDZ'; % Channel Write API Key

% load data for analyse
[data,time] = thingSpeakRead(readChannelID,'Fields',[1,2,3],'NumDays',1,'ReadKey',readAPIKey);
temp = data(:,1);
hum = data(:,2);
pressure = data(:,3);
% actual values
lastMeasureDate = time(length(time));
actualTemp = temp(length(temp));
actualHum = hum(length(hum));
% edit time to right time zone
timeNow = datetime('now','TimeZone','Europe/Zurich');
UTChoursDiff = hour(timeNow) - hour(datetime('now'));
time = time + hours(UTChoursDiff);
% calculated actual values
actualDewPoint = dewpoint(actualTemp,actualHum);
% meteo values behavior
if length(time) > 139 
    analyseStatus = 1;
    [pressureShortAscent,pressurelongAscent]= dataTrend(pressure,time);
    pressUnder1000 = pressureUnder1000(pressure);
    for i = 1:length(temp)
        dewpoints(i) = dewpoint(temp(i),hum(i));
    end
    [dewpointShortAscent,dewpointlongAscent]= dataTrend(dewpoints,time);
    %diffAvgTempandDewPointEvening = differenceAvgTempAndDewPoint(temp,actualDewPoint,lastMeasureDate,time);
    dewPointOver17C = isDewPointOver17C(actualDewPoint);
    dewPointIncrease = dewPointIncreaseBy6CIn12Hours(dewpoints);
    dewPointUnder0 = isDewPointUnder0C(actualDewPoint);
    %[windSpeed,windDirection] = getWindInfo(darkSkyForecast);
    morningTempOver20 = isMorningTempOver20(temp,time);
    pressureFloatingAround1013 = isPressureFloatingAround1013(pressure,time,lastMeasureDate);
    pressureConstant = constantPressure(pressure);
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    % weather forecast evaluation
    dewpoint_pressureForecast = dewpointPressureForecastEval(dewpointlongAscent,pressurelongAscent);
    tempForecast = tempForecastEval(morningTempOver20);
    dewpoint_tempForecast = dewpointTempForecastEval(dewPointIncrease,dewPointOver17C,dewPointUnder0);
    pressureForecast = pressureForecastEval(pressurelongAscent,pressureFloatingAround1013,pressUnder1000,pressureConstant);
    forecast = jsonencode(struct('status',1,'dewpoint_pressure',dewpoint_pressureForecast,'temp',tempForecast,'dewpoint_temp',dewpoint_tempForecast,'pressure',pressureForecast))
else
    analyseStatus = 0;    
end

%forecastSave  = thingSpeakWrite(analyseStatus,'Fields',[1],'Values',{forecast},'WriteKey','J98WHAKCGFR0GLS8')

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% FUNCTION TO CALCULATE DATA FOR WEATHER FORECAST
% function to get actual wind direction and speed from DarkSky
function [windSpeed,windDirection] = getWindInfo(darkSkyForecast)   
    windSpeed = darkSkyForecast.Body.Data.currently.windSpeed;
    direction =  darkSkyForecast.Body.Data.currently.windBearing;
    if (22.6<=direction && direction<=67.5)
        windDirection = 'NE';
    elseif (67.6<=direction && direction<=112.5) 
        windDirection = 'E';
    elseif (112.6<=direction && direction<=157.5)
        windDirection = 'SE';
    elseif (157.6<=direction && direction<=202.5) 
        windDirection = 'S';
    elseif (202.6<=direction && direction<=247.5) 
        windDirection = 'SW';
    elseif (247.6<=direction && direction<=292.5) 
        windDirection = 'W';
    elseif (292.5<=direction && direction<=337.5) 
        windDirection = 'NW'; 
    else
        windDirection = 'N';
    end
end

%function to determine trend of data history
function [shortTerm,longTerm] = dataTrend(data,t)
    dataLastHour = data(length(data)-5:length(data));
    if dataLastHour(6) > dataLastHour(1)
        shortTerm = 1;
    else 
        shortTerm = 0;
    end
    [longMax,longMaxIndex] = max (data);
    [longMin,longMinIndex] = min (data);
    if t(longMaxIndex) > t(longMinIndex)
        longTerm = 1;
    else
        longTerm = 0;
    end
end

% function to determine constant trend of pressure data history
function constantTrend = constantPressure(data)
    dataLast12Hours = data(length(data)-70:length(data));    
    longMax = max(dataLast12Hours);
    longMin = min(dataLast12Hours);
    maxDiff = longMax - longMin;
    if maxDiff>1.5
        constantTrend = 0; 
    else
        constantTrend = 1;
    end
end

% function to determine if the pressure was under 1000hPa in last hour
function pressureLess1000 = pressureUnder1000(press)
    pressureLastHour = press(length(press)-5:length(press));
    if length(find(pressureLastHour<1000)) > 0
        pressureLess1000 = 1; 
    else
        pressureLess1000 = 0;
    end
end

% function to determine if the air pressure in last 3 hours float by value 1013.3
function pressureFloatingAround1013 = isPressureFloatingAround1013(pressure,time,lastMeasureDate)
    lastHourMeasure = hour(lastMeasureDate);
    hours = hour(time);
    index = find( (lastHourMeasure < hours) | (hours >= (lastHourMeasure-1)) );
    if (1013.2 <= mean(pressure(index))) && (mean(pressure(index))<=1013.4)
        pressureFloatingAround1013 = 1;
    else
        pressureFloatingAround1013 = 0;
    end
        
end

% function to calculate dew point from actual temperature and humidity
function dp = dewpoint(temperature,humidity)
    dp = (243.5*log((humidity/100)*exp((17.67*temperature)/(243.5+temperature)))) / (17.67 - log((humidity/100) * exp((17.67*temperature)/(243.5+temperature)))); 
end

% function which calculates difference between evening dew point and  today average temperature
function diffAvgDayTempDewP = differenceAvgTempAndDewPoint(temp,actualDewPoint,lastMeasureDate,time)
    if(18 < hour(lastMeasureDate) < 24)
        hours = hour(time);
        index = find( (7 < hours) & (hours< 19) );
        avgDayTemp = mean(temp(index))
        diffAvgDayTempDewP = avgDayTemp - actualDewPoint;
    end
end

% function to determine if the dewpoint is over 17 C
function dewPointOver17 = isDewPointOver17C(actualDewPoint)
    if(actualDewPoint > 17)
        dewPointOver17 = 1;
    else
        dewPointOver17 = 0;
    end
end

% function to determine if the dewpoint is under 0 C
function dewPointUnder0 = isDewPointUnder0C(actualDewPoint)
    if(actualDewPoint < 0)
        dewPointUnder0 = 1;
    else
        dewPointUnder0 = 0;
    end
end

% function to determine if the dewpoint increased by 6 C in last 12 hours
function dPIB6Ci12hrs = dewPointIncreaseBy6CIn12Hours(dewpoints)
    l = length(dewpoints);
    dewPMax = max (dewpoints(l/2:l));
    dewPMin = min (dewpoints(l/2:l));
    if( (dewPMax - dewPMin) >= 6  )
        dPIB6Ci12hrs = 1;
    else
        dPIB6Ci12hrs = 0;
    end  
end

% function to determine if morning temperature between 05:00 - 09:00 was higher than 20 C
function morningHighTemp = isMorningTempOver20(temp,time)
    hours = hour(time);
    index = find( (5 < hours) & (hours< 9) );
    morningTemps = temp(index);
    if length(find( morningTemps >= 20 ))
        morningHighTemp = 1;
    else
        morningHighTemp = 0;
    end
end
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% FUNCTIONS TO EVALUATE MEASURED WEATHER DATA AND CREATE WEATHER FORECAST

% function to evaluate weather forecast depending on temperature
function tempForecast = tempForecastEval(morningTempOver20)
    tForecastObj = jsonencode(struct('hotday',0));    
    tForecastObj = jsondecode(tForecastObj);  
    hourNow = hour(datetime('now','TimeZone','Europe/Zurich'));
    startOfDay = (5 <= hourNow) && (hourNow <= 9);
    if morningTempOver20 & startOfDay
        tempForecast = jsonencode(struct('hotday',1));
    end
    tempForecast = tForecastObj;
end

% function to evaluate weather forecast depending on dewpoint and temperature
function dewpointTempForecast = dewpointTempForecastEval(dewPointIncrease,dewPointOver17C,dewPointUnder0)
dtForecastObj = jsonencode(struct('stormChance',0,'stormCertainty',0,'nightFrost',0));    
dtForecastObj = jsondecode(dtForecastObj);    
    if dewPointOver17C
        dtForecastObj(1).stormChance = 1;
    end
    if dewPointUnder0
        dtForecastObj(1).nightFrost = 1;       
    end
    if dewPointIncrease
        dtForecastObj(1).stormCertainty = 1;        
    end
    dewpointTempForecast = dtForecastObj;
end

% function to evaluate weather forecast depending on air pressure
function pressureForecast = pressureForecastEval(pressurelongAscent,pressureFloatingAround1013,pressUnder1000,pressureConstant)
    prForecastObj = jsonencode(struct('stableWeather',0,'worseningWeather',0,'rainOrStorm',0));    
    prForecastObj = jsondecode(prForecastObj);
    if pressurelongAscent | pressureConstant
        prForecastObj(1).stableWeather = 1;
    end
    if pressUnder1000
        prForecastObj(1).worseningWeather = 1;
    end
    if (pressurelongAscent==0 & pressureConstant==0) | pressureFloatingAround1013
        prForecastObj(1).rainOrStorm = 1;
    end
    pressureForecast = prForecastObj;
end

% function to evaluate weather forecast depending on dewpoint and pressure
function dewpointPressureForecast = dewpointPressureForecastEval(dewpointlongAscent,pressurelongAscent)
    dpPForecastObj = jsonencode(struct('warmup',0,'cooldownweatherImprove',0,'cooldownslightly',0,'warmupweatherWorsening',0));    
    dpPForecastObj = jsondecode(dpPForecastObj);
    if dewpointlongAscent
        if pressurelongAscent
            dpPForecastObj(1).warmup = 1;
           
        else
            dpPForecastObj(1).warmupweatherWorsening = 1;           
        end
    else
        if pressurelongAscent
            dpPForecastObj(1).cooldownweatherImprove = 1;            
        else
            dpPForecastObj(1).cooldownslightly = 1;       
        end
    end
    dewpointPressureForecast = dpPForecastObj;
end