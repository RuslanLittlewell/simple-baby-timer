## Purpose

Ranks the paywall's pricing elements so the amount that will actually be billed is the first thing a reader sees, as the App Store requires of an auto-renewable subscription purchase flow.

## ADDED Requirements

### Requirement: Every plan row shows the amount that will be billed

Each row offering a paid plan SHALL show the total that will be charged for that plan's period, for every plan offered, including plans covering more than one month. This amount SHALL come from the price the store reports for the package, in the store's own currency and formatting. A row that offers no charge at all SHALL show zero in the same place and style.

#### Scenario: A multi-month plan

- **WHEN** the paywall lists a plan covering more than one month
- **THEN** the row shows the total charged for that whole period

#### Scenario: A monthly plan

- **WHEN** the paywall lists a plan covering one month
- **THEN** the row shows that month's charge

#### Scenario: The billed amount is never omitted

- **WHEN** any plan row is displayed
- **THEN** it contains the billed amount
- **AND** no plan row presents a per-month figure as its only price

### Requirement: The billed amount outranks every other pricing element

Within a plan row, the billed amount SHALL be the most prominent pricing element. Every other pricing element in that row — the calculated per-month figure, the saving percentage, and any free-trial wording — SHALL be rendered smaller than the billed amount, in a less emphatic colour, and positioned after it.

#### Scenario: A plan with a per-month comparison

- **WHEN** a row shows both a billed amount and a calculated per-month figure
- **THEN** the billed amount is set in larger and heavier type
- **AND** the per-month figure sits below it in a smaller, secondary style

#### Scenario: A plan carrying a free trial

- **WHEN** a row shows free-trial wording
- **THEN** that wording is subordinate to the billed amount in both size and position

#### Scenario: A discounted plan

- **WHEN** a row carries a saving percentage
- **THEN** the saving is subordinate to the billed amount
