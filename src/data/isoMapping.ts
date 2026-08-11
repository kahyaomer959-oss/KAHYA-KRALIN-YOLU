// ISO 3166-1 Numeric to Country Code Mapping for World Map GeoJSON
export const ISO_NUMERIC_TO_CODE: Record<string, string> = {
  '792': 'tr', // Turkey
  '031': 'az', // Azerbaijan
  '276': 'de', // Germany
  '826': 'gb', // United Kingdom
  '840': 'us', // United States
  '392': 'jp', // Japan
  '250': 'fr', // France
  '380': 'it', // Italy
  '724': 'es', // Spain
  '643': 'ru', // Russia
  '156': 'cn', // China
  '076': 'br', // Brazil
  '124': 'ca', // Canada
  '410': 'kr', // South Korea
  '682': 'sa', // Saudi Arabia
  '818': 'eg', // Egypt
  '300': 'gr', // Greece
  '356': 'in', // India
  '528': 'nl', // Netherlands
  '376': 'il', // Israel
  '364': 'ir', // Iran
  '368': 'iq', // Iraq
  '634': 'qa', // Qatar
  '784': 'ae', // UAE
  '586': 'pk', // Pakistan
  '360': 'id', // Indonesia
  '804': 'ua', // Ukraine
  '616': 'pl', // Poland
  '036': 'au', // Australia
  '414': 'kw', // Kuwait
  '512': 'om', // Oman
  '048': 'bh', // Bahrain
  '400': 'jo', // Jordan
  '422': 'lb', // Lebanon
  '275': 'ps', // Palestine
  '760': 'sy', // Syria
  '434': 'ly', // Libya
  '729': 'sd', // Sudan
  '887': 'ye', // Yemen
  '478': 'mr', // Mauritania
  '706': 'so', // Somalia
  '262': 'dj', // Djibouti
  '174': 'km', // Comoros
  '012': 'dz', // Algeria
  '788': 'tn', // Tunisia
  '504': 'ma', // Morocco
  '710': 'za', // South Africa
  '566': 'ng', // Nigeria
  '484': 'mx', // Mexico
  '032': 'ar', // Argentina
  '408': 'kp', // North Korea
  '398': 'kz', // Kazakhstan
  '860': 'uz', // Uzbekistan
  '795': 'tm', // Turkmenistan
  '417': 'kg', // Kyrgyzstan
  '762': 'tj', // Tajikistan
  '268': 'ge', // Georgia
  '051': 'am', // Armenia
  '752': 'se', // Sweden
  '246': 'fi', // Finland
  '578': 'no', // Norway
  '056': 'be', // Belgium
  '756': 'ch', // Switzerland
  '040': 'at', // Austria
  '620': 'pt', // Portugal
  '203': 'cz', // Czech Republic
  '642': 'ro', // Romania
  '348': 'hu', // Hungary
  '100': 'bg', // Bulgaria
  '688': 'rs', // Serbia
  '158': 'tw', // Taiwan
  '704': 'vn', // Vietnam
  '764': 'th', // Thailand
  '458': 'my', // Malaysia
  '608': 'ph', // Philippines
  '702': 'sg', // Singapore
  '496': 'mn', // Mongolia
  '352': 'is', // Iceland
  '372': 'ie', // Ireland
  '196': 'cy', // Cyprus
  '554': 'nz', // New Zealand
  // Additional World Countries
  '170': 'co', // Colombia
  '604': 'pe', // Peru
  '152': 'cl', // Chile
  '862': 've', // Venezuela
  '218': 'ec', // Ecuador
  '068': 'bo', // Bolivia
  '600': 'py', // Paraguay
  '858': 'uy', // Uruguay
  '192': 'cu', // Cuba
  '214': 'do', // Dominican Rep.
  '320': 'gt', // Guatemala
  '340': 'hn', // Honduras
  '222': 'sv', // El Salvador
  '558': 'ni', // Nicaragua
  '188': 'cr', // Costa Rica
  '591': 'pa', // Panama
  '208': 'dk', // Denmark
  '191': 'hr', // Croatia
  '008': 'al', // Albania
  '070': 'ba', // Bosnia
  '807': 'mk', // North Macedonia
  '499': 'me', // Montenegro
  '498': 'md', // Moldova
  '112': 'by', // Belarus
  '440': 'lt', // Lithuania
  '428': 'lv', // Latvia
  '233': 'ee', // Estonia
  '703': 'sk', // Slovakia
  '705': 'si', // Slovenia
  '231': 'et', // Ethiopia
  '404': 'ke', // Kenya
  '834': 'tz', // Tanzania
  '800': 'ug', // Uganda
  '288': 'gh', // Ghana
  '384': 'ci', // Ivory Coast
  '686': 'sn', // Senegal
  '120': 'cm', // Cameroon
  '024': 'ao', // Angola
  '180': 'cd', // DR Congo
  '178': 'cg', // Rep. Congo
  '894': 'zm', // Zambia
  '716': 'zw', // Zimbabwe
  '508': 'mz', // Mozambique
  '450': 'mg', // Madagascar
  '466': 'ml', // Mali
  '562': 'ne', // Niger
  '148': 'td', // Chad
  '104': 'mm', // Myanmar
  '116': 'kh', // Cambodia
  '418': 'la', // Laos
  '050': 'bd', // Bangladesh
  '144': 'lk', // Sri Lanka
  '524': 'np', // Nepal
  '004': 'af', // Afghanistan
  '598': 'pg', // Papua New Guinea
  '242': 'fj', // Fiji
  '442': 'lu', // Luxembourg
  '470': 'mt', // Malta
  '492': 'mc', // Monaco
  '020': 'ad', // Andorra
  '674': 'sm', // San Marino
  '438': 'li', // Liechtenstein
  '328': 'gy', // Guyana
  '740': 'sr', // Suriname
  '084': 'bz', // Belize
  '044': 'bs', // Bahamas
  '388': 'jm', // Jamaica
  '332': 'ht', // Haiti
  '780': 'tt', // Trinidad and Tobago
  '052': 'bb', // Barbados
  '204': 'bj', // Benin
  '768': 'tg', // Togo
  '854': 'bf', // Burkina Faso
  '324': 'gn', // Guinea
  '624': 'gw', // Guinea-Bissau
  '430': 'lr', // Liberia
  '694': 'sl', // Sierra Leone
  '270': 'gm', // Gambia
  '226': 'gq', // Equatorial Guinea
  '266': 'ga', // Gabon
  '646': 'rw', // Rwanda
  '108': 'bi', // Burundi
  '232': 'er', // Eritrea
  '728': 'ss', // South Sudan
  '748': 'sz', // Eswatini
  '426': 'ls', // Lesotho
  '516': 'na', // Namibia
  '072': 'bw', // Botswana
  '454': 'mw', // Malawi
  '690': 'sc', // Seychelles
  '480': 'mu', // Mauritius
  '462': 'mv', // Maldives
  '064': 'bt', // Bhutan
  '096': 'bn', // Brunei
  '626': 'tl', // East Timor
  '548': 'vu', // Vanuatu
  '882': 'ws', // Samoa
  '776': 'to', // Tonga
  '090': 'sb', // Solomon Islands
  '140': 'cf', // Central African Republic
  '132': 'cv', // Cape Verde
  '678': 'st', // Sao Tome and Principe
  '336': 'va', // Vatican City
  '028': 'ag', // Antigua and Barbuda
  '212': 'dm', // Dominica
  '308': 'gd', // Grenada
  '659': 'kn', // Saint Kitts and Nevis
  '662': 'lc', // Saint Lucia
  '670': 'vc', // Saint Vincent and Grenadinler
  '296': 'ki', // Kiribati
  '584': 'mh', // Marshall Islands
  '583': 'fm', // Micronesia
  '520': 'nr', // Nauru
  '585': 'pw', // Palau
  '798': 'tv', // Tuvalu
};

export function getCodeFromIsoNumeric(iso: string | number): string {
  const numericStr = String(iso).padStart(3, '0');
  return ISO_NUMERIC_TO_CODE[numericStr] || 'other';
}
