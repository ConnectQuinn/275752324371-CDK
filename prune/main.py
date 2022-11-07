import boto3

ec2_client = boto3.client('ec2')

region_response = ec2_client.describe_regions()
region_list = []
for region in region_response['Regions']:
    region_list.append(region['RegionName'])

stack_map = {}

with open('./stack-list.txt') as fp:
    contents = fp.read().split('- id: ')
    for entry in contents:
        item_list = entry.split('\n')
        for item in item_list:
            if 'name: ' in item:
                if 'aws://' not in item:
                    name = item.split('name: ')[1]
            if 'region: ' in item:
                region_name = item.split('region: ')[1]
                try:
                    stack_map[region_name].append(name)
                except:
                    stack_map[region_name] = []
                    stack_map[region_name].append(name)


for region in region_list:
    print(f'----{region}----')
    drift_list = []
    # session = boto3.session.Session(profile_name='ssoDev',region_name=region)
    # client = session.client('cloudformation')
    client = boto3.client('cloudformation', region_name=region)

    response = client.describe_stacks()

    for stack_item in response['Stacks']:
        stack = stack_item['StackName']
        tags = stack_item['Tags']
        for tag in tags:
            if tag['Value'] == 'MasterPipeline':
                if stack in stack_map[region]:
                    print(f'{stack} match')
                else:
                    try:
                        ParentId = stack_item['ParentId']
                    except:
                        print(f'    {stack} - stack not in source: pruning stack')
                        response = client.delete_stack(
                            StackName=stack,
                        )
                        del_resp = response['ResponseMetadata']['HTTPStatusCode']
                        print(f'        {del_resp}')

    