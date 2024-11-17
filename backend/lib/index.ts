import {Stack, App, StackProps, CfnOutput} from 'aws-cdk-lib';
import {Database} from './database';
import {Cognito} from './cognito';
import {Microservice} from './microservice';
import {UserGroups} from './userGroups';
import {IdentityManagement} from './identityManagement';
import {S3} from './s3';
import {ApiGateway} from './apiGateway';
import {CloudWatchDashboard} from './cloudwatch';

export class CdkStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const {
      AWSLambdaBasicExecutionRole,
      AmazonCognitoPowerUser,
      AmazonDynamoDBFullAccess,
      AmazonDynamoDBFullAccessWithSSMFullAccess,
      AmazonS3FullAccess,
    } = new IdentityManagement(this, 'IdentityManagement');

    const amazonDynamoDBFullAccess = AmazonDynamoDBFullAccess();
    const amazonDynamoDBFullAccessWithSSMFullAccess =
      AmazonDynamoDBFullAccessWithSSMFullAccess();
    const amazonS3FullAccess = AmazonS3FullAccess();
    const awsLambdaBasicExecutionRole = AWSLambdaBasicExecutionRole();
    const amazonCognitoPowerUser = AmazonCognitoPowerUser();

    // create the cognito pools
    const {userPool, userPoolClient} = new Cognito(this, 'Cognito');
    // create the apigateway
    const {httpApi} = new ApiGateway(this, 'ApiGateway');
    // create the identity pools
    const {identityPools} = new UserGroups(this, 'UserGroups', {
      amazonCognitoPowerUser,
      userPool,
      userPoolClient,
    });
    // create the environment variables
    const environment = {
      userPoolId: userPool.userPoolId,
      userPoolClientId: userPoolClient.userPoolClientId,
      region: Stack.of(this).region,
      providerName: userPool.userPoolProviderName,
      ...identityPools,
    };
    // create the database
    new Database(this, 'Database');
    // create the product images bucket
    const {productBucket} = new S3(this, 'S3');
    // create the microservice
    new Microservice(this, 'Microservice', {
      httpApi,
      environment,
      awsLambdaBasicExecutionRole,
      amazonCognitoPowerUser,
      amazonDynamoDBFullAccess,
      amazonDynamoDBFullAccessWithSSMFullAccess,
      amazonS3FullAccess,
      productBucket,
      // authorizer,
    });

    // create the CloudWatch dashboard
    new CloudWatchDashboard(this, 'CloudWatchDashboard');

    // cdk exports
    new CfnOutput(this, 'accountId', {value: Stack.of(this).account});
    new CfnOutput(this, 'region', {value: Stack.of(this).region});
    new CfnOutput(this, 'availabilityZones', {
      value: Stack.of(this).availabilityZones.join(', '),
    });
    new CfnOutput(this, 'userPoolId', {value: userPool.userPoolId});
    new CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
    new CfnOutput(this, 'apiUrl', {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      value: httpApi.url!,
    });
  }
}
