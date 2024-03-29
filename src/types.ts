type Position = {
  assetName: string,
  percentage: number,
  contractAddress: string,
  codeHash: string,
  geckoApiId: string,
  decimals: number,
  viewingKey?: string,
}

type Config = {
  node: string,
  chainId: string,
  geckoApiURL: string,
  geckoApiKey: string,
  userAddress: string,
  tollerancePercent: number,
  inventoryCsvLocation: string,
  journalCsvLocation: string,
  positions: Position[],
}

type ImbalancedPosition = {
  positionsWithValue: {
    position: Position,
    value: number,
    price: number,
  }[],
  overTarget: {
    position: Position,
    dollarsOver: number,
    price: number,
  }[],
  underTarget: {
    position: Position,
    dollarsUnder: number,
    price: number,
  }[],
}

type JournalEntry = {
  date: Date,
  entrys: {
    account: string,
    debit?: number,
    credit?: number,
    price: number,
    amount: number,
  }[],
}

type Inventory = {
  [assetName: string]: {
    [price: string]: {
      amount: number,
      price: number,
    }
  }
}

export {
  Config,
  ImbalancedPosition,
  JournalEntry,
  Inventory,
}
