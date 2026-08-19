import argparse
from decimal import Decimal


def parse_row(row: str) -> tuple[str, Decimal]:
    reference, amount = row.rsplit(";", 1)
    # The export writes minor units without a separator, and one bank pads them to 12
    # characters. Decimal, not float: this reconciles against the ledger to the cent.
    return reference.strip(), Decimal(amount.strip()) / 100


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--day", required=True)
    args = parser.parse_args()
    print(f"importing {args.day}")


if __name__ == "__main__":
    main()
