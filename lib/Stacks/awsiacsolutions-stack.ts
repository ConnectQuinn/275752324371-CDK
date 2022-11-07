import { 
    Stack, 
    StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { ECRPipeline } from '../constructs/ecr_pipeline';
import { SSLCert } from '../constructs/SSL_cert';
export class awsiacsolutions extends Stack {
constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const app_name = 'awsiacsolutions';
    const owner = 'ConnectQuinn';
    const repo = '275752324371-awsiacsolutions';
    const branch = 'master';
    const oauthToken_name = 'awsiacsolutions';
    const hostedZoneId = 'Z00616852QBX62HWICYXW';
    const zoneName = 'awsiacsolutions.com';

    new ECRPipeline(this,app_name+'-pipeline',{
        app_name,
        owner,
        repo,
        branch,
        oauthToken_name
    })

    new SSLCert(this,app_name+'-cert',{
        app_name,
        hostedZoneId,
        zoneName
    })
}
}
