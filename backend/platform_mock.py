from pricing import calculate_platform_price, map_condition_for_platform


def simulate_listing(phone, platform: str):

    base_price = float(phone["base_price"] if isinstance(phone, dict) else phone.base_price)
    condition = phone["condition"] if isinstance(phone, dict) else phone.condition
    tags = (phone.get("tags", "") if isinstance(phone, dict) else (phone.tags or "")) or ""
    tags = tags.lower()

    final_price, fee = calculate_platform_price(base_price, platform)

    label = map_condition_for_platform(condition, platform)

    if platform == "Y" and "usable" in label.lower() and base_price < 20:
        return (
            False,
            "Platform Y rejects very low-priced 'Usable' items",
            final_price,
            fee,
        )

    if final_price < 5.0 and base_price < 50:
        return (
            False,
            f"Fees too high on platform {platform}, margin ${final_price:.2f}",
            final_price,
            fee,
        )

    if "discontinued" in tags:
        return (
            False,
            f"Phone marked discontinued — platform {platform} refused listing",
            final_price,
            fee,
        )

    return (
        True,
        f"Listed on platform {platform} as '{label}' at ${final_price:.2f} (fee ${fee:.2f})",
        final_price,
        fee,
    )
