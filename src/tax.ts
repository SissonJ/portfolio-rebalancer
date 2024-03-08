import  rebalencerConfig from '../rebalancerConfig.json' assert { type: "json" };

import papaparse from "papaparse";
import {Inventory, JournalEntry} from "./types";

async function calculateAndRecordTransactions(journalEntrys: JournalEntry[]) {
  const inventoryCsv: Inventory = await papaparse.parse(rebalencerConfig.inventoryCsvLocation);
  journalEntrys.forEach((entry, index) => {
    let creditEntry = entry.entrys.find((nextEntry) => nextEntry.credit !== undefined);
    let tempSellAmount = creditEntry?.amount ?? 0;
    const assetPrices = Object.keys(inventoryCsv[creditEntry?.account ?? ''])
      .map((nextPrice) => Number(nextPrice))
      .sort((a, b) => b - a );
    let whileIndex = 0;
    let costBasis = 0;
    while(tempSellAmount > 0) {
      const inventoryItem = inventoryCsv[creditEntry?.account ?? ''][String(assetPrices[whileIndex])]
      if(inventoryItem.amount === tempSellAmount) {
      }
      if(inventoryItem.amount > tempSellAmount) {
      }
      if(inventoryItem.amount < tempSellAmount) {
      }

      whileIndex ++;
    }
  });
}

export {
  calculateAndRecordTransactions
};
