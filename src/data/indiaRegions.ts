import type { LocationResult } from '../types/weather.ts';

export interface StateDistrictGroup {
  state: string;
  districts: LocationResult[];
}

export const INDIA_STATE_DISTRICTS: StateDistrictGroup[] = [
  {
    state: 'Gujarat',
    districts: [
      { id: 'gj-ahm', name: 'Ahmedabad', admin1: 'Gujarat', country: 'India', country_code: 'IN', latitude: 23.0225, longitude: 72.5714, timezone: 'Asia/Kolkata' },
      { id: 'gj-srt', name: 'Surat', admin1: 'Gujarat', country: 'India', country_code: 'IN', latitude: 21.1702, longitude: 72.8311, timezone: 'Asia/Kolkata' },
      { id: 'gj-vad', name: 'Vadodara', admin1: 'Gujarat', country: 'India', country_code: 'IN', latitude: 22.3072, longitude: 73.1812, timezone: 'Asia/Kolkata' },
      { id: 'gj-raj', name: 'Rajkot', admin1: 'Gujarat', country: 'India', country_code: 'IN', latitude: 22.3039, longitude: 70.8022, timezone: 'Asia/Kolkata' },
      { id: 'gj-bvn', name: 'Bhavnagar', admin1: 'Gujarat', country: 'India', country_code: 'IN', latitude: 21.7645, longitude: 72.1519, timezone: 'Asia/Kolkata' },
      { id: 'gj-jmn', name: 'Jamnagar', admin1: 'Gujarat', country: 'India', country_code: 'IN', latitude: 22.4707, longitude: 70.0577, timezone: 'Asia/Kolkata' },
      { id: 'gj-kch', name: 'Bhuj (Kutch)', admin1: 'Gujarat', country: 'India', country_code: 'IN', latitude: 23.2420, longitude: 69.6669, timezone: 'Asia/Kolkata' },
    ],
  },
  {
    state: 'Maharashtra',
    districts: [
      { id: 'mh-mum', name: 'Mumbai', admin1: 'Maharashtra', country: 'India', country_code: 'IN', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
      { id: 'mh-pun', name: 'Pune', admin1: 'Maharashtra', country: 'India', country_code: 'IN', latitude: 18.5204, longitude: 73.8567, timezone: 'Asia/Kolkata' },
      { id: 'mh-nag', name: 'Nagpur', admin1: 'Maharashtra', country: 'India', country_code: 'IN', latitude: 21.1458, longitude: 79.0882, timezone: 'Asia/Kolkata' },
      { id: 'mh-nsk', name: 'Nashik', admin1: 'Maharashtra', country: 'India', country_code: 'IN', latitude: 19.9975, longitude: 73.7898, timezone: 'Asia/Kolkata' },
      { id: 'mh-aur', name: 'Chhatrapati Sambhajinagar', admin1: 'Maharashtra', country: 'India', country_code: 'IN', latitude: 19.8762, longitude: 75.3433, timezone: 'Asia/Kolkata' },
      { id: 'mh-kol', name: 'Kolhapur', admin1: 'Maharashtra', country: 'India', country_code: 'IN', latitude: 16.7050, longitude: 74.2433, timezone: 'Asia/Kolkata' },
    ],
  },
  {
    state: 'Uttar Pradesh',
    districts: [
      { id: 'up-lko', name: 'Lucknow', admin1: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 26.8467, longitude: 80.9462, timezone: 'Asia/Kolkata' },
      { id: 'up-vns', name: 'Varanasi', admin1: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 25.3176, longitude: 82.9739, timezone: 'Asia/Kolkata' },
      { id: 'up-knp', name: 'Kanpur', admin1: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 26.4499, longitude: 80.3319, timezone: 'Asia/Kolkata' },
      { id: 'up-pry', name: 'Prayagraj', admin1: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 25.4358, longitude: 81.8463, timezone: 'Asia/Kolkata' },
      { id: 'up-gkp', name: 'Gorakhpur', admin1: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 26.7606, longitude: 83.3732, timezone: 'Asia/Kolkata' },
      { id: 'up-agr', name: 'Agra', admin1: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 27.1767, longitude: 78.0081, timezone: 'Asia/Kolkata' },
    ],
  },
  {
    state: 'Assam',
    districts: [
      { id: 'as-guw', name: 'Guwahati', admin1: 'Assam', country: 'India', country_code: 'IN', latitude: 26.1445, longitude: 91.7362, timezone: 'Asia/Kolkata' },
      { id: 'as-bis', name: 'Biswanath', admin1: 'Assam', country: 'India', country_code: 'IN', latitude: 26.7330, longitude: 93.1500, timezone: 'Asia/Kolkata' },
      { id: 'as-dib', name: 'Dibrugarh', admin1: 'Assam', country: 'India', country_code: 'IN', latitude: 27.4728, longitude: 94.9120, timezone: 'Asia/Kolkata' },
      { id: 'as-sil', name: 'Silchar', admin1: 'Assam', country: 'India', country_code: 'IN', latitude: 24.8333, longitude: 92.7789, timezone: 'Asia/Kolkata' },
      { id: 'as-jor', name: 'Jorhat', admin1: 'Assam', country: 'India', country_code: 'IN', latitude: 26.7509, longitude: 94.2037, timezone: 'Asia/Kolkata' },
    ],
  },
  {
    state: 'Andhra Pradesh',
    districts: [
      { id: 'ap-vsp', name: 'Visakhapatnam', admin1: 'Andhra Pradesh', country: 'India', country_code: 'IN', latitude: 17.6868, longitude: 83.2185, timezone: 'Asia/Kolkata' },
      { id: 'ap-vij', name: 'Vijayawada', admin1: 'Andhra Pradesh', country: 'India', country_code: 'IN', latitude: 16.5062, longitude: 80.6480, timezone: 'Asia/Kolkata' },
      { id: 'ap-tir', name: 'Tirupati', admin1: 'Andhra Pradesh', country: 'India', country_code: 'IN', latitude: 13.6288, longitude: 79.4192, timezone: 'Asia/Kolkata' },
      { id: 'ap-kak', name: 'Kakinada', admin1: 'Andhra Pradesh', country: 'India', country_code: 'IN', latitude: 16.9891, longitude: 82.2475, timezone: 'Asia/Kolkata' },
    ],
  },
  {
    state: 'Delhi',
    districts: [
      { id: 'dl-nd', name: 'Delhi', admin1: 'Delhi', country: 'India', country_code: 'IN', latitude: 28.6139, longitude: 77.2090, timezone: 'Asia/Kolkata' },
      { id: 'dl-dwk', name: 'Dwarka', admin1: 'Delhi', country: 'India', country_code: 'IN', latitude: 28.5921, longitude: 77.0460, timezone: 'Asia/Kolkata' },
      { id: 'dl-roh', name: 'Rohini', admin1: 'Delhi', country: 'India', country_code: 'IN', latitude: 28.7495, longitude: 77.0565, timezone: 'Asia/Kolkata' },
    ],
  },
  {
    state: 'Rajasthan',
    districts: [
      { id: 'rj-jai', name: 'Jaipur', admin1: 'Rajasthan', country: 'India', country_code: 'IN', latitude: 26.9124, longitude: 75.7873, timezone: 'Asia/Kolkata' },
      { id: 'rj-jod', name: 'Jodhpur', admin1: 'Rajasthan', country: 'India', country_code: 'IN', latitude: 26.2389, longitude: 73.0243, timezone: 'Asia/Kolkata' },
      { id: 'rj-uda', name: 'Udaipur', admin1: 'Rajasthan', country: 'India', country_code: 'IN', latitude: 24.5854, longitude: 73.7125, timezone: 'Asia/Kolkata' },
      { id: 'rj-kot', name: 'Kota', admin1: 'Rajasthan', country: 'India', country_code: 'IN', latitude: 25.2138, longitude: 75.8648, timezone: 'Asia/Kolkata' },
    ],
  },
  {
    state: 'Tamil Nadu',
    districts: [
      { id: 'tn-che', name: 'Chennai', admin1: 'Tamil Nadu', country: 'India', country_code: 'IN', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
      { id: 'tn-cbe', name: 'Coimbatore', admin1: 'Tamil Nadu', country: 'India', country_code: 'IN', latitude: 11.0168, longitude: 76.9558, timezone: 'Asia/Kolkata' },
      { id: 'tn-mdu', name: 'Madurai', admin1: 'Tamil Nadu', country: 'India', country_code: 'IN', latitude: 9.9252, longitude: 78.1198, timezone: 'Asia/Kolkata' },
    ],
  },
  {
    state: 'West Bengal',
    districts: [
      { id: 'wb-kol', name: 'Kolkata', admin1: 'West Bengal', country: 'India', country_code: 'IN', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata' },
      { id: 'wb-sil', name: 'Siliguri', admin1: 'West Bengal', country: 'India', country_code: 'IN', latitude: 26.7271, longitude: 88.3953, timezone: 'Asia/Kolkata' },
      { id: 'wb-dgp', name: 'Durgapur', admin1: 'West Bengal', country: 'India', country_code: 'IN', latitude: 23.5204, longitude: 87.3119, timezone: 'Asia/Kolkata' },
    ],
  },
  {
    state: 'Karnataka',
    districts: [
      { id: 'ka-blr', name: 'Bengaluru', admin1: 'Karnataka', country: 'India', country_code: 'IN', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
      { id: 'ka-mys', name: 'Mysuru', admin1: 'Karnataka', country: 'India', country_code: 'IN', latitude: 12.2958, longitude: 76.6394, timezone: 'Asia/Kolkata' },
      { id: 'ka-mng', name: 'Mangaluru', admin1: 'Karnataka', country: 'India', country_code: 'IN', latitude: 12.9141, longitude: 74.8560, timezone: 'Asia/Kolkata' },
    ],
  },
  {
    state: 'Kerala',
    districts: [
      { id: 'kl-koc', name: 'Kochi', admin1: 'Kerala', country: 'India', country_code: 'IN', latitude: 9.9312, longitude: 76.2673, timezone: 'Asia/Kolkata' },
      { id: 'kl-trv', name: 'Thiruvananthapuram', admin1: 'Kerala', country: 'India', country_code: 'IN', latitude: 8.5241, longitude: 76.9366, timezone: 'Asia/Kolkata' },
      { id: 'kl-koz', name: 'Kozhikode', admin1: 'Kerala', country: 'India', country_code: 'IN', latitude: 11.2588, longitude: 75.7804, timezone: 'Asia/Kolkata' },
    ],
  },
];

export function getDistrictsForState(stateName: string): LocationResult[] {
  const found = INDIA_STATE_DISTRICTS.find(
    (s) => s.state.toLowerCase() === stateName.trim().toLowerCase()
  );
  return found ? found.districts : INDIA_STATE_DISTRICTS[0].districts;
}
