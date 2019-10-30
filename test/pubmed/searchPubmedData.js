export default {
  
  "undefined_term": {
    "header": {
      "type": "esearch",
      "version": "0.3"
    },
    "esearchresult": {
      "ERROR": "Empty term and query_key - nothing todo"
    }
  },

  "empty_term": {
    "header": {
      "type": "esearch",
      "version": "0.3"
    },
    "esearchresult": {
      "count": "0",
      "retmax": "0",
      "retstart": "0",
      "querykey": "1",
      "webenv": "NCID_1_108897549_130.14.18.48_9001_1572460137_1278172449_0MetA0_S_MegaStore",
      "idlist": [
      ],
      "translationset": [
      ],
      "querytranslation": "(''[All Fields])",
      "errorlist": {
        "phrasesnotfound": [
          "''"
        ],
        "fieldsnotfound": [
        ]
      },
      "warninglist": {
        "phrasesignored": [
        ],
        "quotedphrasesnotfound": [
        ],
        "outputmessages": [
          "No items found."
        ]
      }
    }
  },

  "unique_result": {
    "header": {
      "type": "esearch",
      "version": "0.3"
    },
    "esearchresult": {
      "count": "1",
      "retmax": "1",
      "retstart": "0",
      "querykey": "1",
      "webenv": "NCID_1_109057525_130.14.22.76_9001_1572460357_1321674198_0MetA0_S_MegaStore",
      "idlist": [
        "29440426"
      ],
      "translationset": [
      ],
      "translationstack": [
        {
          "term": "29440426[UID]",
          "field": "UID",
          "count": "-1",
          "explode": "N"
        },
        "GROUP"
      ],
      "querytranslation": "29440426[UID]"
    }
  },

  "nonunique_result": {
    "header": {
      "type": "esearch",
      "version": "0.3"
    },
    "esearchresult": {
      "count": "97451",
      "retmax": "20",
      "retstart": "0",
      "querykey": "1",
      "webenv": "NCID_1_187829384_130.14.22.33_9001_1572460399_412420505_0MetA0_S_MegaStore",
      "idlist": [
        "31661692",
        "31661126",
        "31659693",
        "31659281",
        "31659245",
        "31659152",
        "31659107",
        "31658995",
        "31658727",
        "31658318",
        "31657880",
        "31657556",
        "31657162",
        "31657074",
        "31656929",
        "31656277",
        "31656084",
        "31656006",
        "31655998",
        "31655030"
      ],
      "translationset": [
      ],
      "translationstack": [
        {
          "term": "p53[All Fields]",
          "field": "All Fields",
          "count": "97452",
          "explode": "N"
        },
        "GROUP"
      ],
      "querytranslation": "p53[All Fields]"
    }
  }
}