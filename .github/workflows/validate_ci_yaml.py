import yaml
import sys
p = '.github/workflows/ci.yml'
try:
    with open(p,'r',encoding='utf-8') as f:
        yaml.safe_load(f)
    print('YAML_PARSE_OK')
except Exception as e:
    print('YAML_ERROR:', e)
    sys.exit(1)
