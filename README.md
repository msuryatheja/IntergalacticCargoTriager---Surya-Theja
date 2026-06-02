# Intergalactic Cargo Triager

Task 1 - Parser

This project is part of the Bread Winner AI evaluation project.

### Objective

Parse the provided cargo manifest file and convert it into a clean JSON array while applying the required business rules.

### Business Rules Implemented

1. If the destination contains "Sector-7", the cargo weight is multiplied by 1.45.
2. The resulting weight is rounded to the nearest whole number.
3. Records with a final weight that is a prime number are excluded from the output.

### Files

* manifest.txt - Input cargo manifest
* parser.py - Parser implementation
* Task 1 - SuryaTheja - Parser.json - Generated JSON output
* README.md - Project documentation

### Output Summary

* Total records processed: 12
* Records removed due to prime weights: 2
* Valid records generated: 10

### Status

Parser completed
Business rules implemented
JSON output generated successfully
Task 1 completed

# Task 2 - API

## Endpoint

GET /api/cargo

Returns cargo data from the JSON file generated in Task 1.
![jason data](<jason data in backend server.png>)

## Command to Test The 418 Override Rule

"curl.exe -i -H "X-System-Override: true" http://localhost:5000/api/cargo"

## Override Rule

If the request contains the header:

X-System-Override: true

The API bypasses the cargo data and returns:

HTTP Status: 418 I'm a Teapot

Response:
System override denied
![Task 2 output](<Task 2 - Screenshot 1 - Surya Theja - 418 I'm a teapot.png>)



