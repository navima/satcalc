import sys
import json

###################################################
### Extract recipes from Satisfactory Docs.json ###
###################################################

def extractClassName(name):
    return name.split('/')[-1]


def extract2(name: str):
    return name.replace("Build_", "").split('.')[-1].replace("Desc_", "").replace("BP_", "").replace("FG", "").replace('"', '').replace("'", '').replace("Mk1", "").replace("_C", "")


def filterMachine(name: str):
    return name not in ['', 'WorkshopComponent', 'WorkBenchComponent', "BuildableAutomatedWorkBench", "AutomatedWorkBench", "BuildGun", "Converter"]


def parseMachineList(name: str):
    return list(map(pascalCaseToCamelCase, filter(filterMachine,  map(extract2, map(extractClassName, name[1:-1].split(','))))))


def parseItemRateList(name: str, manufacturingDuration: float):
    return list(map(lambda item: parseItemRate(item, manufacturingDuration), map(removeFirstOrLastParentheses, name[1:-1].split('),('))))


def removeFirstOrLastParentheses(name: str):
    if name[0] == '(':
        name = name[1:]
    if name[-1] == ')':
        name = name[:-1]
    return name


def parseItemRate(name: str, manufacturingDuration: float):
    name, rate = name.split(',')
    return {
        'name': pascalCaseToCamelCase(extract2(extractClassName(name))),
        'rate': 60/manufacturingDuration*int(rate[7:])
    }


def displayNameToCamelCase(name: str):
    cleanName = name.replace('Alternate: ', '').lower()
    parts = cleanName.split(' ')
    return parts[0] + ''.join(map(lambda x: x.capitalize(), parts[1:]))


def pascalCaseToCamelCase(name: str):
    return name[0].lower() + name[1:]


data_str = sys.stdin.buffer.read()
if data_str.startswith(b'\xef\xbb\xbf'):
    data_str = memoryview(data_str)[3:].tobytes()
data = json.loads(data_str.decode('utf-8'))

allmachines = set()
output = {}
for elem in data[10]['Classes']:
    machines = parseMachineList(elem['mProducedIn'])
    if len(machines) == 0:
        continue
    for machine in machines:
        allmachines.add(machine)
    name = displayNameToCamelCase(elem['mDisplayName'])
    recipe = {}
    recipe['name'] = elem['mDisplayName']
    recipe['machine'] = machines
    recipe['alt'] = 'Alternate' in elem['mDisplayName']
    manufDuration = float(elem['mManufactoringDuration'])
    recipe['input'] = parseItemRateList(elem['mIngredients'], manufDuration)
    recipe['output'] = parseItemRateList(elem['mProduct'], manufDuration)
    output[name] = recipe
json.dump(output, sys.stdout, indent=2)
