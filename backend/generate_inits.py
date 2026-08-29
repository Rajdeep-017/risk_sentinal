import os
dirs = [
    "app", "app/db", "app/schemas", "app/risk_engine", "app/ml", "app/ml/models",
    "app/agents", "app/agents/nodes", "app/rag", "app/api", "app/api/v1", "app/api/v1/endpoints"
]
for d in dirs:
    path = os.path.join(r"d:\Razorpay project\backend", d, "__init__.py")
    with open(path, "w") as f:
        f.write("")
print("Created all __init__.py files")
