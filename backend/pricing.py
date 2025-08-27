from decimal import Decimal, ROUND_HALF_UP
CANONICAL_CONDITIONS = ["New", "Good", "Scrap", "As New", "Excellent", "Usable"]
PLATFORM_CONDITION_MAP = {
    "X": {
        "New": "New",
        "Good": "Good",
        "Scrap": "Scrap",
        "As New": "Good",
        "Excellent": "Good",
        "Usable": "Scrap",
    },
    "Y": {
        "New": "3 stars (Excellent)",
        "Good": "2 stars (Good)",
        "Scrap": "1 star (Usable)",
        "As New": "3 stars (Excellent)",
        "Excellent": "3 stars (Excellent)",
        "Usable": "1 star (Usable)",
    },
    "Z": {
        "New": "New",
        "Good": "Good",
        "Scrap": "Good",
        "As New": "As New",
        "Excellent": "As New",
        "Usable": "Good",
    },
}

def round_money(value):
    return float(Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

def calculate_platform_price(base_price, platform):
    base_price = float(base_price)
    if base_price <= 0:
        raise ValueError("Base price must be greater than 0")
    
    if platform == "X":
        fee = 0.10 * base_price
    elif platform == "Y":
        fee = 0.08 * base_price + 2.0
    elif platform == "Z":
        fee = 0.12 * base_price
    else:
        raise ValueError(f"Unknown platform: {platform}")
    
    final = max(0, base_price - fee)
    return round_money(final), round_money(fee)

def map_condition_for_platform(condition, platform):
    if platform not in PLATFORM_CONDITION_MAP:
        return condition
    mapping = PLATFORM_CONDITION_MAP[platform]
    return mapping.get(condition, mapping.get("Good", condition))
