
import sys
import os
sys.path.append(os.path.dirname(__file__))
import json
from ankiBridge import get_anki_bridge


bridge = get_anki_bridge()
result = bridge.get_user_cards_due("default_user", None, 100)


# Output result as JSON
print(json.dumps(result))
