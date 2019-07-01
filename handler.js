'use strict';

const uuidv1 = require('uuid/v1');
const AWS = require('aws-sdk');

//const awsXRay = require('aws-xray-sdk');
//const AWS = awsXRay.captureAWS(require('aws-sdk'));

const orderMetadataManager = require('./orderMetadataManager');

var sqs = new AWS.SQS({ region: process.env.REGION });
const QUEUE_URL = process.env.PENDING_ORDER_QUEUE;

module.exports.makeOrder = (event, context, callback) => {
	console.log('makeOrder lambda is called!!');

	const body = JSON.parse(event.body);
	console.log("name: ",body.name);
	console.log("address: ",body.address);
	console.log("pizzas: ",body.pizzas);

	const order = {
		orderId: uuidv1(),
		name: body.name,
		address: body.address,
		pizzas: body.pizzas,
		timestamp: Date.now()
	};

	const params = {
		MessageBody: JSON.stringify(order),
		QueueUrl: QUEUE_URL
	};

	sqs.sendMessage(params, function(err, data) {
		if (err) {
			sendResponse(500, err, callback);
		} else {
			const message = {
				order: order,
				messageId: data.MessageId
			};
			sendResponse(200, message, callback);
		}
	});
};

module.exports.prepareOrder = (event, context, callback) => {
	console.log('prepareOrder lambda is called!!');

	const order = JSON.parse(event.Records[0].body);

	orderMetadataManager
		.saveCompletedOrder(order)
		.then(data => {
			callback();
		})
		.catch(error => {
			callback(error);
		});
};

module.exports.sendOrder = (event, context, callback) => {
	console.log('sendOrder lambda is called!!');

	const record = event.Records[0];
	if (record.eventName === 'INSERT') {
		console.log('deliverOrder');

		const orderId = record.dynamodb.Keys.orderId.S;

		orderMetadataManager
			.deliverOrder(orderId)
			.then(data => {
				console.log(data);
				callback();
			})
			.catch(error => {
				callback(error);
			});
	} else {
		console.log('is not a new record');
		callback();
	}
};

module.exports.checkOrderStatus = (event, context, callback) => {

	const orderId = event.pathParameters && event.pathParameters.orderId;
	if (orderId !== null) {
		orderMetadataManager
			.getOrder(orderId)
			.then(order => {
				sendResponse(200, `The status of the order: ${orderId} is ${order.delivery_status}`, callback);
			})
			.catch(error => {
				sendResponse(500, 'There is an error occured while processing the order', callback);
			});
	} else {
		sendResponse(400, 'The orderId is missing', callback);
	}
};

function sendResponse(statusCode, message, callback) {
	const response = {
		statusCode: statusCode,
		body: JSON.stringify(message)
	};
	callback(null, response);
}
