# ServerlessMonitoring using AWS X-Ray service
This is the sample serverless application using AWS services and deployed on AWS. XRay service is used as monitoring tool provided by AWS to monitor serverless architecture applications.

This is a simple serverless application which serves two purpose.
- Create order using a POST request
- Check the status of order using GET request

This application has following components
- Lambda functions
  - makeOrder: For creating an order request using POST, this function generates an orderId and push this order request in a SQS. Generated orderId will be send back to client
  - prepareOrder: This lambda will be trigger whenever any message is put in SQS, put order in DynamoDB table. Order status is also changed to "Ready for delivery"
  - sendOrder: This lambda will trigger when a new document will created in DynamoDB (event) and it update the status of order to "Delivered" in DynamoDB
  - checkOrderStatus: This lambda will check the current status of the order by quering in the DynamoDB using OrderId
- DynamoDB: A table will be created for storing the orders details
- Simple Queue Service (SQS): For storing the orders details for implementing async flow

For monitoring serverless application, I have used the AWS X-Ray service and for that I have used the [serverless-plugin-tracing](https://www.npmjs.com/package/serverless-plugin-tracing) plugin. 

To install plugin in your application
  
  `npm install --save-dev serverless-plugin-tracing`
  
To use this plugin for monitoring, you need to enable capturing traces in the code as well:
  
  `const awsXRay = require('aws-xray-sdk');  
  const awsSdk = awsXRay.captureAWS(require('aws-sdk'));`

The plugin only controls the checkbox that be viewed in AWS Console: 
*go to AWS Lambda -> select a Lambda function -> Configuration tab -> Advanced settings -> "Enable active tracing"*
If tracing ends up being true for a function, the checkbox will be checked for that function.
