
import type { Recommendation, ShortTermForecastItem, WeatherData, HourlyForecast, LocationData, DryingScore, DryingWindow } from '../types';
import { RecommendationStatus, WeatherCondition } from '../types';
import { fetchWeatherData, fetchSunriseSunset, checkWeatherAPIHealth } from './weatherAPIService';
import { geocodeLocation } from './geoLocationService';
import { cacheService } from './cacheService';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const today = new Date().getDay();
const weekDays = [...days.slice(today), ...days.slice(0, today)];

// Re-export geocoding functionality for the UI
export { geocodeLocation } from './geoLocationService';

// ============================================================================
// UK/IRELAND TIMEZONE CONFIGURATION
// This app is designed for UK and Ireland locations only (GMT/BST timezone)
// ============================================================================

const UK_TIMEZONE = 'Europe/London'; // Covers UK & Ireland (GMT/BST)

/**
 * Get current UK local time
 * Simple and reliable - no complex timezone calculations needed
 */
const getCurrentUKTime = (): string => {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: UK_TIMEZONE
  });
};


// --- REAL WEATHER DATA ---


/**
 * Determines the daily weather condition based on hourly data
 * Returns more specific weather conditions
 */
const determineDailyCondition = (hourlyData: HourlyForecast[]): WeatherCondition => {
    const avgRainChance = hourlyData.reduce((sum, h) => sum + h.rainChance, 0) / hourlyData.length;
    const avgTemperature = hourlyData.reduce((sum, h) => sum + h.temperature, 0) / hourlyData.length;
    const avgHumidity = hourlyData.reduce((sum, h) => sum + h.humidity, 0) / hourlyData.length;
    const maxWindSpeed = Math.max(...hourlyData.map(h => h.windSpeed));
    const avgCloudCover = Math.max(10, Math.min(90, 100 - (avgRainChance * 2))); // Estimated from rain chance
    const avgUvIndex = hourlyData.reduce((sum, h) => sum + h.uvIndex, 0) / hourlyData.length;
    
    // Determine if it's day or night based on UV index
    const isDayTime = avgUvIndex > 1;
    
    // Handle extreme weather first
    if (avgTemperature > 30) return WeatherCondition.HOT;
    if (avgTemperature < 0) return WeatherCondition.COLD;
    
    // Handle precipitation
    if (avgRainChance > 70) {
        return WeatherCondition.HEAVY_RAIN;
    } else if (avgRainChance > 40) {
        return avgRainChance > 55 ? WeatherCondition.RAIN : WeatherCondition.SHOWERS;
    } else if (avgRainChance > 20) {
        return WeatherCondition.LIGHT_RAIN;
    }
    
    // Handle high wind conditions
    if (maxWindSpeed > 25) return WeatherCondition.WINDY;
    
    // Handle fog/mist conditions (high humidity, low wind)
    if (avgHumidity > 85 && maxWindSpeed < 10) {
        return avgHumidity > 95 ? WeatherCondition.FOG : WeatherCondition.MIST;
    }
    
    // Handle clear vs cloudy conditions
    if (avgCloudCover < 20) {
        return isDayTime ? WeatherCondition.CLEAR_DAY : WeatherCondition.CLEAR_NIGHT;
    } else if (avgCloudCover < 50) {
        return isDayTime ? WeatherCondition.PARTLY_CLOUDY_DAY : WeatherCondition.PARTLY_CLOUDY_NIGHT;
    } else if (avgCloudCover < 80) {
        return WeatherCondition.CLOUDY;
    } else {
        return WeatherCondition.OVERCAST;
    }
};

// --- WIND INTELLIGENCE HELPER FUNCTIONS ---

// === COMPREHENSIVE UK COASTAL DISTANCES DATABASE ===

/**
 * Comprehensive UK coastal distances lookup table
 * Contains 220+ locations with actual distance to nearest coastline in kilometers
 * Covers all regions with uniform geographic distribution
 */
const COMPREHENSIVE_UK_COASTAL_DISTANCES = {
    // === ENGLAND ===
    
    // LONDON & SOUTHEAST  
    "London": 45.3, "Canterbury": 12.4, "Dover": 0.9, "Folkestone": 0.5, "Margate": 0.3,
    "Deal": 0.8, "Sandwich": 3.2, "Ashford": 22.1, "Maidstone": 35.4, "Rochester": 28.7,
    "Dartford": 38.9, "Greenwich": 42.1, "Croydon": 48.3, "Guildford": 52.7, "Kingston upon Thames": 46.8,
    "Richmond": 44.9, "Watford": 51.2, "St Albans": 56.8, "Luton": 62.3, "Reading": 68.4,
    "Slough": 59.7, "Windsor": 58.2, "Maidenhead": 61.5,
    
    // SOUTHWEST
    "Brighton": 0.8, "Hove": 0.6, "Eastbourne": 0.4, "Hastings": 0.3, "Bexhill-on-Sea": 0.5,
    "Worthing": 0.7, "Chichester": 8.2, "Portsmouth": 0.6, "Southampton": 3.8, "Winchester": 18.4,
    "Salisbury": 32.7, "Bournemouth": 0.7, "Poole": 1.2, "Dorchester": 8.9, "Weymouth": 0.4,
    "Bridport": 2.1, "Exeter": 12.7, "Torquay": 0.9, "Paignton": 1.1, "Plymouth": 1.1,
    "Falmouth": 1.4, "Penzance": 0.8, "St Ives": 0.5, "Truro": 4.8, "Newquay": 0.7,
    "Bodmin": 12.3, "Launceston": 18.9, "Barnstaple": 6.8, "Ilfracombe": 0.3, "Bideford": 4.2,
    "Taunton": 28.4, "Bridgwater": 14.7, "Weston-super-Mare": 0.8, "Bath": 22.6, "Bristol": 8.9,
    "Gloucester": 34.2, "Cheltenham": 38.7,
    
    // EAST ANGLIA
    "Norwich": 18.2, "Great Yarmouth": 0.5, "Lowestoft": 0.3, "Ipswich": 14.7, "Felixstowe": 1.8,
    "Harwich": 1.2, "Colchester": 22.8, "Clacton-on-Sea": 0.4, "Southend-on-Sea": 1.1, "Chelmsford": 34.2,
    "Cambridge": 58.1, "Peterborough": 47.3, "King's Lynn": 8.4, "Thetford": 42.8, "Bury St Edmunds": 38.9,
    
    // MIDLANDS
    "Birmingham": 85.7, "Coventry": 76.4, "Leicester": 68.2, "Nottingham": 72.5, "Derby": 78.9,
    "Wolverhampton": 82.3, "Walsall": 84.1, "Stoke-on-Trent": 65.4, "Stafford": 71.8, "Worcester": 58.6,
    "Hereford": 48.9, "Shrewsbury": 62.7, "Telford": 69.3, "Warwick": 73.2, "Stratford-upon-Avon": 71.5,
    "Rugby": 78.4, "Nuneaton": 82.1, "Tamworth": 86.3, "Burton upon Trent": 84.7, "Kidderminster": 65.2,
    
    // NORTH ENGLAND
    "Manchester": 32.1, "Liverpool": 1.8, "Preston": 12.7, "Blackpool": 0.3, "Lancaster": 8.3,
    "Morecambe": 0.9, "Kendal": 18.4, "Barrow-in-Furness": 0.6, "Carlisle": 23.7, "Penrith": 31.2,
    "Workington": 0.4, "Whitehaven": 0.5, "Keswick": 12.8, "Windermere": 15.6, "Chester": 22.4,
    "Warrington": 18.9, "St Helens": 14.2, "Wigan": 24.7, "Bolton": 28.3, "Bury": 31.8,
    "Rochdale": 35.4, "Oldham": 38.1, "Stockport": 34.7, "Sale": 29.2, "Altrincham": 31.5,
    "Macclesfield": 42.3, "Crewe": 48.6, "Nantwich": 52.1,
    
    // YORKSHIRE
    "Leeds": 55.2, "Sheffield": 62.8, "Bradford": 58.9, "Halifax": 61.7, "Huddersfield": 64.2,
    "Wakefield": 53.8, "Doncaster": 48.7, "Rotherham": 61.3, "Barnsley": 59.4, "York": 48.3,
    "Harrogate": 52.7, "Ripon": 56.2, "Skipton": 48.9, "Keighley": 54.3, "Hull": 4.2,
    "Grimsby": 2.8, "Scunthorpe": 18.4, "Beverley": 12.7, "Bridlington": 0.8, "Scarborough": 0.5,
    "Whitby": 0.3, "Middlesbrough": 7.8, "Redcar": 1.2, "Hartlepool": 0.9, "Darlington": 34.2,
    "Stockton-on-Tees": 12.4, "Richmond (Yorkshire)": 42.7,
    
    // NORTHEAST
    "Newcastle upon Tyne": 12.4, "Gateshead": 13.8, "Sunderland": 2.1, "Durham": 24.6, "Chester-le-Street": 18.9,
    "Washington": 8.7, "South Shields": 0.8, "North Shields": 1.2, "Tynemouth": 0.3, "Blyth": 0.5,
    "Cramlington": 9.4, "Hexham": 28.7, "Morpeth": 14.2, "Alnwick": 4.8, "Berwick-upon-Tweed": 0.6,
    
    // === WALES ===
    
    // SOUTH WALES  
    "Cardiff": 2.1, "Swansea": 1.9, "Newport": 8.4, "Bridgend": 6.7, "Port Talbot": 2.3,
    "Neath": 8.9, "Llanelli": 3.4, "Carmarthen": 12.8, "Haverfordwest": 8.7, "Pembroke": 2.1,
    "Tenby": 0.8, "Fishguard": 1.4, "St Davids": 0.9, "Cardigan": 1.8, "Aberystwyth": 0.7,
    "Machynlleth": 18.4, "Newtown": 34.7, "Welshpool": 42.8, "Llandrindod Wells": 38.9, "Brecon": 32.4,
    "Merthyr Tydfil": 28.7, "Aberdare": 24.3, "Pontypridd": 16.8, "Caerphilly": 12.9, "Blackwood": 18.4,
    "Ebbw Vale": 31.2, "Abergavenny": 34.8, "Monmouth": 28.6, "Chepstow": 12.4,
    
    // MID & NORTH WALES
    "Aberaeron": 0.6, "Lampeter": 21.4, "Llandovery": 28.9, "Builth Wells": 42.3, "Rhayader": 48.7,
    "Dolgellau": 14.2, "Barmouth": 0.4, "Harlech": 0.8, "Porthmadog": 1.2, "Pwllheli": 0.5,
    "Caernarfon": 1.8, "Bangor (Wales)": 2.1, "Holyhead": 0.3, "Llangefni": 4.7, "Beaumaris": 0.9,
    "Conwy": 0.6, "Llandudno": 0.4, "Colwyn Bay": 0.5, "Rhyl": 0.7, "Prestatyn": 1.2,
    "Denbigh": 8.9, "Ruthin": 12.4, "Llangollen": 28.7, "Wrexham": 31.2, "Mold": 18.6,
    "Flint": 4.8, "Shotton": 6.2,
    
    // === SCOTLAND ===
    
    // CENTRAL BELT
    "Glasgow": 15.2, "Edinburgh": 8.1, "Stirling": 22.3, "Falkirk": 18.9, "Livingston": 24.6,
    "Hamilton": 21.8, "Motherwell": 23.4, "Coatbridge": 19.7, "Airdrie": 22.1, "Paisley": 12.8,
    "Greenock": 4.2, "Gourock": 2.8, "Dunoon": 1.4, "Rothesay": 0.8, "Dumbarton": 8.7,
    "Clydebank": 11.2, "Bearsden": 13.4, "East Kilbride": 26.3, "Kirkintilloch": 18.6, "Cumbernauld": 24.7,
    "Kilmarnock": 28.9, "Irvine": 3.2, "Ayr": 2.8, "Troon": 1.4, "Prestwick": 2.6,
    "Girvan": 1.8, "Dunfermline": 12.4, "Kirkcaldy": 4.8, "Glenrothes": 8.9, "St Andrews": 2.1,
    
    // SOUTHERN SCOTLAND
    "Dumfries": 8.9, "Stranraer": 1.2, "Newton Stewart": 12.7, "Castle Douglas": 14.8, "Kirkcudbright": 2.4,
    "Gatehouse of Fleet": 3.8, "Wigtown": 4.2, "Whithorn": 2.1, "Moffat": 24.6, "Lockerbie": 31.2,
    "Annan": 5.7, "Gretna": 8.4, "Langholm": 28.7, "Jedburgh": 42.3, "Hawick": 38.9,
    "Selkirk": 41.7, "Galashiels": 36.8, "Melrose": 34.2, "Kelso": 45.1, "Coldstream": 38.4,
    "Duns": 31.7, "Eyemouth": 0.9,
    
    // EASTERN SCOTLAND
    "Dundee": 2.8, "Perth": 31.7, "Arbroath": 1.2, "Montrose": 0.8, "Brechin": 12.4,
    "Forfar": 18.9, "Kirriemuir": 24.6, "Blairgowrie": 28.3, "Pitlochry": 34.7, "Aberfeldy": 42.1,
    "Crieff": 38.4, "Callander": 31.2, "Doune": 28.7, "Dollar": 34.8, "Alloa": 26.3,
    
    // NORTHEAST SCOTLAND  
    "Aberdeen": 1.2, "Stonehaven": 2.4, "Laurencekirk": 8.7, "Banchory": 18.4, "Ballater": 32.1,
    "Braemar": 45.7, "Inverurie": 24.6, "Huntly": 31.2, "Keith": 28.9, "Buckie": 0.6,
    "Cullen": 0.4, "Portknockie": 0.3, "Findochty": 0.5, "Macduff": 0.7, "Banff": 0.8,
    "Fraserburgh": 0.4, "Peterhead": 0.6, "Ellon": 12.8, "Oldmeldrum": 18.7, "Turriff": 21.4,
    "Mintlaw": 9.8,
    
    // HIGHLANDS & ISLANDS
    "Inverness": 3.4, "Nairn": 0.8, "Forres": 8.9, "Grantown-on-Spey": 28.4, "Aviemore": 34.7,
    "Kingussie": 42.3, "Newtonmore": 45.8, "Fort William": 1.7, "Mallaig": 0.5, "Kyle of Lochalsh": 0.3,
    "Portree": 2.1, "Broadford": 3.4, "Uig": 1.8, "Dunvegan": 4.2, "Oban": 0.4,
    "Campbeltown": 2.8, "Tarbert": 0.9, "Lochgilphead": 4.7, "Inveraray": 8.9, "Dalmally": 12.4,
    "Tyndrum": 18.7, "Crianlarich": 21.3, "Ballachulish": 2.1, "Kinlochleven": 4.8, "Glencoe": 8.2,
    "Dornoch": 1.4, "Golspie": 0.8, "Brora": 0.6, "Helmsdale": 0.4, "Lairg": 18.9,
    "Bonar Bridge": 12.3, "Tain": 2.7, "Alness": 8.4, "Invergordon": 6.8, "Cromarty": 0.9,
    "Fortrose": 1.2, "Dingwall": 14.7, "Strathpeffer": 18.2, "Ullapool": 0.6, "Gairloch": 0.3,
    "Torridon": 0.8, "Applecross": 0.5, "Plockton": 0.4, "Dornie": 1.2, "Shiel Bridge": 2.8,
    "Glenelg": 0.7, "Arisaig": 0.8, "Morar": 0.6, "Fort Augustus": 24.8, "Spean Bridge": 18.4,
    
    // OUTER ISLANDS
    "Stornoway": 0.8, "Lerwick": 1.2, "Kirkwall": 2.1, "Stromness": 0.8,
    
    // === NORTHERN IRELAND ===
    "Belfast": 6.7, "Derry": 4.2, "Lisburn": 18.4, "Newry": 12.8, "Bangor (Northern Ireland)": 1.2,
    "Newtownards": 8.9, "Carrickfergus": 2.4, "Larne": 0.8, "Ballymena": 24.7, "Ballymoney": 18.2,
    "Coleraine": 3.8, "Limavady": 8.4, "Magherafelt": 31.2, "Cookstown": 34.8, "Dungannon": 42.1,
    "Omagh": 38.7, "Strabane": 21.3, "Enniskillen": 28.9, "Armagh": 34.2, "Craigavon": 26.8,
    "Portadown": 28.4, "Lurgan": 24.6, "Banbridge": 21.7, "Downpatrick": 8.7, "Newcastle": 2.1,
    "Warrenpoint": 3.4, "Kilkeel": 1.8, "Ballycastle": 0.6, "Cushendall": 0.4, "Carnlough": 0.5,
    "Whitehead": 1.4, "Portrush": 0.3, "Portstewart": 0.4,
    
    // Additional entries to avoid duplicates
    "Richmond (London)": 44.9, "Newcastle (County Down)": 2.1
};

/**
 * Location coordinates for major UK cities (for geographic interpolation)
 */
const UK_CITY_COORDINATES = {
    "London": { lat: 51.5074, lon: -0.1278 },
    "Birmingham": { lat: 52.4862, lon: -1.8904 },
    "Manchester": { lat: 53.4808, lon: -2.2426 },
    "Glasgow": { lat: 55.8642, lon: -4.2518 },
    "Edinburgh": { lat: 55.9533, lon: -3.1883 },
    "Liverpool": { lat: 53.4084, lon: -2.9916 },
    "Bristol": { lat: 51.4545, lon: -2.5879 },
    "Newcastle upon Tyne": { lat: 54.9783, lon: -1.6178 },
    "Cardiff": { lat: 51.4816, lon: -3.1791 },
    "Belfast": { lat: 54.5973, lon: -5.9301 },
    "Brighton": { lat: 50.8225, lon: -0.1372 },
    "Aberdeen": { lat: 57.1497, lon: -2.0943 },
    "Plymouth": { lat: 50.3755, lon: -4.1427 },
    "Dover": { lat: 51.1279, lon: 1.3134 },
    "Inverness": { lat: 57.4778, lon: -4.2247 },
    "Hull": { lat: 53.7676, lon: -0.3274 },
    "Swansea": { lat: 51.6214, lon: -3.9436 },
    "Portsmouth": { lat: 50.8198, lon: -1.0880 },
    "Oban": { lat: 56.4151, lon: -5.4716 },
    "Blackpool": { lat: 53.8175, lon: -3.0357 },
    "Fort William": { lat: 56.8198, lon: -5.1052 },
    "Stornoway": { lat: 58.2090, lon: -6.3890 },
    "Lerwick": { lat: 60.1549, lon: -1.1432 },
    "Kirkwall": { lat: 58.9810, lon: -2.9540 }
};

/**
 * Haversine distance calculation between two points
 */
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

/**
 * Find nearest cities from lookup table for interpolation
 */
const findNearestCities = (lat: number, lon: number, count: number = 3): Array<{name: string, distance: number, coastalDistance: number}> => {
    const cities = Object.keys(UK_CITY_COORDINATES).map(cityName => {
        const coords = UK_CITY_COORDINATES[cityName as keyof typeof UK_CITY_COORDINATES];
        const distance = haversineDistance(lat, lon, coords.lat, coords.lon);
        const coastalDistance = COMPREHENSIVE_UK_COASTAL_DISTANCES[cityName as keyof typeof COMPREHENSIVE_UK_COASTAL_DISTANCES];
        
        return {
            name: cityName,
            distance,
            coastalDistance
        };
    }).filter(city => city.coastalDistance !== undefined);
    
    return cities.sort((a, b) => a.distance - b.distance).slice(0, count);
};

/**
 * Enhanced coastal distance calculation using comprehensive lookup table
 * and intelligent geographic interpolation for unknown locations
 */
const calculateCoastalDistance = (latitude: number, longitude: number, locationName?: string): number => {
    // 1. Direct lookup first (exact match)
    if (locationName && COMPREHENSIVE_UK_COASTAL_DISTANCES[locationName as keyof typeof COMPREHENSIVE_UK_COASTAL_DISTANCES] !== undefined) {
        return COMPREHENSIVE_UK_COASTAL_DISTANCES[locationName as keyof typeof COMPREHENSIVE_UK_COASTAL_DISTANCES];
    }
    
    // 2. Geographic interpolation from nearest known cities
    const nearestCities = findNearestCities(latitude, longitude, 3);
    
    if (nearestCities.length === 0) {
        // Fallback to UK boundary estimation
        return estimateCoastalDistanceFromBoundaries(latitude, longitude);
    }
    
    // Distance-weighted interpolation
    let weightedDistance = 0;
    let totalWeight = 0;
    
    nearestCities.forEach(city => {
        const weight = 1 / (city.distance + 1); // Closer cities have higher weight
        weightedDistance += city.coastalDistance * weight;
        totalWeight += weight;
    });
    
    return Math.max(0, weightedDistance / totalWeight);
};

/**
 * Fallback estimation using UK geographic boundaries
 */
const estimateCoastalDistanceFromBoundaries = (latitude: number, longitude: number): number => {
    const UK_BOUNDS = {
        north: 60.8,    // Shetland
        south: 49.9,    // Scilly Isles  
        east: 1.8,      // Norfolk
        west: -8.2      // Northern Ireland
    };
    
    const latFactor = 111; // km per degree latitude
    const lonFactor = 69;  // km per degree longitude at UK latitudes
    
    // Distance to each edge
    const distToNorth = (UK_BOUNDS.north - latitude) * latFactor;
    const distToSouth = (latitude - UK_BOUNDS.south) * latFactor;
    const distToEast = (UK_BOUNDS.east - longitude) * lonFactor;
    const distToWest = (longitude - UK_BOUNDS.west) * lonFactor;
    
    // Minimum distance to any edge is rough coastal distance
    const minEdgeDistance = Math.min(distToNorth, distToSouth, distToEast, distToWest);
    
    // Apply UK geography corrections
    return applyUKGeographyCorrections(latitude, longitude, minEdgeDistance);
};

/**
 * Apply corrections for UK's complex geography
 */
const applyUKGeographyCorrections = (lat: number, lon: number, baseDistance: number): number => {
    // Scotland: Much more complex coastline
    if (lat > 55) {
        return baseDistance * 0.6; // Coastal influence extends further
    }
    
    // Wales: Mountainous interior
    if (lon < -3 && lat > 51.3 && lat < 53.5) {
        if (lon < -3.5) return baseDistance * 0.8; // West Wales
        return baseDistance * 1.2; // Mid Wales mountains
    }
    
    // Southwest England: Peninsula effect
    if (lat < 51.2 && lon < -2) {
        return baseDistance * 0.7;
    }
    
    // East Anglia: Relatively inland despite coastal position
    if (lat > 52 && lat < 53 && lon > 0) {
        return baseDistance * 1.3;
    }
    
    // Peak District / Pennines: Inland hills
    if (lat > 53 && lat < 54.5 && lon > -2.5 && lon < -1) {
        return baseDistance * 1.4;
    }
    
    return baseDistance;
};

/**
 * 5-tier coastal classification system
 */
type CoastalClassification = 'STRONGLY_COASTAL' | 'COASTAL' | 'TRANSITIONAL' | 'WEAKLY_INLAND' | 'STRONGLY_INLAND';

const getCoastalClassification = (distanceToCoast_km: number): CoastalClassification => {
    if (distanceToCoast_km < 5) return "STRONGLY_COASTAL";
    if (distanceToCoast_km < 10) return "COASTAL";  
    if (distanceToCoast_km < 20) return "TRANSITIONAL";
    if (distanceToCoast_km < 40) return "WEAKLY_INLAND";
    return "STRONGLY_INLAND";
};

/**
 * Enhanced coastal influence calculation (0-1 scale) using real distances
 */
const calculateCoastalInfluence = (latitude: number, longitude: number, locationName?: string): number => {
    const coastalDistance = calculateCoastalDistance(latitude, longitude, locationName);
    
    // Apply exponential distance decay: coastal influence diminishes over 20km inland
    const coastalInfluence = Math.max(0, Math.exp(-coastalDistance / 15));
    
    return coastalInfluence;
};

/**
 * Graduated coastal modifiers based on 5-tier classification system
 * Applied to humidity, wind direction effects, and temperature moderation
 */
const COASTAL_MODIFIERS = {
    STRONGLY_COASTAL: {
        humidityPenalty: 1.15,       // 15% more humid due to marine moisture
        windOffshoreBonus: 1.20,     // 20% bonus for dry offshore winds
        windOnshoreePenalty: 0.85,   // 15% penalty for moist onshore winds
        temperatureModeration: 0.95, // 5% less temperature variation (marine effect)
        description: "Strong marine influence"
    },
    COASTAL: {
        humidityPenalty: 1.10,       // 10% more humid
        windOffshoreBonus: 1.15,     // 15% offshore bonus
        windOnshoreePenalty: 0.90,   // 10% onshore penalty
        temperatureModeration: 0.97, // 3% temperature moderation
        description: "Clear marine influence"
    },
    TRANSITIONAL: {
        humidityPenalty: 1.05,       // 5% more humid
        windOffshoreBonus: 1.08,     // 8% offshore bonus
        windOnshoreePenalty: 0.95,   // 5% onshore penalty
        temperatureModeration: 0.99, // 1% temperature moderation
        description: "Mixed marine/continental conditions"
    },
    WEAKLY_INLAND: {
        humidityPenalty: 1.02,       // 2% more humid (residual marine influence)
        windOffshoreBonus: 1.03,     // 3% offshore bonus
        windOnshoreePenalty: 0.98,   // 2% onshore penalty
        temperatureModeration: 1.01, // 1% enhanced temperature extremes
        description: "Slight continental advantage"
    },
    STRONGLY_INLAND: {
        humidityPenalty: 1.0,        // No humidity penalty
        windOffshoreBonus: 1.0,      // No directional wind effects
        windOnshoreePenalty: 1.0,    // No directional wind effects
        temperatureModeration: 1.03, // 3% better temperature extremes for drying
        description: "Full continental drying advantage"
    }
};

/**
 * Calculate bearing from one point to another (for wind direction analysis)
 */
const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) - 
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360
};

/**
 * Find approximate direction to nearest coast for wind analysis
 */
const calculateDirectionToNearestCoast = (latitude: number, longitude: number): number => {
    // Simplified approach using UK geographic bounds
    const UK_COAST_POINTS = [
        { lat: 50.1, lon: -5.5, name: "Southwest" },      // Land's End area
        { lat: 50.8, lon: 0.3, name: "Southeast" },       // Dover area  
        { lat: 52.9, lon: 1.3, name: "East" },            // Norfolk coast
        { lat: 54.8, lon: -3.0, name: "Northwest" },      // Lake District coast
        { lat: 55.0, lon: -1.4, name: "Northeast" },      // Northumberland
        { lat: 57.7, lon: -4.2, name: "Scottish West" },  // Scottish Highlands
        { lat: 58.6, lon: -3.1, name: "Scottish North" }  // Orkney area
    ];
    
    let nearestCoast = UK_COAST_POINTS[0];
    let shortestDistance = haversineDistance(latitude, longitude, nearestCoast.lat, nearestCoast.lon);
    
    UK_COAST_POINTS.forEach(coast => {
        const distance = haversineDistance(latitude, longitude, coast.lat, coast.lon);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestCoast = coast;
        }
    });
    
    return calculateBearing(latitude, longitude, nearestCoast.lat, nearestCoast.lon);
};

/**
 * Enhanced wind direction analysis with onshore/offshore detection
 */
const isWindOffshore = (latitude: number, longitude: number, windDirection: number): boolean => {
    // Get direction to nearest coast
    const directionToCoast = calculateDirectionToNearestCoast(latitude, longitude);
    
    // Wind is offshore if it's blowing away from the coast
    // Wind direction indicates where wind is coming FROM
    // So offshore wind comes from the coast direction
    const windFromCoast = (windDirection + 180) % 360; // Direction wind is blowing TO
    const angleDifference = Math.abs(windFromCoast - directionToCoast);
    
    // Allow 60-degree tolerance for offshore classification
    return angleDifference < 60 || angleDifference > 300;
};

/**
 * Legacy function for backward compatibility
 */
const isLocationCoastal = (latitude: number, longitude: number): boolean => {
    return calculateCoastalInfluence(latitude, longitude) > 0.3; // >30% coastal influence
};

/**
 * Calculates urban shelter factor based on location characteristics
 * Returns multiplier for wind effectiveness (0.7-1.3)
 */
const calculateUrbanShelterFactor = (locationData: LocationData): number => {
    // Simple urban detection based on location name
    const locationName = locationData.fullName.toLowerCase();
    
    // Major cities (high shelter from buildings)
    const majorCities = ['london', 'birmingham', 'manchester', 'glasgow', 'edinburgh', 'liverpool', 'bristol'];
    if (majorCities.some(city => locationName.includes(city))) {
        return 0.75; // Reduced wind effectiveness due to buildings
    }
    
    // Towns and smaller cities (moderate shelter)
    const urbanKeywords = ['city', 'town', 'borough', 'district'];
    if (urbanKeywords.some(keyword => locationName.includes(keyword))) {
        return 0.85; // Slight reduction in wind effectiveness
    }
    
    // Rural areas (enhanced wind effectiveness)
    const ruralKeywords = ['village', 'countryside', 'farm', 'moor', 'dale', 'fell'];
    if (ruralKeywords.some(keyword => locationName.includes(keyword))) {
        return 1.2; // Enhanced wind effectiveness
    }
    
    // Default: no significant shelter effect
    return 1.0;
};

/**
 * Gets current season for wind pattern adjustments
 */
const getCurrentSeason = (): 'winter' | 'spring' | 'summer' | 'autumn' => {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'autumn'; // Sept-Nov
};

/**
 * Enhanced wind direction analysis using 5-tier coastal classification
 * Returns adjustment factor for wind score based on onshore/offshore detection and coastal classification
 */
const getWindDirectionFactor = (windDirection: number, latitude: number, longitude: number, locationName?: string): number => {
    if (windDirection === undefined) return 1.0;
    
    // Get coastal distance and classification
    const coastalDistance = calculateCoastalDistance(latitude, longitude, locationName);
    const coastalClass = getCoastalClassification(coastalDistance);
    const modifiers = COASTAL_MODIFIERS[coastalClass];
    
    // Get seasonal effects
    const season = getCurrentSeason();
    
    // Determine if wind is onshore or offshore using enhanced detection
    const isOffshore = isWindOffshore(latitude, longitude, windDirection);
    
    // Base wind direction factor
    let windDirectionFactor = 1.0;
    
    // Apply coastal modifiers based on wind direction
    if (isOffshore) {
        // Offshore winds: dry continental air moving seaward
        windDirectionFactor = modifiers.windOffshoreBonus;
    } else {
        // Onshore winds: moist marine air moving inland
        windDirectionFactor = modifiers.windOnshoreePenalty;
    }
    
    // Apply seasonal adjustments for coastal effects
    let seasonalMultiplier = 1.0;
    const coastalInfluence = calculateCoastalInfluence(latitude, longitude, locationName);
    
    if (season === 'summer') {
        // Summer: stronger sea-land temperature contrasts enhance coastal effects
        seasonalMultiplier = 1.0 + (coastalInfluence * 0.25); // Up to +25% coastal effect
    } else if (season === 'winter') {
        // Winter: reduced coastal/inland distinction due to similar temperatures
        seasonalMultiplier = 1.0 + (coastalInfluence * 0.08); // Only +8% coastal effect
    } else {
        // Spring/Autumn: moderate seasonal effects
        seasonalMultiplier = 1.0 + (coastalInfluence * 0.15); // +15% coastal effect
    }
    
    // For strongly inland locations, add prevailing wind preferences
    if (coastalClass === 'STRONGLY_INLAND' || coastalClass === 'WEAKLY_INLAND') {
        const normalizedDir = ((windDirection % 360) + 360) % 360;
        
        // Westerly winds (225-315°): Prevailing dry winds for UK inland areas
        if (normalizedDir >= 225 && normalizedDir <= 315) {
            const westerlyBonus = coastalClass === 'STRONGLY_INLAND' ? 1.08 : 1.04;
            windDirectionFactor = Math.max(windDirectionFactor, westerlyBonus);
        }
        // Easterly winds (45-135°): Can bring continental moisture in winter
        else if (normalizedDir >= 45 && normalizedDir <= 135 && season === 'winter') {
            const easterlyPenalty = coastalClass === 'STRONGLY_INLAND' ? 0.95 : 0.97;
            windDirectionFactor = Math.min(windDirectionFactor, easterlyPenalty);
        }
    }
    
    // Apply seasonal multiplier
    return windDirectionFactor * seasonalMultiplier;
};

/**
 * Calculates topographic wind effects based on location
 * Returns multiplier for wind effectiveness (0.8-1.3)
 */
const calculateTopographicWindEffect = (latitude: number, longitude: number): number => {
    // Basic topographic effects for UK regions
    // In production, this would use digital elevation models
    
    // Highland Scotland: Complex topography affects wind patterns
    if (latitude > 56.5) {
        // Highlands can both channel and block winds
        const highlandEffect = Math.sin((longitude + 4) * Math.PI) * 0.1 + 1.0;
        return Math.max(0.85, Math.min(1.25, highlandEffect));
    }
    
    // Welsh valleys: Can channel coastal moisture inland
    if (latitude > 51.5 && latitude < 53 && longitude < -3) {
        // Valley channeling reduces wind effectiveness for drying
        return 0.90;
    }
    
    // Lake District / Peak District: Hills can block or enhance
    if ((latitude > 54 && latitude < 54.8 && longitude > -3.5 && longitude < -2.5) ||
        (latitude > 53 && latitude < 53.5 && longitude > -2 && longitude < -1.5)) {
        // Upland areas: generally enhanced wind exposure
        return 1.15;
    }
    
    // River valleys (Thames, Severn): Can trap moisture
    if (
        (latitude > 51.3 && latitude < 51.7 && longitude > -1 && longitude < 0.5) ||  // Thames Valley
        (latitude > 51.5 && latitude < 52.2 && longitude > -2.5 && longitude < -2)    // Severn Valley
    ) {
        return 0.92; // Slight reduction due to moisture retention
    }
    
    // Default: no significant topographic effect
    return 1.0;
};

// --- DRYCAST ALGORITHM ---

/**
 * DryCast drying conditions calculation using real weather data
 * Implements the DryCast algorithm with optimal window detection
 * Based on meteorologist recommendations with physics-based factor weighting
 */
export const calculateDryingConditions = async (hourlyForecast: HourlyForecast[], locationData: LocationData, astronomy?: {
    sunrise: string;
    sunset: string;
    sunriseDecimal: number;
    sunsetDecimal: number;
}): Promise<{
    recommendation: Recommendation;
    hourlyScores: DryingScore[];
}> => {
    // Phase 3: Complete physics-based weights with wind intelligence
    const weights = {
        vapourPressureDeficit: 0.30,  // 30% - Direct drying science
        temperature: 0.08,            // 8% - Reduced as wet bulb is more accurate
        dewPointSpread: 0.05,         // 5% - Reduced as VPD is more direct
        windSpeed: 0.20,              // 20% - Adjusted for wind intelligence
        shortwaveRadiation: 0.08,     // 8% - Real solar energy
        wetBulbTemperature: 0.10,     // 10% - More accurate evaporative potential
        evapotranspiration: 0.05,     // 5% - Cross-validation with real evaporation rates
        sunshineDuration: 0.09,       // 9% - Actual sun time weighting
        windDirection: 0.05,          // 5% - Shelter/exposure logic
    };
    
    // Enhanced coastal intelligence: Real distance-based 5-tier classification system
    const coastalDistance = calculateCoastalDistance(locationData.latitude, locationData.longitude, locationData.name);
    const coastalClass = getCoastalClassification(coastalDistance);
    const coastalModifiers = COASTAL_MODIFIERS[coastalClass];
    const coastalInfluence = calculateCoastalInfluence(locationData.latitude, locationData.longitude, locationData.name);
    const isCoastal = coastalInfluence > 0.3; // Maintain backward compatibility
    const urbanShelterFactor = calculateUrbanShelterFactor(locationData);
    const topographicWindEffect = calculateTopographicWindEffect(locationData.latitude, locationData.longitude);
    
    console.log(`Coastal analysis for ${locationData.name}: Distance=${coastalDistance.toFixed(1)}km, Class=${coastalClass}, Influence=${(coastalInfluence*100).toFixed(1)}%`);
    
    // Filter to daylight hours only if astronomy data is available
    let daylightHours = hourlyForecast;
    if (astronomy) {
        daylightHours = hourlyForecast.filter((_, index) => {
            return index >= Math.floor(astronomy.sunriseDecimal) && index <= Math.ceil(astronomy.sunsetDecimal);
        });
    }
    
    // Calculate hourly drying scores for daylight hours only
    const hourlyScores: DryingScore[] = [];
    let dominantNegativeFactor = "";
    
    hourlyForecast.forEach((hourData, index) => {
        // Skip non-daylight hours if astronomy data is available
        if (astronomy && (index < Math.floor(astronomy.sunriseDecimal) || index > Math.ceil(astronomy.sunsetDecimal))) {
            // Mark as unsuitable due to darkness
            hourlyScores.push({
                hour: index,
                time: hourData.time,
                totalScore: 0,
                componentScores: {
                    humidity: 0,
                    temperature: 0,
                    dewPointSpread: 0,
                    windSpeed: 0,
                    cloudCover: 0,
                    vapourPressureDeficit: 0,
                    surfacePressure: undefined,
                    shortwaveRadiation: 0,
                    wetBulbTemperature: 0,
                    evapotranspiration: 0,
                    sunshineDuration: 0,
                    windDirection: 100,
                },
                suitable: false
            });
            if (!dominantNegativeFactor) dominantNegativeFactor = "outside daylight hours";
            return;
        }
        // ENHANCED RAIN RISK ASSESSMENT: Physics-based multiplicative approach
        const isRaining = hourData.rainfall > 0.0;
        // Calculate rain risk score: probability × intensity (more realistic than binary thresholds)
        const rainRisk = (hourData.rainChance / 100) * hourData.rainfall;
        const rainRiskThreshold = 0.2; // Tuned threshold: 40%×0.5mm=0.2, 20%×1.0mm=0.2, 10%×2.0mm=0.2
        const highRainRisk = rainRisk > rainRiskThreshold;
        const unsuitable = isRaining || highRainRisk;
        
        // Log for verification and debugging with new rain risk score
        if (highRainRisk && !isRaining) {
            console.log(`Hour ${index} (${hourData.time}): Rain risk score ${rainRisk.toFixed(3)} (${hourData.rainChance}% × ${hourData.rainfall}mm) exceeds threshold ${rainRiskThreshold} - DISQUALIFIED`);
        }
        
        if (unsuitable) {
            hourlyScores.push({
                hour: index,
                time: hourData.time,
                totalScore: 0,
                componentScores: {
                    humidity: 0,
                    temperature: 0,
                    dewPointSpread: 0,
                    windSpeed: 0,
                    cloudCover: 0,
                    vapourPressureDeficit: 0,
                    surfacePressure: undefined,
                    shortwaveRadiation: 0,
                    wetBulbTemperature: 0,
                    evapotranspiration: 0,
                    sunshineDuration: 0,
                    windDirection: 100,
                },
                suitable: false
            });
            // Set specific reason based on whether it's actual rain or forecast risk
            if (!dominantNegativeFactor) {
                if (isRaining) {
                    dominantNegativeFactor = "rainfall detected";
                } else if (highRainRisk) {
                    dominantNegativeFactor = `high rain risk score (${rainRisk.toFixed(2)} from ${hourData.rainChance}% × ${hourData.rainfall}mm)`;
                }
            }
            return;
        }
        
        // Calculate Dew Point Spread (temperature - dew point)
        const dewPointSpread = hourData.temperature - hourData.dewPoint;
        
        // Disqualify if dew point spread is too small (condensation risk)
        if (dewPointSpread < 1) {
            hourlyScores.push({
                hour: index,
                time: hourData.time,
                totalScore: 0,
                componentScores: {
                    humidity: 0,
                    temperature: 0,
                    dewPointSpread: 0,
                    windSpeed: 0,
                    cloudCover: 0,
                    vapourPressureDeficit: 0,
                    surfacePressure: undefined,
                    shortwaveRadiation: 0,
                    wetBulbTemperature: 0,
                    evapotranspiration: 0,
                    sunshineDuration: 0,
                    windDirection: 100,
                },
                suitable: false
            });
            if (!dominantNegativeFactor) dominantNegativeFactor = "dew point too close to temperature (condensation risk)";
            return;
        }
        
        // Calculate individual component scores (0-100)
        
        // 1. Vapour Pressure Deficit Score: Direct drying potential (higher VPD = better drying)
        // VPD typically ranges 0-4 kPa, with 1.5+ being excellent for drying
        let vapourPressureDeficitScore = 0;
        if (hourData.vapourPressureDeficit !== undefined) {
            const vpd = hourData.vapourPressureDeficit;
            if (vpd < 0.3) {
                vapourPressureDeficitScore = 0; // Too humid for effective drying
            } else {
                // Exponential curve: excellent at 1.5+ kPa, diminishing returns above 3 kPa
                vapourPressureDeficitScore = Math.min(120, 100 * (1 - Math.exp(-(vpd - 0.3) / 1.2)));
            }
        } else {
            // Fallback to humidity-based calculation if VPD not available
            vapourPressureDeficitScore = Math.max(0, 100 - hourData.humidity);
        }
        
        // 2. Temperature Score: Enhanced with coastal moderation effects
        let temperatureScore = 0;
        const temp = hourData.temperature;
        if (temp < 5) {
            temperatureScore = 0; // Too cold for effective drying
        } else {
            // Exponential curve that continues rising with diminishing returns
            const baseTemperatureScore = Math.min(150, 100 * (1 - Math.exp(-(temp - 5) / 15)));
            // Apply coastal temperature moderation (inland locations get slight bonus for temperature extremes)
            temperatureScore = baseTemperatureScore * coastalModifiers.temperatureModeration;
        }
        
        // 3. Dew Point Spread Score: Continuous scaling from 1°C minimum
        const dewPointSpreadScore = Math.max(0, Math.min(120, (dewPointSpread - 1) / 15.0 * 100));
        
        // 4. Wind Speed Score: Enhanced with directional and shelter intelligence
        let windScore = 0;
        const wind = hourData.windSpeed;
        if (wind <= 1) {
            windScore = 10; // Very calm conditions, minimal drying
        } else {
            // Asymptotic curve that keeps rising with diminishing returns
            const baseWindScore = Math.min(130, 100 * (1 - Math.exp(-wind / 20)));
            
            // Apply enhanced wind intelligence factors with new coastal classification
            const directionFactor = hourData.windDirection !== undefined ? 
                getWindDirectionFactor(hourData.windDirection, locationData.latitude, locationData.longitude, locationData.name) : 1.0;
            
            // Apply urban shelter factor
            const shelterFactor = urbanShelterFactor;
            
            // Apply topographic wind effects
            const topographicFactor = topographicWindEffect;
            
            // Apply coastal influence to base wind effectiveness
            const coastalWindFactor = 1.0 - (coastalInfluence * 0.1); // Coastal winds 10% less effective due to humidity
            
            windScore = baseWindScore * directionFactor * shelterFactor * topographicFactor * coastalWindFactor;
        }
        
        // 5. Shortwave Radiation Score: Real solar energy (higher radiation = better drying)
        // Solar radiation typically ranges 0-1200 W/m², with 600+ being excellent
        let shortwaveRadiationScore = 0;
        if (hourData.shortwaveRadiation !== undefined) {
            const solar = hourData.shortwaveRadiation;
            if (solar < 50) {
                shortwaveRadiationScore = 0; // Night or very overcast
            } else {
                // Logarithmic curve: good at 300 W/m², excellent at 600+ W/m²
                shortwaveRadiationScore = Math.min(110, 100 * Math.log(solar / 50) / Math.log(12));
            }
        } else {
            // Fallback to cloud cover estimation if solar radiation not available
            shortwaveRadiationScore = 100 - hourData.cloudCover;
        }
        
        // 6. Wet Bulb Temperature Score: More accurate evaporative potential
        // Wet bulb temp is typically 1-10°C below air temp, larger difference = better drying
        let wetBulbTemperatureScore = 0;
        if (hourData.wetBulbTemperature !== undefined) {
            const wetBulbDifference = hourData.temperature - hourData.wetBulbTemperature;
            if (wetBulbDifference < 1) {
                wetBulbTemperatureScore = 0; // Too humid for effective drying
            } else {
                // Logarithmic curve: good at 3°C difference, excellent at 8°C+
                wetBulbTemperatureScore = Math.min(110, 100 * Math.log(wetBulbDifference) / Math.log(10));
            }
        } else {
            // Fallback to regular temperature scoring
            wetBulbTemperatureScore = temperatureScore;
        }
        
        // 7. Evapotranspiration Score: Cross-validation with real evaporation rates
        // ET0 typically ranges 0-10 mm/day, with 4+ being excellent for drying validation
        let evapotranspirationScore = 0;
        if (hourData.evapotranspiration !== undefined) {
            const et0 = hourData.evapotranspiration;
            if (et0 < 1) {
                evapotranspirationScore = 20; // Low evaporation = poor drying
            } else {
                // Logarithmic curve: good at 3 mm/day, excellent at 6+ mm/day
                evapotranspirationScore = Math.min(100, 50 + 50 * Math.log(et0) / Math.log(6));
            }
        } else {
            // Fallback to average of other scores
            evapotranspirationScore = (vapourPressureDeficitScore + temperatureScore + windScore) / 3;
        }
        
        // 8. Sunshine Duration Score: Actual sun time vs cloud estimation
        // Sunshine duration is typically 0-1 hours per hourly period (can exceed if very sunny)
        let sunshineDurationScore = 0;
        if (hourData.sunshineDuration !== undefined) {
            const sunshine = hourData.sunshineDuration;
            if (sunshine < 0.1) {
                sunshineDurationScore = 0; // No meaningful sunshine
            } else {
                // Linear scale: 0.5 hours = 50 points, 1+ hour = 100 points
                sunshineDurationScore = Math.min(110, sunshine * 100);
            }
        } else {
            // Fallback to shortwave radiation score
            sunshineDurationScore = shortwaveRadiationScore;
        }
        
        // 9. Wind Direction Score: Enhanced onshore/offshore analysis with coastal classification
        let windDirectionScore = 100; // Default neutral score
        if (hourData.windDirection !== undefined) {
            const directionFactor = getWindDirectionFactor(hourData.windDirection, locationData.latitude, locationData.longitude, locationData.name);
            windDirectionScore = 100 * directionFactor;
        }
        
        // Apply enhanced coastal humidity modifiers using graduated system
        if (hourData.vapourPressureDeficit !== undefined) {
            // Use graduated humidity penalty based on coastal classification
            vapourPressureDeficitScore = vapourPressureDeficitScore / coastalModifiers.humidityPenalty;
        }
        
        // 10. Surface Pressure Multiplier: Atmospheric pressure affects evaporation
        // Standard pressure is 1013.25 hPa, higher pressure aids evaporation slightly
        let pressureMultiplier = 1.0;
        if (hourData.surfacePressure !== undefined) {
            const pressure = hourData.surfacePressure;
            // Pressure effect: 1.0 at 1013 hPa, up to 1.15 at 1040 hPa, down to 0.85 at 980 hPa
            pressureMultiplier = Math.max(0.85, Math.min(1.15, 1.0 + (pressure - 1013.25) / 1000));
        }
        
        // Track dominant negative factors
        if (vapourPressureDeficitScore < 40 && !dominantNegativeFactor) dominantNegativeFactor = "low vapour pressure deficit (poor drying potential)";
        if (temperatureScore < 40 && !dominantNegativeFactor) dominantNegativeFactor = "unfavorable temperature";
        if (dewPointSpreadScore < 40 && !dominantNegativeFactor) dominantNegativeFactor = "high moisture content (low dew point spread)";
        if (windScore < 40 && !dominantNegativeFactor) dominantNegativeFactor = "poor wind conditions";
        if (shortwaveRadiationScore < 30 && !dominantNegativeFactor) dominantNegativeFactor = "insufficient solar radiation";
        if (wetBulbTemperatureScore < 30 && !dominantNegativeFactor) dominantNegativeFactor = "poor evaporative potential (wet bulb temperature)";
        if (evapotranspirationScore < 30 && !dominantNegativeFactor) dominantNegativeFactor = "low evaporation rates";
        if (sunshineDurationScore < 20 && !dominantNegativeFactor) dominantNegativeFactor = "insufficient sunshine duration";
        if (windDirectionScore < 85 && !dominantNegativeFactor) dominantNegativeFactor = "unfavorable wind direction";
        
        // Calculate weighted total score (0-100) with pressure multiplier
        const baseScore = 
            vapourPressureDeficitScore * weights.vapourPressureDeficit +
            temperatureScore * weights.temperature +
            dewPointSpreadScore * weights.dewPointSpread +
            windScore * weights.windSpeed +
            shortwaveRadiationScore * weights.shortwaveRadiation +
            wetBulbTemperatureScore * weights.wetBulbTemperature +
            evapotranspirationScore * weights.evapotranspiration +
            sunshineDurationScore * weights.sunshineDuration +
            windDirectionScore * weights.windDirection;
            
        // Apply atmospheric pressure multiplier to final score
        const totalScore = baseScore * pressureMultiplier;
            
        hourlyScores.push({
            hour: index,
            time: hourData.time,
            totalScore: Math.round(totalScore),
            componentScores: {
                // Legacy scores for compatibility
                humidity: hourData.vapourPressureDeficit !== undefined ? Math.round(vapourPressureDeficitScore) : Math.round(100 - hourData.humidity),
                temperature: Math.round(temperatureScore),
                dewPointSpread: Math.round(dewPointSpreadScore),
                windSpeed: Math.round(windScore),
                cloudCover: hourData.shortwaveRadiation !== undefined ? Math.round(shortwaveRadiationScore) : Math.round(100 - hourData.cloudCover),
                
                // Phase 1: New physics-based component scores
                vapourPressureDeficit: Math.round(vapourPressureDeficitScore),
                surfacePressure: hourData.surfacePressure ? Math.round(pressureMultiplier * 100) : undefined,
                shortwaveRadiation: Math.round(shortwaveRadiationScore),
                
                // Phase 2: Enhanced accuracy component scores
                wetBulbTemperature: Math.round(wetBulbTemperatureScore),
                evapotranspiration: Math.round(evapotranspirationScore),
                
                // Phase 3: Wind intelligence component scores
                sunshineDuration: Math.round(sunshineDurationScore),
                windDirection: Math.round(windDirectionScore),
            },
            suitable: totalScore >= 50 // Maintained 50-point threshold for realistic UK conditions
        });
    });
    
    // Find Drying Windows (2+ continuous hours with score >= 50)
    const dryingWindows = findDryingWindows(hourlyScores);
    
    // Generate final recommendation
    const recommendation = await generateFinalRecommendation(dryingWindows, dominantNegativeFactor, locationData, hourlyScores);
    
    return {
        recommendation,
        hourlyScores
    };
};

/**
 * Finds continuous periods of good drying conditions (Drying Windows)
 */
const findDryingWindows = (hourlyScores: DryingScore[]): DryingWindow[] => {
    const windows: DryingWindow[] = [];
    let currentWindow: DryingScore[] = [];
    
    for (const score of hourlyScores) {
        if (score.suitable) {
            currentWindow.push(score);
        } else {
            // End of suitable period
            if (currentWindow.length >= 2) {
                windows.push(createDryingWindow(currentWindow));
            }
            currentWindow = [];
        }
    }
    
    // Check final window
    if (currentWindow.length >= 2) {
        windows.push(createDryingWindow(currentWindow));
    }
    
    // Sort by average score (best first)
    return windows.sort((a, b) => b.averageScore - a.averageScore);
};

/**
 * Creates a Drying Window from a sequence of suitable hours
 * Simplified version without confidence calculations
 */
const createDryingWindow = (scores: DryingScore[]): DryingWindow => {
    const averageScore = scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length;
    
    // Enhanced quality assessment based on average score for three-tier system
    let description: string;
    if (averageScore >= 80) description = "Excellent drying conditions";
    else if (averageScore >= 70) description = "Very good drying conditions";  
    else if (averageScore >= 60) description = "Good drying conditions";
    else if (averageScore >= 55) description = "Decent drying conditions";
    else description = "Acceptable drying conditions";
    
    // Calculate actual duration in hours (end hour - start hour + 1)
    const startHour = scores[0].hour;
    const endHour = scores[scores.length - 1].hour;
    const actualDuration = endHour - startHour + 1;
    
    return {
        startTime: scores[0].time,
        endTime: scores[scores.length - 1].time,
        duration: actualDuration,
        averageScore: Math.round(averageScore),
        description
    };
};

/**
 * Analyzes drying pattern to determine appropriate day rating with time windows
 * Returns one of three statuses based on continuous green/amber bar patterns:
 * 1. 2+ continuous green bars (≥70%) = "Get The Washing Out"
 * 2. 2+ continuous amber bars (50-69%) = "Keep Your Eye on It"
 * 3. No continuous windows = "Indoor Drying Only"
 * @param hourlyScores - Array of hourly drying scores
 * @param startFromHour - Optional hour to start analysis from (for filtering past hours)
 */
export const analyzeDryingPattern = (hourlyScores: DryingScore[], startFromHour?: number) => {
    // Filter to specified start hour if provided (for today's remaining hours)
    const filteredScores = startFromHour !== undefined 
        ? hourlyScores.filter(score => score.hour >= startFromHour)
        : hourlyScores;
    
    // Find continuous windows for both green (≥60) and amber (50-59) scores
    const findContinuousWindows = (minScore: number, maxScore?: number) => {
        const windows: { start: number; end: number; startTime: string; endTime: string; duration: number; averageScore: number }[] = [];
        let currentWindow: DryingScore[] = [];
        
        for (const score of filteredScores) {
            const inRange = maxScore 
                ? (score.totalScore >= minScore && score.totalScore < maxScore)
                : (score.totalScore >= minScore);
                
            if (score.suitable && inRange) {
                currentWindow.push(score);
            } else {
                // End of suitable period
                if (currentWindow.length >= 2) {
                    const avgScore = currentWindow.reduce((sum, s) => sum + s.totalScore, 0) / currentWindow.length;
                    windows.push({
                        start: currentWindow[0].hour,
                        end: currentWindow[currentWindow.length - 1].hour,
                        startTime: currentWindow[0].time,
                        endTime: currentWindow[currentWindow.length - 1].time,
                        duration: currentWindow.length,
                        averageScore: Math.round(avgScore)
                    });
                }
                currentWindow = [];
            }
        }
        
        // Check final window
        if (currentWindow.length >= 2) {
            const avgScore = currentWindow.reduce((sum, s) => sum + s.totalScore, 0) / currentWindow.length;
            windows.push({
                start: currentWindow[0].hour,
                end: currentWindow[currentWindow.length - 1].hour,
                startTime: currentWindow[0].time,
                endTime: currentWindow[currentWindow.length - 1].time,
                duration: currentWindow.length,
                averageScore: Math.round(avgScore)
            });
        }
        
        return windows.sort((a, b) => b.averageScore - a.averageScore); // Best first
    };
    
    // Check for 2+ continuous green bars (≥70% score) - matches DryingQualityMeter thresholds
    const greenWindows = findContinuousWindows(70);
    if (greenWindows.length > 0) {
        const bestWindow = greenWindows[0];
        return {
            status: 'continuous',
            message: 'Get The Washing Out',
            timeWindow: `${bestWindow.startTime} - ${bestWindow.endTime}`,
            duration: bestWindow.duration,
            averageScore: bestWindow.averageScore,
            color: 'bg-green-500',
            textColor: 'text-green-800'
        };
    }

    // Check for 2+ continuous amber bars (50-69% score) - matches DryingQualityMeter thresholds
    const amberWindows = findContinuousWindows(50, 70);
    if (amberWindows.length > 0) {
        const bestWindow = amberWindows[0];
        return {
            status: 'amber_continuous',
            message: 'Keep Your Eye on It',
            timeWindow: `${bestWindow.startTime} - ${bestWindow.endTime}`,
            duration: bestWindow.duration,
            averageScore: bestWindow.averageScore,
            color: 'bg-amber-500',
            textColor: 'text-amber-800'
        };
    }
    
    // No continuous windows found, check for any suitable hours (isolated)
    const anySuitable = filteredScores.some(score => score.suitable);
    if (anySuitable) {
        return {
            status: 'isolated',
            message: 'Brief Gaps for Outdoor Drying',
            timeWindow: 'N/A',
            duration: 0,
            averageScore: 0,
            color: 'bg-amber-500',
            textColor: 'text-amber-800'
        };
    }
    
    // No continuous windows found
    return {
        status: 'none',
        message: 'Indoor Drying Only',
        timeWindow: 'N/A',
        duration: 0,
        averageScore: 0,
        color: 'bg-red-500',
        textColor: 'text-red-800'
    };
};


/**
 * Generates the final recommendation based on continuous bar analysis
 * Uses the new three-tier messaging system:
 * 1. 2+ continuous green bars (≥70%) = GET_THE_WASHING_OUT
 * 2. 2+ continuous amber bars (50-69%) = ACCEPTABLE_CONDITIONS
 * 3. No continuous windows = INDOOR_DRYING_ONLY
 */
const generateFinalRecommendation = async (
    dryingWindows: DryingWindow[], 
    dominantNegativeFactor: string, 
    locationData: LocationData,
    hourlyScores: DryingScore[]
): Promise<Recommendation> => {
    
    // Use the new pattern analysis to determine status and time windows
    const patternAnalysis = analyzeDryingPattern(hourlyScores);
    
    // Map pattern analysis status to recommendation status
    let status: RecommendationStatus;
    let timing: string;
    let reason: string;
    
    if (patternAnalysis.status === 'continuous') {
        // 2+ continuous green bars (≥60%)
        status = RecommendationStatus.GET_THE_WASHING_OUT;
        timing = `Best time: ${patternAnalysis.timeWindow} (${patternAnalysis.duration} hours)`;
        reason = `Excellent drying conditions for ${patternAnalysis.duration} continuous hours. Perfect for outdoor drying!`;
    } else if (patternAnalysis.status === 'amber_continuous') {
        // 2+ continuous amber bars (50-59%)
        status = RecommendationStatus.ACCEPTABLE_CONDITIONS;
        timing = `Watch period: ${patternAnalysis.timeWindow} (${patternAnalysis.duration} hours)`;
        reason = `Decent drying conditions for ${patternAnalysis.duration} continuous hours. Keep an eye on weather changes.`;
    } else {
        // No continuous windows
        status = RecommendationStatus.INDOOR_DRYING_ONLY;
        timing = "Indoor drying recommended today.";
        reason = dominantNegativeFactor 
            ? `Poor conditions due to ${dominantNegativeFactor}. Keep laundry indoors.`
            : "No suitable continuous drying periods found. Keep laundry indoors.";
    }
    
    // Find the best window from traditional analysis for detailed info
    const bestWindow = dryingWindows.length > 0 ? dryingWindows[0] : undefined;
    const alternativeWindows = dryingWindows.slice(1, 3); // Up to 2 alternatives
    
    return {
        status,
        timing,
        reason,
        timeWindow: patternAnalysis.timeWindow || "N/A",
        dryingWindow: bestWindow,
        alternativeWindows: alternativeWindows.length > 0 ? alternativeWindows : undefined,
        weatherSource: "Open-Meteo (UK Met Office)",
        lastUpdated: new Date()
    };
};


// --- DIAGNOSTIC FUNCTIONS ---

/**
 * Diagnostic function to check API connectivity and provide detailed error information
 * Useful for debugging mobile-specific issues
 */
export const diagnoseWeatherService = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unavailable';
  details: string[];
  errors: string[];
}> => {
  const details: string[] = [];
  const errors: string[] = [];
  
  // Check environment
  details.push(`User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}`);
  details.push(`Online Status: ${typeof navigator !== 'undefined' ? navigator.onLine : 'Unknown'}`);
  details.push(`Platform: ${typeof navigator !== 'undefined' ? navigator.platform : 'Unknown'}`);
  
  // Test geocoding API
  try {
    details.push('Testing geocoding service...');
    await geocodeLocation('London');
    details.push('✓ Geocoding service: OK');
  } catch (error) {
    errors.push(`✗ Geocoding service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Test weather API with detailed health check
  try {
    details.push('Testing weather service...');
    const result = await checkWeatherAPIHealth();
    
    if (result.healthy) {
      details.push(`✓ Weather service: OK (${result.responseTime}ms)`);
    } else {
      errors.push(`✗ Weather service failed: ${result.details}`);
    }
  } catch (error) {
    errors.push(`✗ Weather service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Test sunrise/sunset API
  try {
    details.push('Testing sunrise/sunset service...');
    await fetchSunriseSunset(51.5074, -0.1278);
    details.push('✓ Sunrise/sunset service: OK');
  } catch (error) {
    errors.push(`✗ Sunrise/sunset service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  let status: 'healthy' | 'degraded' | 'unavailable' = 'healthy';
  if (errors.length > 0) {
    status = errors.length === 3 ? 'unavailable' : 'degraded';
  }
  
  return { status, details, errors };
};

// --- DEMO MODE FUNCTION ---

type DemoDataResult = {
  currentRecommendation: Recommendation;
  weeklyForecast: ShortTermForecastItem[];
  weatherData: WeatherData[];
  locationName: string;
  localTime: string;
  timezone: string;
};

/**
 * Generates realistic demo data showcasing multiple drying windows
 * with different quality levels and confidence percentages
 */
const generateDemoData = async (): Promise<DemoDataResult> => {
  console.log('🎭 Generating demo data with multiple drying windows...');

  const currentTime = new Date();
  const currentHour = currentTime.getHours();

  // Create 3 days of hourly forecast data
  const hourlyForecasts: HourlyForecast[][] = [];
  const weeklyData: WeatherData[] = [];

  for (let day = 0; day < 3; day++) {
    const dayForecasts: HourlyForecast[] = [];

    // Generate 24 hours of data for each day
    for (let hour = 0; hour < 24; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const isDaylight = hour >= 7 && hour < 19;

      // Create varied conditions to produce multiple windows
      let temperature: number, humidity: number, rainChance: number, windSpeed: number, uvIndex: number;

      if (day === 0) {
        // TODAY: Excellent morning window, good afternoon window, decent late window
        if (hour >= 10 && hour < 14) {
          // BEST WINDOW: 10:00-14:00 (87% score)
          temperature = 18 + (hour - 10) * 0.5;
          humidity = 55 - (hour - 10) * 2;
          rainChance = 5;
          windSpeed = 12 + Math.random() * 3;
          uvIndex = 5 + (hour - 10) * 0.3;
        } else if (hour >= 15 && hour < 17) {
          // GOOD WINDOW: 15:00-17:00 (72% score)
          temperature = 17;
          humidity = 62;
          rainChance = 15;
          windSpeed = 8 + Math.random() * 2;
          uvIndex = 3;
        } else if (hour >= 8 && hour < 10) {
          // DECENT WINDOW: 08:00-10:00 (65% score)
          temperature = 15;
          humidity = 68;
          rainChance = 20;
          windSpeed = 6 + Math.random() * 2;
          uvIndex = 2;
        } else {
          // Other hours: poor conditions
          temperature = 14 - (isDaylight ? 0 : 3);
          humidity = 78 + Math.random() * 10;
          rainChance = 45 + Math.random() * 15;
          windSpeed = 4 + Math.random() * 3;
          uvIndex = isDaylight ? 1 : 0;
        }
      } else if (day === 1) {
        // TOMORROW: Mixed conditions with 2 decent windows
        if (hour >= 11 && hour < 15) {
          temperature = 16 + (hour - 11) * 0.5;
          humidity = 60 - (hour - 11);
          rainChance = 10 + Math.random() * 5;
          windSpeed = 10 + Math.random() * 4;
          uvIndex = 4 + (hour - 11) * 0.2;
        } else if (hour >= 16 && hour < 18) {
          temperature = 17;
          humidity = 65;
          rainChance = 25;
          windSpeed = 7;
          uvIndex = 2;
        } else {
          temperature = 13 - (isDaylight ? 0 : 2);
          humidity = 75 + Math.random() * 10;
          rainChance = 40 + Math.random() * 20;
          windSpeed = 5 + Math.random() * 3;
          uvIndex = isDaylight ? 1.5 : 0;
        }
      } else {
        // DAY 3: One good window
        if (hour >= 12 && hour < 16) {
          temperature = 17 + (hour - 12) * 0.3;
          humidity = 58;
          rainChance = 8;
          windSpeed = 11 + Math.random() * 3;
          uvIndex = 4.5 + (hour - 12) * 0.2;
        } else {
          temperature = 14 - (isDaylight ? 0 : 3);
          humidity = 72 + Math.random() * 8;
          rainChance = 35 + Math.random() * 15;
          windSpeed = 6 + Math.random() * 2;
          uvIndex = isDaylight ? 1 : 0;
        }
      }

      dayForecasts.push({
        time,
        temperature: Math.round(temperature * 10) / 10,
        humidity: Math.round(humidity),
        rainChance: Math.round(rainChance),
        windSpeed: Math.round(windSpeed),
        uvIndex: Math.round(uvIndex * 10) / 10,
        cloudCover: Math.round(100 - (100 - humidity) * 0.8),
        dewPoint: Math.round(temperature - ((100 - humidity) / 5))
      });
    }

    hourlyForecasts.push(dayForecasts);

    // Calculate day summary
    const dayDate = new Date(currentTime);
    dayDate.setDate(dayDate.getDate() + day);

    const dayName = days[dayDate.getDay()];
    const avgTemp = dayForecasts.reduce((sum, h) => sum + h.temperature, 0) / 24;
    const avgHumidity = dayForecasts.reduce((sum, h) => sum + h.humidity, 0) / 24;
    const maxRain = Math.max(...dayForecasts.map(h => h.rainChance));
    const avgWind = dayForecasts.reduce((sum, h) => sum + h.windSpeed, 0) / 24;

    weeklyData.push({
      day: dayName,
      date: dayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      condition: determineDailyCondition(dayForecasts),
      highTemp: Math.round(Math.max(...dayForecasts.map(h => h.temperature))),
      lowTemp: Math.round(Math.min(...dayForecasts.map(h => h.temperature))),
      rainChance: Math.round(maxRain),
      avgHumidity: Math.round(avgHumidity),
      avgWindSpeed: Math.round(avgWind),
      hourlyForecast: dayForecasts,
      sunrise: '07:15',
      sunset: '18:45',
      sunriseDecimal: 7.25,
      sunsetDecimal: 18.75
    });
  }

  // Generate weekly forecast with drying windows
  const weeklyForecast: ShortTermForecastItem[] = [];

  for (const day of weeklyData) {
    try {
      const dryingResult = await calculateDryingConditions(
        day.hourlyForecast,
        {
          latitude: 51.5074,
          longitude: -0.1278,
          name: 'Demo Location',
          fullName: 'Demo Location, UK',
          country: 'United Kingdom',
          confidence: 100
        },
        {
          sunrise: day.sunrise,
          sunset: day.sunset,
          sunriseDecimal: day.sunriseDecimal,
          sunsetDecimal: day.sunsetDecimal
        }
      );

      const dryingWindows = findDryingWindows(dryingResult.hourlyScores);
      const overallScore = dryingWindows.length > 0 ? dryingWindows[0].averageScore : 0;

      weeklyForecast.push({
        day: day.day,
        date: day.date,
        condition: day.condition,
        highTemp: day.highTemp,
        lowTemp: day.lowTemp,
        rainChance: day.rainChance,
        dryingScore: Math.round(overallScore),
        dryingQuality: overallScore >= 75 ? 'Excellent' : overallScore >= 60 ? 'Good' : overallScore >= 40 ? 'Fair' : 'Poor',
        dryingWindows: dryingWindows,
        hourlyScores: dryingResult.hourlyScores
      });
    } catch (error) {
      console.error(`Error processing demo day ${day.day}:`, error);
    }
  }

  // Generate current recommendation from today's best window
  const todayWindows = weeklyForecast[0].dryingWindows || [];
  const bestWindow = todayWindows.length > 0 ? todayWindows[0] : null;

  let currentRecommendation: Recommendation;

  if (bestWindow && bestWindow.averageScore >= 75) {
    currentRecommendation = {
      status: RecommendationStatus.GET_THE_WASHING_OUT,
      confidence: Math.round(bestWindow.averageScore),
      message: `GET THE WASHING OUT TODAY - ${Math.round(bestWindow.averageScore)}% CONFIDENCE`,
      reason: `Excellent drying conditions from ${bestWindow.startTime} to ${bestWindow.endTime}`,
      bestTimeWindow: {
        start: bestWindow.startTime,
        end: bestWindow.endTime,
        duration: bestWindow.duration,
        score: bestWindow.averageScore
      },
      alternativeWindows: todayWindows.slice(1, 3).map(w => ({
        start: w.startTime,
        end: w.endTime,
        duration: w.duration,
        score: w.averageScore
      }))
    };
  } else if (bestWindow && bestWindow.averageScore >= 50) {
    currentRecommendation = {
      status: RecommendationStatus.ACCEPTABLE_CONDITIONS,
      confidence: Math.round(bestWindow.averageScore),
      message: `RISKY DRYING - ${Math.round(bestWindow.averageScore)}% CONFIDENCE`,
      reason: `Decent conditions from ${bestWindow.startTime} to ${bestWindow.endTime}, but watch the weather`,
      bestTimeWindow: {
        start: bestWindow.startTime,
        end: bestWindow.endTime,
        duration: bestWindow.duration,
        score: bestWindow.averageScore
      },
      alternativeWindows: todayWindows.slice(1, 3).map(w => ({
        start: w.startTime,
        end: w.endTime,
        duration: w.duration,
        score: w.averageScore
      }))
    };
  } else {
    currentRecommendation = {
      status: RecommendationStatus.NOT_RECOMMENDED,
      confidence: 15,
      message: 'NOT TODAY - Poor drying conditions',
      reason: 'High humidity and rain risk make outdoor drying unsuitable today',
      bestTimeWindow: undefined,
      alternativeWindows: []
    };
  }

  console.log(`✅ Demo data generated: ${todayWindows.length} drying windows for today`);
  console.log(`   Best window: ${bestWindow?.startTime}-${bestWindow?.endTime} (${Math.round(bestWindow?.averageScore || 0)}%)`);

  return {
    currentRecommendation,
    weeklyForecast,
    weatherData: weeklyData,
    locationName: 'Demo Location, UK',
    localTime: getCurrentUKTime(),
    timezone: UK_TIMEZONE
  };
};

// --- ENHANCED PUBLIC API FUNCTION ---

export const getWashingRecommendation = async (location: string): Promise<{
  currentRecommendation: Recommendation;
  weeklyForecast: ShortTermForecastItem[];
  weatherData: WeatherData[];  // Full weather data including hourly scores
  locationName: string;  // Properly geocoded location name
  localTime: string;  // Current local time at location
  timezone: string;  // Timezone identifier
}> => {
  try {
    console.log(`Getting weather recommendation for: ${location}`);
    console.log(`User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}`);
    console.log(`Online status: ${typeof navigator !== 'undefined' ? navigator.onLine : 'Unknown'}`);
    
    // DEMO MODE: Check if user wants to see test data with multiple windows
    if (location.toLowerCase() === 'demo' || location.toLowerCase() === 'test') {
      console.log('🎭 DEMO MODE ACTIVATED - Generating test data with multiple drying windows');
      return await generateDemoData();
    }

    // Check cache first for faster response
    const cachedData = await cacheService.getWeatherData(location);
    if (cachedData) {
      console.log('✅ Returning cached weather data for:', location);
      return cachedData;
    }

    // Mobile-specific network check
    if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
      throw new Error('No internet connection. Please connect to wifi or mobile data and try again.');
    }

    // Step 1: Handle location input (either place name or coordinates)
    console.log(`Step 1: Processing location input "${location}"`);
    let locationData;
    
    // Check if input is coordinates (format: "lat, lon")
    const coordinatePattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
    if (coordinatePattern.test(location.trim())) {
      const [latStr, lonStr] = location.split(',').map(s => s.trim());
      const latitude = parseFloat(latStr);
      const longitude = parseFloat(lonStr);
      
      console.log(`Input is coordinates: ${latitude}, ${longitude}`);
      locationData = {
        latitude,
        longitude,
        name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        fullName: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        country: 'Unknown',
        confidence: 100
      };
    } else {
      // Regular geocoding for place names/postcodes
      console.log(`Geocoding location "${location}"`);
      locationData = await geocodeLocation(location);
    }
    
    console.log(`Location resolved to: ${locationData.fullName} (${locationData.latitude}, ${locationData.longitude})`);
    
    // Step 2: Fetch all 3 days of weather data at once (72-hour forecast)
    console.log(`Step 2: Fetching weather data for ${locationData.latitude}, ${locationData.longitude}`);
    const weatherResponse = await fetchWeatherData(
      locationData.latitude,
      locationData.longitude,
      3 // Get 3 days of data (today + 48 hours)
    );
    
    const allWeatherData = weatherResponse.hourlyData;
    console.log(`Fetched ${allWeatherData.length} hours of weather data`);
    console.log(`Timezone: ${weatherResponse.timezone} (${weatherResponse.timezoneAbbrev}), UTC offset: ${weatherResponse.utcOffsetSeconds}s`);
    
    // Step 3: Process weather data for each day
    const weeklyData: WeatherData[] = [];
    
    for (let dayIndex = 0; dayIndex < 3; dayIndex++) {
      try {
        console.log(`Step 3.${dayIndex + 1}: Processing day ${dayIndex + 1}`);
        const startHour = dayIndex * 24;
        const endHour = startHour + 24;
        const dayHourlyData = allWeatherData.slice(startHour, endHour);
        
        console.log(`Day ${dayIndex + 1}: ${dayHourlyData.length} hours of data (hours ${startHour}-${endHour-1})`);
        
        if (dayHourlyData.length === 0) {
          console.error(`No weather data available for day ${dayIndex + 1}`);
          throw new Error(`Weather data unavailable for day ${dayIndex + 1}. Real forecast data only goes ${dayIndex} days ahead.`);
        }
        
        // Fetch sunrise/sunset data for this day
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayIndex);
        const astronomyData = await fetchSunriseSunset(locationData.latitude, locationData.longitude, targetDate);
        
        // For today only, filter to current time onwards (ignore past hours)
        let filteredHourlyData = dayHourlyData;
        if (dayIndex === 0) { // Today
          // Get current hour in UK timezone (simple approach since we're UK/Ireland only)
          const currentUKHour = new Date().toLocaleString('en-GB', {
            hour: 'numeric',
            hour12: false,
            timeZone: UK_TIMEZONE
          });
          const currentLocationHour = parseInt(currentUKHour);

          console.log(`Today - filtering from current hour ${currentLocationHour} onwards (UK timezone)`);
          console.log(`Remaining daylight hours: ${currentLocationHour} to ${Math.floor(astronomyData.sunsetDecimal)} = ${Math.floor(astronomyData.sunsetDecimal) - currentLocationHour} hours`);

          // Debug the filtered hours to see what conditions look like
          console.log(`Remaining hours data:`, filteredHourlyData.slice(0, 3).map(h => `${h.time}: ${h.temperature}°C, ${h.humidity}% humidity, ${h.rainChance}% rain`));
          filteredHourlyData = dayHourlyData.slice(currentLocationHour);

          // If it's late in the day and we have no remaining hours, still process what's left
          if (filteredHourlyData.length === 0) {
            console.log("No remaining hours today - using all day data as fallback");
            filteredHourlyData = dayHourlyData;
          } else {
            console.log(`Filtered today's data: ${filteredHourlyData.length} hours remaining (was ${dayHourlyData.length})`);
          }
        }
        
        // Determine daily condition - use filtered data for today to reflect current and future hours only
        const conditionData = (dayIndex === 0) ? filteredHourlyData : dayHourlyData;
        const dailyCondition = determineDailyCondition(conditionData);
        
        // For today: Calculate full-day scores for display, but recommendation from current hour onwards
        let dayResult;
        let displayHourlyScores;
        
        if (dayIndex === 0) { // Today
          // Calculate full-day scores for UI display (all 24 hours)
          const fullDayResult = await calculateDryingConditions(dayHourlyData, locationData, astronomyData);
          displayHourlyScores = fullDayResult.hourlyScores;
          
          // Calculate recommendation using only current+future hours
          dayResult = await calculateDryingConditions(filteredHourlyData, locationData, astronomyData);
        } else {
          // Other days: use normal processing
          dayResult = await calculateDryingConditions(filteredHourlyData, locationData, astronomyData);
          displayHourlyScores = dayResult.hourlyScores;
        }
        
        weeklyData.push({
          hourly: dayHourlyData,
          hourlyScores: displayHourlyScores,
          dailySummary: {
            condition: dailyCondition,
            washingStatus: dayResult.recommendation.status
          },
          recommendation: dayResult.recommendation,
          astronomy: astronomyData
        });
      } catch (error) {
        console.error(`Failed to process day ${dayIndex}:`, error);
        throw new Error(`Weather data processing failed for day ${dayIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Step 4: Get recommendation for today (already calculated)
    const currentRecommendation = weeklyData[0].recommendation;
    
    // Step 5: Create short-term forecast with min/max values and drying windows
    const weeklyForecast: ShortTermForecastItem[] = weeklyData.map((data, index) => {
      const dryingWindows = data.recommendation.alternativeWindows ? 
        [data.recommendation.dryingWindow, ...data.recommendation.alternativeWindows].filter(Boolean) : 
        (data.recommendation.dryingWindow ? [data.recommendation.dryingWindow] : []);
      
      return {
        day: weekDays[index],
        condition: data.dailySummary.condition,
        washingStatus: data.dailySummary.washingStatus,
        dryingWindows: dryingWindows,
        primaryWindow: data.recommendation.dryingWindow,
        ...calculateDailyMinMaxValues(data.hourly)
      };
    });
    
    console.log(`Generated recommendation: ${currentRecommendation.status}`);

    // Get current UK local time (simple approach since we're UK/Ireland only)
    const currentLocalTime = getCurrentUKTime();

    const result = {
      currentRecommendation,
      weeklyForecast,
      weatherData: weeklyData,
      locationName: locationData.fullName,
      localTime: currentLocalTime,
      timezone: UK_TIMEZONE,
    };
    
    // Cache the result for future requests
    try {
      await cacheService.cacheWeatherData(location, result);
      console.log('📦 Cached weather data for:', location);
    } catch (cacheError) {
      console.warn('Cache storage failed:', cacheError);
    }
    
    return result;
    
  } catch (error) {
    console.error('Weather recommendation failed:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Provide clear error message to user - no fallback data
    let userMessage = "Weather service is currently unavailable.";
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      // Network-related errors
      if (errorMsg.includes("no internet connection") || 
          errorMsg.includes("connect to wifi") || 
          errorMsg.includes("mobile data")) {
        userMessage = error.message; // Use the specific network message
      }
      // UK/Ireland validation errors - highest priority for location errors
      else if (errorMsg.includes("UK/Ireland") || errorMsg.includes("outside") ||
               errorMsg.includes("only supports UK and Ireland")) {
        userMessage = `This app only works for UK and Ireland locations. "${location}" appears to be outside this region. Try a UK or Irish town instead (e.g., "London", "Dublin", "Edinburgh").`;
      }
      // Location not found errors
      else if (errorMsg.includes("not found") || errorMsg.includes("unable to find")) {
        userMessage = `Unable to find "${location}". Please check the spelling or try a different UK/Ireland location (e.g., "Manchester", "Belfast", "Cardiff").`;
      }
      // Generic location errors
      else if (errorMsg.includes("location")) {
        userMessage = error.message; // Use the specific location error message
      }
      // API service errors
      else if (errorMsg.includes("overloaded") || errorMsg.includes("temporarily") || 
               errorMsg.includes("technical difficulties") || errorMsg.includes("service error")) {
        userMessage = error.message; // Use the specific service error message
      }
      // Timeout errors
      else if (errorMsg.includes("timeout") || errorMsg.includes("timed out")) {
        userMessage = "Weather service is responding slowly. Please check your internet connection and try again.";
      }
      // Connection/fetch errors
      else if (errorMsg.includes("failed to fetch") || errorMsg.includes("networkerror") || 
               errorMsg.includes("unable to connect")) {
        userMessage = "Unable to connect to weather service. Please check your internet connection and try again.";
      }
      // Data format errors
      else if (errorMsg.includes("invalid data") || errorMsg.includes("corrupted data")) {
        userMessage = "Weather service returned invalid data. Please try again.";
      }
      // Specific weather data errors
      else if (errorMsg.includes("weather data unavailable")) {
        userMessage = error.message;
      }
      // Generic API errors with status codes
      else if (errorMsg.includes("weather service error") || errorMsg.includes("location service error")) {
        userMessage = error.message;
      }
      // Unknown errors - provide helpful generic message
      else {
        userMessage = "Weather service is currently unavailable. Please check your internet connection and try again.";
      }
    }
    
    throw new Error(userMessage);
  }
};


/**
 * Calculates daily min/max values from hourly forecast data
 */
const calculateDailyMinMaxValues = (hourlyData: HourlyForecast[]) => {
  if (!hourlyData || hourlyData.length === 0) {
    throw new Error('No hourly weather data available for min/max calculation');
  }

  const temperatures = hourlyData.map(h => h.temperature).filter(t => !isNaN(t) && t !== null && t !== undefined);
  const humidities = hourlyData.map(h => h.humidity).filter(h => !isNaN(h) && h !== null && h !== undefined);
  const dewPoints = hourlyData.map(h => h.dewPoint).filter(d => !isNaN(d) && d !== null && d !== undefined);

  console.log(`calculateDailyMinMaxValues: ${hourlyData.length} hours, ${temperatures.length} valid temps, ${humidities.length} valid humidity, ${dewPoints.length} valid dew points`);

  // Strict validation - require all data types
  if (temperatures.length === 0) {
    throw new Error('No valid temperature data available');
  }
  if (humidities.length === 0) {
    throw new Error('No valid humidity data available');
  }
  if (dewPoints.length === 0) {
    throw new Error('No valid dew point data available');
  }

  const result = {
    temperature: {
      min: Math.round(Math.min(...temperatures)),
      max: Math.round(Math.max(...temperatures))
    },
    humidity: {
      min: Math.round(Math.min(...humidities)),
      max: Math.round(Math.max(...humidities))
    },
    dewPoint: {
      min: Math.round(Math.min(...dewPoints)),
      max: Math.round(Math.max(...dewPoints))
    }
  };

  console.log('calculateDailyMinMaxValues result:', result);
  return result;
};

