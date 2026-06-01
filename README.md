# Intergalactic Cargo Triager

## Task 1 - Parser

This project is part of the Bread Winner AI evaluation.

### Objective

Parse the provided cargo manifest file and convert it into a clean JSON format while following the specified business rules.

### Business Rules Implemented

* Records containing "Sector-7" in the destination have their weight multiplied by 1.45.
* The resulting weight is rounded to the nearest whole number.
* Records with a final weight that is a prime number are excluded from the output.

### Files

* manifest.txt - Input cargo manifest data
* parser.py - Parser implementation
* Task 1 - Surya Theja - Parser.json - Generated JSON output
* README.md - Project documentation

### Current Status

* Parser logic completed
* Business rules implemented

