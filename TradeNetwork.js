/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// This is a simple sample that will demonstrate how to use the
// API connecting to a HyperLedger Blockchain Fabric
//
// The scenario here is using a simple model of a participant of 'Trader'


'use strict';


const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const Table = require('cli-table');
const winston = require('winston');
let config = require('config').get('trade-network');
// const mqlight = require('mqlight');
const prettyjson = require('prettyjson');

// these are the credentials to use to connect to the Hyperledger Fabric
let cardname = config.get('cardname');

const LOG = winston.loggers.get('application');



/** Class for the Commodity registry*/
class TradeNetwork {

  /**
   * Need to have the mapping from bizNetwork name to the URLs to connect to.
   * bizNetwork nawme will be able to be used by Composer to get the suitable model files.
   *
   */
    constructor() {

        this.bizNetworkConnection = new BusinessNetworkConnection();
     
    }

  /** @description Initalizes the ComodityRegistry by making a connection to the Composer runtime
   * @return {Promise} A promise whose fullfillment means the initialization has completed
   */
    init() {

        return this.bizNetworkConnection.connect(cardname)
      .then((result) => {
          this.businessNetworkDefinition = result;
          LOG.info('trade network:<init>', 'businessNetworkDefinition obtained', this.businessNetworkDefinition.getIdentifier());
      })

      // and catch any exceptions that are triggered
      .catch(function (error) {
          throw error;
      });

    }

    /** Listen for the sale transaction events

     */
     listen(){
       this.bizNetworkConnection.on('event',(evt)=>{
         console.log(chalk.blue.bold('New Event'));
         console.log(evt);

         let options = {
           properties: { key:'value'}
         };
        //  let text = evt.title['$identifier'];
        //  console.log('Sending ' +text);
        //  this.sendClient.send('digitalproperty-network/sale', text, options,function (err, topic,data,options) {
        //          console.log('Topic: %s', topic);
        //          console.log('Data: %s', data);
        //  		      console.log('Options: %s', JSON.stringify(options));
        //           console.log(err);
         //
        //        });

       });
     }

  /** Updates a fixes asset for selling..
  @return {Promise} resolved when this update has compelted
  */
    updateForSale() {
        const METHOD = 'updateForSale';


        return this.bizNetworkConnection.getAssetRegistry('org.acme.trading.Commodity')
      .then((registry) => {

          LOG.info(METHOD, 'Getting assest from the registry.');
          return registry.get('tradingSymbol:1148');

      }).then((result) => {

	      let factory        = this.businessNetworkDefinition.getFactory();
	      let transaction    = factory.newTransaction('org.acme.trading','Trade');
		  transaction.oldOwner  = factory.newRelationship('org.acme.trading', 'Trader', 'tradeId:1234567890');
		  transaction.newOwner = factory.newRelationship('org.acme.trading', 'Trader', '9900');
          transaction.commodity = factory.newRelationship('org.acme.trading', 'Commodity', 'tradingSymbol:6789');
          LOG.info(METHOD, 'Submitting transaction');

          return this.bizNetworkConnection.submitTransaction(transaction);
      }) // and catch any exceptions that are triggered
      .catch(function (error) {
          LOG.error('TradeNetwork:updateForSale', error);
          throw error;
      });
    }

  /** bootstrap into the resgitry a few example Commodity
    * @return {Promise} resolved when the assests have been created

  */
    _bootstrapTitles() {
        LOG.info('TradeNetwork', 'getting asset registry for "org.acme.trading.Commodity"');
        let owner;
        LOG.info('about to get asset registry');
        return this.bizNetworkConnection.getAssetRegistry('org.acme.trading.Commodity') // how do I know what this name is?

    .then((result) => {
        // got the assest registry for commodity
        LOG.info('TradeNetwork', 'got asset registry');
        this.titlesRegistry = result;
    }).then(() => {
        LOG.info('TradeNetwork', 'getting factory and adding assets');
        let factory = this.businessNetworkDefinition.getFactory();

        LOG.info('TradeNetwork', 'Creating a person');
        owner = factory.newResource('org.acme.trading', 'Trader', 'tradeId:1234567890');
        owner.firstName = 'Mostafa';
        owner.lastName = 'Ahmed';
        owner.address = 'Cairo'
        owner.accountBalance=78628


        /** Create a new relationship for the owner */
        let ownerRelation = factory.newRelationship('org.acme.trading', 'Trader', 'tradeId:1234567890');

        LOG.info('TradeNetwork', 'Creating a Commodity#1');
        let commodity1 = factory.newResource('org.acme.trading', 'Commodity', 'tradingSymbol:1148');
        commodity1.owner = ownerRelation;
        commodity1.description = 'A nice house in the country';
        commodity1.mainExchange ='main exchange 1'
        commodity1.quantity =12
        commodity1.totalPrice=1000
        commodity1.status= 'CREATED'
        LOG.info('TradeNetwork', 'Creating a Commodity #2');
        let commodity2 = factory.newResource('org.acme.trading', 'Commodity', 'tradingSymbol:6789');
        commodity2.owner = ownerRelation;
        commodity2.description = 'A small flat in the city';
        commodity2.mainExchange ='main exchange 2'
        commodity2.quantity =14
        commodity2.totalPrice=900
        commodity2.status= 'CREATED'
        LOG.info('TradeNetwork', 'Adding these to the registry');
        return this.titlesRegistry.addAll([commodity1, commodity2]);

    }).then(() => {
        return this.bizNetworkConnection.getParticipantRegistry('org.acme.trading.Trader');
    })
      .then((personRegistry) => {
          return personRegistry.add(owner);
      }) // and catch any exceptions that are triggered
      .catch(function (error) {
          console.log(error);
          LOG.error('TradeNetwork:_bootstrapTitles', error);
          throw error;
      });

    }

  /**
   * List the TradeNetwork Asset that are stored in the TradeNetwork Asset Resgitry
   * @return {Promise} resolved when fullfiled will have listed out the titles to stdout
   */
    listComidity() {
        const METHOD = 'listComidity';

        let commodityRegistry;
        let traderRegistry;

        LOG.info(METHOD, 'Getting the asset registry');
    // get the Commodity registry and then get all the files.
        return this.bizNetworkConnection.getAssetRegistry('org.acme.trading.Commodity')
      .then((registry) => {
          commodityRegistry = registry;

          return this.bizNetworkConnection.getParticipantRegistry('org.acme.trading.Trader');
        }).then((registry)  => {
          traderRegistry = registry;

          LOG.info(METHOD, 'Getting all assest from the registry.');
          return commodityRegistry.resolveAll();

        })

    .then((aResources) => {

        LOG.info(METHOD, 'Current Commodity');
      // instantiate
        let table = new Table({
            head: ['Commodity ID', 'Main Exchange ', 'Owner First Name', 'Owner Surname', 'Description', 'Total Price' , 'Quantity' ,'Status']
        });
        let arrayLength = aResources.length;
        for(let i = 0; i < arrayLength; i++) {



 

            let tableLine = [];

            tableLine.push(aResources[i].tradingSymbol);
            tableLine.push(aResources[i].mainExchange);
            tableLine.push(aResources[i].owner.firstName);
            tableLine.push(aResources[i].owner.lastName);
            tableLine.push(aResources[i].description);
            tableLine.push(aResources[i].totalPrice);
            tableLine.push(aResources[i].quantity);
            tableLine.push(aResources[i].status);
            table.push(tableLine);
        }

      // Put to stdout - as this is really a command line app
        return(table);
    })


    // and catch any exceptions that are triggered
    .catch(function (error) {
        console.log(error);
      /* potentially some code for generating an error specific message here */
        this.log.error(METHOD, 'uh-oh', error);
    });

    }

  /**
   * @description - run the listtiles command
   * @param {Object} args passed from the command line
   * @return {Promise} resolved when the action is complete
   */
    static listCmd(args) {

        let lr = new TradeNetwork('Commodity');


        return lr.init()
    .then(() => {
        return lr.listComidity();
    })

    .then((results) => {
        LOG.info('Commodity listed');
        LOG.info('\n'+results.toString());
    })
      .catch(function (error) {
        /* potentially some code for generating an error specific message here */
          throw error;
      });
    }

    /**
     * @description - run the listtiles command
     * @param {Object} args passed from the command line
     * @return {Promise} resolved when the action is complete
     */
      static listen(args) {
        let lr = new TradeNetwork('Commodity');
        return lr.init()
        .then(() => {

            // lr.sendClient = mqlight.createClient({service: 'amqp://127.0.0.1'});
            // lr.sendClient.on('started', ()=> {
            //   console.log('MQlight started');
            //   return lr.listen();
            // });



         })
        .catch(function (error) {
          /* potentially some code for generating an error specific message here */
            throw error;
         });
      }

  /**
   * @description - run the add default assets command
   * @param {Object} args passed from the command line
   * @return {Promise} resolved when complete
   */
    static addDefaultCmd(args) {

        let lr = new TradeNetwork('Commodity');


        return lr.init()

    .then(() => {
        return lr._bootstrapTitles();
    })

    .then((results) => {
        LOG.info('Default Commodity added');
    })
      .catch(function (error) {
        /* potentially some code for generating an error specific message here */
          throw error;
      });
    }

  /**
   * @description - run the listtiles command
   * @param {Object} args passed from the command line
   * @return {Promise} resolved when the action is complete
   */
    static submitCmd(args) {

        let lr = new TradeNetwork('Commodity');


        return lr.init()

    .then(() => {
        return lr.updateForSale();
    })

    .then((results) => {
        LOG.info('Transaction Submitted');
    })
      .catch(function (error) {
        /* potentially some code for generating an error specific message here */
          throw error;
      });
    }
}
module.exports = TradeNetwork;
//TradeNetwork.listCmd();

//TradeNetwork.submitCmd();
TradeNetwork.addDefaultCmd();



