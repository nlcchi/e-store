import { Construct } from 'constructs';
import { 
  Dashboard, 
  GraphWidget, 
  Metric, 
  TextWidget, 
  SingleValueWidget,
  LogQueryWidget,
  Row,
  Column
} from 'aws-cdk-lib/aws-cloudwatch';
import { Duration } from 'aws-cdk-lib';

export class CloudWatchDashboard extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create the dashboard
    const dashboard = new Dashboard(this, 'EStoreDashboard', {
      dashboardName: `E-Store-Dashboard-${scope.node.tryGetContext('region') || 'ap-southeast-1'}`
    });

    // API Gateway Metrics
    const apiGatewayWidget = new GraphWidget({
      title: 'API Gateway',
      left: [
        new Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          statistic: 'Sum',
          period: Duration.minutes(1)
        }),
        new Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          statistic: 'Sum',
          period: Duration.minutes(1)
        }),
        new Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          statistic: 'Sum',
          period: Duration.minutes(1)
        })
      ]
    });

    // Lambda Function Metrics
    const lambdaWidget = new GraphWidget({
      title: 'Lambda Functions',
      left: [
        new Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Invocations',
          statistic: 'Sum',
          period: Duration.minutes(1)
        }),
        new Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          statistic: 'Sum',
          period: Duration.minutes(1)
        }),
        new Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Duration',
          statistic: 'Average',
          period: Duration.minutes(1)
        })
      ]
    });

    // DynamoDB Metrics
    const dynamoDBWidget = new GraphWidget({
      title: 'DynamoDB',
      left: [
        new Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedReadCapacityUnits',
          statistic: 'Sum',
          period: Duration.minutes(1)
        }),
        new Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedWriteCapacityUnits',
          statistic: 'Sum',
          period: Duration.minutes(1)
        }),
        new Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ThrottledRequests',
          statistic: 'Sum',
          period: Duration.minutes(1)
        })
      ]
    });

    // Cognito Metrics
    const cognitoWidget = new GraphWidget({
      title: 'Cognito',
      left: [
        new Metric({
          namespace: 'AWS/Cognito',
          metricName: 'SignUpSuccesses',
          statistic: 'Sum',
          period: Duration.minutes(5)
        }),
        new Metric({
          namespace: 'AWS/Cognito',
          metricName: 'SignInSuccesses',
          statistic: 'Sum',
          period: Duration.minutes(5)
        })
      ]
    });

    // S3 Bucket Metrics
    const s3Widget = new GraphWidget({
      title: 'S3 Bucket',
      left: [
        new Metric({
          namespace: 'AWS/S3',
          metricName: 'NumberOfObjects',
          statistic: 'Average',
          period: Duration.hours(1)
        }),
        new Metric({
          namespace: 'AWS/S3',
          metricName: 'BucketSizeBytes',
          statistic: 'Average',
          period: Duration.hours(1)
        })
      ]
    });

    // Order Processing Metrics
    const orderProcessingWidget = new LogQueryWidget({
      title: 'Order Processing',
      logGroupNames: ['/aws/lambda/orderCreate', '/aws/lambda/paymentCheckout'],
      queryLines: [
        'fields @timestamp, @message',
        'filter @message like /order/i',
        'stats count(*) as orderCount group by status',
        'sort orderCount desc'
      ],
      width: 24,
      height: 6
    });

    // Error Monitoring Widget
    const errorMonitoringWidget = new LogQueryWidget({
      title: 'Error Monitoring',
      logGroupNames: [
        '/aws/lambda/orderCreate',
        '/aws/lambda/paymentCheckout',
        '/aws/apigateway/e-store-api',
        '/aws/lambda/productService'
      ],
      queryLines: [
        'fields @timestamp, @message',
        'filter @message like /(?i)(error|exception)/',
        'sort @timestamp desc',
        'limit 20'
      ],
      width: 24,
      height: 6
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new TextWidget({
        markdown: '# E-Store Monitoring Dashboard\nReal-time metrics for the e-store application',
        width: 24,
        height: 2
      }),
      new Row(
        new Column(apiGatewayWidget, lambdaWidget),
        new Column(dynamoDBWidget, cognitoWidget),
        new Column(s3Widget)
      ),
      orderProcessingWidget,
      errorMonitoringWidget
    );
  }
}
