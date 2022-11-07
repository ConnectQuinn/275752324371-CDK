# Pull repo with TO BE DELETED
* `https://ConnectQuinn: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@github.com/ConnectQuinn/275752324371-CDK.git/`
# CDK Repo for all thing in AWS account 275752324371 (Dev)
* Must create a secret called github-token in same region you deploy the pipeline for everything to work
* `aws sso login --profile ssoDev`  Login to Dev env
* `npx cdk deploy --profile ssoDev` Must deploy manually the first time then it will watch this repo


# REF
* https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html