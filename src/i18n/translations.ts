import type { UILanguageCode, UserRoleType } from '../types/weather.ts';

export interface TranslationDict {
  appName: string;
  nav: {
    dashboard: string;
    assistant: string;
    forecast: string;
    map: string;
    alerts: string;
    analytics: string;
    settings: string;
  };
  roles: Record<
    UserRoleType,
    {
      label: string;
      shortDesc: string;
      dashboardHeading: string;
      selectAction: string;
    }
  >;
  onboarding: {
    badge: string;
    title: string;
    subtitle: string;
    stepLanguageTitle: string;
    stepLanguageHint: string;
    stepRoleTitle: string;
    stepRoleHint: string;
    selectedTag: string;
    continueBtn: string;
    savedNotice: string;
  };
  common: {
    lightTheme: string;
    darkTheme: string;
    collapseSidebar: string;
    searchPlaceholder: string;
    quickStations: string;
    matchingLocations: string;
    searchingLocations: string;
    noMatchingLocations: string;
    stations: string;
    refresh: string;
    retry: string;
    updated: string;
    observed: string;
    localTime: string;
    today: string;
    tomorrow: string;
    feelsLike: string;
    humidity: string;
    windSpeed: string;
    rainProbability: string;
    precipitation: string;
    sunrise: string;
    sunset: string;
    current: string;
    next24h: string;
    source: string;
    weatherUnavailable: string;
    askWeatherGpt: string;
    openSettings: string;
    languageLabel: string;
    roleLabel: string;
    stateLabel: string;
    districtLabel: string;
    nonOfficialNote: string;
    officialSourceNote: string;
    loading: string;
  };
  citizen: {
    everydaySummaryTitle: string;
    umbrellaCarry: string;
    umbrellaNotNeeded: string;
    commuteSafe: string;
    commuteCaution: string;
    outdoorGood: string;
    outdoorAvoidHeat: string;
    outdoorAvoidRain: string;
    travelAdviceLabel: string;
    outdoorAdviceLabel: string;
    precautionsLabel: string;
    localAlertHeading: string;
    noLocalAlertText: string;
    hourlyHeading: string;
    hourlySub: string;
    dailyHeading: string;
    dailySub: string;
    askExamplesTitle: string;
    sampleQ1: string;
    sampleQ2: string;
    sampleQ3: string;
  };
  farmer: {
    farmWeatherTitle: string;
    rainOutlook7d: string;
    drySpellCheck: string;
    drySpellDetected: string;
    noDrySpell: string;
    sprayingTitle: string;
    sprayingGood: string;
    sprayingCaution: string;
    irrigationTitle: string;
    irrigationWaitRain: string;
    irrigationNormalCheck: string;
    sowingHarvestTitle: string;
    sowingRainNote: string;
    sowingDryNote: string;
    cropProtectionTitle: string;
    cropProtectHeat: string;
    cropProtectStorm: string;
    cropProtectGeneral: string;
    agrometHeading: string;
    agrometDisclaimer: string;
    agrometLinkImd: string;
    agrometLinkMeghdoot: string;
    rainSum7d: string;
    past7dRain: string;
    maxWindToday: string;
  };
  government: {
    overviewTitle: string;
    overviewSub: string;
    selectState: string;
    districtsMonitored: string;
    activeStateWarnings: string;
    avgStateTemp: string;
    peakRainProb: string;
    districtColumn: string;
    conditionColumn: string;
    tempColumn: string;
    rainProbColumn: string;
    windColumn: string;
    warningsColumn: string;
    actionColumn: string;
    setLocationBtn: string;
    noWarningsDistrict: string;
    officialBulletinsTitle: string;
    noStateBulletins: string;
    districtChartTitle: string;
    verifySource: string;
  };
  disaster: {
    opsTitle: string;
    opsSub: string;
    activeSevereCount: string;
    highRiskZones: string;
    cycloneHeavyRainTitle: string;
    cycloneHeavyRainNone: string;
    warningTimelineTitle: string;
    affectedAreasTitle: string;
    preparednessTitle: string;
    preparednessDisclaimer: string;
    prepItem1: string;
    prepItem2: string;
    prepItem3: string;
    prepItem4: string;
    officialLinksTitle: string;
    linkSachet: string;
    linkImd: string;
    linkCwc: string;
    viewAllAlertsBtn: string;
  };
  alerts: {
    heading: string;
    subheading: string;
    checkFeedBtn: string;
    officialSectionTitle: string;
    feedConnected: string;
    feedUnavailable: string;
    queryingFeed: string;
    verifySachet: string;
    imdMausam: string;
    noLocalWarnings: string;
    otherNationalTitle: string;
    derivedSectionTitle: string;
    derivedSectionSub: string;
    noDerivedThresholds: string;
    filterAll: string;
    filterActive: string;
    filterUpcoming: string;
    filterExpired: string;
    severityLabel: string;
    authorityLabel: string;
    validFromLabel: string;
    validUntilLabel: string;
    explainAiBtn: string;
    explainingAi: string;
    aiExplanationHeader: string;
    aiExplanationDisclaimer: string;
    dedupMeta: string;
    expiredMeta: string;
    statusActive: string;
    statusUpcoming: string;
    statusExpired: string;
  };
  assistant: {
    conversations: string;
    newChat: string;
    loadingConvs: string;
    noConvsTitle: string;
    noConvsBody: string;
    anyLocation: string;
    contextLabel: string;
    inspectRoles: string;
    hideRoles: string;
    emptyHeading: string;
    emptySub: string;
    thinking: string;
    listen: string;
    stop: string;
    speakHint: string;
    stopVoiceHint: string;
    inputPlaceholder: string;
    send: string;
    groqMissingTitle: string;
    groqMissingBody: string;
    roleContextBadge: string;
    toolResultLabel: string;
    samplePromptsByRole: Record<UserRoleType, string[]>;
  };
  forecast: {
    heading: string;
    bestMatch: string;
    gfsSeamless: string;
    hourlyTempTitle: string;
    rainProbTitle: string;
    dailyRangeTitle: string;
    tableTitle: string;
    colDate: string;
    colCondition: string;
    colMinMax: string;
    colRainProb: string;
    colRainSum: string;
    colMaxWind: string;
    colUvMax: string;
    colSun: string;
    tempSeries: string;
    feelsSeries: string;
    rainMmSeries: string;
    rainProbSeries: string;
    maxSeries: string;
    minSeries: string;
  };
  map: {
    jumpPlaceholder: string;
    refreshStations: string;
    tempLayer: string;
    rainLayer: string;
    footerSource: string;
    footerHint: string;
    loadingPoint: string;
    setActiveBtn: string;
    windLabel: string;
  };
  analytics: {
    heading: string;
    archiveLabel: string;
    pastDaysBtn: string;
    compareWith: string;
    histVsFcTitle: string;
    histVsFcSub: string;
    forecastStart: string;
    histMax: string;
    histMin: string;
    fcMax: string;
    fcMin: string;
    histRainTitle: string;
    histRainSub: string;
    observedRainSeries: string;
    compareTitle: string;
    compareSub: string;
    nowLabel: string;
    floodModuleTitle: string;
    floodStatusPrefix: string;
  };
  settings: {
    heading: string;
    subheading: string;
    languageCardTitle: string;
    languageCardSub: string;
    roleCardTitle: string;
    roleCardSub: string;
    displayCardTitle: string;
    displayCardSub: string;
    unitLabel: string;
    themeLabel: string;
    resetOnboardingTitle: string;
    resetOnboardingSub: string;
    resetOnboardingBtn: string;
    activeBadge: string;
  };
  conditions: Record<string, string>;
  windDirs: Record<string, string>;
}

export const TRANSLATIONS: Record<UILanguageCode, TranslationDict> = {
  en: {
    appName: 'WeatherGPT',
    nav: {
      dashboard: 'Dashboard',
      assistant: 'WeatherGPT Assistant',
      forecast: 'Forecast',
      map: 'Weather Map',
      alerts: 'Weather Alerts',
      analytics: 'Weather Analytics',
      settings: 'Settings',
    },
    roles: {
      citizen: {
        label: 'Citizen',
        shortDesc: 'Simple daily weather, rain warnings, commuting & outdoor advice.',
        dashboardHeading: 'Daily Weather & Local Guide',
        selectAction: 'Select Citizen',
      },
      farmer: {
        label: 'Farmer',
        shortDesc: 'Rainfall outlook, wind for spraying, irrigation & crop protection guidance.',
        dashboardHeading: 'Farm Weather & Field Advisory',
        selectAction: 'Select Farmer',
      },
      government: {
        label: 'Government Agency',
        shortDesc: 'State & district monitoring, official IMD warnings, severity & trends.',
        dashboardHeading: 'State & District Weather Monitor',
        selectAction: 'Select Government Agency',
      },
      disaster: {
        label: 'Disaster Manager',
        shortDesc: 'Severe weather operations, warning timelines, affected districts & readiness.',
        dashboardHeading: 'Severe Weather Operations Monitor',
        selectAction: 'Select Disaster Manager',
      },
    },
    onboarding: {
      badge: 'Personalized Weather Intelligence',
      title: 'Welcome to WeatherGPT',
      subtitle: 'Choose your preferred language and role to tailor forecasts, alerts, and the AI assistant to your needs.',
      stepLanguageTitle: 'A. Select your language',
      stepLanguageHint: 'Translates the entire platform and AI responses immediately.',
      stepRoleTitle: 'B. Select your user type',
      stepRoleHint: 'Customizes dashboard metrics, recommendations, and warning views.',
      selectedTag: 'Selected',
      continueBtn: 'Open Personalized WeatherGPT',
      savedNotice: 'Saved on this device. You can change language or user type anytime in Settings.',
    },
    common: {
      lightTheme: 'Light Theme',
      darkTheme: 'Dark Theme',
      collapseSidebar: 'Collapse Sidebar',
      searchPlaceholder: 'Search city, district or town...',
      quickStations: 'Quick Indian Stations',
      matchingLocations: 'Matching Locations (Open-Meteo Geocoding)',
      searchingLocations: 'Searching locations...',
      noMatchingLocations: 'No matching locations found.',
      stations: 'Stations',
      refresh: 'Refresh',
      retry: 'Retry Live Fetch',
      updated: 'Updated',
      observed: 'Observed',
      localTime: 'local time',
      today: 'Today',
      tomorrow: 'Tomorrow',
      feelsLike: 'Feels Like',
      humidity: 'Humidity',
      windSpeed: 'Wind Speed',
      rainProbability: 'Rain Probability',
      precipitation: 'Precipitation',
      sunrise: 'Sunrise',
      sunset: 'Sunset',
      current: 'current',
      next24h: 'Next 24h',
      source: 'Source',
      weatherUnavailable: 'Weather Data Unavailable',
      askWeatherGpt: 'Ask WeatherGPT',
      openSettings: 'Settings',
      languageLabel: 'Language',
      roleLabel: 'Profile',
      stateLabel: 'State',
      districtLabel: 'District',
      nonOfficialNote: 'AI / Forecast Advisory (Non-Official)',
      officialSourceNote: 'Official IMD / NDMA Source',
      loading: 'Loading...',
    },
    citizen: {
      everydaySummaryTitle: 'Everyday Guidance for Today',
      umbrellaCarry: 'Rain is expected in your area. Consider carrying an umbrella.',
      umbrellaNotNeeded: 'Low chance of rain today. An umbrella is likely not needed.',
      commuteSafe: 'Roads look clear with manageable winds for daily commuting.',
      commuteCaution: 'Allow extra travel time due to expected rain or strong winds.',
      outdoorGood: 'Comfortable window for outdoor errands and walks, especially morning or evening.',
      outdoorAvoidHeat: 'High afternoon heat expected. Limit strenuous outdoor activity between 12 PM and 4 PM.',
      outdoorAvoidRain: 'Wet weather expected. Prefer indoor plans during peak rain hours.',
      travelAdviceLabel: 'Travel & Commuting',
      outdoorAdviceLabel: 'Outdoor Activities',
      precautionsLabel: 'Practical Precautions',
      localAlertHeading: 'Local Weather Warnings',
      noLocalAlertText: 'No active official severe warnings for your area right now.',
      hourlyHeading: '24-Hour Hourly Forecast',
      hourlySub: 'Temperature and rain chances over the next 24 hours',
      dailyHeading: '7-Day Outlook',
      dailySub: 'Daily high/low temperatures and rain probability',
      askExamplesTitle: 'Quick Questions for WeatherGPT',
      sampleQ1: 'Will it rain in my area tomorrow?',
      sampleQ2: 'Should I carry an umbrella today?',
      sampleQ3: 'What will the temperature be tomorrow morning?',
    },
    farmer: {
      farmWeatherTitle: 'Field & Farm Weather Summary',
      rainOutlook7d: '7-Day Rain Outlook',
      drySpellCheck: 'Recent Rainfall / Dry Spell Check',
      drySpellDetected: 'Low or zero rainfall recorded over the past 7 days — monitor soil moisture closely.',
      noDrySpell: 'Recent rainfall recorded in the past 7 days — check field drainage before watering.',
      sprayingTitle: 'Wind & Spraying Conditions',
      sprayingGood: 'Light to moderate winds right now. Better conditions for routine field spraying if rain is not imminent.',
      sprayingCaution: 'Strong winds detected. Avoid pesticide or foliar spraying to prevent spray drift.',
      irrigationTitle: 'Irrigation Consideration',
      irrigationWaitRain: 'Rain is expected soon. Consider checking soil moisture before scheduling irrigation.',
      irrigationNormalCheck: 'Minimal rain forecast over the next 48 hours. Check crop root-zone moisture before watering.',
      sowingHarvestTitle: 'Sowing & Harvesting Consideration',
      sowingRainNote: 'Rainy windows ahead — protect harvested produce and check drainage in newly sown plots.',
      sowingDryNote: 'Mainly dry forecast window — favourable for harvesting, threshing, and sun-drying if soil permits.',
      cropProtectionTitle: 'General Crop Protection Suggestions',
      cropProtectHeat: 'High temperatures forecast — consider mulching or morning/evening watering to reduce heat stress.',
      cropProtectStorm: 'Gusty winds or storm signals forecast — inspect young plants, shade nets, and farm sheds.',
      cropProtectGeneral: 'Review official Agromet bulletins before fertilizer or crop-specific applications.',
      agrometHeading: 'Official Agricultural Advisories',
      agrometDisclaimer: 'Weather metrics come from live Open-Meteo data. Always consult authorized IMD Agromet bulletins for crop-specific decisions.',
      agrometLinkImd: 'IMD Agromet Advisories (AAS)',
      agrometLinkMeghdoot: 'Meghdoot Farmer Portal',
      rainSum7d: '7-Day Forecast Rain',
      past7dRain: 'Past 7-Day Rain (ERA5)',
      maxWindToday: 'Peak Wind Today',
    },
    government: {
      overviewTitle: 'State & District Weather Monitoring',
      overviewSub: 'Multi-district live weather telemetry paired with official IMD / NDMA CAP warnings.',
      selectState: 'Select State',
      districtsMonitored: 'Districts Monitored',
      activeStateWarnings: 'Active State Official Warnings',
      avgStateTemp: 'Average District Temp',
      peakRainProb: 'Peak District Rain Prob',
      districtColumn: 'District',
      conditionColumn: 'Current Condition',
      tempColumn: 'Temp / Feels',
      rainProbColumn: 'Rain Prob / Precip',
      windColumn: 'Wind',
      warningsColumn: 'Official Alerts',
      actionColumn: 'Inspect',
      setLocationBtn: 'Focus District',
      noWarningsDistrict: 'None matched',
      officialBulletinsTitle: 'Official Government Bulletins for State',
      noStateBulletins: 'No active official IMD/NDMA CAP bulletins currently match this state.',
      districtChartTitle: 'District Temperature & Rain Probability Comparison',
      verifySource: 'Verify on NDMA Sachet',
    },
    disaster: {
      opsTitle: 'Severe Weather Operations Monitor',
      opsSub: 'Prioritized active warnings, affected districts, timelines, and preparedness coordination.',
      activeSevereCount: 'Active Severe Warnings (Red / Orange)',
      highRiskZones: 'Affected Areas / Districts',
      cycloneHeavyRainTitle: 'Heavy Rainfall, Thunderstorm & Cyclone Signals',
      cycloneHeavyRainNone: 'No active Red/Orange cyclone or extreme rainfall CAP warnings matched the selected region.',
      warningTimelineTitle: 'Active & Upcoming Warning Timelines',
      affectedAreasTitle: 'Geographic Distribution Across Monitored Hubs',
      preparednessTitle: 'Preparedness Recommendations',
      preparednessDisclaimer: 'Operational guidance below is generated from live weather feeds and is NOT an official government directive.',
      prepItem1: 'Verify official CAP validity windows and district boundaries directly with NDMA Sachet and State SDMAs.',
      prepItem2: 'Pre-position drainage, dewatering, and power-restoration teams where Red or Orange alerts are active.',
      prepItem3: 'Disseminate localized public advisories in regional languages ahead of forecasted thunderstorm or heavy rain peaks.',
      prepItem4: 'Monitor river basin rainfall accumulations and low-lying road underpasses during ≥20 mm/24h events.',
      officialLinksTitle: 'Official Government Feeds & Portals',
      linkSachet: 'NDMA Sachet CAP Portal',
      linkImd: 'IMD Mausam Warnings',
      linkCwc: 'Central Water Commission Flood Forecast',
      viewAllAlertsBtn: 'Open Full Alerts Console',
    },
    alerts: {
      heading: 'Weather Alerts & Precautions',
      subheading: 'Official IMD / NDMA CAP bulletins are strictly separated from derived forecast advisories and AI explanations.',
      checkFeedBtn: 'Refresh Official Feed',
      officialSectionTitle: 'Official Weather Warnings (IMD / NDMA CAP)',
      feedConnected: 'Live Official Feed Connected',
      feedUnavailable: 'Official Feed Unavailable',
      queryingFeed: 'Querying official IMD / NDMA Sachet CAP feed...',
      verifySachet: 'Verify on NDMA Sachet',
      imdMausam: 'IMD Mausam',
      noLocalWarnings: 'No active official government warnings are currently reported for',
      otherNationalTitle: 'Other Official Bulletins Across India',
      derivedSectionTitle: 'Meteorological Threshold Advisories (Non-Official)',
      derivedSectionSub: 'Automated risk checks computed from live Open-Meteo 24-hour forecast thresholds (heat ≥ 40°C, rain ≥ 20mm / 70%, winds ≥ 35 km/h, thunderstorm codes).',
      noDerivedThresholds: 'No elevated heat, heavy rainfall, thunderstorm, or high-wind thresholds exceeded in the next 24 hours for',
      filterAll: 'All',
      filterActive: 'Active',
      filterUpcoming: 'Upcoming',
      filterExpired: 'Expired',
      severityLabel: 'Official Severity',
      authorityLabel: 'Issuing Authority',
      validFromLabel: 'From',
      validUntilLabel: 'Until',
      explainAiBtn: 'Explain for My Role (AI)',
      explainingAi: 'Generating plain-language guidance...',
      aiExplanationHeader: 'Role-Tailored Plain Explanation (AI · Non-Official)',
      aiExplanationDisclaimer: 'Generated by Groq AI to simplify the bulletin above. Always follow official IMD/SDMA instructions.',
      dedupMeta: 'duplicates merged',
      expiredMeta: 'expired bulletins',
      statusActive: 'Active',
      statusUpcoming: 'Upcoming',
      statusExpired: 'Expired',
    },
    assistant: {
      conversations: 'Conversations',
      newChat: 'New Chat',
      loadingConvs: 'Loading saved conversations...',
      noConvsTitle: 'No conversations yet',
      noConvsBody: 'Ask WeatherGPT a question below or click New Chat to start a persistent session.',
      anyLocation: 'Any location',
      contextLabel: 'Context',
      inspectRoles: 'Inspect DB Roles',
      hideRoles: 'Hide System Roles',
      emptyHeading: 'Ask live meteorological questions with contextual memory',
      emptySub: 'WeatherGPT invokes real Open-Meteo and IMD weather tools via Groq before answering, tailored to your selected role and language.',
      thinking: 'Querying live weather tools and generating grounded Groq response...',
      listen: 'Listen',
      stop: 'Stop',
      speakHint: 'Speak question',
      stopVoiceHint: 'Stop voice input',
      inputPlaceholder: 'Ask WeatherGPT in',
      send: 'Send',
      groqMissingTitle: 'Groq API key required on server:',
      groqMissingBody: 'Set GROQ_API_KEY in server environment or AI Studio Secrets to enable live responses.',
      roleContextBadge: 'Mode',
      toolResultLabel: 'Tool result',
      samplePromptsByRole: {
        citizen: [
          'What is the weather in Ahmedabad today?',
          'Should I carry an umbrella tomorrow?',
          'Compare Delhi and Mumbai weather.',
          'What precautions should I take during heavy rainfall?',
        ],
        farmer: [
          'Will it rain in my area in the next 3 days?',
          'Are wind speeds safe for spraying crops today?',
          'Check past 14-day rainfall and dry spell status.',
          'Should I irrigate today based on the forecast?',
        ],
        government: [
          'Summarize active IMD/NDMA weather warnings in Assam and Gujarat.',
          'Compare 7-day rainfall outlook between Lucknow and Varanasi.',
          'Check severe weather alerts and validity times for Guwahati.',
          'Give a 14-day historical vs forecast rainfall summary for Patna.',
        ],
        disaster: [
          'List all active severe weather warnings and affected districts.',
          'What is the thunderstorm and wind gust outlook for Guwahati today?',
          'Compare cyclone/heavy rain risk across Mumbai and Visakhapatnam.',
          'What operational precautions apply if heavy rainfall >50mm is forecast?',
        ],
      },
    },
    forecast: {
      heading: '48-Hour & 7-Day Forecast',
      bestMatch: 'Open-Meteo Best Match',
      gfsSeamless: 'NOAA GFS Seamless',
      hourlyTempTitle: '48-Hour Hourly Temperature & Feels-Like',
      rainProbTitle: 'Rain Probability (%) & Precipitation (mm)',
      dailyRangeTitle: '7-Day Daily Temperature Range',
      tableTitle: '7-Day Detailed Outlook',
      colDate: 'Date',
      colCondition: 'Condition',
      colMinMax: 'Min / Max',
      colRainProb: 'Rain Prob',
      colRainSum: 'Rain Sum',
      colMaxWind: 'Max Wind',
      colUvMax: 'UV Max',
      colSun: 'Sunrise / Sunset',
      tempSeries: 'Temp',
      feelsSeries: 'Feels Like',
      rainMmSeries: 'Rain (mm)',
      rainProbSeries: 'Rain Prob (%)',
      maxSeries: 'Max',
      minSeries: 'Min',
    },
    map: {
      jumpPlaceholder: 'Jump map to city...',
      refreshStations: 'Refresh Stations',
      tempLayer: 'Temperature Layer',
      rainLayer: 'Rainfall Layer',
      footerSource: 'Base map: OpenStreetMap · Station data: Open-Meteo Multi-Point API',
      footerHint: 'Click any marker or anywhere on the map to inspect live coordinates',
      loadingPoint: 'Loading live coordinate weather...',
      setActiveBtn: 'Set as Active Dashboard Location',
      windLabel: 'Wind',
    },
    analytics: {
      heading: 'Weather Analytics',
      archiveLabel: 'Archive',
      pastDaysBtn: 'Past {days} Days',
      compareWith: 'Compare with:',
      histVsFcTitle: 'Historical Observations vs. Future Forecast Temperature',
      histVsFcSub: 'Solid lines denote ERA5 historical observations; dashed lines denote 7-day forecast model output.',
      forecastStart: 'Forecast Start',
      histMax: 'Historical Max',
      histMin: 'Historical Min',
      fcMax: 'Forecast Max',
      fcMin: 'Forecast Min',
      histRainTitle: 'Historical Daily Rainfall (mm) — Past {days} Days',
      histRainSub: 'Observed ERA5 daily precipitation totals for',
      observedRainSeries: 'Observed Rain (mm)',
      compareTitle: 'Location Comparison',
      compareSub: '7-day forecast daily high temperatures',
      nowLabel: 'Now',
      floodModuleTitle: 'Future Flood Prediction Integration',
      floodStatusPrefix: 'Status',
    },
    settings: {
      heading: 'Platform Settings & Personalization',
      subheading: 'Manage your interface language, user experience role, measurement units, and visual theme.',
      languageCardTitle: 'Interface & AI Language',
      languageCardSub: 'Changes all menus, labels, charts, alerts, and AI assistant replies immediately without reloading.',
      roleCardTitle: 'User Experience Profile',
      roleCardSub: 'Adapts the Dashboard layout, recommendations, and AI guidance to your needs.',
      displayCardTitle: 'Measurement & Appearance',
      displayCardSub: 'Adjust temperature units and light/dark color mode.',
      unitLabel: 'Temperature Unit',
      themeLabel: 'Color Theme',
      resetOnboardingTitle: 'Initial Setup Screen',
      resetOnboardingSub: 'Re-open the welcome setup screen to review language and role selection.',
      resetOnboardingBtn: 'Re-open Setup Screen',
      activeBadge: 'Active',
    },
    conditions: {
      'Clear sky': 'Clear sky',
      'Mainly clear': 'Mainly clear',
      'Partly cloudy': 'Partly cloudy',
      Overcast: 'Overcast',
      Fog: 'Fog',
      'Depositing rime fog': 'Rime fog',
      'Light drizzle': 'Light drizzle',
      'Moderate drizzle': 'Moderate drizzle',
      'Dense drizzle': 'Dense drizzle',
      'Light freezing drizzle': 'Light freezing drizzle',
      'Dense freezing drizzle': 'Dense freezing drizzle',
      'Slight rain': 'Light rain',
      'Moderate rain': 'Moderate rain',
      'Heavy rain': 'Heavy rain',
      'Light freezing rain': 'Light freezing rain',
      'Heavy freezing rain': 'Heavy freezing rain',
      'Slight snow fall': 'Light snow',
      'Moderate snow fall': 'Moderate snow',
      'Heavy snow fall': 'Heavy snow',
      'Snow grains': 'Snow grains',
      'Slight rain showers': 'Light rain showers',
      'Moderate rain showers': 'Moderate rain showers',
      'Violent rain showers': 'Heavy rain showers',
      'Slight snow showers': 'Light snow showers',
      'Heavy snow showers': 'Heavy snow showers',
      Thunderstorm: 'Thunderstorm',
      'Thunderstorm with slight hail': 'Thunderstorm with hail',
      'Thunderstorm with heavy hail': 'Severe thunderstorm with hail',
      'Variable conditions': 'Variable conditions',
    },
    windDirs: {
      N: 'N', NNE: 'NNE', NE: 'NE', ENE: 'ENE',
      E: 'E', ESE: 'ESE', SE: 'SE', SSE: 'SSE',
      S: 'S', SSW: 'SSW', SW: 'SW', WSW: 'WSW',
      W: 'W', WNW: 'WNW', NW: 'NW', NNW: 'NNW',
    },
  },

  hi: {
    appName: 'WeatherGPT',
    nav: {
      dashboard: 'डैशबोर्ड',
      assistant: 'WeatherGPT सहायक',
      forecast: 'मौसम पूर्वानुमान',
      map: 'मौसम मानचित्र',
      alerts: 'मौसम चेतावनियाँ',
      analytics: 'मौसम विश्लेषण',
      settings: 'सेटिंग्स',
    },
    roles: {
      citizen: {
        label: 'नागरिक',
        shortDesc: 'दैनिक मौसम, बारिश की चेतावनी, यात्रा और बाहरी गतिविधियों की सरल सलाह।',
        dashboardHeading: 'दैनिक मौसम और स्थानीय मार्गदर्शन',
        selectAction: 'नागरिक चुनें',
      },
      farmer: {
        label: 'किसान',
        shortDesc: 'बारिश पूर्वानुमान, छिड़काव के लिए हवा, सिंचाई और फसल सुरक्षा सुझाव।',
        dashboardHeading: 'खेती मौसम और कृषि सलाह',
        selectAction: 'किसान चुनें',
      },
      government: {
        label: 'सरकारी एजेंसी',
        shortDesc: 'राज्य व जिला निगरानी, आधिकारिक IMD चेतावनियाँ, गंभीरता और रुझान।',
        dashboardHeading: 'राज्य एवं जिला मौसम निगरानी',
        selectAction: 'सरकारी एजेंसी चुनें',
      },
      disaster: {
        label: 'आपदा प्रबंधक',
        shortDesc: 'गंभीर मौसम संचालन, चेतावनी समय-सीमा, प्रभावित जिले और तैयारी समन्वय।',
        dashboardHeading: 'आपदा मौसम संचालन केंद्र',
        selectAction: 'आपदा प्रबंधक चुनें',
      },
    },
    onboarding: {
      badge: 'व्यक्तिगत मौसम इंटेलिजेंस',
      title: 'WeatherGPT में आपका स्वागत है',
      subtitle: 'अपनी आवश्यकता के अनुसार पूर्वानुमान, चेतावनियाँ और AI सहायक को अनुकूलित करने के लिए भाषा और भूमिका चुनें।',
      stepLanguageTitle: 'A. अपनी भाषा चुनें',
      stepLanguageHint: 'पूरा प्लेटफ़ॉर्म और AI उत्तर तुरंत चयनित भाषा में बदल जाएंगे।',
      stepRoleTitle: 'B. अपनी उपयोगकर्ता श्रेणी चुनें',
      stepRoleHint: 'डैशबोर्ड जानकारी, सुझाव और चेतावनी प्राथमिकता को आपके अनुसार ढालता है।',
      selectedTag: 'चयनित',
      continueBtn: 'अपना WeatherGPT डैशबोर्ड खोलें',
      savedNotice: 'यह चयन आपके डिवाइस पर सहेजा जाता है। आप सेटिंग्स में कभी भी भाषा या भूमिका बदल सकते हैं।',
    },
    common: {
      lightTheme: 'लाइट थीम',
      darkTheme: 'डार्क थीम',
      collapseSidebar: 'साइडबार समेटें',
      searchPlaceholder: 'शहर, जिला या कस्बा खोजें...',
      quickStations: 'प्रमुख भारतीय केंद्र',
      matchingLocations: 'मिलते-जुलते स्थान (Open-Meteo)',
      searchingLocations: 'स्थान खोजे जा रहे हैं...',
      noMatchingLocations: 'कोई स्थान नहीं मिला।',
      stations: 'प्रमुख शहर',
      refresh: 'रिफ्रेश करें',
      retry: 'पुनः प्रयास करें',
      updated: 'अपडेट',
      observed: 'दर्ज समय',
      localTime: 'स्थानीय समय',
      today: 'आज',
      tomorrow: 'कल',
      feelsLike: 'महसूस तापमान',
      humidity: 'नमी (आर्द्रता)',
      windSpeed: 'हवा की गति',
      rainProbability: 'बारिश की संभावना',
      precipitation: 'वर्षा मात्रा',
      sunrise: 'सूर्योदय',
      sunset: 'सूर्यास्त',
      current: 'वर्तमान',
      next24h: 'अगले 24 घंटे',
      source: 'स्रोत',
      weatherUnavailable: 'मौसम डेटा उपलब्ध नहीं है',
      askWeatherGpt: 'WeatherGPT से पूछें',
      openSettings: 'सेटिंग्स',
      languageLabel: 'भाषा',
      roleLabel: 'प्रोफ़ाइल',
      stateLabel: 'राज्य',
      districtLabel: 'जिला',
      nonOfficialNote: 'AI / पूर्वानुमान सलाह (गैर-आधिकारिक)',
      officialSourceNote: 'आधिकारिक IMD / NDMA स्रोत',
      loading: 'लोड हो रहा है...',
    },
    citizen: {
      everydaySummaryTitle: 'आज के लिए सरल सुझाव',
      umbrellaCarry: 'आपके क्षेत्र में बारिश की संभावना है। साथ में छाता रखना उपयोगी रहेगा।',
      umbrellaNotNeeded: 'आज बारिश की संभावना कम है। छाते की आवश्यकता संभवतः नहीं होगी।',
      commuteSafe: 'दैनिक आवागमन के लिए मौसम और हवा की स्थिति सामान्य दिख रही है।',
      commuteCaution: 'बारिश या तेज़ हवा की संभावना के कारण यात्रा में अतिरिक्त समय लेकर चलें।',
      outdoorGood: 'सुबह या शाम के समय टहलने और बाहरी कामों के लिए अनुकूल समय है।',
      outdoorAvoidHeat: 'दोपहर में तेज़ गर्मी की संभावना है। दोपहर 12 से शाम 4 बजे के बीच धूप से बचें।',
      outdoorAvoidRain: 'तेज़ बारिश के समय बाहरी योजनाओं के बजाय सुरक्षित स्थान पर रहें।',
      travelAdviceLabel: 'यात्रा एवं आवागमन',
      outdoorAdviceLabel: 'बाहरी गतिविधियाँ',
      precautionsLabel: 'व्यावहारिक सावधानियाँ',
      localAlertHeading: 'स्थानीय मौसम चेतावनियाँ',
      noLocalAlertText: 'इस समय आपके क्षेत्र के लिए कोई गंभीर सरकारी चेतावनी सक्रिय नहीं है।',
      hourlyHeading: '24 घंटे का प्रति-घंटा पूर्वानुमान',
      hourlySub: 'अगले 24 घंटों में तापमान और बारिश की संभावना',
      dailyHeading: '7-दिवसीय मौसम पूर्वानुमान',
      dailySub: 'दैनिक अधिकतम/न्यूनतम तापमान और बारिश की संभावना',
      askExamplesTitle: 'WeatherGPT से तुरंत पूछें',
      sampleQ1: 'क्या कल मेरे क्षेत्र में बारिश होगी?',
      sampleQ2: 'क्या आज मुझे छाता साथ रखना चाहिए?',
      sampleQ3: 'कल सुबह तापमान कितना रहेगा?',
    },
    farmer: {
      farmWeatherTitle: 'खेत एवं कृषि मौसम सारांश',
      rainOutlook7d: '7-दिन का वर्षा पूर्वानुमान',
      drySpellCheck: 'पिछली वर्षा / सूखे की स्थिति',
      drySpellDetected: 'पिछले 7 दिनों में बहुत कम या शून्य बारिश दर्ज हुई है — मिट्टी की नमी की जाँच करें।',
      noDrySpell: 'पिछले 7 दिनों में वर्षा दर्ज हुई है — सिंचाई से पहले खेत की जल-निकासी देख लें।',
      sprayingTitle: 'हवा और छिड़काव की स्थिति',
      sprayingGood: 'फिलहाल हवा हल्की से मध्यम है। यदि तुरंत बारिश न हो तो छिड़काव के लिए बेहतर समय है।',
      sprayingCaution: 'तेज़ हवा की स्थिति है। दवा या पोषक तत्वों का छिड़काव टालें ताकि बहाव न हो।',
      irrigationTitle: 'सिंचाई संबंधी विचार',
      irrigationWaitRain: 'जल्द बारिश की संभावना है। सिंचाई करने से पहले मिट्टी की नमी अवश्य जाँच लें।',
      irrigationNormalCheck: 'अगले 48 घंटों में बारिश की संभावना कम है। जड़ क्षेत्र की नमी देखकर सिंचाई तय करें।',
      sowingHarvestTitle: 'बुवाई एवं कटाई संबंधी संकेत',
      sowingRainNote: 'आगे बारिश के संकेत हैं — कटी फसल को ढककर रखें और नए बोए खेतों में निकासी सुनिश्चित करें।',
      sowingDryNote: 'मुख्यतः शुष्क मौसम संभावित है — कटाई, मड़ाई और फसल सुखाने के लिए अनुकूल समय।',
      cropProtectionTitle: 'सामान्य फसल सुरक्षा सुझाव',
      cropProtectHeat: 'अधिक तापमान संभावित है — नमी बचाने के लिए पलवार (मल्चिंग) या सुबह-शाम सिंचाई पर विचार करें।',
      cropProtectStorm: 'तेज़ झोंके या आंधी की संभावना है — नर्सरी, शेड नेट और खेत की संरचनाओं को सुरक्षित करें।',
      cropProtectGeneral: 'फसल-विशेष निर्णय से पहले आधिकारिक कृषि मौसम बुलेटिन अवश्य देखें।',
      agrometHeading: 'आधिकारिक कृषि मौसम सलाह स्रोत',
      agrometDisclaimer: 'मौसम आंकड़े लाइव Open-Meteo पर आधारित हैं। फसल-विशेष सलाह के लिए अधिकृत IMD एग्रोमेट बुलेटिन देखें।',
      agrometLinkImd: 'IMD कृषि मौसम सलाह (AAS)',
      agrometLinkMeghdoot: 'मेघदूत किसान पोर्टल',
      rainSum7d: '7-दिन संभावित वर्षा',
      past7dRain: 'पिछले 7 दिन की बारिश',
      maxWindToday: 'आज की अधिकतम हवा',
    },
    government: {
      overviewTitle: 'राज्य एवं जिला मौसम निगरानी',
      overviewSub: 'आधिकारिक IMD / NDMA CAP चेतावनियों के साथ बहु-जिला लाइव मौसम स्थिति।',
      selectState: 'राज्य चुनें',
      districtsMonitored: 'निगरानी वाले जिले',
      activeStateWarnings: 'राज्य की सक्रिय चेतावनियाँ',
      avgStateTemp: 'औसत जिला तापमान',
      peakRainProb: 'अधिकतम बारिश संभावना',
      districtColumn: 'जिला',
      conditionColumn: 'वर्तमान स्थिति',
      tempColumn: 'तापमान / महसूस',
      rainProbColumn: 'बारिश % / वर्षा',
      windColumn: 'हवा',
      warningsColumn: 'आधिकारिक चेतावनियाँ',
      actionColumn: 'चुनें',
      setLocationBtn: 'जिला देखें',
      noWarningsDistrict: 'कोई सक्रिय चेतावनी नहीं',
      officialBulletinsTitle: 'राज्य के लिए आधिकारिक सरकारी बुलेटिन',
      noStateBulletins: 'इस राज्य के लिए वर्तमान में कोई सक्रिय IMD/NDMA CAP बुलेटिन नहीं है।',
      districtChartTitle: 'जिलावार तापमान और बारिश संभावना तुलना',
      verifySource: 'NDMA सचेत पर सत्यापित करें',
    },
    disaster: {
      opsTitle: 'गंभीर मौसम संचालन केंद्र',
      opsSub: 'गंभीरता के अनुसार सक्रिय चेतावनियाँ, प्रभावित जिले, समय-सीमा और तैयारी समन्वय।',
      activeSevereCount: 'गंभीर चेतावनियाँ (रेड / ऑरेंज)',
      highRiskZones: 'प्रभावित क्षेत्र / जिले',
      cycloneHeavyRainTitle: 'भारी बारिश, आंधी और चक्रवात संकेत',
      cycloneHeavyRainNone: 'चयनित क्षेत्र में कोई सक्रिय रेड/ऑरेंज चक्रवात या अत्यधिक बारिश CAP चेतावनी नहीं है।',
      warningTimelineTitle: 'सक्रिय और आगामी चेतावनी समय-सीमा',
      affectedAreasTitle: 'प्रमुख केंद्रों का भौगोलिक मौसम वितरण',
      preparednessTitle: 'तैयारी संबंधी सुझाव',
      preparednessDisclaimer: 'नीचे दिए गए सुझाव लाइव मौसम डेटा पर आधारित हैं और आधिकारिक सरकारी आदेश नहीं हैं।',
      prepItem1: 'NDMA सचेत और राज्य SDMA पोर्टल पर चेतावनी की वैधता और प्रभावित जिलों की पुष्टि करें।',
      prepItem2: 'रेड या ऑरेंज चेतावनी वाले क्षेत्रों में जल-निकासी, पंप और बिजली बहाली दल तैयार रखें।',
      prepItem3: 'आंधी या भारी बारिश से पहले स्थानीय भाषा में जन-सावधानी संदेश प्रसारित करें।',
      prepItem4: '24 घंटे में ≥20 मिमी बारिश के दौरान निचले अंडरपास और नदी बेसिन स्तर की निगरानी बढ़ाएं।',
      officialLinksTitle: 'आधिकारिक सरकारी पोर्टल और फ़ीड',
      linkSachet: 'NDMA सचेत CAP पोर्टल',
      linkImd: 'IMD मौसम चेतावनियाँ',
      linkCwc: 'केंद्रीय जल आयोग बाढ़ पूर्वानुमान',
      viewAllAlertsBtn: 'सभी चेतावनियाँ खोलें',
    },
    alerts: {
      heading: 'मौसम चेतावनियाँ और सावधानियाँ',
      subheading: 'आधिकारिक IMD / NDMA CAP बुलेटिन को पूर्वानुमान आधारित सलाह और AI स्पष्टीकरण से स्पष्ट रूप से अलग रखा गया है।',
      checkFeedBtn: 'आधिकारिक फ़ीड रिफ्रेश करें',
      officialSectionTitle: 'आधिकारिक मौसम चेतावनियाँ (IMD / NDMA CAP)',
      feedConnected: 'लाइव आधिकारिक फ़ीड जुड़ा है',
      feedUnavailable: 'आधिकारिक फ़ीड अनुपलब्ध',
      queryingFeed: 'आधिकारिक IMD / NDMA सचेत CAP फ़ीड से डेटा लिया जा रहा है...',
      verifySachet: 'NDMA सचेत पर जांचें',
      imdMausam: 'IMD मौसम',
      noLocalWarnings: 'वर्तमान में इस स्थान के लिए कोई सक्रिय सरकारी चेतावनी नहीं है:',
      otherNationalTitle: 'भारत के अन्य सक्रिय आधिकारिक बुलेटिन',
      derivedSectionTitle: 'मौसम सीमा आधारित सलाह (गैर-आधिकारिक)',
      derivedSectionSub: 'लाइव Open-Meteo 24-घंटे के पूर्वानुमान से स्वचालित जांच (गर्मी ≥ 40°C, बारिश ≥ 20mm / 70%, हवा ≥ 35 km/h)।',
      noDerivedThresholds: 'अगले 24 घंटों में इस स्थान के लिए कोई उच्च गर्मी, भारी बारिश या तेज़ हवा सीमा पार नहीं हुई:',
      filterAll: 'सभी',
      filterActive: 'सक्रिय',
      filterUpcoming: 'आगामी',
      filterExpired: 'समाप्त',
      severityLabel: 'आधिकारिक गंभीरता',
      authorityLabel: 'जारीकर्ता प्राधिकरण',
      validFromLabel: 'प्रारंभ',
      validUntilLabel: 'अंत तक',
      explainAiBtn: 'मेरी भूमिका के अनुसार सरल व्याख्या (AI)',
      explainingAi: 'सरल मार्गदर्शन तैयार हो रहा है...',
      aiExplanationHeader: 'भूमिका-आधारित सरल व्याख्या (AI · गैर-आधिकारिक)',
      aiExplanationDisclaimer: 'यह बुलेटिन को समझाने के लिए Groq AI द्वारा तैयार किया गया है। हमेशा आधिकारिक IMD/SDMA निर्देशों का पालन करें।',
      dedupMeta: 'डुप्लीकेट हटाए गए',
      expiredMeta: 'समाप्त बुलेटिन',
      statusActive: 'सक्रिय',
      statusUpcoming: 'आगामी',
      statusExpired: 'समाप्त',
    },
    assistant: {
      conversations: 'बातचीत इतिहास',
      newChat: 'नई चैट',
      loadingConvs: 'पिछली बातचीत लोड हो रही है...',
      noConvsTitle: 'अभी कोई बातचीत नहीं',
      noConvsBody: 'नीचे कोई मौसम प्रश्न पूछें या नई चैट पर क्लिक करें।',
      anyLocation: 'कोई भी स्थान',
      contextLabel: 'संदर्भ',
      inspectRoles: 'DB भूमिकाएँ देखें',
      hideRoles: 'सिस्टम भूमिकाएँ छिपाएँ',
      emptyHeading: 'संदर्भ स्मृति के साथ लाइव मौसम प्रश्न पूछें',
      emptySub: 'WeatherGPT उत्तर देने से पहले वास्तविक Open-Meteo और IMD टूल चलाता है और आपकी भाषा व भूमिका के अनुसार उत्तर देता है।',
      thinking: 'लाइव मौसम टूल से डेटा प्राप्त कर Groq उत्तर तैयार कर रहा है...',
      listen: 'सुनें',
      stop: 'रोकें',
      speakHint: 'बोलकर पूछें',
      stopVoiceHint: 'वॉइस इनपुट रोकें',
      inputPlaceholder: 'WeatherGPT से पूछें:',
      send: 'भेजें',
      groqMissingTitle: 'सर्वर पर Groq API कुंजी आवश्यक है:',
      groqMissingBody: 'लाइव AI उत्तरों के लिए सर्वर Secrets में GROQ_API_KEY जोड़ें।',
      roleContextBadge: 'मोड',
      toolResultLabel: 'टूल परिणाम',
      samplePromptsByRole: {
        citizen: [
          'आज अहमदाबाद का मौसम कैसा है?',
          'क्या कल मुझे छाता साथ रखना चाहिए?',
          'दिल्ली और मुंबई के मौसम की तुलना करें।',
          'तेज़ बारिश के दौरान क्या सावधानियाँ बरतनी चाहिए?',
        ],
        farmer: [
          'क्या अगले 3 दिनों में मेरे क्षेत्र में बारिश होगी?',
          'क्या आज फसल पर छिड़काव के लिए हवा की गति सुरक्षित है?',
          'पिछले 14 दिनों की बारिश और सूखे की स्थिति जांचें।',
          'क्या मौसम के अनुसार मुझे आज सिंचाई करनी चाहिए?',
        ],
        government: [
          'असम और गुजरात में सक्रिय IMD/NDMA मौसम चेतावनियों का सारांश दें।',
          'लखनऊ और वाराणसी के 7-दिन के बारिश पूर्वानुमान की तुलना करें।',
          'गुवाहाटी के लिए गंभीर मौसम चेतावनियाँ और वैधता समय बताएं।',
          'पटना के पिछले 14 दिनों और अगले 7 दिनों का बारिश विश्लेषण दें।',
        ],
        disaster: [
          'सभी सक्रिय गंभीर मौसम चेतावनियों और प्रभावित जिलों की सूची दें।',
          'आज गुवाहाटी में आंधी और हवा के झोंकों की क्या स्थिति है?',
          'मुंबई और विशाखापत्तनम में भारी बारिश/चक्रवात जोखिम की तुलना करें।',
          '50 मिमी से अधिक भारी बारिश होने पर क्या संचालन सावधानियाँ लागू होती हैं?',
        ],
      },
    },
    forecast: {
      heading: '48-घंटे और 7-दिन का पूर्वानुमान',
      bestMatch: 'Open-Meteo बेस्ट मैच',
      gfsSeamless: 'NOAA GFS मॉडल',
      hourlyTempTitle: '48-घंटे तापमान और महसूस तापमान',
      rainProbTitle: 'बारिश की संभावना (%) और वर्षा (mm)',
      dailyRangeTitle: '7-दिन दैनिक तापमान सीमा',
      tableTitle: '7-दिवसीय विस्तृत विवरण',
      colDate: 'तिथि',
      colCondition: 'मौसम स्थिति',
      colMinMax: 'न्यूनतम / अधिकतम',
      colRainProb: 'बारिश %',
      colRainSum: 'कुल वर्षा',
      colMaxWind: 'अधिकतम हवा',
      colUvMax: 'UV अधिकतम',
      colSun: 'सूर्योदय / सूर्यास्त',
      tempSeries: 'तापमान',
      feelsSeries: 'महसूस',
      rainMmSeries: 'वर्षा (mm)',
      rainProbSeries: 'संभावना (%)',
      maxSeries: 'अधिकतम',
      minSeries: 'न्यूनतम',
    },
    map: {
      jumpPlaceholder: 'मानचित्र पर शहर खोजें...',
      refreshStations: 'केंद्र रिफ्रेश करें',
      tempLayer: 'तापमान परत',
      rainLayer: 'वर्षा परत',
      footerSource: 'आधार मानचित्र: OpenStreetMap · डेटा: Open-Meteo मल्टी-पॉइंट API',
      footerHint: 'लाइव मौसम देखने के लिए किसी भी मार्कर या मानचित्र पर क्लिक करें',
      loadingPoint: 'चयनित स्थान का लाइव मौसम लोड हो रहा है...',
      setActiveBtn: 'मुख्य डैशबोर्ड स्थान के रूप में सेट करें',
      windLabel: 'हवा',
    },
    analytics: {
      heading: 'मौसम विश्लेषण',
      archiveLabel: 'अभिलेख',
      pastDaysBtn: 'पिछले {days} दिन',
      compareWith: 'तुलना करें:',
      histVsFcTitle: 'पिछले अवलोकन बनाम आगामी पूर्वानुमान तापमान',
      histVsFcSub: 'ठोस रेखाएं ERA5 ऐतिहासिक डेटा दर्शाती हैं; टूटी रेखाएं 7-दिन का पूर्वानुमान दिखाती हैं।',
      forecastStart: 'पूर्वानुमान प्रारंभ',
      histMax: 'ऐतिहासिक अधिकतम',
      histMin: 'ऐतिहासिक न्यूनतम',
      fcMax: 'पूर्वानुमान अधिकतम',
      fcMin: 'पूर्वानुमान न्यूनतम',
      histRainTitle: 'ऐतिहासिक दैनिक वर्षा (mm) — पिछले {days} दिन',
      histRainSub: 'ERA5 द्वारा दर्ज दैनिक वर्षा मात्रा:',
      observedRainSeries: 'दर्ज वर्षा (mm)',
      compareTitle: 'स्थान तुलना',
      compareSub: '7-दिन के पूर्वानुमान का अधिकतम तापमान',
      nowLabel: 'अभी',
      floodModuleTitle: 'भावी बाढ़ पूर्वानुमान एकीकरण',
      floodStatusPrefix: 'स्थिति',
    },
    settings: {
      heading: 'प्लेटफ़ॉर्म सेटिंग्स और वैयक्तिकरण',
      subheading: 'भाषा, उपयोगकर्ता भूमिका, तापमान इकाई और थीम कभी भी बदलें।',
      languageCardTitle: 'इंटरफ़ेस और AI भाषा',
      languageCardSub: 'बिना पेज रीलोड किए सभी मेनू, चार्ट, चेतावनियाँ और AI उत्तर तुरंत अनुवादित होते हैं।',
      roleCardTitle: 'उपयोगकर्ता अनुभव प्रोफ़ाइल',
      roleCardSub: 'डैशबोर्ड लेआउट, सुझाव और AI मार्गदर्शन को आपकी भूमिका के अनुसार बदलता है।',
      displayCardTitle: 'मापन और दिखावट',
      displayCardSub: 'तापमान इकाई और लाइट/डार्क मोड चुनें।',
      unitLabel: 'तापमान इकाई',
      themeLabel: 'रंग थीम',
      resetOnboardingTitle: 'प्रारंभिक सेटअप स्क्रीन',
      resetOnboardingSub: 'भाषा और भूमिका फिर से चुनने के लिए स्वागत स्क्रीन खोलें।',
      resetOnboardingBtn: 'सेटअप स्क्रीन पुनः खोलें',
      activeBadge: 'सक्रिय',
    },
    conditions: {
      'Clear sky': 'साफ़ आसमान',
      'Mainly clear': 'मुख्यतः साफ़',
      'Partly cloudy': 'आंशिक बादल',
      Overcast: 'घने बादल',
      Fog: 'कोहरा',
      'Depositing rime fog': 'घना कोहरा',
      'Light drizzle': 'हल्की बूंदाबांदी',
      'Moderate drizzle': 'मध्यम बूंदाबांदी',
      'Dense drizzle': 'तेज़ बूंदाबांदी',
      'Light freezing drizzle': 'हल्की ठंडी फुहार',
      'Dense freezing drizzle': 'तेज़ ठंडी फुहार',
      'Slight rain': 'हल्की बारिश',
      'Moderate rain': 'मध्यम बारिश',
      'Heavy rain': 'भारी बारिश',
      'Light freezing rain': 'हल्की बर्फीली बारिश',
      'Heavy freezing rain': 'तेज़ बर्फीली बारिश',
      'Slight snow fall': 'हल्की बर्फबारी',
      'Moderate snow fall': 'मध्यम बर्फबारी',
      'Heavy snow fall': 'भारी बर्फबारी',
      'Snow grains': 'बर्फ के कण',
      'Slight rain showers': 'हल्की बौछारें',
      'Moderate rain showers': 'मध्यम बौछारें',
      'Violent rain showers': 'तेज़ मूसलाधार बौछारें',
      'Slight snow showers': 'हल्की हिम बौछार',
      'Heavy snow showers': 'तेज़ हिम बौछार',
      Thunderstorm: 'आंधी-तूफान',
      'Thunderstorm with slight hail': 'ओलों के साथ तूफान',
      'Thunderstorm with heavy hail': 'तेज़ ओलावृष्टि व तूफान',
      'Variable conditions': 'परिवर्तनशील मौसम',
    },
    windDirs: {
      N: 'उ', NNE: 'उ-उपू', NE: 'उ-पू', ENE: 'पू-उपू',
      E: 'पू', ESE: 'पू-दपू', SE: 'द-पू', SSE: 'द-दपू',
      S: 'द', SSW: 'द-दप', SW: 'द-प', WSW: 'प-दप',
      W: 'प', WNW: 'प-उप', NW: 'उ-प', NNW: 'उ-उप',
    },
  },

  gu: {
    appName: 'WeatherGPT',
    nav: {
      dashboard: 'ડેશબોર્ડ',
      assistant: 'WeatherGPT સહાયક',
      forecast: 'હવામાન આગાહી',
      map: 'હવામાન નકશો',
      alerts: 'હવામાન ચેતવણીઓ',
      analytics: 'હવામાન વિશ્લેષણ',
      settings: 'સેટિંગ્સ',
    },
    roles: {
      citizen: {
        label: 'નાગરિક',
        shortDesc: 'રોજિંદુ હવામાન, વરસાદની ચેતવણી, મુસાફરી અને બહારની પ્રવૃત્તિ માટે સરળ સલાહ.',
        dashboardHeading: 'દૈનિક હવામાન અને સ્થાનિક માર્ગદર્શન',
        selectAction: 'નાગરિક પસંદ કરો',
      },
      farmer: {
        label: 'ખેડૂત',
        shortDesc: 'વરસાદની આગાહી, છંટકાવ માટે પવન, સિંચાઈ અને પાક સંરક્ષણ સૂચનો.',
        dashboardHeading: 'ખેતી હવામાન અને કૃષિ સલાહ',
        selectAction: 'ખેડૂત પસંદ કરો',
      },
      government: {
        label: 'સરકારી એજન્સી',
        shortDesc: 'રાજ્ય અને જિલ્લા દેખરેખ, સત્તાવાર IMD ચેતવણીઓ, ગંભીરતા અને વલણો.',
        dashboardHeading: 'રાજ્ય અને જિલ્લા હવામાન નિરીક્ષણ',
        selectAction: 'સરકારી એજન્સી પસંદ કરો',
      },
      disaster: {
        label: 'આપત્તિ વ્યવસ્થાપક',
        shortDesc: 'ગંભીર હવામાન કામગીરી, ચેતવણી સમયરેખા, અસરગ્રસ્ત જિલ્લા અને પૂર્વતૈયારી.',
        dashboardHeading: 'આપત્તિ હવામાન કામગીરી મોનિટર',
        selectAction: 'આપત્તિ વ્યવસ્થાપક પસંદ કરો',
      },
    },
    onboarding: {
      badge: 'વ્યક્તિગત હવામાન ઇન્ટેલિજન્સ',
      title: 'WeatherGPT માં આપનું સ્વાગત છે',
      subtitle: 'તમારી જરૂરિયાત મુજબ આગાહી, ચેતવણીઓ અને AI સહાયકને ગોઠવવા માટે તમારી ભાષા અને ભૂમિકા પસંદ કરો.',
      stepLanguageTitle: 'A. તમારી ભાષા પસંદ કરો',
      stepLanguageHint: 'આખું પ્લેટફોર્મ અને AI જવાબો તરત જ પસંદ કરેલી ભાષામાં બદલાશે.',
      stepRoleTitle: 'B. તમારો ઉપયોગકર્તા પ્રકાર પસંદ કરો',
      stepRoleHint: 'ડેશબોર્ડની માહિતી, સલાહ અને ચેતવણીઓ તમારા મુજબ ગોઠવે છે.',
      selectedTag: 'પસંદ કરેલ',
      continueBtn: 'તમારું WeatherGPT ખોલો',
      savedNotice: 'આ પસંદગી તમારા ઉપકરણ પર સાચવવામાં આવે છે. તમે સેટિંગ્સમાંથી ગમે ત્યારે ફેરફાર કરી શકો છો.',
    },
    common: {
      lightTheme: 'લાઇટ થીમ',
      darkTheme: 'ડાર્ક થીમ',
      collapseSidebar: 'સાઇડબાર સંકોચો',
      searchPlaceholder: 'શહેર, જિલ્લો અથવા ગામ શોધો...',
      quickStations: 'મુખ્ય ભારતીય કેન્દ્રો',
      matchingLocations: 'મળતા સ્થળો (Open-Meteo)',
      searchingLocations: 'સ્થળો શોધાઈ રહ્યા છે...',
      noMatchingLocations: 'કોઈ મેળ ખાતું સ્થળ મળ્યું નથી.',
      stations: 'કેન્દ્રો',
      refresh: 'રિફ્રેશ',
      retry: 'ફરી પ્રયાસ કરો',
      updated: 'અપડેટ',
      observed: 'નોંધાયેલ સમય',
      localTime: 'સ્થાનિક સમય',
      today: 'આજે',
      tomorrow: 'આવતીકાલે',
      feelsLike: 'અનુભવાતું તાપમાન',
      humidity: 'ભેજ',
      windSpeed: 'પવનની ઝડપ',
      rainProbability: 'વરસાદની શક્યતા',
      precipitation: 'વરસાદનું પ્રમાણ',
      sunrise: 'સૂર્યોદય',
      sunset: 'સૂર્યાસ્ત',
      current: 'હાલ',
      next24h: 'આગામી 24 કલાક',
      source: 'સ્ત્રોત',
      weatherUnavailable: 'હવામાન ડેટા ઉપલબ્ધ નથી',
      askWeatherGpt: 'WeatherGPT ને પૂછો',
      openSettings: 'સેટિંગ્સ',
      languageLabel: 'ભાષા',
      roleLabel: 'પ્રોફાઇલ',
      stateLabel: 'રાજ્ય',
      districtLabel: 'જિલ્લો',
      nonOfficialNote: 'AI / આગાહી સલાહ (બિન-સત્તાવાર)',
      officialSourceNote: 'સત્તાવાર IMD / NDMA સ્ત્રોત',
      loading: 'લોડ થઈ રહ્યું છે...',
    },
    citizen: {
      everydaySummaryTitle: 'આજ માટે સરળ માર્ગદર્શન',
      umbrellaCarry: 'તમારા વિસ્તારમાં વરસાદની શક્યતા છે. સાથે છત્રી રાખવી સલાહભર્યું છે.',
      umbrellaNotNeeded: 'આજે વરસાદની શક્યતા ઓછી છે. છત્રીની જરૂર નહીં પડે.',
      commuteSafe: 'રોજિંદી મુસાફરી માટે હવામાન અને પવન સામાન્ય જણાય છે.',
      commuteCaution: 'વરસાદ કે તેજ પવનની શક્યતાને કારણે મુસાફરી માટે વધારાનો સમય રાખો.',
      outdoorGood: 'સવારે અથવા સાંજે બહાર ફરવા અને રોજિંદા કામ માટે અનુકૂળ સમય છે.',
      outdoorAvoidHeat: 'બપોરે વધુ ગરમી રહેવાની શક્યતા છે. બપોરે 12 થી 4 દરમિયાન તડકાથી બચો.',
      outdoorAvoidRain: 'વરસાદના સમયમાં બહારની પ્રવૃત્તિઓ ટાળી સુરક્ષિત સ્થળે રહો.',
      travelAdviceLabel: 'મુસાફરી અને અવરજવર',
      outdoorAdviceLabel: 'બહારની પ્રવૃત્તિઓ',
      precautionsLabel: 'વ્યવહારુ સાવચેતીઓ',
      localAlertHeading: 'સ્થાનિક હવામાન ચેતવણીઓ',
      noLocalAlertText: 'હાલમાં તમારા વિસ્તાર માટે કોઈ ગંભીર સરકારી ચેતવણી સક્રિય નથી.',
      hourlyHeading: '24-કલાકની કલાકવાર આગાહી',
      hourlySub: 'આગામી 24 કલાકમાં તાપમાન અને વરસાદની શક્યતા',
      dailyHeading: '7-દિવસની આગાહી',
      dailySub: 'દૈનિક મહત્તમ/લઘુત્તમ તાપમાન અને વરસાદની શક્યતા',
      askExamplesTitle: 'WeatherGPT ને ઝડપી પ્રશ્નો',
      sampleQ1: 'શું આવતીકાલે મારા વિસ્તારમાં વરસાદ પડશે?',
      sampleQ2: 'શું મારે આજે છત્રી સાથે રાખવી જોઈએ?',
      sampleQ3: 'આવતીકાલે સવારે તાપમાન કેટલું રહેશે?',
    },
    farmer: {
      farmWeatherTitle: 'ખેતર અને કૃષિ હવામાન સારાંશ',
      rainOutlook7d: '7-દિવસનો વરસાદ અંદાજ',
      drySpellCheck: 'તાજેતરનો વરસાદ / સૂકા ગાળાની તપાસ',
      drySpellDetected: 'છેલ્લા 7 દિવસમાં નહિવત વરસાદ નોંધાયો છે — જમીનમાં ભેજની તપાસ કરો.',
      noDrySpell: 'છેલ્લા 7 દિવસમાં વરસાદ નોંધાયો છે — પિયત પહેલાં ખેતરમાં પાણીના નિકાલની સ્થિતિ જુઓ.',
      sprayingTitle: 'પવન અને દવા છંટકાવ સ્થિતિ',
      sprayingGood: 'હાલ પવન ધીમો થી મધ્યમ છે. જો વરસાદની શક્યતા ન હોય તો છંટકાવ માટે યોગ્ય સમય છે.',
      sprayingCaution: 'પવનની ઝડપ વધુ છે. દવા ઊડી ન જાય તે માટે છંટકાવ હાલ મુલતવી રાખો.',
      irrigationTitle: 'પિયત (સિંચાઈ) અંગે વિચાર',
      irrigationWaitRain: 'આવતીકાલે કે નજીકમાં વરસાદની શક્યતા છે. પિયત આપતા પહેલાં જમીનનો ભેજ તપાસો.',
      irrigationNormalCheck: 'આગામી 48 કલાકમાં વરસાદની શક્યતા ઓછી છે. પાકના મૂળ વિસ્તારનો ભેજ જોઈને પિયત નક્કી કરો.',
      sowingHarvestTitle: 'વાવણી અને લણણી અંગે ધ્યાન',
      sowingRainNote: 'આગળ વરસાદના સંકેત છે — લણેલા પાકને સુરક્ષિત રાખો અને નવા વાવેતરમાં પાણી ન ભરાય તેની કાળજી લો.',
      sowingDryNote: 'મુખ્યત્વે સૂકું હવામાન રહેવાની શક્યતા — લણણી, થ્રેસિંગ અને પાક સૂકવવા માટે અનુકૂળ.',
      cropProtectionTitle: 'સામાન્ય પાક સંરક્ષણ સૂચનો',
      cropProtectHeat: 'વધુ તાપમાનની આગાહી છે — ભેજ જાળવવા મલ્ચિંગ અથવા સવાર/સાંજના પિયત પર વિચાર કરો.',
      cropProtectStorm: 'તેજ પવન કે ગાજવીજની શક્યતા — નાના છોડ, શેડ નેટ અને ખેતરના શેડ સુરક્ષિત કરો.',
      cropProtectGeneral: 'પાક-વિશેષ નિર્ણયો માટે સત્તાવાર IMD એગ્રોમેટ બુલેટિન અવશ્ય જુઓ.',
      agrometHeading: 'સત્તાવાર કૃષિ હવામાન સલાહ સ્ત્રોતો',
      agrometDisclaimer: 'હવામાન આંકડા લાઇવ Open-Meteo પર આધારિત છે. પાક-વિશેષ સલાહ માટે અધિકૃત IMD એગ્રોમેટ બુલેટિન અનુસરો.',
      agrometLinkImd: 'IMD કૃષિ હવામાન સલાહ (AAS)',
      agrometLinkMeghdoot: 'મેઘદૂત ખેડૂત પોર્ટલ',
      rainSum7d: '7-દિવસનો અંદાજિત વરસાદ',
      past7dRain: 'છેલ્લા 7 દિવસનો વરસાદ',
      maxWindToday: 'આજનો મહત્તમ પવન',
    },
    government: {
      overviewTitle: 'રાજ્ય અને જિલ્લા હવામાન નિરીક્ષણ',
      overviewSub: 'સત્તાવાર IMD / NDMA CAP ચેતવણીઓ સાથે બહુ-જિલ્લા લાઇવ હવામાન માહિતી.',
      selectState: 'રાજ્ય પસંદ કરો',
      districtsMonitored: 'નિરીક્ષણ હેઠળના જિલ્લા',
      activeStateWarnings: 'રાજ્યની સક્રિય ચેતવણીઓ',
      avgStateTemp: 'સરેરાશ જિલ્લા તાપમાન',
      peakRainProb: 'મહત્તમ વરસાદ શક્યતા',
      districtColumn: 'જિલ્લો',
      conditionColumn: 'હાલની સ્થિતિ',
      tempColumn: 'તાપમાન / અનુભવ',
      rainProbColumn: 'વરસાદ % / મિમી',
      windColumn: 'પવન',
      warningsColumn: 'સત્તાવાર ચેતવણી',
      actionColumn: 'તપાસો',
      setLocationBtn: 'જિલ્લો પસંદ કરો',
      noWarningsDistrict: 'કોઈ ચેતવણી નથી',
      officialBulletinsTitle: 'રાજ્ય માટે સત્તાવાર સરકારી બુલેટિન',
      noStateBulletins: 'હાલમાં આ રાજ્ય માટે કોઈ સક્રિય IMD/NDMA CAP બુલેટિન નથી.',
      districtChartTitle: 'જિલ્લાવાર તાપમાન અને વરસાદ શક્યતા સરખામણી',
      verifySource: 'NDMA સચેત પર ચકાસો',
    },
    disaster: {
      opsTitle: 'ગંભીર હવામાન કામગીરી મોનિટર',
      opsSub: 'ગંભીરતા મુજબ સક્રિય ચેતવણીઓ, અસરગ્રસ્ત જિલ્લા, સમયમર્યાદા અને પૂર્વતૈયારી સંકલન.',
      activeSevereCount: 'સક્રિય ગંભીર ચેતવણીઓ (રેડ / ઓરેન્જ)',
      highRiskZones: 'અસરગ્રસ્ત વિસ્તારો / જિલ્લા',
      cycloneHeavyRainTitle: 'ભારે વરસાદ, ગાજવીજ અને વાવાઝોડાના સંકેતો',
      cycloneHeavyRainNone: 'પસંદ કરેલ વિસ્તારમાં કોઈ સક્રિય રેડ/ઓરેન્જ વાવાઝોડા કે અતિભારે વરસાદની CAP ચેતવણી નથી.',
      warningTimelineTitle: 'સક્રિય અને આગામી ચેતવણી સમયરેખા',
      affectedAreasTitle: 'મુખ્ય કેન્દ્રોમાં હવામાનની ભૌગોલિક સ્થિતિ',
      preparednessTitle: 'પૂર્વતૈયારી માટેના સૂચનો',
      preparednessDisclaimer: 'નીચેના સૂચનો લાઇવ હવામાન ડેટા પરથી તૈયાર કરાયા છે અને તે સત્તાવાર સરકારી આદેશ નથી.',
      prepItem1: 'NDMA સચેત અને રાજ્ય SDMA પોર્ટલ પર ચેતવણીની માન્યતા અને જિલ્લાઓની સીમા ચકાસો.',
      prepItem2: 'રેડ કે ઓરેન્જ એલર્ટ ધરાવતા જિલ્લાઓમાં પાણી નિકાલ, પંપ અને વીજ પુનઃસ્થાપન ટીમો તૈયાર રાખો.',
      prepItem3: 'ભારે વરસાદ કે ગાજવીજ પહેલાં પ્રાદેશિક ભાષામાં જાહેર ચેતવણીઓ પ્રસારિત કરો.',
      prepItem4: '24 કલાકમાં ≥20 મિમી વરસાદ હોય ત્યારે નીચાણવાળા અંડરપાસ અને નદી બેસિન પર નજર રાખો.',
      officialLinksTitle: 'સત્તાવાર સરકારી પોર્ટલ અને ફીડ્સ',
      linkSachet: 'NDMA સચેત CAP પોર્ટલ',
      linkImd: 'IMD મૌસમ ચેતવણીઓ',
      linkCwc: 'સેન્ટ્રલ વોટર કમિશન પૂર આગાહી',
      viewAllAlertsBtn: 'બધી ચેતવણીઓ જુઓ',
    },
    alerts: {
      heading: 'હવામાન ચેતવણીઓ અને સાવચેતી',
      subheading: 'સત્તાવાર IMD / NDMA CAP બુલેટિનને આગાહી આધારિત સલાહ અને AI સમજૂતીથી અલગ રાખવામાં આવ્યા છે.',
      checkFeedBtn: 'સત્તાવાર ફીડ રિફ્રેશ કરો',
      officialSectionTitle: 'સત્તાવાર હવામાન ચેતવણીઓ (IMD / NDMA CAP)',
      feedConnected: 'લાઇવ સત્તાવાર ફીડ જોડાયેલ છે',
      feedUnavailable: 'સત્તાવાર ફીડ ઉપલબ્ધ નથી',
      queryingFeed: 'સત્તાવાર IMD / NDMA સચેત CAP ફીડ તપાસાઈ રહ્યો છે...',
      verifySachet: 'NDMA સચેત પર ચકાસો',
      imdMausam: 'IMD મૌસમ',
      noLocalWarnings: 'હાલમાં આ સ્થળ માટે કોઈ સક્રિય સરકારી ચેતવણી નથી:',
      otherNationalTitle: 'ભારતમાં અન્ય સક્રિય સત્તાવાર બુલેટિન',
      derivedSectionTitle: 'હવામાન મર્યાદા આધારિત સલાહ (બિન-સત્તાવાર)',
      derivedSectionSub: 'લાઇવ Open-Meteo 24-કલાકની આગાહી પરથી આપમેળે તપાસ (ગરમી ≥ 40°C, વરસાદ ≥ 20mm / 70%, પવન ≥ 35 km/h).',
      noDerivedThresholds: 'આગામી 24 કલાકમાં આ સ્થળ માટે ગરમી, ભારે વરસાદ કે તેજ પવનની મર્યાદા પાર થઈ નથી:',
      filterAll: 'બધા',
      filterActive: 'સક્રિય',
      filterUpcoming: 'આગામી',
      filterExpired: 'સમાપ્ત',
      severityLabel: 'સત્તાવાર ગંભીરતા',
      authorityLabel: 'જારી કરનાર સત્તામંડળ',
      validFromLabel: 'શરૂ',
      validUntilLabel: 'સુધી',
      explainAiBtn: 'મારી ભૂમિકા મુજબ સરળ સમજૂતી (AI)',
      explainingAi: 'સરળ માર્ગદર્શન તૈયાર થઈ રહ્યું છે...',
      aiExplanationHeader: 'ભૂમિકા મુજબ સરળ સમજૂતી (AI · બિન-સત્તાવાર)',
      aiExplanationDisclaimer: 'આ Groq AI દ્વારા સરળતા માટે બનાવેલ છે. હંમેશા સત્તાવાર IMD/SDMA સૂચનાઓનું પાલન કરો.',
      dedupMeta: 'ડુપ્લિકેટ દૂર કર્યા',
      expiredMeta: 'સમાપ્ત બુલેટિન',
      statusActive: 'સક્રિય',
      statusUpcoming: 'આગામી',
      statusExpired: 'સમાપ્ત',
    },
    assistant: {
      conversations: 'વાતચીત ઇતિહાસ',
      newChat: 'નવી ચેટ',
      loadingConvs: 'વાતચીત લોડ થઈ રહી છે...',
      noConvsTitle: 'હજુ કોઈ વાતચીત નથી',
      noConvsBody: 'નીચે હવામાન વિશે પ્રશ્ન પૂછો અથવા નવી ચેટ શરૂ કરો.',
      anyLocation: 'કોઈપણ સ્થળ',
      contextLabel: 'સંદર્ભ',
      inspectRoles: 'DB ભૂમિકાઓ જુઓ',
      hideRoles: 'સિસ્ટમ ભૂમિકા છુપાવો',
      emptyHeading: 'સંદર્ભ યાદશક્તિ સાથે લાઇવ હવામાન પ્રશ્નો પૂછો',
      emptySub: 'WeatherGPT જવાબ આપતા પહેલા સાચા Open-Meteo અને IMD ટૂલ્સ વાપરે છે અને તમારી ભાષા તથા ભૂમિકા મુજબ જવાબ આપે છે.',
      thinking: 'લાઇવ હવામાન ડેટા મેળવી Groq જવાબ તૈયાર કરી રહ્યું છે...',
      listen: 'સાંભળો',
      stop: 'રોકો',
      speakHint: 'બોલીને પૂછો',
      stopVoiceHint: 'વોઇસ બંધ કરો',
      inputPlaceholder: 'WeatherGPT ને પૂછો:',
      send: 'મોકલો',
      groqMissingTitle: 'સર્વર પર Groq API કી જરૂરી છે:',
      groqMissingBody: 'લાઇવ AI જવાબો માટે સર્વર Secrets માં GROQ_API_KEY ઉમેરો.',
      roleContextBadge: 'મોડ',
      toolResultLabel: 'ટૂલ પરિણામ',
      samplePromptsByRole: {
        citizen: [
          'આજે અમદાવાદનું હવામાન કેવું છે?',
          'શું આવતીકાલે મારે છત્રી સાથે રાખવી જોઈએ?',
          'દિલ્હી અને મુંબઈના હવામાનની સરખામણી કરો.',
          'ભારે વરસાદ દરમિયાન કઈ સાવચેતી રાખવી જોઈએ?',
        ],
        farmer: [
          'શું આગામી 3 દિવસમાં મારા વિસ્તારમાં વરસાદ પડશે?',
          'શું આજે પાક પર દવા છાંટવા માટે પવનની ઝડપ યોગ્ય છે?',
          'છેલ્લા 14 દિવસના વરસાદ અને સૂકા ગાળાની સ્થિતિ જણાવો.',
          'આગાહી મુજબ શું મારે આજે પિયત આપવું જોઈએ?',
        ],
        government: [
          'ગુજરાત અને આસામમાં સક્રિય IMD/NDMA ચેતવણીઓનો સારાંશ આપો.',
          'લખનૌ અને વારાણસીના 7-દિવસના વરસાદની આગાહી સરખાવો.',
          'ગુવાહાટી માટે ગંભીર હવામાન ચેતવણીઓ અને સમયમર્યાદા જણાવો.',
          'પટના માટે છેલ્લા 14 દિવસ અને આગામી 7 દિવસના વરસાદની માહિતી આપો.',
        ],
        disaster: [
          'તમામ સક્રિય ગંભીર ચેતવણીઓ અને અસરગ્રસ્ત જિલ્લાઓની યાદી આપો.',
          'આજે ગુવાહાટીમાં ગાજવીજ અને પવનના ઝપાટાની શું સ્થિતિ છે?',
          'મુંબઈ અને વિશાખાપટ્ટનમમાં ભારે વરસાદ/વાવાઝોડાનું જોખમ સરખાવો.',
          '50 મિમીથી વધુ ભારે વરસાદની આગાહી હોય ત્યારે કઈ તૈયારીઓ રાખવી?',
        ],
      },
    },
    forecast: {
      heading: '48-કલાક અને 7-દિવસની આગાહી',
      bestMatch: 'Open-Meteo બેસ્ટ મેચ',
      gfsSeamless: 'NOAA GFS મોડેલ',
      hourlyTempTitle: '48-કલાકનું તાપમાન અને અનુભવાતું તાપમાન',
      rainProbTitle: 'વરસાદની શક્યતા (%) અને વરસાદ (mm)',
      dailyRangeTitle: '7-દિવસની તાપમાન શ્રેણી',
      tableTitle: '7-દિવસની વિગતવાર આગાહી',
      colDate: 'તારીખ',
      colCondition: 'સ્થિતિ',
      colMinMax: 'લઘુત્તમ / મહત્તમ',
      colRainProb: 'વરસાદ %',
      colRainSum: 'કુલ વરસાદ',
      colMaxWind: 'મહત્તમ પવન',
      colUvMax: 'UV મહત્તમ',
      colSun: 'સૂર્યોદય / સૂર્યાસ્ત',
      tempSeries: 'તાપમાન',
      feelsSeries: 'અનુભવાતું',
      rainMmSeries: 'વરસાદ (mm)',
      rainProbSeries: 'શક્યતા (%)',
      maxSeries: 'મહત્તમ',
      minSeries: 'લઘુત્તમ',
    },
    map: {
      jumpPlaceholder: 'નકશા પર શહેર શોધો...',
      refreshStations: 'કેન્દ્રો રિફ્રેશ કરો',
      tempLayer: 'તાપમાન સ્તર',
      rainLayer: 'વરસાદ સ્તર',
      footerSource: 'આધાર નકશો: OpenStreetMap · ડેટા: Open-Meteo મલ્ટી-પોઇન્ટ API',
      footerHint: 'લાઇવ હવામાન જોવા માટે કોઈપણ માર્કર અથવા નકશા પર ક્લિક કરો',
      loadingPoint: 'પસંદ કરેલ સ્થળનું લાઇવ હવામાન લોડ થઈ રહ્યું છે...',
      setActiveBtn: 'મુખ્ય ડેશબોર્ડ સ્થળ તરીકે સેટ કરો',
      windLabel: 'પવન',
    },
    analytics: {
      heading: 'હવામાન વિશ્લેષણ',
      archiveLabel: 'આર્કાઇવ',
      pastDaysBtn: 'છેલ્લા {days} દિવસ',
      compareWith: 'સરખામણી કરો:',
      histVsFcTitle: 'ઐતિહાસિક અવલોકનો વિરુદ્ધ આગામી આગાહી તાપમાન',
      histVsFcSub: 'સીધી રેખાઓ ERA5 ઐતિહાસિક ડેટા દર્શાવે છે; તૂટક રેખાઓ 7-દિવસની આગાહી દર્શાવે છે.',
      forecastStart: 'આગાહી શરૂ',
      histMax: 'ઐતિહાસિક મહત્તમ',
      histMin: 'ઐતિહાસિક લઘુત્તમ',
      fcMax: 'આગાહી મહત્તમ',
      fcMin: 'આગાહી લઘુત્તમ',
      histRainTitle: 'ઐતિહાસિક દૈનિક વરસાદ (mm) — છેલ્લા {days} દિવસ',
      histRainSub: 'ERA5 દ્વારા નોંધાયેલ દૈનિક વરસાદ:',
      observedRainSeries: 'નોંધાયેલ વરસાદ (mm)',
      compareTitle: 'સ્થળ સરખામણી',
      compareSub: '7-દિવસનું આગાહી મહત્તમ તાપમાન',
      nowLabel: 'અત્યારે',
      floodModuleTitle: 'ભવિષ્ય પૂર આગાહી સંકલન',
      floodStatusPrefix: 'સ્થિતિ',
    },
    settings: {
      heading: 'પ્લેટફોર્મ સેટિંગ્સ અને પસંદગીઓ',
      subheading: 'તમારી ભાષા, ઉપયોગકર્તા ભૂમિકા, તાપમાન એકમ અને થીમ ગમે ત્યારે બદલો.',
      languageCardTitle: 'ઇન્ટરફેસ અને AI ભાષા',
      languageCardSub: 'પેજ રિલોડ કર્યા વિના બધા મેનુ, ચાર્ટ, ચેતવણીઓ અને AI જવાબો તરત જ બદલાય છે.',
      roleCardTitle: 'ઉપયોગકર્તા અનુભવ પ્રોફાઇલ',
      roleCardSub: 'ડેશબોર્ડની રચના, સલાહ અને AI માર્ગદર્શનને તમારી ભૂમિકા મુજબ બદલે છે.',
      displayCardTitle: 'માપન અને દેખાવ',
      displayCardSub: 'તાપમાન એકમ અને લાઇટ/ડાર્ક મોડ પસંદ કરો.',
      unitLabel: 'તાપમાન એકમ',
      themeLabel: 'રંગ થીમ',
      resetOnboardingTitle: 'પ્રારંભિક સેટઅપ સ્ક્રીન',
      resetOnboardingSub: 'ભાષા અને ભૂમિકાની પસંદગી ફરી જોવા માટે સ્વાગત સ્ક્રીન ખોલો.',
      resetOnboardingBtn: 'સેટઅપ સ્ક્રીન ફરી ખોલો',
      activeBadge: 'સક્રિય',
    },
    conditions: {
      'Clear sky': 'ચોખ્ખું આકાશ',
      'Mainly clear': 'મુખ્યત્વે ચોખ્ખું',
      'Partly cloudy': 'આંશિક વાદળછાયું',
      Overcast: 'ઘેરા વાદળો',
      Fog: 'ધુમ્મસ',
      'Depositing rime fog': 'ગાઢ ધુમ્મસ',
      'Light drizzle': 'હળવો ઝરમર વરસાદ',
      'Moderate drizzle': 'મધ્યમ ઝરમર વરસાદ',
      'Dense drizzle': 'ભારે ઝરમર વરસાદ',
      'Light freezing drizzle': 'હળવી ઠંડી ઝરમર',
      'Dense freezing drizzle': 'ગાઢ ઠંડી ઝરમર',
      'Slight rain': 'હળવો વરસાદ',
      'Moderate rain': 'મધ્યમ વરસાદ',
      'Heavy rain': 'ભારે વરસાદ',
      'Light freezing rain': 'હળવો બરફીલો વરસાદ',
      'Heavy freezing rain': 'ભારે બરફીલો વરસાદ',
      'Slight snow fall': 'હળવી હિમવર્ષા',
      'Moderate snow fall': 'મધ્યમ હિમવર્ષા',
      'Heavy snow fall': 'ભારે હિમવર્ષા',
      'Snow grains': 'બરફના કણો',
      'Slight rain showers': 'હળવા વરસાદી ઝાપટા',
      'Moderate rain showers': 'મધ્યમ વરસાદી ઝાપટા',
      'Violent rain showers': 'ભારે વરસાદી ઝાપટા',
      'Slight snow showers': 'હળવા હિમ ઝાપટા',
      'Heavy snow showers': 'ભારે હિમ ઝાપટા',
      Thunderstorm: 'ગાજવીજ સાથે તોફાન',
      'Thunderstorm with slight hail': 'કરા સાથે તોફાન',
      'Thunderstorm with heavy hail': 'ભારે કરા અને તોફાન',
      'Variable conditions': 'બદલાતું હવામાન',
    },
    windDirs: {
      N: 'ઉ', NNE: 'ઉ-ઉપૂ', NE: 'ઉ-પૂ', ENE: 'પૂ-ઉપૂ',
      E: 'પૂ', ESE: 'પૂ-દપૂ', SE: 'દ-પૂ', SSE: 'દ-દપૂ',
      S: 'દ', SSW: 'દ-દપ', SW: 'દ-પ', WSW: 'પ-દપ',
      W: 'પ', WNW: 'પ-ઉપ', NW: 'ઉ-પ', NNW: 'ઉ-ઉપ',
    },
  },

  mr: {
    appName: 'WeatherGPT',
    nav: {
      dashboard: 'डॅशबोर्ड',
      assistant: 'WeatherGPT सहाय्यक',
      forecast: 'हवामान अंदाज',
      map: 'हवामान नकाशा',
      alerts: 'हवामान इशारे',
      analytics: 'हवामान विश्लेषण',
      settings: 'सेटिंग्ज',
    },
    roles: {
      citizen: {
        label: 'नागरिक',
        shortDesc: 'दैनंदिन हवामान, पावसाचे इशारे, प्रवास आणि बाहेरील कामांसाठी सोपा सल्ला.',
        dashboardHeading: 'दैनंदिन हवामान आणि स्थानिक मार्गदर्शन',
        selectAction: 'नागरिक निवडा',
      },
      farmer: {
        label: 'शेतकरी',
        shortDesc: 'पावसाचा अंदाज, फवारणीसाठी वारा, सिंचन आणि पीक संरक्षण मार्गदर्शन.',
        dashboardHeading: 'शेती हवामान आणि कृषी सल्ला',
        selectAction: 'शेतकरी निवडा',
      },
      government: {
        label: 'सरकारी यंत्रणा',
        shortDesc: 'राज्य व जिल्हा निरीक्षण, अधिकृत IMD इशारे, तीव्रता आणि हवामान कल.',
        dashboardHeading: 'राज्य व जिल्हा हवामान निरीक्षण',
        selectAction: 'सरकारी यंत्रणा निवडा',
      },
      disaster: {
        label: 'आपत्ती व्यवस्थापक',
        shortDesc: 'गंभीर हवामान कामकाज, इशाऱ्यांची कालमर्यादा, प्रभावित जिल्हे व सज्जता.',
        dashboardHeading: 'आपत्ती हवामान नियंत्रण केंद्र',
        selectAction: 'आपत्ती व्यवस्थापक निवडा',
      },
    },
    onboarding: {
      badge: 'वैयक्तिक हवामान माहिती प्रणाली',
      title: 'WeatherGPT मध्ये स्वागत आहे',
      subtitle: 'तुमच्या गरजेनुसार हवामान अंदाज, इशारे आणि AI सहाय्यक सानुकूल करण्यासाठी भाषा आणि भूमिका निवडा.',
      stepLanguageTitle: 'A. तुमची भाषा निवडा',
      stepLanguageHint: 'संपूर्ण प्रणाली आणि AI उत्तरे तात्काळ निवडलेल्या भाषेत बदलतील.',
      stepRoleTitle: 'B. तुमचा वापरकर्ता प्रकार निवडा',
      stepRoleHint: 'डॅशबोर्डवरील माहिती, सल्ले आणि इशाऱ्यांचे प्राधान्य तुमच्यानुसार बदलते.',
      selectedTag: 'निवडलेले',
      continueBtn: 'वैयक्तिक WeatherGPT उघडा',
      savedNotice: 'ही निवड तुमच्या उपकरणावर जतन केली जाते. तुम्ही सेटिंग्जमधून कधीही बदलू शकता.',
    },
    common: {
      lightTheme: 'लाइट थीम',
      darkTheme: 'डार्क थीम',
      collapseSidebar: 'साइडबार लहान करा',
      searchPlaceholder: 'शहर, जिल्हा किंवा गाव शोधा...',
      quickStations: 'प्रमुख भारतीय केंद्रे',
      matchingLocations: 'जुळणारी ठिकाणे (Open-Meteo)',
      searchingLocations: 'ठिकाणे शोधत आहे...',
      noMatchingLocations: 'कोणतेही जुळणारे ठिकाण सापडले नाही.',
      stations: 'प्रमुख शहरे',
      refresh: 'रिफ्रेश करा',
      retry: 'पुन्हा प्रयत्न करा',
      updated: 'अद्यतनित',
      observed: 'नोंदवलेली वेळ',
      localTime: 'स्थानिक वेळ',
      today: 'आज',
      tomorrow: 'उद्या',
      feelsLike: 'जाणवणारे तापमान',
      humidity: 'आर्द्रता',
      windSpeed: 'वाऱ्याचा वेग',
      rainProbability: 'पावसाची शक्यता',
      precipitation: 'पर्जन्यमान',
      sunrise: 'सूर्योदय',
      sunset: 'सूर्यास्त',
      current: 'सध्या',
      next24h: 'पुढील 24 तास',
      source: 'स्रोत',
      weatherUnavailable: 'हवामान डेटा उपलब्ध नाही',
      askWeatherGpt: 'WeatherGPT ला विचारा',
      openSettings: 'सेटिंग्ज',
      languageLabel: 'भाषा',
      roleLabel: 'प्रोफाइल',
      stateLabel: 'राज्य',
      districtLabel: 'जिल्हा',
      nonOfficialNote: 'AI / अंदाज सल्ला (अधिकृत नाही)',
      officialSourceNote: 'अधिकृत IMD / NDMA स्रोत',
      loading: 'लोड होत आहे...',
    },
    citizen: {
      everydaySummaryTitle: 'आजसाठी सोपा दैनंदिन सल्ला',
      umbrellaCarry: 'तुमच्या भागात पावसाची शक्यता आहे. सोबत छत्री ठेवणे उपयुक्त ठरेल.',
      umbrellaNotNeeded: 'आज पावसाची शक्यता कमी आहे. छत्रीची गरज भासणार नाही.',
      commuteSafe: 'दैनंदिन प्रवासासाठी हवामान आणि वारा सामान्य दिसत आहे.',
      commuteCaution: 'पाऊस किंवा जोरदार वाऱ्याच्या शक्यतेमुळे प्रवासासाठी अधिक वेळ ठेवा.',
      outdoorGood: 'सकाळी किंवा संध्याकाळी फिरण्यासाठी आणि बाहेरील कामांसाठी चांगली वेळ आहे.',
      outdoorAvoidHeat: 'दुपारी उष्णता जास्त राहण्याची शक्यता आहे. दुपारी 12 ते 4 दरम्यान उन्हात जाणे टाळा.',
      outdoorAvoidRain: 'जास्त पावसाच्या वेळेत बाहेरील कामे टाळून सुरक्षित ठिकाणी राहा.',
      travelAdviceLabel: 'प्रवास आणि वाहतूक',
      outdoorAdviceLabel: 'बाहेरील कामे',
      precautionsLabel: 'व्यावहारिक काळजी',
      localAlertHeading: 'स्थानिक हवामान इशारे',
      noLocalAlertText: 'सध्या तुमच्या भागासाठी कोणताही गंभीर सरकारी इशारा सक्रिय नाही.',
      hourlyHeading: '24-तासांचा तासागणिक अंदाज',
      hourlySub: 'पुढील 24 तासांतील तापमान आणि पावसाची शक्यता',
      dailyHeading: '7-दिवसांचा अंदाज',
      dailySub: 'दैनंदिन किमान/कमाल तापमान आणि पावसाची शक्यता',
      askExamplesTitle: 'WeatherGPT ला विचारण्याचे प्रश्न',
      sampleQ1: 'उद्या माझ्या भागात पाऊस पडेल का?',
      sampleQ2: 'आज मी सोबत छत्री न्यावी का?',
      sampleQ3: 'उद्या सकाळी तापमान किती असेल?',
    },
    farmer: {
      farmWeatherTitle: 'शेत आणि कृषी हवामान सारांश',
      rainOutlook7d: '7-दिवसांचा पाऊस अंदाज',
      drySpellCheck: 'मागील पाऊस / कोरडा कालावधी तपासणी',
      drySpellDetected: 'मागील 7 दिवसांत अत्यंत कमी किंवा शून्य पाऊस नोंदवला गेला — जमिनीतील ओलावा तपासा.',
      noDrySpell: 'मागील 7 दिवसांत पाऊस नोंदवला गेला आहे — पाणी देण्यापूर्वी शेतातील निचरा तपासा.',
      sprayingTitle: 'वारा आणि फवारणीची परिस्थिती',
      sprayingGood: 'सध्या वारा सौम्य ते मध्यम आहे. लगेच पाऊस नसल्यास फवारणीसाठी योग्य स्थिती आहे.',
      sprayingCaution: 'वाऱ्याचा वेग जास्त आहे. औषध वाया जाऊ नये म्हणून सध्या फवारणी टाळा.',
      irrigationTitle: 'सिंचन (पाणी देणे) विचार',
      irrigationWaitRain: 'लवकरच पावसाची शक्यता आहे. पाणी देण्यापूर्वी जमिनीतील ओलावा नक्की तपासा.',
      irrigationNormalCheck: 'पुढील 48 तासांत पावसाची शक्यता कमी आहे. मुळांजवळील ओलावा पाहून सिंचन ठरवा.',
      sowingHarvestTitle: 'पेरणी आणि काढणी मार्गदर्शन',
      sowingRainNote: 'पुढे पावसाचे संकेत आहेत — काढलेले पीक झाकून ठेवा आणि नवीन पेरणी केलेल्या शेतात निचरा राखा.',
      sowingDryNote: 'मुख्यतः कोरडे हवामान अपेक्षित — काढणी, मळणी आणि धान्य वाळवण्यासाठी अनुकूल वेळ.',
      cropProtectionTitle: 'सामान्य पीक संरक्षण सूचना',
      cropProtectHeat: 'उच्च तापमान अपेक्षित आहे — ओलावा टिकवण्यासाठी आच्छादन किंवा सकाळ/संध्याकाळचे सिंचन करा.',
      cropProtectStorm: 'जोरदार वारे किंवा वादळाची शक्यता — रोपवाटिका, शेड नेट आणि शेतीचे साहित्य सुरक्षित करा.',
      cropProtectGeneral: 'पीक-विशिष्ट निर्णयापूर्वी अधिकृत IMD कृषी हवामान सल्ला पत्रक पहा.',
      agrometHeading: 'अधिकृत कृषी हवामान सल्ला स्रोत',
      agrometDisclaimer: 'हवामान माहिती थेट Open-Meteo वर आधारित आहे. पीक-विशिष्ट सल्ल्यासाठी अधिकृत IMD अ‍ॅग्रोमेट बुलेटिन पहा.',
      agrometLinkImd: 'IMD कृषी हवामान सल्ला (AAS)',
      agrometLinkMeghdoot: 'मेघदूत शेतकरी पोर्टल',
      rainSum7d: '7-दिवस अपेक्षित पाऊस',
      past7dRain: 'मागील 7 दिवसांचा पाऊस',
      maxWindToday: 'आजचा कमाल वारा',
    },
    government: {
      overviewTitle: 'राज्य आणि जिल्हा हवामान निरीक्षण',
      overviewSub: 'अधिकृत IMD / NDMA CAP इशाऱ्यांसह बहु-जिल्हा थेट हवामान स्थिती.',
      selectState: 'राज्य निवडा',
      districtsMonitored: 'निरीक्षणाखालील जिल्हे',
      activeStateWarnings: 'राज्यातील सक्रिय इशारे',
      avgStateTemp: 'सरासरी जिल्हा तापमान',
      peakRainProb: 'कमाल पावसाची शक्यता',
      districtColumn: 'जिल्हा',
      conditionColumn: 'सध्याची स्थिती',
      tempColumn: 'तापमान / जाणवणारे',
      rainProbColumn: 'पाऊस % / मिमी',
      windColumn: 'वारा',
      warningsColumn: 'अधिकृत इशारे',
      actionColumn: 'पहा',
      setLocationBtn: 'जिल्हा निवडा',
      noWarningsDistrict: 'इशारा नाही',
      officialBulletinsTitle: 'राज्यासाठी अधिकृत सरकारी बुलेटिन',
      noStateBulletins: 'सध्या या राज्यासाठी कोणतेही सक्रिय IMD/NDMA CAP बुलेटिन नाही.',
      districtChartTitle: 'जिल्हावार तापमान आणि पावसाची शक्यता तुलना',
      verifySource: 'NDMA सचेतवर तपासा',
    },
    disaster: {
      opsTitle: 'गंभीर हवामान कामकाज केंद्र',
      opsSub: 'तीव्रतेनुसार सक्रिय इशारे, प्रभावित जिल्हे, कालमर्यादा आणि सज्जता समन्वय.',
      activeSevereCount: 'सक्रिय गंभीर इशारे (रेड / ऑरेंज)',
      highRiskZones: 'प्रभावित भाग / जिल्हे',
      cycloneHeavyRainTitle: 'मुसळधार पाऊस, विजा आणि चक्रीवादळ संकेत',
      cycloneHeavyRainNone: 'निवडलेल्या भागात कोणताही सक्रिय रेड/ऑरेंज चक्रीवादळ किंवा अतिवृष्टी CAP इशारा नाही.',
      warningTimelineTitle: 'सक्रिय व आगामी इशाऱ्यांची कालमर्यादा',
      affectedAreasTitle: 'प्रमुख केंद्रांमधील हवामानाचे भौगोलिक वितरण',
      preparednessTitle: 'सज्जता व पूर्वतयारी सूचना',
      preparednessDisclaimer: 'खालील सूचना थेट हवामान डेटावरून तयार केल्या आहेत; या अधिकृत सरकारी आदेश नाहीत.',
      prepItem1: 'NDMA सचेत आणि राज्य SDMA पोर्टलवर इशाऱ्याची वैधता व प्रभावित जिल्हे तपासा.',
      prepItem2: 'रेड किंवा ऑरेंज इशारा असलेल्या भागात पाणी उपसा पंप आणि वीज दुरुस्ती पथके सज्ज ठेवा.',
      prepItem3: 'वादळ किंवा अतिवृष्टीपूर्वी स्थानिक भाषेत नागरिकांना सावधानतेचे संदेश प्रसारित करा.',
      prepItem4: '24 तासांत ≥20 मिमी पावसादरम्यान सखल भुयारी मार्ग आणि नदी खोऱ्यातील पातळीवर लक्ष ठेवा.',
      officialLinksTitle: 'अधिकृत सरकारी पोर्टल आणि फीड्स',
      linkSachet: 'NDMA सचेत CAP पोर्टल',
      linkImd: 'IMD मौसम इशारे',
      linkCwc: 'केंद्रीय जल आयोग पूर अंदाज',
      viewAllAlertsBtn: 'सर्व इशारे पहा',
    },
    alerts: {
      heading: 'हवामान इशारे आणि खबरदारी',
      subheading: 'अधिकृत IMD / NDMA CAP बुलेटिन अंदाज-आधारित सल्ले आणि AI स्पष्टीकरणापासून स्पष्टपणे वेगळे ठेवले आहेत.',
      checkFeedBtn: 'अधिकृत फीड रिफ्रेश करा',
      officialSectionTitle: 'अधिकृत हवामान इशारे (IMD / NDMA CAP)',
      feedConnected: 'थेट अधिकृत फीड जोडलेले आहे',
      feedUnavailable: 'अधिकृत फीड उपलब्ध नाही',
      queryingFeed: 'अधिकृत IMD / NDMA सचेत CAP फीड तपासत आहे...',
      verifySachet: 'NDMA सचेतवर तपासा',
      imdMausam: 'IMD मौसम',
      noLocalWarnings: 'सध्या या ठिकाणासाठी कोणताही सक्रिय सरकारी इशारा नाही:',
      otherNationalTitle: 'भारतातील इतर सक्रिय अधिकृत बुलेटिन',
      derivedSectionTitle: 'हवामान मर्यादा आधारित सल्ले (अधिकृत नाही)',
      derivedSectionSub: 'थेट Open-Meteo 24-तास अंदाजावरून स्वयंचलित तपासणी (उष्णता ≥ 40°C, पाऊस ≥ 20mm / 70%, वारा ≥ 35 km/h).',
      noDerivedThresholds: 'पुढील 24 तासांत या ठिकाणासाठी उच्च उष्णता, मुसळधार पाऊस किंवा जोरदार वाऱ्याची मर्यादा ओलांडलेली नाही:',
      filterAll: 'सर्व',
      filterActive: 'सक्रिय',
      filterUpcoming: 'आगामी',
      filterExpired: 'संपलेले',
      severityLabel: 'अधिकृत तीव्रता',
      authorityLabel: 'जारी करणारी संस्था',
      validFromLabel: 'पासून',
      validUntilLabel: 'पर्यंत',
      explainAiBtn: 'माझ्या भूमिकेनुसार सोपे स्पष्टीकरण (AI)',
      explainingAi: 'सोपे मार्गदर्शन तयार होत आहे...',
      aiExplanationHeader: 'भूमिकेनुरूप सोपे स्पष्टीकरण (AI · अधिकृत नाही)',
      aiExplanationDisclaimer: 'बुलेटिन समजावून सांगण्यासाठी Groq AI ने तयार केले आहे. नेहमी अधिकृत IMD/SDMA सूचनांचे पालन करा.',
      dedupMeta: 'डुप्लिकेट काढले',
      expiredMeta: 'संपलेले बुलेटिन',
      statusActive: 'सक्रिय',
      statusUpcoming: 'आगामी',
      statusExpired: 'संपलेले',
    },
    assistant: {
      conversations: 'संभाषण इतिहास',
      newChat: 'नवीन चॅट',
      loadingConvs: 'मागील संभाषणे लोड होत आहेत...',
      noConvsTitle: 'अद्याप संभाषण नाही',
      noConvsBody: 'खाली हवामानाचा प्रश्न विचारा किंवा नवीन चॅट सुरू करा.',
      anyLocation: 'कोणतेही ठिकाण',
      contextLabel: 'संदर्भ',
      inspectRoles: 'DB भूमिका पहा',
      hideRoles: 'सिस्टम भूमिका लपवा',
      emptyHeading: 'संदर्भ स्मरणासह थेट हवामान प्रश्न विचारा',
      emptySub: 'WeatherGPT उत्तर देण्यापूर्वी वास्तविक Open-Meteo आणि IMD साधने वापरते व तुमच्या भाषा आणि भूमिकेनुसार उत्तर देते.',
      thinking: 'थेट हवामान डेटा तपासून Groq उत्तर तयार करत आहे...',
      listen: 'ऐका',
      stop: 'थांबवा',
      speakHint: 'बोलून विचारा',
      stopVoiceHint: 'व्हॉइस इनपुट थांबवा',
      inputPlaceholder: 'WeatherGPT ला विचारा:',
      send: 'पाठवा',
      groqMissingTitle: 'सर्व्हरवर Groq API की आवश्यक आहे:',
      groqMissingBody: 'थेट AI उत्तरांसाठी सर्व्हर Secrets मध्ये GROQ_API_KEY जोडा.',
      roleContextBadge: 'मोड',
      toolResultLabel: 'साधन निकाल',
      samplePromptsByRole: {
        citizen: [
          'आज अहमदाबादचे हवामान कसे आहे?',
          'उद्या मी सोबत छत्री न्यावी का?',
          'दिल्ली आणि मुंबईच्या हवामानाची तुलना करा.',
          'मुसळधार पावसात कोणती काळजी घ्यावी?',
        ],
        farmer: [
          'पुढील 3 दिवसांत माझ्या भागात पाऊस पडेल का?',
          'आज पिकावर फवारणीसाठी वाऱ्याचा वेग सुरक्षित आहे का?',
          'मागील 14 दिवसांचा पाऊस आणि कोरडा कालावधी तपासा.',
          'हवामानानुसार आज सिंचन करावे का?',
        ],
        government: [
          'आसाम आणि गुजरातमधील सक्रिय IMD/NDMA इशाऱ्यांचा सारांश द्या.',
          'लखनऊ आणि वाराणसीच्या 7-दिवसांच्या पावसाच्या अंदाजाची तुलना करा.',
          'गुवाहाटीसाठी गंभीर हवामान इशारे आणि वैधता वेळ सांगा.',
          'पाटणासाठी मागील 14 दिवस व पुढील 7 दिवसांचा पाऊस अंदाज द्या.',
        ],
        disaster: [
          'सर्व सक्रिय गंभीर हवामान इशारे आणि प्रभावित जिल्ह्यांची यादी द्या.',
          'आज गुवाहाटीमध्ये वादळ आणि वाऱ्याच्या वेगाची स्थिती काय आहे?',
          'मुंबई आणि विशाखापट्टणममधील मुसळधार पाऊस/चक्रीवादळ धोका तपासा.',
          '50 मिमीपेक्षा जास्त पावसाचा अंदाज असल्यास कोणती तयारी करावी?',
        ],
      },
    },
    forecast: {
      heading: '48-तास आणि 7-दिवसांचा अंदाज',
      bestMatch: 'Open-Meteo बेस्ट मॅच',
      gfsSeamless: 'NOAA GFS मॉडेल',
      hourlyTempTitle: '48-तास तापमान आणि जाणवणारे तापमान',
      rainProbTitle: 'पावसाची शक्यता (%) आणि पाऊस (mm)',
      dailyRangeTitle: '7-दिवस तापमान श्रेणी',
      tableTitle: '7-दिवसांचा सविस्तर अंदाज',
      colDate: 'दिनांक',
      colCondition: 'स्थिती',
      colMinMax: 'किमान / कमाल',
      colRainProb: 'पाऊस %',
      colRainSum: 'एकूण पाऊस',
      colMaxWind: 'कमाल वारा',
      colUvMax: 'UV कमाल',
      colSun: 'सूर्योदय / सूर्यास्त',
      tempSeries: 'तापमान',
      feelsSeries: 'जाणवणारे',
      rainMmSeries: 'पाऊस (mm)',
      rainProbSeries: 'शक्यता (%)',
      maxSeries: 'कमाल',
      minSeries: 'किमान',
    },
    map: {
      jumpPlaceholder: 'नकाशावर शहर शोधा...',
      refreshStations: 'केंद्रे रिफ्रेश करा',
      tempLayer: 'तापमान स्तर',
      rainLayer: 'पाऊस स्तर',
      footerSource: 'मूळ नकाशा: OpenStreetMap · डेटा: Open-Meteo मल्टी-पॉइंट API',
      footerHint: 'थेट हवामान पाहण्यासाठी कोणत्याही मार्करवर किंवा नकाशावर क्लिक करा',
      loadingPoint: 'निवडलेल्या ठिकाणाचे थेट हवामान लोड होत आहे...',
      setActiveBtn: 'मुख्य डॅशबोर्ड ठिकाण म्हणून सेट करा',
      windLabel: 'वारा',
    },
    analytics: {
      heading: 'हवामान विश्लेषण',
      archiveLabel: 'संग्रह',
      pastDaysBtn: 'मागील {days} दिवस',
      compareWith: 'तुलना करा:',
      histVsFcTitle: 'मागील नोंदी विरुद्ध आगामी अंदाज तापमान',
      histVsFcSub: 'सलग रेषा ERA5 ऐतिहासिक नोंदी दर्शवतात; तुटक रेषा 7-दिवसांचा अंदाज दर्शवतात.',
      forecastStart: 'अंदाज सुरुवात',
      histMax: 'ऐतिहासिक कमाल',
      histMin: 'ऐतिहासिक किमान',
      fcMax: 'अंदाज कमाल',
      fcMin: 'अंदाज किमान',
      histRainTitle: 'ऐतिहासिक दैनंदिन पाऊस (mm) — मागील {days} दिवस',
      histRainSub: 'ERA5 ने नोंदवलेला दैनंदिन पाऊस:',
      observedRainSeries: 'नोंदलेला पाऊस (mm)',
      compareTitle: 'ठिकाण तुलना',
      compareSub: '7-दिवसांचे कमाल तापमान अंदाज',
      nowLabel: 'आता',
      floodModuleTitle: 'भावी पूर अंदाज एकत्रीकरण',
      floodStatusPrefix: 'स्थिती',
    },
    settings: {
      heading: 'प्लॅटफॉर्म सेटिंग्ज आणि वैयक्तिकरण',
      subheading: 'इंटरफेस भाषा, वापरकर्ता भूमिका, तापमान एकक आणि थीम कधीही बदला.',
      languageCardTitle: 'इंटरफेस आणि AI भाषा',
      languageCardSub: 'पेज रीलोड न करता सर्व मेनू, तक्ते, इशारे आणि AI उत्तरे तात्काळ बदलतात.',
      roleCardTitle: 'वापरकर्ता अनुभव प्रोफाइल',
      roleCardSub: 'डॅशबोर्ड रचना, सल्ले आणि AI मार्गदर्शन तुमच्या भूमिकेनुसार बदलते.',
      displayCardTitle: 'मापन आणि स्वरूप',
      displayCardSub: 'तापमान एकक आणि लाइट/डार्क मोड निवडा.',
      unitLabel: 'तापमान एकक',
      themeLabel: 'रंग थीम',
      resetOnboardingTitle: 'प्रारंभिक सेटअप स्क्रीन',
      resetOnboardingSub: 'भाषा आणि भूमिका निवड पुन्हा पाहण्यासाठी स्वागत स्क्रीन उघडा.',
      resetOnboardingBtn: 'सेटअप स्क्रीन पुन्हा उघडा',
      activeBadge: 'सक्रिय',
    },
    conditions: {
      'Clear sky': 'स्वच्छ आकाश',
      'Mainly clear': 'मुख्यतः स्वच्छ',
      'Partly cloudy': 'अंशतः ढगाळ',
      Overcast: 'दाट ढगाळ',
      Fog: 'धुके',
      'Depositing rime fog': 'दाट धुके',
      'Light drizzle': 'हलकी रिमझिम',
      'Moderate drizzle': 'मध्यम रिमझिम',
      'Dense drizzle': 'जोरदार रिमझिम',
      'Light freezing drizzle': 'हलका थंड शिडकाव',
      'Dense freezing drizzle': 'दाट थंड शिडकाव',
      'Slight rain': 'हलका पाऊस',
      'Moderate rain': 'मध्यम पाऊस',
      'Heavy rain': 'मुसळधार पाऊस',
      'Light freezing rain': 'हलका गारपाऊस',
      'Heavy freezing rain': 'मुसळधार गारपाऊस',
      'Slight snow fall': 'हलकी बर्फवृष्टी',
      'Moderate snow fall': 'मध्यम बर्फवृष्टी',
      'Heavy snow fall': 'जोरदार बर्फवृष्टी',
      'Snow grains': 'बर्फाचे कण',
      'Slight rain showers': 'हलक्या सरी',
      'Moderate rain showers': 'मध्यम सरी',
      'Violent rain showers': 'मुसळधार सरी',
      'Slight snow showers': 'हलक्या हिमसरी',
      'Heavy snow showers': 'जोरदार हिमसरी',
      Thunderstorm: 'वादळी पाऊस',
      'Thunderstorm with slight hail': 'गारांसह वादळ',
      'Thunderstorm with heavy hail': 'जोरदार गारपीट व वादळ',
      'Variable conditions': 'बदलते हवामान',
    },
    windDirs: {
      N: 'उ', NNE: 'उ-ई', NE: 'ई', ENE: 'पू-ई',
      E: 'पू', ESE: 'पू-आ', SE: 'आ', SSE: 'द-आ',
      S: 'द', SSW: 'द-नै', SW: 'नै', WSW: 'प-नै',
      W: 'प', WNW: 'प-वा', NW: 'वा', NNW: 'उ-वा',
    },
  },
};

export function getDict(lang: UILanguageCode): TranslationDict {
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}

export function translateCondition(condition: string, lang: UILanguageCode): string {
  const dict = getDict(lang);
  return dict.conditions[condition] ?? condition;
}

export function translateWindDir(cardinal: string, lang: UILanguageCode): string {
  const dict = getDict(lang);
  return dict.windDirs[cardinal] ?? cardinal;
}
