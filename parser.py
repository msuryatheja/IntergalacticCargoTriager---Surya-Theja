import json

def is_prime(n):
    if n < 2:
        return False
    for i in range(2, n):
        if n % i == 0:
            return False
    return True
data = []
file = open("manifest", "r")
for line in file:
    line = line.strip()
    parts = line.split(" :: ")
    cargo_id = parts[0].split("||")[1].strip()
    details = parts[1].split(" >> ")
    weight = float(details[0])
    destination = details[1]
    if "Sector-7" in destination:
        weight = weight * 1.45
    weight = round(weight)
    if is_prime(weight):
        continue
    record = {
        "cargo_id": cargo_id,
        "weight_in_kg": weight,
        "destination": destination
    }
    data.append(record)

file.close()

json_file = open("Task 1 - Surya Theja - Parser.json", "w")
json.dump(data, json_file, indent=4)
json_file.close()

print("Valid Records:", len(data))