import {Stack, App, StackProps, CfnOutput} from 'aws-cdk-lib';
import {Database} from './database';
import {Cognito} from './cognito';
import {Microservice} from './microservice';
import {UserGroups} from './userGroups';
import {IdentityManagement} from './identityManagement';
import {S3} from './s3';
import {ApiGateway} from './apiGateway';
import {CloudWatchDashboard} from './cloudwatch';

export class EStoreStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      env: { 
        region: 'ap-southeast-1', // Singapore region
        account: process.env.CDK_DEFAULT_ACCOUNT,
      },
    });

    // Identity and Access Management
    const {
      AWSLambdaBasicExecutionRole,
      AmazonCognitoPowerUser,
      AmazonDynamoDBFullAccess,
      AmazonDynamoDBFullAccessWithSSMFullAccess,
      AmazonS3FullAccess,
    } = new IdentityManagement(this, 'IdentityManagement');

    const amazonDynamoDBFullAccess = AmazonDynamoDBFullAccess();
    const amazonDynamoDBFullAccessWithSSMFullAccess = AmazonDynamoDBFullAccessWithSSMFullAccess();
    const amazonS3FullAccess = AmazonS3FullAccess();
    const awsLambdaBasicExecutionRole = AWSLambdaBasicExecutionRole();
    const amazonCognitoPowerUser = AmazonCognitoPowerUser();

    // Cognito User Pool
    const {userPool, userPoolClient} = new Cognito(this, 'Cognito');

    // DynamoDB Tables
    const database = new Database(this, 'Database');

    // S3 Bucket for product images
    const {bucket: productImagesBucket} = new S3(this, 'S3');

    // API Gateway setup
    const api = new ApiGateway(this, 'ApiGateway');

    // User Groups and Permissions
    const userGroups = new UserGroups(
      this,
      'UserGroups',
      userPool,
      amazonDynamoDBFullAccess,
      amazonS3FullAccess,
    );

    // Microservices
    new Microservice(
      this,
      'Microservice',
      {
        userPool,
        userPoolClient,
        api,
        userGroups,
        productImagesBucket,
      },
      {
        amazonDynamoDBFullAccess,
        amazonDynamoDBFullAccessWithSSMFullAccess,
        awsLambdaBasicExecutionRole,
        amazonCognitoPowerUser,
      },
    );

    // CloudWatch Dashboard
    new CloudWatchDashboard(this, 'CloudWatchDashboard');

    // Stack Outputs
    new CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region (Singapore)',
    });
  }
}