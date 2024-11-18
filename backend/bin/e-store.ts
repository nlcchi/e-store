#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { EStoreStack } from '../lib/e-store-stack';

const app = new cdk.App();

// Deploy to Singapore region
new EStoreStack(app, 'EStoreStack-SG', {
  env: { 
    region: 'ap-southeast-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  description: 'E-Store infrastructure stack deployed in Singapore region',
  tags: {
    Environment: 'production',
    Region: 'ap-southeast-1',
    Project: 'e-store',
  },
});