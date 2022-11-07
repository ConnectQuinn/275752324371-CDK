import { 
    Stack, 
    StackProps,
    aws_ec2 as ec2,
    aws_eks as eks,
    aws_iam as iam,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class EKSCluster extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        
        const lifecylce = 'dev'
        
        const vpc = new ec2.Vpc(this, lifecylce+"-EKS-VPC");
        const cluster = new eks.Cluster(this, lifecylce+"-Cluster", { 
            vpc: vpc,
            defaultCapacity: 0,
            version: eks.KubernetesVersion.V1_21,
            
        });

        const ng = cluster.addNodegroupCapacity(lifecylce+"-nodegroup", {
            instanceTypes: [
                new ec2.InstanceType("t3.medium")
            ],
            minSize: 1,
            maxSize: 3,
        });

        cluster.addManifest('dns-namespace', {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: { name: 'external-dns' },
        });

        //external-dns service account and role
        const ExternalDNSSA = cluster.addServiceAccount('external-dns',{name:"external-dns"})
        const ExternalDNSPolicy = new iam.Policy(this,'servicvepolicy',{
            statements: [
                new iam.PolicyStatement({
                actions: ["route53:ChangeResourceRecordSets"],
                resources: ["arn:aws:route53:::hostedzone/*"],

                }),
                new iam.PolicyStatement({
                actions: [
                    "route53:ListHostedZones",
                    "route53:ListResourceRecordSets"
                ],
                resources: ["*"],

                }),
            ],
        });
        ExternalDNSSA.role.attachInlinePolicy(ExternalDNSPolicy)
        
        //aws-load-balancer-controller service account and role 
        const ALBControlerSA = cluster.addServiceAccount('aws-load-balancer-controller-sa',{
            name:"aws-load-balancer-controller",
            namespace:"kube-system"
        });
        const ALBPolicy = new iam.Policy(this,'ALBservicvepolicy',{
            statements: [
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "iam:CreateServiceLinkedRole",
                    "ec2:DescribeAccountAttributes",
                    "ec2:DescribeAddresses",
                    "ec2:DescribeAvailabilityZones",
                    "ec2:DescribeInternetGateways",
                    "ec2:DescribeVpcs",
                    "ec2:DescribeSubnets",
                    "ec2:DescribeSecurityGroups",
                    "ec2:DescribeInstances",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DescribeTags",
                    "ec2:GetCoipPoolUsage",
                    "ec2:DescribeCoipPools",
                    "elasticloadbalancing:DescribeLoadBalancers",
                    "elasticloadbalancing:DescribeLoadBalancerAttributes",
                    "elasticloadbalancing:DescribeListeners",
                    "elasticloadbalancing:DescribeListenerCertificates",
                    "elasticloadbalancing:DescribeSSLPolicies",
                    "elasticloadbalancing:DescribeRules",
                    "elasticloadbalancing:DescribeTargetGroups",
                    "elasticloadbalancing:DescribeTargetGroupAttributes",
                    "elasticloadbalancing:DescribeTargetHealth",
                    "elasticloadbalancing:DescribeTags"
                ],
                resources: ["*"],
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "cognito-idp:DescribeUserPoolClient",
                    "acm:ListCertificates",
                    "acm:DescribeCertificate",
                    "iam:ListServerCertificates",
                    "iam:GetServerCertificate",
                    "waf-regional:GetWebACL",
                    "waf-regional:GetWebACLForResource",
                    "waf-regional:AssociateWebACL",
                    "waf-regional:DisassociateWebACL",
                    "wafv2:GetWebACL",
                    "wafv2:GetWebACLForResource",
                    "wafv2:AssociateWebACL",
                    "wafv2:DisassociateWebACL",
                    "shield:GetSubscriptionState",
                    "shield:DescribeProtection",
                    "shield:CreateProtection",
                    "shield:DeleteProtection"
                ],
                resources: ["*"],
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupIngress"
                ],
                resources: ["*"],
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "ec2:CreateSecurityGroup"
                ],
                resources: ["*"],
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "ec2:CreateTags"
                ],
                resources: ["arn:aws:ec2:*:*:security-group/*"],
                conditions:{
                    "StringEquals": {
                        "ec2:CreateAction": "CreateSecurityGroup"
                    },
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "ec2:CreateTags",
                    "ec2:DeleteTags"
                ],
                resources: ["arn:aws:ec2:*:*:security-group/*"],
                conditions: {
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "true",
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupIngress",
                    "ec2:DeleteSecurityGroup"
                ],
                resources: ["*"],
                conditions:{
                    "Null": {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "elasticloadbalancing:CreateLoadBalancer",
                    "elasticloadbalancing:CreateTargetGroup"
                ],
                resources: ["*"],
                conditions: {
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "elasticloadbalancing:CreateListener",
                    "elasticloadbalancing:DeleteListener",
                    "elasticloadbalancing:CreateRule",
                    "elasticloadbalancing:DeleteRule"
                ],
                resources: ["*"],
            }),

            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:RemoveTags"
                ],
                resources: [
                    "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
                    "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
                    "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"
                ],
                conditions: {
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "true",
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            }),

            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:RemoveTags"
                ],
                resources: [
                    "arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*",
                    "arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*",
                    "arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*",
                    "arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*"
                ],
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "elasticloadbalancing:ModifyLoadBalancerAttributes",
                    "elasticloadbalancing:SetIpAddressType",
                    "elasticloadbalancing:SetSecurityGroups",
                    "elasticloadbalancing:SetSubnets",
                    "elasticloadbalancing:DeleteLoadBalancer",
                    "elasticloadbalancing:ModifyTargetGroup",
                    "elasticloadbalancing:ModifyTargetGroupAttributes",
                    "elasticloadbalancing:DeleteTargetGroup"
                ],
                resources: ["*"],
                conditions: {
                    "Null": {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "elasticloadbalancing:RegisterTargets",
                    "elasticloadbalancing:DeregisterTargets"
                ],
                resources: ["arn:aws:elasticloadbalancing:*:*:targetgroup/*/*"],
                conditions: {
                    "Null": {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "elasticloadbalancing:SetWebAcl",
                    "elasticloadbalancing:ModifyListener",
                    "elasticloadbalancing:AddListenerCertificates",
                    "elasticloadbalancing:RemoveListenerCertificates",
                    "elasticloadbalancing:ModifyRule"
                ],
                resources: ["*"],
            })
        ],
        });
        ALBControlerSA.role.attachInlinePolicy(ALBPolicy)



        cluster.addManifest(lifecylce+'-namespace', {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: { name: lifecylce },
        });

        const SSORole = iam.Role.fromRoleArn(this,"quinn-role",
        "arn:aws:iam::275752324371:role/AWSReservedSSO_AdministratorAccess_b40f1ae951a61a02"
        )

        cluster.awsAuth.addRoleMapping(SSORole,{ groups: [ 'system:masters' ]})

    }
}
