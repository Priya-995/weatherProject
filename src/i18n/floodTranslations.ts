import type { FloodRiskLevel, UILanguageCode, UserRoleType } from '../types/weather.ts';

export interface FloodTranslationDict {
  sectionTitle: string;
  nonOfficialBadge: string;
  disclaimer: string;
  horizonLabel: string;
  forecastDateLabel: string;
  applyDateBtn: string;
  probabilityLabel: string;
  rawProbLabel: string;
  baselineLabel: string;
  thresholdLabel: string;
  thresholdExceededYes: string;
  thresholdExceededNo: string;
  riskLabels: Record<FloodRiskLevel, string>;
  statusUnavailableTitle: string;
  reasons: Record<string, string>;
  supportedDistrictsLabel: string;
  modelMetaLabel: string;
  featuresHeading: string;
  featureLabels: {
    rain_1d: string;
    rain_3d: string;
    rain_7d: string;
    rain_14d: string;
    rain_30d: string;
    rain_api: string;
    soil_moisture: string;
    soil_change_7d: string;
    discharge: string;
    discharge_change_3d: string;
    discharge_anomaly: string;
  };
  roleGuidance: Record<UserRoleType, {
    elevated: string;
    moderate: string;
    low: string;
  }>;
  regionalTableTitle: string;
  regionalTableSub: string;
  studyGroupCol: string;
  probShortCol: string;
  riskSignalCol: string;
  dischargeCol: string;
  focusDistrictBtn: string;
  regionalLoadingText: string;
  loadingText: string;
  askFloodBtn: string;
  verifyCwcLink: string;
}

export const FLOOD_TRANSLATIONS: Record<UILanguageCode, FloodTranslationDict> = {
  en: {
    sectionTitle: 'Uttar Pradesh 3-Day Flood-Onset ML Outlook',
    nonOfficialBadge: 'Experimental ML Model · Non-Official',
    disclaimer:
      'Calibrated 3-day flood-onset probability from the trained XGBoost + Isotonic Regression model (14 UP study districts, June–October). Never treat this as an official IMD, CWC, or NDMA flood warning.',
    horizonLabel: 'Horizon: Next 3 Days',
    forecastDateLabel: 'Forecast Date',
    applyDateBtn: 'Check Date',
    probabilityLabel: 'Calibrated 3-Day Flood Probability',
    rawProbLabel: 'Raw XGBoost Score',
    baselineLabel: 'Seasonal District Baseline',
    thresholdLabel: 'Operating Threshold (CSI)',
    thresholdExceededYes: 'At or above operating threshold',
    thresholdExceededNo: 'Below operating threshold',
    riskLabels: {
      elevated: 'Elevated ML Signal',
      moderate: 'Above Seasonal Baseline',
      low: 'Low / Baseline Risk',
      unavailable: 'Prediction Unavailable',
    },
    statusUnavailableTitle: 'Flood ML Prediction Unavailable',
    reasons: {
      unsupported_district:
        'This model only covers 14 trained districts in Uttar Pradesh. Other cities/districts do not have trained river-point calibration.',
      outside_monsoon_season:
        'Model inference is restricted to the June–October monsoon season. Select a date between June and October to evaluate monsoon flood risk.',
      model_artifacts_missing:
        'Trained artifacts (flood_model.json and model_table.parquet) are not yet loaded in backend/ml_artifacts/.',
      missing_input_data:
        'Required 30-day trailing rainfall, soil moisture, or river discharge observations from Open-Meteo are incomplete for this date.',
      missing_climatology:
        'District monthly baseline river discharge climatology is unavailable for this month.',
      open_meteo_fetch_failed:
        'Live Open-Meteo weather or flood discharge data could not be retrieved right now.',
      ml_service_offline:
        'The Python FastAPI flood ML microservice is currently offline.',
    },
    supportedDistrictsLabel: 'Supported UP Study Districts (14)',
    modelMetaLabel: 'XGBoost + Isotonic Calibration · Open-Meteo ERA5 + GloFAS Discharge',
    featuresHeading: 'Model Input Features (Exact Notebook Pipeline)',
    featureLabels: {
      rain_1d: '1-Day Rain (mm)',
      rain_3d: '3-Day Rain (mm)',
      rain_7d: '7-Day Rain (mm)',
      rain_14d: '14-Day Rain (mm)',
      rain_30d: '30-Day Rain (mm)',
      rain_api: 'Antecedent Precip Index',
      soil_moisture: 'Soil Moisture (0–7 cm)',
      soil_change_7d: '7-Day Soil Change',
      discharge: 'River Discharge (m³/s)',
      discharge_change_3d: '3-Day Discharge Change',
      discharge_anomaly: 'Discharge vs Normal (×)',
    },
    roleGuidance: {
      citizen: {
        elevated:
          'Flood risk signal is elevated for the next 3 days. Avoid waterlogged underpasses, low-lying riverbanks, and monitor official IMD/NDMA Sachet alerts.',
        moderate:
          'Flood onset chance is slightly above normal for this monsoon month. Keep emergency contacts handy and watch local water levels.',
        low:
          '3-day flood-onset probability is at or below normal monsoon levels. Continue normal caution during heavy showers.',
      },
      farmer: {
        elevated:
          'Elevated 3-day flood signal — check field drainage channels, move harvested grain to raised dry storage, and pause heavy irrigation.',
        moderate:
          'Slightly above seasonal flood baseline — keep bunds and drainage outlets clear in low-lying plots before any rainfall.',
        low:
          'Low flood-onset signal right now — follow regular field drainage checks and official IMD Agromet advisories.',
      },
      government: {
        elevated:
          'Calibrated probability exceeds the validation CSI threshold. Cross-verify CWC river gauge levels and active IMD/NDMA CAP bulletins for this district.',
        moderate:
          'Calibrated probability exceeds district monthly climatology but remains below the CSI operating threshold. Maintain routine hydro-met monitoring.',
        low:
          'District probability remains within seasonal baseline; continue standard monsoon watch.',
      },
      disaster: {
        elevated:
          'Operating threshold exceeded (non-official ML signal). Verify CWC Flood Forecast gauges and pre-check evacuation & dewatering readiness in low-lying blocks.',
        moderate:
          'Above seasonal baseline (below CSI alert cut). Track 3-day river discharge trend and soil saturation for rapid escalation.',
        low:
          'No elevated ML flood-onset signal triggered. Maintain standard monitoring of CWC & NDMA Sachet feeds.',
      },
    },
    regionalTableTitle: 'Uttar Pradesh 14 Study Districts — Central ML 3-Day Flood Outlook',
    regionalTableSub:
      'Single shared XGBoost engine evaluated identically across all 14 UP study districts.',
    studyGroupCol: 'Study Group',
    probShortCol: '3-Day Prob.',
    riskSignalCol: 'ML Signal',
    dischargeCol: 'Discharge (m³/s)',
    focusDistrictBtn: 'Inspect',
    regionalLoadingText: 'Evaluating 14 UP study districts via central flood ML engine...',
    loadingText: 'Querying central FastAPI XGBoost flood prediction service...',
    askFloodBtn: 'Ask WeatherGPT About Flood Risk',
    verifyCwcLink: 'Verify Official CWC Flood Forecast',
  },
  hi: {
    sectionTitle: 'उत्तर प्रदेश 3-दिवसीय बाढ़-शुरुआत ML पूर्वानुमान',
    nonOfficialBadge: 'प्रायोगिक ML मॉडल · गैर-आधिकारिक',
    disclaimer:
      'यह प्रशिक्षित XGBoost + आइसोटोनिक कैलिब्रेशन मॉडल (14 UP अध्ययन जिले, जून–अक्टूबर) से प्राप्त 3-दिन की बाढ़ संभावना है। इसे IMD, CWC या NDMA की आधिकारिक सरकारी चेतावनी न मानें।',
    horizonLabel: 'अवधि: अगले 3 दिन',
    forecastDateLabel: 'पूर्वानुमान तिथि',
    applyDateBtn: 'तिथि जांचें',
    probabilityLabel: 'कैलिब्रेटेड 3-दिवसीय बाढ़ संभावना',
    rawProbLabel: 'रॉ XGBoost स्कोर',
    baselineLabel: 'मौसमी जिला आधार दर',
    thresholdLabel: 'ऑपरेटिंग सीमा (CSI)',
    thresholdExceededYes: 'ऑपरेटिंग सीमा पर या उससे ऊपर',
    thresholdExceededNo: 'ऑपरेटिंग सीमा से नीचे',
    riskLabels: {
      elevated: 'उच्च ML बाढ़ संकेत',
      moderate: 'सामान्य से ऊपर संकेत',
      low: 'सामान्य / कम जोखिम',
      unavailable: 'पूर्वानुमान अनुपलब्ध',
    },
    statusUnavailableTitle: 'बाढ़ ML पूर्वानुमान उपलब्ध नहीं है',
    reasons: {
      unsupported_district:
        'यह मॉडल केवल उत्तर प्रदेश के 14 प्रशिक्षित जिलों के लिए है। अन्य शहरों या जिलों के लिए मॉडल उपलब्ध नहीं है।',
      outside_monsoon_season:
        'यह मॉडल केवल जून से अक्टूबर मानसून अवधि के लिए सक्रिय है। कृपया जून–अक्टूबर के बीच की तिथि चुनें।',
      model_artifacts_missing:
        'प्रशिक्षित मॉडल फ़ाइलें (flood_model.json व model_table.parquet) अभी backend/ml_artifacts/ में उपलब्ध नहीं हैं।',
      missing_input_data:
        'इस तिथि के लिए Open-Meteo से आवश्यक 30-दिन वर्षा, मिट्टी की नमी या नदी प्रवाह डेटा अधूरा है।',
      missing_climatology:
        'इस महीने के लिए जिले का ऐतिहासिक नदी प्रवाह आधार डेटा उपलब्ध नहीं है।',
      open_meteo_fetch_failed:
        'अभी Open-Meteo मौसम या नदी प्रवाह डेटा प्राप्त नहीं हो सका।',
      ml_service_offline: 'Python FastAPI बाढ़ ML सेवा अभी ऑफ़लाइन है।',
    },
    supportedDistrictsLabel: 'समर्थित UP अध्ययन जिले (14)',
    modelMetaLabel: 'XGBoost + आइसोटोनिक कैलिब्रेशन · Open-Meteo ERA5 + GloFAS प्रवाह',
    featuresHeading: 'मॉडल इनपुट विशेषताएँ (सटीक नोटबुक पाइपलाइन)',
    featureLabels: {
      rain_1d: '1-दिन बारिश (mm)',
      rain_3d: '3-दिन बारिश (mm)',
      rain_7d: '7-दिन बारिश (mm)',
      rain_14d: '14-दिन बारिश (mm)',
      rain_30d: '30-दिन बारिश (mm)',
      rain_api: 'पूर्ववर्ती वर्षा सूचकांक',
      soil_moisture: 'मिट्टी की नमी (0–7 सेमी)',
      soil_change_7d: '7-दिन नमी परिवर्तन',
      discharge: 'नदी प्रवाह (m³/s)',
      discharge_change_3d: '3-दिन प्रवाह परिवर्तन',
      discharge_anomaly: 'सामान्य से प्रवाह अनुपात (×)',
    },
    roleGuidance: {
      citizen: {
        elevated:
          'अगले 3 दिनों में बाढ़ का संकेत बढ़ा हुआ है। जलभराव वाले रास्तों व निचले नदी किनारों से बचें और आधिकारिक IMD/NDMA सचेत देखें।',
        moderate:
          'इस मानसून माह में संभावना सामान्य से कुछ अधिक है। स्थानीय जल स्तर और आधिकारिक अलर्ट पर नज़र रखें।',
        low:
          '3-दिन की बाढ़ संभावना सामान्य मानसून स्तर पर है। तेज़ बारिश में सामान्य सावधानी बरतें।',
      },
      farmer: {
        elevated:
          'बाढ़ संकेत बढ़ा हुआ है — खेत की जल-निकासी साफ़ रखें, कटी उपज ऊंचे सूखे स्थान पर रखें और अनावश्यक सिंचाई रोकें।',
        moderate:
          'मौसमी आधार से थोड़ा अधिक संकेत — निचले खेतों में मेड़ व निकास मार्ग पहले से जांच लें।',
        low:
          'अभी बाढ़ का संकेत कम है — नियमित खेत निरीक्षण और IMD एग्रोमेट बुलेटिन का पालन करें।',
      },
      government: {
        elevated:
          'संभावना CSI सीमा से ऊपर है। जिले के लिए CWC नदी गेज स्तर और आधिकारिक IMD/NDMA CAP बुलेटिन का मिलान करें।',
        moderate:
          'संभावना मासिक आधार दर से ऊपर है पर CSI सीमा से नीचे है। नियमित निगरानी बनाए रखें।',
        low:
          'जिले की संभावना सामान्य मानसून आधार के भीतर है।',
      },
      disaster: {
        elevated:
          'CSI ऑपरेटिंग सीमा पार (गैर-आधिकारिक ML संकेत)। CWC बाढ़ गेज सत्यापित करें और निचले क्षेत्रों में पंप व निकासी तैयारी जांचें।',
        moderate:
          'आधार दर से ऊपर (सीमा से नीचे)। नदी प्रवाह और मिट्टी संतृप्ति के 3-दिवसीय रुझान पर नज़र रखें।',
        low:
          'कोई उच्च ML बाढ़ संकेत नहीं। मानक CWC व NDMA सचेत निगरानी जारी रखें।',
      },
    },
    regionalTableTitle: 'उत्तर प्रदेश के 14 अध्ययन जिले — केंद्रीय ML 3-दिन बाढ़ स्थिति',
    regionalTableSub:
      'सभी 14 UP अध्ययन जिलों के लिए एक ही केंद्रीय XGBoost इंजन द्वारा समान गणना।',
    studyGroupCol: 'अध्ययन क्षेत्र',
    probShortCol: '3-दिन संभावना',
    riskSignalCol: 'ML संकेत',
    dischargeCol: 'प्रवाह (m³/s)',
    focusDistrictBtn: 'देखें',
    regionalLoadingText: 'केंद्रीय बाढ़ ML इंजन द्वारा सभी 14 UP जिलों का मूल्यांकन हो रहा है...',
    loadingText: 'केंद्रीय FastAPI XGBoost बाढ़ मॉडल से डेटा लिया जा रहा है...',
    askFloodBtn: 'WeatherGPT से बाढ़ जोखिम पूछें',
    verifyCwcLink: 'आधिकारिक CWC बाढ़ पूर्वानुमान देखें',
  },
  gu: {
    sectionTitle: 'ઉત્તર પ્રદેશ 3-દિવસીય પૂર-શરૂઆત ML અંદાજ',
    nonOfficialBadge: 'પ્રાયોગિક ML મોડેલ · બિન-સત્તાવાર',
    disclaimer:
      'આ તાલીમ પામેલા XGBoost + આઇસોટોનિક કેલિબ્રેશન મોડેલ (14 UP અભ્યાસ જિલ્લાઓ, જૂન–ઓક્ટોબર) પર આધારિત 3-દિવસની પૂર સંભાવના છે. તેને IMD, CWC કે NDMA ની સત્તાવાર ચેતવણી ગણવી નહીં.',
    horizonLabel: 'અવધિ: આગામી 3 દિવસ',
    forecastDateLabel: 'અંદાજ તારીખ',
    applyDateBtn: 'તારીખ તપાસો',
    probabilityLabel: 'કેલિબ્રેટેડ 3-દિવસ પૂર સંભાવના',
    rawProbLabel: 'રો XGBoost સ્કોર',
    baselineLabel: 'મોસમી જિલ્લા આધાર દર',
    thresholdLabel: 'ઓપરેટિંગ મર્યાદા (CSI)',
    thresholdExceededYes: 'ઓપરેટિંગ મર્યાદા પર અથવા ઉપર',
    thresholdExceededNo: 'ઓપરેટિંગ મર્યાદાથી નીચે',
    riskLabels: {
      elevated: 'ઉચ્ચ ML પૂર સંકેત',
      moderate: 'સામાન્યથી વધુ સંકેત',
      low: 'નીચું / સામાન્ય જોખમ',
      unavailable: 'અંદાજ ઉપલબ્ધ નથી',
    },
    statusUnavailableTitle: 'પૂર ML અંદાજ ઉપલબ્ધ નથી',
    reasons: {
      unsupported_district:
        'આ મોડેલ માત્ર ઉત્તર પ્રદેશના 14 તાલીમ પામેલા જિલ્લાઓ માટે છે. અન્ય શહેરો કે જિલ્લાઓ માટે ઉપલબ્ધ નથી.',
      outside_monsoon_season:
        'મોડેલ માત્ર જૂનથી ઓક્ટોબર ચોમાસાની ઋતુમાં જ સક્રિય છે. કૃપા કરીને જૂન–ઓક્ટોબર વચ્ચેની તારીખ પસંદ કરો.',
      model_artifacts_missing:
        'તાલીમ પામેલ મોડેલ ફાઇલો (flood_model.json અને model_table.parquet) હજી backend/ml_artifacts/ માં નથી.',
      missing_input_data:
        'આ તારીખ માટે Open-Meteo નો જરૂરી 30-દિવસનો વરસાદ, જમીનનો ભેજ કે નદી પ્રવાહ ડેટા અધૂરો છે.',
      missing_climatology:
        'આ મહિના માટે જિલ્લાનો નદી પ્રવાહ આધાર ડેટા ઉપલબ્ધ નથી.',
      open_meteo_fetch_failed:
        'હાલમાં Open-Meteo હવામાન અથવા નદી પ્રવાહ ડેટા મેળવી શકાયો નથી.',
      ml_service_offline: 'Python FastAPI પૂર ML સેવા હાલમાં ઓફલાઇન છે.',
    },
    supportedDistrictsLabel: 'સમર્થિત UP અભ્યાસ જિલ્લાઓ (14)',
    modelMetaLabel: 'XGBoost + આઇસોટોનિક કેલિબ્રેશન · Open-Meteo ERA5 + GloFAS',
    featuresHeading: 'મોડેલ ઇનપુટ લક્ષણો (નોટબુક મુજબ)',
    featureLabels: {
      rain_1d: '1-દિવસ વરસાદ (mm)',
      rain_3d: '3-દિવસ વરસાદ (mm)',
      rain_7d: '7-દિવસ વરસાદ (mm)',
      rain_14d: '14-દિવસ વરસાદ (mm)',
      rain_30d: '30-દિવસ વરસાદ (mm)',
      rain_api: 'પૂર્વવર્તી વરસાદ સૂચકાંક',
      soil_moisture: 'જમીનનો ભેજ (0–7 સેમી)',
      soil_change_7d: '7-દિવસ ભેજ ફેરફાર',
      discharge: 'નદી પ્રવાહ (m³/s)',
      discharge_change_3d: '3-દિવસ પ્રવાહ ફેરફાર',
      discharge_anomaly: 'સામાન્યથી પ્રવાહ ગુણોત્તર (×)',
    },
    roleGuidance: {
      citizen: {
        elevated:
          'આગામી 3 દિવસમાં પૂરનો સંકેત વધારે છે. પાણી ભરાયેલા રસ્તા અને નદી કિનારાથી દૂર રહો અને સત્તાવાર IMD/NDMA સચેત ચેતવણી જુઓ.',
        moderate:
          'ચોમાસાની સામાન્ય સરેરાશ કરતાં સંભાવના થોડી વધુ છે. સ્થાનિક પાણીના સ્તર પર નજર રાખો.',
        low:
          '3-દિવસની પૂર સંભાવના સામાન્ય સ્તરે છે. ભારે વરસાદ દરમિયાન સામાન્ય સાવચેતી રાખો.',
      },
      farmer: {
        elevated:
          'ઉચ્ચ પૂર સંકેત — ખેતરના નિકાસ માર્ગો ખુલ્લા રાખો, કાપેલો પાક સુરક્ષિત સૂકી જગ્યાએ ખસેડો અને પિયત મોકૂફ રાખો.',
        moderate:
          'મોસમી સરેરાશ કરતાં થોડો વધુ સંકેત — નીચાણવાળા ખેતરોમાં પાળા અને પાણી નિકાસની વ્યવસ્થા તપાસી લો.',
        low:
          'હાલમાં પૂરનો સંકેત ઓછો છે — નિયમિત ખેતર દેખરેખ અને IMD એગ્રોમેટ સૂચનાઓ અનુસરો.',
      },
      government: {
        elevated:
          'કેલિબ્રેટેડ સંભાવના CSI મર્યાદા કરતાં વધુ છે. CWC નદી ગેજ અને સત્તાવાર IMD/NDMA CAP બુલેટિન ચકાસો.',
        moderate:
          'માસિક આધાર કરતાં વધુ પરંતુ CSI મર્યાદાથી નીચે. નિયમિત દેખરેખ ચાલુ રાખો.',
        low:
          'જિલ્લાની સંભાવના સામાન્ય મોસમી આધારમાં છે.',
      },
      disaster: {
        elevated:
          'ઓપરેટિંગ મર્યાદા ઓળંગાઈ (બિન-સત્તાવાર ML સંકેત). CWC પૂર ગેજ ચકાસો અને નીચાણવાળા વિસ્તારોમાં પંપ તથા સ્થળાંતર તૈયારી રાખો.',
        moderate:
          'આધાર દરથી વધુ (મર્યાદાથી નીચે). નદી પ્રવાહ અને જમીન સંતૃપ્તિના 3-દિવસીય વલણ પર નજર રાખો.',
        low:
          'કોઈ ઉચ્ચ ML પૂર સંકેત નથી. CWC અને NDMA સચેત ફીડની નિયમિત તપાસ ચાલુ રાખો.',
      },
    },
    regionalTableTitle: 'ઉત્તર પ્રદેશના 14 અભ્યાસ જિલ્લાઓ — કેન્દ્રીય ML 3-દિવસ પૂર સ્થિતિ',
    regionalTableSub:
      'તમામ 14 UP અભ્યાસ જિલ્લાઓ માટે એક જ કેન્દ્રીય XGBoost એન્જિન દ્વારા સમાન ગણતરી.',
    studyGroupCol: 'અભ્યાસ જૂથ',
    probShortCol: '3-દિવસ સંભાવના',
    riskSignalCol: 'ML સંકેત',
    dischargeCol: 'પ્રવાહ (m³/s)',
    focusDistrictBtn: 'જુઓ',
    regionalLoadingText: 'કેન્દ્રીય પૂર ML એન્જિન દ્વારા 14 UP જિલ્લાઓની ગણતરી થઈ રહી છે...',
    loadingText: 'કેન્દ્રીય FastAPI XGBoost પૂર સેવામાંથી ડેટા મેળવી રહ્યું છે...',
    askFloodBtn: 'WeatherGPT ને પૂર જોખમ પૂછો',
    verifyCwcLink: 'સત્તાવાર CWC પૂર અંદાજ જુઓ',
  },
  mr: {
    sectionTitle: 'उत्तर प्रदेश 3-दिवसीय पूर-सुरुवात ML अंदाज',
    nonOfficialBadge: 'प्रायोगिक ML मॉडेल · अधिकृत नाही',
    disclaimer:
      'हे प्रशिक्षित XGBoost + आयसोटोनिक कॅलिब्रेशन मॉडेल (14 UP अभ्यास जिल्हे, जून–ऑक्टोबर) वरून मिळालेली 3-दिवसांची पूर शक्यता आहे. यास IMD, CWC किंवा NDMA चा अधिकृत सरकारी इशारा मानू नये.',
    horizonLabel: 'कालावधी: पुढील 3 दिवस',
    forecastDateLabel: 'अंदाज दिनांक',
    applyDateBtn: 'तारीख तपासा',
    probabilityLabel: 'कॅलिब्रेटेड 3-दिवस पूर शक्यता',
    rawProbLabel: 'रॉ XGBoost स्कोअर',
    baselineLabel: 'हंगामी जिल्हा आधार दर',
    thresholdLabel: 'ऑपरेटिंग मर्यादा (CSI)',
    thresholdExceededYes: 'ऑपरेटिंग मर्यादेवर किंवा वर',
    thresholdExceededNo: 'ऑपरेटिंग मर्यादेखाली',
    riskLabels: {
      elevated: 'उच्च ML पूर संकेत',
      moderate: 'सरासरीपेक्षा जास्त संकेत',
      low: 'कमी / सामान्य धोका',
      unavailable: 'अंदाज उपलब्ध नाही',
    },
    statusUnavailableTitle: 'पूर ML अंदाज उपलब्ध नाही',
    reasons: {
      unsupported_district:
        'हे मॉडेल केवळ उत्तर प्रदेशातील 14 प्रशिक्षित जिल्ह्यांसाठी आहे. इतर शहरे किंवा जिल्ह्यांसाठी उपलब्ध नाही.',
      outside_monsoon_season:
        'मॉडेल केवळ जून ते ऑक्टोबर पावसाळी हंगामासाठी कार्यरत आहे. कृपया जून–ऑक्टोबरमधील तारीख निवडा.',
      model_artifacts_missing:
        'प्रशिक्षित मॉडेल फाइल्स (flood_model.json आणि model_table.parquet) अद्याप backend/ml_artifacts/ मध्ये ठेवलेल्या नाहीत.',
      missing_input_data:
        'या तारखेसाठी Open-Meteo कडील आवश्यक 30-दिवसांचा पाऊस, जमिनीतील ओलावा किंवा नदी विसर्ग डेटा अपूर्ण आहे.',
      missing_climatology:
        'या महिन्यासाठी जिल्ह्याचा नदी विसर्ग आधार डेटा उपलब्ध नाही.',
      open_meteo_fetch_failed:
        'सध्या Open-Meteo हवामान किंवा नदी विसर्ग डेटा मिळू शकला नाही.',
      ml_service_offline: 'Python FastAPI पूर ML सेवा सध्या ऑफलाइन आहे.',
    },
    supportedDistrictsLabel: 'समर्थित UP अभ्यास जिल्हे (14)',
    modelMetaLabel: 'XGBoost + आयसोटोनिक कॅलिब्रेशन · Open-Meteo ERA5 + GloFAS',
    featuresHeading: 'मॉडेल इनपुट वैशिष्ट्ये (मूळ नोटबुकनुसार)',
    featureLabels: {
      rain_1d: '1-दिवस पाऊस (mm)',
      rain_3d: '3-दिवस पाऊस (mm)',
      rain_7d: '7-दिवस पाऊस (mm)',
      rain_14d: '14-दिवस पाऊस (mm)',
      rain_30d: '30-दिवस पाऊस (mm)',
      rain_api: 'पूर्ववर्ती पाऊस निर्देशांक',
      soil_moisture: 'जमिनीतील ओलावा (0–7 सेमी)',
      soil_change_7d: '7-दिवस ओलावा बदल',
      discharge: 'नदी विसर्ग (m³/s)',
      discharge_change_3d: '3-दिवस विसर्ग बदल',
      discharge_anomaly: 'सरासरीपेक्षा विसर्ग गुणोत्तर (×)',
    },
    roleGuidance: {
      citizen: {
        elevated:
          'पुढील 3 दिवसांत पूर संकेत वाढलेला आहे. पाणी साचलेले भुयारी मार्ग व सखल नदीकाठ टाळा आणि अधिकृत IMD/NDMA सचेत इशारे पहा.',
        moderate:
          'पावसाळी सरासरीपेक्षा शक्यता किंचित जास्त आहे. स्थानिक पाणी पातळी आणि अधिकृत सूचनांकडे लक्ष ठेवा.',
        low:
          '3-दिवसांची पूर शक्यता सामान्य पातळीवर आहे. मुसळधार पावसात नेहमीची काळजी घ्या.',
      },
      farmer: {
        elevated:
          'उच्च पूर संकेत — शेतातील निचरा चारी मोकळ्या ठेवा, काढलेले पीक उंच कोरड्या जागी हलवा आणि सिंचन तात्पुरते थांबवा.',
        moderate:
          'हंगामी सरासरीपेक्षा किंचित अधिक संकेत — सखल भागातील बांध आणि पाणी निचरा व्यवस्था तपासा.',
        low:
          'सध्या पूर संकेत कमी आहे — नियमित शेत निचरा तपासणी व अधिकृत IMD अ‍ॅग्रोमेट सल्ल्यांचे पालन करा.',
      },
      government: {
        elevated:
          'कॅलिब्रेटेड शक्यता CSI मर्यादेपेक्षा जास्त आहे. CWC नदी गेज पातळी व अधिकृत IMD/NDMA CAP बुलेटिनची पडताळणी करा.',
        moderate:
          'मासिक आधार दरापेक्षा जास्त परंतु CSI मर्यादेखाली. नियमित देखरेख सुरू ठेवा.',
        low:
          'जिल्ह्याची शक्यता सामान्य हंगामी मर्यादेत आहे.',
      },
      disaster: {
        elevated:
          'ऑपरेटिंग मर्यादा ओलांडली (अधिकृत नाही असा ML संकेत). CWC पूर गेज तपासा व सखल भागात पंप आणि बचाव पथके सज्ज ठेवा.',
        moderate:
          'आधार दरापेक्षा जास्त (मर्यादेखाली). नदी विसर्ग व जमिनीच्या संतृप्ततेचा 3-दिवसांचा कल पहा.',
        low:
          'उच्च ML पूर संकेत नाही. मानक CWC व NDMA सचेत फीडची नियमित तपासणी सुरू ठेवा.',
      },
    },
    regionalTableTitle: 'उत्तर प्रदेशातील 14 अभ्यास जिल्हे — केंद्रीय ML 3-दिवस पूर स्थिती',
    regionalTableSub:
      'सर्व 14 UP अभ्यास जिल्ह्यांसाठी एकाच केंद्रीय XGBoost इंजिनद्वारे समान अंदाज.',
    studyGroupCol: 'अभ्यास गट',
    probShortCol: '3-दिवस शक्यता',
    riskSignalCol: 'ML संकेत',
    dischargeCol: 'विसर्ग (m³/s)',
    focusDistrictBtn: 'पहा',
    regionalLoadingText: 'केंद्रीय पूर ML इंजिनद्वारे 14 UP जिल्ह्यांचे मूल्यांकन सुरू आहे...',
    loadingText: 'केंद्रीय FastAPI XGBoost पूर सेवेकडून माहिती घेत आहे...',
    askFloodBtn: 'WeatherGPT ला पूर धोका विचारा',
    verifyCwcLink: 'अधिकृत CWC पूर अंदाज पहा',
  },
};

export function getFloodDict(lang: UILanguageCode): FloodTranslationDict {
  return FLOOD_TRANSLATIONS[lang] ?? FLOOD_TRANSLATIONS.en;
}
