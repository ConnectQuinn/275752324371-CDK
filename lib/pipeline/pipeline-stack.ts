import {
  Stack,
  StackProps,
  Tags,
  aws_iam as iam
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep,CodeBuildStep } from 'aws-cdk-lib/pipelines';

import { USeast1 } from '../Stages/us-east-1';

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipelineName = 'MasterPipeline';
    const repo = 'ConnectQuinn/275752324371-CDK';
    const branch = 'main';
    const prune = true;

    const role = new iam.Role(this, 'bootstrap-role', {
      assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
      description: 'CDK Deployment Role',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
      ],
    });
    role.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('codebuild.amazonaws.com')],
      }),
    );
    
    const source = CodePipelineSource.gitHub(repo,branch)

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName,
      synth: new ShellStep('Synth', {
        input: source,
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });
    // No Dependencies Wave
    const WaveOne = pipeline.addWave('WaveOne')

    // US-EAST-1 Deployment
    const USEast1_stage = new USeast1(this, "us-east-1", {
      env: { region: "us-east-1" },
    })
    Tags.of(USEast1_stage).add('pipeline', pipelineName);
    WaveOne.addStage(USEast1_stage);


    //Pruning of ENV
    if(prune){
      const PruneWave = pipeline.addWave('PruneWave')
      const PruneStep = new CodeBuildStep('prune', {
        input: source,
        role,
        commands: [
          'npm ci',
          'npx aws-cdk list --long > prune/stack-list.txt',
          'cd prune',
          'python3 main.py'
        ],
      })
      PruneWave.addPost(PruneStep);
    }
  }
}
