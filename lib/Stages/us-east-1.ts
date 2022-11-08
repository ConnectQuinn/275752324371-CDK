import { 
    Stage,
    StageProps
 } from 'aws-cdk-lib';
import { Construct } from "constructs";
import { EKSCluster } from '../Stacks/EKS-stack';
import { awsiacsolutions } from '../Stacks/awsiacsolutions-stack';

export class USeast1 extends Stage {
    
    constructor(scope: Construct, id: string, props?: StageProps) {
      super(scope, id, props);
  
      new EKSCluster(this, 'dev-EKSCluster');
      // new awsiacsolutions(this, 'dev-awsiacsolutions')
    }
}