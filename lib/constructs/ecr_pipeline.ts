import {
    Stack,
    aws_ecr as ecr,
    aws_codepipeline as codepipeline,
    aws_codebuild as codebuild,
    aws_codepipeline_actions as codepipeline_actions,
    aws_iam as iam,
    SecretValue,
    RemovalPolicy,
} from 'aws-cdk-lib';

import { Construct } from 'constructs';

  export interface InterfaceProps {
    app_name:string,
    owner:string,
    repo:string,
    branch:string,
    oauthToken_name:string
  }

  export class ECRPipeline extends Construct {
    constructor(scope: Construct, id: string, props: InterfaceProps) {
      super(scope, id);

        const {app_name,owner,repo,branch,oauthToken_name} = props

        const container_repo = new ecr.Repository(this,app_name+'-id',{
            repositoryName:app_name,
        })
        container_repo.applyRemovalPolicy(RemovalPolicy.DESTROY)
        const pipeline = new codepipeline.Pipeline(this,app_name+'-ECRpipe',{
            pipelineName:app_name+'-pipeline'
        })

        const source_output = new codepipeline.Artifact()
        const docker_output = new codepipeline.Artifact('Docker')

        const buildspec_docker = codebuild.BuildSpec.fromSourceFilename("buildspec.yml")

        const docker_build = new codebuild.PipelineProject(this,'DockerBuild',{
            environment:{
                buildImage:codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
                privileged:true
            },
            environmentVariables:{
                REPO_ECR:{value:container_repo.repositoryUri}
            },
            buildSpec:buildspec_docker  
        })

        container_repo.grantPullPush(docker_build)
        docker_build.addToRolePolicy(
            new iam.PolicyStatement({
                effect:iam.Effect.ALLOW,
                actions:["ecr:BatchCheckLayerAvailability", "ecr:GetDownloadUrlForLayer", "ecr:BatchGetImage"],
                resources:["arn:"+Stack.of(this).partition+":ecr:"+Stack.of(this).region+":"+Stack.of(this).account+":repository/*"]
            }
        ))

        const source_action = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub_Source',
            owner,
            repo,
            oauthToken: SecretValue.secretsManager(oauthToken_name),
            output: source_output,
            branch
        });

        pipeline.addStage({
            stageName:"Source",
            actions:[source_action]
        })

        pipeline.addStage({
            stageName:"DockerBuild",
            actions:[
                new codepipeline_actions.CodeBuildAction({
                    actionName:'DockerBuildTOECR',
                    project:docker_build,
                    input:source_output,
                    outputs:[docker_output]
                })
            ]
        })

    }
}