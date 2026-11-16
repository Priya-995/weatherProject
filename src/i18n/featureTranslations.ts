import type { UILanguageCode, UserRoleType } from '../types/weather.ts';

export interface FeatureTranslationDict {
  navScene3d: string;
  searchGrounding: {
    title: string;
    subtitle: string;
    toggleBtn: string;
    hideBtn: string;
    placeholder: string;
    searchBtn: string;
    searching: string;
    verifyLocationBtn: string;
    sourcesTitle: string;
    queriesTitle: string;
    noSources: string;
    modelBadge: string;
    quickPromptsByRole: Record<UserRoleType, string[]>;
  };
  googleMaps: {
    placesPlaceholder: string;
    searchingPlaces: string;
    mapTypeRoadmap: string;
    mapTypeSatellite: string;
    mapTypeHybrid: string;
    mapTypeTerrain: string;
    open3dSceneBtn: string;
    clickMapHint: string;
    stationsShown: string;
    missingKeyTitle: string;
    missingKeyBody: string;
    providerAttribution: string;
  };
  scene3d: {
    title: string;
    subtitle: string;
    backToDashboard: string;
    hideControls: string;
    showControls: string;
    cameraLabel: string;
    camObservatory: string;
    camAnemometer: string;
    camAerial: string;
    camHorizon: string;
    weatherLabel: string;
    presetLive: string;
    presetClear: string;
    presetRain: string;
    presetStorm: string;
    presetNight: string;
    speedLabel: string;
    metricTemp: string;
    metricWind: string;
    metricCloud: string;
    metricRain: string;
    dragHint: string;
  };
}

export const FEATURE_TRANSLATIONS: Record<UILanguageCode, FeatureTranslationDict> = {
  en: {
    navScene3d: '3D Weather Scene',
    searchGrounding: {
      title: 'Live Web & Bulletin Verification',
      subtitle: 'Real-time Google Search grounding via Gemini 4 for breaking IMD bulletins, local weather disruptions & advisories.',
      toggleBtn: 'Live Web Search',
      hideBtn: 'Close Web Search',
      placeholder: 'Search live weather news, IMD bulletins, flood or highway updates...',
      searchBtn: 'Search Web',
      searching: 'Searching live web sources...',
      verifyLocationBtn: 'Verify Latest Web Bulletins',
      sourcesTitle: 'Verified Web Sources',
      queriesTitle: 'Google Search Queries',
      noSources: 'No external source links were returned for this query.',
      modelBadge: 'Gemini 4 · Google Search Grounded',
      quickPromptsByRole: {
        citizen: [
          'Latest IMD weather warnings & waterlogging news in {city} today',
          'Flight, train or traffic weather disruptions near {city}',
        ],
        farmer: [
          'Latest IMD Agromet bulletin & monsoon update near {city}',
          'Reservoir level & canal irrigation weather updates near {city}',
        ],
        government: [
          'Official IMD and state disaster management weather press releases for {city}',
          'District rainfall & flood monitoring advisories around {city}',
        ],
        disaster: [
          'NDMA Sachet & IMD severe weather or cyclone alert updates around {city}',
          'River level, dam release & highway closure weather alerts near {city}',
        ],
      },
    },
    googleMaps: {
      placesPlaceholder: 'Search any city, district or landmark (Google Places)...',
      searchingPlaces: 'Fetching Google Places...',
      mapTypeRoadmap: 'Map',
      mapTypeSatellite: 'Satellite',
      mapTypeHybrid: 'Hybrid',
      mapTypeTerrain: 'Terrain',
      open3dSceneBtn: 'Open 3D Scene',
      clickMapHint: 'Click any station marker or anywhere on Google Maps to inspect live Open-Meteo weather',
      stationsShown: 'live stations',
      missingKeyTitle: 'Google Maps API Key Required',
      missingKeyBody: 'Configure VITE_GOOGLE_MAPS_API_KEY in environment secrets to load interactive Google Maps and Places Search.',
      providerAttribution: 'Google Maps Platform · Open-Meteo Multi-Point Observations',
    },
    scene3d: {
      title: '3D Atmospheric Observatory',
      subtitle: 'Interactive WebGL station & live weather simulation',
      backToDashboard: 'Back to Dashboard',
      hideControls: 'Hide Controls',
      showControls: 'Show Controls',
      cameraLabel: 'Camera',
      camObservatory: 'Observatory',
      camAnemometer: 'Anemometer',
      camAerial: 'Aerial',
      camHorizon: 'Horizon',
      weatherLabel: 'Atmosphere',
      presetLive: 'Live Sync',
      presetClear: 'Clear Sun',
      presetRain: 'Monsoon Rain',
      presetStorm: 'Thunderstorm',
      presetNight: 'Clear Night',
      speedLabel: 'Motion',
      metricTemp: 'Temp',
      metricWind: 'Wind',
      metricCloud: 'Clouds',
      metricRain: 'Rain',
      dragHint: 'Drag to orbit · Scroll to zoom · Press H to toggle dock',
    },
  },
  hi: {
    navScene3d: '3D मौसम दृश्य',
    searchGrounding: {
      title: 'लाइव वेब और बुलेटिन सत्यापन',
      subtitle: 'ताज़ा IMD बुलेटिन, स्थानीय मौसम समाचार और सड़क/बाढ़ अपडेट के लिए Gemini 4 गूगल सर्च ग्राउंडिंग।',
      toggleBtn: 'लाइव वेब खोज',
      hideBtn: 'वेब खोज बंद करें',
      placeholder: 'ताज़ा मौसम समाचार, IMD बुलेटिन, बाढ़ या यातायात अपडेट खोजें...',
      searchBtn: 'वेब खोजें',
      searching: 'लाइव वेब स्रोत खोजे जा रहे हैं...',
      verifyLocationBtn: 'ताज़ा वेब बुलेटिन सत्यापित करें',
      sourcesTitle: 'सत्यापित वेब स्रोत',
      queriesTitle: 'Google सर्च क्वेरी',
      noSources: 'इस प्रश्न के लिए कोई बाहरी लिंक उपलब्ध नहीं हुआ।',
      modelBadge: 'Gemini 4 · Google Search सत्यापित',
      quickPromptsByRole: {
        citizen: [
          '{city} में आज की ताज़ा IMD चेतावनी और जलभराव समाचार',
          '{city} के पास मौसम के कारण उड़ान, ट्रेन या यातायात अपडेट',
        ],
        farmer: [
          '{city} के पास ताज़ा IMD एग्रोमेट सलाह और मानसून अपडेट',
          '{city} क्षेत्र में जलाशय और नहर सिंचाई मौसम अपडेट',
        ],
        government: [
          '{city} के लिए आधिकारिक IMD और राज्य आपदा प्रबंधन मौसम प्रेस विज्ञप्ति',
          '{city} क्षेत्र के जिला वर्षा और बाढ़ निगरानी बुलेटिन',
        ],
        disaster: [
          '{city} क्षेत्र के लिए NDMA सचेत और IMD गंभीर मौसम या चक्रवात अपडेट',
          '{city} के पास नदी जलस्तर, बांध निकासी और राजमार्ग मौसम अलर्ट',
        ],
      },
    },
    googleMaps: {
      placesPlaceholder: 'कोई भी शहर, जिला या स्थान खोजें (Google Places)...',
      searchingPlaces: 'Google Places खोज जारी है...',
      mapTypeRoadmap: 'मानचित्र',
      mapTypeSatellite: 'सैटेलाइट',
      mapTypeHybrid: 'हाइब्रिड',
      mapTypeTerrain: 'भू-भाग',
      open3dSceneBtn: '3D दृश्य खोलें',
      clickMapHint: 'लाइव Open-Meteo मौसम देखने के लिए किसी भी स्टेशन या मानचित्र पर क्लिक करें',
      stationsShown: 'लाइव स्टेशन',
      missingKeyTitle: 'Google Maps API कुंजी आवश्यक है',
      missingKeyBody: 'इंटरैक्टिव Google Maps और Places खोज लोड करने के लिए VITE_GOOGLE_MAPS_API_KEY कॉन्फ़िगर करें।',
      providerAttribution: 'Google Maps Platform · Open-Meteo बहु-बिंदु अवलोकन',
    },
    scene3d: {
      title: '3D वायुमंडलीय वेधशाला',
      subtitle: 'इंटरैक्टिव WebGL स्टेशन और लाइव मौसम अनुकरण',
      backToDashboard: 'डैशबोर्ड पर लौटें',
      hideControls: 'नियंत्रण छिपाएँ',
      showControls: 'नियंत्रण दिखाएँ',
      cameraLabel: 'कैमरा',
      camObservatory: 'वेधशाला',
      camAnemometer: 'पवन मापी',
      camAerial: 'हवाई दृश्य',
      camHorizon: 'क्षितिज',
      weatherLabel: 'वायुमंडल',
      presetLive: 'लाइव सिंक',
      presetClear: 'स्वच्छ धूप',
      presetRain: 'मानसूनी वर्षा',
      presetStorm: 'आंधी-तूफान',
      presetNight: 'स्वच्छ रात',
      speedLabel: 'गति',
      metricTemp: 'तापमान',
      metricWind: 'हवा',
      metricCloud: 'बादल',
      metricRain: 'वर्षा',
      dragHint: 'घुमाने के लिए ड्रैग करें · ज़ूम के लिए स्क्रॉल करें · H दबाएँ',
    },
  },
  gu: {
    navScene3d: '3D હવામાન દ્રશ્ય',
    searchGrounding: {
      title: 'લાઇવ વેબ અને બુલેટિન ચકાસણી',
      subtitle: 'તાજા IMD બુલેટિન, સ્થાનિક હવામાન સમાચાર અને મુસાફરી અપડેટ્સ માટે Gemini 4 Google Search ગ્રાઉન્ડિંગ.',
      toggleBtn: 'લાઇવ વેબ શોધ',
      hideBtn: 'વેબ શોધ બંધ કરો',
      placeholder: 'તાજા હવામાન સમાચાર, IMD બુલેટિન અથવા પૂર અપડેટ શોધો...',
      searchBtn: 'વેબ શોધો',
      searching: 'લાઇવ વેબ સ્ત્રોતો શોધાઈ રહ્યા છે...',
      verifyLocationBtn: 'તાજા વેબ બુલેટિન ચકાસો',
      sourcesTitle: 'ચકાસાયેલ વેબ સ્ત્રોતો',
      queriesTitle: 'Google Search પ્રશ્નો',
      noSources: 'આ પ્રશ્ન માટે કોઈ બાહ્ય સ્ત્રોત લિંક પ્રાપ્ત થઈ નથી.',
      modelBadge: 'Gemini 4 · Google Search આધારિત',
      quickPromptsByRole: {
        citizen: [
          '{city} માટે આજના તાજા IMD હવામાન ચેતવણી અને વરસાદ સમાચાર',
          '{city} આસપાસ હવામાનને કારણે ટ્રાફિક, ટ્રેન કે ફ્લાઇટ અપડેટ',
        ],
        farmer: [
          '{city} આસપાસ તાજા IMD એગ્રોમેટ ખેતી સલાહ અને વરસાદ અપડેટ',
          '{city} વિસ્તારના જળાશય અને સિંચાઈ હવામાન અપડેટ',
        ],
        government: [
          '{city} માટે સત્તાવાર IMD અને રાજ્ય આપત્તિ વ્યવસ્થાપન પ્રેસ રિલીઝ',
          '{city} જિલ્લાના વરસાદ અને પૂર નિરીક્ષણ અહેવાલો',
        ],
        disaster: [
          '{city} વિસ્તાર માટે NDMA સચેત અને IMD ભારે વરસાદ કે વાવાઝોડા અપડેટ',
          '{city} નજીક નદીની સપાટી, ડેમ છોડાણ અને હાઇવે ચેતવણી',
        ],
      },
    },
    googleMaps: {
      placesPlaceholder: 'કોઈપણ શહેર, જિલ્લો અથવા સ્થળ શોધો (Google Places)...',
      searchingPlaces: 'Google Places શોધ ચાલુ છે...',
      mapTypeRoadmap: 'નકશો',
      mapTypeSatellite: 'સેટેલાઇટ',
      mapTypeHybrid: 'હાઇબ્રિડ',
      mapTypeTerrain: 'ભૂપૃષ્ઠ',
      open3dSceneBtn: '3D દ્રશ્ય ખોલો',
      clickMapHint: 'લાઇવ Open-Meteo હવામાન જોવા માટે કોઈપણ સ્ટેશન કે નકશા પર ક્લિક કરો',
      stationsShown: 'લાઇવ સ્ટેશનો',
      missingKeyTitle: 'Google Maps API કી જરૂરી છે',
      missingKeyBody: 'ઇન્ટરેક્ટિવ Google Maps અને Places શોધ માટે VITE_GOOGLE_MAPS_API_KEY સેટ કરો.',
      providerAttribution: 'Google Maps Platform · Open-Meteo મલ્ટિ-પોઇન્ટ અવલોકન',
    },
    scene3d: {
      title: '3D વાતાવરણીય વેધશાળા',
      subtitle: 'ઇન્ટરેક્ટિવ WebGL સ્ટેશન અને લાઇવ હવામાન સિમ્યુલેશન',
      backToDashboard: 'ડેશબોર્ડ પર પાછા જાઓ',
      hideControls: 'નિયંત્રણો છુપાવો',
      showControls: 'નિયંત્રણો બતાવો',
      cameraLabel: 'કેમેરા',
      camObservatory: 'વેધશાળા',
      camAnemometer: 'પવન માપક',
      camAerial: 'હવાઈ દ્રશ્ય',
      camHorizon: 'ક્ષિતિજ',
      weatherLabel: 'વાતાવરણ',
      presetLive: 'લાઇવ સિંક',
      presetClear: 'સ્વચ્છ તડકો',
      presetRain: 'ચોમાસાનો વરસાદ',
      presetStorm: 'વાવાઝોડું',
      presetNight: 'શાંત રાત',
      speedLabel: 'ગતિ',
      metricTemp: 'તાપમાન',
      metricWind: 'પવન',
      metricCloud: 'વાદળો',
      metricRain: 'વરસાદ',
      dragHint: 'ફેરવવા ડ્રેગ કરો · ઝૂમ કરવા સ્ક્રોલ કરો · H દબાવો',
    },
  },
  mr: {
    navScene3d: '3D हवामान दृश्य',
    searchGrounding: {
      title: 'लाइव्ह वेब व बुलेटिन पडताळणी',
      subtitle: 'ताज्या IMD सूचना, स्थानिक हवामान बातम्या व प्रवास अपडेटसाठी Gemini 4 Google Search ग्राउंडिंग.',
      toggleBtn: 'लाइव्ह वेब शोध',
      hideBtn: 'वेब शोध बंद करा',
      placeholder: 'ताज्या हवामान बातम्या, IMD सूचना किंवा पूर अपडेट शोधा...',
      searchBtn: 'वेब शोधा',
      searching: 'लाइव्ह वेब स्रोत शोधत आहे...',
      verifyLocationBtn: 'ताजी वेब बुलेटिन तपासा',
      sourcesTitle: 'पडताळलेले वेब स्रोत',
      queriesTitle: 'Google Search प्रश्न',
      noSources: 'या प्रश्नासाठी बाह्य स्रोत दुवे मिळाले नाहीत.',
      modelBadge: 'Gemini 4 · Google Search आधारित',
      quickPromptsByRole: {
        citizen: [
          '{city} मधील आजचे ताजे IMD हवामान इशारे आणि पाऊस बातम्या',
          '{city} जवळ हवामानामुळे वाहतूक, रेल्वे किंवा विमान सेवा अपडेट',
        ],
        farmer: [
          '{city} परिसरातील ताजे IMD अ‍ॅग्रोमेट कृषी सल्ले आणि मान्सून अपडेट',
          '{city} क्षेत्रातील धरण पाणीसाठा व सिंचन हवामान अपडेट',
        ],
        government: [
          '{city} साठी अधिकृत IMD आणि राज्य आपत्ती व्यवस्थापन हवामान पत्रक',
          '{city} जिल्ह्यातील पाऊस आणि पूर निरीक्षण अहवाल',
        ],
        disaster: [
          '{city} परिसरासाठी NDMA सचेत आणि IMD तीव्र हवामान किंवा चक्रीवादळ अपडेट',
          '{city} जवळील नदी पातळी, धरण विसर्ग आणि महामार्ग इशारे',
        ],
      },
    },
    googleMaps: {
      placesPlaceholder: 'कोणतेही शहर, जिल्हा किंवा ठिकाण शोधा (Google Places)...',
      searchingPlaces: 'Google Places शोध सुरू आहे...',
      mapTypeRoadmap: 'नकाशा',
      mapTypeSatellite: 'सॅटेलाइट',
      mapTypeHybrid: 'हायब्रिड',
      mapTypeTerrain: 'भूप्रदेश',
      open3dSceneBtn: '3D दृश्य उघडा',
      clickMapHint: 'लाइव्ह Open-Meteo हवामान पाहण्यासाठी कोणत्याही केंद्रावर किंवा नकाशावर क्लिक करा',
      stationsShown: 'लाइव्ह केंद्रे',
      missingKeyTitle: 'Google Maps API की आवश्यक आहे',
      missingKeyBody: 'इंटरअ‍ॅक्टिव्ह Google Maps आणि Places शोधासाठी VITE_GOOGLE_MAPS_API_KEY सेट करा.',
      providerAttribution: 'Google Maps Platform · Open-Meteo बहु-बिंदू निरीक्षणे',
    },
    scene3d: {
      title: '3D वातावरणीय वेधशाळा',
      subtitle: 'इंटरअ‍ॅक्टिव्ह WebGL केंद्र आणि लाइव्ह हवामान सिम्युलेशन',
      backToDashboard: 'डॅशबोर्डवर परत जा',
      hideControls: 'नियंत्रणे लपवा',
      showControls: 'नियंत्रणे दाखवा',
      cameraLabel: 'कॅमेरा',
      camObservatory: 'वेधशाळा',
      camAnemometer: 'पवन मापक',
      camAerial: 'हवाई दृश्य',
      camHorizon: 'क्षितिज',
      weatherLabel: 'वातावरण',
      presetLive: 'लाइव्ह सिंक',
      presetClear: 'स्वच्छ सूर्यप्रकाश',
      presetRain: 'पावसाळी सरी',
      presetStorm: 'वादळी पाऊस',
      presetNight: 'स्वच्छ रात्र',
      speedLabel: 'वेग',
      metricTemp: 'तापमान',
      metricWind: 'वारा',
      metricCloud: 'ढग',
      metricRain: 'पाऊस',
      dragHint: 'फिरवण्यासाठी ड्रॅग करा · झूम करण्यासाठी स्क्रोल करा · H दाबा',
    },
  },
};

export function getFeatureDict(lang: UILanguageCode): FeatureTranslationDict {
  return FEATURE_TRANSLATIONS[lang] ?? FEATURE_TRANSLATIONS.en;
}
