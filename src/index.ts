import  rebalencerConfig from '../rebalancerConfig.json' assert { type: "json" };

import { SecretNetworkClient } from 'secretjs';
import { Config, ImbalancedPosition } from './types';

const config = rebalencerConfig as Config

const client = new SecretNetworkClient({
  url: config.node,
  chainId: config.chainId,
});

const options = {method: 'GET', headers: {'x-cg-demo-api-key': config.geckoApiKey}};

const imbalancedPosition: ImbalancedPosition = { 
  positionsWithValue: [],
  overTarget: [], 
  underTarget: [] 
};
const actions: string[] = [];
let positionTotalValue = 0;
let percentageTally = 0;
async function main() {
  for(let i = 0; i < config.positions.length; i++) {
    const currentPosition = config.positions[i];
    console.log("Querying for ", currentPosition.assetName);
    percentageTally += currentPosition.percentage;
    const price = await fetch(
      `${config.geckoApiURL}?ids=${currentPosition.geckoApiId}&vs_currencies=usd`, 
      options
    ).then((response) => response.json());
    const balance = await client.query.snip20.getBalance({
      contract: {
        address: currentPosition.contractAddress,
        code_hash: currentPosition.codeHash,
      },
      address: config.userAddress,
      auth: {
        key: currentPosition.viewingKey
      }
    });
    const assetBalance = Number(balance.balance.amount) / Math.pow(10, currentPosition.decimals);
    const assetPrice = Number(price[currentPosition.geckoApiId].usd);
    imbalancedPosition.positionsWithValue.push({
      position: currentPosition,
      value: assetPrice * assetBalance,
      price: assetPrice,
    });
    positionTotalValue += assetPrice * assetBalance;
  }
  if(percentageTally !== 100) {
    throw new Error('Percentage not equal to 100');
  }
  for(let i = 0; i < imbalancedPosition.positionsWithValue.length; i++) {
    const currentImbalancedPosition = imbalancedPosition.positionsWithValue[i];
    const targetValue = positionTotalValue * currentImbalancedPosition.position.percentage / 100;
    const toleranceAmount = targetValue * config.tollerancePercent / 100;
    if(currentImbalancedPosition.value > targetValue + toleranceAmount
       || currentImbalancedPosition.value < targetValue - toleranceAmount
      ) {
      if(currentImbalancedPosition.value > targetValue + toleranceAmount) {
        imbalancedPosition.overTarget.push({
          position: currentImbalancedPosition.position,
          dollarsOver: currentImbalancedPosition.value - targetValue,
          price: currentImbalancedPosition.price,
        });
      }
      if(currentImbalancedPosition.value < targetValue - toleranceAmount) {
        imbalancedPosition.underTarget.push({
          position: currentImbalancedPosition.position,
          dollarsUnder: targetValue - currentImbalancedPosition.value,
          price: currentImbalancedPosition.price,
        });
      }
    }
  }
  console.log(imbalancedPosition);
  for(let i = 0; i < imbalancedPosition.overTarget.length; i++) {
    const currentOverTarget = imbalancedPosition.overTarget[i];
    let positionOverTargetValue = Math.round(currentOverTarget.dollarsOver);
    for(let j = 0; j < imbalancedPosition.underTarget.length; j++) {
      const currentUnderTarget = imbalancedPosition.underTarget[j];
      const positionUnderTargetValue = Math.round(currentUnderTarget.dollarsUnder);
      console.log(positionUnderTargetValue, positionOverTargetValue);
      if( positionOverTargetValue > 0) {
        if(positionOverTargetValue === positionUnderTargetValue) {
          const sellAmount = Math.round(
            positionOverTargetValue / currentOverTarget.price * Math.pow(10, currentOverTarget.position.decimals)
          )/Math.pow(10, currentOverTarget.position.decimals);
          const buyAmount = Math.round(
            positionUnderTargetValue / currentUnderTarget.price * Math.pow(10, currentUnderTarget.position.decimals)
          )/Math.pow(10, currentUnderTarget.position.decimals);
          actions.push(
            `Sell ${sellAmount} ${currentOverTarget.position.assetName} for ${buyAmount} ${currentUnderTarget.position.assetName}`
          );
          imbalancedPosition.underTarget[j].dollarsUnder = 0;
          positionOverTargetValue = 0;
        } else if(positionOverTargetValue > positionUnderTargetValue) {
          const sellAmount = Math.round(
            (positionOverTargetValue - positionUnderTargetValue) / currentOverTarget.price * Math.pow(10, currentOverTarget.position.decimals)
          )/Math.pow(10, currentOverTarget.position.decimals);
          const buyAmount = Math.round(
            positionUnderTargetValue / currentUnderTarget.price * Math.pow(10, currentUnderTarget.position.decimals)
          )/Math.pow(10, currentUnderTarget.position.decimals);
          actions.push(
            `Sell ${sellAmount} ${currentOverTarget.position.assetName} for ${buyAmount} ${currentUnderTarget.position.assetName}`
          );
          imbalancedPosition.underTarget[j].dollarsUnder = 0;
          positionOverTargetValue -= positionUnderTargetValue;
        } else if(positionOverTargetValue < positionUnderTargetValue) {
          const sellAmount = Math.round(
            positionOverTargetValue  / currentOverTarget.price * Math.pow(10, currentOverTarget.position.decimals)
          )/Math.pow(10, currentOverTarget.position.decimals);
          const buyAmount = Math.round(
            positionOverTargetValue / currentUnderTarget.price * Math.pow(10, currentUnderTarget.position.decimals)
          )/Math.pow(10, currentUnderTarget.position.decimals);
          actions.push(
            `Sell ${sellAmount} ${currentOverTarget.position.assetName} for ${buyAmount} ${currentUnderTarget.position.assetName}`
          );
          imbalancedPosition.underTarget[j].dollarsUnder -= positionOverTargetValue;
          positionOverTargetValue = 0;
        }
      }
    }
  }
  console.log(actions);
}

main().then(() => { console.log('Finished!') });
