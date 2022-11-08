import {
    Stack,
    aws_route53 as route53,
    aws_certificatemanager as certificatemanager
} from 'aws-cdk-lib';

import { Construct } from 'constructs';

export interface InterfaceProps {
    app_name:string,
    hostedZoneId:string,
    zoneName:string
}

export class SSLCert extends Construct {
    constructor(scope: Construct, id: string, props: InterfaceProps) {
      super(scope, id);

        const {app_name,hostedZoneId,zoneName} = props

        const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
            this,
            app_name+'-HostedZone',
            {
              hostedZoneId,
              zoneName
            }
        );
        const cert = new certificatemanager.DnsValidatedCertificate(
            this,
            app_name+'-DomainsCertificate',
            {
              domainName: `*.`+zoneName,
              subjectAlternativeNames:[zoneName],
              hostedZone,
              region: Stack.of(this).region
            }
        );

    }
}