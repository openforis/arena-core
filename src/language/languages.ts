import { LanguageCode } from './languageCode'

export const Languages: {
  [code in LanguageCode]: { [code in LanguageCode]?: string }
} = {
  [LanguageCode.ab]: { [LanguageCode.en]: 'Abkhazian' },
  [LanguageCode.aa]: { [LanguageCode.en]: 'Afar' },
  [LanguageCode.af]: { [LanguageCode.en]: 'Afrikaans' },
  [LanguageCode.ak]: { [LanguageCode.en]: 'Akan' },
  [LanguageCode.sq]: { [LanguageCode.en]: 'Albanian' },
  [LanguageCode.am]: { [LanguageCode.en]: 'Amharic' },
  [LanguageCode.ar]: { [LanguageCode.en]: 'Arabic' },
  [LanguageCode.an]: { [LanguageCode.en]: 'Aragonese' },
  [LanguageCode.hy]: { [LanguageCode.en]: 'Armenian' },
  [LanguageCode.as]: { [LanguageCode.en]: 'Assamese' },
  [LanguageCode.av]: { [LanguageCode.en]: 'Avaric' },
  [LanguageCode.ay]: { [LanguageCode.en]: 'Aymara' },
  [LanguageCode.az]: { [LanguageCode.en]: 'Azerbaijani' },
  [LanguageCode.bm]: { [LanguageCode.en]: 'Bambara' },
  [LanguageCode.ba]: { [LanguageCode.en]: 'Bashkir' },
  [LanguageCode.eu]: { [LanguageCode.en]: 'Basque' },
  [LanguageCode.be]: { [LanguageCode.en]: 'Belarusian' },
  [LanguageCode.bn]: { [LanguageCode.en]: 'Bengali' },
  [LanguageCode.bi]: { [LanguageCode.en]: 'Bislama' },
  [LanguageCode.nb]: { [LanguageCode.en]: 'Bokmål, Norwegian; Norwegian Bokmål' },
  [LanguageCode.bs]: { [LanguageCode.en]: 'Bosnian' },
  [LanguageCode.br]: { [LanguageCode.en]: 'Breton' },
  [LanguageCode.bg]: { [LanguageCode.en]: 'Bulgarian' },
  [LanguageCode.my]: { [LanguageCode.en]: 'Burmese' },
  [LanguageCode.ca]: { [LanguageCode.en]: 'Catalan; Valencian' },
  [LanguageCode.km]: { [LanguageCode.en]: 'Central Khmer' },
  [LanguageCode.ch]: { [LanguageCode.en]: 'Chamorro' },
  [LanguageCode.ce]: { [LanguageCode.en]: 'Chechen' },
  [LanguageCode.ny]: { [LanguageCode.en]: 'Chichewa; Chewa; Nyanja' },
  [LanguageCode.zh]: { [LanguageCode.en]: 'Chinese' },
  [LanguageCode.cv]: { [LanguageCode.en]: 'Chuvash' },
  [LanguageCode.kw]: { [LanguageCode.en]: 'Cornish' },
  [LanguageCode.co]: { [LanguageCode.en]: 'Corsican' },
  [LanguageCode.cr]: { [LanguageCode.en]: 'Cree' },
  [LanguageCode.hr]: { [LanguageCode.en]: 'Croatian' },
  [LanguageCode.cs]: { [LanguageCode.en]: 'Czech' },
  [LanguageCode.da]: { [LanguageCode.en]: 'Danish' },
  [LanguageCode.dv]: { [LanguageCode.en]: 'Divehi; Dhivehi; Maldivian' },
  [LanguageCode.nl]: { [LanguageCode.en]: 'Dutch; Flemish' },
  [LanguageCode.dz]: { [LanguageCode.en]: 'Dzongkha' },
  [LanguageCode.en]: { [LanguageCode.en]: 'English' },
  [LanguageCode.eo]: { [LanguageCode.en]: 'Esperanto' },
  [LanguageCode.et]: { [LanguageCode.en]: 'Estonian' },
  [LanguageCode.ee]: { [LanguageCode.en]: 'Ewe' },
  [LanguageCode.fo]: { [LanguageCode.en]: 'Faroese' },
  [LanguageCode.fj]: { [LanguageCode.en]: 'Fijian' },
  [LanguageCode.fi]: { [LanguageCode.en]: 'Finnish' },
  [LanguageCode.fr]: { [LanguageCode.en]: 'French' },
  [LanguageCode.ff]: { [LanguageCode.en]: 'Fulah' },
  [LanguageCode.gd]: { [LanguageCode.en]: 'Gaelic; Scottish Gaelic' },
  [LanguageCode.gl]: { [LanguageCode.en]: 'Galician' },
  [LanguageCode.lg]: { [LanguageCode.en]: 'Ganda' },
  [LanguageCode.ka]: { [LanguageCode.en]: 'Georgian' },
  [LanguageCode.de]: { [LanguageCode.en]: 'German' },
  [LanguageCode.el]: { [LanguageCode.en]: 'Greek, Modern (1453-)' },
  [LanguageCode.gn]: { [LanguageCode.en]: 'Guarani' },
  [LanguageCode.gu]: { [LanguageCode.en]: 'Gujarati' },
  [LanguageCode.ht]: { [LanguageCode.en]: 'Haitian; Haitian Creole' },
  [LanguageCode.ha]: { [LanguageCode.en]: 'Hausa' },
  [LanguageCode.he]: { [LanguageCode.en]: 'Hebrew' },
  [LanguageCode.hz]: { [LanguageCode.en]: 'Herero' },
  [LanguageCode.hi]: { [LanguageCode.en]: 'Hindi' },
  [LanguageCode.ho]: { [LanguageCode.en]: 'Hiri Motu' },
  [LanguageCode.hu]: { [LanguageCode.en]: 'Hungarian' },
  [LanguageCode.is]: { [LanguageCode.en]: 'Icelandic' },
  [LanguageCode.io]: { [LanguageCode.en]: 'Ido' },
  [LanguageCode.ig]: { [LanguageCode.en]: 'Igbo' },
  [LanguageCode.id]: { [LanguageCode.en]: 'Indonesian' },
  [LanguageCode.ia]: { [LanguageCode.en]: 'Interlingua (International Auxiliary Language Association)' },
  [LanguageCode.ie]: { [LanguageCode.en]: 'Interlingue; Occidental' },
  [LanguageCode.iu]: { [LanguageCode.en]: 'Inuktitut' },
  [LanguageCode.ik]: { [LanguageCode.en]: 'Inupiaq' },
  [LanguageCode.ga]: { [LanguageCode.en]: 'Irish' },
  [LanguageCode.it]: { [LanguageCode.en]: 'Italian' },
  [LanguageCode.ja]: { [LanguageCode.en]: 'Japanese' },
  [LanguageCode.jv]: { [LanguageCode.en]: 'Javanese' },
  [LanguageCode.kl]: { [LanguageCode.en]: 'Kalaallisut; Greenlandic' },
  [LanguageCode.kn]: { [LanguageCode.en]: 'Kannada' },
  [LanguageCode.kr]: { [LanguageCode.en]: 'Kanuri' },
  [LanguageCode.ks]: { [LanguageCode.en]: 'Kashmiri' },
  [LanguageCode.kk]: { [LanguageCode.en]: 'Kazakh' },
  [LanguageCode.ki]: { [LanguageCode.en]: 'Kikuyu; Gikuyu' },
  [LanguageCode.rw]: { [LanguageCode.en]: 'Kinyarwanda' },
  [LanguageCode.ky]: { [LanguageCode.en]: 'Kirghiz; Kyrgyz' },
  [LanguageCode.kv]: { [LanguageCode.en]: 'Komi' },
  [LanguageCode.kg]: { [LanguageCode.en]: 'Kongo' },
  [LanguageCode.ko]: { [LanguageCode.en]: 'Korean' },
  [LanguageCode.kj]: { [LanguageCode.en]: 'Kuanyama; Kwanyama' },
  [LanguageCode.ku]: { [LanguageCode.en]: 'Kurdish' },
  [LanguageCode.lo]: { [LanguageCode.en]: 'Lao' },
  [LanguageCode.lv]: { [LanguageCode.en]: 'Latvian' },
  [LanguageCode.li]: { [LanguageCode.en]: 'Limburgan; Limburger; Limburgish' },
  [LanguageCode.ln]: { [LanguageCode.en]: 'Lingala' },
  [LanguageCode.lt]: { [LanguageCode.en]: 'Lithuanian' },
  [LanguageCode.lu]: { [LanguageCode.en]: 'Luba-Katanga' },
  [LanguageCode.lb]: { [LanguageCode.en]: 'Luxembourgish; Letzeburgesch' },
  [LanguageCode.mk]: { [LanguageCode.en]: 'Macedonian' },
  [LanguageCode.mg]: { [LanguageCode.en]: 'Malagasy' },
  [LanguageCode.ms]: { [LanguageCode.en]: 'Malay' },
  [LanguageCode.ml]: { [LanguageCode.en]: 'Malayalam' },
  [LanguageCode.mt]: { [LanguageCode.en]: 'Maltese' },
  [LanguageCode.gv]: { [LanguageCode.en]: 'Manx' },
  [LanguageCode.mi]: { [LanguageCode.en]: 'Maori' },
  [LanguageCode.mr]: { [LanguageCode.en]: 'Marathi' },
  [LanguageCode.mh]: { [LanguageCode.en]: 'Marshallese' },
  [LanguageCode.mn]: { [LanguageCode.en]: 'Mongolian' },
  [LanguageCode.na]: { [LanguageCode.en]: 'Nauru' },
  [LanguageCode.nv]: { [LanguageCode.en]: 'Navajo; Navaho' },
  [LanguageCode.nd]: { [LanguageCode.en]: 'Ndebele, North; North Ndebele' },
  [LanguageCode.nr]: { [LanguageCode.en]: 'Ndebele, South; South Ndebele' },
  [LanguageCode.ng]: { [LanguageCode.en]: 'Ndonga' },
  [LanguageCode.ne]: { [LanguageCode.en]: 'Nepali' },
  [LanguageCode.se]: { [LanguageCode.en]: 'Northern Sami' },
  [LanguageCode.no]: { [LanguageCode.en]: 'Norwegian' },
  [LanguageCode.nn]: { [LanguageCode.en]: 'Norwegian Nynorsk; Nynorsk, Norwegian' },
  [LanguageCode.oc]: { [LanguageCode.en]: 'Occitan (post 1500); Provençal' },
  [LanguageCode.oj]: { [LanguageCode.en]: 'Ojibwa' },
  [LanguageCode.or]: { [LanguageCode.en]: 'Oriya' },
  [LanguageCode.om]: { [LanguageCode.en]: 'Oromo' },
  [LanguageCode.os]: { [LanguageCode.en]: 'Ossetian; Ossetic' },
  [LanguageCode.pa]: { [LanguageCode.en]: 'Panjabi; Punjabi' },
  [LanguageCode.fa]: { [LanguageCode.en]: 'Persian' },
  [LanguageCode.pl]: { [LanguageCode.en]: 'Polish' },
  [LanguageCode.pt]: { [LanguageCode.en]: 'Portuguese' },
  [LanguageCode.ps]: { [LanguageCode.en]: 'Pushto; Pashto' },
  [LanguageCode.qu]: { [LanguageCode.en]: 'Quechua' },
  [LanguageCode.ro]: { [LanguageCode.en]: 'Romanian; Moldavian; Moldovan' },
  [LanguageCode.rm]: { [LanguageCode.en]: 'Romansh' },
  [LanguageCode.rn]: { [LanguageCode.en]: 'Rundi' },
  [LanguageCode.ru]: { [LanguageCode.en]: 'Russian' },
  [LanguageCode.sm]: { [LanguageCode.en]: 'Samoan' },
  [LanguageCode.sg]: { [LanguageCode.en]: 'Sango' },
  [LanguageCode.sc]: { [LanguageCode.en]: 'Sardinian' },
  [LanguageCode.sr]: { [LanguageCode.en]: 'Serbian' },
  [LanguageCode.sn]: { [LanguageCode.en]: 'Shona' },
  [LanguageCode.ii]: { [LanguageCode.en]: 'Sichuan Yi; Nuosu' },
  [LanguageCode.sd]: { [LanguageCode.en]: 'Sindhi' },
  [LanguageCode.si]: { [LanguageCode.en]: 'Sinhala; Sinhalese' },
  [LanguageCode.sk]: { [LanguageCode.en]: 'Slovak' },
  [LanguageCode.sl]: { [LanguageCode.en]: 'Slovenian' },
  [LanguageCode.so]: { [LanguageCode.en]: 'Somali' },
  [LanguageCode.st]: { [LanguageCode.en]: 'Sotho, Southern' },
  [LanguageCode.es]: { [LanguageCode.en]: 'Spanish; Castilian' },
  [LanguageCode.su]: { [LanguageCode.en]: 'Sundanese' },
  [LanguageCode.sw]: { [LanguageCode.en]: 'Swahili' },
  [LanguageCode.ss]: { [LanguageCode.en]: 'Swati' },
  [LanguageCode.sv]: { [LanguageCode.en]: 'Swedish' },
  [LanguageCode.tl]: { [LanguageCode.en]: 'Tagalog' },
  [LanguageCode.ty]: { [LanguageCode.en]: 'Tahitian' },
  [LanguageCode.tg]: { [LanguageCode.en]: 'Tajik' },
  [LanguageCode.ta]: { [LanguageCode.en]: 'Tamil' },
  [LanguageCode.tt]: { [LanguageCode.en]: 'Tatar' },
  [LanguageCode.te]: { [LanguageCode.en]: 'Telugu' },
  [LanguageCode.th]: { [LanguageCode.en]: 'Thai' },
  [LanguageCode.bo]: { [LanguageCode.en]: 'Tibetan' },
  [LanguageCode.ti]: { [LanguageCode.en]: 'Tigrinya' },
  [LanguageCode.to]: { [LanguageCode.en]: 'Tonga (Tonga Islands)' },
  [LanguageCode.ts]: { [LanguageCode.en]: 'Tsonga' },
  [LanguageCode.tn]: { [LanguageCode.en]: 'Tswana' },
  [LanguageCode.tr]: { [LanguageCode.en]: 'Turkish' },
  [LanguageCode.tk]: { [LanguageCode.en]: 'Turkmen' },
  [LanguageCode.tw]: { [LanguageCode.en]: 'Twi' },
  [LanguageCode.ug]: { [LanguageCode.en]: 'Uighur; Uyghur' },
  [LanguageCode.uk]: { [LanguageCode.en]: 'Ukrainian' },
  [LanguageCode.ur]: { [LanguageCode.en]: 'Urdu' },
  [LanguageCode.uz]: { [LanguageCode.en]: 'Uzbek' },
  [LanguageCode.ve]: { [LanguageCode.en]: 'Venda' },
  [LanguageCode.vi]: { [LanguageCode.en]: 'Vietnamese' },
  [LanguageCode.vo]: { [LanguageCode.en]: 'Volapük' },
  [LanguageCode.wa]: { [LanguageCode.en]: 'Walloon' },
  [LanguageCode.cy]: { [LanguageCode.en]: 'Welsh' },
  [LanguageCode.fy]: { [LanguageCode.en]: 'Western Frisian' },
  [LanguageCode.wo]: { [LanguageCode.en]: 'Wolof' },
  [LanguageCode.xh]: { [LanguageCode.en]: 'Xhosa' },
  [LanguageCode.yi]: { [LanguageCode.en]: 'Yiddish' },
  [LanguageCode.yo]: { [LanguageCode.en]: 'Yoruba' },
  [LanguageCode.za]: { [LanguageCode.en]: 'Zhuang; Chuang' },
  [LanguageCode.zu]: { [LanguageCode.en]: 'Zulu' },
}
